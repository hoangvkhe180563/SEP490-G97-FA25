using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface IDocumentRepository
    {
        public List<Document> GetFeaturedDocumentsBySchool(int schoolId);
    }
}
