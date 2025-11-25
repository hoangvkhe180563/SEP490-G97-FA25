using Microsoft.Extensions.Configuration;
using Nest;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Dtos;
using StudyHub.Backend.UseCases.Utils;

namespace StudyHub.Backend.UseCases.Services
{
    public class ElasticVectorSearchService
    {
        private readonly ElasticClient _client;
        private readonly EmbeddingService _embeddingService;
        private readonly CourseService _courseService;
        private readonly IConfiguration _configuration;
        private readonly AuthService _authService;
        private const string INDEX_NAME = "courses";

        public ElasticVectorSearchService(EmbeddingService embeddingService, IConfiguration configuration, CourseService courseService, AuthService authService)
        {
            _configuration = configuration;
            var elasticsearchUrl = _configuration["Elasticsearch:Url"] ?? "http://localhost0:9200";
            var settings = new ConnectionSettings(new Uri(elasticsearchUrl))
                .DefaultIndex(INDEX_NAME)
                .DisableDirectStreaming();

            _client = new ElasticClient(settings);
            _embeddingService = embeddingService;
            _courseService = courseService;
            _authService = authService;
        }

        // Index all courses from MySQL (via CourseService) into Elasticsearch
        public async Task<bool> IndexAllCoursesFromDbAsync()
        {
            try
            {
                var query = new CourseQueryParams { Page = 1, PageSize = int.MaxValue };
                var paged = _courseService.GetAllCourses(query);
                var courses = paged.Items ?? new List<Course>();

                if (courses.Count == 0)
                    return true;

                var documents = new List<ElasticCourse>();
                var texts = courses.Select(c => _embeddingService.ConvertCourseToText(c)).ToList();

                var vectors = await _embeddingService.GetEmbeddingsBatchAsync(texts);

                for (int i = 0; i < courses.Count; i++)
                {
                    var course = courses[i];
                    documents.Add(new ElasticCourse
                    {
                        Id = course.Id,
                        Name = course.Name,
                        Information = course.Information ?? "",
                        SchoolId = course.SchoolId,
                        Status = course.Status,
                        SubjectName = course.Subject?.Name ?? string.Empty,
                        Difficulty = course.Difficulty.ToString(),
                        Length = course.Length.ToString(),
                        Grade = course.Grade,
                        CourseVector = vectors[i],
                        SearchableText = texts[i]
                    });
                }

                var bulkResponse = await _client.BulkAsync(b => b
                    .Index(INDEX_NAME)
                    .IndexMany(documents)
                );

                await _client.Indices.RefreshAsync(INDEX_NAME);

                return bulkResponse.IsValid;
            }
            catch
            {
                return false;
            }
        }

        // Delete a document in Elasticsearch index by course id
        public async Task<bool> DeleteCourseByIdAsync(int id)
        {
            try
            {
                var response = await _client.DeleteAsync(new DeleteRequest(INDEX_NAME, id.ToString()));
                return response.IsValid;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> CreateIndexAsync()
        {
            var indexExists = await _client.Indices.ExistsAsync(INDEX_NAME);

            if (indexExists.Exists)
            {
                await _client.Indices.DeleteAsync(INDEX_NAME);
            }

            var createIndexResponse = await _client.Indices.CreateAsync(INDEX_NAME, c => c
                .Map<ElasticCourse>(m => m
                    .Properties(p => p
                        .Number(n => n.Name(f => f.Id))
                        .Text(t => t.Name(f => f.Name))
                        .Text(t => t.Name(f => f.Information))
                        .Number(n => n.Name(f => f.SchoolId))
                        .Keyword(k => k.Name(f => f.SubjectName))
                        .Keyword(k => k.Name(f => f.Difficulty))
                        .Keyword(k => k.Name(f => f.Length))
                        .Keyword(k => k.Name(f => f.Status))
                        .Number(n => n.Name(f => f.Grade))
                        .DenseVector(d => d
                            .Name(f => f.CourseVector)
                            .Dimensions(1024))
                        .Text(t => t.Name(f => f.SearchableText))
                    )
                )
            );

            return createIndexResponse.IsValid;
        }


        // Upsert 1 course into Elasticsearch
        public async Task<bool> IndexCourseAsync(UpsertElasticCourseRequest course)
        {
            var searchableText = _embeddingService.ConvertEmbeddingCourseToText(course);
            var vector = await _embeddingService.GetEmbeddingAsync(searchableText);

            var document = new ElasticCourse
            {
                Id = course.Id,
                Name = course.Name,
                Information = course.Information ?? "",
                SchoolId = course.SchoolId,
                Status = course.Status,
                SubjectName = course.Subject.Name,
                Difficulty = course.Difficulty.ToString(),
                Length = course.Length.ToString(),
                Grade = course.Grade,
                CourseVector = vector,
                SearchableText = searchableText
            };

            var response = await _client.IndexDocumentAsync(document);
            return response.IsValid;
        }

        public async Task<bool> IndexCoursesBatchAsync(List<Course> courses)
        {
            var documents = new List<ElasticCourse>();
            var texts = courses.Select(c => _embeddingService.ConvertCourseToText(c)).ToList();

            // Batch embedding để tối ưu API calls
            var vectors = await _embeddingService.GetEmbeddingsBatchAsync(texts);

            for (int i = 0; i < courses.Count; i++)
            {
                var course = courses[i];
                documents.Add(new ElasticCourse
                {
                    Id = course.Id,
                    Name = course.Name,
                    Information = course.Information ?? "",
                    SchoolId = course.SchoolId,
                    Status = course.Status,
                    SubjectName = course.Subject.Name,
                    Difficulty = course.Difficulty.ToString(),
                    Length = course.Length.ToString(),
                    Grade = course.Grade,
                    CourseVector = vectors[i],
                    SearchableText = texts[i]
                });
            }

            var bulkResponse = await _client.BulkAsync(b => b
                .Index(INDEX_NAME)
                .IndexMany(documents)
            );

            return bulkResponse.IsValid;
        }

        public async Task<List<ElasticCourse>> RecommendCoursesAsync(
            UserLearningProfile profile,
            int topK = 30)
        {
            // Bước 1: Tính toán preferences cho từng môn
            var preferences = PreferenceUtils.CalculateSubjectPreferences(profile);

            // Bước 2: Convert user profile to text và tạo vector
            var userText = _embeddingService.ConvertUserProfileToText(profile, preferences);
            var userVector = await _embeddingService.GetEmbeddingAsync(userText);

            var filters = new List<Func<QueryContainerDescriptor<ElasticCourse>, QueryContainer>>();

            filters.Add(f => f
                .Terms(t => t
                    .Field(fd => fd.SubjectName)
                    .Terms(profile.CurrentSubjectStudied)
                )
            );

            // Filter Grade
            filters.Add(f => f
                .Terms(t => t
                    .Field(fd => fd.Grade)
                    .Terms(profile.CurrentGrades)
                )
            );

            //// Filter Status
            filters.Add(f => f
                .Term(t => t
                    .Field(fd => fd.Status)
                    .Value("Mở") // hoặc profile.Status nếu có
                )
            );

            //// Filter SchoolId (null thì filter null)
            if (profile.SchoolId < 1)
            {
                filters.Add(f => f
                    .Bool(b => b
                        .MustNot(m => m
                            .Exists(e => e.Field(fd => fd.SchoolId))
                        )
                    )
                );
            }
            else
            {
                filters.Add(f => f
                    .Bool(b => b
                        .Should(
                            sh => sh.Term(t => t.Field(fd => fd.SchoolId).Value(profile.SchoolId)),
                            sh => sh.Bool(bb => bb.MustNot(m => m.Exists(e => e.Field(fd => fd.SchoolId))))
                        )
                        .MinimumShouldMatch(1)
                    )
                );
            }

            // Build filters based on user's subjects and strength levels
            var shouldQueries = new List<Func<QueryContainerDescriptor<ElasticCourse>, QueryContainer>>();

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
                            m => m.Term(t => t.Field(f => f.Difficulty).Value(pref.PreferredDifficulty.ToString())),
                            m => m.Term(t => t.Field(f => f.Length).Value(pref.PreferredLength.ToString()))
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
                            m => m.Term(t => t.Field(f => f.Difficulty).Value(pref.PreferredDifficulty.ToString()))
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
                var adjacentDifficulties = GetAdjacentDifficulties(pref.PreferredDifficulty);
                foreach (var adjDiff in adjacentDifficulties)
                {
                    shouldQueries.Add(q => q
                        .Bool(b => b
                            .Must(
                                m => m.Term(t => t.Field(f => f.SubjectName).Value(pref.SubjectName)),
                                m => m.Term(t => t.Field(f => f.Difficulty).Value(adjDiff.ToString()))
                            )
                            .Boost(baseBoost * 0.3f) // 30% boost - Gần thấp nhất
                        )
                    );
                }

                // === QUERY 5: Fallback - Độ dài liền kề ===
                // Nếu là Medium, cũng xét Short và Long
                // Điều này đảm bảo đủ 30 kết quả
                var adjacentLongs = GetAdjacentLengths(pref.PreferredLength);
                foreach (var adjLong in adjacentLongs)
                {
                    shouldQueries.Add(q => q
                        .Bool(b => b
                            .Must(
                                m => m.Term(t => t.Field(f => f.SubjectName).Value(pref.SubjectName)),
                                m => m.Term(t => t.Field(f => f.Length).Value(adjLong.ToString()))
                            )
                            .Boost(baseBoost * 0.2f) // 20% boost - Thấp nhất
                        )
                    );
                }
            }

            // Vector search with filters
            var searchResponse = await _client.SearchAsync<ElasticCourse>(s => s
                .Index(INDEX_NAME)
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
        private List<CourseDifficulty> GetAdjacentDifficulties(CourseDifficulty difficulty)
        {
            return difficulty switch
            {
                //In case user want to try other logic
                //CourseDifficulty.Beginner => new List<CourseDifficulty> { CourseDifficulty.Intermediate },
                //CourseDifficulty.Intermediate => new List<CourseDifficulty> { CourseDifficulty.Beginner, CourseDifficulty.Advanced },
                //CourseDifficulty.Advanced => new List<CourseDifficulty> { CourseDifficulty.Intermediate },

                CourseDifficulty.Intermediate => new List<CourseDifficulty> { CourseDifficulty.Beginner },
                CourseDifficulty.Advanced => new List<CourseDifficulty> { CourseDifficulty.Intermediate },
                _ => new List<CourseDifficulty>()
            };
        }

        private List<CourseLength> GetAdjacentLengths(CourseLength length)
        {
            return length switch
            {
                CourseLength.Long => new List<CourseLength> { CourseLength.Medium },
                CourseLength.Medium => new List<CourseLength> { CourseLength.Short },
                _ => new List<CourseLength>()
            };
        }

        // CORE: Hybrid Search with LLM Profile
        public async Task<List<CourseRecommendationResult>> SearchWithLLMProfileAsync(
            UserPreferenceProfile profile,
            int topK = 30)
        {
            var user = _authService.GetCurrentUser();
            var schoolId = user?.SchoolId ?? 0;

            // Step 1: Tạo query text từ goal + topic (để embed)
            var queryText = _embeddingService.BuildQueryTextForEmbedding(profile);

            // Step 2: Tạo dense vector
            var denseVector = await _embeddingService.GetEmbeddingAsync(queryText);

            // Step 3: Map level to difficulty
            var targetDifficulty = MapLevelToDifficulty(profile.Level);
            var targetLength = MapPreferredLength(profile.PreferredLength);

            // Build filters
            var filters = new List<Func<QueryContainerDescriptor<ElasticCourse>, QueryContainer>>();

            filters.Add(f => f
                .Terms(t => t
                    .Field(fd => fd.SubjectName)
                    .Terms(profile.Subject)
                )
            );

            //// Filter Status
            filters.Add(f => f
                .Term(t => t
                    .Field(fd => fd.Status)
                    .Value("Mở") // hoặc profile.Status nếu có
                )
            );

            //// Filter SchoolId (null thì filter null)
            if (schoolId < 1)
            {
                filters.Add(f => f
                    .Bool(b => b
                        .MustNot(m => m
                            .Exists(e => e.Field(fd => fd.SchoolId))
                        )
                    )
                );
            }
            else
            {
                filters.Add(f => f
                    .Bool(b => b
                        .Should(
                            sh => sh.Term(t => t.Field(fd => fd.SchoolId).Value(schoolId)),
                            sh => sh.Bool(bb => bb.MustNot(m => m.Exists(e => e.Field(fd => fd.SchoolId))))
                        )
                        .MinimumShouldMatch(1)
                    )
                );
            }

            // Step 4: Build Elasticsearch Query
            var searchCourseResponse = await _client.SearchAsync<ElasticCourse>(s => s
                .Index(INDEX_NAME)
                .Size(topK * 2)
                .Query(q => q
                    .ScriptScore(ss => ss
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
                                        .Field(fd => fd.Information)
                                        .Query(string.Join(" ", profile.TopicKeywords))
                                        .Boost(2.0)
                                    ),
                                    // Match difficulty
                                    sh => sh.Term(t => t
                                        .Field(fd => fd.Difficulty)
                                        .Value(targetDifficulty)
                                        .Boost(1.5)
                                    ),
                                    // Match length
                                    sh => sh.Term(t => t
                                        .Field(fd => fd.Length)
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
                        .Script(sc => sc
                            .Source(@"
                                double vec = cosineSimilarity(params.queryVector, 'courseVector');
                                double vectorScore = Math.max(0.0, (vec + 1.0) / 2.0);
                                
                                double bm25 = _score;
                                double bm25Norm = bm25 > 0 ? Math.log(1 + bm25) / 5.0 : 0.0;

                                return (params.denseWeight * vectorScore) + (params.spareWeight * bm25Norm);
                            ")
                            .Params(p => p
                                .Add("queryVector", denseVector)
                                .Add("denseWeight", 0.7)
                                .Add("spareWeight", 0.3)
                            )

                        )
                    )
                )
            );

            // Step 5: Transform results
            var results = searchCourseResponse.Hits
                .Select(hit => new CourseRecommendationResult
                {
                    Id = hit.Source?.Id.ToString() ?? "",
                    Title = hit.Source?.Name ?? "",
                    Score = hit.Score ?? 0,
                    Subject = hit.Source?.SubjectName ?? "",
                    Difficulty = hit.Source?.Difficulty ?? "",
                    Length = hit.Source?.Length ?? "",
                    Information = hit.Source?.Information ?? "",
                    Grade = hit.Source?.Grade ?? 0
                })
                .Take(topK)
                .ToList();

            return results;
        }

        // Helper: Map level to difficulty
        private string MapLevelToDifficulty(string level)
        {
            return level?.ToLower() switch
            {
                "beginner" => "Beginner",
                "intermediate" => "Intermediate",
                "advanced" => "Advanced",
                _ => "Beginner"
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

        // Seed sample data cho test (20 khóa học đa dạng)
        public async Task<bool> SeedSampleCoursesAsync()
        {
            var courses = new List<Course>
        {
            // ===== TOÁN HỌC =====
            // Lớp 9 - Chuẩn bị thi vào 10
            new Course
            {
                Id = 101,
                Name = "Toán 9 - Phương trình bậc nhất và bậc hai",
                Information = "Khóa học chuyên sâu về phương trình bậc nhất một ẩn, phương trình bậc hai. Phù hợp cho học sinh chuẩn bị thi vào lớp 10. Bao gồm lý thuyết, bài tập và đề thi thử.",
                SchoolId = 1,
                Status = "Mở",
                Subject = new Subject { Name = "Toán học" },
                Difficulty = CourseDifficulty.Beginner,
                Length = CourseLength.Medium,
                Grade = 9
            },
            new Course
            {
                Id = 102,
                Name = "Toán 9 - Hệ phương trình và Bất phương trình",
                Information = "Giải hệ phương trình hai ẩn, bất phương trình bậc nhất. Kỹ năng giải nhanh cho kỳ thi vào 10. Có video giảng chi tiết và bài tập vận dụng cao.",
                SchoolId = 1,
                Status = "Mở",
                Subject = new Subject { Name = "Toán học" },
                Difficulty = CourseDifficulty.Intermediate,
                Length = CourseLength.Medium,
                Grade = 9
            },
            new Course
            {
                Id = 103,
                Name = "Toán 9 - Hình học: Đường tròn và Góc",
                Information = "Chuyên đề hình học lớp 9: tính chất đường tròn, góc nội tiếp, tiếp tuyến. Phù hợp củng cố kiến thức và luyện đề thi vào 10.",
                SchoolId = 1,
                Status = "Mở",
                Subject = new Subject { Name = "Toán học" },
                Difficulty = CourseDifficulty.Beginner,
                Length = CourseLength.Short,
                Grade = 9
            },
            // Lớp 10
            new Course
            {
                Id = 104,
                Name = "Toán 10 - Hàm số và Đồ thị",
                Information = "Khái niệm hàm số, tập xác định, tính chất. Vẽ và phân tích đồ thị hàm bậc nhất, bậc hai. Phù hợp học sinh mới lên lớp 10.",
                SchoolId = 1,
                Status = "Mở",
                Subject = new Subject { Name = "Toán học" },
                Difficulty = CourseDifficulty.Beginner,
                Length = CourseLength.Medium,
                Grade = 10
            },
            new Course
            {
                Id = 105,
                Name = "Toán 10 - Lượng giác nâng cao",
                Information = "Công thức lượng giác, phương trình lượng giác cơ bản và nâng cao. Dành cho học sinh muốn đạt điểm cao và thi học sinh giỏi.",
                SchoolId = 1,
                Status = "Mở",
                Subject = new Subject { Name = "Toán học" },
                Difficulty = CourseDifficulty.Advanced,
                Length = CourseLength.Long,
                Grade = 10
            },

            // ===== VẬT LÝ =====
            new Course
            {
                Id = 201,
                Name = "Vật lý 9 - Điện học cơ bản",
                Information = "Định luật Ohm, công suất điện, năng lượng điện. Giải bài tập mạch điện cho kỳ thi vào 10. Có thí nghiệm minh họa.",
                SchoolId = 1,
                Status = "Mở",
                Subject = new Subject { Name = "Vật lý" },
                Difficulty = CourseDifficulty.Beginner,
                Length = CourseLength.Medium,
                Grade = 9
            },
            new Course
            {
                Id = 202,
                Name = "Vật lý 9 - Quang học và Khúc xạ ánh sáng",
                Information = "Phản xạ ánh sáng, khúc xạ, thấu kính. Ứng dụng thực tế và bài tập thi vào 10.",
                SchoolId = 1,
                Status = "Mở",
                Subject = new Subject { Name = "Vật lý" },
                Difficulty = CourseDifficulty.Beginner,
                Length = CourseLength.Short,
                Grade = 9
            },
            new Course
            {
                Id = 203,
                Name = "Vật lý 10 - Động lực học",
                Information = "Các định luật Newton, lực ma sát, lực hướng tâm. Phân tích chuyển động và giải bài tập nâng cao.",
                SchoolId = 1,
                Status = "Mở",
                Subject = new Subject { Name = "Vật lý" },
                Difficulty = CourseDifficulty.Intermediate,
                Length = CourseLength.Long,
                Grade = 10
            },

            // ===== HÓA HỌC =====
            new Course
            {
                Id = 301,
                Name = "Hóa học 9 - Phi kim và Hợp chất",
                Information = "Tính chất hóa học của phi kim: Cl, S, N, P. Phản ứng hóa học và cân bằng phương trình. Chuẩn bị thi vào 10.",
                SchoolId = 1,
                Status = "Mở",
                Subject = new Subject { Name = "Hóa học" },
                Difficulty = CourseDifficulty.Beginner,
                Length = CourseLength.Medium,
                Grade = 9
            },
            new Course
            {
                Id = 302,
                Name = "Hóa học 9 - Kim loại và Dãy điện hóa",
                Information = "Tính chất kim loại: Fe, Al, Cu. Dãy hoạt động hóa học kim loại. Bài tập vận dụng cho kỳ thi.",
                SchoolId = 1,
                Status = "Mở",
                Subject = new Subject { Name = "Hóa học" },
                Difficulty = CourseDifficulty.Intermediate,
                Length = CourseLength.Short,
                Grade = 9
            },
            new Course
            {
                Id = 303,
                Name = "Hóa học 10 - Nguyên tử và Bảng tuần hoàn",
                Information = "Cấu tạo nguyên tử, cấu hình electron. Quy luật bảng tuần hoàn các nguyên tố hóa học.",
                SchoolId = 1,
                Status = "Mở",
                Subject = new Subject { Name = "Hóa học" },
                Difficulty = CourseDifficulty.Beginner,
                Length = CourseLength.Medium,
                Grade = 10
            },

            // ===== NGỮ VĂN =====
            new Course
            {
                Id = 401,
                Name = "Ngữ văn 9 - Phân tích văn bản nghị luận",
                Information = "Kỹ năng đọc hiểu và phân tích văn bản nghị luận. Viết bài văn nghị luận xã hội cho thi vào 10. Có bài mẫu và chữa bài.",
                SchoolId = 1,
                Status = "Mở",
                Subject = new Subject { Name = "Ngữ văn" },
                Difficulty = CourseDifficulty.Beginner,
                Length = CourseLength.Medium,
                Grade = 9
            },
            new Course
            {
                Id = 402,
                Name = "Ngữ văn 9 - Làm bài văn tự sự",
                Information = "Kỹ thuật viết văn tự sự, tả người, tả cảnh. Ôn tập tác phẩm trong sách giáo khoa lớp 9.",
                SchoolId = 1,
                Status = "Mở",
                Subject = new Subject { Name = "Ngữ văn" },
                Difficulty = CourseDifficulty.Beginner,
                Length = CourseLength.Short,
                Grade = 9
            },

            // ===== TIẾNG ANH =====
            new Course
            {
                Id = 501,
                Name = "Tiếng Anh 9 - Ngữ pháp cơ bản",
                Information = "Các thì trong tiếng Anh, câu điều kiện, mệnh đề quan hệ. Đủ kiến thức cho kỳ thi vào 10.",
                SchoolId = 1,
                Status = "Mở",
                Subject = new Subject { Name = "Tiếng Anh" },
                Difficulty = CourseDifficulty.Beginner,
                Length = CourseLength.Long,
                Grade = 9
            },
            new Course
            {
                Id = 502,
                Name = "Tiếng Anh 9 - Đọc hiểu nâng cao",
                Information = "Luyện kỹ năng đọc hiểu, từ vựng theo chủ đề. Phù hợp học sinh muốn đạt điểm cao.",
                SchoolId = 1,
                Status = "Mở",
                Subject = new Subject { Name = "Tiếng Anh" },
                Difficulty = CourseDifficulty.Intermediate,
                Length = CourseLength.Medium,
                Grade = 9
            },
            new Course
            {
                Id = 503,
                Name = "Tiếng Anh 10 - Giao tiếp và Viết luận",
                Information = "Kỹ năng giao tiếp tiếng Anh, viết email, bài luận. Từ vựng học thuật cho lớp 10.",
                SchoolId = 1,
                Status = "Mở",
                Subject = new Subject { Name = "Tiếng Anh" },
                Difficulty = CourseDifficulty.Intermediate,
                Length = CourseLength.Long,
                Grade = 10
            },

            // ===== LỊCH SỬ =====
            new Course
            {
                Id = 601,
                Name = "Lịch sử 9 - Lịch sử Việt Nam hiện đại",
                Information = "Cách mạng tháng 8, kháng chiến chống Pháp và Mỹ. Ôn tập cho kỳ thi vào 10.",
                SchoolId = 1,
                Status = "Mở",
                Subject = new Subject { Name = "Lịch sử" },
                Difficulty = CourseDifficulty.Beginner,
                Length = CourseLength.Medium,
                Grade = 9
            },

            // ===== ĐỊA LÝ =====
            new Course
            {
                Id = 701,
                Name = "Địa lý 9 - Địa lý Việt Nam",
                Information = "Địa hình, khí hậu, dân cư Việt Nam. Phân tích bản đồ và số liệu thống kê.",
                SchoolId = 1,
                Status = "Mở",
                Subject = new Subject { Name = "Địa lý" },
                Difficulty = CourseDifficulty.Beginner,
                Length = CourseLength.Short,
                Grade = 9
            },

            // ===== SINH HỌC =====
            new Course
            {
                Id = 801,
                Name = "Sinh học 9 - Di truyền học",
                Information = "Quy luật di truyền Mendel, NST và ADN. Giải bài tập di truyền cho kỳ thi.",
                SchoolId = 1,
                Status = "Mở",
                Subject = new Subject { Name = "Sinh học" },
                Difficulty = CourseDifficulty.Intermediate,
                Length = CourseLength.Medium,
                Grade = 9
            },

            // ===== GDCD =====
            new Course
            {
                Id = 901,
                Name = "GDCD 9 - Công dân và Pháp luật",
                Information = "Kiến thức về quyền và nghĩa vụ công dân, pháp luật cơ bản. Ôn thi vào 10.",
                SchoolId = 1,
                Status = "Mở",
                Subject = new Subject { Name = "GDCD" },
                Difficulty = CourseDifficulty.Beginner,
                Length = CourseLength.Short,
                Grade = 9
            }
        };

            // Generate embeddings
            var texts = courses.Select(c =>
                $"{c.Subject.Name} {c.Information}".ToLower()
            ).ToList();

            var embeddings = await _embeddingService.GetEmbeddingsBatchAsync(texts);

            // Index courses
            for (int i = 0; i < courses.Count; i++)
            {
                var course = courses[i];
                var document = new ElasticCourse
                {
                    Id = course.Id,
                    Name = course.Name,
                    Status = course.Status,
                    Information = course.Information ?? "",
                    SchoolId = course.SchoolId,
                    SubjectName = course.Subject.Name,
                    Difficulty = course.Difficulty.ToString(),
                    Length = course.Length.ToString(),
                    Grade = course.Grade,
                    CourseVector = embeddings[i],
                    SearchableText = texts[i]
                };

                await _client.IndexDocumentAsync(document);
            }

            await _client.Indices.RefreshAsync(INDEX_NAME);
            return true;
        }
    }

}
