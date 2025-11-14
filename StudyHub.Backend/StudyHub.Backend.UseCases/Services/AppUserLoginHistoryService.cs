using System;
using System.Collections.Generic;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.UseCases.Services
{
    public class AppUserLoginHistoryService
    {
        private readonly IAppUserLoginHistoryRepository _repo;

        public AppUserLoginHistoryService(IAppUserLoginHistoryRepository repo)
        {
            _repo = repo;
        }

        public (List<AppUserLoginHistory> Items, int Total) GetHistory(Guid userId, int page, int limit, string? sortBy = null, bool sortDesc = true, bool? isActive = null)
        {
            return _repo.ListByUserPaged(userId, page, limit, sortBy, sortDesc, isActive);
        }
    }
}
