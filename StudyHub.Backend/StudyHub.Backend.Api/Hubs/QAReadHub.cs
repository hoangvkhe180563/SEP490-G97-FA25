using Microsoft.AspNetCore.SignalR;
using StudyHub.Backend.UseCases.Services;
using System.Threading.Tasks;

namespace StudyHub.Backend.Api.Hubs
{
    public class QAReadHub : Hub
    {
        private readonly QAConversationReadService _readService;
        private readonly AuthService _authService;

        public QAReadHub(QAConversationReadService readService, AuthService authService)
        {
            _readService = readService;
            _authService = authService;
        }

        // Client calls this to mark the conversation as read for the current user.
        // Hub will upsert the QAConversationRead and broadcast the user's read event to the conversation group,
        // and send the unread count back to the caller.
        public async Task UpsertRead(string conversationId)
        {
            if (!System.Guid.TryParse(conversationId, out var convId)) return;
            var current = _authService.GetCurrentUser();
            if (current == null) return;

            var updated = _readService.UpsertRead(convId, current.Id);
            var unread = _readService.CountUnreadMessagesForUser(convId, current.Id);

            // send unread count back to the caller so their UI can update
            await Clients.Caller.SendAsync("UnreadCountUpdated", new { ConversationId = conversationId, UnreadCount = unread });

            // notify other group members that this user has read up to LastReadAt
            await Clients.Group($"conversation-{conversationId}").SendAsync("UserRead", new
            {
                ConversationId = conversationId,
                UserId = current.Id.ToString(),
                LastReadAt = updated?.LastReadAt
            });
        }

        // Get unread count for current user in a conversation
        public async Task GetUnreadCount(string conversationId)
        {
            if (!System.Guid.TryParse(conversationId, out var convId)) return;
            var current = _authService.GetCurrentUser();
            if (current == null) return;
            var unread = _readService.CountUnreadMessagesForUser(convId, current.Id);
            await Clients.Caller.SendAsync("UnreadCount", new { ConversationId = conversationId, UnreadCount = unread });
        }

        // Get unread count for a specific user in a conversation (useful for admins or other clients)
        public async Task GetUnreadCountForUser(string conversationId, string userId)
        {
            if (!System.Guid.TryParse(conversationId, out var convId)) return;
            if (!System.Guid.TryParse(userId, out var uId)) return;
            var unread = _readService.CountUnreadMessagesForUser(convId, uId);
            await Clients.Caller.SendAsync("UnreadCountForUser", new { ConversationId = conversationId, UserId = userId, UnreadCount = unread });
        }
    }
}
