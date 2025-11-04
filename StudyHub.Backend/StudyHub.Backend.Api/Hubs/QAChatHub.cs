using Microsoft.AspNetCore.SignalR;
using StudyHub.Backend.UseCases.Services;
using StudyHub.Backend.Api.Mappers;
using System.Security.Claims;

namespace StudyHub.Backend.Api.Hubs
{
    public class QAChatHub : Hub
    {
        private readonly QAMessageService _messageService;

        public QAChatHub(QAMessageService messageService)
        {
            _messageService = messageService;
        }

        // join the SignalR group for a conversation so the client receives messages for it
        public Task JoinConversation(string conversationId)
        {
            var group = $"conversation-{conversationId}";
            return Groups.AddToGroupAsync(Context.ConnectionId, group);
        }

        public Task LeaveConversation(string conversationId)
        {
            var group = $"conversation-{conversationId}";
            return Groups.RemoveFromGroupAsync(Context.ConnectionId, group);
        }

        // send a message in a conversation (will create message via service and broadcast to group)
        public async Task SendMessageInQAConversation(string conversationId, string content)
        {
            if (string.IsNullOrWhiteSpace(conversationId)) return;
            // try parse guid
            if (!Guid.TryParse(conversationId, out var convGuid)) return;

            // create message via service (service determines sender from auth)
            var created = _messageService.CreateQAMessage(convGuid, content, false, false);
            if (created == null) return;

            var dto = QAMessageMapper.MapToDto(created);
            var group = $"conversation-{conversationId}";
            await Clients.Group(group).SendAsync("ReceiveMessage", dto);
        }

        // typing indicator - broadcast to others in conversation group
        public Task Typing(string conversationId, bool isTyping)
        {
            var userId = Context.User?.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
                ?? Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? string.Empty;
            var group = $"conversation-{conversationId}";
            return Clients.OthersInGroup(group).SendAsync("UserTyping", new { ConversationId = conversationId, UserId = userId, IsTyping = isTyping });
        }
    }
}
