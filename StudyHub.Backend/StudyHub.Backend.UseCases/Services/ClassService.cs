using Microsoft.AspNetCore.Http;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Utils;

namespace StudyHub.Backend.UseCases.Services
{
    public class ClassService
    {
        private readonly IClassRepository _classRepository;
        private readonly ICloudinaryRepository _fileStorage;
        public ClassService(IClassRepository classRepository, ICloudinaryRepository fileStorage)
        {
            _classRepository = classRepository;
            _fileStorage = fileStorage;
        }
        public List<Class> GetClasses()
        {
            return _classRepository.GetAllClasses();
        }
        public List<Subject> GetSubjects()
        {
            return _classRepository.GetAllSubject();
        }
        public List<AppUser> GetTeachers()
        {
            return _classRepository.GetAllTeacher();
        }
        public Class CreateClass(Class dto)
        {
            var entity = new Class
            {
                Name = dto.Name.Trim(),
                SubjectId = dto.SubjectId,
                Description = dto.Description,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = dto.CreatedBy
            };

            return _classRepository.CreateClass(entity);
        }
        public Class UpdateClass(Class dto)
        {

            return _classRepository.UpdateClass(dto);
        }
        public Class GetClassById(int id)
        {
            return _classRepository.GetClassById(id);
        }
        public Class? GetClassDetail(int id)
        {
            return _classRepository.GetClassDetailById(id);
        }
        public List<ClassMember> GetClassMembers(int id)
        {
            return _classRepository.GetClassMembers(id);
        }
        public List<ClassNotification> GetClassNotifications(int classId)
        {
            return _classRepository.GetClassNotifications(classId);
        }
        public List<ClassNotificationComment> GetCommentsByNotificationId(int notificationId)
        {
            return _classRepository.GetCommentsByNotificationId(notificationId);
        }

        // 2. Tạo notification kèm file
        public async Task<ClassNotification> CreateNotificationWithFilesAsync(
            ClassNotification notification,
            List<IFormFile>? files)
        {
            // Tạo notification
            var createdNoti = _classRepository.CreateNotification(notification);

            // Nếu có file => upload lên Cloudinary và map vào notification
            if (files != null && files.Count > 0)
            {
                foreach (var file in files)
                {
                    var fileUrl = await _fileStorage.UploadFileAsync(file, "notification-attachments");

                    var submissionFile = new NotificationFile
                    {
                        FileName = file.FileName,
                        FileUrl = fileUrl
                    };

                    var savedFile = _classRepository.CreateSubmissionFile(submissionFile);

                    // map file - notification
                    _classRepository.MapFileToNotification(createdNoti.Id, savedFile.Id);
                }
            }

            return createdNoti;
        }
        public List<SubmissionFile> GetFilesByNotificationId(int notiId)
    => _classRepository.GetFilesByNotificationId(notiId);

        
        public ClassNotification CreateNotification(ClassNotification entity)
            => _classRepository.CreateNotification(entity);

        public NotificationFile CreateSubmissionFile(NotificationFile file)
            => _classRepository.CreateSubmissionFile(file);

        public void MapFileToNotification(int notificationId, int fileId)
            => _classRepository.MapFileToNotification(notificationId, fileId);

        public async Task<string> UploadFileToCloudinary(IFormFile file)
            => await _fileStorage.UploadFileAsync(file, FileConstants.DocumentUploadPath);

    }
}
