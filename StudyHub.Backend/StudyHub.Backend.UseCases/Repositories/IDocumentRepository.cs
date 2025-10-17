using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface IDocumentRepository
    {
        Document? GetDocumentById(int id);
        Document CreateDocument(Document doc);
        Document UpdateDocument(Document doc);
        bool DeleteDocument(int id);
        (List<Document> documents, int totalCount) SearchDocuments(
            string? query = null,
            int? categoryId = null,
            int? grade = null,
            int? schoolId = null,
            string? subject = null,
            string? uploaderId = null,
            bool? isFeatured = null,
            bool? isPendingApproval = null,
            bool includeUnapproved = false,
            int? pageNumber = null,
            int? pageSize = null);
        List<Document> GetDocumentsBySubject(int subjectId);
        (List<Document> documents, int totalCount) GetAllDocuments(int? pageNumber = null, int? pageSize = null);
        (List<Document> documents, int totalCount) GetPublicDocuments(int? pageNumber = null, int? pageSize = null);
        (List<Document> documents, int totalCount) GetDocumentsByCreator(Guid creatorId, int? pageNumber = null, int? pageSize = null);
        (List<Document> documents, int totalCount) GetDocumentsBySchool(int schoolId, int? pageNumber = null, int? pageSize = null);
    }
}