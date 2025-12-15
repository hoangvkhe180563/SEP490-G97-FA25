using Microsoft.Extensions.Configuration;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;

namespace StudyHub.Backend.Api.Services
{
    public class SmtpEmailService
    {
        private readonly IConfiguration _configuration;

        public SmtpEmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task SendResetPasswordEmailAsync(string toEmail, string resetToken)
        {
            var smtp = _configuration.GetSection("Smtp");
            var host = smtp.GetValue<string>("Host");
            var port = smtp.GetValue<int?>("Port") ?? 25;
            var user = smtp.GetValue<string>("User");
            var pass = smtp.GetValue<string>("Password");
            var from = smtp.GetValue<string>("From") ?? "no-reply@example.com";

            var baseUrl = _configuration["App:BaseUrl"] ?? "http://localhost:5173";
            var appName = _configuration["App:Name"] ?? "StudyHub";
            var resetLink = $"{baseUrl.TrimEnd('/')}/auth/reset-password?token={resetToken}";

            var htmlBody = $@"
            <html>
            <body style='font-family: Arial, sans-serif; background: #f5f7fa; padding: 24px;'>
            <div style='max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e8eaee;'>

                <h2 style='color:#1a73e8; margin-top:0;'>Đặt lại mật khẩu</h2>
                <p>Xin chào,</p>
                <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản <strong>{appName}</strong> của bạn. Nhấn vào nút bên dưới để tạo mật khẩu mới.</p>

                <div style='text-align:center;margin:24px 0;'>
                <a href='{resetLink}' 
                    style='background:#1a73e8;color:#fff;padding:14px 24px;border-radius:8px;text-decoration:none;font-weight:600;'>
                    Đặt lại mật khẩu
                </a>
                </div>

                <p>Liên kết này có hiệu lực trong <strong>1 giờ</strong>. Nếu bạn không yêu cầu thao tác này, vui lòng bỏ qua email.</p>

                <hr style='margin:32px 0;border:none;border-top:1px solid #eee;'/>
                <p style='font-size:12px;color:#6b7280;text-align:center;'>© {DateTime.UtcNow.Year} {appName}. Giữ mọi quyền.</p>

            </div>
            </body>
            </html>";


            var message = new MailMessage(from, toEmail)
            {
                Subject = $"{appName} - Password reset",
                Body = htmlBody,
                IsBodyHtml = true
            };

            using var client = new SmtpClient(host, port)
            {
                EnableSsl = true,
                UseDefaultCredentials = false,

            };
            if (!string.IsNullOrEmpty(user)) client.Credentials = new System.Net.NetworkCredential(user, pass);
            await client.SendMailAsync(message);
        }

        public async Task SendVerificationEmailAsync(string toEmail, string verificationToken)
        {
            var smtp = _configuration.GetSection("Smtp");
            var host = smtp.GetValue<string>("Host");
            var port = smtp.GetValue<int?>("Port") ?? 25;
            var user = smtp.GetValue<string>("User");
            var pass = smtp.GetValue<string>("Password");
            var from = smtp.GetValue<string>("From") ?? "no-reply@example.com";

            var baseUrl = _configuration["App:BaseUrl"] ?? "http://localhost:5173";
            var appName = _configuration["App:Name"] ?? "StudyHub";
            var verifyLink = $"{baseUrl.TrimEnd('/')}/auth/verify-email?token={Uri.EscapeDataString(verificationToken)}";

            var htmlBody = $@"
            <html>
            <body style='font-family: Arial, sans-serif; background:#f5f7fa; padding:24px;'>
            <div style='max-width:560px;margin:auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #e8eaee;'>

                <h2 style='color:#1a73e8;margin-top:0;'>Xác thực email của bạn</h2>
                <p>Chào mừng bạn đến với <strong>{appName}</strong>!</p>
                <p>Nhấn vào nút bên dưới để xác thực địa chỉ email và kích hoạt tài khoản của bạn.</p>

                <div style='text-align:center;margin:24px 0;'>
                <a href='{verifyLink}' 
                    style='background:#1a73e8;color:#fff;padding:14px 24px;border-radius:8px;text-decoration:none;font-weight:600;'>
                    Xác thực email
                </a>
                </div>

                <p>Liên kết có hiệu lực trong <strong>24 giờ</strong>.</p>
                <p>Nếu bạn không đăng ký tài khoản bằng email này, vui lòng bỏ qua.</p>

                <hr style='margin:32px 0;border-top:1px solid #eee;'/>
                <p style='font-size:12px;color:#6b7280;text-align:center;'>© {DateTime.UtcNow.Year} {appName}. Giữ mọi quyền.</p>

            </div>
            </body>
            </html>";



            var message = new MailMessage(from, toEmail)
            {
                Subject = $"{appName} - Verify your email",
                Body = htmlBody,
                IsBodyHtml = true
            };

            using var client = new SmtpClient(host, port)
            {
                EnableSsl = true,
                UseDefaultCredentials = false,

            };
            if (!string.IsNullOrEmpty(user)) client.Credentials = new System.Net.NetworkCredential(user, pass);
            await client.SendMailAsync(message);
        }
        public async Task SendClassInvitationEmailAsync(string toEmail, string className, string acceptUrl, string inviterName = "", string customMessage = "")
        {
            var smtp = _configuration.GetSection("Smtp");
            var host = smtp.GetValue<string>("Host");
            var port = smtp.GetValue<int?>("Port") ?? 25;
            var user = smtp.GetValue<string>("User");
            var pass = smtp.GetValue<string>("Password");
            var from = smtp.GetValue<string>("From") ?? "no-reply@example.com";

            var appName = _configuration["App:Name"] ?? "StudyHub";
            var inviterLine = !string.IsNullOrWhiteSpace(inviterName) ? $"<div style='color:#5f6368'>Invited by {WebUtility.HtmlEncode(inviterName)}</div>" : "";

            var htmlBody = $@"
            <html>
            <body style='font-family: Arial, sans-serif; background:#f5f7fa; padding:24px;'>
            <div style='max-width:600px;margin:auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #e8eaee;'>

                <h2 style='color:#1a73e8;margin-top:0;'>Lời mời tham gia lớp học</h2>

                <p>Bạn đã được mời tham gia lớp học:</p>
                <p style='font-size:18px;font-weight:600;color:#111;margin:8px 0;'>📘 {WebUtility.HtmlEncode(className)}</p>

                {(string.IsNullOrWhiteSpace(inviterName) ? "" : $"<p>Người mời: <strong>{WebUtility.HtmlEncode(inviterName)}</strong></p>")}

                {(string.IsNullOrWhiteSpace(customMessage) ? "" : $"<p style='margin-top:12px;color:#374151'>{WebUtility.HtmlEncode(customMessage)}</p>")}

                <div style='text-align:center;margin:24px 0;'>
                <a href='{acceptUrl}' 
                    style='background:#1a73e8;color:#fff;padding:14px 24px;border-radius:8px;text-decoration:none;font-weight:600;'>
                    Tham gia lớp học
                </a>
                </div>

                <p>Nếu nút không hoạt động, hãy sao chép và dán liên kết dưới đây vào trình duyệt của bạn:</p>
                <p style='word-break:break-all;color:#374151'>{WebUtility.HtmlEncode(acceptUrl)}</p>

                <hr style='margin:32px 0;border-top:1px solid #eee;'/>
                <p style='font-size:12px;color:#6b7280;text-align:center;'>© {DateTime.UtcNow.Year} {appName}. Giữ mọi quyền.</p>

            </div>
            </body>
            </html>";



            var message = new MailMessage(from, toEmail)
            {
                Subject = $"{appName}: Invitation to join \"{className}\"",
                Body = htmlBody,
                IsBodyHtml = true
            };

            using var client = new SmtpClient(host, port)
            {
                EnableSsl = true,
                UseDefaultCredentials = false,

            };
            if (!string.IsNullOrEmpty(user)) client.Credentials = new System.Net.NetworkCredential(user, pass);
            await client.SendMailAsync(message);
        }

        public async Task SendAccountRecoveryStatusEmailAsync(string toEmail, string username, string status, string reason = "")
        {
            var smtp = _configuration.GetSection("Smtp");
            var host = smtp.GetValue<string>("Host");
            var port = smtp.GetValue<int?>("Port") ?? 25;
            var user = smtp.GetValue<string>("User");
            var pass = smtp.GetValue<string>("Password");
            var from = smtp.GetValue<string>("From") ?? "no-reply@example.com";

            var baseUrl = _configuration["App:BaseUrl"] ?? "http://localhost:5173";
            var appName = _configuration["App:Name"] ?? "StudyHub";

            string subject;
            string body;

            if (status?.Equals("Đã phê duyệt", System.StringComparison.OrdinalIgnoreCase) == true || status?.Equals("Approved", System.StringComparison.OrdinalIgnoreCase) == true)
            {
                subject = $"{appName} - Yêu cầu khôi phục: Đã phê duyệt";
                body = $@"
                <html>
                <body style='font-family:Arial;background:#f5f7fa;padding:24px;'>
                <div style='max-width:560px;margin:auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #e8eaee;'>

                    <h2 style='color:#1a73e8;margin-top:0;'>Yêu cầu khôi phục đã được phê duyệt</h2>

                    <p>Xin chào <strong>{WebUtility.HtmlEncode(username)}</strong>,</p>
                    <p>Yêu cầu khôi phục tài khoản của bạn đã được <strong style='color:#16a34a;'>phê duyệt</strong>.</p>
                    {(string.IsNullOrWhiteSpace(reason) ? "" : $"<p><strong>Ghi chú:</strong> {WebUtility.HtmlEncode(reason)}</p>")}

                    <p>Bạn có thể đăng nhập trở lại hệ thống.</p>

                    <hr style='margin:32px 0;border-top:1px solid #eee;'/>
                    <p style='font-size:12px;color:#6b7280;text-align:center;'>© {DateTime.UtcNow.Year} {appName}</p>

                </div>
                </body>
                </html>";


            }
            else if (status?.Equals("Đã từ chối", System.StringComparison.OrdinalIgnoreCase) == true || status?.Equals("Rejected", System.StringComparison.OrdinalIgnoreCase) == true)
            {
                subject = $"{appName} - Yêu cầu khôi phục: Đã từ chối";
                body = $@"
                <html>
                <body style='font-family:Arial;background:#f5f7fa;padding:24px;'>
                <div style='max-width:560px;margin:auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #e8eaee;'>

                    <h2 style='color:#dc2626;margin-top:0;'>Yêu cầu khôi phục bị từ chối</h2>

                    <p>Xin chào <strong>{WebUtility.HtmlEncode(username)}</strong>,</p>
                    <p>Rất tiếc, yêu cầu khôi phục tài khoản của bạn đã bị <strong style='color:#dc2626;'>từ chối</strong>.</p>
                    {(string.IsNullOrWhiteSpace(reason) ? "" : $"<p><strong>Lý do:</strong> {WebUtility.HtmlEncode(reason)}</p>")}

                    <p>Nếu bạn cho rằng đây là nhầm lẫn, vui lòng liên hệ bộ phận hỗ trợ.</p>

                    <hr style='margin:32px 0;border-top:1px solid #eee;'/>
                    <p style='font-size:12px;color:#6b7280;text-align:center;'>© {DateTime.UtcNow.Year} {appName}</p>

                </div>
                </body>
                </html>";

            }
            else
            {
                subject = $"{appName} - Yêu cầu khôi phục";
                body = $@"
                <html>
                <body style='font-family: Arial, sans-serif; background:#f5f7fa; padding:24px;'>
                <div style='max-width:560px;margin:auto;background:#ffffff;border-radius:12px;padding:32px;border:1px solid #e8eaee;'>

                    <h2 style='color:#1a73e8;margin-top:0;'>Cập nhật trạng thái yêu cầu khôi phục</h2>

                    <p>Xin chào <strong>{WebUtility.HtmlEncode(username ?? "")}</strong>,</p>

                    <p>Trạng thái yêu cầu khôi phục tài khoản của bạn hiện tại là:</p>

                    <p style='font-size:16px;margin:12px 0;'>
                    <strong style='color:#111'>{WebUtility.HtmlEncode(status ?? "")}</strong>
                    </p>

                    {(string.IsNullOrWhiteSpace(reason) ? "" : $@"
                    <p><strong>Lý do:</strong> {WebUtility.HtmlEncode(reason)}</p>
                    ")}

                    <p>Nếu bạn cần hỗ trợ thêm, vui lòng phản hồi email này hoặc liên hệ đội ngũ hỗ trợ <strong>{appName}</strong>.</p>

                    <hr style='margin:32px 0;border-top:1px solid #eee;'/>
                    <p style='font-size:12px;color:#6b7280;text-align:center;'>© {DateTime.UtcNow.Year} {appName}. Giữ mọi quyền.</p>

                </div>
                </body>
                </html>";

            }

            var message = new System.Net.Mail.MailMessage(from, toEmail)
            {
                Subject = subject,
                Body = body,
                IsBodyHtml = true
            };

            using var client = new SmtpClient(host, port)
            {
                EnableSsl = true,
                UseDefaultCredentials = false,
            };
            if (!string.IsNullOrEmpty(user)) client.Credentials = new System.Net.NetworkCredential(user, pass);
            await client.SendMailAsync(message);
        }
    }
}
