using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.Api.Mappers
{
    public static class QAConversationFileMapper
    {
        public static object MapToDto(QAConversationFile f)
        {
            return new
            {
                Id = f.Id,
                ConversationId = f.ConversationId,
                CreatedBy = f.CreatedBy,
                FileUrl = f.FileUrl,
                FileName = f.FileName,
                FileType = f.FileType,
                CreatedAt = f.CreatedAt
            };
        }
    }
}
