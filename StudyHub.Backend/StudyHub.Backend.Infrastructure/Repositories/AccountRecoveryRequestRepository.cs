using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Infrastructure.Data;
using StudyHub.Backend.Infrastructure.Exceptions;
using StudyHub.Backend.UseCases.Dtos;
using StudyHub.Backend.UseCases.Repositories;

namespace StudyHub.Backend.Infrastructure.Repositories
{
    public class AccountRecoveryRequestRepository : IAccountRecoveryRequestRepository
    {
        private readonly AppDbContext _context;
        private const int DEFAULT_PAGE_SIZE = 10;
        private const int DEFAULT_CURRENT_PAGE = 1;

        public AccountRecoveryRequestRepository(AppDbContext context)
        {
            _context = context;
        }

        private static Domain.Entities.AccountRecoveryRequest ToDomain(Data.AccountRecoveryRequest d)
        {
            return new Domain.Entities.AccountRecoveryRequest
            {
                Id = d.Id,
                UserId = d.UserId,
                RequestReason = d.RequestReason,
                Status = d.Status,
                CreatedAt = d.CreatedAt,
                ProcessedAt = d.ProcessedAt,
                ProcessedBy = d.ProcessedBy
            };
        }

        public void Create(Domain.Entities.AccountRecoveryRequest request)
        {
            var d = new Data.AccountRecoveryRequest
            {
                Id = request.Id == Guid.Empty ? Guid.NewGuid() : request.Id,
                UserId = request.UserId,
                RequestReason = request.RequestReason,
                Status = request.Status,
                CreatedAt = request.CreatedAt,
                ProcessedAt = request.ProcessedAt,
                ProcessedBy = request.ProcessedBy
            };
            _context.AccountRecoveryRequests.Add(d);
            _context.SaveChanges();
        }

        public Domain.Entities.AccountRecoveryRequest? GetById(Guid id)
        {
            var d = _context.AccountRecoveryRequests.Include(r => r.User).FirstOrDefault(r => r.Id == id);
            return d == null ? null : ToDomain(d);
        }

        public void Update(Domain.Entities.AccountRecoveryRequest request)
        {
            var existing = _context.AccountRecoveryRequests.FirstOrDefault(r => r.Id == request.Id);
            if (existing == null) return;
            existing.RequestReason = request.RequestReason;
            existing.Status = request.Status;
            existing.ProcessedAt = request.ProcessedAt;
            existing.ProcessedBy = request.ProcessedBy;
            _context.AccountRecoveryRequests.Update(existing);
            _context.SaveChanges();
        }

        public PagedResult<Domain.Entities.AccountRecoveryRequest> GetBySearchAndFilter(string? search, string? status, int page, int limit, int? schoolId = null)
        {
            try
            {
                var q = _context.AccountRecoveryRequests.Include(r => r.User).AsQueryable();
                if (schoolId.HasValue)
                    q = q.Where(r => r.User != null && r.User.SchoolId == schoolId.Value);

                if (!string.IsNullOrEmpty(status))
                {
                    q = q.Where(r => (r.Status ?? "").ToLower() == status.ToLower());
                }

                if (!string.IsNullOrEmpty(search))
                {
                    var s = search.ToLower();
                    q = q.Where(r => (r.User.Email ?? "").ToLower().Contains(s) || (r.User.Username ?? "").ToLower().Contains(s));
                }

                var total = q.Count();
                if (page < 1) page = DEFAULT_CURRENT_PAGE;
                if (limit < 1) limit = DEFAULT_PAGE_SIZE;
                var totalPages = (int)Math.Ceiling(total / (double)limit);
                var paged = q.OrderByDescending(r => r.CreatedAt).Skip((page - 1) * limit).Take(limit).ToList();

                var items = paged.Select(r => new Domain.Entities.AccountRecoveryRequest
                {
                    Id = r.Id,
                    UserId = r.UserId,
                    RequestReason = r.RequestReason,
                    Status = r.Status,
                    CreatedAt = r.CreatedAt,
                    ProcessedAt = r.ProcessedAt,
                    ProcessedBy = r.ProcessedBy,
                    User = r.User == null ? null! : new Domain.Entities.AppUser { Id = r.User.Id, Email = r.User.Email, Username = r.User.Username }
                }).ToList();

                return new PagedResult<Domain.Entities.AccountRecoveryRequest>
                {
                    Items = items,
                    Total = total,
                    Page = page,
                    Limit = limit,
                    TotalPages = totalPages
                };
            }
            catch (Exception ex)
            {
                new InfrastructureException("AccountRecoveryRepository", "UpdateUser failed. Inner error: " + ex.Message).LogError();
                return new PagedResult<Domain.Entities.AccountRecoveryRequest>();
            }
        }
    }
}
