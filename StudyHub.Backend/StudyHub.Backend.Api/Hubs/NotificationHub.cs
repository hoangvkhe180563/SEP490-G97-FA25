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
                // Thử lấy user từ AuthService
                var user = _authService.GetCurrentUser();
                if (user != null)
                {
                    var userId = user.Id;
                    await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
                    Console.WriteLine($"✅ User {userId} joined notification group");
                }
            }
            catch (Exception ex)
            {
                // Nếu không có claims, thử lấy từ Context trực tiếp
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
    }
}