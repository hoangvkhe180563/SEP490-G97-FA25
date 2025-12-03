using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;

namespace StudyHub.Backend.UseCases.Services
{
    public class QATopicService
    {
        public readonly IQATopicRepository _repo;
        public QATopicService(IQATopicRepository repo)
        {
            _repo = repo;
        }

        public List<QATopic> GetAllTopics()
        {
            return _repo.GetAllTopic();
        }

        public QATopic? GetQATopicById(int id)
        {
            return _repo.GetQATopicById(id);
        }

        public List<QATopic> GetTopicsBySubject(int subjectId)
        {
            return _repo.GetTopicsBySubject(subjectId);
        }

        public QATopic? CreateQATopic(string name, int subjectId, string? description, bool isActive)
        {
            var topic = new QATopic
            {
                Name = name,
                SubjectId = (short)subjectId,
                Description = description,
                IsActive = isActive,
            };
            return _repo.CreateQATopic(topic);
        }

        public QATopic? UpdateQATopic(int id, string name, int subjectId, string? description, bool? isActive)
        {
            var topic = new QATopic
            {
                Id = (short)id,
                Name = name,
                SubjectId = (short)subjectId,
                Description = description,
                IsActive = isActive,
            };
            return _repo.UpdateQATopic(topic);
        }

        public bool SoftDeleteTopic(int id)
        {
            return _repo.SoftDeleteTopic(id);
        }

        public List<QATopic> SearchTopics(string? query, int? subjectId)
        {
            return _repo.SearchTopics(query, subjectId);
        }
    }
}
