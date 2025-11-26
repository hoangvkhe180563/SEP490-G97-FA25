using Microsoft.Extensions.Configuration;
using Nest;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Domain.Entities.ElasticSearch;
using StudyHub.Backend.Infrastructure.Data;
using StudyHub.Backend.UseCases.Dtos;
using StudyHub.Backend.UseCases.Repositories;
using static Grpc.Core.Metadata;

namespace StudyHub.Backend.Infrastructure.Repositories
{
    public class ElasticSearchDocumentRepository : IElasticSearchDocument
    {
        private readonly ElasticClient _client;
        private readonly IConfiguration _configuration;
        private const string INDEX_NAME_DOCS = "documents";

        public ElasticSearchDocumentRepository(IConfiguration configuration)
        {
            _configuration = configuration;
            var settings = new ConnectionSettings(new Uri(_configuration["ElasticSearch:Uri"] ?? "http://localhost:9200"))
                .DefaultIndex(INDEX_NAME_DOCS);
            _client = new ElasticClient(settings);
        }
        public async Task<bool> CreateDocumentIndexAsync()
        {
            var indexExists = await _client.Indices.ExistsAsync(INDEX_NAME_DOCS);

            if (indexExists.Exists)
            {
                await _client.Indices.DeleteAsync(INDEX_NAME_DOCS);
            }

            var createIndexResponse = await _client.Indices.CreateAsync(INDEX_NAME_DOCS, c => c
                .Map<ElasticDocument>(m => m
                    .Properties(p => p
                        .Number(n => n.Name(f => f.Id))
                        .Text(t => t.Name(f => f.Name))
                        .Text(t => t.Name(f => f.Description))
                        .Text(t => t.Name(f => f.DocumentCategoryDescription))
                        .Text(k => k.Name(f => f.DocumentUrl))
                        .Text(k => k.Name(f => f.Thumbnail))
                        .Number(n => n.Name(f => f.SchoolId))
                        .Keyword(k => k.Name(f => f.SubjectName))
                        .Keyword(k => k.Name(f => f.DocumentLengthType))
                        .Keyword(k => k.Name(f => f.DocumentLevel))
                        .Keyword(k => k.Name(f => f.DocumentCategoryName))
                        .Number(n => n.Name(f => f.Grade))
                        .Boolean(b => b.Name(f => f.IsInClass))
                        .Boolean(b => b.Name(f => f.Status))
                        .Date(b => b.Name(f => f.CreatedAt))
                        .Date(b => b.Name(f => f.UpdatedAt))
                        .DenseVector(d => d.Name(f => f.DocumentVector).Dimensions(1024))
                        .Text(t => t.Name(f => f.SearchableText))
                    )
                )
            );

            return createIndexResponse.IsValid;
        }

        public async Task<bool> DeleteDocumentByIdAsync(int id)
        {
            try
            {
                var response = await _client.DeleteAsync(new DeleteRequest(INDEX_NAME_DOCS, id.ToString()));
                return response.IsValid;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> IndexDocumentAsync(Domain.Entities.Document doc, string text, float[] vector)
        {
            var document = new ElasticDocument
            {
                Id = doc.Id,
                Name = doc.Name,
                Description = doc.Description,
                DocumentUrl = doc.DocumentUrl,
                Thumbnail = doc.Thumbnail,
                SchoolId = doc.SchoolId,
                SubjectName = doc.Subject?.Name ?? "",
                DocumentLengthType = doc.DocumentLengthType,
                DocumentLevel = doc.DocumentLevel,
                DocumentCategoryName = doc.DocumentCategory?.Name ?? "",
                DocumentCategoryDescription = doc.DocumentCategory?.Description ?? "",
                Grade = doc.Grade,
                IsInClass = doc.IsInClass,
                Status = doc.Status,
                CreatedAt = doc.CreatedAt,
                UpdatedAt = doc.UpdatedAt,
                DocumentVector = vector,
                SearchableText = text
            };

            var response = await _client.IndexAsync(document, i => i.Index(INDEX_NAME_DOCS));
            return response.IsValid;
        }

        public async Task<bool> UpdateDocumentStatusAsync(int id, bool status)
        {
            var response = await _client.UpdateAsync<ElasticDocument>(id, u => u
                .Index(INDEX_NAME_DOCS)
                .Script(s => s
                    .Source("ctx._source.status = params.status")
                    .Params(p => p.Add("status", status))
                )
            );
            return response.IsValid;
        }

        public async Task<bool> UpdateDocumentIsInClassAsync(int id, bool status)
        {
            var response = await _client.UpdateAsync<ElasticDocument>(id, u => u
                .Index(INDEX_NAME_DOCS)
                .Script(s => s
                    .Source("ctx._source.isInClass = params.isInClass")
                    .Params(p => p.Add("isInClass", status))
                )
            );
            return response.IsValid;
        }

        public async Task<bool> UpdateDocumentUpdatedAtAsync(int id, DateTime updatedAt)
        {
            var response = await _client.UpdateAsync<ElasticDocument>(id, u => u
                .Index(INDEX_NAME_DOCS)
                .Script(s => s
                    .Source("ctx._source.updatedAt = params.updatedAt")
                    .Params(p => p.Add("updatedAt", updatedAt))
                )
            );
            return response.IsValid;
        }
        public async Task<bool> IndexDocumentsBatchAsync(List<Domain.Entities.Document> docs, List<string> texts, float[][] vectors)
        {
            for (int i = 0; i < docs.Count; i++)
            {
                var d = docs[i];
                var document = new ElasticDocument
                {
                    Id = d.Id,
                    Name = d.Name,
                    Description = d.Description,
                    DocumentUrl = d.DocumentUrl,
                    Thumbnail = d.Thumbnail,
                    SchoolId = d.SchoolId,
                    SubjectName = d.Subject?.Name ?? string.Empty,
                    DocumentCategoryName = d.DocumentCategory?.Name ?? string.Empty,
                    DocumentCategoryDescription = d.DocumentCategory?.Description ?? string.Empty,
                    DocumentLengthType = d.DocumentLengthType,
                    DocumentLevel = d.DocumentLevel,
                    Grade = d.Grade,
                    IsInClass = d.IsInClass,
                    Status = d.Status ?? false,
                    CreatedAt = d.CreatedAt,
                    UpdatedAt = d.UpdatedAt,
                    DocumentVector = vectors[i],
                    SearchableText = texts[i]
                };

                await _client.IndexDocumentAsync(document);
            }

            await _client.Indices.RefreshAsync(INDEX_NAME_DOCS);
            return true;
        }
        public async Task<List<ElasticDocument>> RecommendDocumentsAsync(
            List<Func<QueryContainerDescriptor<ElasticDocument>, QueryContainer>> filters,
            List<Func<QueryContainerDescriptor<ElasticDocument>, QueryContainer>> shouldQueries,
            float[] userVector,
            int topK = 30)
        {
            var searchResponse = await _client.SearchAsync<ElasticDocument>(s => s
                .Index(INDEX_NAME_DOCS)
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
                                double sim = (cosineSimilarity(params.queryVector, 'documentVector') + 1.0) / 2.0;
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
        public async Task<ISearchResponse<ElasticDocument>> SearchDocumentWithLLMProfileAsync(float[] denseVector,
            UserPreferenceProfile profile,
            List<Func<QueryContainerDescriptor<ElasticDocument>, QueryContainer>> filters,
            string targetDifficulty,
            string targetLength,
            int topK = 30)
        {
            var searchResponse = await _client.SearchAsync<ElasticDocument>(s => s
                .Index(INDEX_NAME_DOCS)
                .Size(topK * 2)
                .Query(q => q.ScriptScore(ss => ss
                    .Query(query => query
                            .Bool(b => b
                                // MUST: Filter by subjects
                                .Filter(filters.ToArray())
                                // SHOULD: BM25 cho topicKeywords trên Title + Description
                                .Should(
                                    // BM25 trên Name (Title)
                                    sh => sh.Match(m => m
                                        .Field(fd => fd.Name)
                                        .Query(string.Join(" ", profile.TopicKeywords))
                                        .Boost(3.0)
                                    ),
                                    // BM25 trên Information (Description)
                                    sh => sh.Match(m => m
                                        .Field(fd => fd.Description)
                                        .Query(string.Join(" ", profile.TopicKeywords))
                                        .Boost(2.0)
                                    ),
                                    // Match difficulty
                                    sh => sh.Term(t => t
                                        .Field(fd => fd.DocumentLevel)
                                        .Value(targetDifficulty)
                                        .Boost(1.5)
                                    ),
                                    // Match length
                                    sh => sh.Term(t => t
                                        .Field(fd => fd.DocumentLengthType)
                                        .Value(targetLength)
                                        .Boost(1.2)
                                    ),
                                    // Match grade (±1)
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
                        double vec = cosineSimilarity(params.queryVector, 'documentVector');
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
