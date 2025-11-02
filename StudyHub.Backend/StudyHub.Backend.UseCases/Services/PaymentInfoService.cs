using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;

namespace StudyHub.Backend.UseCases.Services
{
    public class PaymentInfoService
    {
        private readonly IPaymentInfoRepository _repo;
        public PaymentInfoService(IPaymentInfoRepository repo)
        {
            _repo = repo;
        }

        public PaymentInfo? GetPaymentInfo(int schoolId)
        {
            return _repo.GetBySchoolId(schoolId);
        }

        public bool UpdatePaymentInfo(PaymentInfo info)
        {
            return _repo.UpdatePaymentInfo(info);
        }
    }
}
