using System;
using System.Collections.Generic;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;

namespace StudyHub.Backend.UseCases.Services
{
    public class QAConversationReadService
    {
        private readonly IQAConversationReadRepository _repo;
        private readonly AuthService _authService;

        public QAConversationReadService(IQAConversationReadRepository repo, AuthService authService)
        {
            _repo = repo;
            _authService = authService;
        }

        public List<QAConversationRead> GetReadsByConversationId(Guid conversationId)
        {
            return _repo.GetReadsByConversationId(conversationId);
        }

        public List<QAConversationRead> GetReadsByUserId(Guid userId)
        {
            return _repo.GetReadsByUserId(userId);
        }

        public QAConversationRead? GetReadByUserAndConversation(Guid userId, Guid conversationId)
        {
            return _repo.GetReadByUserAndConversation(userId, conversationId);
        }

        public int CountReadByUserAndConversation(Guid userId, Guid conversationId)
        {
            return _repo.CountReadByUserAndConversation(userId, conversationId);
        }

        public int CountUnreadMessagesForUser(Guid conversationId, Guid userId)
        {
            return _repo.CountUnreadMessagesForUser(conversationId, userId);
        }

        // Convenience: count unread messages for the current authenticated user
        public int CountUnreadMessagesForCurrentUser(Guid conversationId)
        {
            var current = _authService.GetCurrentUser();
            if (current == null) return 0;
            return CountUnreadMessagesForUser(conversationId, current.Id);
        }

        // Convenience: mark read for current user
        public QAConversationRead? MarkReadForCurrentUser(Guid conversationId)
        {
            var current = _authService.GetCurrentUser();
            if (current == null) return null;
            var read = new QAConversationRead
            {
                ConversationId = conversationId,
                UserId = current.Id,
                LastReadAt = DateTime.Now
            };
            return _repo.UpsertRead(read);
        }

        public QAConversationRead? UpsertRead(Guid conversationId, Guid userId)
        {
            var read = new QAConversationRead
            {
                ConversationId = conversationId,
                UserId = userId,
                LastReadAt = DateTime.Now
            };
            return _repo.UpsertRead(read);
        }
    }
}
