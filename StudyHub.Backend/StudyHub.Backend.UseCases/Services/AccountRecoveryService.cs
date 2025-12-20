using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Api.Services;
using StudyHub.Backend.UseCases.Dtos;
using StudyHub.Backend.UseCases.Repositories;

namespace StudyHub.Backend.UseCases.Services
{
    public class AccountRecoveryService
    {
        private readonly IAccountRecoveryRequestRepository _repo;
        private readonly IAppUserRepository _userRepo;
        private readonly SmtpEmailService _emailService;

        public AccountRecoveryService(IAccountRecoveryRequestRepository repo, IAppUserRepository userRepo, SmtpEmailService emailService)
        {
            _repo = repo;
            _userRepo = userRepo;
            _emailService = emailService;
        }

        public void CreateRequest(Guid userId, string reason)
        {
            var user = _userRepo.GetById(userId);
            if (user == null) throw new InvalidOperationException("Người dùng không tìm thấy");

            var req = new AccountRecoveryRequest
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                RequestReason = reason,
                Status = "Đang chờ",
                CreatedAt = DateTime.Now
            };

            _repo.Create(req);
        }

        public PagedResult<AccountRecoveryRequest> SearchRequests(string? search, string? status, int page, int limit, int? schoolId = null)
        {
            return _repo.GetBySearchAndFilter(search, status, page, limit, schoolId);
        }

        public AccountRecoveryRequest? GetById(Guid id) => _repo.GetById(id);

        public async Task UpdateStatus(Guid id, string status, Guid processedBy, bool applyToUser = false)
        {
            var req = _repo.GetById(id);
            if (req == null) throw new InvalidOperationException("Yêu cầu không tìm thấy");
            req.Status = status;
            req.ProcessedAt = DateTime.Now;
            req.ProcessedBy = processedBy;
            _repo.Update(req);

            var user = _userRepo.GetById(req.UserId);
            if (applyToUser && (status.Equals("Đã phê duyệt", StringComparison.OrdinalIgnoreCase) || status.Equals("Approved", StringComparison.OrdinalIgnoreCase)))
            {
                if (user != null)
                {
                    user.Status = true;
                    user.UpdatedAt = DateTime.Now;
                    _userRepo.UpdateUser(user);
                }
            }

            // send notification email if possible
            try
            {
                var toEmail = req.User?.Email ?? user?.Email;
                var username = req.User?.Username ?? user?.Username ?? "";
                if (!string.IsNullOrWhiteSpace(toEmail))
                {
                    await _emailService.SendAccountRecoveryStatusEmailAsync(toEmail, username, status, req.RequestReason ?? "");
                }
            }
            catch
            {
                // best-effort: don't block status update if email fails
            }
        }
    }
}
