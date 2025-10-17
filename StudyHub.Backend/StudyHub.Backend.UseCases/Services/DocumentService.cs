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

        public (List<Document> documents, int totalCount) GetPublicDocuments(
            string? query = null,
            int? categoryId = null,
            int? grade = null,
            string? subject = null,
            int? classId = null,
            int pageNumber = 1,
            int pageSize = 10)
        {
            return _repo.GetPublicDocuments(query, categoryId, grade, subject, classId, pageNumber, pageSize);
        }

        public (List<Document> documents, int totalCount) GetSchoolDocuments(
            int schoolId,
            string? query = null,
            int? categoryId = null,
            int? grade = null,
            string? subject = null,
            int? classId = null,
            int pageNumber = 1,
            int pageSize = 10)
        {
            return _repo.GetSchoolDocuments(schoolId, query, categoryId, grade, subject, classId, pageNumber, pageSize);
        }

        public (List<Document> documents, int totalCount) GetOwnedDocuments(
            Guid creatorId,
            string? query = null,
            int? categoryId = null,
            int? grade = null,
            string? subject = null,
            int? classId = null,
            int pageNumber = 1,
            int pageSize = 10)
        {
            return _repo.GetOwnedDocuments(creatorId, query, categoryId, grade, subject, classId, pageNumber, pageSize);
        }

        public (List<Document> documents, int totalCount) GetManagerPublicDocuments(
            string? query = null,
            int? categoryId = null,
            int? grade = null,
            string? subject = null,
            int? classId = null,
            bool? isApproved = null,
            bool? status = null,
            int pageNumber = 1,
            int pageSize = 10)
        {
            return _repo.GetManagerPublicDocuments(query, categoryId, grade, subject, classId, isApproved, status, pageNumber, pageSize);
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
            int pageNumber = 1,
            int pageSize = 10)
        {
            return _repo.GetManagerSchoolDocuments(schoolId, query, categoryId, grade, subject, classId, isApproved, status, pageNumber, pageSize);
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

            if (document.IsInClass && document.SchoolId == null)
                throw new ArgumentException("If IsInClass is true, SchoolId must be provided");

            document.DocumentUrl = await _fileStorage.UploadFileAsync(documentFile, FileConstants.DocumentUploadPath);

            if (thumbnailFile != null)
                document.Thumbnail = await _fileStorage.UploadFileAsync(thumbnailFile, FileConstants.ThumbnailUploadPath);

            if (document.IsInClass)
                document.IsApproved = null;
            else if (document.SchoolId == null)
                document.IsApproved = null;
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

            if (existingDocument.IsApproved == true && !existingDocument.IsInClass)
                throw new InvalidOperationException("Cannot edit approved documents. Please revoke approval first.");

            if (document.IsInClass && document.SchoolId == null)
                throw new ArgumentException("If IsInClass is true, SchoolId must be provided");

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

            document.IsApproved = existingDocument.IsApproved;
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

            if (document.IsInClass)
                throw new InvalidOperationException("Class documents do not require approval");

            document.IsApproved = true;
            document.UpdatedAt = DateTime.Now;
            document.UpdatedBy = approvedBy;

            return _repo.UpdateDocument(document);
        }

        public Document RejectDocument(int id, Guid rejectedBy)
        {
            var document = _repo.GetDocumentById(id)
                ?? throw new InvalidOperationException($"Document with ID {id} not found");

            if (document.IsInClass)
                throw new InvalidOperationException("Class documents do not require approval");

            document.IsApproved = false;
            document.UpdatedAt = DateTime.Now;
            document.UpdatedBy = rejectedBy;

            return _repo.UpdateDocument(document);
        }

        public Document RevokeApproval(int id, Guid updatedBy)
        {
            var document = _repo.GetDocumentById(id)
                ?? throw new InvalidOperationException($"Document with ID {id} not found");

            if (document.IsInClass)
                throw new InvalidOperationException("Class documents do not have approval status");

            if (document.IsApproved != true)
                throw new InvalidOperationException("Only approved documents can be revoked");

            document.IsApproved = null;
            document.UpdatedAt = DateTime.Now;
            document.UpdatedBy = updatedBy;

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

            byte[] fileBytes = await _fileStorage.ReadFileAsync(document.DocumentUrl);

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
    }
}