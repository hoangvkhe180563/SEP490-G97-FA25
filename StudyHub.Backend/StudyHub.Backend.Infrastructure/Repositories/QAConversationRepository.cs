using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Infrastructure.Data;
using StudyHub.Backend.Infrastructure.Exceptions;
using StudyHub.Backend.UseCases.Repositories;

namespace StudyHub.Backend.Infrastructure.Repositories
{
    public class QAConversationRepository : IQAConversationRepository
    {
        private readonly AppDbContext _context;

        public QAConversationRepository(AppDbContext context)
        {
            _context = context;
        }

        public static Domain.Entities.QAConversation ToDomain(Data.QAConversation qAConversation)
        {
            var domainQAConversation = new Domain.Entities.QAConversation
            {
                Id = qAConversation.Id,
                Title = qAConversation.Title,
                Student = new Domain.Entities.AppUser
                {
                    Id = qAConversation.Student.Id,
                    Fullname = qAConversation.Student.Fullname,
                    Email = qAConversation.Student.Email,
                    Username = qAConversation.Student.Username,
                    Avatar = qAConversation.Student.Avatar,
                },
                Teacher = qAConversation.Teacher == null ? null : new Domain.Entities.AppUser
                {
                    Id = qAConversation.Teacher.Id,
                    Fullname = qAConversation.Teacher.Fullname,
                    Email = qAConversation.Teacher.Email,
                    Username = qAConversation.Teacher.Username,
                    Avatar = qAConversation.Teacher.Avatar,
                },
                Type = qAConversation.Type,
                IsPaid = qAConversation.IsPaid,
                Topic = new Domain.Entities.QATopic
                {
                    Id = qAConversation.Topic.Id,
                    Name = qAConversation.Topic.Name,
                    Subject = new Domain.Entities.Subject
                    {
                        Id = qAConversation.Topic.Subject.Id,
                        Name = qAConversation.Topic.Subject.Name,
                    }
                },
                CreatedAt = qAConversation.CreatedAt,
            };
            return domainQAConversation;
        }

        public static Data.QAConversation ToEntity(Domain.Entities.QAConversation qAConversation)
        {
            var entityConversation = new Data.QAConversation
            {
                Id = qAConversation.Id == Guid.Empty ? Guid.NewGuid() : qAConversation.Id,
                Title = qAConversation.Title,
                StudentId = qAConversation.StudentId,
                TeacherId = qAConversation.TeacherId,
                Type = qAConversation.Type,
                IsPaid = qAConversation.IsPaid,
                TopicId = qAConversation.TopicId,
                CreatedAt = qAConversation.CreatedAt == default ? DateTime.UtcNow : qAConversation.CreatedAt,
            };
            return entityConversation;
        }

        public List<Domain.Entities.QAConversation> GetQAConversations()
        {
            try
            {
                var result = _context.QAConversations
                    .Include(x => x.Student)
                    .Include(x => x.Teacher)
                    .Include(x => x.Topic)
                    .ThenInclude(x => x.Subject)
                    .Select(x => ToDomain(x))
                    .ToList();
                if (result == null) return new List<Domain.Entities.QAConversation>();
                return result;
            }
            catch (Exception ex)
            {
                new InfrastructureException("QAConversationRepository", "GetQAConversations failed: " + ex.Message).LogError();
                return new List<Domain.Entities.QAConversation>();
            }
        }

        public Domain.Entities.QAConversation? GetQAConversationById(Guid id)
        {
            try
            {
                var result = _context.QAConversations
                    .Include(x => x.Student)
                    .Include(x => x.Teacher)
                    .Include(x => x.Topic)
                    .ThenInclude(x => x.Subject)
                    .FirstOrDefault(x => x.Id == id);
                if (result == null) return null;
                return ToDomain(result);
            }
            catch (Exception ex)
            {
                new InfrastructureException("QAConversationRepository", "GetQAConversationById failed: " + ex.Message).LogError();
                return null;
            }
        }

        // create a new conversation and return domain model
        public Domain.Entities.QAConversation? CreateQAConversation(Domain.Entities.QAConversation conv)
        {
            try
            {
                var entity = ToEntity(conv);
                _context.QAConversations.Add(entity);
                _context.SaveChanges();

                // reload with navigation properties
                var saved = _context.QAConversations
                    .Include(x => x.Student)
                    .Include(x => x.Teacher)
                    .Include(x => x.Topic)
                    .ThenInclude(x => x.Subject)
                    .FirstOrDefault(x => x.Id == entity.Id);
                return saved == null ? null : ToDomain(saved);
            }
            catch (Exception ex)
            {
                new InfrastructureException("QAConversationRepository", "CreateQAConversation failed: " + ex.Message).LogError();
                return null;
            }
        }

        // update existing conversation; returns updated domain or null
        public Domain.Entities.QAConversation? UpdateQAConversation(Domain.Entities.QAConversation conv)
        {
            try
            {
                var existing = _context.QAConversations.FirstOrDefault(x => x.Id == conv.Id);
                if (existing == null) return null;
                // update allowed fields
                existing.Title = conv.Title;
                existing.TeacherId = conv.TeacherId;
                existing.Type = conv.Type;
                existing.IsPaid = conv.IsPaid;
                existing.TopicId = conv.TopicId;

                _context.QAConversations.Update(existing);
                _context.SaveChanges();

                var updated = _context.QAConversations
                    .Include(x => x.Student)
                    .Include(x => x.Teacher)
                    .Include(x => x.Topic)
                    .ThenInclude(x => x.Subject)
                    .FirstOrDefault(x => x.Id == existing.Id);
                return updated == null ? null : ToDomain(updated);
            }
            catch (Exception ex)
            {
                new InfrastructureException("QAConversationRepository", "UpdateQAConversation failed: " + ex.Message).LogError();
                return null;
            }
        }

        public List<Domain.Entities.AppUser> GetTeachersForStudent(Guid studentId)
        {
            try
            {
                var teachers = _context.QAConversations
                    .Include(x => x.Teacher)
                    .Where(x => x.StudentId == studentId && x.TeacherId != null)
                    .GroupBy(x => x.TeacherId)
                    .Select(g => g.First().Teacher!)
                    .ToList();

                var result = new List<Domain.Entities.AppUser>();
                foreach (var t in teachers)
                {
                    if (t == null) continue;
                    result.Add(new Domain.Entities.AppUser { Id = t.Id, Fullname = t.Fullname, Username = t.Username, Avatar = t.Avatar });
                }
                return result;
            }
            catch (Exception ex)
            {
                new InfrastructureException("QAConversationRepository", "GetTeachersForStudent failed: " + ex.Message).LogError();
                return new List<Domain.Entities.AppUser>();
            }
        }

        public List<Domain.Entities.AppUser> GetStudentsForTeacher(Guid teacherId)
        {
            try
            {
                var students = _context.QAConversations
                    .Include(x => x.Student)
                    .Where(x => x.TeacherId == teacherId)
                    .GroupBy(x => x.StudentId)
                    .Select(g => g.First().Student!)
                    .ToList();

                var result = new List<Domain.Entities.AppUser>();
                foreach (var s in students)
                {
                    if (s == null) continue;
                    result.Add(new Domain.Entities.AppUser { Id = s.Id, Fullname = s.Fullname, Username = s.Username, Avatar = s.Avatar });
                }
                return result;
            }
            catch (Exception ex)
            {
                new InfrastructureException("QAConversationRepository", "GetStudentsForTeacher failed: " + ex.Message).LogError();
                return new List<Domain.Entities.AppUser>();
            }
        }
    }
}
