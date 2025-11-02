using Microsoft.AspNetCore.Http;
using StudyHub.Backend.Api.Services;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Utils;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace StudyHub.Backend.UseCases.Services
{
    public class ClassNotificationService
    {
        private readonly IClassNotificationRepository _classRepository;
        private readonly ICloudinaryRepository _fileStorage;
        private readonly IAppUserRepository _userRepository;
        private readonly IEmailService _emailService;
        public ClassNotificationService(IClassNotificationRepository classRepository, ICloudinaryRepository fileStorage, IAppUserRepository userRepository, IEmailService emailService)
        {
            _classRepository = classRepository;
            _fileStorage = fileStorage;
            _userRepository = userRepository;
            _emailService = emailService;
        }
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
    }
}
