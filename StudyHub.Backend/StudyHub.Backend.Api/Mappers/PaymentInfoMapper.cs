using StudyHub.Backend.Api.Dtos.PaymentDTOS;
using DomainPayment = StudyHub.Backend.Domain.Entities.PaymentInfo;

namespace StudyHub.Backend.Api.Mappers
{
    public static class PaymentInfoMapper
    {
        public static PaymentInfoDto ToDto(this DomainPayment p)
        {
            if (p == null) return new PaymentInfoDto();
            return new PaymentInfoDto
            {
                SchoolId = p.SchoolId,
                AccountName = p.AccountName,
                AccountNumber = p.AccountNumber,
                AccountBank = p.AccountBank,
                ExchangeRate = p.ExchangeRate,
                QrCodeUrl = p.QrcodeUrl
            };
        }

        public static DomainPayment ToDomain(this PaymentInfoDto dto)
        {
            return new DomainPayment
            {
                SchoolId = dto.SchoolId,
                AccountName = dto.AccountName,
                AccountNumber = dto.AccountNumber,
                AccountBank = dto.AccountBank,
                ExchangeRate = dto.ExchangeRate,
                QrcodeUrl = dto.QrCodeUrl
            };
        }
    }
}
