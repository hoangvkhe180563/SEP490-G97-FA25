using Microsoft.AspNetCore.Http;
using StudyHub.Backend.UseCases.Repositories;

namespace StudyHub.Backend.UseCases.Services
{
   

    public class LocalFileStorageService : IFileStorageRepository
    {
        private readonly string _basePath;

        public LocalFileStorageService(string basePath = "wwwroot")
        {
            _basePath = basePath;
        }

        public async Task<string> UploadFileAsync(IFormFile file, string uploadPath)
        {
            var uploadsFolder = Path.Combine(_basePath, uploadPath);
            Directory.CreateDirectory(uploadsFolder);

            var uniqueFileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(fileStream);
            }

            return Path.Combine(uploadPath, uniqueFileName).Replace("\\", "/");
        }

        public void DeleteFile(string filePath)
        {
            if (string.IsNullOrEmpty(filePath)) return;

            var fullPath = Path.Combine(_basePath, filePath);
            if (File.Exists(fullPath))
            {
                try
                {
                    File.Delete(fullPath);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Failed to delete file {fullPath}: {ex.Message}");
                }
            }
        }
        public async Task<byte[]> ReadFileAsync(string filePath)
        {
            if (string.IsNullOrEmpty(filePath))
            {
                throw new ArgumentException("File path is required");
            }

            var fullPath = Path.Combine(_basePath, filePath);

            if (!File.Exists(fullPath))
            {
                throw new FileNotFoundException($"File not found: {filePath}");
            }

            return await File.ReadAllBytesAsync(fullPath);
        }
    }

    //public class CloudFileStorageService : IFileStorageRepository
    //{
    //    public async Task<string> UploadFileAsync(IFormFile file, string uploadPath)
    //    {
    //        throw new NotImplementedException();
    //    }

    //    public void DeleteFile(string filePath)
    //    {
    //        throw new NotImplementedException();
    //    }
    //public async Task<byte[]> ReadFileAsync(string filePath)
    //    {
    //        throw new NotImplementedException();
    //    }
        //}
    }