using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Elastic.Clients.Elasticsearch;
using Elastic.Clients.Elasticsearch.Nodes;
using Microsoft.Extensions.Configuration;
using Nest;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Domain.Entities.ElasticSearch;
using StudyHub.Backend.UseCases.Dtos;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Utils;

namespace StudyHub.Backend.UseCases.Services
{
    public class ElasticDocumentVectorSearchService
    {
        private readonly EmbeddingService _embeddingService;
        private readonly IDocumentRepository documentRepository;
        private readonly AuthService _authService;
        private readonly IElasticSearchDocument _elasticSearchDocumentRepository;

        public ElasticDocumentVectorSearchService(EmbeddingService embeddingService, IDocumentRepository documentRepository, AuthService authService, IElasticSearchDocument elasticSearchDocumentRepository)
        {
            _embeddingService = embeddingService;
            this.documentRepository = documentRepository;
            _authService = authService;
            _elasticSearchDocumentRepository = elasticSearchDocumentRepository;
        }


        // ----- Documents index management -----
        public async Task<bool> CreateDocumentIndexAsync()
        {
            return await _elasticSearchDocumentRepository.CreateDocumentIndexAsync();
        }

        public async Task<bool> IndexDocumentAsync(UpsertElasticDocumentRequest req)
        {
            var doc = new Document
            {
                Id = req.Id,
                Name = req.Name,
                Description = req.Description,
                DocumentUrl = req.DocumentUrl,
                Thumbnail = req.Thumbnail,
                SchoolId = req.SchoolId,
                Subject = req.Subject,
                DocumentCategory = req.DocumentCategory,
                Grade = (sbyte)req.Grade,
                IsInClass = req.IsInClass,
                DocumentLengthType = req.DocumentLengthType,
                DocumentLevel = req.DocumentLevel,
                Status = req.Status,
                CreatedAt = req.CreatedAt,
                UpdatedAt = req.UpdatedAt
            };

            var searchableText = _embeddingService.ConvertEmbeddingDocumentToText(doc);
            var vector = await _embeddingService.GetEmbeddingAsync(searchableText);
            return await _elasticSearchDocumentRepository.IndexDocumentAsync(doc, searchableText, vector);
        }

        public async Task<bool> IndexDocumentsBatchAsync(List<Document> docs)
        {
            var texts = docs.Select(d => _embeddingService.ConvertDocumentToText(d)).ToList();
            var vectors = await _embeddingService.GetEmbeddingsBatchAsync(texts);
            return await _elasticSearchDocumentRepository.IndexDocumentsBatchAsync(docs, texts, vectors);
        }

        public async Task<bool> IndexAllDocumentsFromDbAsync()
        {
            try
            {
                var result = documentRepository.GetDocuments();
                if (result.Count == 0) return true;

                return await IndexDocumentsBatchAsync(result);
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> DeleteDocumentByIdAsync(int id)
        {
            return await _elasticSearchDocumentRepository.DeleteDocumentByIdAsync(id);
        }

        public async Task<bool> UpdateDocumentStatusAsync(int id, bool status)
        {
            return await _elasticSearchDocumentRepository.UpdateDocumentStatusAsync(id, status);
        }
        public async Task<bool> UpdateDocumentIsInClassAsync(int id, bool isInClass)
        {
            return await _elasticSearchDocumentRepository.UpdateDocumentIsInClassAsync(id, isInClass);
        }
        public async Task<bool> UpdateDocumentUpdatedAtAsync(int id, DateTime updatedAt)
        {
            return await _elasticSearchDocumentRepository.UpdateDocumentUpdatedAtAsync(id, updatedAt);
        }

        // Recommend documents (vector + simple filters)
        public async Task<List<DocumentRecommendationResult>> RecommendDocumentsAsync(UserLearningProfile profile, int topK = 30)
        {
            var preferences = PreferenceUtils.CalculateDocumentSubjectPreferences(profile);
            var userText = _embeddingService.ConvertUserProfileToDocumentText(profile, preferences);
            var userVector = await _embeddingService.GetEmbeddingAsync(userText);

            var filters = new List<Func<QueryContainerDescriptor<ElasticDocument>, QueryContainer>>();

            // Filter by subject if provided
            if (profile.CurrentSubjectStudied != null && profile.CurrentSubjectStudied.Any())
            {
                filters.Add(f => f.Terms(t => t.Field(fd => fd.SubjectName).Terms(profile.CurrentSubjectStudied)));
            }

            filters.Add(f => f.Term(t => t.Field(fd => fd.Status).Value(true)));

            filters.Add(f => f.Term(t => t.Field(fd => fd.IsInClass).Value(false)));

            // Filter by grade
            if (profile.CurrentGrades != null && profile.CurrentGrades.Any())
            {
                filters.Add(f => f.Terms(t => t.Field(fd => fd.Grade).Terms(profile.CurrentGrades)));
            }

            // SchoolId logic (allow missing or match)
            if (profile.SchoolId < 1)
            {
                filters.Add(f => f.Bool(b => b.MustNot(m => m.Exists(e => e.Field(fd => fd.SchoolId)))));
            }
            else
            {
                filters.Add(f => f.Bool(b => b.Should(
                    sh => sh.Term(t => t.Field(fd => fd.SchoolId).Value(profile.SchoolId)),
                    sh => sh.Bool(bb => bb.MustNot(m => m.Exists(e => e.Field(fd => fd.SchoolId))))
                ).MinimumShouldMatch(1)));
            }

            // Build filters based on user's subjects and strength levels
            var shouldQueries = new List<Func<QueryContainerDescriptor<ElasticDocument>, QueryContainer>>();

            foreach (var pref in preferences)
            {
                // Tính boost dựa trên WeakSubjectPriority
                // Môn yếu sẽ có boost cao hơn (từ 1.0x đến 4.0x)
                float baseBoost = 1.0f + (pref.WeakSubjectPriority * 3.0f);

                //=== QUERY 1: Perfect Match(Đúng tất cả) ===
                //Đúng môn + Đúng độ khó(theo DifficultyScore) +Đúng độ dài(theo LengthScore)
                shouldQueries.Add(q => q
                    .Bool(b => b
                        .Must(
                            m => m.Term(t => t.Field(f => f.SubjectName).Value(pref.SubjectName)),
                            m => m.Term(t => t.Field(f => f.DocumentLevel).Value(pref.PreferredDifficulty.ToString())),
                            m => m.Term(t => t.Field(f => f.DocumentLengthType).Value(pref.PreferredLength.ToString()))
                        )
                        .Boost(baseBoost * 1.0f) // 100% boost - Ưu tiên cao nhất
                    )
                );

                // === QUERY 2: Good Match (Đúng môn + độ khó) ===
                // Đúng môn + Đúng độ khó, nhưng sai độ dài
                shouldQueries.Add(q => q
                    .Bool(b => b
                        .Must(
                            m => m.Term(t => t.Field(f => f.SubjectName).Value(pref.SubjectName)),
                            m => m.Term(t => t.Field(f => f.DocumentLevel).Value(pref.PreferredDifficulty.ToString()))
                        )
                        .Boost(baseBoost * 0.8f) // 80% boost
                    )
                );

                // === QUERY 3: Acceptable Match (Chỉ đúng môn) ===
                // Chỉ đúng môn học, độ khó và độ dài có thể khác
                //shouldQueries.Add(q => q
                //    .Bool(b => b
                //        .Must(m => m.Term(t => t.Field(f => f.SubjectName).Value(pref.SubjectName)))
                //        .Boost(baseBoost * 0.5f) // 50% boost
                //    )
                //);

                // === QUERY 4: Fallback - Độ khó liền kề ===
                // Nếu là Intermediate, cũng xét Beginner và Advanced
                // Điều này đảm bảo đủ 30 kết quả
                var adjacentDifficulties = GetAdjacentDocumentDifficulties(pref.PreferredDifficulty);
                foreach (var adjDiff in adjacentDifficulties)
                {
                    shouldQueries.Add(q => q
                        .Bool(b => b
                            .Must(
                                m => m.Term(t => t.Field(f => f.SubjectName).Value(pref.SubjectName)),
                                m => m.Term(t => t.Field(f => f.DocumentLevel).Value(adjDiff.ToString()))
                            )
                            .Boost(baseBoost * 0.3f) // 30% boost - Gần thấp nhất
                        )
                    );
                }

                // === QUERY 5: Fallback - Độ dài liền kề ===
                // Nếu là Medium, cũng xét Short và Long
                // Điều này đảm bảo đủ 30 kết quả
                var adjacentLongs = GetAdjacentDocumentLengths(pref.PreferredLength);
                foreach (var adjLong in adjacentLongs)
                {
                    shouldQueries.Add(q => q
                        .Bool(b => b
                            .Must(
                                m => m.Term(t => t.Field(f => f.SubjectName).Value(pref.SubjectName)),
                                m => m.Term(t => t.Field(f => f.DocumentLengthType).Value(adjLong.ToString()))
                            )
                            .Boost(baseBoost * 0.2f) // 20% boost - Thấp nhất
                        )
                    );
                }
            }

            var searchResponse = await _elasticSearchDocumentRepository.RecommendDocumentsAsync(filters, shouldQueries, userVector, topK);
            var results = searchResponse.Hits.Select(hit => new DocumentRecommendationResult
            {
                Id = hit.Source?.Id.ToString() ?? "",
                Score = hit.Score ?? 0,
                Title = hit.Source?.Name ?? "",
                Thumbnail = hit.Source?.Thumbnail ?? "",
                Grade = hit.Source?.Grade ?? 0,
                Subject = hit.Source?.SubjectName ?? "",
                DocumentLevel = hit.Source?.DocumentLevel ?? "",
                DocumentLengthType = hit.Source?.DocumentLengthType ?? "",
                Description = hit.Source?.Description ?? "",
                UpdatedAt = hit.Source?.UpdatedAt ?? DateTime.Now,
                DocumentCategoryName = hit.Source?.DocumentCategoryName ?? "",
                DocumentCategoryDescription = hit.Source?.DocumentCategoryDescription ?? "",
                DocumentUrl = hit.Source?.DocumentUrl ?? ""
            }).Take(topK).ToList();

            return results;
        }

        // Search documents with LLM profile (dense + BM25 hybrid)
        public async Task<List<DocumentRecommendationResult>> SearchDocumentWithLLMProfileAsync(float[] denseVector, UserPreferenceProfile profile, int topK = 30)
        {
            var user = _authService.GetCurrentUser();
            var schoolId = user?.SchoolId ?? 0;

            var targetDifficulty = MapLevelToDocumentDifficulty(profile.DocumentLevel);
            var targetLength = MapPreferredLength(profile.PreferredLength);

            var filters = new List<Func<QueryContainerDescriptor<ElasticDocument>, QueryContainer>>();
            if (profile.Subject != null && profile.Subject.Any())
            {
                filters.Add(f => f.Terms(t => t.Field(fd => fd.SubjectName).Terms(profile.Subject)));
            }

            filters.Add(f => f.Term(t => t.Field(fd => fd.Status).Value(true)));

            filters.Add(f => f.Term(t => t.Field(fd => fd.IsInClass).Value(false)));

            filters.Add(f => f.Terms(t => t.Field(fd => fd.Grade).Terms(profile.Grade)));

            if (schoolId < 1)
            {
                filters.Add(f => f.Bool(b => b.MustNot(m => m.Exists(e => e.Field(fd => fd.SchoolId)))));
            }
            else
            {
                filters.Add(f => f.Bool(b => b.Should(
                    sh => sh.Term(t => t.Field(fd => fd.SchoolId).Value(schoolId)),
                    sh => sh.Bool(bb => bb.MustNot(m => m.Exists(e => e.Field(fd => fd.SchoolId))))
                ).MinimumShouldMatch(1)));
            }

            var searchResponse = await _elasticSearchDocumentRepository.SearchDocumentWithLLMProfileAsync(denseVector, profile, filters, targetDifficulty, targetLength, topK);

            var results = searchResponse.Hits.Select(hit => new DocumentRecommendationResult
            {
                Id = hit.Source?.Id.ToString() ?? "",
                Score = hit.Score ?? 0,
                Title = hit.Source?.Name ?? "",
                Thumbnail = hit.Source?.Thumbnail ?? "",
                Grade = hit.Source?.Grade ?? 0,
                Subject = hit.Source?.SubjectName ?? "",
                DocumentLevel = hit.Source?.DocumentLevel ?? "",
                DocumentLengthType = hit.Source?.DocumentLengthType ?? "",
                Description = hit.Source?.Description ?? "",
                UpdatedAt = hit.Source?.UpdatedAt ?? DateTime.Now,
                DocumentCategoryName = hit.Source?.DocumentCategoryName ?? "",
                DocumentCategoryDescription = hit.Source?.DocumentCategoryDescription ?? "",
                DocumentUrl = hit.Source?.DocumentUrl ?? ""
            }).Take(topK).ToList();

            return results;
        }

        private List<string> GetAdjacentDocumentDifficulties(string difficulty)
        {
            return difficulty switch
            {
                //In case user want to try other logic
                //CourseDifficulty.Beginner => new List<CourseDifficulty> { CourseDifficulty.Intermediate },
                //CourseDifficulty.Intermediate => new List<CourseDifficulty> { CourseDifficulty.Beginner, CourseDifficulty.Advanced },
                //CourseDifficulty.Advanced => new List<CourseDifficulty> { CourseDifficulty.Intermediate },

                "Medium" => new List<string> { "Easy" },
                "Hard" => new List<string> { "Easy" },
                _ => new List<string>()
            };
        }
        private List<string> GetAdjacentDocumentLengths(string length)
        {
            return length switch
            {
                "Long" => new List<string> { "Medium" },
                "Medium" => new List<string> { "Short" },
                _ => new List<string>()
            };
        }

        private string MapLevelToDocumentDifficulty(string level)
        {
            return level?.ToLower() switch
            {
                "easy" => "Easy",
                "medium" => "Medium",
                "hard" => "Hard",
                _ => "Easy"
            };
        }

        // Helper: Map preferred length
        private string MapPreferredLength(string length)
        {
            return length?.ToLower() switch
            {
                "short" => "Short",
                "medium" => "Medium",
                "long" => "Long",
                _ => "Medium"
            };
        }

        // Seed sample documents for testing LLM/hybrid recommendations
        public async Task<bool> SeedSampleDocumentsAsync()
        {
            var docs = new List<Document>
            {
                new Document
                {
                    Id = 1001,
                    Name = "Toán 9 - Tài liệu ôn tập phương trình",
                    Description = "Tổng hợp lý thuyết và bài tập phương trình bậc hai và bậc nhất, có đáp án chi tiết.",
                    DocumentUrl = "https://example.com/docs/math_eqs.pdf",
                    Thumbnail = "",
                    SchoolId = 1,
                    IsInClass = false,
                    IsFeatured = false,
                    DocumentLengthType = "Short",
                    DocumentLevel = "Easy",
                    Grade = 9,
                    Subject = new Subject { Name = "Toán học" },
                    DocumentCategory = new DocumentCategory { Name = "Bài tập", Description = "Bộ bài tập có lời giải" },
                    Status = true,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                },
                new Document
                {
                    Id = 1002,
                    Name = "Toán 9 - Hình học ôn luyện",
                    Description = "Chuyên đề hình học: tam giác, đường tròn, góc. Bài tập nâng cao kèm hướng dẫn.",
                    DocumentUrl = "https://example.com/docs/math_geometry.pdf",
                    Thumbnail = "",
                    SchoolId = 1,
                    IsInClass = false,
                    IsFeatured = false,
                    DocumentLengthType = "Medium",
                    DocumentLevel = "Medium",
                    Grade = 9,
                    Subject = new Subject { Name = "Toán học" },
                    DocumentCategory = new DocumentCategory { Name = "Bài giảng", Description = "Tài liệu bài giảng" },
                    Status = true,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                },
                new Document
                {
                    Id = 1003,
                    Name = "Vật lý 9 - Bài tập mạch điện",
                    Description = "Bài tập về điện một chiều, định luật Ohm, mạch nối tiếp song song.",
                    DocumentUrl = "https://example.com/docs/physics_circuits.pdf",
                    Thumbnail = "",
                    SchoolId = 1,
                    IsInClass = false,
                    IsFeatured = false,
                    DocumentLengthType = "Short",
                    DocumentLevel = "Easy",
                    Grade = 9,
                    Subject = new Subject { Name = "Vật lý" },
                    DocumentCategory = new DocumentCategory { Name = "Bài tập", Description = "Bộ bài tập có lời giải" },
                    Status = true,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                },
                new Document
                {
                    Id = 1004,
                    Name = "Vật lý 10 - Động lực học nâng cao",
                    Description = "Tổng hợp bài tập động lực học, ma sát, vận tốc, gia tốc với hướng dẫn chi tiết.",
                    DocumentUrl = "https://example.com/docs/physics_dynamics.pdf",
                    Thumbnail = "",
                    SchoolId = 1,
                    IsInClass = false,
                    IsFeatured = false,
                    DocumentLengthType = "Long",
                    DocumentLevel = "Hard",
                    Grade = 10,
                    Subject = new Subject { Name = "Vật lý" },
                    DocumentCategory = new DocumentCategory { Name = "Bài giảng", Description = "Tài liệu bài giảng" },
                    Status = true,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                },
                new Document
                {
                    Id = 1005,
                    Name = "Hóa học 9 - Bài tập phản ứng",
                    Description = "Phản ứng hóa học cơ bản, cách cân bằng phương trình, bài tập minh họa.",
                    DocumentUrl = "https://example.com/docs/chem_reactions.pdf",
                    Thumbnail = "",
                    SchoolId = 1,
                    IsInClass = false,
                    IsFeatured = false,
                    DocumentLengthType = "Medium",
                    DocumentLevel = "Medium",
                    Grade = 9,
                    Subject = new Subject { Name = "Hóa học" },
                    DocumentCategory = new DocumentCategory { Name = "Bài tập", Description = "Bộ bài tập có lời giải" },
                    Status = true,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                },
                new Document
                {
                    Id = 1006,
                    Name = "Ngữ văn 9 - Phân tích văn bản mẫu",
                    Description = "Tập hợp các bài phân tích văn bản mẫu, hướng dẫn viết bài nghị luận.",
                    DocumentUrl = "https://example.com/docs/lit_analysis.pdf",
                    Thumbnail = "",
                    SchoolId = 1,
                    IsInClass = false,
                    IsFeatured = false,
                    DocumentLengthType = "Short",
                    DocumentLevel = "Easy",
                    Grade = 9,
                    Subject = new Subject { Name = "Ngữ văn" },
                    DocumentCategory = new DocumentCategory { Name = "Tham khảo", Description = "Tài liệu tham khảo" },
                    Status = true,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                },
                new Document
                {
                    Id = 1007,
                    Name = "Tiếng Anh 9 - Vocabulary theo chủ đề",
                    Description = "Danh sách từ vựng theo chủ đề kèm ví dụ và bài tập luyện tập.",
                    DocumentUrl = "https://example.com/docs/eng_vocab.pdf",
                    Thumbnail = "",
                    SchoolId = 1,
                    IsInClass = false,
                    IsFeatured = false,
                    DocumentLengthType = "Medium",
                    DocumentLevel = "Easy",
                    Grade = 9,
                    Subject = new Subject { Name = "Tiếng Anh" },
                    DocumentCategory = new DocumentCategory { Name = "Bài tập", Description = "Bộ bài tập" },
                    Status = true,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                },
                new Document
                {
                    Id = 1008,
                    Name = "Lịch sử 9 - Tóm tắt giai đoạn hiện đại",
                    Description = "Tóm tắt các sự kiện lịch sử quan trọng, mốc thời gian và bài tập ôn tập.",
                    DocumentUrl = "https://example.com/docs/history_modern.pdf",
                    Thumbnail = "",
                    SchoolId = 1,
                    IsInClass = false,
                    IsFeatured = false,
                    DocumentLengthType = "Short",
                    DocumentLevel = "Easy",
                    Grade = 9,
                    Subject = new Subject { Name = "Lịch sử" },
                    DocumentCategory = new DocumentCategory { Name = "Tham khảo", Description = "Tài liệu tham khảo" },
                    Status = true,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                },
                new Document
                {
                    Id = 1009,
                    Name = "Sinh học 9 - Di truyền học cơ bản",
                    Description = "Tài liệu về quy luật Mendel, ADN và bài tập minh họa.",
                    DocumentUrl = "https://example.com/docs/bio_genetics.pdf",
                    Thumbnail = "",
                    SchoolId = 1,
                    IsInClass = false,
                    IsFeatured = false,
                    DocumentLengthType = "Medium",
                    DocumentLevel = "Medium",
                    Grade = 9,
                    Subject = new Subject { Name = "Sinh học" },
                    DocumentCategory = new DocumentCategory { Name = "Bài giảng", Description = "Tài liệu bài giảng" },
                    Status = true,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                },
                new Document
                {
                    Id = 1010,
                    Name = "GDCD 9 - Pháp luật cơ bản",
                    Description = "Các khái niệm pháp luật cơ bản và bài tập vận dụng.",
                    DocumentUrl = "https://example.com/docs/civics_law.pdf",
                    Thumbnail = "",
                    SchoolId = 1,
                    IsInClass = false,
                    IsFeatured = false,
                    DocumentLengthType = "Short",
                    DocumentLevel = "Easy",
                    Grade = 9,
                    Subject = new Subject { Name = "GDCD" },
                    DocumentCategory = new DocumentCategory { Name = "Tham khảo", Description = "Tài liệu tham khảo" },
                    Status = true,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                },
                // Additional documents (11-20)
                new Document { Id = 1101, Name = "Toán 10 - Bảng công thức", Description = "Bảng tổng hợp công thức toán 10", DocumentUrl = "https://example.com/docs/math_formulas.pdf", SchoolId = 1, IsInClass = false, IsFeatured = false, DocumentLengthType = "Short", DocumentLevel = "Easy", Grade = 10, Subject = new Subject { Name = "Toán học" }, DocumentCategory = new DocumentCategory { Name = "Tổng hợp", Description = "Bảng công thức" }, Status = true, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now},
                new Document { Id = 1102, Name = "Toán 10 - Bất đẳng thức", Description = "Chuyên đề bất đẳng thức và bài tập", DocumentUrl = "https://example.com/docs/ineq.pdf", SchoolId = 1, IsInClass = false, IsFeatured = false, DocumentLengthType = "Medium", DocumentLevel = "Medium", Grade = 10, Subject = new Subject { Name = "Toán học" }, DocumentCategory = new DocumentCategory { Name = "Bài tập", Description = "Bộ bài tập" }, Status = true , CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now},
                new Document { Id = 1103, Name = "Vật lý 10 - Sóng và âm", Description = "Tài liệu về sóng cơ và âm học", DocumentUrl = "https://example.com/docs/waves_sound.pdf", SchoolId = 1, IsInClass = false, IsFeatured = false, DocumentLengthType = "Medium", DocumentLevel = "Medium", Grade = 10, Subject = new Subject { Name = "Vật lý" }, DocumentCategory = new DocumentCategory { Name = "Bài giảng", Description = "Tài liệu bài giảng" }, Status = true , CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now},
                new Document { Id = 1104, Name = "Hóa học 10 - Hóa hữu cơ cơ bản", Description = "Giới thiệu hợp chất hữu cơ cơ bản và bài tập", DocumentUrl = "https://example.com/docs/orgchem.pdf", SchoolId = 1, IsInClass = false, IsFeatured = false, DocumentLengthType = "Long", DocumentLevel = "Hard", Grade = 10, Subject = new Subject { Name = "Hóa học" }, DocumentCategory = new DocumentCategory { Name = "Bài giảng", Description = "Tài liệu bài giảng" }, Status = true , CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now},
                new Document { Id = 1105, Name = "Tiếng Anh 10 - Reading comprehension", Description = "Các bài đọc hiểu nâng cao và hướng dẫn làm bài", DocumentUrl = "https://example.com/docs/eng_reading.pdf", SchoolId = 1, IsInClass = false, IsFeatured = false, DocumentLengthType = "Long", DocumentLevel = "Hard", Grade = 10, Subject = new Subject { Name = "Tiếng Anh" }, DocumentCategory = new DocumentCategory { Name = "Bài tập", Description = "Bộ bài tập" }, Status = true , CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now},
                new Document { Id = 1106, Name = "Ngữ văn 10 - Phân tích văn bản nâng cao", Description = "Phân tích tác phẩm văn học nổi bật", DocumentUrl = "https://example.com/docs/lit_adv.pdf", SchoolId = 1, IsInClass = false, IsFeatured = false, DocumentLengthType = "Medium", DocumentLevel = "Medium", Grade = 10, Subject = new Subject { Name = "Ngữ văn" }, DocumentCategory = new DocumentCategory { Name = "Tham khảo", Description = "Tài liệu tham khảo" }, Status = true , CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now},
                new Document { Id = 1107, Name = "Lịch sử 10 - Tài liệu ôn tập", Description = "Tóm tắt các sự kiện lịch sử thế giới và Việt Nam", DocumentUrl = "https://example.com/docs/history_review.pdf", SchoolId = 1, IsInClass = false, IsFeatured = false, DocumentLengthType = "Short", DocumentLevel = "Easy", Grade = 10, Subject = new Subject { Name = "Lịch sử" }, DocumentCategory = new DocumentCategory { Name = "Tổng hợp", Description = "Tóm tắt" }, Status = true , CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now},
                new Document { Id = 1108, Name = "Sinh học 10 - Hệ tuần hoàn", Description = "Giải phẫu và chức năng hệ tuần hoàn", DocumentUrl = "https://example.com/docs/bio_circulation.pdf", SchoolId = 1, IsInClass = false, IsFeatured = false, DocumentLengthType = "Medium", DocumentLevel = "Medium", Grade = 10, Subject = new Subject { Name = "Sinh học" }, DocumentCategory = new DocumentCategory { Name = "Bài giảng", Description = "Tài liệu bài giảng" }, Status = true, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
                new Document { Id = 1109, Name = "GDCD 10 - Quyền và nghĩa vụ", Description = "Tài liệu về quyền và nghĩa vụ công dân", DocumentUrl = "https://example.com/docs/civics_rights.pdf", SchoolId = 1, IsInClass = false, IsFeatured = false, DocumentLengthType = "Short", DocumentLevel = "Easy", Grade = 10, Subject = new Subject { Name = "GDCD" }, DocumentCategory = new DocumentCategory { Name = "Tham khảo", Description = "Tài liệu tham khảo" }, Status = true, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
                new Document { Id = 1110, Name = "Địa lý 10 - Địa hình và khí hậu", Description = "Tài liệu phân tích địa hình và khí hậu Việt Nam", DocumentUrl = "https://example.com/docs/geo_climate.pdf", SchoolId = 1, IsInClass = false, IsFeatured = false, DocumentLengthType = "Medium", DocumentLevel = "Medium", Grade = 10, Subject = new Subject { Name = "Địa lý" }, DocumentCategory = new DocumentCategory { Name = "Tổng hợp", Description = "Tổng hợp kiến thức" }, Status = true , CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now}
            };

            // Convert to texts and generate embeddings
            var texts = docs.Select(d => _embeddingService.ConvertDocumentToText(d)).ToList();
            var embeddings = await _embeddingService.GetEmbeddingsBatchAsync(texts);

            return _elasticSearchDocumentRepository.IndexDocumentsBatchAsync(docs, texts, embeddings).Result;
        }

    }
}
