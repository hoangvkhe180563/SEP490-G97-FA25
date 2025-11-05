using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using StudyHub.Backend.Api.Dtos.QADTOS;
using StudyHub.Backend.UseCases.Services;

namespace StudyHub.Backend.Api.Hubs
{
    public class UserPresenseHub : Hub
    {
        public override async Task OnConnectedAsync()
        {
            // determine user id from claims or querystring
            var http = Context.GetHttpContext();
            // support JWT 'sub' claim as well as ClaimTypes.NameIdentifier
            string? userId = Context.User?.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                ?? Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? http?.Request.Query["userId"].ToString();
            // prefer Name claim for display name, fallback to email or identity name
            string? fullname = Context.User?.FindFirst(ClaimTypes.Name)?.Value
                ?? Context.User?.FindFirst(ClaimTypes.Email)?.Value
                ?? Context.User?.Identity?.Name;
            var roles = Context.User?.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList() ?? new List<string> { "User" };
            if (!string.IsNullOrEmpty(userId))
            {
                PresenceTracker.UserConnected(userId, Context.ConnectionId, fullname ?? "", roles);
                // broadcast presence change
                await Clients.All.SendAsync("PresenceChanged", PresenceTracker.GetOnlineUsersSummary());
                await Clients.All.SendAsync("OnlineCount", PresenceTracker.GetOnlineCount());
            }
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var http = Context.GetHttpContext();
            string? userId = Context.User?.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                ?? Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? http?.Request.Query["userId"].ToString();
            if (!string.IsNullOrEmpty(userId))
            {
                PresenceTracker.UserDisconnected(userId, Context.ConnectionId);
                await Clients.All.SendAsync("PresenceChanged", PresenceTracker.GetOnlineUsersSummary());
                await Clients.All.SendAsync("OnlineCount", PresenceTracker.GetOnlineCount());
            }
            await base.OnDisconnectedAsync(exception);
        }
        // client helpers
        public Task GetOnlineCount()
        {
            return Clients.Caller.SendAsync("OnlineCount", PresenceTracker.GetOnlineCount());
        }

        public Task GetOnlineUsers()
        {
            return Clients.Caller.SendAsync("OnlineUsers", PresenceTracker.GetOnlineUsersSummary());
        }

        public Task GetUserStatus(string userId)
        {
            var status = PresenceTracker.GetUserStatus(userId);
            return Clients.Caller.SendAsync("UserStatus", status);
        }

        public Task GetOnlineTeachersExceptConnected(string excludeCsv)
        {
            var exclude = (excludeCsv ?? string.Empty).Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            var list = PresenceTracker.GetOnlineTeachersExceptConnected(exclude);
            return Clients.Caller.SendAsync("OnlineTeachersAvailable", list);
        }

    }

    // simple, in-memory presence tracker shared by hubs/controllers
    public static class PresenceTracker
    {
        private static readonly ConcurrentDictionary<string, PresenceInfo> _users = new();

        public static void UserConnected(string userId, string connectionId, string fullname, IEnumerable<string> roles)
        {
            var info = _users.GetOrAdd(userId, id => new PresenceInfo
            {
                UserId = id,
                FullName = fullname,
                Roles = roles?.ToList() ?? new List<string>(),
                ConnectionIds = new HashSet<string>()
            });
            lock (info)
            {
                info.ConnectionIds.Add(connectionId);
                info.LastSeen = null;
            }
        }

        public static void UserDisconnected(string userId, string connectionId)
        {
            if (_users.TryGetValue(userId, out var info))
            {
                lock (info)
                {
                    info.ConnectionIds.Remove(connectionId);
                    if (info.ConnectionIds.Count == 0)
                    {
                        info.LastSeen = DateTime.UtcNow;
                    }
                }
            }
        }

        public static int GetOnlineCount()
        {
            return _users.Count(kv => kv.Value.IsOnline);
        }

        public static List<object> GetOnlineUsersSummary()
        {
            return _users.Values
                .Select(u => new
                {
                    u.UserId,
                    u.FullName,
                    Roles = u.Roles,
                    IsOnline = u.IsOnline,
                    // LastSeen is null when user is currently online
                    LastSeen = u.LastSeen
                })
                .ToList<object>();
        }

        public static object? GetUserStatus(string userId)
        {
            if (_users.TryGetValue(userId, out var info))
            {
                return new { info.UserId, info.FullName, Roles = info.Roles, info.IsOnline, LastSeen = info.LastSeen };
            }
            return null;
        }

        public static List<object> GetOnlineTeachersExceptConnected(IEnumerable<string> exclude)
        {
            var set = new HashSet<string>(exclude ?? Array.Empty<string>());
            return _users.Values
                .Where(u => u.IsOnline && u.Roles.Any(r => string.Equals(r, "Teacher", StringComparison.OrdinalIgnoreCase)) && !set.Contains(u.UserId))
                .Select(u => new { u.UserId, u.FullName })
                .ToList<object>();
        }
    }

    public class PresenceInfo
    {
        public string UserId { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public List<string> Roles { get; set; } = new();
        public HashSet<string> ConnectionIds { get; set; } = new();
        public DateTime? LastSeen { get; set; }
        public bool IsOnline => ConnectionIds != null && ConnectionIds.Count > 0;
    }
}
