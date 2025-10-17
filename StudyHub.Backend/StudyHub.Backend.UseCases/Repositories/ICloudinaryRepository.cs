using Microsoft.AspNetCore.Http;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface ICloudinaryRepository
    {
        Task<string> UploadImageAsync(IFormFile file, string folderName);
        Task<bool> DeleteImageAsync(string url);
    }
}
