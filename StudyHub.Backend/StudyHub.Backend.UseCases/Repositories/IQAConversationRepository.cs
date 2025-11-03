using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface IQAConversationRepository
    {
        List<QAConversation> GetQAConversations();
        QAConversation? GetQAConversationById(Guid id);
        QAConversation? CreateQAConversation(QAConversation conv);
        QAConversation? UpdateQAConversation(QAConversation conv);
        // get distinct teacher users that have conversations with a given student
        List<Domain.Entities.AppUser> GetTeachersForStudent(Guid studentId);
        // get distinct student users that have conversations with a given teacher
        List<Domain.Entities.AppUser> GetStudentsForTeacher(Guid teacherId);
    }
}
 
