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
    }
}
