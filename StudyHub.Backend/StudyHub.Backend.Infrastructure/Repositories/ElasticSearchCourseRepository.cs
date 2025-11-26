using Microsoft.Extensions.Configuration;
using Nest;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Domain.Entities.ElasticSearch;
using StudyHub.Backend.Infrastructure.Data;
using StudyHub.Backend.UseCases.Dtos;
using StudyHub.Backend.UseCases.Repositories;

namespace StudyHub.Backend.Infrastructure.Repositories
{
    public class ElasticSearchCourseRepository : IElasticSearchCourse
    {
        private readonly ElasticClient _client;
        private readonly IConfiguration _configuration;
        private const string INDEX_NAME_COURSES = "courses";

        public ElasticSearchCourseRepository(IConfiguration configuration)
        {
            _configuration = configuration;
            var settings = new ConnectionSettings(new Uri(_configuration["ElasticSearch:Uri"] ?? "http://localhost:9200"))
                .DefaultIndex(INDEX_NAME_COURSES);
            _client = new ElasticClient(settings);
        }

        public async Task<bool> CreateCourseIndexAsync()
        {
            var indexExists = await _client.Indices.ExistsAsync(INDEX_NAME_COURSES);

            if (indexExists.Exists)
            {
                await _client.Indices.DeleteAsync(INDEX_NAME_COURSES);
            }

            var createIndexResponse = await _client.Indices.CreateAsync(INDEX_NAME_COURSES, c => c
                .Map<ElasticCourse>(m => m
                    .Properties(p => p
                        .Number(n => n.Name(f => f.Id))
                        .Text(t => t.Name(f => f.Name))
                        .Text(t => t.Name(f => f.ImageUrl))
                        .Number(n => n.Name(f => f.Price))
                        .Date(t => t.Name(f => f.StartAt))
                        .Date(t => t.Name(f => f.EndAt))
                        .Date(t => t.Name(f => f.CreatedAt))
                        .Date(t => t.Name(f => f.UpdatedAt))
                        .Text(t => t.Name(f => f.CreatedById))
                        .Text(t => t.Name(f => f.Information))
                        .Keyword(k => k.Name(f => f.Status))
                        .Number(n => n.Name(f => f.SchoolId))
                        .Keyword(k => k.Name(f => f.SubjectName))
                        .Keyword(k => k.Name(f => f.Difficulty))
                        .Keyword(k => k.Name(f => f.Length))
                        .Number(n => n.Name(f => f.Grade))
                        .DenseVector(d => d.Name(f => f.CourseVector).Dimensions(1024))
                        .Text(t => t.Name(f => f.SearchableText))
                    )
                )
            );

            return createIndexResponse.IsValid;
        }

        public async Task<bool> DeleteCourseByIdAsync(int id)
        {
            try
            {
                var response = await _client.DeleteAsync(new DeleteRequest(INDEX_NAME_COURSES, id.ToString()));
                return response.IsValid;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> IndexCourseAsync(Domain.Entities.Course course, string searchableText, float[] vector)
        {
            if (course == null) return false;

            var document = new ElasticCourse
            {
                Id = course.Id,
                Name = course.Name,
                ImageUrl = course.ImageUrl ?? "",
                Price = course.Price,
                StartAt = course.StartAt,
                EndAt = course.EndAt,
                CreatedAt = course.CreatedAt,
                UpdatedAt = course.UpdatedAt,
                CreatedById = course.CreatedBy,
                Information = course.Information ?? "",
                Status = course.Status,
                SchoolId = course?.SchoolId ?? null,
                SubjectName = course?.Subject?.Name ?? string.Empty,
                Difficulty = course?.Difficulty.ToString() ?? string.Empty,
                Length = course?.Length.ToString() ?? string.Empty,
                Grade = course?.Grade ?? 0,
                CourseVector = vector,
                SearchableText = searchableText
            };

            var response = await _client.IndexAsync(document, i => i.Index(INDEX_NAME_COURSES));
            return response.IsValid;
        }
        public async Task<bool> IndexCoursesBatchAsync(List<Domain.Entities.Course> courses, List<string> texts, float[][] vectors)
        {

            for (int i = 0; i < courses.Count; i++)
            {
                var c = courses[i];
                var document = new ElasticCourse
                {
                    Id = c.Id,
                    Name = c.Name,
                    ImageUrl = c.ImageUrl ?? "",
                    Price = c.Price,
                    StartAt = c.StartAt,
                    EndAt = c.EndAt,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt,
                    CreatedById = c.CreatedBy,
                    Information = c.Information ?? "",
                    Status = c.Status,
                    SchoolId = c?.SchoolId ?? null,
                    SubjectName = c?.Subject?.Name ?? string.Empty,
                    Difficulty = c?.Difficulty.ToString() ?? string.Empty,
                    Length = c?.Length.ToString() ?? string.Empty,
                    Grade = c?.Grade ?? 0,
                    CourseVector = vectors[i],
                    SearchableText = texts[i]
                };
                await _client.IndexDocumentAsync(document);
            }

            await _client.Indices.RefreshAsync(INDEX_NAME_COURSES);
            return true;
        }
        public async Task<bool> UpdateCourseStatusAsync(int id, string status)
        {
            var response = await _client.UpdateAsync<ElasticCourse>(id, u => u
                .Index(INDEX_NAME_COURSES)
                .Script(s => s
                    .Source("ctx._source.status = params.status")
                    .Params(p => p.Add("status", status))
                )
            );
            return response.IsValid;
        }

        public async Task<List<ElasticCourse>> RecommendCoursesAsync(
            List<Func<QueryContainerDescriptor<ElasticCourse>, QueryContainer>> filters,
            List<Func<QueryContainerDescriptor<ElasticCourse>, QueryContainer>> shouldQueries,
            float[] userVector,
            int topK = 30)
        {
            var searchResponse = await _client.SearchAsync<ElasticCourse>(s => s
                .Index(INDEX_NAME_COURSES)
                .Size(topK)
                .Sort(st => st.Descending("_score"))
                .Query(q => q
                    .ScriptScore(ss => ss
                        .Query(query => query
                            .Bool(b => b
                                .Filter(filters.ToArray())
                                .Should(shouldQueries.ToArray())
                                .MinimumShouldMatch(1)
                            )
                        )
                        .Script(sc => sc
                            .Source($@"
                                double sim = (cosineSimilarity(params.queryVector, 'courseVector') + 1.0) / 2.0;
                                return (sim * params.embeddingWeight)
                                     + (_score * params.preferenceWeight);
                            ")
                            .Params(p => p
                                .Add("queryVector", userVector)
                                .Add("embeddingWeight", 0.3)
                                .Add("preferenceWeight", 0.7)
                            )
                        )
                    )
                )
            );

            return searchResponse.Documents.ToList();
        }

        public async Task<ISearchResponse<ElasticCourse>> SearchCourseWithLLMProfileAsync(float[] denseVector,
            UserPreferenceProfile profile,
            List<Func<QueryContainerDescriptor<ElasticCourse>, QueryContainer>> filters,
            string targetDifficulty,
            string targetLength,
            int topK = 30)
        {
            var searchResponse = await _client.SearchAsync<ElasticCourse>(s => s
                .Index(INDEX_NAME_COURSES)
                .Size(topK * 2)
                .Query(q => q.ScriptScore(ss => ss
                    .Query(query => query
                        .Bool(b => b
                            .Filter(filters.ToArray())
                            .Should(
                                sh => sh.Match(m => m
                                    .Field(fd => fd.Name)
                                    .Query(string.Join(" ", profile.TopicKeywords))
                                    .Boost(3.0)
                                ),
                                sh => sh.Match(m => m
                                    .Field(fd => fd.Information)
                                    .Query(string.Join(" ", profile.TopicKeywords))
                                    .Boost(2.0)
                                ),
                                sh => sh.Term(t => t
                                    .Field(fd => fd.Difficulty)
                                    .Value(targetDifficulty)
                                    .Boost(1.5)
                                ),
                                sh => sh.Term(t => t
                                    .Field(fd => fd.Length)
                                    .Value(targetLength)
                                    .Boost(1.2)
                                ),
                                sh => sh.Range(r => r
                                    .Field(fd => fd.Grade)
                                    .GreaterThanOrEquals(profile.Grade - 1)
                                    .LessThanOrEquals(profile.Grade + 1)
                                    .Boost(1.0)
                                )
                            )
                            .MinimumShouldMatch(1)
                        )
                    )
                    .Script(sc => sc.Source(@"
                        double vec = cosineSimilarity(params.queryVector, 'courseVector');
                        double vectorScore = Math.max(0.0, (vec + 1.0) / 2.0);
                        double bm25 = _score;
                        double bm25Norm = bm25 > 0 ? Math.log(1 + bm25) / 5.0 : 0.0;
                        return (params.denseWeight * vectorScore) + (params.spareWeight * bm25Norm);
                    ")
                    .Params(p => p.Add("queryVector", denseVector).Add("denseWeight", 0.7).Add("spareWeight", 0.3))
                ))
            ));

            return searchResponse;
        }
    }
}
