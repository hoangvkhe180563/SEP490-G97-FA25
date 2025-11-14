using System;
using System.Linq;
using StudyHub.Backend.Infrastructure.Data;
using StudyHub.Backend.UseCases.Repositories;
using DomainEnt = StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.Infrastructure.Repositories
{
    public class AppUserLoginHistoryRepository : IAppUserLoginHistoryRepository
    {
        private readonly AppDbContext _context;

        public AppUserLoginHistoryRepository(AppDbContext context)
        {
            _context = context;
        }

        private static DomainEnt.AppUserLoginHistory ToDomain(Data.AppUserLoginHistory d)
        {
            return new DomainEnt.AppUserLoginHistory
            {
                Id = d.Id,
                UserId = d.UserId,
                LoginAt = d.LoginAt,
                LogoutAt = d.LogoutAt,
                IsSuccess = d.IsSuccess,
                SessionId = d.SessionId,
                IsActiveSession = d.IsActiveSession,
                LastSeen = d.LastSeen
            };
        }

        private static Data.AppUserLoginHistory ToData(DomainEnt.AppUserLoginHistory d)
        {
            return new Data.AppUserLoginHistory
            {
                Id = d.Id,
                UserId = d.UserId,
                LoginAt = d.LoginAt,
                LogoutAt = d.LogoutAt,
                IsSuccess = d.IsSuccess,
                SessionId = d.SessionId,
                IsActiveSession = d.IsActiveSession,
                LastSeen = d.LastSeen
            };
        }

        public void Create(DomainEnt.AppUserLoginHistory entry)
        {
            var d = ToData(entry);
            _context.AppUserLoginHistories.Add(d);
            _context.SaveChanges();
            // update id back
            entry.Id = d.Id;
        }

        public DomainEnt.AppUserLoginHistory? GetBySessionId(Guid sessionId)
        {
            var d = _context.AppUserLoginHistories.FirstOrDefault(x => x.SessionId == sessionId);
            return d == null ? null : ToDomain(d);
        }

        public (List<DomainEnt.AppUserLoginHistory> Items, int Total) ListByUserPaged(Guid userId, int page, int limit, string? sortBy = null, bool sortDesc = true, bool? isActive = null)
        {
            if (page < 1) page = 1;
            if (limit < 1) limit = 10;
            var query = _context.AppUserLoginHistories.Where(x => x.UserId == userId);

            if (isActive.HasValue)
            {
                query = query.Where(x => x.IsActiveSession == isActive.Value);
            }

            // choose ordering
            sortBy = (sortBy ?? "loginAt").ToLowerInvariant();
            switch (sortBy)
            {
                case "logoutat":
                case "logout":
                    query = sortDesc ? query.OrderByDescending(x => x.LogoutAt) : query.OrderBy(x => x.LogoutAt);
                    break;
                case "lastseen":
                case "last_seen":
                    query = sortDesc ? query.OrderByDescending(x => x.LastSeen) : query.OrderBy(x => x.LastSeen);
                    break;
                case "isactive":
                case "active":
                    query = sortDesc ? query.OrderByDescending(x => x.IsActiveSession) : query.OrderBy(x => x.IsActiveSession);
                    break;
                case "sessionid":
                case "session":
                    query = sortDesc ? query.OrderByDescending(x => x.SessionId) : query.OrderBy(x => x.SessionId);
                    break;
                default:
                    query = sortDesc ? query.OrderByDescending(x => x.LoginAt) : query.OrderBy(x => x.LoginAt);
                    break;
            }

            var total = query.Count();
            var items = query.Skip((page - 1) * limit).Take(limit).ToList().Select(x => ToDomain(x)).ToList();
            return (items, total);
        }

        public void SetLogoutBySessionId(Guid sessionId, DateTime logoutAt)
        {
            var d = _context.AppUserLoginHistories.FirstOrDefault(x => x.SessionId == sessionId);
            if (d == null) return;
            d.LogoutAt = logoutAt;
            d.IsActiveSession = false;
            d.LastSeen = logoutAt;
            _context.AppUserLoginHistories.Update(d);
            _context.SaveChanges();
        }

        public void UpdateLastSeenBySessionId(Guid sessionId, DateTime lastSeen)
        {
            var d = _context.AppUserLoginHistories.FirstOrDefault(x => x.SessionId == sessionId);
            if (d == null) return;
            d.LastSeen = lastSeen;
            _context.AppUserLoginHistories.Update(d);
            _context.SaveChanges();
        }

        public void MarkActiveSession(Guid sessionId)
        {
            var d = _context.AppUserLoginHistories.FirstOrDefault(x => x.SessionId == sessionId);
            if (d == null) return;
            d.IsActiveSession = true;
            d.LastSeen = null;
            _context.AppUserLoginHistories.Update(d);
            _context.SaveChanges();
        }
    }
}
