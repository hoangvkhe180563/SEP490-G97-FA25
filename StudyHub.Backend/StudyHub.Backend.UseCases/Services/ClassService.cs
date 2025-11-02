using Microsoft.AspNetCore.Http;
using StudyHub.Backend.Api.Services;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Utils;
using System.Net;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace StudyHub.Backend.UseCases.Services
{
    public class ClassService
    {
        private readonly IClassRepository _classRepository;
        private readonly ICloudinaryRepository _fileStorage;
        private readonly IAppUserRepository _userRepository;
        private readonly IEmailService _emailService;

        public ClassService(IClassRepository classRepository, ICloudinaryRepository fileStorage, IAppUserRepository userRepository, IEmailService emailService)
        {
            _classRepository = classRepository;
            _fileStorage = fileStorage;
            _userRepository = userRepository;
            _emailService = emailService;
        }

        // --- Classes listing with filtering + paging ---
        // Returns domain Class list and paging metadata; no Api DTOs used here.
        public (List<Class> Classes, int TotalItems, int Page, int Limit, int TotalPages) GetClassesPaged(string? query, string? status, Guid? memberid, int page = 1, int limit = 10)
        {
            var allClasses = _classRepository.GetAllClasses(memberid);

            var filtered = allClasses
                .Where(c => (string.IsNullOrEmpty(query) || c.Name.Contains(query, StringComparison.OrdinalIgnoreCase)) && c.DeletedAt == null)
                .ToList();

            int totalItems = filtered.Count;
            int totalPages = (int)Math.Ceiling((double)totalItems / Math.Max(1, limit));
            page = Math.Max(1, Math.Min(page, Math.Max(1, totalPages)));

            var paged = filtered.Skip((page - 1) * limit).Take(limit).ToList();

            return (paged, totalItems, page, limit, totalPages);
        }
        public List<Class> GetClassByUserId(Guid userid)
        {
            var allClasses = _classRepository.GetAllClasses(userid);
            return allClasses;
        }
        public List<Subject> GetSubjects() => _classRepository.GetAllSubject();
        public List<AppUser> GetTeachers() => _classRepository.GetAllTeacher();

        public Class CreateClass(Class dto)
        {
            var entity = new Class
            {
                Name = dto.Name.Trim(),
                Description = dto.Description,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = dto.CreatedBy
            };

            return _classRepository.CreateClass(entity);
        }

        public Class UpdateClass(Class dto) => _classRepository.UpdateClass(dto);

       
        public Class? UpdateClassFromPrimitives(int id, string? name, string? description, Guid? updatedBy)
        {
            var existing = _classRepository.GetClassById(id);
            if (existing == null) return null;
            if (!string.IsNullOrWhiteSpace(name)) existing.Name = name;
            existing.Description = description;
            existing.UpdatedAt = DateTime.UtcNow;
            existing.UpdatedBy = updatedBy;
            return _classRepository.UpdateClass(existing);
        }

        public Class GetClassById(int id) => _classRepository.GetClassById(id);
        public Class? GetClassDetail(int id) => _classRepository.GetClassDetailById(id);
        public List<AppUserSubjectClass> GetClassMembers(int id) => _classRepository.GetClassMembers(id);
        public List<ClassNotification> GetClassNotifications(int classId) => _classRepository.GetClassNotifications(classId);
        public List<ClassNotificationComment> GetCommentsByNotificationId(int notificationId) => _classRepository.GetCommentsByNotificationId(notificationId);
        public List<ClassNotificationFile> GetFileByNotificationId(int notificationid) => _classRepository.GetFileByNotificationId(notificationid);

        // DTO helper for Links JSON (domain-level)
        public class LinkItem
        {
            [JsonPropertyName("title")]
            public string? Title { get; set; }

            [JsonPropertyName("url")]
            public string? Url { get; set; }
        }

        // Create notification + handle uploaded files and link-json files
        // Accept domain ClassNotification + IFormFile list + linksJson string; no Api DTO referenced.
        public async Task<ClassNotification?> CreateNotificationWithFilesAsync(ClassNotification notification, List<IFormFile>? files, string? linksJson)
        {
            if (notification == null) throw new ArgumentException("notification is required");
            if (string.IsNullOrWhiteSpace(notification.Title)) throw new ArgumentException("Tiêu đề không được để trống.");
            if (notification.ClassId <= 0) throw new ArgumentException("ClassId không hợp lệ.");

            var createdNoti = _classRepository.CreateNotification(notification);
            if (createdNoti == null) return null;

            var jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

            // Process multipart files (files may be JSON with links or real uploads)
            if (files != null && files.Any())
            {
                foreach (var formFile in files)
                {
                    if (formFile == null || formFile.Length == 0) continue;

                    var fn = formFile.FileName ?? "";
                    var fnLower = fn.ToLowerInvariant();

                    var looksLikeJson =
                        (!string.IsNullOrWhiteSpace(formFile.ContentType) && formFile.ContentType.Contains("application/json", StringComparison.OrdinalIgnoreCase))
                        || fnLower.StartsWith("link-")
                        || fnLower.EndsWith(".json");

                    if (looksLikeJson)
                    {
                        try
                        {
                            using var sr = new StreamReader(formFile.OpenReadStream());
                            var txt = await sr.ReadToEndAsync();
                            if (!string.IsNullOrWhiteSpace(txt))
                            {
                                // try array
                                try
                                {
                                    var arr = JsonSerializer.Deserialize<List<LinkItem>>(txt, jsonOptions);
                                    if (arr != null && arr.Count > 0)
                                    {
                                        foreach (var li in arr)
                                        {
                                            if (string.IsNullOrWhiteSpace(li?.Url)) continue;
                                            _classRepository.CreateSubmissionFile(new ClassNotificationFile
                                            {
                                                NotificationId = createdNoti.Id,
                                                FileName = !string.IsNullOrWhiteSpace(li.Title) ? li.Title : li.Url,
                                                FileUrl = li.Url
                                            });
                                        }
                                        continue;
                                    }
                                }
                                catch { }

                                // try single
                                try
                                {
                                    var single = JsonSerializer.Deserialize<LinkItem>(txt, jsonOptions);
                                    if (single != null && !string.IsNullOrWhiteSpace(single.Url))
                                    {
                                        _classRepository.CreateSubmissionFile(new ClassNotificationFile
                                        {
                                            NotificationId = createdNoti.Id,
                                            FileName = !string.IsNullOrWhiteSpace(single.Title) ? single.Title : single.Url,
                                            FileUrl = single.Url
                                        });
                                        continue;
                                    }
                                }
                                catch { }

                                var raw = txt.Trim();
                                if (raw.StartsWith("http://", StringComparison.OrdinalIgnoreCase) || raw.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
                                {
                                    _classRepository.CreateSubmissionFile(new ClassNotificationFile
                                    {
                                        NotificationId = createdNoti.Id,
                                        FileName = raw,
                                        FileUrl = raw
                                    });
                                    continue;
                                }
                            }
                        }
                        catch
                        {
                        }
                    }

                    try
                    {
                        var uploadedUrl = await _fileStorage.UploadFileAsync(formFile, FileConstants.ClassNotificationUploadPAth);
                        if (!string.IsNullOrWhiteSpace(uploadedUrl))
                        {
                            _classRepository.CreateSubmissionFile(new ClassNotificationFile
                            {
                                NotificationId = createdNoti.Id,
                                FileName = formFile.FileName,
                                FileUrl = uploadedUrl
                            });
                        }
                    }
                    catch
                    {
                    }
                }
            }

            if (!string.IsNullOrWhiteSpace(linksJson))
            {
                try
                {
                    var raw = linksJson.Trim();
                    if (raw.StartsWith("["))
                    {
                        var links = JsonSerializer.Deserialize<List<LinkItem>>(raw, jsonOptions);
                        if (links != null)
                        {
                            foreach (var l in links)
                            {
                                if (string.IsNullOrWhiteSpace(l?.Url)) continue;
                                _classRepository.CreateSubmissionFile(new ClassNotificationFile
                                {
                                    NotificationId = createdNoti.Id,
                                    FileName = !string.IsNullOrWhiteSpace(l.Title) ? l.Title : l.Url,
                                    FileUrl = l.Url
                                });
                            }
                        }
                    }
                    else
                    {
                        var single = JsonSerializer.Deserialize<LinkItem>(raw, jsonOptions);
                        if (single != null && !string.IsNullOrWhiteSpace(single.Url))
                        {
                            _classRepository.CreateSubmissionFile(new ClassNotificationFile
                            {
                                NotificationId = createdNoti.Id,
                                FileName = !string.IsNullOrWhiteSpace(single.Title) ? single.Title : single.Url,
                                FileUrl = single.Url
                            });
                        }
                    }
                }
                catch
                {
                    // ignore parsing errors
                }
            }

            return createdNoti;
        }

        // Invite flow moved to service. Accept simple primitives (no Api DTOs) so use-cases project doesn't reference Api project.
        public async Task<List<object>> InviteByEmailsAsync(int classId, List<string> emails, string role, string? message, string baseFrontendUrl)
        {
            var cls = _classRepository.GetClassById(classId);
            if (cls == null) throw new ArgumentException("Không tìm thấy lớp học.");

            if (emails == null || emails.Count == 0)
                throw new ArgumentException("Cần cung cấp ít nhất một email để mời.");

            var results = new List<object>();

            foreach (var raw in emails.Select(e => e?.Trim()).Where(e => !string.IsNullOrWhiteSpace(e)).Distinct(StringComparer.OrdinalIgnoreCase))
            {
                var email = raw!;
                var user = _userRepository.GetByEmail(email);

                if (user != null)
                {
                    var invited = _classRepository.InviteMember(user.Id, classId);
                    var acceptUrl = $"{baseFrontendUrl}/class/{role.ToLower()}/{classId}/invite/confirm";
                    try
                    {
                        await _emailService.SendClassInvitationEmailAsync(email, cls.Name ?? "Class", acceptUrl, inviterName: _userRepository.GetById(cls.CreatedBy)?.Fullname ?? "", customMessage: message);
                    }
                    catch
                    {
                        // swallow email errors
                    }
                    results.Add(new { email, existingAccount = true, invited });
                }
                else
                {
                    var registerUrl = $"{baseFrontendUrl}/register?email={WebUtility.UrlEncode(email)}&redirect=/class/{classId}";
                    try
                    {
                        await _emailService.SendClassInvitationEmailAsync(email, cls.Name ?? "Class", registerUrl, inviterName: _userRepository.GetById(cls.CreatedBy)?.Fullname ?? "", customMessage: message);
                    }
                    catch
                    {
                    }
                    results.Add(new { email, existingAccount = false, invited = false });
                }
            }

            return results;
        }

        // Helpers for confirm/kick with string parsing (controller can call these)
        public bool? ConfirmMemberFromString(int classId, string userId)
        {
            if (!Guid.TryParse(userId, out var userGuid)) return null;
            var cls = _classRepository.GetClassById(classId);
            if (cls == null) return false;
            return _classRepository.ConfirmMember(userGuid, classId);
        }

        public bool? KickMemberFromString(int classId, string userId)
        {
            if (!Guid.TryParse(userId, out var userGuid)) return null;
            var cls = _classRepository.GetClassById(classId);
            if (cls == null) return false;  
            return _classRepository.KickMember(userGuid, classId);
        }

        public ClassNotificationComment CreateNotificationComment(ClassNotificationComment commentEntity)
        {
            return _classRepository.CommentNoti(commentEntity);
        }

        public bool DeleteNotificationById(int notificationId)
        {
            var existing = _classRepository.GetNotificationByID(notificationId);
            if (existing == null) return false;
            return _classRepository.DeleteNotification(notificationId);
        }

        public ClassNotification GetNotificationByID(int notificationid) => _classRepository.GetNotificationByID(notificationid);
        public bool deleteNoti(int notificationid) => _classRepository.DeleteNotification(notificationid);
        public bool InviteMember(Guid userId, int classId) => _classRepository.InviteMember(userId, classId);
        public bool ConfirmMember(Guid userId, int classId) => _classRepository.ConfirmMember(userId, classId);
        public bool KickMember(Guid userId, int classId) => _classRepository.KickMember(userId, classId);

        // --- Classwork / Submission flow ---
        public List<Classwork> GetClassworks(int classId) => _classRepository.GetClassworks(classId);
        public Classwork CreateClasswork(Classwork classwork) => _classRepository.CreateClasswork(classwork);

        public Classwork EditClasswork(Classwork classwork) => _classRepository.EditClasswork(classwork);

        // Controller will map DTO -> primitives and call this method.
        public Classwork? EditClassworkFromPrimitives(int id, string? title, string? description, DateTime? deadline)
        {
            var cw = _classRepository.GetClasswork(id);
            if (cw == null) return null;
            if (!string.IsNullOrWhiteSpace(title)) cw.Title = title;
            cw.Description = description;
            cw.Deadline = deadline;
            return _classRepository.EditClasswork(cw);
        }

        public Classwork GetClasswork(int classworkId) => _classRepository.GetClasswork(classworkId);

        public (Classwork Classwork, List<ClassworkSubmission> Submissions)? GetClassworkDetail(int id)
        {
            var cw = _classRepository.GetClasswork(id);
            if (cw == null) return null;
            var submissions = _classRepository.GetSubmissionsByClassworkId(id);
            return (cw, submissions);
        }

        // Submit classwork with files: encapsulate submission lifecycle and file uploads
        // Accept simple primitives to avoid referencing Api DTOs in use-cases project
        public async Task<(int SubmissionId, List<SubmissionFile> Files, bool IsResubmit)?> SubmitClassworkWithFilesAsync(int classworkId, string? appUserId, List<IFormFile>? files)
        {
            if (string.IsNullOrWhiteSpace(appUserId)) throw new ArgumentException("Thiếu thông tin user");
            if (!Guid.TryParse(appUserId, out var userId)) throw new ArgumentException("AppUserId không hợp lệ");

            var existingSubmission = _classRepository.GetSubmissionByUserAndClasswork(classworkId, userId);

            ClassworkSubmission submission;
            bool isResubmit = false;

            if (existingSubmission == null)
            {
                submission = new ClassworkSubmission
                {
                    ClassworkId = classworkId,
                    AppUserId = userId,
                    FirstSubmissionTime = DateTime.UtcNow,
                    LatestSubmissionTime = DateTime.UtcNow
                };
                submission = _classRepository.SubmitClasswork(submission, new List<SubmissionFile>());
            }
            else
            {
                submission = existingSubmission;
                submission.LatestSubmissionTime = DateTime.UtcNow;
                _classRepository.ResubmitClasswork(submission.Id, new List<SubmissionFile>());
                isResubmit = true;
            }

            var filesAdded = new List<SubmissionFile>();

            if (files != null && files.Any())
            {
                foreach (var formFile in files)
                {
                    if (formFile == null || formFile.Length == 0) continue;

                    try
                    {
                        var uploaded = await _fileStorage.UploadFileAsync(formFile, FileConstants.ClassNotificationUploadPAth);
                        if (!string.IsNullOrWhiteSpace(uploaded))
                        {
                            var fileEntity = new SubmissionFile
                            {
                                SubmissionId = submission.Id,
                                FileName = formFile.FileName,
                                FileUrl = uploaded
                            };
                            _classRepository.AddSubmissionFile(fileEntity);
                            filesAdded.Add(fileEntity);
                        }
                    }
                    catch
                    {
                        // continue with other files
                    }
                }
            }

            return (submission.Id, filesAdded, isResubmit);
        }

        public ClassworkSubmission SubmitClasswork(ClassworkSubmission submission, List<SubmissionFile> files) => _classRepository.SubmitClasswork(submission, files);
        public ClassworkSubmission ResubmitClasswork(int submissionId, List<SubmissionFile> files) => _classRepository.ResubmitClasswork(submissionId, files);
        public ClassworkSubmission GetSubmissionByUserAndClasswork(int classworkId, Guid userId) => _classRepository.GetSubmissionByUserAndClasswork(classworkId, userId);
        public SubmissionFile AddSubmissionFile(SubmissionFile file) => _classRepository.AddSubmissionFile(file);
        public List<SubmissionFile> GetSubmissionFiles(int submissionId) => _classRepository.GetSubmissionFiles(submissionId);

        public int GetMemberCount(int classworkId) => _classRepository.GetMemberCount(classworkId);
        public int GetSubmissionCount(int classworkId) => _classRepository.GetSubmissionCount(classworkId);
        public int GetMemberClassCount(int classID) => _classRepository.GetMemberClassCount(classID);

        
    }
}