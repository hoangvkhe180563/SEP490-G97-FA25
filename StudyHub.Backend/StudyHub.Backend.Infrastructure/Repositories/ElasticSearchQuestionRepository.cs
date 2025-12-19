using Microsoft.Extensions.Configuration;
using Nest;
using StudyHub.Backend.Domain.Entities.ElasticSearch;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.Domain.Entities.Exam;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace StudyHub.Backend.Infrastructure.Repositories
{
    public class ElasticSearchQuestionRepository : IElasticSearchQuestion
    {
        private readonly ElasticClient _client;
        private readonly IConfiguration _configuration;
        private const string INDEX_NAME_QUESTIONS = "questions";

        public ElasticSearchQuestionRepository(IConfiguration configuration)
        {
            _configuration = configuration;
            var settings = new ConnectionSettings(new System.Uri(_configuration["ElasticSearch:Uri"] ?? "http://localhost:9200"))
                .DefaultIndex(INDEX_NAME_QUESTIONS);
            _client = new ElasticClient(settings);
        }

        public async Task<bool> CreateQuestionIndexAsync()
        {
            var indexExists = await _client.Indices.ExistsAsync(INDEX_NAME_QUESTIONS);

            if (indexExists.Exists)
            {
                await _client.Indices.DeleteAsync(INDEX_NAME_QUESTIONS);
            }

            var createIndexResponse = await _client.Indices.CreateAsync(INDEX_NAME_QUESTIONS, c => c
                .Map<ElasticQuestion>(m => m
                    .Properties(p => p
                        .Keyword(k => k.Name(n => n.Id))
                        .Text(t => t.Name(n => n.QuestionText))
                        .Text(t => t.Name(n => n.CorrectAnswer))
                        .Text(t => t.Name(n => n.SearchableText))
                        .Number(nu => nu.Name(n => n.Grade))
                        .Number(nu => nu.Name(n => n.SubjectId))
                        .Keyword(k => k.Name(n => n.SearchableQuality))
                        .DenseVector(d => d.Name(n => n.QuestionVector).Dimensions(1024))
                    )
                )
            );

            return createIndexResponse.IsValid;
        }

        public async Task<bool> DeleteQuestionByIdAsync(string id)
        {
            try
            {
                var response = await _client.DeleteAsync(new DeleteRequest(INDEX_NAME_QUESTIONS, id));
                return response.IsValid;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> IndexQuestionAsync(string id, ElasticQuestion question)
        {
            if (question == null) return false;

            var response = await _client.IndexAsync(question, i => i.Index(INDEX_NAME_QUESTIONS).Id(id));
            return response.IsValid;
        }

        public async Task<bool> IndexQuestionsBatchAsync(List<Domain.Entities.Exam.Question> questions, List<string> texts, List<string> correctAnswers, List<string> qualities, float[][] vectors)
        {
            for (int i = 0; i < questions.Count; i++)
            {
                var q = questions[i];
                var el = new ElasticQuestion
                {
                    Id = q.Id,
                    QuestionText = q.QuestionText,
                    CorrectAnswer = correctAnswers != null && correctAnswers.Count > i ? correctAnswers[i] : string.Empty,
                    Grade = q.Grade,
                    SubjectId = q.SubjectId,
                    QuestionVector = vectors.Length > i ? vectors[i] : Array.Empty<float>(),
                    SearchableText = texts.Count > i ? texts[i] : string.Empty,
                    SearchableQuality = qualities != null && qualities.Count > i ? qualities[i] : string.Empty
                };
                await _client.IndexDocumentAsync(el);
            }

            await _client.Indices.RefreshAsync(INDEX_NAME_QUESTIONS);
            return true;
        }

        public async Task<List<StudyHub.Backend.UseCases.Dtos.ExampleQuestionDto>> SearchByVectorAsync(float[] vector, int k, int? subjectId, int? grade)
        {
            try
            {
                var searchRequest = new Nest.SearchRequest(INDEX_NAME_QUESTIONS)
                {
                    Size = k
                };

                var filters = new List<Func<QueryContainerDescriptor<Domain.Entities.ElasticSearch.ElasticQuestion>, QueryContainer>>();
                if (subjectId.HasValue)
                    filters.Add(f => f.Term(t => t.Field("subjectId").Value(subjectId.Value)));
                if (grade.HasValue)
                    filters.Add(f => f.Term(t => t.Field("grade").Value(grade.Value)));

                var response = await _client.SearchAsync<Domain.Entities.ElasticSearch.ElasticQuestion>(s => s
                    .Index(INDEX_NAME_QUESTIONS)
                    .Size(k)
                    .Query(q => q.ScriptScore(ss => ss
                        .Query(qry => qry.Bool(b => b.Filter(filters.ToArray())))
                        .Script(sc => sc
                            .Source("cosineSimilarity(params.query_vector, 'questionVector') + 1.0")
                            .Params(p => p.Add("query_vector", vector))
                        )
                    )));

                var results = new List<StudyHub.Backend.UseCases.Dtos.ExampleQuestionDto>();
                if (!response.IsValid) return results;

                foreach (var hit in response.Hits)
                {
                    var src = hit.Source;
                    if (src == null) continue;
                    results.Add(new StudyHub.Backend.UseCases.Dtos.ExampleQuestionDto
                    {
                        QuestionText = string.IsNullOrWhiteSpace(src.QuestionText) ? src.SearchableText ?? string.Empty : src.QuestionText,
                        CorrectAnswer = src.CorrectAnswer ?? string.Empty
                    });
                }

                return results;
            }
            catch
            {
                return new List<StudyHub.Backend.UseCases.Dtos.ExampleQuestionDto>();
            }
        }
    }
}
