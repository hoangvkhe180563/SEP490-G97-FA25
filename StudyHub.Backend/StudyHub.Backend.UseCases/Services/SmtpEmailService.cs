using System.Net.Mail;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace StudyHub.Backend.Api.Services
{
    public class SmtpEmailService : IEmailService
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
                        var resetLink = $"{baseUrl.TrimEnd('/')}/reset-password?token={resetToken}";

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
            var verifyLink = $"{baseUrl.TrimEnd('/')}/verify-email?token={Uri.EscapeDataString(verificationToken)}";

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
    }
}
