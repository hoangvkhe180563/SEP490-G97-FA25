using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Dtos;

namespace StudyHub.Backend.UseCases.Services
{
    public class TransactionService
    {
        private readonly ITransactionRepository _txRepo;
        private readonly IAppUserRepository _userRepo;

        public TransactionService(ITransactionRepository txRepo, IAppUserRepository userRepo)
        {
            _txRepo = txRepo;
            _userRepo = userRepo;
        }

        public bool ExistsByTransactionCode(string code) => _txRepo.ExistsByTransactionCode(code);

        public Transaction CreateTransaction(Transaction t) => _txRepo.CreateTransaction(t);

        public Transaction? GetByTransactionCode(string code) => _txRepo.GetByTransactionCode(code);

        public List<Transaction> GetByUser(Guid userId) => _txRepo.GetByUser(userId);
        public PagedResult<Transaction> GetByFilter(string? type, string? status, int page, int limit) => _txRepo.GetByFilter(type, status, page, limit);

        public List<Transaction> GetForExport(string? type, string? status) => _txRepo.GetForExport(type, status);

        // revenue export helper
        public List<RevenueExportRow> GetRevenueForExport(DateTime? from, DateTime? to, int? courseId, Guid? teacherId, string? mode)
        {
            return _txRepo.GetRevenueForExport(from, to, courseId, teacherId, mode);
        }

        public bool UpdateStatus(int id, string status) => _txRepo.UpdateStatus(id, status);

        public bool UpdateTransaction(Transaction t) => _txRepo.UpdateTransaction(t);

        // helper: find user id by transfer id (from app user repo)
        public Guid? GetUserIdByTransferId(int transferId)
        {
            var u = _userRepo.GetByTransferId(transferId);
            return u?.Id;
        }
    }
}