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

                return d == null ? null : MapToEntity(d);
            }
            catch (Exception ex)
            {
                new InfrastructureException("DocumentRepository", "GetDocumentById failed. Inner error: " + ex.Message).LogError();
                return null;
            }
        }

        public (List<Document> documents, int totalCount) SearchDocuments(
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
            int? pageSize = null)
        {
            try
            {
                var dbQuery = _context.Documents
                    .Include(d => d.Subject)
                    .Include(d => d.Grade)
                    .Include(d => d.DocumentCategory)
                    .Include(d => d.Accessibility)
                    .Include(d => d.School)
                    .Where(d => d.DeletedAt == null);

                if (!includeUnapproved)
                {
                    dbQuery = dbQuery.Where(d => d.IsApproved == true);
                }

                if (!string.IsNullOrWhiteSpace(query))
                {
                    dbQuery = dbQuery.Where(d =>
                        d.Name.Contains(query) ||
                        d.Description.Contains(query) ||
                        _context.AppUsers.Any(u => u.Id == d.CreatedBy && u.Username.Contains(query)));
                }

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

                if (!string.IsNullOrEmpty(uploaderId) && Guid.TryParse(uploaderId, out var userGuid))
                    dbQuery = dbQuery.Where(d => d.CreatedBy == userGuid);

                if (isFeatured.HasValue)
                    dbQuery = dbQuery.Where(d => d.IsFeatured == isFeatured.Value);

                if (isPendingApproval.HasValue && isPendingApproval.Value)
                    dbQuery = dbQuery.Where(d => d.AccessibilityId == 1 && d.IsApproved == null);

                var totalCount = dbQuery.Count();

                if (pageNumber.HasValue && pageSize.HasValue)
                {
                    dbQuery = dbQuery
                        .Skip((pageNumber.Value - 1) * pageSize.Value)
                        .Take(pageSize.Value);
                }

                var documents = dbQuery.Select(d => MapToEntity(d)).ToList();

                return (documents, totalCount);
            }
            catch (Exception ex)
            {
                new InfrastructureException("DocumentRepository", "SearchDocuments failed. Inner error: " + ex.Message).LogError();
                return (new List<Document>(), 0);
            }
        }

        public Document CreateDocument(Document doc)
        {
            try
            {
                var entity = new Data.Document
                {
                    Name = doc.Name,
                    SubjectId = (byte)doc.SubjectId,
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
                throw new InvalidOperationException($"Failed to create document: {ex.Message}", ex);
            }
        }

        public Document UpdateDocument(Document doc)
        {
            try
            {
                var entity = _context.Documents.Find(doc.Id);
                if (entity == null) return doc;

                entity.Name = doc.Name;
                entity.SubjectId = (byte)doc.SubjectId;
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