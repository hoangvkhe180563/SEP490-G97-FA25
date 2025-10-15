namespace StudyHub.Backend.Domain.Entities;

public class PaymentInfo
{
    public int SchoolId { get; set; }

    public string AccountName { get; set; } = null!;

    public string AccountNumber { get; set; } = null!;

    public string AccountBank { get; set; } = null!;

    public int ExchangeRate { get; set; }

    public string QrcodeUrl { get; set; } = null!;
}
