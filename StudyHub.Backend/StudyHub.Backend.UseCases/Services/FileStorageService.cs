using System;
using System.IO;
using System.Threading.Tasks;
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
                return await _cloudinaryRepository.UploadImageAsync(file, uploadPath);
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
}