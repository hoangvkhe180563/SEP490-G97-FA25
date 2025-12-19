using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface IPaymentInfoRepository
    {
        PaymentInfo? GetBySchoolId(int schoolId);
        bool UpdatePaymentInfo(PaymentInfo info);
        bool AddPaymentInfo(PaymentInfo info);
    }
}
