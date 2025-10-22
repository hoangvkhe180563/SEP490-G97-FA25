using Microsoft.EntityFrameworkCore;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Infrastructure.Exceptions;
using StudyHub.Backend.UseCases.Repositories;
using System.Linq;

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
                    .Include(d => d.Classes)
                    .FirstOrDefault(d => d.Id == id && d.DeletedAt == null);

                if (d == null) return null;

                var doc = MapToEntity(d);
                var user = _context.AppUsers.FirstOrDefault(u => u.Id == d.CreatedBy);
                if (user != null)
                    doc.Username = new AppUser { Id = user.Id, Username = user.Username, Fullname = user.Fullname };

                return doc;
            }
            catch (Exception ex)
            {
                new InfrastructureException("DocumentRepository", "GetDocumentById failed: " + ex.Message).LogError();
                return null;
            }
        }

        public (List<Document> documents, int totalCount) GetPublicDocuments(
            string? query = null, int? categoryId = null, int? grade = null,
            string? subject = null, int? classId = null, int? pageNumber = null, int? pageSize = null)
        {
            try
            {
                var dbQuery = _context.Documents
                    .Include(d => d.Subject)
                    .Include(d => d.DocumentCategory)
                    .Include(d => d.School)
                    .Include(d => d.Classes)
                    .Where(d => d.DeletedAt == null && d.SchoolId == null && d.IsInClass == false && d.IsApproved == true);
                return ExecuteQuery(dbQuery, query, categoryId, grade, subject, classId, null, null, pageNumber, pageSize, true);
            }
            catch (Exception ex)
            {
                new InfrastructureException("DocumentRepository", "GetPublicDocuments failed: " + ex.Message).LogError();
                return (new List<Document>(), 0);
            }
        }

        public (List<Document> documents, int totalCount) GetSchoolDocuments(
            int schoolId, string? query = null, int? categoryId = null, int? grade = null,
            string? subject = null, int? classId = null, int? pageNumber = null, int? pageSize = null)
        {
            try
            {
                var dbQuery = _context.Documents
                    .Include(d => d.Subject)
                    .Include(d => d.DocumentCategory)
                    .Include(d => d.School)
                    .Include(d => d.Classes)
                    .Where(d => d.DeletedAt == null && d.SchoolId == schoolId && d.IsInClass == false && d.IsApproved == true);
                return ExecuteQuery(dbQuery, query, categoryId, grade, subject, classId, null, null, pageNumber, pageSize, true);
            }
            catch (Exception ex)
            {
                new InfrastructureException("DocumentRepository", "GetSchoolDocuments failed: " + ex.Message).LogError();
                return (new List<Document>(), 0);
            }
        }

        public (List<Document> documents, int totalCount) GetOwnedDocuments(
            Guid creatorId, string? query = null, int? categoryId = null, int? grade = null,
            string? subject = null, int? classId = null, int? pageNumber = null, int? pageSize = null)
        {
            try
            {
                var dbQuery = _context.Documents
                    .Include(d => d.Subject)
                    .Include(d => d.DocumentCategory)
                    .Include(d => d.School)
                    .Include(d => d.Classes)
                    .Where(d => d.DeletedAt == null && d.CreatedBy == creatorId);

                return ExecuteQuery(dbQuery, query, categoryId, grade, subject, classId, null, null, pageNumber, pageSize, false);
            }
            catch (Exception ex)
            {
                new InfrastructureException("DocumentRepository", "GetOwnedDocuments failed: " + ex.Message).LogError();
                return (new List<Document>(), 0);
            }
        }

        public (List<Document> documents, int totalCount) GetManagerPublicDocuments(
            string? query = null, int? categoryId = null, int? grade = null, string? subject = null,
            int? classId = null, bool? isApproved = null, bool? status = null, int? pageNumber = null, int? pageSize = null)
        {
            try
            {
                var dbQuery = _context.Documents
                    .Include(d => d.Subject)
                    .Include(d => d.DocumentCategory)
                    .Include(d => d.School)
                    .Include(d => d.Classes)
                    .Where(d => d.DeletedAt == null && d.SchoolId == null && d.IsInClass == false);
                return ExecuteManagerQuery(dbQuery, query, categoryId, grade, subject, classId, isApproved, status, pageNumber, pageSize);
            }
            catch (Exception ex)
            {
                new InfrastructureException("DocumentRepository", "GetManagerPublicDocuments failed: " + ex.Message).LogError();
                return (new List<Document>(), 0);
            }
        }

        public (List<Document> documents, int totalCount) GetManagerSchoolDocuments(
            int schoolId, string? query = null, int? categoryId = null, int? grade = null, string? subject = null,
            int? classId = null, bool? isApproved = null, bool? status = null, int? pageNumber = null, int? pageSize = null)
        {
            try
            {
                var dbQuery = _context.Documents
                    .Include(d => d.Subject)
                    .Include(d => d.DocumentCategory)
                    .Include(d => d.School)
                    .Include(d => d.Classes)
                    .Where(d => d.DeletedAt == null && d.SchoolId == schoolId && d.IsInClass == false);

                return ExecuteManagerQuery(dbQuery, query, categoryId, grade, subject, classId, isApproved, status, pageNumber, pageSize);
            }
            catch (Exception ex)
            {
                new InfrastructureException("DocumentRepository", "GetManagerSchoolDocuments failed: " + ex.Message).LogError();
                return (new List<Document>(), 0);
            }
        }

        private (List<Document>, int) ExecuteManagerQuery(
            IQueryable<Data.Document> dbQuery, string? query, int? categoryId, int? grade,
            string? subject, int? classId, bool? isApproved, bool? status,
            int? pageNumber, int? pageSize)
        {
            dbQuery = ApplyManagerFilters(dbQuery, query, categoryId, grade, subject, classId, isApproved, status);
            var totalCount = dbQuery.Count();

            dbQuery = dbQuery.OrderByDescending(d => d.CreatedAt);

            if (pageNumber.HasValue && pageSize.HasValue)
                dbQuery = dbQuery.Skip((pageNumber.Value - 1) * pageSize.Value).Take(pageSize.Value);

            var documents = dbQuery.ToList();
            var creatorIds = documents.Select(d => d.CreatedBy).Distinct().ToList();
            var users = _context.AppUsers.Where(u => creatorIds.Contains(u.Id))
                .Select(u => new { u.Id, u.Username, u.Fullname }).ToList();

            var result = documents.Select(d =>
            {
                var doc = MapToEntity(d);
                var user = users.FirstOrDefault(u => u.Id == d.CreatedBy);
                if (user != null)
                    doc.Username = new AppUser { Id = user.Id, Username = user.Username, Fullname = user.Fullname };
                return doc;
            }).ToList();

            return (result, totalCount);
        }

        private IQueryable<Data.Document> ApplyManagerFilters(
            IQueryable<Data.Document> query, string? searchQuery, int? categoryId, int? grade, string? subject, int? classId, bool? isApproved, bool? status)
        {
            if (!string.IsNullOrWhiteSpace(searchQuery))
            {
                query = query.Where(d =>
                    d.Name.Contains(searchQuery) ||
                    (d.Description != null && d.Description.Contains(searchQuery)) ||
                    _context.AppUsers.Any(u => u.Id == d.CreatedBy &&
                        (u.Username.Contains(searchQuery) ||
                         (u.Fullname != null && u.Fullname.Contains(searchQuery)))));
            }

            if (categoryId.HasValue)
                query = query.Where(d => d.DocumentCategoryId == categoryId.Value);

            if (grade.HasValue)
                query = query.Where(d => d.Grade == grade);

            if (!string.IsNullOrEmpty(subject))
                query = query.Where(d => d.Subject.Name.Contains(subject));

            if (classId.HasValue)
                query = query.Where(d => d.Classes.Any(c => c.Id == classId.Value));

            if (isApproved.HasValue)
            {
                if (isApproved.Value)
                    query = query.Where(d => d.IsApproved == true);
                else
                    query = query.Where(d => d.IsApproved == false);
            }
            else
            {
                query = query.Where(d => d.IsApproved == null);
            }

            if (status.HasValue)
                query = query.Where(d => d.Status == status.Value);

            return query;
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
        private (List<Document>, int) ExecuteQuery(
            IQueryable<Data.Document> dbQuery, string? query, int? categoryId, int? grade,
            string? subject, int? classId, bool? isApproved, bool? status,
            int? pageNumber, int? pageSize, bool orderByFeatured)
        {
            dbQuery = ApplyFilters(dbQuery, query, categoryId, grade, subject, classId, isApproved, status);
            var totalCount = dbQuery.Count();

            dbQuery = orderByFeatured
                ? dbQuery.OrderByDescending(d => d.IsFeatured).ThenByDescending(d => d.CreatedAt)
                : dbQuery.OrderByDescending(d => d.CreatedAt);

            if (pageNumber.HasValue && pageSize.HasValue)
                dbQuery = dbQuery.Skip((pageNumber.Value - 1) * pageSize.Value).Take(pageSize.Value);

            var documents = dbQuery.ToList();
            var creatorIds = documents.Select(d => d.CreatedBy).Distinct().ToList();
            var users = _context.AppUsers.Where(u => creatorIds.Contains(u.Id))
                .Select(u => new { u.Id, u.Username, u.Fullname }).ToList();

            var result = documents.Select(d =>
            {
                var doc = MapToEntity(d);
                var user = users.FirstOrDefault(u => u.Id == d.CreatedBy);
                if (user != null)
                    doc.Username = new AppUser { Id = user.Id, Username = user.Username, Fullname = user.Fullname };
                return doc;
            }).ToList();

            return (result, totalCount);
        }

        private IQueryable<Data.Document> ApplyFilters(
            IQueryable<Data.Document> query, string? searchQuery, int? categoryId, int? grade, string? subject, int? classId, bool? isApproved, bool? status)
        {
            if (!string.IsNullOrWhiteSpace(searchQuery))
            {
                query = query.Where(d =>
                    d.Name.Contains(searchQuery) ||
                    (d.Description != null && d.Description.Contains(searchQuery)) ||
                    _context.AppUsers.Any(u => u.Id == d.CreatedBy &&
                        (u.Username.Contains(searchQuery) ||
                         (u.Fullname != null && u.Fullname.Contains(searchQuery)))));
            }

            if (categoryId.HasValue)
                query = query.Where(d => d.DocumentCategoryId == categoryId.Value);

            if (grade.HasValue)
                query = query.Where(d => d.Grade == grade);

            if (!string.IsNullOrEmpty(subject))
                query = query.Where(d => d.Subject.Name.Contains(subject));

            if (classId.HasValue)
                query = query.Where(d => d.Classes.Any(c => c.Id == classId.Value));

            if (isApproved.HasValue)
            {
                if (isApproved.Value)
                    query = query.Where(d => d.IsApproved == true);
                else
                    query = query.Where(d => d.IsApproved == false);
            }

            if (status.HasValue)
                query = query.Where(d => d.Status == status.Value);

            return query;
        }

        public Document CreateDocument(Document doc)
        {
            using var transaction = _context.Database.BeginTransaction();
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
                    IsInClass = doc.IsInClass,
                    IsFeatured = doc.IsFeatured,
                    IsApproved = doc.IsApproved,
                    Status = doc.Status,
                    CreatedAt = doc.CreatedAt,
                    CreatedBy = doc.CreatedBy
                };

                _context.Documents.Add(entity);
                _context.SaveChanges();

                if (doc.Classes != null && doc.Classes.Any())
                {
                    foreach (var classItem in doc.Classes)
                    {
                        _context.Database.ExecuteSqlRaw(
                            "INSERT INTO Document_Classes (DocumentId, ClassId) VALUES ({0}, {1})",
                            entity.Id, classItem.Id);
                    }
                }

                transaction.Commit();
                doc.Id = entity.Id;
                return doc;
            }
            catch (DbUpdateException ex)
            {
                transaction.Rollback();
                var innerMessage = ex.InnerException?.Message ?? ex.Message;
                new InfrastructureException("DocumentRepository", $"CreateDocument failed: {innerMessage}").LogError();
                throw new InvalidOperationException("Failed to create document", ex);
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
                entity.IsInClass = doc.IsInClass;
                entity.IsFeatured = doc.IsFeatured;
                entity.IsApproved = doc.IsApproved;
                entity.Status = doc.Status;
                entity.UpdatedAt = doc.UpdatedAt;
                entity.UpdatedBy = doc.UpdatedBy;
                entity.DeletedAt = doc.DeletedAt;

                _context.Database.ExecuteSqlRaw("DELETE FROM Document_Classes WHERE DocumentId = {0}", doc.Id);

                if (doc.Classes != null && doc.Classes.Any())
                {
                    foreach (var classItem in doc.Classes)
                    {
                        _context.Database.ExecuteSqlRaw(
                            "INSERT INTO Document_Classes (DocumentId, ClassId) VALUES ({0}, {1})",
                            doc.Id, classItem.Id);
                    }
                }

                _context.SaveChanges();
                return doc;
            }
            catch (Exception ex)
            {
                new InfrastructureException("DocumentRepository", "UpdateDocument failed: " + ex.Message).LogError();
                return new Document();
            }
        }

        public bool DeleteDocument(int id)
        {
            try
            {
                var entity = _context.Documents.Find(id);
                if (entity == null) return false;

                _context.Database.ExecuteSqlRaw("DELETE FROM Document_Classes WHERE DocumentId = {0}", id);
                _context.Documents.Remove(entity);
                _context.SaveChanges();
                return true;
            }
            catch (Exception ex)
            {
                new InfrastructureException("DocumentRepository", "DeleteDocument failed: " + ex.Message).LogError();
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
                IsInClass = d.IsInClass,
                IsFeatured = d.IsFeatured,
                IsApproved = d.IsApproved,
                Status = d.Status,
                CreatedAt = d.CreatedAt,
                CreatedBy = d.CreatedBy,
                UpdatedAt = d.UpdatedAt,
                UpdatedBy = d.UpdatedBy,
                DeletedAt = d.DeletedAt,
                Subject = d.Subject != null ? new Subject { Id = d.Subject.Id, Name = d.Subject.Name } : null,
                DocumentCategory = d.DocumentCategory != null ? new DocumentCategory { Id = d.DocumentCategory.Id, Name = d.DocumentCategory.Name, Description = d.DocumentCategory.Description } : null,
                School = d.School != null ? new School { Id = d.School.Id, Name = d.School.Name } : null,
                Classes = d.Classes?.Select(c => new Class { Id = c.Id, Name = c.Name }).ToList() ?? new List<Class>()
            };
        }
    }
}