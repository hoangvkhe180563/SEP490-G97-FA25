namespace StudyHub.Backend.Api.Dtos.PaymentDTOS
{
    public class PaymentInfoDto
    {
        public int SchoolId { get; set; }
        public string AccountName { get; set; } = string.Empty;
        public string AccountNumber { get; set; } = string.Empty;
        public string AccountBank { get; set; } = string.Empty;
        public int ExchangeRate { get; set; }
        public string QrCodeUrl { get; set; } = string.Empty;
    }

    public class PaymentNotifyDto
    {
        public string? gateway { get; set; }               // "VPBank"
        public string? transactionDate { get; set; }       // "2025-11-01 16:17:00"
        public string? accountNumber { get; set; }         // "0977423805"
        public string? subAccount { get; set; }            // null
        public string? code { get; set; }                  // null
        public string? content { get; set; }               // "NHAN TU 0697044105922 TRACE 014381 ND CHstudent8"
        public string? transferType { get; set; }          // "in"
        public string? description { get; set; }           // "BankAPINotify NHAN TU ..."
        public long? transferAmount { get; set; }          // 10000
        public string? referenceCode { get; set; }         // "FT25305007963796"
        public long? accumulated { get; set; }             // 0
        public long? id { get; set; }                      // 28582898
    }

}
