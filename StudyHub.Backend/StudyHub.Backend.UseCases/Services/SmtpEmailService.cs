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
                                <body style='font-family: Arial, sans-serif; color: #222;'>
                                    <h2 style='color:#333'>{appName} - Password reset</h2>
                                    <p>We received a request to reset your password. Click the button below to set a new password. This link is valid for 1 hour.</p>
                                    <p style='text-align:center'>
                                        <a href='{resetLink}' style='display:inline-block;padding:12px 20px;background:#0d6efd;color:#fff;border-radius:6px;text-decoration:none;'>Reset password</a>
                                    </p>
                                    <p>If you didn't request this, you can safely ignore this email.</p>
                                    <hr/>
                                    <small>{appName} Team</small>
                                </body>
                                </html>
                        ";

            var message = new MailMessage(from, toEmail)
            {
                Subject = $"{appName} - Password reset",
                Body = htmlBody,
                IsBodyHtml = true
            };

            using var client = new SmtpClient(host, port);
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
                    <body style='font-family: Arial, sans-serif; color: #222;'>
                        <h2 style='color:#333'>{appName} - Verify your email</h2>
                        <p>Click the button below to verify your email address. This link is valid for 24 hours.</p>
                        <p style='text-align:center'>
                            <a href='{verifyLink}' style='display:inline-block;padding:12px 20px;background:#0d6efd;color:#fff;border-radius:6px;text-decoration:none;'>Verify email</a>
                        </p>
                        <p>If you didn't create an account with this email, you can ignore this message.</p>
                        <hr/>
                        <small>{appName} Team</small>
                    </body>
                    </html>
            ";

            var message = new MailMessage(from, toEmail)
            {
                Subject = $"{appName} - Verify your email",
                Body = htmlBody,
                IsBodyHtml = true
            };

            using var client = new SmtpClient(host, port);
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
                <body style='font-family: Arial, sans-serif; color: #222;'>
                  <div style='max-width:600px;margin:0 auto;padding:18px;border:1px solid #eaeaea;border-radius:8px;'>
                    <div style='display:flex;gap:12px;align-items:center'>
                      <div style='width:48px;height:48px;border-radius:6px;background:#f5f7fb;display:flex;align-items:center;justify-content:center;font-weight:700;color:#1a73e8;font-size:20px;'>C</div>
                      <div>
                        <div style='font-size:18px;font-weight:600;color:#202124'>You were invited to join a class</div>
                        <div style='color:#5f6368;margin-top:6px;font-size:14px;'>Class: <strong>{WebUtility.HtmlEncode(className)}</strong></div>
                        {inviterLine}
                      </div>
                    </div>

                    {(!string.IsNullOrWhiteSpace(customMessage) ? $"<div style='margin-top:12px;color:#3c4043'>{WebUtility.HtmlEncode(customMessage)}</div>" : "")}

                    <div style='margin-top:18px;text-align:center;'>
                      <a href='{acceptUrl}' style='display:inline-block;padding:12px 20px;background:#1a73e8;color:#fff;border-radius:6px;text-decoration:none;font-weight:600'>Accept Invitation</a>
                    </div>

                    <div style='margin-top:16px;color:#5f6368;font-size:12px'>
                      If the above link doesn't work, copy and paste the following URL into your browser:
                      <div style='word-break:break-all;margin-top:8px'>{WebUtility.HtmlEncode(acceptUrl)}</div>
                    </div>

                    <hr style='margin-top:18px;border:none;border-top:1px solid #eee'/>
                    <div style='font-size:12px;color:#9aa0a6'>This email was sent by {WebUtility.HtmlEncode(appName)}.</div>
                  </div>
                </body>
                </html>
            ";

            var message = new MailMessage(from, toEmail)
            {
                Subject = $"{appName}: Invitation to join \"{className}\"",
                Body = htmlBody,
                IsBodyHtml = true
            };

            using var client = new SmtpClient(host, port);
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
                    <body style='font-family: Arial, sans-serif; color: #222;'>
                      <h2 style='color:#333'>{appName}</h2>
                      <p>Xin chào {System.Net.WebUtility.HtmlEncode(username ?? "")},</p>
                      <p>Yêu cầu khôi phục tài khoản của bạn đã được <strong>phê duyệt</strong>. Bạn có thể đăng nhập lại vào hệ thống.</p>
                      {(string.IsNullOrWhiteSpace(reason) ? "" : $"<p>Lý do: {System.Net.WebUtility.HtmlEncode(reason)}</p>")}
                      <hr/>
                      <small>{appName} Team</small>
                    </body>
                    </html>
                ";
            }
            else if (status?.Equals("Đã từ chối", System.StringComparison.OrdinalIgnoreCase) == true || status?.Equals("Rejected", System.StringComparison.OrdinalIgnoreCase) == true)
            {
                subject = $"{appName} - Yêu cầu khôi phục: Đã từ chối";
                body = $@"
                    <html>
                    <body style='font-family: Arial, sans-serif; color: #222;'>
                      <h2 style='color:#333'>{appName}</h2>
                      <p>Xin chào {System.Net.WebUtility.HtmlEncode(username ?? "")},</p>
                      <p>Rất tiếc, yêu cầu khôi phục tài khoản của bạn đã bị <strong>từ chối</strong>.</p>
                      {(string.IsNullOrWhiteSpace(reason) ? "" : $"<p>Lý do: {System.Net.WebUtility.HtmlEncode(reason)}</p>")}
                      <hr/>
                      <small>{appName} Team</small>
                    </body>
                    </html>
                ";
            }
            else
            {
                subject = $"{appName} - Yêu cầu khôi phục";
                body = $@"
                    <html>
                    <body style='font-family: Arial, sans-serif; color: #222;'>
                      <h2 style='color:#333'>{appName}</h2>
                      <p>Xin chào {System.Net.WebUtility.HtmlEncode(username ?? "")},</p>
                      <p>Trạng thái yêu cầu khôi phục tài khoản của bạn: <strong>{System.Net.WebUtility.HtmlEncode(status ?? "")}</strong></p>
                      {(string.IsNullOrWhiteSpace(reason) ? "" : $"<p>Lý do: {System.Net.WebUtility.HtmlEncode(reason)}</p>")}
                      <hr/>
                      <small>{appName} Team</small>
                    </body>
                    </html>
                ";
            }

            var message = new System.Net.Mail.MailMessage(from, toEmail)
            {
                Subject = subject,
                Body = body,
                IsBodyHtml = true
            };

            using var client = new System.Net.Mail.SmtpClient(host, port);
            if (!string.IsNullOrEmpty(user)) client.Credentials = new System.Net.NetworkCredential(user, pass);
            await client.SendMailAsync(message);
        }
    }
}
