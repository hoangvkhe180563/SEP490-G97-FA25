using Microsoft.Extensions.Configuration;
using Nest;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Dtos;
using StudyHub.Backend.UseCases.Utils;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.Domain.Entities.ElasticSearch;

namespace StudyHub.Backend.UseCases.Services
{
    public class ElasticCourseVectorSearchService
    {
        private readonly EmbeddingService _embeddingService;
        private readonly ICourseRepository courseRepository;
        private readonly AuthService _authService;
        private readonly IElasticSearchCourse _elasticSearchCourseRepository;

        public ElasticCourseVectorSearchService(EmbeddingService embeddingService, ICourseRepository courseRepository, AuthService authService, IElasticSearchCourse elasticSearchCourseRepository)
        {
            _embeddingService = embeddingService;
            this.courseRepository = courseRepository;
            _authService = authService;
            _elasticSearchCourseRepository = elasticSearchCourseRepository;
        }

        public async Task<bool> CreateCourseIndexAsync()
        {
            return await _elasticSearchCourseRepository.CreateCourseIndexAsync();
        }

        public async Task<bool> IndexCourseAsync(UpsertElasticCourseRequest course)
        {
            var domain = new Course
            {
                Id = course.Id,
                Name = course.Name,
                ImageUrl = course.ImageUrl,
                Price = course.Price,
                StartAt = course.StartAt,
                EndAt = course.EndAt,
                CreatedAt = course.CreatedAt,
                UpdatedAt = course.UpdatedAt,
                CreatedBy = course.CreatedById,
                Information = course.Information,
                Status = course.Status,
                SchoolId = course.SchoolId,
                Subject = course.Subject,
                Difficulty = course.Difficulty,
                Length = course.Length,
                Grade = course.Grade
            };

            var searchableText = _embeddingService.ConvertEmbeddingCourseToText(domain);
            var vector = await _embeddingService.GetEmbeddingAsync(searchableText);
            return await _elasticSearchCourseRepository.IndexCourseAsync(domain, searchableText, vector);
        }

        public async Task<bool> IndexCoursesBatchAsync(List<Course> courses)
        {
            var texts = courses.Select(c => _embeddingService.ConvertCourseToText(c)).ToList();

            var vectors = await _embeddingService.GetEmbeddingsBatchAsync(texts);

            return await _elasticSearchCourseRepository.IndexCoursesBatchAsync(courses, texts, vectors);
        }

        public async Task<bool> IndexAllCoursesFromDbAsync()
        {
            try
            {
                var query = new CourseQueryParams { Page = 1, PageSize = int.MaxValue };
                var paged = courseRepository.GetAllCourses(query);
                var courses = paged.Items ?? new List<Course>();

                if (courses.Count == 0)
                    return true;

                return await IndexCoursesBatchAsync(courses);
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> DeleteCourseByIdAsync(int id)
        {
            return await _elasticSearchCourseRepository.DeleteCourseByIdAsync(id);
        }



        public async Task<List<ElasticCourse>> RecommendCoursesAsync(
            UserLearningProfile profile,
            int topK = 30)
        {
            // Bước 1: Tính toán preferences cho từng môn
            var preferences = PreferenceUtils.CalculateCourseSubjectPreferences(profile);

            // Bước 2: Convert user profile to text và tạo vector
            var userText = _embeddingService.ConvertUserProfileToCourseText(profile, preferences);
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
                var adjacentDifficulties = GetAdjacentCourseDifficulties(pref.PreferredDifficulty);
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
                var adjacentLongs = GetAdjacentCourseLengths(pref.PreferredLength);
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

            return await _elasticSearchCourseRepository.RecommendCoursesAsync(
                            filters,
                            shouldQueries,
                            userVector,
                            topK
            );
        }

        public async Task<List<CourseRecommendationResult>> SearchCourseWithLLMProfileAsync(
            float[] denseVector,
            UserPreferenceProfile profile,
            int topK = 30)
        {
            var user = _authService.GetCurrentUser();
            var schoolId = user?.SchoolId ?? 0;

            var targetDifficulty = MapLevelToCourseDifficulty(profile.CourseLevel);
            var targetLength = MapPreferredLength(profile.PreferredLength);

            var filters = new List<Func<QueryContainerDescriptor<ElasticCourse>, QueryContainer>>();

            filters.Add(f => f
                .Terms(t => t
                    .Field(fd => fd.SubjectName)
                    .Terms(profile.Subject)
                )
            );

            filters.Add(f => f
                .Term(t => t
                    .Field(fd => fd.Status)
                    .Value("Mở")
                )
            );

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

            var searchCourseResponse = await _elasticSearchCourseRepository.SearchCourseWithLLMProfileAsync(
                denseVector,
                profile,
                filters,
                targetDifficulty,
                targetLength,
                topK
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

        private List<CourseDifficulty> GetAdjacentCourseDifficulties(CourseDifficulty difficulty)
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

        private List<CourseLength> GetAdjacentCourseLengths(CourseLength length)
        {
            return length switch
            {
                CourseLength.Long => new List<CourseLength> { CourseLength.Medium },
                CourseLength.Medium => new List<CourseLength> { CourseLength.Short },
                _ => new List<CourseLength>()
            };
        }



        // Helper: Map level to difficulty
        private string MapLevelToCourseDifficulty(string level)
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
            //var texts = courses.Select(c =>
            //    $"{c.Subject.Name} {c.Information}".ToLower()
            //).ToList();
            // Convert to texts and generate embeddings
            var texts = courses.Select(c => _embeddingService.ConvertCourseToText(c)).ToList();
            var embeddings = await _embeddingService.GetEmbeddingsBatchAsync(texts);

            return _elasticSearchCourseRepository.IndexCoursesBatchAsync(courses, texts, embeddings).Result;
        }
    }

}
