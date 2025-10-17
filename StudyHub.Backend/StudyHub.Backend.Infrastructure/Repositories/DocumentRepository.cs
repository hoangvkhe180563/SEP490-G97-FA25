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
                    .Include(d => d.DocumentCategory)
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
            int? grade = null,
            int? schoolId = null,
            string? subject = null,
            string? uploaderId = null,
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
                    .Include(d => d.DocumentCategory)
                    .Include(d => d.School)
                    .Where(d => d.DeletedAt == null);

                if (!includeUnapproved)
                {
                    dbQuery = dbQuery.Where(d => d.IsApproved == true );
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

                if (grade.HasValue)
                    dbQuery = dbQuery.Where(d => d.Grade == grade);

                if (schoolId.HasValue)
                    dbQuery = dbQuery.Where(d => d.SchoolId == schoolId.Value);

                if (!string.IsNullOrEmpty(subject))
                    dbQuery = dbQuery.Where(d => d.Subject.Name.Contains(subject));

                if (!string.IsNullOrEmpty(uploaderId) && Guid.TryParse(uploaderId, out var userGuid))
                    dbQuery = dbQuery.Where(d => d.CreatedBy == userGuid);

                if (isFeatured.HasValue)
                    dbQuery = dbQuery.Where(d => d.IsFeatured == isFeatured.Value);

                if (isPendingApproval.HasValue && isPendingApproval.Value)
                    dbQuery = dbQuery.Where(d => d.IsApproved == null);

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
                    SubjectId = doc.SubjectId,
                    Grade = doc.Grade,
                    DocumentCategoryId = doc.DocumentCategoryId,
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
            catch (DbUpdateException ex)
            {
                var innerMessage = ex.InnerException?.Message ?? ex.Message;
                Console.WriteLine($"CreateDocument DbUpdateException: {innerMessage}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                new InfrastructureException("DocumentRepository", $"CreateDocument failed. Error: {innerMessage}").LogError();
                throw new InvalidOperationException($"Failed to create document: {innerMessage}", ex);
            }
            catch (Exception ex)
            {
                var innerMessage = ex.InnerException?.Message ?? ex.Message;
                Console.WriteLine($"CreateDocument Exception: {innerMessage}");
                new InfrastructureException("DocumentRepository", $"CreateDocument failed. Error: {innerMessage}").LogError();
                throw new InvalidOperationException($"Failed to create document: {innerMessage}", ex);
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
                entity.Grade = doc.Grade;
                entity.DocumentCategoryId = doc.DocumentCategoryId;
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
                Grade = d.Grade,
                DocumentCategoryId = d.DocumentCategoryId,
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
                Subject = d.Subject != null ? new Subject { Id = d.Subject.Id, Name = d.Subject.Name } : null,
                DocumentCategory = d.DocumentCategory != null ? new DocumentCategory { Id = d.DocumentCategory.Id, Name = d.DocumentCategory.Name, Description = d.DocumentCategory.Description } : null,
                School = d.School != null ? new School { Id = d.School.Id, Name = d.School.Name } : null
            };
        }
        public (List<Document> documents, int totalCount) GetAllDocuments(int? pageNumber = null, int? pageSize = null)
        {
            try
            {
                IQueryable<Data.Document> dbQuery = _context.Documents
                    .Include(d => d.Subject)
                    .Include(d => d.DocumentCategory)
                    .Include(d => d.School)
                    .Where(d => d.DeletedAt == null)
                    .OrderByDescending(d => d.CreatedAt);

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
                new InfrastructureException("DocumentRepository", "GetAllDocuments failed. Inner error: " + ex.Message).LogError();
                return (new List<Document>(), 0);
            }
        }

        public (List<Document> documents, int totalCount) GetPublicDocuments(int? pageNumber = null, int? pageSize = null)
        {
            try
            {
                IQueryable<Data.Document> dbQuery = _context.Documents
                    .Include(d => d.Subject)
                    .Include(d => d.DocumentCategory)
                    .Include(d => d.School)
                    .Where(d => d.DeletedAt == null && d.SchoolId == null)
                    .OrderByDescending(d => d.CreatedAt);

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
                new InfrastructureException("DocumentRepository", "GetPublicDocuments failed. Inner error: " + ex.Message).LogError();
                return (new List<Document>(), 0);
            }
        }

        public (List<Document> documents, int totalCount) GetDocumentsByCreator(Guid creatorId, int? pageNumber = null, int? pageSize = null)
        {
            try
            {
                IQueryable<Data.Document> dbQuery = _context.Documents
                    .Include(d => d.Subject)
                    .Include(d => d.DocumentCategory)
                    .Include(d => d.School)
                    .Where(d => d.DeletedAt == null && d.CreatedBy == creatorId)
                    .OrderByDescending(d => d.CreatedAt);

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
                new InfrastructureException("DocumentRepository", "GetDocumentsByCreator failed. Inner error: " + ex.Message).LogError();
                return (new List<Document>(), 0);
            }
        }

        public (List<Document> documents, int totalCount) GetDocumentsBySchool(int schoolId, int? pageNumber = null, int? pageSize = null)
        {
            try
            {
                IQueryable<Data.Document> dbQuery = _context.Documents
                    .Include(d => d.Subject)
                    .Include(d => d.DocumentCategory)
                    .Include(d => d.School)
                    .Where(d => d.DeletedAt == null &&
                               (d.SchoolId == schoolId || (d.SchoolId == null )))
                    .OrderByDescending(d => d.CreatedAt);

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
                new InfrastructureException("DocumentRepository", "GetDocumentsBySchool failed. Inner error: " + ex.Message).LogError();
                return (new List<Document>(), 0);
            }
        }
        public List<Document> GetDocumentsBySubject(int subjectId)
        {
            try
            {
                var documents = _context.Documents
                    .Include(d => d.Subject)
                    .Include(d => d.DocumentCategory)
                    .Include(d => d.School)
                    .Where(d => d.SubjectId == subjectId
                             && d.IsApproved == true
                             && d.Status == true
                             && d.DeletedAt == null)
                    .OrderByDescending(d => d.CreatedAt)
                    .Select(d => MapToEntity(d))
                    .ToList();

                return documents;
            }
            catch (Exception ex)
            {
                new InfrastructureException("DocumentRepository", "GetDocumentsBySubject failed. Inner error: " + ex.Message).LogError();
                return new List<Document>();
            }
        }

    }
}