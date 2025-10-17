using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Utils;

namespace StudyHub.Backend.UseCases.Services
{
    public class DocumentService
    {
        private readonly IDocumentRepository _repo;
        private readonly IFileStorageRepository _fileStorage;

        public DocumentService(IDocumentRepository repo, IFileStorageRepository fileStorage)
        {
            _repo = repo;
            _fileStorage = fileStorage;
        }

        public Document? GetDocumentById(int id) => _repo.GetDocumentById(id);

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
            int pageNumber = 1,
            int pageSize = 10)
        {
            return _repo.SearchDocuments(
                query, categoryId, grade, schoolId, subject,
                uploaderId, isFeatured, isPendingApproval,
                includeUnapproved, pageNumber, pageSize);
        }

        public async Task<Document> CreateDocumentAsync(
            Document document,
            IFormFile documentFile,
            IFormFile? thumbnailFile = null)
        {
            ValidateDocumentFile(documentFile);

            if (thumbnailFile != null)
                ValidateThumbnailFile(thumbnailFile);

            if (string.IsNullOrWhiteSpace(document.Name))
                throw new ArgumentException("Document name is required");

            if (document.SubjectId <= 0)
                throw new ArgumentException("Valid SubjectId is required");

            if (document.DocumentCategoryId <= 0)
                throw new ArgumentException("Valid DocumentCategoryId is required");

            if (document.CreatedBy == Guid.Empty)
                throw new ArgumentException("Valid CreatedBy is required");

            if (document.SchoolId.HasValue && !document.ClassId.HasValue)
                throw new ArgumentException("If SchoolId is provided, ClassId must also be provided (database constraint)");

            document.DocumentUrl = await _fileStorage.UploadFileAsync(documentFile, FileConstants.DocumentUploadPath);

            if (thumbnailFile != null)
                document.Thumbnail = await _fileStorage.UploadFileAsync(thumbnailFile, FileConstants.ThumbnailUploadPath);

            if (!document.SchoolId.HasValue && !document.ClassId.HasValue)
                document.IsApproved = false;
            else
                document.IsApproved = null;

            document.CreatedAt = DateTime.Now;
            document.Status = true;

            return _repo.CreateDocument(document);
        }

        public async Task<Document> UpdateDocumentAsync(
            Document document,
            IFormFile? documentFile = null,
            IFormFile? thumbnailFile = null)
        {
            var existingDocument = _repo.GetDocumentById(document.Id)
                ?? throw new InvalidOperationException($"Document with ID {document.Id} not found");

            if (document.SchoolId.HasValue && !document.ClassId.HasValue)
                throw new ArgumentException("If SchoolId is provided, ClassId must also be provided (database constraint)");

            if (documentFile != null)
            {
                ValidateDocumentFile(documentFile);
                _fileStorage.DeleteFile(existingDocument.DocumentUrl);
                document.DocumentUrl = await _fileStorage.UploadFileAsync(documentFile, FileConstants.DocumentUploadPath);
            }
            else
            {
                document.DocumentUrl = existingDocument.DocumentUrl;
            }

            if (thumbnailFile != null)
            {
                ValidateThumbnailFile(thumbnailFile);
                if (!string.IsNullOrEmpty(existingDocument.Thumbnail))
                    _fileStorage.DeleteFile(existingDocument.Thumbnail);
                document.Thumbnail = await _fileStorage.UploadFileAsync(thumbnailFile, FileConstants.ThumbnailUploadPath);
            }
            else
            {
                document.Thumbnail = existingDocument.Thumbnail;
            }

            document.UpdatedAt = DateTime.Now;

            return _repo.UpdateDocument(document);
        }

        public bool DeleteDocument(int id)
        {
            var document = _repo.GetDocumentById(id);
            if (document == null) return false;

            _fileStorage.DeleteFile(document.DocumentUrl);

            if (!string.IsNullOrEmpty(document.Thumbnail))
                _fileStorage.DeleteFile(document.Thumbnail);

            return _repo.DeleteDocument(id);
        }

        public bool SoftDeleteDocument(int id, Guid deletedBy)
        {
            var document = _repo.GetDocumentById(id);
            if (document == null) return false;

            document.DeletedAt = DateTime.Now;
            document.UpdatedBy = deletedBy;
            document.Status = false;

            _repo.UpdateDocument(document);
            return true;
        }

        public Document ApproveDocument(int id, Guid approvedBy)
        {
            var document = _repo.GetDocumentById(id)
                ?? throw new InvalidOperationException($"Document with ID {id} not found");

            if (document.ClassId.HasValue)
                throw new InvalidOperationException("Class documents do not require approval");

            if (!document.SchoolId.HasValue && !document.ClassId.HasValue)
            {
                document.IsApproved = true;
            }
            else if (document.SchoolId.HasValue)
            {
                document.IsApproved = true;
            }

            document.UpdatedAt = DateTime.Now;
            document.UpdatedBy = approvedBy;

            return _repo.UpdateDocument(document);
        }

        public Document RejectDocument(int id, Guid rejectedBy)
        {
            var document = _repo.GetDocumentById(id)
                ?? throw new InvalidOperationException($"Document with ID {id} not found");

            if (document.ClassId.HasValue)
                throw new InvalidOperationException("Class documents do not require approval");

            document.IsApproved = false;
            document.UpdatedAt = DateTime.Now;
            document.UpdatedBy = rejectedBy;

            return _repo.UpdateDocument(document);
        }

        public Document ToggleFeatured(int id, Guid updatedBy)
        {
            var document = _repo.GetDocumentById(id)
                ?? throw new InvalidOperationException($"Document with ID {id} not found");

            document.IsFeatured = !document.IsFeatured;
            document.UpdatedAt = DateTime.Now;
            document.UpdatedBy = updatedBy;

            return _repo.UpdateDocument(document);
        }

        private void ValidateDocumentFile(IFormFile file)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("Document file is required");

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!FileConstants.AllowedDocumentExtensions.Contains(extension))
                throw new ArgumentException($"File type {extension} is not allowed. Allowed types: {string.Join(", ", FileConstants.AllowedDocumentExtensions)}");

            if (file.Length > FileConstants.MaxDocumentSize)
                throw new ArgumentException($"File size exceeds maximum allowed size of {FileConstants.MaxDocumentSize / (1024 * 1024)}MB");
        }

        private void ValidateThumbnailFile(IFormFile file)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("Thumbnail file is required");

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!FileConstants.AllowedImageExtensions.Contains(extension))
                throw new ArgumentException($"Image type {extension} is not allowed. Allowed types: {string.Join(", ", FileConstants.AllowedImageExtensions)}");

            if (file.Length > FileConstants.MaxImageSize)
                throw new ArgumentException($"Image size exceeds maximum allowed size of {FileConstants.MaxImageSize / (1024 * 1024)}MB");
        }

        public async Task<(byte[] fileBytes, string contentType, string fileName)> DownloadDocumentAsync(Document document)
        {
            if (string.IsNullOrEmpty(document.DocumentUrl))
                throw new InvalidOperationException("Document URL is not available");

            byte[] fileBytes;

            if (document.DocumentUrl.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
                document.DocumentUrl.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
            {
                using var httpClient = new HttpClient();
                fileBytes = await httpClient.GetByteArrayAsync(document.DocumentUrl);
            }
            else
            {
                fileBytes = await _fileStorage.ReadFileAsync(document.DocumentUrl);
            }

            var contentType = GetContentType(document.DocumentUrl);
            var fileName = document.Name + Path.GetExtension(document.DocumentUrl);

            return (fileBytes, contentType, fileName);
        }

        private string GetContentType(string filePath)
        {
            var extension = Path.GetExtension(filePath).ToLowerInvariant();
            return extension switch
            {
                ".pdf" => "application/pdf",
                ".doc" => "application/msword",
                ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ".xls" => "application/vnd.ms-excel",
                ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                ".ppt" => "application/vnd.ms-powerpoint",
                ".pptx" => "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                ".txt" => "text/plain",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".gif" => "image/gif",
                ".zip" => "application/zip",
                ".rar" => "application/x-rar-compressed",
                _ => "application/octet-stream"
            };
        }
        public (List<Document> documents, int totalCount) GetAllDocuments(int pageNumber = 1, int pageSize = 10)
        {
            return _repo.GetAllDocuments(pageNumber, pageSize);
        }

        public (List<Document> documents, int totalCount) GetPublicDocuments(int pageNumber = 1, int pageSize = 10)
        {
            return _repo.GetPublicDocuments(pageNumber, pageSize);
        }

        public (List<Document> documents, int totalCount) GetDocumentsByCreator(Guid creatorId, int pageNumber = 1, int pageSize = 10)
        {
            return _repo.GetDocumentsByCreator(creatorId, pageNumber, pageSize);
        }
        public List<Document> GetDocumentsBySubject(int subjectId)
        {
            return _repo.GetDocumentsBySubject(subjectId);
        }
        public (List<Document> documents, int totalCount) GetDocumentsBySchool(int schoolId, int pageNumber = 1, int pageSize = 10)
        {
            return _repo.GetDocumentsBySchool(schoolId, pageNumber, pageSize);
        }
    }
}