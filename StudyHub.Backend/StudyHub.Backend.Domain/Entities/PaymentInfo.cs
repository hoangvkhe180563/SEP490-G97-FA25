namespace StudyHub.Backend.Domain.Entities
{
    public class PaymentInfo
    {
        public int SchoolId { get; set; }
        public string? AccountBank { get; set; }
        public string? AccountName { get; set; }
        public string? AccountNumber { get; set; }
        public int? ExchangeRate { get; set; }
        public string? QrcodeUrl { get; set; }
    }
}
