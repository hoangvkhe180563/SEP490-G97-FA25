using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Dtos;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface ITransactionRepository
    {
        Transaction CreateTransaction(Transaction t);
        Transaction? GetByTransactionCode(string code);
        List<Transaction> GetByUser(Guid userId);
        PagedResult<Transaction> GetByFilter(string? type, string? status, int page, int limit);
        List<Transaction> GetForExport(string? type, string? status);
        // Revenue reporting / export
        List<StudyHub.Backend.UseCases.Dtos.RevenueExportRow> GetRevenueForExport(System.DateTime? from, System.DateTime? to, int? courseId, System.Guid? teacherId, string? mode);
        bool UpdateStatus(int id, string status);
        bool UpdateTransaction(Transaction t);
        bool ExistsByTransactionCode(string code);
    }
}
