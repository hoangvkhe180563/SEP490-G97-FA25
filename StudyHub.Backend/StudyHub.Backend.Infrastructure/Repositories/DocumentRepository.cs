using Microsoft.EntityFrameworkCore;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Infrastructure.Exceptions;
using StudyHub.Backend.UseCases.Repositories;

namespace StudyHub.Backend.Infrastructure.Repositories
{
    public class DocumentRepository : IDocumentRepository
    {
        private readonly Data.AppDbContext _context;

        public DocumentRepository(Data.AppDbContext context)
        {
            _context = context;
        }

        public List<Document> GetAllDocuments()
        {
            try
            {
                return _context.Documents
                    .Include(d => d.Subject)
                    .Include(d => d.Grade)
                    .Include(d => d.DocumentCategory)
                    .Include(d => d.Accessibility)
                    .Include(d => d.School)
                    .Where(d => d.DeletedAt == null)
                    .Select(d => MapToEntity(d))
                    .ToList();
            }
            catch (Exception ex)
            {
                new InfrastructureException("DocumentRepository", "GetAllDocuments failed. Inner error: " + ex.Message).LogError();
                return new List<Document>();
            }
        }

        public Document? GetDocumentById(int id)
        {
            try
            {
                var d = _context.Documents
                    .Include(d => d.Subject)
                    .Include(d => d.Grade)
                    .Include(d => d.DocumentCategory)
                    .Include(d => d.Accessibility)
                    .Include(d => d.School)
                    .FirstOrDefault(d => d.Id == id && d.DeletedAt == null);

                if (d == null) return null;

                return MapToEntity(d);
            }
            catch (Exception ex)
            {
                new InfrastructureException("DocumentRepository", "GetDocumentById failed. Inner error: " + ex.Message).LogError();
                return null;
            }
        }

        public List<Document> GetFeaturedDocumentsBySchool(int schoolId)
        {
            try
            {
                return _context.Documents
                    .Include(d => d.Subject)
                    .Include(d => d.Grade)
                    .Include(d => d.DocumentCategory)
                    .Include(d => d.Accessibility)
                    .Include(d => d.School)
                    .Where(d => d.SchoolId == schoolId && d.IsFeatured && d.DeletedAt == null && d.IsApproved == true)
                    .Select(d => MapToEntity(d))
                    .ToList();
            }
            catch (Exception ex)
            {
                new InfrastructureException("DocumentRepository", "GetFeaturedDocumentsBySchool failed. Inner error: " + ex.Message).LogError();
                return new List<Document>();
            }
        }

        public List<Document> GetDocumentsByCategory(int categoryId)
        {
            try
            {
                return _context.Documents
                    .Include(d => d.Subject)
                    .Include(d => d.Grade)
                    .Include(d => d.DocumentCategory)
                    .Include(d => d.Accessibility)
                    .Include(d => d.School)
                    .Where(d => d.DocumentCategoryId == categoryId && d.DeletedAt == null && d.IsApproved == true)
                    .Select(d => MapToEntity(d))
                    .ToList();
            }
            catch (Exception ex)
            {
                new InfrastructureException("DocumentRepository", "GetDocumentsByCategory failed. Inner error: " + ex.Message).LogError();
                return new List<Document>();
            }
        }

        public List<Document> GetDocumentsByGrade(int gradeId)
        {
            try
            {
                return _context.Documents
                    .Include(d => d.Subject)
                    .Include(d => d.Grade)
                    .Include(d => d.DocumentCategory)
                    .Include(d => d.Accessibility)
                    .Include(d => d.School)
                    .Where(d => d.GradeId == gradeId && d.DeletedAt == null && d.IsApproved == true)
                    .Select(d => MapToEntity(d))
                    .ToList();
            }
            catch (Exception ex)
            {
                new InfrastructureException("DocumentRepository", "GetDocumentsByGrade failed. Inner error: " + ex.Message).LogError();
                return new List<Document>();
            }
        }

        public List<Document> GetDocumentsBySchool(int schoolId)
        {
            try
            {
                return _context.Documents
                    .Include(d => d.Subject)
                    .Include(d => d.Grade)
                    .Include(d => d.DocumentCategory)
                    .Include(d => d.Accessibility)
                    .Include(d => d.School)
                    .Where(d => d.SchoolId == schoolId && d.DeletedAt == null && d.IsApproved == true)
                    .Select(d => MapToEntity(d))
                    .ToList();
            }
            catch (Exception ex)
            {
                new InfrastructureException("DocumentRepository", "GetDocumentsBySchool failed. Inner error: " + ex.Message).LogError();
                return new List<Document>();
            }
        }

        public List<Document> GetDocumentsBySubject(string subject)
        {
            try
            {
                return _context.Documents
                    .Include(d => d.Subject)
                    .Include(d => d.Grade)
                    .Include(d => d.DocumentCategory)
                    .Include(d => d.Accessibility)
                    .Include(d => d.School)
                    .Where(d => d.Subject.Name.Contains(subject) && d.DeletedAt == null && d.IsApproved == true)
                    .Select(d => MapToEntity(d))
                    .ToList();
            }
            catch (Exception ex)
            {
                new InfrastructureException("DocumentRepository", "GetDocumentsBySubject failed. Inner error: " + ex.Message).LogError();
                return new List<Document>();
            }
        }

        public List<Document> GetDocumentsByAccessibility(string accessibility)
        {
            try
            {
                return _context.Documents
                    .Include(d => d.Subject)
                    .Include(d => d.Grade)
                    .Include(d => d.DocumentCategory)
                    .Include(d => d.Accessibility)
                    .Include(d => d.School)
                    .Where(d => d.Accessibility.Name.Contains(accessibility) && d.DeletedAt == null && d.IsApproved == true)
                    .Select(d => MapToEntity(d))
                    .ToList();
            }
            catch (Exception ex)
            {
                new InfrastructureException("DocumentRepository", "GetDocumentsByAccessibility failed. Inner error: " + ex.Message).LogError();
                return new List<Document>();
            }
        }

        public List<Document> GetDocumentsByCreatedBy(string userId)
        {
            try
            {
                if (!Guid.TryParse(userId, out var userGuid))
                {
                    return new List<Document>();
                }

                return _context.Documents
                    .Include(d => d.Subject)
                    .Include(d => d.Grade)
                    .Include(d => d.DocumentCategory)
                    .Include(d => d.Accessibility)
                    .Include(d => d.School)
                    .Where(d => d.CreatedBy == userGuid && d.DeletedAt == null)
                    .Select(d => MapToEntity(d))
                    .ToList();
            }
            catch (Exception ex)
            {
                new InfrastructureException("DocumentRepository", "GetDocumentsByCreatedBy failed. Inner error: " + ex.Message).LogError();
                return new List<Document>();
            }
        }

        public List<Document> GetPendingApprovalDocuments()
        {
            try
            {
                return _context.Documents
                    .Include(d => d.Subject)
                    .Include(d => d.Grade)
                    .Include(d => d.DocumentCategory)
                    .Include(d => d.Accessibility)
                    .Include(d => d.School)
                    .Where(d => d.AccessibilityId == 1 && d.IsApproved == null && d.DeletedAt == null)
                    .Select(d => MapToEntity(d))
                    .ToList();
            }
            catch (Exception ex)
            {
                new InfrastructureException("DocumentRepository", "GetPendingApprovalDocuments failed. Inner error: " + ex.Message).LogError();
                return new List<Document>();
            }
        }

        public List<Document> SearchDocuments(string query)
        {
            try
            {
                return _context.Documents
                    .Include(d => d.Subject)
                    .Include(d => d.Grade)
                    .Include(d => d.DocumentCategory)
                    .Include(d => d.Accessibility)
                    .Include(d => d.School)
                    .Where(d => (d.Name.Contains(query) || d.Description.Contains(query))
                        && d.DeletedAt == null && d.IsApproved == true)
                    .Select(d => MapToEntity(d))
                    .ToList();
            }
            catch (Exception ex)
            {
                new InfrastructureException("DocumentRepository", "SearchDocuments failed. Inner error: " + ex.Message).LogError();
                return new List<Document>();
            }
        }

        public List<Document> GetDocumentsByFilters(int? categoryId, int? gradeId, int? schoolId, string? subject, string? accessibility)
        {
            try
            {
                var query = _context.Documents
                    .Include(d => d.Subject)
                    .Include(d => d.Grade)
                    .Include(d => d.DocumentCategory)
                    .Include(d => d.Accessibility)
                    .Include(d => d.School)
                    .Where(d => d.DeletedAt == null && d.IsApproved == true);

                if (categoryId.HasValue)
                    query = query.Where(d => d.DocumentCategoryId == categoryId.Value);

                if (gradeId.HasValue)
                    query = query.Where(d => d.GradeId == gradeId.Value);

                if (schoolId.HasValue)
                    query = query.Where(d => d.SchoolId == schoolId.Value);

                if (!string.IsNullOrEmpty(subject))
                    query = query.Where(d => d.Subject.Name.Contains(subject));

                if (!string.IsNullOrEmpty(accessibility))
                    query = query.Where(d => d.Accessibility.Name.Contains(accessibility));

                return query.Select(d => MapToEntity(d)).ToList();
            }
            catch (Exception ex)
            {
                new InfrastructureException("DocumentRepository", "GetDocumentsByFilters failed. Inner error: " + ex.Message).LogError();
                return new List<Document>();
            }
        }

        public List<Document> SearchDocuments(string query, int? categoryId, int? gradeId, int? schoolId, string? subject, string? accessibility)
        {
            try
            {
                var dbQuery = _context.Documents
                    .Include(d => d.Subject)
                    .Include(d => d.Grade)
                    .Include(d => d.DocumentCategory)
                    .Include(d => d.Accessibility)
                    .Include(d => d.School)
                    .Where(d => (d.Name.Contains(query) || d.Description.Contains(query))
                        && d.DeletedAt == null && d.IsApproved == true);

                if (categoryId.HasValue)
                    dbQuery = dbQuery.Where(d => d.DocumentCategoryId == categoryId.Value);

                if (gradeId.HasValue)
                    dbQuery = dbQuery.Where(d => d.GradeId == gradeId.Value);

                if (schoolId.HasValue)
                    dbQuery = dbQuery.Where(d => d.SchoolId == schoolId.Value);

                if (!string.IsNullOrEmpty(subject))
                    dbQuery = dbQuery.Where(d => d.Subject.Name.Contains(subject));

                if (!string.IsNullOrEmpty(accessibility))
                    dbQuery = dbQuery.Where(d => d.Accessibility.Name.Contains(accessibility));

                return dbQuery.Select(d => MapToEntity(d)).ToList();
            }
            catch (Exception ex)
            {
                new InfrastructureException("DocumentRepository", "SearchDocuments with filters failed. Inner error: " + ex.Message).LogError();
                return new List<Document>();
            }
        }

        public List<Document> SearchDocuments(string query, int? categoryId, int? gradeId, int? schoolId, string? subject, string? accessibility, int pageNumber, int pageSize)
        {
            try
            {
                var dbQuery = _context.Documents
                    .Include(d => d.Subject)
                    .Include(d => d.Grade)
                    .Include(d => d.DocumentCategory)
                    .Include(d => d.Accessibility)
                    .Include(d => d.School)
                    .Where(d => (d.Name.Contains(query) || d.Description.Contains(query))
                        && d.DeletedAt == null && d.IsApproved == true);

                if (categoryId.HasValue)
                    dbQuery = dbQuery.Where(d => d.DocumentCategoryId == categoryId.Value);

                if (gradeId.HasValue)
                    dbQuery = dbQuery.Where(d => d.GradeId == gradeId.Value);

                if (schoolId.HasValue)
                    dbQuery = dbQuery.Where(d => d.SchoolId == schoolId.Value);

                if (!string.IsNullOrEmpty(subject))
                    dbQuery = dbQuery.Where(d => d.Subject.Name.Contains(subject));

                if (!string.IsNullOrEmpty(accessibility))
                    dbQuery = dbQuery.Where(d => d.Accessibility.Name.Contains(accessibility));

                return dbQuery
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .Select(d => MapToEntity(d))
                    .ToList();
            }
            catch (Exception ex)
            {
                new InfrastructureException("DocumentRepository", "SearchDocuments with pagination failed. Inner error: " + ex.Message).LogError();
                return new List<Document>();
            }
        }

        public int GetTotalDocumentCount()
        {
            try
            {
                return _context.Documents.Count(d => d.DeletedAt == null && d.IsApproved == true);
            }
            catch (Exception ex)
            {
                new InfrastructureException("DocumentRepository", "GetTotalDocumentCount failed. Inner error: " + ex.Message).LogError();
                return 0;
            }
        }

        public int GetFilteredDocumentCount(int? categoryId, int? gradeId, int? schoolId, string? subject, string? accessibility)
        {
            try
            {
                var query = _context.Documents
                    .Where(d => d.DeletedAt == null && d.IsApproved == true);

                if (categoryId.HasValue)
                    query = query.Where(d => d.DocumentCategoryId == categoryId.Value);

                if (gradeId.HasValue)
                    query = query.Where(d => d.GradeId == gradeId.Value);

                if (schoolId.HasValue)
                    query = query.Where(d => d.SchoolId == schoolId.Value);

                if (!string.IsNullOrEmpty(subject))
                    query = query.Where(d => d.Subject.Name.Contains(subject));

                if (!string.IsNullOrEmpty(accessibility))
                    query = query.Where(d => d.Accessibility.Name.Contains(accessibility));

                return query.Count();
            }
            catch (Exception ex)
            {
                new InfrastructureException("DocumentRepository", "GetFilteredDocumentCount failed. Inner error: " + ex.Message).LogError();
                return 0;
            }
        }

        public Document CreateDocument(Document doc)
        {
            try
            {
                var entity = new Data.Document
                {
                    Name = doc.Name,
                    SubjectId = doc.SubjectId,
                    GradeId = (sbyte)doc.GradeId,
                    DocumentCategoryId = (sbyte)doc.DocumentCategoryId,
                    AccessibilityId = (sbyte)doc.AccessibilityId,
                    DocumentUrl = doc.DocumentUrl,
                    Thumbnail = doc.Thumbnail,
                    Description = doc.Description,
                    SchoolId = doc.SchoolId,
                    IsFeatured = doc.IsFeatured,
                    IsApproved = doc.IsApproved,
                    Status = doc.Status,
                    CreatedAt = doc.CreatedAt,
                    CreatedBy = doc.CreatedBy
                };

                _context.Documents.Add(entity);
                _context.SaveChanges();
                doc.Id = entity.Id;
                return doc;
            }
            catch (Exception ex)
            {
                new InfrastructureException("DocumentRepository", "CreateDocument failed. Inner error: " + ex.Message).LogError();
                return new Document();
            }
        }

        public Document UpdateDocument(Document doc)
        {
            try
            {
                var entity = _context.Documents.Find(doc.Id);
                if (entity == null) return doc;

                entity.Name = doc.Name;
                entity.SubjectId = doc.SubjectId;
                entity.GradeId = (sbyte)doc.GradeId;
                entity.DocumentCategoryId = (sbyte)doc.DocumentCategoryId;
                entity.AccessibilityId = (sbyte)doc.AccessibilityId;
                entity.DocumentUrl = doc.DocumentUrl;
                entity.Thumbnail = doc.Thumbnail;
                entity.Description = doc.Description;
                entity.SchoolId = doc.SchoolId;
                entity.IsFeatured = doc.IsFeatured;
                entity.IsApproved = doc.IsApproved;
                entity.Status = doc.Status;
                entity.UpdatedAt = doc.UpdatedAt;
                entity.UpdatedBy = doc.UpdatedBy;
                entity.DeletedAt = doc.DeletedAt;

                _context.SaveChanges();
                return doc;
            }
            catch (Exception ex)
            {
                new InfrastructureException("DocumentRepository", "UpdateDocument failed. Inner error: " + ex.Message).LogError();
                return new Document();
            }
        }

        public bool DeleteDocument(int id)
        {
            try
            {
                var entity = _context.Documents.Find(id);
                if (entity == null) return false;

                _context.Documents.Remove(entity);
                _context.SaveChanges();
                return true;
            }
            catch (Exception ex)
            {
                new InfrastructureException("DocumentRepository", "DeleteDocument failed. Inner error: " + ex.Message).LogError();
                return false;
            }
        }

        // Changed from instance method to static method
        private static Document MapToEntity(Data.Document d)
        {
            return new Document
            {
                Id = d.Id,
                Name = d.Name,
                SubjectId = d.SubjectId,
                GradeId = (byte)d.GradeId,
                DocumentCategoryId = (byte)d.DocumentCategoryId,
                AccessibilityId = (byte)d.AccessibilityId,
                DocumentUrl = d.DocumentUrl,
                Thumbnail = d.Thumbnail,
                Description = d.Description,
                SchoolId = d.SchoolId,
                IsFeatured = d.IsFeatured,
                IsApproved = d.IsApproved,
                Status = d.Status ?? false,
                CreatedAt = d.CreatedAt,
                CreatedBy = d.CreatedBy,
                UpdatedAt = d.UpdatedAt,
                UpdatedBy = d.UpdatedBy,
                DeletedAt = d.DeletedAt,
                Subject = d.Subject != null ? new Subject { Id = d.Subject.Id, Name = d.Subject.Name, Description = d.Subject.Description ?? string.Empty } : null,
                Grade = d.Grade != null ? new Grade { Id = (byte)d.Grade.Id, Name = d.Grade.Name } : null,
                DocumentCategory = d.DocumentCategory != null ? new DocumentCategory { Id = d.DocumentCategory.Id, Name = d.DocumentCategory.Name, Description = d.DocumentCategory.Description } : null,
                Accessibility = d.Accessibility != null ? new Accessibility { Id = d.Accessibility.Id, Name = d.Accessibility.Name, Description = d.Accessibility.Description } : null,
                School = d.School != null ? new School { Id = d.School.Id, Name = d.School.Name } : null
            };
        }
    }
}