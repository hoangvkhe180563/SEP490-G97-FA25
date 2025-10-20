using Microsoft.AspNetCore.Http;
using StudyHub.Backend.UseCases.Repositories;
using System;
using System.IO;
using System.Security.AccessControl;
using System.Threading.Tasks;

namespace StudyHub.Backend.UseCases.Services
{
    public class CloudFileStorageService 
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
            _cloudinaryRepository.DeleteImageAsync(filePath).GetAwaiter().GetResult();
        }

        public void DeleteFile(string filePath)
        {
            if (string.IsNullOrEmpty(filePath)) return;
            _cloudinaryRepository.DeleteImageAsync(filePath).GetAwaiter().GetResult();
        }
        public async Task<Stream> ReadFileStreamAsync(string fileUrl)
        {
            try
            {
                return await _cloudinaryRepository.ReadFileStreamAsync(fileUrl);
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException($"Error streaming file: {ex.Message}", ex);
            }
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