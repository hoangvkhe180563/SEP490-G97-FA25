using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface IQATopicRepository
    {
        List<QATopic> GetAllTopic();
        QATopic? GetQATopicById(int id);
        List<QATopic> GetTopicsBySubject(int subjectId);
        QATopic? CreateQATopic(QATopic topic);
        QATopic? UpdateQATopic(QATopic topic);
        bool SoftDeleteTopic(int id);
        List<QATopic> SearchTopics(string? query, int? subjectId);
    }
}
