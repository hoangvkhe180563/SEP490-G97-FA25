using StudyHub.Backend.Infrastructure.Data;
using StudyHub.Backend.UseCases.Repositories;
using DomainPayment = StudyHub.Backend.Domain.Entities.PaymentInfo;
using DataPayment = StudyHub.Backend.Infrastructure.Data.PaymentInfo;

namespace StudyHub.Backend.Infrastructure.Repositories
{
    public class PaymentInfoRepository : IPaymentInfoRepository
    {
        private readonly AppDbContext _context;
        public PaymentInfoRepository(AppDbContext context)
        {
            _context = context;
        }

        public DomainPayment? GetBySchoolId(int schoolId)
        {
            var d = _context.PaymentInfos.Find(schoolId);
            if (d == null) return null;
            return new DomainPayment
            {
                SchoolId = d.SchoolId,
                AccountName = d.AccountName,
                AccountNumber = d.AccountNumber,
                AccountBank = d.AccountBank,
                ExchangeRate = d.ExchangeRate,
                QrcodeUrl = d.QrcodeUrl,
            };
        }

        public bool UpdatePaymentInfo(DomainPayment info)
        {
            var existing = _context.PaymentInfos.Find(info.SchoolId);
            if (existing == null) return false;
            existing.AccountName = info.AccountName;
            existing.AccountNumber = info.AccountNumber;
            existing.AccountBank = info.AccountBank;
            existing.ExchangeRate = info.ExchangeRate;
            existing.QrcodeUrl = info.QrcodeUrl;
            _context.PaymentInfos.Update(existing);
            _context.SaveChanges();
            return true;
        }
    }
}
