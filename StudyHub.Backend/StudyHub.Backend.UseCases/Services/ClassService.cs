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
        private readonly IAppUserRepository _userRepository;
        public ClassService(IClassRepository classRepository, ICloudinaryRepository fileStorage, IAppUserRepository userRepository)
        {
            _classRepository = classRepository;
            _fileStorage = fileStorage;
            _userRepository = userRepository;
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

            // Nếu có file => upload lên storage và tạo bản ghi file gắn với notification
            if (files != null && files.Count > 0)
            {
                foreach (var file in files)
                {
                    var fileUrl = await _fileStorage.UploadFileAsync(file, "notification-attachments");

                    var submissionFile = new ClassNotificationFile
                    {
                        NotificationId = createdNoti.Id, // gắn trực tiếp vào file record
                        FileName = file.FileName,
                        FileUrl = fileUrl
                    };

                    //var savedFile = _classRepository.CreateSubmissionFile(submissionFile);

                    // Không cần gọi MapFileToNotification vì NotificationId đã được lưu trên ClassNotificationFile
                }
            }

            return createdNoti;
        }



        public ClassNotification CreateNotification(ClassNotification entity)
            => _classRepository.CreateNotification(entity);

        
        public List<ClassNotificationFile> GetFileByNotificationId(int notificationid)
        =>_classRepository.GetFileByNotificationId(notificationid);


        public ClassNotificationFile CreateFile(ClassNotificationFile entity) => _classRepository.CreateSubmissionFile  (entity);

        public async Task<string> UploadFileToCloudinary(IFormFile file)
            => await _fileStorage.UploadFileAsync(file, FileConstants.ClassNotificationUploadPAth);

        public List<Class> GetClassByUserId(Guid userid)=> _classRepository.GetClassByUserId(userid);

        public ClassNotificationComment CreateNotificationComment(ClassNotificationComment commentEntity)
        {
           return _classRepository.CommentNoti(commentEntity);
        }
        public bool deleteNoti(int  notificationid) => _classRepository.deleteNotification(notificationid);
        public bool InviteMember(Guid userId, int classId)=>_classRepository.InviteMember(userId, classId);
        public bool ConfirmMember(Guid userId, int classId) =>_classRepository.ConfirmMember(userId, classId);
        public bool KickMember(Guid userId, int classId)=> _classRepository.KickMember(userId,classId);
        public ClassNotification GetNotificationByID(int notificationid) => _classRepository.getNotificationByID(notificationid);
        public List<Classwork> GetClassworks(int classId)=> _classRepository.GetClassworks(classId);
    }
}
