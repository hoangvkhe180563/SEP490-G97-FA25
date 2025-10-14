using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Infrastructure.Exceptions;
using StudyHub.Backend.UseCases.Repositories;

namespace StudyHub.Backend.Infrastructure.Repositories
{
    internal class DocumentCategoryRepository : IDocumentCategoryRepository
    {
        private readonly Data.AppDbContext _context;
        public DocumentCategoryRepository(Data.AppDbContext context)
        {
            _context = context;
        }
        public DocumentCategory CreateDocumentCategory(DocumentCategory documentCategory)
        {
            throw new NotImplementedException();
        }

        public bool DeleteDocumentCategory(int id)
        {
            throw new NotImplementedException();
        }

        public List<DocumentCategory> GetAllDocumentCategories()
        {
            try
            {
                return _context.DocumentCategories.Select(dc => new Domain.Entities.DocumentCategory
                {
                    Id = dc.Id,
                    Name = dc.Name,

                }).ToList();
            }
            catch (Exception ex)
            {
                new InfrastructureException("DocumentCategoryRepository", "GetAllDocumentCategory failed. Inner error: " + ex.Message).LogError();
                return new List<DocumentCategory>();
            }
        }

        public DocumentCategory? GetDocumentCategoryById(int id)
        {
            throw new NotImplementedException();
        }

        public DocumentCategory UpdateDocumentCategory(DocumentCategory documentCategory)
        {
            throw new NotImplementedException();
        }
    }
}
