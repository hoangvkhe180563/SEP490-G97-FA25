using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;
using StudyHub.Backend.Infrastructure.Exceptions;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Utils;
using System.Net;
using System.Text.RegularExpressions;

namespace StudyHub.Backend.Infrastructure.Repositories
{
    public class CloudinaryRepository : ICloudinaryRepository
    {
        private readonly Cloudinary _cloudinary;
        public CloudinaryRepository(string cloudName, string apiKey, string apiSecret)
        {
            var account = new Account(cloudName, apiKey, apiSecret);
            _cloudinary = new Cloudinary(account);
        }
        public async Task<string> UploadImageAsync(IFormFile file, string folderName)
        {
            if (file == null || file.Length == 0) return string.Empty;

            try
            {
                using var stream = file.OpenReadStream();
                var uploadParams = new ImageUploadParams()
                {
                    File = new FileDescription(file.FileName, stream),
                    Folder = folderName
                };

                var uploadResult = await _cloudinary.UploadAsync(uploadParams);
                if (uploadResult.StatusCode == HttpStatusCode.OK)
                {
                    return uploadResult.SecureUrl?.ToString() ?? string.Empty;
                }
                else
                {
                    var err = uploadResult?.Error?.Message ?? "Unknown error";
                    new InfrastructureException("CloudinaryRepository", "UploadImageAsync failed. Inner error: " + err).LogError();
                    return string.Empty;
                }
            }
            catch (Exception ex)
            {
                new InfrastructureException("CloudinaryRepository", "UploadImageAsync exception. Inner error: " + ex.Message).LogError();
                return string.Empty;
            }
        }

        public async Task<bool> DeleteImageAsync(string url)
        {
            if (url == string.Empty) return false;

            try
            {
                string publicId = GetPublicIdFromUrl(url);

                var deletionParams = new DeletionParams(publicId)
                {
                    Invalidate = true
                };
                var deletionResult = await _cloudinary.DestroyAsync(deletionParams);
                if (deletionResult.Result.Equals("ok"))
                {
                    return true;
                }
                else
                {
                    new InfrastructureException("CloudinaryRepository", "DeleteImageAsync failed. Inner error: " + deletionResult.Error.Message).LogError();
                    return false;
                }
            }
            catch (Exception ex)
            {
                new InfrastructureException("CloudinaryRepository", "DeleteImageAsync exception. Inner error: " + ex.Message).LogError();
                return false;
            }
        }

        public async Task<string> UploadFileAsync(IFormFile file, string folderName)
        {
            if (file == null || file.Length == 0) return string.Empty;

            //if it is image, return back to the uploadimageasync function
            if (FileConstants.AllowedImageExtensions.Contains(Path.GetExtension(file.FileName)))
            {
                return await UploadImageAsync(file, folderName);
            }
            try
            {
                using var stream = file.OpenReadStream();
                var uploadParams = new RawUploadParams()
                {
                    File = new FileDescription(file.FileName, stream),
                    Folder = folderName,
                    Type = "upload",
                    AccessMode = "public"
                };
                var uploadResult = await _cloudinary.UploadAsync(uploadParams);

                if (uploadResult.StatusCode == HttpStatusCode.OK)
                {
                    return uploadResult.SecureUrl?.ToString() ?? string.Empty;
                }
                else
                {
                    var err = uploadResult?.Error?.Message ?? "Unknown error";
                    new InfrastructureException("CloudinaryRepository", "UploadFileAsync failed. Inner error: " + err).LogError();
                    return string.Empty;
                }
            }
            catch (Exception ex)
            {
                new InfrastructureException("CloudinaryRepository", "UploadFileAsync exception. Inner error: " + ex.Message).LogError();
                return string.Empty;
            }
        }
        public async Task<bool> DeleteFileAsync(string url)
        {
            if (url == string.Empty) return false;

            try
            {
                string publicId = GetPublicIdFromUrl(url);
                var extension = Path.GetExtension(url).ToLowerInvariant();

                var resourceType = FileConstants.AllowedImageExtensions.Contains(extension) ? ResourceType.Image : ResourceType.Raw;

                var deletionParams = new DeletionParams(publicId)
                {
                    Invalidate = true,
                    ResourceType = resourceType
                };
                var deletionResult = await _cloudinary.DestroyAsync(deletionParams);

                if (deletionResult.Result.Equals("ok"))
                {
                    return true;
                }
                else
                {
                    string error = deletionResult.Result + ". ";
                    if (deletionResult.Error != null)
                    {
                        error += deletionResult.Error.Message;
                    }
                    new InfrastructureException("CloudinaryRepository", "DeleteFileAsync failed. Inner error: " + error).LogError();
                    return false;
                }
            }
            catch (Exception ex)
            {
                new InfrastructureException("CloudinaryRepository", "DeleteFileAsync exception. Inner error: " + ex.Message).LogError();
                return false;
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
            catch (Exception ex)
            {
                new InfrastructureException("CloudinaryRepository", "ReadFileAsync exception. Inner error: " + ex.Message).LogError();
                throw;
            }
        }
        static string GetPublicIdFromUrl(string url)
        {
            if (string.IsNullOrEmpty(url))
                return string.Empty;

            try
            {
                //URL sẽ có dạng: /vABCDEF/tên_thư_mục/tên file
                var match = Regex.Match(url, @"/upload/(?:v\d+/)?(.+?)\.[a-zA-Z0-9]+$");

                //Suy ra cái public id sẽ là tên_thư_mục/tên file
                if (match.Success)
                    return match.Groups[1].Value;

                return string.Empty;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GetPublicIdFromUrl Error] {ex.Message}");
                return string.Empty;
            }
        }
    }
}
