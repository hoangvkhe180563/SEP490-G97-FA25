using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface IAppUserLoginHistoryRepository
    {
        void Create(AppUserLoginHistory entry);
        AppUserLoginHistory? GetBySessionId(Guid sessionId);
        void SetLogoutBySessionId(Guid sessionId, DateTime logoutAt);
        void UpdateLastSeenBySessionId(Guid sessionId, DateTime lastSeen);
        void MarkActiveSession(Guid sessionId);
        // sortBy: loginAt | logoutAt | lastSeen | isActive | sessionId
        // sortDesc: true = descending
        // isActive: optional filter for active sessions
        (List<AppUserLoginHistory> Items, int Total) ListByUserPaged(Guid userId, int page, int limit, string? sortBy = null, bool sortDesc = true, bool? isActive = null);
    }
}
