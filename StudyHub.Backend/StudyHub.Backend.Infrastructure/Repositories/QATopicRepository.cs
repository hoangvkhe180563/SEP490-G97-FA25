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
    public class QATopicRepository : IQATopicRepository
    {
        private readonly AppDbContext _context;

        public QATopicRepository(AppDbContext context)
        {
            _context = context;
        }

        public static Domain.Entities.QATopic ToDomain(Data.QATopic qATopic)
        {
            var domainQATopic = new Domain.Entities.QATopic
            {
                Id = qATopic.Id,
                SubjectId = qATopic.SubjectId,
                Subject = new Domain.Entities.Subject
                {
                    Id = qATopic.Subject.Id,
                    Name = qATopic.Subject.Name,
                },
                Name = qATopic.Name,
                Description = qATopic.Description,
                IsActive = qATopic.IsActive,
                CreatedAt = qATopic.CreatedAt,
                UpdatedAt = qATopic.UpdatedAt
            };
            return domainQATopic;
        }

        public List<Domain.Entities.QATopic> GetAllTopic()
        {
            try
            {
                var result = _context.QATopics
                    .Include(s => s.Subject)
                    .Select(q => ToDomain(q))
                    .ToList();
                if (result == null)
                {
                    return new List<Domain.Entities.QATopic>();
                }
                return result;
            }
            catch (Exception ex)
            {
                new InfrastructureException("QARepository", "GetAllTopic failed. Inner error: " + ex.Message).LogError();
                return new List<Domain.Entities.QATopic>();
            }
        }

        public List<Domain.Entities.QATopic> GetTopicsBySubject(int subjectId)
        {
            try
            {
                if (subjectId <= 0) return new List<Domain.Entities.QATopic>();
                var result = _context.QATopics
                    .Where(q => q.SubjectId == subjectId)
                    .Include(s => s.Subject)
                    .Select(q => ToDomain(q))
                    .ToList();
                return result ?? new List<Domain.Entities.QATopic>();
            }
            catch (Exception ex)
            {
                new InfrastructureException("QARepository", "GetTopicsBySubject failed. Inner error: " + ex.Message).LogError();
                return new List<Domain.Entities.QATopic>();
            }
        }

        public Domain.Entities.QATopic? CreateQATopic(Domain.Entities.QATopic topic)
        {
            try
            {
                var entity = new Data.QATopic
                {
                    Id = topic.Id,
                    Name = topic.Name,
                    Description = topic.Description,
                    SubjectId = topic.SubjectId,
                    IsActive = topic.IsActive ?? true,
                    CreatedAt = topic.CreatedAt == default ? DateTime.Now : topic.CreatedAt,
                };
                _context.QATopics.Add(entity);
                _context.SaveChanges();

                var saved = _context.QATopics
                    .Include(s => s.Subject)
                    .FirstOrDefault(x => x.Id == entity.Id);
                return saved == null ? null : ToDomain(saved);
            }
            catch (Exception ex)
            {
                new InfrastructureException("QARepository", "CreateQATopic failed. Inner error: " + ex.Message).LogError();
                return null;
            }
        }

        public Domain.Entities.QATopic? GetQATopicById(int id)
        {
            if (id == 0) return null;
            var result = _context.QATopics
                .Include(s => s.Subject)
                .FirstOrDefault(x => x.Id == id);
            if (result == null) return null;
            return ToDomain(result);
        }
    }
}
