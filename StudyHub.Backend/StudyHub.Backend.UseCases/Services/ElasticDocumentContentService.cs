using Microsoft.Extensions.Configuration;
using Nest;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using StudyHub.Backend.UseCases.Services;

namespace StudyHub.Backend.UseCases.Services
{
    public class ElasticDocumentContentService 
    {
        private readonly ElasticClient _client;
        private readonly IConfiguration _configuration;
        private const string INDEX_NAME = "document_contents";

        public ElasticDocumentContentService(IConfiguration configuration)
        {
            _configuration = configuration;
            var settings = new ConnectionSettings(new Uri(_configuration["ElasticSearch:Uri"] ?? "http://localhost:9200"))
                            .DefaultIndex(INDEX_NAME);
            _client = new ElasticClient(settings);
        }

        public async Task<bool> CreateIndexAsync()
        {
            var indexExists = await _client.Indices.ExistsAsync(INDEX_NAME);

            if (indexExists.Exists)
            {
                Console.WriteLine($"[Elastic] Index '{INDEX_NAME}' already exists, skipping creation.");
                return true; 
            }

            var createIndexResponse = await _client.Indices.CreateAsync(INDEX_NAME, c => c
                .Map<ElasticDocumentChunk>(m => m
                    .Properties(p => p
                        .Number(n => n.Name(f => f.DocumentId).Type(NumberType.Integer))
                        .Keyword(k => k.Name(f => f.DocumentName))
                        .Number(n => n.Name(f => f.PageNumber).Type(NumberType.Integer))
                        .Number(n => n.Name(f => f.ChunkIndex).Type(NumberType.Integer))
                        .Text(t => t.Name(f => f.Content).Analyzer("standard"))
                        .DenseVector(d => d
                            .Name(f => f.ContentVector)
                            .Dimensions(1024)
                        )
                        .Number(n => n.Name(f => f.CharacterStart).Type(NumberType.Integer))
                        .Number(n => n.Name(f => f.CharacterEnd).Type(NumberType.Integer))
                        .Object<Dictionary<string, string>>(o => o.Name(f => f.Metadata))
                    )
                )
            );

            if (createIndexResponse.IsValid)
            {
                Console.WriteLine($"[Elastic] Index '{INDEX_NAME}' created successfully.");
            }
            else
            {
                Console.WriteLine($"[Elastic] Failed to create index: {createIndexResponse.DebugInformation}");
            }

            return createIndexResponse.IsValid;
        }

        public async Task<bool> IndexDocumentChunksBatchAsync(List<DocumentChunk> chunks)
        {
            try
            {
                var elasticChunks = chunks.Select(c => new ElasticDocumentChunk
                {
                    Id = $"{c.DocumentId}_{c.PageNumber}_{c.ChunkIndex}",
                    DocumentId = c.DocumentId,
                    DocumentName = c.DocumentName,
                    PageNumber = c.PageNumber,
                    ChunkIndex = c.ChunkIndex,
                    Content = c.Content,
                    ContentVector = c.ContentVector,
                    CharacterStart = c.CharacterStart,
                    CharacterEnd = c.CharacterEnd,
                    Metadata = c.Metadata
                }).ToList();

                Console.WriteLine($"[Elastic] Attempting to index {elasticChunks.Count} chunks...");

                var bulkResponse = await _client.BulkAsync(b => b
                    .Index(INDEX_NAME)
                    .IndexMany(elasticChunks, (descriptor, chunk) => descriptor
                        .Id(chunk.Id)
                        .Document(chunk)
                    )
                );

                bool hasErrors = bulkResponse.Errors; 

                if (hasErrors)
                {
                    var actualErrors = bulkResponse.ItemsWithErrors
                        .Where(item => item.Status >= 400);

                    if (actualErrors.Any())
                    {
                        foreach (var item in actualErrors)
                        {
                            Console.WriteLine($"[Elastic] ERROR - ID: {item.Id}, Status: {item.Status}, Error: {item.Error?.Reason}");
                        }
                        return false;
                    }
                }

                Console.WriteLine($"[Elastic] Successfully indexed {elasticChunks.Count} chunks");
                await _client.Indices.RefreshAsync(INDEX_NAME);
                return true; 
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Elastic] Exception: {ex.Message}");
                Console.WriteLine($"[Elastic] Stack: {ex.StackTrace}");
                return false;
            }
        }

        public async Task<ISearchResponse<ElasticDocumentChunk>> SearchDocumentContentAsync(
      int documentId,
      string query,
      float[] queryVector,
      int topK = 10)
        {
            var searchResponse = await _client.SearchAsync<ElasticDocumentChunk>(s => s
                .Index(INDEX_NAME)
                .Size(topK)
                .Query(q => q
                    .ScriptScore(ss => ss
                        .Query(innerQuery => innerQuery
                            .Bool(b => b
                                .Filter(f => f
                                    .Term(t => t.Field("documentId").Value(documentId))
                                )
                                .Should(
                                    sh => sh.Match(m => m
                                        .Field("content")
                                        .Query(query)
                                        .Boost(1.0)
                                    )
                                )
                                .MinimumShouldMatch(0)
                            )
                        )
                        .Script(sc => sc
                            .Source(@"
                        if (doc['contentVector'].size() == 0) {
                            return 0.0;
                        }
                        double vectorScore = cosineSimilarity(params.queryVector, 'contentVector');
                        double vectorScoreNorm = Math.max(0.0, (vectorScore + 1.0) / 2.0);
                        double bm25 = _score;
                        double bm25Norm = bm25 > 0 ? Math.log(1 + bm25) / 5.0 : 0.0;
                        return (params.vectorWeight * vectorScoreNorm) + (params.bm25Weight * bm25Norm);
                    ")
                            .Params(p => p
                                .Add("queryVector", queryVector)
                                .Add("vectorWeight", 0.7)
                                .Add("bm25Weight", 0.3)
                            )
                        )
                    )
                )
                .Sort(st => st.Descending("_score"))
            );

            Console.WriteLine($"[Elastic Search] Total hits: {searchResponse.Total}, IsValid: {searchResponse.IsValid}");

            foreach (var hit in searchResponse.Hits.Take(3))
            {
                Console.WriteLine($"[Elastic] Hit ID: {hit.Id}, Score: {hit.Score}");
            }

            return searchResponse;
        }

        public async Task<bool> DeleteDocumentChunksByDocumentIdAsync(int documentId)
        {
            var response = await _client.DeleteByQueryAsync<ElasticDocumentChunk>(d => d
.Index(INDEX_NAME).Query(q => q
                    .Term(t => t.Field(f => f.DocumentId).Value(documentId))
                )
            );

            return response.IsValid;
        }

        public async Task<DocumentIndexStats> GetDocumentStatsAsync(int documentId)
        {
            var searchResponse = await _client.SearchAsync<ElasticDocumentChunk>(s => s
                .Index(INDEX_NAME)
                .Size(0)
                .Query(q => q
                    .Term(t => t.Field(f => f.DocumentId).Value(documentId))
                )
                .Aggregations(a => a
                    .Max("max_page", m => m.Field(f => f.PageNumber))
                    .Sum("total_chars", m => m
                        .Script(sc => sc
                            .Source("doc['content.keyword'].value.length()")
                        )
                    )
                )
            );

            if (!searchResponse.IsValid)
                return new DocumentIndexStats { DocumentId = documentId };

            var maxPage = searchResponse.Aggregations.Max("max_page")?.Value ?? 0;
            var totalChars = (long)(searchResponse.Aggregations.Sum("total_chars")?.Value ?? 0);

            return new DocumentIndexStats
            {
                DocumentId = documentId,
                TotalChunks = (int)searchResponse.Total,
                TotalPages = (int)maxPage,
                TotalCharacters = totalChars,
                LastIndexed = DateTime.Now
            };
        }
    }

    public class ElasticDocumentChunk
    {
        public string Id { get; set; } = string.Empty;
        public int DocumentId { get; set; }
        public string DocumentName { get; set; } = string.Empty;
        public int PageNumber { get; set; }
        public int ChunkIndex { get; set; }
        public string Content { get; set; } = string.Empty;
        public float[] ContentVector { get; set; } = Array.Empty<float>();
        public int CharacterStart { get; set; }
        public int CharacterEnd { get; set; }
        public double? Score { get; set; }
        public Dictionary<string, string> Metadata { get; set; } = new();
    }
}