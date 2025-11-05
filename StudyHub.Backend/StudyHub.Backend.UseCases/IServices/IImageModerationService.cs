using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.UseCases.IServices
{
    public interface IImageModerationService
    {
        Task<ImageModerationResult> ModerateImageAsync(string imageUrl);
        Task<ImageModerationResult> ModerateImageFromStreamAsync(Stream imageStream);
    }
}
