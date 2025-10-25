using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class PaymentInfo
{
    public int SchoolId { get; set; }

    public string AccountName { get; set; } = null!;

    public string AccountNumber { get; set; } = null!;

    public string AccountBank { get; set; } = null!;

    public int ExchangeRate { get; set; }

    public string QrcodeUrl { get; set; } = null!;

    public School School { get; set; } = null!;
}
