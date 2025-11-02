using Microsoft.AspNetCore.SignalR;

namespace StudyHub.Backend.Api.Hubs
{
    public class ClassNotificationHub : Hub
    {
        public override async Task OnConnectedAsync()
        {
            var userId = Context.User?.FindFirst("id")?.Value;
            if (!string.IsNullOrEmpty(userId))
                await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");

            await base.OnConnectedAsync();
        }
        public async Task JoinClass(string classId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"class_{classId}");
        }
        public async Task LeaveClass(string classId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"class_{classId}");
        }
    }
}
