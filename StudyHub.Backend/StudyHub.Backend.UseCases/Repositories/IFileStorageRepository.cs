using Microsoft.AspNetCore.Http;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface IFileStorageRepository
    {
        Task<string> UploadFileAsync(IFormFile file, string uploadPath);
        void DeleteFile(string filePath);
        Task<byte[]> ReadFileAsync(string filePath);
    }
}
