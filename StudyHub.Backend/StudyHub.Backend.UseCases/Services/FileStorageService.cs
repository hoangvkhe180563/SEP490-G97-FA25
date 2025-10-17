using Microsoft.AspNetCore.Http;
using StudyHub.Backend.UseCases.Repositories;

namespace StudyHub.Backend.UseCases.Services
{
    public class CloudFileStorageService : IFileStorageRepository
    {
        private readonly ICloudinaryRepository _cloudinaryRepository;

        public CloudFileStorageService(ICloudinaryRepository cloudinaryRepository)
        {
            _cloudinaryRepository = cloudinaryRepository;
        }

        public async Task<string> UploadFileAsync(IFormFile file, string uploadPath)
        {
            var tempFilePath = Path.GetTempFileName();
            try
            {
                using (var stream = new FileStream(tempFilePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                return await _cloudinaryRepository.UploadImageAsync(tempFilePath, uploadPath);
            }
            finally
            {
                if (File.Exists(tempFilePath))
                {
                    File.Delete(tempFilePath);
                }
            }
        }

        public void DeleteFile(string filePath)
        {
            if (string.IsNullOrEmpty(filePath)) return;

            _cloudinaryRepository.DeleteImageAsync(filePath).GetAwaiter().GetResult();
        }

        public async Task<byte[]> ReadFileAsync(string filePath)
        {
            using var httpClient = new HttpClient();
            return await httpClient.GetByteArrayAsync(filePath);
        }
    }
    //public class LocalFileStorageService : IFileStorageRepository
    //{
    //    private readonly string _basePath;
    //    public LocalFileStorageService(string basePath = "wwwroot")
    //    {
    //        _basePath = basePath;
    //    }
    //    public async Task<string> UploadFileAsync(IFormFile file, string uploadPath)
    //    {
    //        var uploadsFolder = Path.Combine(_basePath, uploadPath);
    //        Directory.CreateDirectory(uploadsFolder);
    //        var uniqueFileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
    //        var filePath = Path.Combine(uploadsFolder, uniqueFileName);
    //        using (var fileStream = new FileStream(filePath, FileMode.Create))
    //        {
    //            await file.CopyToAsync(fileStream);
    //        }
    //        return Path.Combine(uploadPath, uniqueFileName).Replace("\\", "/");
    //    }
    //    public void DeleteFile(string filePath)
    //    {
    //        if (string.IsNullOrEmpty(filePath)) return;
    //        var fullPath = Path.Combine(_basePath, filePath);
    //        if (File.Exists(fullPath))
    //        {
    //            try
    //            {
    //                File.Delete(fullPath);
    //            }
    //            catch (Exception ex)
    //            {
    //                Console.WriteLine($"Failed to delete file {fullPath}: {ex.Message}");
    //            }
    //        }
    //    }
    //    public async Task<byte[]> ReadFileAsync(string filePath)
    //    {
    //        if (string.IsNullOrEmpty(filePath))
    //        {
    //            throw new ArgumentException("File path is required");
    //        }
    //        var fullPath = Path.Combine(_basePath, filePath);
    //        if (!File.Exists(fullPath))
    //        {
    //            throw new FileNotFoundException($"File not found: {filePath}");
    //        }
    //        return await File.ReadAllBytesAsync(fullPath);
    //    }
    //}
}