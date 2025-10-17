namespace StudyHub.Backend.UseCases.Repositories
{
    public interface ICloudinaryRepository
    {
        Task<string> UploadImageAsync(string filePath, string folderName);
        Task<bool> DeleteImageAsync(string url);
    }
}
