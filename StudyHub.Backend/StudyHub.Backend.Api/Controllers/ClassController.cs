using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.Api.Dtos;
using StudyHub.Backend.Api.Dtos.ClassDTOS;
using StudyHub.Backend.Api.Dtos.ClassworkDTOS;
using StudyHub.Backend.Api.Mappers;
using StudyHub.Backend.Api.Services;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Services;
using System.Collections.Generic;
using System.Net;
using System.Text.Json;

namespace StudyHub.Backend.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ClassController : ControllerBase
    {
        private readonly ClassService _service;
        private readonly AppUserService _aUserService;
        private readonly AppRoleService _aRoleService;
        private readonly LocationService _locationService;
        private readonly IConfiguration _config;
        private readonly IEmailService _emailService;


        public ClassController(ClassService service, AppUserService aUserService, AppRoleService aRoleService, LocationService locationService,IEmailService emailService, IConfiguration config)
        {
            _service = service;
            _aUserService = aUserService;
            _aRoleService = aRoleService;
            _locationService = locationService;
            _emailService = emailService;
            _config = config;
        }

        [HttpGet]
        public IActionResult GetClasses(
         [FromQuery] string? query,
         [FromQuery] string? subject,
         [FromQuery] string? status,
         [FromQuery] Guid? memberid,
         [FromQuery] int page = 1,
         [FromQuery] int limit = 10
     )
        {

            var allClasses = _service.GetClasses(memberid);

            var filteredClasses = allClasses

                .Where(c => string.IsNullOrEmpty(query) || c.Name.Contains(query, StringComparison.OrdinalIgnoreCase) && c.DeletedAt == null)

                .ToList();


            int totalItems = filteredClasses.Count;
            int totalPages = (int)Math.Ceiling((double)totalItems / limit);


            page = Math.Max(1, Math.Min(page, totalPages));


            var pagedClasses = filteredClasses
                .Skip((page - 1) * limit)
                .Take(limit)
                .ToList();


            var allSubjects = _service.GetSubjects().ToDictionary(s => s.Id);
            var allTeachers = _service.GetTeachers().ToDictionary(u => u.Id);

            var classListDtos = pagedClasses.Select(c =>
            {
                Subject? subjectEntity = null;
                if (c.SubjectId.HasValue)
                {
                    allSubjects.TryGetValue(c.SubjectId.Value, out subjectEntity);
                }

                allTeachers.TryGetValue(c.CreatedBy, out AppUser? teacher);

                return c.ToListClassDto(teacher, subjectEntity);
            }).ToList();


            var response = new
            {
                success = true,
                message = "Danh sách lớp học được tải thành công.",
                classes = subject != null ? classListDtos.Where(c => c.SubjectName.Contains(subject, StringComparison.OrdinalIgnoreCase)) : classListDtos,
                meta = new
                {
                    total = totalItems,
                    page = page,
                    limit = limit,
                    totalPages = totalPages
                }
            };

            return Ok(response);
        }
        [HttpPost]
        public IActionResult CreateClass([FromBody] CreateClassDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest(new { success = false, message = "Tên lớp học không được để trống." });

            var createdClass = _service.CreateClass(dto.ToEntity());
            return CreatedAtAction(nameof(GetClasses), new { id = createdClass.Id }, createdClass.ToDetailDto());
        }
        [HttpGet("Subject")]
        public IActionResult GetSubject()
        {
            return Ok(_service.GetSubjects());
        }
        [HttpPut("{id}")]
        public IActionResult Update(int id, [FromBody] EditClassDto dto)
        {
            var existing = _service.GetClassById(id);
            if (existing == null) return NotFound();
            existing.Name = dto.Name;
            existing.Description = dto.Description;
            existing.SubjectId = dto.SubjectId;
            var updated = _service.UpdateClass(existing);
            return Ok(updated.ToDetailDto());
        }
        [HttpGet("{id}/members")]
        public IActionResult GetClassMembers(int id)
        {
            var cls = _service.GetClassById(id);
            if (cls == null)
                return NotFound(new { success = false, message = "Không tìm thấy lớp học." });

            var members = _service.GetClassMembers(id)
                 .Select(m =>
                 {
                     var roles = _aRoleService.GetRolesByUser(m.UserId)
                                              .Where(r => !string.IsNullOrEmpty(r.Name))
                                              .Select(r => r.Name!)
                                              .ToList();

                     var user = _aUserService.GetUserById(m.UserId);

                     var school = (user?.SchoolId).HasValue
                         ? _locationService.GetSchoolById(user!.SchoolId.Value)
                         : null;

                     var commune = (user?.CommuneId).HasValue
                         ? _locationService.GetCommuneById(user!.CommuneId.Value)
                         : null;

                     return m.ToMemberDto(user, roles, school, commune);
                 })
                    .ToList();

            return Ok(new
            {
                success = true,
                message = "Lấy danh sách thành viên thành công.",
                data = members
            });
        }

        
        [HttpGet("{id}/detail")]
        public IActionResult GetClassDetail(int id)
        {
            var cls = _service.GetClassById(id);
            if (cls == null)
                return NotFound(new { success = false, message = "Không tìm thấy lớp học." });
                        
            var notifications = _service.GetClassNotifications(id)
                .Select(n =>
                {
                    var files = _service.GetFileByNotificationId(n.Id);
                    var comments = _service.GetCommentsByNotificationId(n.Id);

                    return n.ToNotificationDto(
                        _aUserService.GetUserById(n.AppUserId),
                        files.Select(f => f.ToFileDto()).ToList(),
                        comments.Select(c => c.ToCommentDto(_aUserService.GetUserById(c.AppUserId))).ToList()
                    );
                })
                .ToList();

           
            var dto = cls.ToFullDetailDto( notifications);

            return Ok(new
            {
                success = true,
                message = "Lấy thông tin lớp học thành công.",
                data = dto
            });
        }

        [HttpGet("{classId}/notifications")]
        public IActionResult GetNotificationsByClass(int classId)
        {
            var notifications = _service.GetClassNotifications(classId)
                .Select(n => n.ToNotificationDto())
                .ToList();

            return Ok(new
            {
                success = true,
                message = "Lấy danh sách thông báo thành công.",
                data = notifications
            });
        }

        [HttpGet("notification/{notificationId}/comments")]
        public IActionResult GetCommentsByNotification(int notificationId)
        {
            var comments = _service.GetCommentsByNotificationId(notificationId)
                .Select(c => c.ToCommentDto(_aUserService.GetUserById(c.AppUserId)))
                .ToList();

            return Ok(new
            {
                success = true,
                message = "Lấy danh sách bình luận thành công.",
                data = comments
            });
        }

        [HttpPost("notifications")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> CreateNotification([FromForm] CreateNotificationDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.Title))
                    return BadRequest(new { success = false, message = "Tiêu đề không được để trống." });

                if (dto.ClassId <= 0)
                    return BadRequest(new { success = false, message = "ClassId không hợp lệ." });

                var notificationEntity = new ClassNotification
                {
                    ClassId = dto.ClassId,
                    Title = dto.Title.Trim(),
                    Description = dto.Description?.Trim() ?? "",
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = dto.CreatedBy,
                    AppUserId = dto.CreatedBy
                };

                var createdNoti = _service.CreateNotification(notificationEntity);

                if (createdNoti == null)
                {
                    return StatusCode(500, new { success = false, message = "Không tạo được thông báo." });
                }

                var jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

                if (dto.Files != null && dto.Files.Any())
                {
                    foreach (var formFile in dto.Files)
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
                                    try
                                    {
                                        var arr = JsonSerializer.Deserialize<List<LinkItem>>(txt, jsonOptions);
                                        if (arr != null && arr.Count > 0)
                                        {
                                            foreach (var li in arr)
                                            {
                                                if (string.IsNullOrWhiteSpace(li?.Url)) continue;
                                                _service.CreateFile(new ClassNotificationFile
                                                {
                                                    NotificationId = createdNoti.Id,
                                                    FileName = !string.IsNullOrWhiteSpace(li.Title) ? li.Title : li.Url,
                                                    FileUrl = li.Url
                                                });
                                            }
                                            continue; 
                                        }
                                    }
                                    catch
                                    {
                                    }

                                    try
                                    {
                                        var single = JsonSerializer.Deserialize<LinkItem>(txt, jsonOptions);
                                        if (single != null && !string.IsNullOrWhiteSpace(single.Url))
                                        {
                                            _service.CreateFile(new ClassNotificationFile
                                            {
                                                NotificationId = createdNoti.Id,
                                                FileName = !string.IsNullOrWhiteSpace(single.Title) ? single.Title : single.Url,
                                                FileUrl = single.Url
                                            });
                                            continue;
                                        }
                                    }
                                    catch
                                    {
                                    }

                                    var raw = txt.Trim();
                                    if (raw.StartsWith("http://", StringComparison.OrdinalIgnoreCase) || raw.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
                                    {
                                        _service.CreateFile(new ClassNotificationFile
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
                            var uploaded = await _service.UploadFileToCloudinary(formFile);
                            if (uploaded != null)
                            {
                                _service.CreateFile(new ClassNotificationFile
                                {
                                    NotificationId = createdNoti.Id,
                                    FileName = formFile.FileName,
                                    FileUrl = uploaded.ToString()
                                });
                            }
                        }
                        catch
                        {
                        }
                    }
                }

                if (!string.IsNullOrWhiteSpace(dto.LinksJson))
                {
                    try
                    {
                        var raw = dto.LinksJson.Trim();
                        if (raw.StartsWith("["))
                        {
                            var links = JsonSerializer.Deserialize<List<LinkItem>>(raw, jsonOptions);
                            if (links != null)
                            {
                                foreach (var l in links)
                                {
                                    if (string.IsNullOrWhiteSpace(l?.Url)) continue;
                                    _service.CreateFile(new ClassNotificationFile
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
                                _service.CreateFile(new ClassNotificationFile
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
                    }
                }

                return Ok(new
                {
                    success = true,
                    message = "Tạo thông báo thành công.",
                    data = createdNoti
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = $"Lỗi server: {ex.Message}",
                    error = ex.ToString()
                });
            }
        }

        public class CreateCommentDto
        {
            public string Content { get; set; } = string.Empty; // HTML allowed
            public Guid CreatedBy { get; set; } // optional if you use auth, but keep for now
        }

        [HttpPost("notifications/{notificationId}/comments")]
        public async Task<IActionResult> AddCommentToNotification([FromRoute] int notificationId, [FromBody] CreateCommentDto dto)
        {
            try
            {
                if (notificationId <= 0)
                    return BadRequest(new { success = false, message = "Invalid notificationId." });

                if (string.IsNullOrWhiteSpace(dto.Content))
                    return BadRequest(new { success = false, message = "Content cannot be empty." });

                // Create entity (adjust ClassNotificationComment to your entity name)
                var commentEntity = new ClassNotificationComment
                {
                    NotificationId = notificationId,
                    Content = dto.Content.Trim(),
                    CreatedAt = DateTime.UtcNow,
                    AppUserId = dto.CreatedBy
                };

                // Save via service. Adjust method name as your service implements
                var created = _service.CreateNotificationComment(commentEntity);

                if (created == null)
                    return StatusCode(500, new { success = false, message = "Unable to create comment." });

                // Return created comment (shape: id, notificationId, content, createdBy, createdAt, userFullname/avatar optional)
                var response = new
                {
                    id = created.Id,
                    notificationId = created.NotificationId,
                    content = created.Content,
                    createdBy = created.AppUserId,
                    createdAt = created.CreatedAt,
                    userFullname = _aUserService.GetUserById(created.AppUserId).Fullname ?? "", // if your entity/service populates this
                    avatarUrl = _aUserService.GetUserById(created.AppUserId).Avatar ?? ""
                };

                return Ok(new { success = true, message = "Comment added", data = response });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Server error: {ex.Message}", error = ex.ToString() });
            }
        }

        [HttpDelete("notifications/{notificationId}")]
        public async Task<IActionResult> DeleteNotic(int notificationId)
        {
            try
            {
                var noti = _service.GetNotificationByID(notificationId);
                if (noti == null)
                {
                    return NotFound(new { success = false, message = "Notification not found" });
                }

                var issucessed = _service.deleteNoti(notificationId);
                if (issucessed)
                {
                    return Ok(new { success = true, message = "Deleted notification" });
                }
                else
                {
                    return StatusCode(500, new { success = false, message = "Không xoá được", error = "Không xoá được" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Server error: {ex.Message}", error = ex.ToString() });
            }
        }
        [HttpPost("{id}/invite")]
        public async Task<IActionResult> InviteByEmails(int id, [FromBody] InviteRequest request)
        {
            try
            {
                var cls = _service.GetClassById(id);
                if (cls == null)
                    return NotFound(new { success = false, message = "Không tìm thấy lớp học." });

                if (request?.Emails == null || request.Emails.Count == 0)
                    return BadRequest(new { success = false, message = "Cần cung cấp ít nhất một email để mời." });

                var results = new List<object>();
                var baseFrontendUrl = _config["App:BaseUrl"]?.TrimEnd('/') ?? $"{Request.Scheme}://{Request.Host}";

                foreach (var raw in request.Emails.Select(e => e?.Trim()).Where(e => !string.IsNullOrWhiteSpace(e)).Distinct(StringComparer.OrdinalIgnoreCase))
                {
                    var email = raw!;
                    // Try find user by email via AppUserService
                    var user = _aUserService.GetUserByEmail(email);

                    if (user != null)
                    {
                        // Existing user: create/update class_members with status = 'invited'
                        var invited = _service.InviteMember(user.Id, id);
                        
                        // Build frontend accept URL (frontend should call confirm)
                        var acceptUrl = $"{baseFrontendUrl}/class/{request.Role.ToLower()}/{id}/invite/confirm";

                        // send invitation email (only here)
                        await _emailService.SendClassInvitationEmailAsync(email, cls.Name ?? "Class", acceptUrl, inviterName: _aUserService.GetUserById(cls.CreatedBy)?.Fullname ?? "", customMessage: request.Message);

                        results.Add(new { email, existingAccount = true, invited });
                    }
                    else
                    {
                        // No user: send invitation encouraging registration (only here)
                        var registerUrl = $"{baseFrontendUrl}/register?email={WebUtility.UrlEncode(email)}&redirect=/class/{id}";
                        await _emailService.SendClassInvitationEmailAsync(email, cls.Name ?? "Class", registerUrl, inviterName: _aUserService.GetUserById(cls.CreatedBy)?.Fullname ?? "", customMessage: request.Message);
                        results.Add(new { email, existingAccount = false, invited = false });
                    }
                }

                return Ok(new { success = true, message = "Đã gửi lời mời.", data = results });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Lỗi khi gửi lời mời: {ex.Message}", error = ex.ToString() });
            }
        }

        /// <summary>
        /// Confirm (accept) the invitation for a specific userId and classId.
        /// This endpoint will set class_members.status = 'joined' and set JoinDate if invite existed or create new record.
        /// </summary>
        [HttpPost("{id}/members/{userId}/confirm")]
        public IActionResult ConfirmMember(int id, string userId)
        {
            try
            {
                if (!Guid.TryParse(userId, out var userGuid))
                    return BadRequest(new { success = false, message = "UserId không hợp lệ." });

                var cls = _service.GetClassById(id);
                if (cls == null)
                    return NotFound(new { success = false, message = "Không tìm thấy lớp học." });

                var ok = _service.ConfirmMember(userGuid, id);
                if (!ok)
                    return StatusCode(500, new { success = false, message = "Không thể xác nhận thành viên." });

                return Ok(new { success = true, message = "Thành viên đã được xác nhận (joined)." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Lỗi khi xác nhận: {ex.Message}", error = ex.ToString() });
            }
        }

        /// <summary>
        /// Kick a member from class (set status = 'kicked').
        /// </summary>
        [HttpPost("{id}/members/{userId}/kick")]
        public IActionResult KickMember(int id, string userId)
        {
            try
            {
                if (!Guid.TryParse(userId, out var userGuid))
                    return BadRequest(new { success = false, message = "UserId không hợp lệ." });

                var cls = _service.GetClassById(id);
                if (cls == null)
                    return NotFound(new { success = false, message = "Không tìm thấy lớp học." });

                var ok = _service.KickMember(userGuid, id);
                if (!ok)
                    return StatusCode(500, new { success = false, message = "Không thể kick thành viên." });

                return Ok(new { success = true, message = "Thành viên đã bị kick (status set to kicked)." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Lỗi khi kick: {ex.Message}", error = ex.ToString() });
            }
        }


        
        [HttpGet("classworks/{id}")]
        public IActionResult getClasswork(int id)
        {
            var cw = _service.GetClassworks(id);
            if (cw == null) return NotFound();
            var response = new
            {
                success = true,
                message = "Danh sách lớp học được tải thành công.",
                classes =  cw,
               
            };
            return Ok(response);
        }
        [HttpPost("classworks")]
        public IActionResult CreateClasswork([FromBody] CreateClassworkDto dto)
        {
            if (dto.ClassId <= 0 || string.IsNullOrWhiteSpace(dto.Title))
                return BadRequest(new { success = false, message = "Thiếu thông tin classId hoặc title" });
            var entity = dto.ToEntity();
            var cw = _service.CreateClasswork(entity);
            return CreatedAtAction(nameof(getClasswork), new { id = cw.ClassId }, cw);
        }

        [HttpPut("classworks/{id}")]
        public IActionResult EditClasswork(int id, [FromBody] EditClassworkDto dto)
        {
            var cw = _service.GetClasswork(id);
            if (cw == null)
                return NotFound(new { success = false, message = "Không tìm thấy classwork" });

            cw.Title = dto.Title;
            cw.Description = dto.Description;
            cw.Deadline = dto.Deadline;
            var updated = _service.EditClasswork(cw);
            return Ok(new { success = true, message = "Đã update", data = updated });
        }

        [HttpGet("classworks/{id}/detail")]
        public IActionResult GetClassworkDetail(int id)
        {
            var cw = _service.GetClasswork(id);
            if (cw == null)
                return NotFound(new { success = false, message = "Không tìm thấy classwork" });
            var submissions = _service.GetSubmissionsByClassworkId(id);
            return Ok(new { success = true, data = cw, submissions });
        }

        [HttpPost("classworks/{id}/submit")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> SubmitClasswork(int id, [FromForm] SubmitClassworkDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.AppUserId))
                return BadRequest(new { success = false, message = "Thiếu thông tin user" });

            Guid userId;
            if (!Guid.TryParse(dto.AppUserId, out userId))
                return BadRequest(new { success = false, message = "AppUserId không hợp lệ" });

            var existingSubmission = _service.GetSubmissionByUserAndClasswork(id, userId);

            ClassworkSubmission submission;
            bool isResubmit = false;

            if (existingSubmission == null)
            {
                submission = new ClassworkSubmission
                {
                    ClassworkId = id,
                    AppUserId = userId,
                    FirstSubmissionTime = DateTime.Now,
                    LatestSubmissionTime = DateTime.Now
                };
                submission = _service.SubmitClasswork(submission, new List<SubmissionFile>()); // Tạo submission rỗng trước để lấy Id
            }
            else
            {
                submission = existingSubmission;
                submission.LatestSubmissionTime = DateTime.Now;
                _service.ResubmitClasswork(submission.Id, new List<SubmissionFile>());
                isResubmit = true;
            }

            var filesAdded = new List<SubmissionFile>();

            if (dto.Files != null && dto.Files.Any())
            {
                foreach (var formFile in dto.Files)
                {
                    if (formFile == null || formFile.Length == 0) continue;

                    try
                    {
                        var uploaded = await _service.UploadFileToCloudinary(formFile);
                        if (uploaded != null)
                        {
                            var fileEntity = new SubmissionFile
                            {
                                SubmissionId = submission.Id,
                                FileName = formFile.FileName,
                                FileUrl = uploaded.ToString()
                            };
                            _service.AddSubmissionFile(fileEntity);
                            filesAdded.Add(fileEntity);
                        }
                    }
                    catch
                    {
                        // Có thể log lỗi hoặc trả về lỗi từng file nếu cần
                    }
                }
            }

            return Ok(new
            {
                success = true,
                message = isResubmit ? "Đã nộp lại bài" : "Đã nộp bài mới",
                submissionId = submission.Id,
                files = filesAdded
            });
        }
        [HttpGet("classworks/submission")]
        public IActionResult GetSubmissionfile(int classworkID, Guid userid)
        {
            var submitFile = _service.GetSubmissionByUserAndClasswork(classworkID, userid);
            var fi = _service.GetSubmissionFiles(submitFile.Id);
            if(submitFile == null)
            {
                return NotFound(new { success = false, message = "Không tìm thấy classwork" });
            }
            return Ok(new {success=true, data=submitFile.ToSubmissionDto(fi)});

        }
        [HttpGet("classworks/submissioncount/{classworkID}")]
        public IActionResult GetSubmissionCount(int classworkID)
        {
            var numberSubmission = _service.GetSubmissionCount(classworkID);
            return Ok(numberSubmission);
        }
        [HttpGet("classworks/membercount/{classworkID}")]
        public IActionResult GetMemberCount(int classworkID)
        {
            var numberMember = _service.GetMemberCount(classworkID);
            return Ok(numberMember);
        }

    }
}
