using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;

namespace StudyHub.Backend.UseCases.Services
{
    public class QAConversationService
    {
        public readonly IQAConversationRepository _repo;
        private readonly AuthService _authService;

        public QAConversationService(IQAConversationRepository repo, AuthService authService)
        {
            _repo = repo;
            _authService = authService;
        }

        public List<QAConversation> GetQAConversations()
        {
            return _repo.GetQAConversations();
        }

        public List<QAConversation> GetConversationsForCurrentUser()
        {
            var current = _authService.GetCurrentUser();
            if (current == null) return new List<QAConversation>();

            var all = _repo.GetQAConversations();
            var filtered = all.Where(c => (c.Student != null && c.Student.Id == current.Id) || (c.Teacher != null && c.Teacher.Id == current.Id)).ToList();
            return filtered;
        }

        // Return distinct teachers who have conversations with the given student
        public List<UseCases.Dtos.AppUserListDto> GetTeachersForStudent(Guid studentId)
        {
            var teachers = _repo.GetTeachersForStudent(studentId);
            var result = new List<UseCases.Dtos.AppUserListDto>();
            foreach (var t in teachers)
            {
                var roles = new List<string>();
                // roles can be obtained via AppUserRepository if needed; keep empty for now
                result.Add(new UseCases.Dtos.AppUserListDto
                {
                    Id = t.Id,
                    Email = string.Empty,
                    Username = t.Username,
                    Fullname = t.Fullname,
                    Avatar = t.Avatar,
                    Status = "",
                    CreatedAt = "",
                    Roles = roles
                });
            }
            return result;
        }

        // Return distinct students who have conversations with the given teacher
        public List<UseCases.Dtos.AppUserListDto> GetStudentsForTeacher(Guid teacherId)
        {
            var students = _repo.GetStudentsForTeacher(teacherId);
            var result = new List<UseCases.Dtos.AppUserListDto>();
            foreach (var s in students)
            {
                var roles = new List<string>();
                result.Add(new UseCases.Dtos.AppUserListDto
                {
                    Id = s.Id,
                    Email = string.Empty,
                    Username = s.Username,
                    Fullname = s.Fullname,
                    Avatar = s.Avatar,
                    Status = "",
                    CreatedAt = "",
                    Roles = roles
                });
            }
            return result;
        }

        // Convenience: for current user as student -> get teachers
        public List<UseCases.Dtos.AppUserListDto> GetTeachersWithConversationsForCurrentStudent()
        {
            var current = _authService.GetCurrentUser();
            if (current == null) return new List<UseCases.Dtos.AppUserListDto>();
            return GetTeachersForStudent(current.Id);
        }

        // Convenience: for current user as teacher -> get students
        public List<UseCases.Dtos.AppUserListDto> GetStudentsWithConversationsForCurrentTeacher()
        {
            var current = _authService.GetCurrentUser();
            if (current == null) return new List<UseCases.Dtos.AppUserListDto>();
            return GetStudentsForTeacher(current.Id);
        }

        public QAConversation? GetQAConversationById(System.Guid id)
        {
            return _repo.GetQAConversationById(id);
        }

        public QAConversation? CreateQAConversation(string title, int topicId, Guid? teacherId, string type, bool isPaid)
        {
            Guid? domainTeacherId = null;
            if (type == "AI" && teacherId.HasValue)
            {
                domainTeacherId = teacherId.Value;
            }

            var domain = new QAConversation
            {
                Title = title,
                StudentId = _authService.GetCurrentUser().Id,
                TeacherId = domainTeacherId,
                TopicId = (short)topicId,
                IsPaid = isPaid,
                Type = type,
            };
            return _repo.CreateQAConversation(domain);
        }

        public QAConversation? UpdateQAConversation(Guid id, string? title, int? topicId, Guid? teacherId, string? type, bool? isPaid)
        {
            var conversation = _repo.GetQAConversationById(id);
            if (conversation == null) return null;

            if (teacherId.HasValue)
            {
                conversation.TeacherId = teacherId.Value;
            }
            if (!string.IsNullOrEmpty(type))
            {
                conversation.Type = type;
            }

            if (isPaid.HasValue)
            {
                conversation.IsPaid = isPaid.Value;
            }

            if (!string.IsNullOrEmpty(title))
            {
                conversation.Title = title;
            }
            if (topicId.HasValue)
            {
                conversation.TopicId = (short)topicId.Value;
            }

            return _repo.UpdateQAConversation(conversation);
        }
    }
}
