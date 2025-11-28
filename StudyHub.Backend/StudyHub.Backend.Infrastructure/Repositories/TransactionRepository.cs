using StudyHub.Backend.Infrastructure.Data;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Dtos;
using DomainTransaction = StudyHub.Backend.Domain.Entities.Transaction;
using DataTransaction = StudyHub.Backend.Infrastructure.Data.Transaction;

namespace StudyHub.Backend.Infrastructure.Repositories
{
    public class TransactionRepository : ITransactionRepository
    {
        private readonly AppDbContext _context;
        public TransactionRepository(AppDbContext context)
        {
            _context = context;
        }

        public DomainTransaction CreateTransaction(DomainTransaction t)
        {
            var entity = new DataTransaction
            {
                UserId = t.UserId,
                Amount = t.Amount,
                Type = t.Type,
                CourseId = t.CourseId,
                ConversationId = t.ConversationId,
                Description = t.Description,
                Status = t.Status,
                TransactionCode = t.TransactionCode,
                CreatedAt = t.CreatedAt == default ? System.DateTime.Now : t.CreatedAt,
                ProcessedAt = t.ProcessedAt,
                QrcodeUrl = t.QrcodeUrl,
                AccountNumber = t.AccountNumber
            };
            _context.Transactions.Add(entity);
            _context.SaveChanges();
            t.Id = entity.Id;
            return t;
        }

        public DomainTransaction? GetByTransactionCode(string code)
        {
            var e = _context.Transactions.FirstOrDefault(x => x.TransactionCode == code);
            if (e == null) return null;
            return new DomainTransaction
            {
                Id = e.Id,
                UserId = e.UserId,
                Amount = e.Amount,
                Type = e.Type,
                CourseId = e.CourseId,
                ConversationId = e.ConversationId,
                Description = e.Description,
                Status = e.Status,
                TransactionCode = e.TransactionCode,
                CreatedAt = e.CreatedAt,
                ProcessedAt = e.ProcessedAt,
                QrcodeUrl = e.QrcodeUrl,
                AccountNumber = e.AccountNumber
            };
        }

        public List<DomainTransaction> GetByUser(Guid userId)
        {
            return _context.Transactions
                .Where(x => x.UserId == userId)
                .Select(x => new DomainTransaction
                {
                    Id = x.Id,
                    UserId = x.UserId,
                    Amount = x.Amount,
                    Type = x.Type,
                    CourseId = x.CourseId,
                    ConversationId = x.ConversationId,
                    Description = x.Description,
                    Status = x.Status,
                    TransactionCode = x.TransactionCode,
                    CreatedAt = x.CreatedAt,
                    ProcessedAt = x.ProcessedAt,
                    QrcodeUrl = x.QrcodeUrl,
                    AccountNumber = x.AccountNumber
                })
                .ToList();
        }

        public PagedResult<DomainTransaction> GetByFilter(string? type, string? status, int page, int limit)
        {
            if (page <= 0) page = 1;
            if (limit <= 0) limit = 50;

            var query = _context.Transactions.AsQueryable();

            if (!string.IsNullOrWhiteSpace(type))
            {
                var t = type.Trim().ToLower();
                query = query.Where(x => x.Type != null && x.Type.ToLower() == t);
            }

            if (!string.IsNullOrWhiteSpace(status))
            {
                var s = status.Trim().ToLower();
                query = query.Where(x => x.Status != null && x.Status.ToLower() == s);
            }

            var total = query.Count();

            var items = query
                .OrderByDescending(x => x.CreatedAt)
                .Skip((page - 1) * limit)
                .Take(limit)
                .Select(x => new DomainTransaction
                {
                    Id = x.Id,
                    UserId = x.UserId,
                    Amount = x.Amount,
                    Type = x.Type,
                    CourseId = x.CourseId,
                    ConversationId = x.ConversationId,
                    Description = x.Description,
                    Status = x.Status,
                    TransactionCode = x.TransactionCode,
                    CreatedAt = x.CreatedAt,
                    ProcessedAt = x.ProcessedAt,
                    QrcodeUrl = x.QrcodeUrl,
                    AccountNumber = x.AccountNumber
                })
                .ToList();

            return new PagedResult<DomainTransaction>
            {
                Items = items,
                Total = total,
                Page = page,
                Limit = limit,
                TotalPages = (int)System.Math.Ceiling(total / (double)limit)
            };
        }

        public List<DomainTransaction> GetForExport(string? type, string? status)
        {
            var query = _context.Transactions.AsQueryable();

            if (!string.IsNullOrWhiteSpace(type))
            {
                var t = type.Trim().ToLower();
                query = query.Where(x => x.Type != null && x.Type.ToLower() == t);
            }

            if (!string.IsNullOrWhiteSpace(status))
            {
                var s = status.Trim().ToLower();
                query = query.Where(x => x.Status != null && x.Status.ToLower() == s);
            }

            var items = query
                .OrderByDescending(x => x.CreatedAt)
                .Select(x => new DomainTransaction
                {
                    Id = x.Id,
                    UserId = x.UserId,
                    Amount = x.Amount,
                    Type = x.Type,
                    CourseId = x.CourseId,
                    ConversationId = x.ConversationId,
                    Description = x.Description,
                    Status = x.Status,
                    TransactionCode = x.TransactionCode,
                    CreatedAt = x.CreatedAt,
                    ProcessedAt = x.ProcessedAt,
                    QrcodeUrl = x.QrcodeUrl,
                    AccountNumber = x.AccountNumber
                })
                .ToList();

            return items;
        }

        public List<StudyHub.Backend.UseCases.Dtos.RevenueExportRow> GetRevenueForExport(System.DateTime? from, System.DateTime? to, int? courseId, System.Guid? teacherId, string? mode)
        {
            var q = _context.Transactions.AsQueryable();

            if (from.HasValue)
            {
                q = q.Where(x => x.CreatedAt >= from.Value);
            }
            if (to.HasValue)
            {
                // include whole day
                var end = to.Value.Date.AddDays(1).AddTicks(-1);
                q = q.Where(x => x.CreatedAt <= end);
            }
            if (courseId.HasValue)
            {
                q = q.Where(x => x.CourseId == courseId.Value);
            }

            // join where needed for teacher filter
            if (teacherId.HasValue)
            {
                q = q.Where(x => x.Course != null && x.Course.CreatedBy == teacherId.Value);
            }

            var modeLc = (mode ?? "time").ToLower();

            // Fetch minimal projection into memory first to avoid provider translation issues
            var projected = q.Select(x => new
            {
                x.CourseId,
                x.Amount,
                CreatedAt = x.CreatedAt,
                CourseName = x.Course != null ? x.Course.Name : null,
                CourseCreator = x.Course != null ? (System.Guid?)x.Course.CreatedBy : null
            }).ToList();

            if (modeLc == "course")
            {
                var rows = projected
                    .GroupBy(x => x.CourseId)
                    .Select(g => new StudyHub.Backend.UseCases.Dtos.RevenueExportRow
                    {
                        CourseId = g.Key,
                        CourseName = g.Select(x => x.CourseName).FirstOrDefault() ?? "(none)",
                        TeacherId = g.Select(x => x.CourseCreator).FirstOrDefault(),
                        TeacherName = null,
                        TotalAmount = g.Sum(x => x.Amount),
                        TransactionCount = g.Count(),
                        Label = g.Select(x => x.CourseName).FirstOrDefault() ?? (g.Key?.ToString() ?? "(none)")
                    })
                    .OrderByDescending(r => r.TotalAmount)
                    .ToList();

                return rows;
            }

            // default: group by date (in-memory grouping to avoid Date translation issues)
            var daily = projected
                .GroupBy(x => x.CreatedAt.Date)
                .Select(g => new StudyHub.Backend.UseCases.Dtos.RevenueExportRow
                {
                    Label = g.Key.ToString("yyyy-MM-dd"),
                    TotalAmount = g.Sum(x => x.Amount),
                    TransactionCount = g.Count()
                })
                .OrderBy(r => r.Label)
                .ToList();

            return daily;
        }

        public bool UpdateStatus(int id, string status)
        {
            var e = _context.Transactions.FirstOrDefault(x => x.Id == id);
            if (e == null) return false;
            e.Status = status;
            e.ProcessedAt = System.DateTime.Now;
            _context.Transactions.Update(e);
            _context.SaveChanges();
            return true;
        }

        public bool UpdateTransaction(DomainTransaction t)
        {
            var e = _context.Transactions.FirstOrDefault(x => x.Id == t.Id);
            if (e == null) return false;
            e.QrcodeUrl = t.QrcodeUrl ?? e.QrcodeUrl;
            e.AccountNumber = t.AccountNumber ?? e.AccountNumber;
            e.Description = t.Description ?? e.Description;
            e.Status = t.Status ?? e.Status;
            e.ProcessedAt = t.ProcessedAt ?? e.ProcessedAt;
            _context.Transactions.Update(e);
            _context.SaveChanges();
            return true;
        }

        public bool ExistsByTransactionCode(string code)
        {
            return _context.Transactions.Any(x => x.TransactionCode == code);
        }
    }
}
