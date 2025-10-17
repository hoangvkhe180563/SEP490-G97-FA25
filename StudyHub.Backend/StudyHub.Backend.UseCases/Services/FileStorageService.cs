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
            return await _cloudinaryRepository.UploadImageAsync(file, uploadPath);
        }

        public async Task<string> UploadDocumentAsync(IFormFile file, string uploadPath)
        {
            return await _cloudinaryRepository.UploadFileAsync(file, uploadPath);
        }

        public void DeleteDocumentFile(string filePath)
        {
            if (string.IsNullOrEmpty(filePath)) return;
            _cloudinaryRepository.DeleteFileAsync(filePath).GetAwaiter().GetResult();
        }

        public void DeleteFile(string filePath)
        {
            if (string.IsNullOrEmpty(filePath)) return;
            _cloudinaryRepository.DeleteImageAsync(filePath).GetAwaiter().GetResult();
        }

        public async Task<byte[]> ReadFileAsync(string filePath)
        {
            try
            {
                using var httpClient = new HttpClient();
                httpClient.Timeout = TimeSpan.FromMinutes(5);
                return await httpClient.GetByteArrayAsync(filePath);
            }
            catch
            {
                throw;
            }
        }
    }
}