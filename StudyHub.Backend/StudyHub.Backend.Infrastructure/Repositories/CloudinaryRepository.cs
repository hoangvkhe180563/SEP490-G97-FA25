using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using StudyHub.Backend.Infrastructure.Exceptions;
using StudyHub.Backend.UseCases.Repositories;
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
        public async Task<string> UploadImageAsync(string filePath, string folderName)
        {
            var uploadParams = new ImageUploadParams()
            {
                File = new FileDescription(filePath),
                Folder = folderName
            };

            var uploadResult = await _cloudinary.UploadAsync(uploadParams);
            if (uploadResult.StatusCode == System.Net.HttpStatusCode.OK)
            {
                return uploadResult.SecureUrl.ToString();
            }
            else
            {
                new InfrastructureException("CloudinaryRepository", "UploadImageAsync failed. Inner error: " + uploadResult.Error.Message).LogError();
                return string.Empty;
            }
        }

        public async Task<bool> DeleteImageAsync(string url)
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
                new InfrastructureException("CloudinaryRepository", "UploadImageAsync failed. Inner error: " + deletionResult.Error.Message).LogError();
                return false;
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
