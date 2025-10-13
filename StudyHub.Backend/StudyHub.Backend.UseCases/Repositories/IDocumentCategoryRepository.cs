using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface IDocumentCategoryRepository
    {
        List<DocumentCategory> GetAllDocumentCategories();
        DocumentCategory? GetDocumentCategoryById(int id);
        DocumentCategory CreateDocumentCategory(DocumentCategory documentCategory);
        DocumentCategory UpdateDocumentCategory(DocumentCategory documentCategory);
        bool DeleteDocumentCategory(int id);
    }
}
