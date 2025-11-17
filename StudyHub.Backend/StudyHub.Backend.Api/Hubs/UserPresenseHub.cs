using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using StudyHub.Backend.Api.Dtos.QADTOS;
using StudyHub.Backend.UseCases.Services;
using Microsoft.Extensions.Configuration;

namespace StudyHub.Backend.Api.Hubs
{
    public class UserPresenseHub : Hub
    {
        private readonly StudyHub.Backend.UseCases.Repositories.IAppUserLoginHistoryRepository? _loginHistoryRepo;

        public UserPresenseHub(StudyHub.Backend.UseCases.Repositories.IAppUserLoginHistoryRepository? loginHistoryRepo, IConfiguration configuration)
        {
            _loginHistoryRepo = loginHistoryRepo;
            try
            {
                var secs = configuration.GetValue<int?>("Presence:DebounceSeconds") ?? 1;
                PresenceTracker.DebounceSeconds = Math.Max(0, secs);
            }
            catch
            {
                // fallback to default handled by PresenceTracker
            }
        }
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
            // try read session id from cookie first, then claim, then query
            Guid? sessionId = null;
            string? sessionStr = null;
            try
            {
                sessionStr = http?.Request.Cookies["session_id"];
            }
            catch { sessionStr = null; }
            if (string.IsNullOrEmpty(sessionStr))
            {
                sessionStr = Context.User?.FindFirst("sessionId")?.Value ?? http?.Request.Query["sessionId"].ToString();
            }
            if (!string.IsNullOrEmpty(sessionStr) && Guid.TryParse(sessionStr, out var sid)) sessionId = sid;

            if (!string.IsNullOrEmpty(userId))
            {
                var shouldBroadcast = PresenceTracker.UserConnected(userId, Context.ConnectionId, fullname ?? "", roles, sessionId);
                // mark active session in DB if available
                if (sessionId.HasValue)
                {
                    try { _loginHistoryRepo?.MarkActiveSession(sessionId.Value); } catch { }
                }
                // broadcast presence change (throttled by PresenceTracker)
                if (shouldBroadcast)
                {
                    await Clients.All.SendAsync("PresenceChanged", PresenceTracker.GetOnlineUsersSummary());
                    await Clients.All.SendAsync("OnlineCount", PresenceTracker.GetOnlineCount());
                }
            }
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var http = Context.GetHttpContext();
            string? userId = Context.User?.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                ?? Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? http?.Request.Query["userId"].ToString();
            // read session id from cookie first, then claim, then query
            var sessionStr = (string?)null;
            try { sessionStr = http?.Request.Cookies["session_id"]; } catch { sessionStr = null; }
            if (string.IsNullOrEmpty(sessionStr)) sessionStr = Context.User?.FindFirst("sessionId")?.Value ?? http?.Request.Query["sessionId"].ToString();
            Guid? sessionId = null;
            if (!string.IsNullOrEmpty(sessionStr) && Guid.TryParse(sessionStr, out var sid2)) sessionId = sid2;

            if (!string.IsNullOrEmpty(userId))
            {
                var shouldBroadcast = PresenceTracker.UserDisconnected(userId, Context.ConnectionId, sessionId);

                // if user is now offline (last seen updated) and we have a sessionId then update DB logout/lastseen
                try
                {
                    // if last seen present in tracker for user, set in DB
                    var status = PresenceTracker.GetUserStatus(userId);
                    if (sessionId.HasValue && (status == null || ((dynamic)status).IsOnline == false))
                    {
                        var sidLocal = sessionId ?? Guid.Empty;
                        _loginHistoryRepo?.SetLogoutBySessionId(sidLocal, DateTime.UtcNow);
                    }
                }
                catch
                {
                    // ignore DB failures
                }

                if (shouldBroadcast)
                {
                    await Clients.All.SendAsync("PresenceChanged", PresenceTracker.GetOnlineUsersSummary());
                    await Clients.All.SendAsync("OnlineCount", PresenceTracker.GetOnlineCount());
                }
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
    private static readonly Microsoft.Extensions.Caching.Memory.MemoryCache _memCache = new(new Microsoft.Extensions.Caching.Memory.MemoryCacheOptions());
    // debounce TTL in seconds (configurable via Presence:DebounceSeconds)
    public static int DebounceSeconds { get; set; } = 1;

        public static bool UserConnected(string userId, string connectionId, string fullname, IEnumerable<string> roles, Guid? sessionId = null)
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
                if (sessionId.HasValue) info.SessionId = sessionId;
            }

            // per-user debounce using MemoryCache: allow broadcast only if no recent broadcast for this user
            var key = $"presence:{userId}:bcast";
            if (_memCache.TryGetValue(key, out _))
            {
                return false;
            }
            using (var e = _memCache.CreateEntry(key))
            {
                e.AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(DebounceSeconds);
                e.Value = true;
            }
            return true;
        }

        public static bool UserDisconnected(string userId, string connectionId, Guid? sessionId = null)
        {
            if (_users.TryGetValue(userId, out var info))
            {
                lock (info)
                {
                    info.ConnectionIds.Remove(connectionId);
                    if (info.ConnectionIds.Count == 0)
                    {
                        info.LastSeen = DateTime.Now;
                        if (sessionId.HasValue) info.SessionId = sessionId;
                    }
                }
                // per-user debounce using MemoryCache
                var key = $"presence:{userId}:bcast";
                if (_memCache.TryGetValue(key, out _))
                {
                    return false;
                }
                using (var e = _memCache.CreateEntry(key))
                {
                    e.AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(DebounceSeconds);
                    e.Value = true;
                }
                return true;
            }
            return false;
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
                    LastSeen = u.LastSeen,
                    SessionId = u.SessionId
                })
                .ToList<object>();
        }

        public static object? GetUserStatus(string userId)
        {
            if (_users.TryGetValue(userId, out var info))
            {
                return new { info.UserId, info.FullName, Roles = info.Roles, info.IsOnline, LastSeen = info.LastSeen, SessionId = info.SessionId };
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
        public Guid? SessionId { get; set; }
        public bool IsOnline => ConnectionIds != null && ConnectionIds.Count > 0;
    }
}
