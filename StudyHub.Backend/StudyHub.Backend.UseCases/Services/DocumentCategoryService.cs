using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;

namespace StudyHub.Backend.UseCases.Services
{
    public class DocumentCategoryService
    {
        public readonly IDocumentCategoryRepository _documentCategoryRepo;
        public DocumentCategoryService(IDocumentCategoryRepository documentCategoryRepo)
        {
            _documentCategoryRepo = documentCategoryRepo;
        }
        public List<DocumentCategory> GetDocumentCategories()
        {
            return _documentCategoryRepo.GetAllDocumentCategories();
        }
        public DocumentCategory? GetDocumentCategory(int id)
        {
            return _documentCategoryRepo.GetDocumentCategoryById(id);
        }
        public DocumentCategory CreateDocumentCategory(DocumentCategory documentCategory)
        {
            return _documentCategoryRepo.CreateDocumentCategory(documentCategory);
        }
    }
}
