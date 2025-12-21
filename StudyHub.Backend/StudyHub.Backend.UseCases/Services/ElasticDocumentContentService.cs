using Microsoft.Extensions.Configuration;
using Nest;
using StudyHub.Backend.UseCases.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

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
                .Settings(s => s
                    .Analysis(a => a
                        .Analyzers(an => an
                            .Custom("keyword_lowercase", ca => ca
                                .Tokenizer("keyword")
                                .Filters("lowercase")
                            )
                        )
                    )
                )
                .Map<ElasticDocumentChunk>(m => m
                    .Properties(p => p
                        .Number(n => n.Name(f => f.DocumentId).Type(NumberType.Integer))
                        .Keyword(k => k.Name(f => f.DocumentName))
                        .Number(n => n.Name(f => f.PageNumber).Type(NumberType.Integer))
                        .Number(n => n.Name(f => f.ChunkIndex).Type(NumberType.Integer))
                        .Text(t => t
                            .Name(f => f.Content)
                            .Analyzer("standard")
                            .Fields(ff => ff.Keyword(kk => kk.Name("exact")))
                        )
                        .Text(tx => tx
                            .Name(f => f.Keywords)
                            .Analyzer("keyword_lowercase")
                            .Fields(ff => ff.Keyword(kk => kk.Name("raw")))
                        )
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
            var queryLower = query.ToLower().Trim();

            var queryTerms = Regex.Matches(queryLower, @"[\w\d]+")
                .Cast<Match>()
                .Select(m => m.Value)
                .Where(w => !string.IsNullOrWhiteSpace(w) && w.Length > 1)
                .Distinct()
                .ToArray();

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
                                    sh => sh.MatchPhrase(mp => mp
                                        .Field("content")
                                        .Query(queryLower)
                                        .Boost(300.0)
                                    ),
                                    sh => sh.Match(m => m
                                        .Field("content.ngram")
                                        .Query(queryLower)
                                        .Boost(200.0)
                                    ),
                                    sh => sh.Match(m => m
                                        .Field("content")
                                        .Query(queryLower)
                                        .Boost(150.0)
                                        .Operator(Operator.And)
                                    ),
                                    sh => sh.Terms(t => t
                                        .Field("keywords")
                                        .Terms(queryTerms)
                                        .Boost(180.0)
                                    ),
                                    sh => sh.Match(m => m
                                        .Field("keywords")
                                        .Query(queryLower)
                                        .Boost(160.0)
                                    ),
                                    sh => sh.Match(m => m
                                        .Field("content")
                                        .Query(queryLower)
                                        .Boost(80.0)
                                        .Operator(Operator.Or)
                                        .MinimumShouldMatch("50%")
                                    )
                                )
                                .MinimumShouldMatch(0)
                            )
                        )
                        .Script(sc => sc
                            .Source(@"
                        double bm25Score = _score > 0 ? _score : 0.0;
                        
                        double vectorScore = 0.0;
                        if (doc['contentVector'].size() > 0) {
                            vectorScore = cosineSimilarity(params.queryVector, 'contentVector');
                            vectorScore = Math.max(0.0, (vectorScore + 1.0) / 2.0);
                        }
                        
                        double bm25Weight = 0.98;
                        double vectorWeight = 0.02;
                        
                        if (bm25Score > 150.0) {
                            bm25Weight = 0.99;
                            vectorWeight = 0.01;
                        } else if (bm25Score > 80.0) {
                            bm25Weight = 0.96;
                            vectorWeight = 0.04;
                        } else if (bm25Score < 10.0) {
                            bm25Weight = 0.3;
                            vectorWeight = 0.7;
                        }
                        
                        return (bm25Weight * bm25Score) + (vectorWeight * vectorScore * 25.0);
                    ")
                            .Params(p => p
                                .Add("queryVector", queryVector)
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
        public async Task<DebugChunksResult> DebugSearchChunksAsync(int documentId, int? pageNumber = null)
        {
            try
            {
                var searchResponse = await _client.SearchAsync<ElasticDocumentChunk>(s => s
                    .Index(INDEX_NAME)
                    .Size(100)
                    .Query(q => q
                        .Bool(b => b
                            .Filter(f => f.Term(t => t.Field("documentId").Value(documentId)))
                            .Should(pageNumber.HasValue
                                ? sh => sh.Term(t => t.Field("pageNumber").Value(pageNumber.Value))
                                : sh => sh.MatchAll()
                            )
                        )
                    )
                    .Sort(st => st.Ascending("pageNumber").Ascending("chunkIndex"))
                );

                if (!searchResponse.IsValid)
                {
                    return new DebugChunksResult
                    {
                        Success = false,
                        Error = searchResponse.DebugInformation,
                        ServerError = searchResponse.ServerError?.ToString()
                    };
                }

                var chunks = searchResponse.Hits.Select(h => new ChunkDebugInfo
                {
                    Page = h.Source.PageNumber,
                    ChunkIndex = h.Source.ChunkIndex,
                    ContentPreview = h.Source.Content.Substring(0, Math.Min(200, h.Source.Content.Length)),
                    Keywords = h.Source.Keywords.Take(5).ToList(),
                    Id = h.Source.Id
                }).ToList();

                var pageDistribution = chunks.GroupBy(c => c.Page)
                    .Select(g => new PageDistribution { Page = g.Key, Count = g.Count() })
                    .OrderBy(x => x.Page)
                    .ToList();

                return new DebugChunksResult
                {
                    Success = true,
                    TotalHits = searchResponse.Total,
                    PageDistribution = pageDistribution,
                    Chunks = chunks
                };
            }
            catch (Exception ex)
            {
                return new DebugChunksResult
                {
                    Success = false,
                    Error = ex.Message
                };
            }
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
    public class DebugChunksResult
    {
        public bool Success { get; set; }
        public long TotalHits { get; set; }
        public List<PageDistribution> PageDistribution { get; set; } = new();
        public List<ChunkDebugInfo> Chunks { get; set; } = new();
        public string Error { get; set; }
        public string ServerError { get; set; }
    }

    public class PageDistribution
    {
        public int Page { get; set; }
        public int Count { get; set; }
    }

    public class ChunkDebugInfo
    {
        public int Page { get; set; }
        public int ChunkIndex { get; set; }
        public string ContentPreview { get; set; }
        public List<string> Keywords { get; set; }
        public string Id { get; set; }
    }
}