using Microsoft.AspNetCore.Http;
using StudyHub.Backend.Api.Services;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Domain.Entities.Notifications;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Repositories.Notifications;
using StudyHub.Backend.UseCases.Utils;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace StudyHub.Backend.UseCases.Services
{
    public class ClassNotificationService
    {
        private readonly IClassNotificationRepository _repo;
        private readonly ICloudinaryRepository _fileStorage;
        private readonly IAppUserRepository _userRepository;
        private readonly SmtpEmailService _emailService;

        // NEW: phục vụ tạo notification hệ thống + group
        private readonly NotificationService _notificationService;
        private readonly INotificationOfClassRepository _notificationClassRepo;

        public ClassNotificationService(
            IClassNotificationRepository classRepository,
            ICloudinaryRepository fileStorage,
            IAppUserRepository userRepository,
            SmtpEmailService emailService,
            NotificationService notificationService,
            INotificationOfClassRepository notificationClassRepo)
        {
            _repo = classRepository;
            _fileStorage = fileStorage;
            _userRepository = userRepository;
            _emailService = emailService;
            _notificationService = notificationService;
            _notificationClassRepo = notificationClassRepo;
        }

        // Notifications
        public List<ClassNotification> GetNotifications(int classId) => _repo.GetNotifications(classId);
        public ClassNotification CreateNotification(ClassNotification notification) => _repo.CreateNotification(notification);
        public ClassNotification EditNotification(ClassNotification notification) => _repo.EditNotification(notification);
        public ClassNotification GetNotification(int notificationId) => _repo.GetNotification(notificationId);
        public bool DeleteNotification(int notificationId) => _repo.DeleteNotification(notificationId);
        public bool DeleteNotificationFileById(int classNotificationFileId) => _repo.DeleteNotificationFileById(classNotificationFileId);

        // Lấy danh sách thành viên lớp
        public List<Guid> GetMemberIdsByClass(int classId) => _repo.GetMemberIdsByClass(classId);

        // Comments & files
        public ClassNotificationComment CreateComment(ClassNotificationComment comment) => _repo.CreateComment(comment);
        public List<ClassNotificationComment> GetCommentsByNotificationId(int notificationId) => _repo.GetCommentsByNotificationId(notificationId);

        public ClassNotificationFile CreateNotificationFile(ClassNotificationFile file) => _repo.CreateNotificationFile(file);
        public List<ClassNotificationFile> GetFilesByNotification(int notificationId) => _repo.GetFilesByNotification(notificationId);
        public bool DeleteNotificationFile(int classNotificationId) => _repo.DeleteNotificationFile(classNotificationId);

        // Submissions lifecycle: submit files for an assignment notification
        public async Task<(int SubmissionId, List<SubmissionFile> Files, bool IsResubmit)?> SubmitNotificationWithFilesAsync(int notificationId, string? appUserId, List<IFormFile>? files)
        {
            if (string.IsNullOrWhiteSpace(appUserId)) throw new ArgumentException("Thiếu thông tin user");
            if (!Guid.TryParse(appUserId, out var userId)) throw new ArgumentException("AppUserId không hợp lệ");

            var existing = _repo.GetSubmissionByUserAndNotification(notificationId, userId);

            NotificationSubmission submission;
            bool isResubmit = false;

            if (existing == null)
            {
                submission = new NotificationSubmission
                {
                    NotificationId = notificationId,
                    AppUserId = userId,
                    FirstSubmissionTime = DateTime.Now,
                    LatestSubmissionTime = DateTime.Now,
                    SubmissionStatus = "submitted"
                };
                submission = _repo.SubmitNotification(submission, new List<SubmissionFile>());
            }
            else
            {
                submission = existing;
                submission.LatestSubmissionTime = DateTime.Now;
                _repo.ResubmitNotification(submission.Id, new List<SubmissionFile>());
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
                            _repo.AddSubmissionFile(fileEntity);
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

        // Passthroughs for submission retrieval and files
        public NotificationSubmission GetSubmissionByUserAndNotification(int notificationId, Guid userId) => _repo.GetSubmissionByUserAndNotification(notificationId, userId);
        public List<NotificationSubmission> GetSubmissionsByNotificationId(int notificationId) => _repo.GetSubmissionsByNotificationId(notificationId);
        public SubmissionFile AddSubmissionFile(SubmissionFile file) => _repo.AddSubmissionFile(file);
        public List<SubmissionFile> GetSubmissionFiles(int submissionId) => _repo.GetSubmissionFiles(submissionId);
        public int GetSubmissionCount(int notificationId) => _repo.GetSubmissionCount(notificationId);
        public int GetMemberCountByNotification(int notificationId) => _repo.GetMemberCountByNotification(notificationId);
        public int GetMemberClassCount(int classID) => _repo.GetMemberClassCount(classID);
        public bool GradeSubmission(int notificationId, int submissionId, decimal score, Guid gradedBy, string feedback)
        {
            var submissions = _repo.GetSubmissionsByNotificationId(notificationId);
            if (submissions == null || !submissions.Any(s => s.Id == submissionId))
            {
                return false;
            }
            return _repo.GradeSubmission(score, submissionId, gradedBy, feedback);
        }

        public int GetTotalUnreadNotifications(int classID, Guid userID, string type) => _repo.GetTotalUnreadNotifications(classID, userID, type);

        // NEW: Tạo notification hệ thống cho lớp và seed unread, trả về groupId + notification đã lưu
        public async Task<(int GroupId, Notification Saved, IEnumerable<Guid> MemberIds)?> CreateSystemNotificationForClassAsync(
            int classId,
            string title,
            string body,
            Guid actorId,
            CancellationToken ct = default)
        {
            var memberIds = GetMemberIdsByClass(classId) ?? new List<Guid>();
            if (actorId != Guid.Empty && !memberIds.Contains(actorId))
            {
                memberIds.Add(actorId);
            }

            var groupId = await _notificationClassRepo.EnsureMemberGroupAsync(classId, memberIds, actorId, ct);

            var sysNotif = new Notification
            {
                Title = title,
                Body = body,
                TargetType = "Group",
                TargetGroupId = groupId,
                Priority = "Normal",
                IsActive = true,
                CreatedAt = DateTime.Now,
                CreatedBy = actorId
            };
            var saved = await _notificationService.SendNotificationAsync(sysNotif, ct);

            if (memberIds.Any())
            {
                await _notificationService.SeedUnreadAsync(saved.Id, memberIds, ct);
            }

            return (groupId, saved, memberIds);
        }
    }
}