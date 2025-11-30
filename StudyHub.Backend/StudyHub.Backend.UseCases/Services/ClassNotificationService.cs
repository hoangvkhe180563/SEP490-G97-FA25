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
        private readonly IClassNotificationRepository _repo;
        private readonly ICloudinaryRepository _fileStorage;
        private readonly IAppUserRepository _userRepository;
        private readonly SmtpEmailService _emailService;
        public ClassNotificationService(IClassNotificationRepository classRepository, ICloudinaryRepository fileStorage, IAppUserRepository userRepository, SmtpEmailService emailService)
        {
            _repo = classRepository;
            _fileStorage = fileStorage;
            _userRepository = userRepository;
            _emailService = emailService;
        }
        // Notifications
        public List<ClassNotification> GetNotifications(int classId) => _repo.GetNotifications(classId);
        public ClassNotification CreateNotification(ClassNotification notification) => _repo.CreateNotification(notification);
        public ClassNotification EditNotification(ClassNotification notification) => _repo.EditNotification(notification);
        public ClassNotification GetNotification(int notificationId) => _repo.GetNotification(notificationId);
        public bool DeleteNotification(int notificationId) => _repo.DeleteNotification(notificationId);

        // Comments & files
        public ClassNotificationComment CreateComment(ClassNotificationComment comment) => _repo.CreateComment(comment);
        public List<ClassNotificationComment> GetCommentsByNotificationId(int notificationId) => _repo.GetCommentsByNotificationId(notificationId);

        public ClassNotificationFile CreateNotificationFile(ClassNotificationFile file) => _repo.CreateNotificationFile(file);
        public List<ClassNotificationFile> GetFilesByNotification(int notificationId) => _repo.GetFilesByNotification(notificationId);
        public bool DeleteNotificationFile(int classNotificationId)=> _repo.DeleteNotificationFile(classNotificationId);
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
                    FirstSubmissionTime = DateTime.UtcNow,
                    LatestSubmissionTime = DateTime.UtcNow,
                    SubmissionStatus = "submitted"
                };
                submission = _repo.SubmitNotification(submission, new List<SubmissionFile>());
            }
            else
            {
                submission = existing;
                submission.LatestSubmissionTime = DateTime.UtcNow;
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
            // Validate the submission belongs to notificationId for safety
            var submissions = _repo.GetSubmissionsByNotificationId(notificationId);
            if (submissions == null || !submissions.Any(s => s.Id == submissionId))
            {
                return false;
            }

            // Use repository to grade
            return _repo.GradeSubmission(score, submissionId, gradedBy, feedback);
        }
        public int GetTotalUnreadNotifications(int classID, Guid userID, string type)=> _repo.GetTotalUnreadNotifications(classID, userID, type);
    }
}
