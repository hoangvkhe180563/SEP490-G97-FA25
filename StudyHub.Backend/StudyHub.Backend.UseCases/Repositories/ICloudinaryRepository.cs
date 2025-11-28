using Microsoft.AspNetCore.Http;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface ICloudinaryRepository
    {
        Task<string> UploadImageAsync(IFormFile file, string folderName);
        Task<bool> DeleteImageAsync(string url);
        Task<string> UploadFileAsync(IFormFile file, string folderName);
        Task<bool> DeleteFileAsync(string url);
        Task<byte[]> ReadFileAsync(string filePath);
        Task<Stream> ReadFileStreamAsync(string fileUrl);
        Task<List<string>> UploadFilesAsync(List<IFormFile> files, string folderName);

    }
}
