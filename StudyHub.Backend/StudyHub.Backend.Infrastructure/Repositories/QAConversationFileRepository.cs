using Microsoft.EntityFrameworkCore;
using StudyHub.Backend.Infrastructure.Data;
using StudyHub.Backend.UseCases.Repositories;
using System.Linq;

namespace StudyHub.Backend.Infrastructure.Repositories
{
    public class QAConversationFileRepository : IQAConversationFileRepository
    {
        private readonly AppDbContext _context;

        public QAConversationFileRepository(AppDbContext context)
        {
            _context = context;
        }

        private static Domain.Entities.QAConversationFile ToDomain(Data.QAConversationFile e)
        {
            return new Domain.Entities.QAConversationFile
            {
                Id = e.Id,
                ConversationId = e.ConversationId,
                CreatedBy = e.CreatedBy,
                FileUrl = e.FileUrl,
                FileName = e.FileName,
                FileType = e.FileType,
                CreatedAt = e.CreatedAt
            };
        }

        private static Data.QAConversationFile ToEntity(Domain.Entities.QAConversationFile d)
        {
            return new Data.QAConversationFile
            {
                Id = d.Id == default ? System.Guid.NewGuid() : d.Id,
                ConversationId = d.ConversationId,
                CreatedBy = d.CreatedBy,
                FileUrl = d.FileUrl,
                FileName = d.FileName,
                FileType = d.FileType,
                CreatedAt = d.CreatedAt == default ? System.DateTime.Now : d.CreatedAt
            };
        }

        public Domain.Entities.QAConversationFile? Create(Domain.Entities.QAConversationFile file)
        {
            try
            {
                var entity = ToEntity(file);
                _context.QAConversationFiles.Add(entity);
                _context.SaveChanges();

                return ToDomain(entity);
            }
            catch (System.Exception ex)
            {
                new StudyHub.Backend.Infrastructure.Exceptions.InfrastructureException("QAConversationFileRepository", "Create failed: " + ex.Message).LogError();
                return null;
            }
        }

        public Domain.Entities.QAConversationFile? GetById(System.Guid id)
        {
            try
            {
                var e = _context.QAConversationFiles.FirstOrDefault(x => x.Id == id);
                if (e == null) return null;
                return ToDomain(e);
            }
            catch (System.Exception ex)
            {
                new StudyHub.Backend.Infrastructure.Exceptions.InfrastructureException("QAConversationFileRepository", "GetById failed: " + ex.Message).LogError();
                return null;
            }
        }

        public List<Domain.Entities.QAConversationFile> GetByConversationId(System.Guid conversationId)
        {
            try
            {
                var list = _context.QAConversationFiles
                    .Where(x => x.ConversationId == conversationId)
                    .OrderByDescending(x => x.CreatedAt)
                    .ToList();

                return list.Select(e => ToDomain(e)).ToList();
            }
            catch (System.Exception ex)
            {
                new StudyHub.Backend.Infrastructure.Exceptions.InfrastructureException("QAConversationFileRepository", "GetByConversationId failed: " + ex.Message).LogError();
                return new List<Domain.Entities.QAConversationFile>();
            }
        }
    }
}
