using System.Threading.Tasks;

namespace StudyHub.Backend.Api.Services
{
    public interface IEmailService
    {
        Task SendResetPasswordEmailAsync(string toEmail, string resetToken);
        Task SendVerificationEmailAsync(string toEmail, string verificationToken);
        Task SendClassInvitationEmailAsync(string toEmail, string className, string acceptUrl, string inviterName = "", string customMessage = "");
    }
}
