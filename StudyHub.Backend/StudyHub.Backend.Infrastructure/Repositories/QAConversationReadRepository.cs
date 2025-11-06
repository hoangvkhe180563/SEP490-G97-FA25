using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Infrastructure.Data;
using StudyHub.Backend.Infrastructure.Exceptions;
using StudyHub.Backend.UseCases.Repositories;

namespace StudyHub.Backend.Infrastructure.Repositories
{
    public class QAConversationReadRepository : IQAConversationReadRepository
    {
        private readonly AppDbContext _context;

        public QAConversationReadRepository(AppDbContext context)
        {
            _context = context;
        }

        public static Domain.Entities.QAConversationRead ToDomain(Data.QAConversationRead e)
        {
            var domain = new Domain.Entities.QAConversationRead
            {
                ConversationId = e.ConversationId,
                UserId = e.UserId,
                LastReadAt = e.LastReadAt,
                Conversation = new Domain.Entities.QAConversation
                {
                    Id = e.Conversation?.Id ?? Guid.Empty,
                    Title = e.Conversation?.Title ?? string.Empty,
                    StudentId = e.Conversation?.StudentId ?? Guid.Empty,
                    TeacherId = e.Conversation?.TeacherId,
                    Type = e.Conversation?.Type ?? string.Empty,
                    IsPaid = e.Conversation?.IsPaid ?? false,
                    TopicId = e.Conversation?.TopicId ?? 0,
                    CreatedAt = e.Conversation?.CreatedAt ?? default
                }
            };
            return domain;
        }

        public static Data.QAConversationRead ToEntity(Domain.Entities.QAConversationRead d)
        {
            return new Data.QAConversationRead
            {
                ConversationId = d.ConversationId,
                UserId = d.UserId,
                LastReadAt = d.LastReadAt == default ? DateTime.Now : d.LastReadAt
            };
        }

        public List<Domain.Entities.QAConversationRead> GetReadsByConversationId(Guid conversationId)
        {
            try
            {
                var list = _context.QAConversationReads
                    .Include(x => x.Conversation)
                    .Where(x => x.ConversationId == conversationId)
                    .Select(x => ToDomain(x))
                    .ToList();
                return list ?? new List<Domain.Entities.QAConversationRead>();
            }
            catch (Exception ex)
            {
                new InfrastructureException("QAConversationReadRepository", "GetReadsByConversationId failed: " + ex.Message).LogError();
                return new List<Domain.Entities.QAConversationRead>();
            }
        }

        public List<Domain.Entities.QAConversationRead> GetReadsByUserId(Guid userId)
        {
            try
            {
                var list = _context.QAConversationReads
                    .Include(x => x.Conversation)
                    .Where(x => x.UserId == userId)
                    .Select(x => ToDomain(x))
                    .ToList();
                return list ?? new List<Domain.Entities.QAConversationRead>();
            }
            catch (Exception ex)
            {
                new InfrastructureException("QAConversationReadRepository", "GetReadsByUserId failed: " + ex.Message).LogError();
                return new List<Domain.Entities.QAConversationRead>();
            }
        }

        public Domain.Entities.QAConversationRead? GetReadByUserAndConversation(Guid userId, Guid conversationId)
        {
            try
            {
                var e = _context.QAConversationReads
                    .Include(x => x.Conversation)
                    .FirstOrDefault(x => x.UserId == userId && x.ConversationId == conversationId);
                if (e == null) return null;
                return ToDomain(e);
            }
            catch (Exception ex)
            {
                new InfrastructureException("QAConversationReadRepository", "GetReadByUserAndConversation failed: " + ex.Message).LogError();
                return null;
            }
        }

        public int CountReadByUserAndConversation(Guid userId, Guid conversationId)
        {
            try
            {
                return _context.QAConversationReads.Count(x => x.UserId == userId && x.ConversationId == conversationId);
            }
            catch (Exception ex)
            {
                new InfrastructureException("QAConversationReadRepository", "CountReadByUserAndConversation failed: " + ex.Message).LogError();
                return 0;
            }
        }

        // Count unread messages for a given user in a conversation.
        // Unread = messages in the conversation sent by others (SenderId != userId) and CreatedAt > LastReadAt
        public int CountUnreadMessagesForUser(Guid conversationId, Guid userId)
        {
            try
            {
                // find last read timestamp for this user+conversation
                var read = _context.QAConversationReads.FirstOrDefault(x => x.ConversationId == conversationId && x.UserId == userId);
                if (read == null)
                {
                    // if never read, count all messages in conversation from others
                    return _context.QAMessages.Count(m => m.ConversationId == conversationId && m.SenderId != userId);
                }
                var last = read.LastReadAt;
                return _context.QAMessages.Count(m => m.ConversationId == conversationId && m.SenderId != userId && m.CreatedAt > last);
            }
            catch (Exception ex)
            {
                new InfrastructureException("QAConversationReadRepository", "CountUnreadMessagesForUser failed: " + ex.Message).LogError();
                return 0;
            }
        }

        // Upsert: update LastReadAt if exists, otherwise create
        public Domain.Entities.QAConversationRead? UpsertRead(Domain.Entities.QAConversationRead read)
        {
            try
            {
                var existing = _context.QAConversationReads.FirstOrDefault(x => x.ConversationId == read.ConversationId && x.UserId == read.UserId);
                if (existing == null)
                {
                    var ent = ToEntity(read);
                    _context.QAConversationReads.Add(ent);
                    _context.SaveChanges();
                    var saved = _context.QAConversationReads
                        .Include(x => x.Conversation)
                        .FirstOrDefault(x => x.ConversationId == ent.ConversationId && x.UserId == ent.UserId);
                    return saved == null ? null : ToDomain(saved);
                }
                else
                {
                    existing.LastReadAt = read.LastReadAt == default ? DateTime.Now : read.LastReadAt;
                    _context.QAConversationReads.Update(existing);
                    _context.SaveChanges();
                    var updated = _context.QAConversationReads
                        .Include(x => x.Conversation)
                        .FirstOrDefault(x => x.ConversationId == existing.ConversationId && x.UserId == existing.UserId);
                    return updated == null ? null : ToDomain(updated);
                }
            }
            catch (Exception ex)
            {
                new InfrastructureException("QAConversationReadRepository", "UpsertRead failed: " + ex.Message).LogError();
                return null;
            }
        }
    }
}
