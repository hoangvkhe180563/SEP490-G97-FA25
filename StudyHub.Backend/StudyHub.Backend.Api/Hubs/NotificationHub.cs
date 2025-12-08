using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using StudyHub.Backend.Api.Services;
using StudyHub.Backend.UseCases.Services;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace StudyHub.Backend.Api.Hubs
{
    [AllowAnonymous]
    public class NotificationHub : Hub
    {
        private readonly AuthService _authService;

        public NotificationHub(AuthService authService)
        {
            _authService = authService;
        }

        public override async Task OnConnectedAsync()
        {
            Console.WriteLine($"✅ NotificationHub connected: {Context.ConnectionId}");

            try
            {
                var user = _authService.GetCurrentUser();
                if (user != null)
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{user.Id}");
                    Console.WriteLine($"✅ User {user.Id} joined notification group");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ AuthService failed: {ex.Message}");

                var userIdClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                                  ?? Context.User?.FindFirst("sub")?.Value
                                  ?? Context.User?.FindFirst("id")?.Value;

                if (!string.IsNullOrEmpty(userIdClaim) && Guid.TryParse(userIdClaim, out var userId))
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
                    Console.WriteLine($"✅ User {userId} joined notification group (fallback)");
                }
                else
                {
                    Console.WriteLine($"⚠️ No user claims found, skipping group join");
                }
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            Console.WriteLine($"❌ NotificationHub disconnected: {Context.ConnectionId}");
            await base.OnDisconnectedAsync(exception);
        }

        // Cho phép client chủ động join nhóm user khi cần
        public async Task JoinUser(Guid userId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
            Console.WriteLine($"✅ Joined user group: user_{userId}");
        }

        public async Task JoinGroup(int groupId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"group_{groupId}");
            Console.WriteLine($"✅ Joined group: group_{groupId}");
        }

        public async Task LeaveGroup(int groupId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"group_{groupId}");
            Console.WriteLine($"✅ Left group: group_{groupId}");
        }

        // Hub method để forward NotificationCreated tới đúng user group (hoặc caller)
        public async Task NotificationCreated(object payload)
        {
            // Lấy userId từ claims để gửi vào group user_{id}
            var userIdClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                              ?? Context.User?.FindFirst("sub")?.Value
                              ?? Context.User?.FindFirst("id")?.Value;

            if (!string.IsNullOrEmpty(userIdClaim) && Guid.TryParse(userIdClaim, out var userId))
            {
                await Clients.Group($"user_{userId}").SendAsync("NotificationCreated", payload);
                return;
            }

            // fallback: gửi về chính connection hiện tại
            await Clients.Caller.SendAsync("NotificationCreated", payload);
        }
    }
}