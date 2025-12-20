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
                        .Keyword(k => k.Name(f => f.Keywords))
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
                    Keywords = c.Keywords,
                    ContentVector = c.ContentVector,
                    CharacterStart = c.CharacterStart,
                    CharacterEnd = c.CharacterEnd,
                    Metadata = c.Metadata
                }).ToList();

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
                        return false;
                    }
                }

                await _client.Indices.RefreshAsync(INDEX_NAME);
                return true;
            }
            catch (Exception)
            {
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
                .Size(topK * 3)  
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
                                        .Boost(2.5)  
                                    ),
                                    sh => sh.Terms(t => t
                                        .Field("keywords")
                                        .Terms(query.Split(' ').Where(w => w.Length > 2))
                                        .Boost(5.0)  
                                    ),
                                    sh => sh.MatchPhrase(mp => mp
                                        .Field("content")
                                        .Query(query)
                                        .Boost(3.0)  
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
                        
                        // Vector similarity
                        double vectorScore = cosineSimilarity(params.queryVector, 'contentVector');
                        double vectorScoreNorm = Math.max(0.0, (vectorScore + 1.0) / 2.0);
                        
                        // BM25 score
                        double bm25 = _score;
                        double bm25Norm = bm25 > 0 ? Math.log(1 + bm25) / 3.0 : 0.0;  // ⬇️ Giảm divisor
                        
                        // Boost nếu có keyword match
                        double keywordBoost = 1.0;
                        if (bm25 > 5.0) {  // Có match tốt
                            keywordBoost = 1.5;
                        }
                        
                        // Combined score với dynamic weighting
                        double vectorWeight = params.vectorWeight;
                        double bm25Weight = params.bm25Weight;
                        
                        // Nếu BM25 score cao, tăng trọng số cho nó
                        if (bm25Norm > 0.5) {
                            bm25Weight = 0.5;
                            vectorWeight = 0.5;
                        }
                        
                        return keywordBoost * ((vectorWeight * vectorScoreNorm) + (bm25Weight * bm25Norm));
                    ")
                            .Params(p => p
                                .Add("queryVector", queryVector)
                                .Add("vectorWeight", 0.5)  
                                .Add("bm25Weight", 0.5) 
                            )
                        )
                    )
                )
                .Sort(st => st.Descending("_score"))
            );

            return searchResponse;
        }

        public async Task<bool> DeleteDocumentChunksByDocumentIdAsync(int documentId)
        {
            var response = await _client.DeleteByQueryAsync<ElasticDocumentChunk>(d => d
                .Index(INDEX_NAME)
                .Query(q => q
                    .Term(t => t.Field(f => f.DocumentId).Value(documentId))
                )
            );

            return response.IsValid;
        }

        public async Task<DocumentIndexStats> GetDocumentStatsAsync(int documentId)
        {
            try
            {
                var searchResponse = await _client.SearchAsync<ElasticDocumentChunk>(s => s
                    .Index(INDEX_NAME)
                    .Size(0)
                    .Query(q => q
                        .Term(t => t.Field(f => f.DocumentId).Value(documentId))
                    )
                    .Aggregations(a => a
                        .Max("max_page", m => m.Field(f => f.PageNumber))
                    )
                );

                if (!searchResponse.IsValid)
                {
                    Console.WriteLine($"[RAG Stats] Search failed for document {documentId}: {searchResponse.DebugInformation}");
                    return new DocumentIndexStats
                    {
                        DocumentId = documentId,
                        TotalChunks = 0,
                        TotalPages = 0,
                        TotalCharacters = 0,
                        LastIndexed = null
                    };
                }

                var totalChunks = (int)searchResponse.Total;
                var maxPage = searchResponse.Aggregations.Max("max_page")?.Value ?? 0;

                Console.WriteLine($"[RAG Stats] Document {documentId}: {totalChunks} chunks, {maxPage} pages");

                return new DocumentIndexStats
                {
                    DocumentId = documentId,
                    TotalChunks = totalChunks,
                    TotalPages = (int)maxPage,
                    TotalCharacters = 0,
                    LastIndexed = totalChunks > 0 ? DateTime.Now : (DateTime?)null
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[RAG Stats] Error getting stats for document {documentId}: {ex.Message}");
                return new DocumentIndexStats
                {
                    DocumentId = documentId,
                    TotalChunks = 0,
                    TotalPages = 0,
                    TotalCharacters = 0,
                    LastIndexed = null
                };
            }
        }
        public async Task<bool> ClearAllDocumentContentsAsync()
        {
            try
            {
                var deleteResponse = await _client.DeleteByQueryAsync<ElasticDocumentChunk>(d => d
                    .Index(INDEX_NAME)
                    .Query(q => q.MatchAll())
                );

                if (deleteResponse.IsValid)
                {
                    await _client.Indices.RefreshAsync(INDEX_NAME);
                }

                return deleteResponse.IsValid;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public async Task<bool> RecreateIndexAsync()
        {
            var indexExists = await _client.Indices.ExistsAsync(INDEX_NAME);

            if (indexExists.Exists)
            {
                await _client.Indices.DeleteAsync(INDEX_NAME);
            }

            return await CreateIndexAsync();
        }

        public async Task<long> GetTotalDocumentCountAsync()
        {
            var countResponse = await _client.CountAsync<ElasticDocumentChunk>(c => c
                .Index(INDEX_NAME)
                .Query(q => q.MatchAll())
            );

            return countResponse.IsValid ? countResponse.Count : 0;
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
        public List<string> Keywords { get; set; } = new List<string>();
        public float[] ContentVector { get; set; } = Array.Empty<float>();
        public int CharacterStart { get; set; }
        public int CharacterEnd { get; set; }
        public double? Score { get; set; }
        public Dictionary<string, string> Metadata { get; set; } = new();
    }
}