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
                    //.Include(d => d.Username)
                    .FirstOrDefault(d => d.Id == id && d.DeletedAt == null);

                return d == null ? null : MapToEntity(d);
            }
            catch (Exception ex)
            {
                new InfrastructureException("DocumentRepository", "GetDocumentById failed. Inner error: " + ex.Message).LogError();
                return null;
            }
        }

        public (List<Document> documents, int totalCount) GetPublicDocuments(
            string? query = null,
            int? categoryId = null,
            int? grade = null,
            string? subject = null,
            int? classId = null,
            int? pageNumber = null,
            int? pageSize = null)
        {
            try
            {
                IQueryable<Data.Document> dbQuery = _context.Documents
                    .Include(d => d.Subject)
                    .Include(d => d.DocumentCategory)
                    .Include(d => d.School)
                    .Include(d => d.Classes)
                    //.Include(d => d.Username)
                    .Where(d => d.DeletedAt == null &&
                               d.SchoolId == null &&
                               d.IsApproved == true &&
                               d.Status == true);

                dbQuery = ApplyFilters(dbQuery, query, categoryId, grade, subject, classId);

                var totalCount = dbQuery.Count();

                dbQuery = dbQuery.OrderByDescending(d => d.IsFeatured)
                                .ThenByDescending(d => d.CreatedAt);

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

        public (List<Document> documents, int totalCount) GetSchoolDocuments(
            int schoolId,
            string? query = null,
            int? categoryId = null,
            int? grade = null,
            string? subject = null,
            int? classId = null,
            int? pageNumber = null,
            int? pageSize = null)
        {
            try
            {
                IQueryable<Data.Document> dbQuery = _context.Documents
                    .Include(d => d.Subject)
                    .Include(d => d.DocumentCategory)
                    .Include(d => d.School)
                    .Include(d => d.Classes)
                    //.Include(d => d.Username)
                    .Where(d => d.DeletedAt == null &&
                               d.Status == true &&
                               ((d.SchoolId == null && d.IsApproved == true) ||
                                (d.SchoolId == schoolId && d.IsApproved == true)));

                dbQuery = ApplyFilters(dbQuery, query, categoryId, grade, subject, classId);

                var totalCount = dbQuery.Count();

                dbQuery = dbQuery.OrderByDescending(d => d.IsFeatured)
                                .ThenByDescending(d => d.CreatedAt);

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
                new InfrastructureException("DocumentRepository", "GetSchoolDocuments failed. Inner error: " + ex.Message).LogError();
                return (new List<Document>(), 0);
            }
        }

        public (List<Document> documents, int totalCount) GetOwnedDocuments(
            Guid creatorId,
            string? query = null,
            int? categoryId = null,
            int? grade = null,
            string? subject = null,
            int? classId = null,
            int? pageNumber = null,
            int? pageSize = null)
        {
            try
            {
                IQueryable<Data.Document> dbQuery = _context.Documents
                    .Include(d => d.Subject)
                    .Include(d => d.DocumentCategory)
                    .Include(d => d.School)
                    .Include(d => d.Classes)
                    //.Include(d => d.Username)
                    .Where(d => d.DeletedAt == null && d.CreatedBy == creatorId);

                dbQuery = ApplyFilters(dbQuery, query, categoryId, grade, subject, classId);

                var totalCount = dbQuery.Count();

                dbQuery = dbQuery.OrderByDescending(d => d.CreatedAt);

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
                new InfrastructureException("DocumentRepository", "GetOwnedDocuments failed. Inner error: " + ex.Message).LogError();
                return (new List<Document>(), 0);
            }
        }

        public (List<Document> documents, int totalCount) GetManagerPublicDocuments(
            string? query = null,
            int? categoryId = null,
            int? grade = null,
            string? subject = null,
            int? classId = null,
            bool? isApproved = null,
            bool? status = null,
            int? pageNumber = null,
            int? pageSize = null)
        {
            try
            {
                IQueryable<Data.Document> dbQuery = _context.Documents
                    .Include(d => d.Subject)
                    .Include(d => d.DocumentCategory)
                    .Include(d => d.School)
                    .Include(d => d.Classes)
                    //.Include(d => d.Username)
                    .Where(d => d.DeletedAt == null && d.SchoolId == null);

                dbQuery = ApplyFilters(dbQuery, query, categoryId, grade, subject, classId, isApproved, status);

                var totalCount = dbQuery.Count();

                dbQuery = dbQuery.OrderByDescending(d => d.CreatedAt);

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
                new InfrastructureException("DocumentRepository", "GetManagerPublicDocuments failed. Inner error: " + ex.Message).LogError();
                return (new List<Document>(), 0);
            }
        }

        public (List<Document> documents, int totalCount) GetManagerSchoolDocuments(
            int schoolId,
            string? query = null,
            int? categoryId = null,
            int? grade = null,
            string? subject = null,
            int? classId = null,
            bool? isApproved = null,
            bool? status = null,
            int? pageNumber = null,
            int? pageSize = null)
        {
            try
            {
                IQueryable<Data.Document> dbQuery = _context.Documents
                    .Include(d => d.Subject)
                    .Include(d => d.DocumentCategory)
                    .Include(d => d.School)
                    .Include(d => d.Classes)
                    //.Include(d => d.Username)
                    .Where(d => d.DeletedAt == null &&
                               d.SchoolId == schoolId &&
                               !d.IsInClass);

                dbQuery = ApplyFilters(dbQuery, query, categoryId, grade, subject, classId, isApproved, status);

                var totalCount = dbQuery.Count();

                dbQuery = dbQuery.OrderByDescending(d => d.CreatedAt);

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
                new InfrastructureException("DocumentRepository", "GetManagerSchoolDocuments failed. Inner error: " + ex.Message).LogError();
                return (new List<Document>(), 0);
            }
        }

        private IQueryable<Data.Document> ApplyFilters(
            IQueryable<Data.Document> query,
            string? searchQuery = null,
            int? categoryId = null,
            int? grade = null,
            string? subject = null,
            int? classId = null,
            bool? isApproved = null,
            bool? status = null)
        {
            if (!string.IsNullOrWhiteSpace(searchQuery))
            {
                query = query.Where(d =>
                    d.Name.Contains(searchQuery) ||
                    (d.Description != null && d.Description.Contains(searchQuery)) ||
                    _context.AppUsers.Any(u => u.Id == d.CreatedBy && u.Username.Contains(searchQuery)));
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
                query = query.Where(d => d.IsApproved == isApproved.Value);

            if (status.HasValue)
                query = query.Where(d => d.Status == status.Value);

            return query;
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

                doc.Id = entity.Id;
                return doc;
            }
            catch (DbUpdateException ex)
            {
                var innerMessage = ex.InnerException?.Message ?? ex.Message;
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
                entity.IsInClass = doc.IsInClass;
                entity.IsFeatured = doc.IsFeatured;
                entity.IsApproved = doc.IsApproved;
                entity.Status = doc.Status;
                entity.UpdatedAt = doc.UpdatedAt;
                entity.UpdatedBy = doc.UpdatedBy;
                entity.DeletedAt = doc.DeletedAt;

                _context.Database.ExecuteSqlRaw(
                    "DELETE FROM Document_Classes WHERE DocumentId = {0}", doc.Id);

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

                _context.Database.ExecuteSqlRaw(
                    "DELETE FROM Document_Classes WHERE DocumentId = {0}", id);

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
                //Username = d.Username != null ? new AppUser { Id = d.Username.Id, Username = d.Username.Username, Avatar = d.Username.Avatar } : null,
                Classes = d.Classes?.Select(c => new Class { Id = c.Id, Name = c.Name }).ToList() ?? new List<Class>()
            };
        }
    }
}