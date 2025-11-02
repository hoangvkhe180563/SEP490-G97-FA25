using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using StudyHub.Backend.Infrastructure.Data;
using StudyHub.Backend.Infrastructure.Exceptions;
using StudyHub.Backend.UseCases.Repositories;

namespace StudyHub.Backend.Infrastructure.Repositories
{
    public class QAMessageRepository : IQAMessageRepository
    {
        private readonly AppDbContext _context;

        public QAMessageRepository(AppDbContext context)
        {
            _context = context;
        }

        private static Domain.Entities.QAMessage ToDomain(Data.QAMessage e)
        {
            return new Domain.Entities.QAMessage
            {
                Id = e.Id,
                Content = e.Content,
                IsFromAi = e.IsFromAi,
                IsPaid = e.IsPaid,
                CreatedAt = e.CreatedAt,
                Sender = e.Sender == null ? null! : new Domain.Entities.AppUser
                {
                    Id = e.Sender.Id,
                    Username = e.Sender.Username,
                    Fullname = e.Sender.Fullname,
                    Email = e.Sender.Email,
                    Avatar = e.Sender.Avatar,
                },
                Conversation = e.Conversation == null ? null! : new Domain.Entities.QAConversation
                {
                    Id = e.Conversation.Id,
                    Title = e.Conversation.Title,
                    StudentId = e.Conversation.StudentId,
                    TeacherId = e.Conversation.TeacherId,
                    Type = e.Conversation.Type,
                    IsPaid = e.Conversation.IsPaid,
                    TopicId = e.Conversation.TopicId,
                    CreatedAt = e.Conversation.CreatedAt,
                }
            };
        }

        private static Data.QAMessage ToEntity(Domain.Entities.QAMessage m)
        {
            return new Data.QAMessage
            {
                Id = m.Id == Guid.Empty ? Guid.NewGuid() : m.Id,
                ConversationId = m.ConversationId,
                SenderId = m.SenderId,
                Content = m.Content,
                IsFromAi = m.IsFromAi,
                IsPaid = m.IsPaid,
                CreatedAt = m.CreatedAt == default ? DateTime.UtcNow : m.CreatedAt,
            };
        }

        // create a message for a conversation
        public Domain.Entities.QAMessage? CreateQAMessage(Domain.Entities.QAMessage msg)
        {
            try
            {
                var entity = ToEntity(msg);
                _context.QAMessages.Add(entity);
                _context.SaveChanges();

                var saved = _context.QAMessages
                    .Include(m => m.Sender)
                    .Include(m => m.Conversation)
                    .FirstOrDefault(m => m.Id == entity.Id);
                return saved == null ? null : ToDomain(saved);
            }
            catch (Exception ex)
            {
                new InfrastructureException("QAConversationRepository", "CreateQAMessage failed: " + ex.Message).LogError();
                return null;
            }
        }

        // update a message
        public Domain.Entities.QAMessage? UpdateQAMessage(Domain.Entities.QAMessage msg)
        {
            try
            {
                var existing = _context.QAMessages.FirstOrDefault(m => m.Id == msg.Id);
                if (existing == null) return null;
                existing.Content = msg.Content;
                existing.IsFromAi = msg.IsFromAi;
                existing.IsPaid = msg.IsPaid;
                _context.QAMessages.Update(existing);
                _context.SaveChanges();

                var updated = _context.QAMessages
                    .Include(m => m.Sender)
                    .Include(m => m.Conversation)
                    .FirstOrDefault(m => m.Id == existing.Id);
                return updated == null ? null : ToDomain(updated);
            }
            catch (Exception ex)
            {
                new InfrastructureException("QAConversationRepository", "UpdateQAMessage failed: " + ex.Message).LogError();
                return null;
            }
        }

        // get all messages
        public List<Domain.Entities.QAMessage> GetQAMessages()
        {
            try
            {
                var result = _context.QAMessages
                    .Include(m => m.Sender)
                    .Include(m => m.Conversation)
                    .OrderBy(m => m.CreatedAt)
                    .Select(m => ToDomain(m))
                    .ToList();
                if (result == null) return new List<Domain.Entities.QAMessage>();
                return result;
            }
            catch (Exception ex)
            {
                new InfrastructureException("QAMessageRepository", "GetQAMessages failed: " + ex.Message).LogError();
                return new List<Domain.Entities.QAMessage>();
            }
        }

        // get one message by id
        public Domain.Entities.QAMessage? GetQAMessageById(Guid id)
        {
            try
            {
                var msg = _context.QAMessages
                    .Include(m => m.Sender)
                    .Include(m => m.Conversation)
                    .FirstOrDefault(m => m.Id == id);
                if (msg == null) return null;
                return ToDomain(msg);
            }
            catch (Exception ex)
            {
                new InfrastructureException("QAMessageRepository", "GetQAMessageById failed: " + ex.Message).LogError();
                return null;
            }
        }

        // get messages by conversation id
        public List<Domain.Entities.QAMessage> GetQAMessagesByConversationId(Guid conversationId)
        {
            try
            {
                var result = _context.QAMessages
                    .Where(m => m.ConversationId == conversationId)
                    .Include(m => m.Sender)
                    .Include(m => m.Conversation)
                    .OrderBy(m => m.CreatedAt)
                    .Select(m => ToDomain(m))
                    .ToList();
                if (result == null) return new List<Domain.Entities.QAMessage>();
                return result;
            }
            catch (Exception ex)
            {
                new InfrastructureException("QAMessageRepository", "GetQAMessagesByConversationId failed: " + ex.Message).LogError();
                return new List<Domain.Entities.QAMessage>();
            }
        }

    }
}
