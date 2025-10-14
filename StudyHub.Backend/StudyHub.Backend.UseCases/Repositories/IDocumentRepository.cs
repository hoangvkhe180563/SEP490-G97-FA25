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
            int? gradeId = null,
            int? schoolId = null,
            string? subject = null,
            string? uploaderId = null,
            string? accessibility = null,
            bool? isFeatured = null,
            bool? isPendingApproval = null,
            bool includeUnapproved = false,
            int? pageNumber = null,
            int? pageSize = null);
    }
}