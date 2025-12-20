using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Dtos;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface IAccountRecoveryRequestRepository
    {
        PagedResult<AccountRecoveryRequest> GetBySearchAndFilter(string? search, string? status, int page, int limit, int? schoolId = null);
        AccountRecoveryRequest? GetById(Guid id);
        void Create(AccountRecoveryRequest request);
        void Update(AccountRecoveryRequest request);
    }
}
