using System.Threading.Tasks;

namespace StudyHub.Backend.Api.Services
{
    public interface IEmailService
    {
        Task SendResetPasswordEmailAsync(string toEmail, string resetToken);
        Task SendVerificationEmailAsync(string toEmail, string verificationToken);
    }
}
