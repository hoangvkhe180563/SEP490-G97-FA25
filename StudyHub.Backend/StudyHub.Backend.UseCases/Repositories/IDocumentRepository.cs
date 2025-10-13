using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface IDocumentRepository
    {
        public List<Document> GetFeaturedDocumentsBySchool(int schoolId);
        public List<Document> GetDocumentsByCategory(int categoryId);
        public Document? GetDocumentById(int id);
        public Document CreateDocument(Document doc);
        public Document UpdateDocument(Document doc);
        public bool DeleteDocument(int id);
        public List<Document> GetDocumentsByGrade(int gradeId);
        public List<Document> GetAllDocuments();
        public List<Document> GetDocumentsBySchool(int schoolId);
        public List<Document> GetDocumentsBySubject(string subject);
        public List<Document> GetDocumentsByAccessibility(string accessibility);
        public List<Document> SearchDocuments(string query);
        public List<Document> GetDocumentsByFilters(int? categoryId, int? gradeId, int? schoolId, string? subject, string? accessibility);
        public List<Document> SearchDocuments(string query, int? categoryId, int? gradeId, int? schoolId, string? subject, string? accessibility);
        public List<Document> SearchDocuments(string query, int? categoryId, int? gradeId, int? schoolId, string? subject, string? accessibility, int pageNumber, int pageSize);
        public int GetTotalDocumentCount();
        public int GetFilteredDocumentCount(int? categoryId, int? gradeId, int? schoolId, string? subject, string? accessibility);

        public List<Document> GetDocumentsByCreatedBy(string userId);
        public List<Document> GetPendingApprovalDocuments();
    }
}