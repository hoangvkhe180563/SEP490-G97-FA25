using Microsoft.AspNetCore.Http;
using StudyHub.Backend.Api.Services;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Utils;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace StudyHub.Backend.UseCases.Services
{
    public  class ClassworkService
    {
        private readonly IClassworkRepository _classRepository;
        private readonly ICloudinaryRepository _fileStorage;
        private readonly IAppUserRepository _userRepository;
        private readonly IEmailService _emailService;
        public ClassworkService(IClassworkRepository classworkRepository, ICloudinaryRepository cloudinary, IAppUserRepository appUser, IEmailService email )
        {
            _classRepository = classworkRepository;
            _fileStorage = cloudinary;
            _userRepository = appUser;
            _emailService = email;
        }

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
