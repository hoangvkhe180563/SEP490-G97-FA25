using Microsoft.AspNetCore.Http;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Utils;

namespace StudyHub.Backend.UseCases.Services
{
    public class QAConversationFileService
    {
        private readonly IQAConversationFileRepository _repo;
        private readonly ICloudinaryRepository _cloudinary;
        private readonly AuthService _auth;

        public QAConversationFileService(IQAConversationFileRepository repo, ICloudinaryRepository cloudinary, AuthService auth)
        {
            _repo = repo;
            _cloudinary = cloudinary;
            _auth = auth;
        }

        public List<QAConversationFile> GetByConversationId(System.Guid conversationId)
        {
            return _repo.GetByConversationId(conversationId);
        }

        public QAConversationFile? UploadFile(Guid conversationId, IFormFile file)
        {
            var current = _auth.GetCurrentUser();
            // upload to cloudinary
            var uploadedUrl = _cloudinary.UploadFileAsync(file, FileConstants.QAConversationUploadPath).GetAwaiter().GetResult();
            if (string.IsNullOrEmpty(uploadedUrl)) return null;

            var entity = new QAConversationFile
            {
                Id = System.Guid.NewGuid(),
                ConversationId = conversationId,
                CreatedBy = current?.Id,
                FileUrl = uploadedUrl,
                FileName = file.FileName,
                FileType = file.ContentType,
                CreatedAt = System.DateTime.Now,
            };

            return _repo.Create(entity);
        }
    }
}
