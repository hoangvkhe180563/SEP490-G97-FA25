using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Dtos;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.UseCases.Utils;

namespace StudyHub.Backend.UseCases.Services
{
    public class DocumentService
    {
        private readonly IDocumentRepository _repo;
        private readonly ICloudinaryRepository _fileStorage;
        private readonly ElasticDocumentVectorSearchService elasticDocumentVectorSearchService;

        public DocumentService(IDocumentRepository repo, ICloudinaryRepository fileStorage, ElasticDocumentVectorSearchService elasticDocumentVectorSearchService)
        {
            _repo = repo;
            _fileStorage = fileStorage;
            this.elasticDocumentVectorSearchService = elasticDocumentVectorSearchService;
        }

        public Document? GetDocumentById(int id) => _repo.GetDocumentById(id);

        public (List<Document> documents, int totalCount) GetPublicDocuments(
           string? query = null, int? categoryId = null, int? grade = null,
           string? subject = null, int? classId = null, string? documentLengthType = null,
           string? documentLevel = null, int pageNumber = 1, int pageSize = 10)
           => _repo.GetPublicDocuments(query, categoryId, grade, subject, classId, documentLengthType, documentLevel, pageNumber, pageSize);

        public (List<Document> documents, int totalCount) GetSchoolDocuments(
            int schoolId, string? query = null, int? categoryId = null, int? grade = null,
            string? subject = null, int? classId = null, string? documentLengthType = null,
            string? documentLevel = null, int pageNumber = 1, int pageSize = 10)
            => _repo.GetSchoolDocuments(schoolId, query, categoryId, grade, subject, classId, documentLengthType, documentLevel, pageNumber, pageSize);

        public (List<Document> documents, int totalCount) GetOwnedDocuments(
            Guid creatorId, string? query = null, int? categoryId = null, int? grade = null,
            string? subject = null, int? classId = null, string? documentLengthType = null,
            string? documentLevel = null, int pageNumber = 1, int pageSize = 10)
            => _repo.GetOwnedDocuments(creatorId, query, categoryId, grade, subject, classId, documentLengthType, documentLevel, pageNumber, pageSize);

        public (List<Document> documents, int totalCount) GetManagerPublicDocuments(
            string? query = null, int? categoryId = null, int? grade = null, string? subject = null,
            int? classId = null, bool? isApproved = null, bool? status = null, bool? hasEditRequest = null,
            DateTime? createdFrom = null, DateTime? createdTo = null,
            DateTime? updatedFrom = null, DateTime? updatedTo = null,
            int pageNumber = 1, int pageSize = 10)
            => _repo.GetManagerPublicDocuments(query, categoryId, grade, subject, classId, isApproved, status, hasEditRequest, createdFrom, createdTo, updatedFrom, updatedTo, pageNumber, pageSize);

        public (List<Document> documents, int totalCount) GetManagerSchoolDocuments(
            int schoolId, string? query = null, int? categoryId = null, int? grade = null, string? subject = null,
            int? classId = null, bool? isApproved = null, bool? status = null, bool? hasEditRequest = null,
            DateTime? createdFrom = null, DateTime? createdTo = null,
            DateTime? updatedFrom = null, DateTime? updatedTo = null,
            int pageNumber = 1, int pageSize = 10)
            => _repo.GetManagerSchoolDocuments(schoolId, query, categoryId, grade, subject, classId, isApproved, status, hasEditRequest, createdFrom, createdTo, updatedFrom, updatedTo, pageNumber, pageSize);
        public async Task<Document> CreateDocumentAsync(Document document, IFormFile documentFile, IFormFile? thumbnailFile = null)
        {
            ValidateDocumentFile(documentFile);
            if (thumbnailFile != null) ValidateThumbnailFile(thumbnailFile);

            if (string.IsNullOrWhiteSpace(document.Name)) throw new ArgumentException("Document name is required");
            if (document.SubjectId <= 0) throw new ArgumentException("Valid SubjectId is required");
            if (document.DocumentCategoryId <= 0) throw new ArgumentException("Valid DocumentCategoryId is required");
            if (document.CreatedBy == Guid.Empty) throw new ArgumentException("Valid CreatedBy is required");
            if (document.IsInClass && document.SchoolId == null) throw new ArgumentException("SchoolId required for class documents");
            if (string.IsNullOrWhiteSpace(document.DocumentLengthType)) throw new ArgumentException("DocumentLengthType is required");
            if (string.IsNullOrWhiteSpace(document.DocumentLevel)) throw new ArgumentException("DocumentLevel is required");

            var extension = Path.GetExtension(documentFile.FileName).ToLowerInvariant();
            var imageExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg" };

            if (imageExtensions.Contains(extension))
                document.DocumentUrl = await _fileStorage.UploadFileAsync(documentFile, FileConstants.DocumentUploadPath);
            else if (_fileStorage is CloudFileStorageService cloudService)
                document.DocumentUrl = await cloudService.UploadDocumentAsync(documentFile, FileConstants.DocumentUploadPath);
            else
                document.DocumentUrl = await _fileStorage.UploadFileAsync(documentFile, FileConstants.DocumentUploadPath);

            if (thumbnailFile != null)
                document.Thumbnail = await _fileStorage.UploadFileAsync(thumbnailFile, FileConstants.ThumbnailUploadPath);

            if (document.SchoolId.HasValue && document.IsInClass)
            {
                document.IsApproved = true;
            }
            else
            {
                document.IsApproved = false;
            }

            document.CreatedAt = DateTime.Now;
            document.Status = true;

            var created = _repo.CreateDocument(document);
            var elasticDoc = new UpsertElasticDocumentRequest
            {
                Id = created.Id,
                Name = created.Name,
                Description = created.Description,
                DocumentUrl = created.DocumentUrl,
                Thumbnail = created.Thumbnail,
                SchoolId = created.SchoolId,
                Subject = new Subject
                {
                    Name = created.Subject?.Name ?? String.Empty,
                },
                DocumentLengthType = created.DocumentLengthType,
                DocumentLevel = created.DocumentLevel,
                DocumentCategory = new DocumentCategory
                {
                    Name = created.DocumentCategory?.Name ?? String.Empty,
                    Description = created.DocumentCategory?.Description ?? String.Empty
                },
                Grade = created.Grade,
                IsInClass = created.IsInClass,
                Status = created.Status,
                CreatedAt = created.CreatedAt,
                UpdatedAt = created.UpdatedAt
            };
            var isValid = await elasticDocumentVectorSearchService.IndexDocumentAsync(elasticDoc);
            if (!isValid)
            {
                throw new InvalidOperationException("Failed to index document in search index.");
            }
            return created;
        }
        public async Task<Document> SubmitForApproval(int id, Guid userId)
        {
            var document = _repo.GetDocumentById(id) ?? throw new InvalidOperationException("Document not found");

            if (document.CreatedBy != userId)
                throw new InvalidOperationException("Only document owner can submit for approval");

            if (document.IsInClass)
                throw new InvalidOperationException("Class documents do not require approval");

            if (document.IsApproved != false)
                throw new InvalidOperationException("Only draft documents can be submitted");

            document.IsApproved = null;
            document.UpdatedAt = DateTime.Now;
            document.UpdatedBy = userId;

            var isValid = await elasticDocumentVectorSearchService.UpdateDocumentUpdatedAtAsync(id, DateTime.Now);
            if (!isValid)
            {
                throw new InvalidOperationException("Failed to update document updated at in search index.");
            }
            return _repo.UpdateDocument(document);
        }
        public async Task<Document> UpdateDocumentAsync(Document document, IFormFile? documentFile = null, IFormFile? thumbnailFile = null)
        {
            var existingDocument = _repo.GetDocumentById(document.Id)
                ?? throw new InvalidOperationException("Document not found");

            if (existingDocument.IsApproved == null)
                throw new InvalidOperationException("Cannot edit document while pending approval.");

            if (existingDocument.IsApproved == true &&
                existingDocument.Status == true &&
                !existingDocument.IsInClass)
                throw new InvalidOperationException("Cannot edit approved documents. Request edit first.");

            if (document.IsInClass && document.SchoolId == null)
                throw new ArgumentException("SchoolId required for class documents");

            if (string.IsNullOrWhiteSpace(document.DocumentLengthType))
                throw new ArgumentException("DocumentLengthType is required");

            if (string.IsNullOrWhiteSpace(document.DocumentLevel))
                throw new ArgumentException("DocumentLevel is required");

            if (documentFile != null)
            {
                ValidateDocumentFile(documentFile);
                DeleteExistingFile(existingDocument.DocumentUrl);

                var extension = Path.GetExtension(documentFile.FileName).ToLowerInvariant();
                var imageExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg" };

                if (imageExtensions.Contains(extension))
                    document.DocumentUrl = await _fileStorage.UploadFileAsync(documentFile, FileConstants.DocumentUploadPath);
                else if (_fileStorage is CloudFileStorageService cloudService)
                    document.DocumentUrl = await cloudService.UploadDocumentAsync(documentFile, FileConstants.DocumentUploadPath);
                else
                    document.DocumentUrl = await _fileStorage.UploadFileAsync(documentFile, FileConstants.DocumentUploadPath);
            }
            else
                document.DocumentUrl = existingDocument.DocumentUrl;

            if (thumbnailFile != null)
            {
                ValidateThumbnailFile(thumbnailFile);
                if (!string.IsNullOrEmpty(existingDocument.Thumbnail))
                    await _fileStorage.DeleteFileAsync(existingDocument.Thumbnail);
                document.Thumbnail = await _fileStorage.UploadFileAsync(thumbnailFile, FileConstants.ThumbnailUploadPath);
            }
            else
                document.Thumbnail = existingDocument.Thumbnail;

            if (document.SchoolId.HasValue && document.IsInClass)
            {
                document.IsApproved = true;
            }
            else
            {
                document.IsApproved = existingDocument.IsApproved;
            }

            document.Status = existingDocument.Status ?? true;
            document.UpdatedAt = DateTime.Now;

            var updated = _repo.UpdateDocument(document);

            var elasticDoc = new UpsertElasticDocumentRequest
            {
                Id = updated.Id,
                Name = updated.Name,
                Description = updated.Description,
                DocumentUrl = updated.DocumentUrl,
                Thumbnail = updated.Thumbnail,
                SchoolId = updated.SchoolId,
                Subject = new Subject
                {
                    Name = updated.Subject?.Name ?? String.Empty,
                },
                DocumentLengthType = updated.DocumentLengthType,
                DocumentLevel = updated.DocumentLevel,
                DocumentCategory = new DocumentCategory
                {
                    Name = updated.DocumentCategory?.Name ?? String.Empty,
                    Description = updated.DocumentCategory?.Description ?? String.Empty
                },
                Grade = updated.Grade,
                IsInClass = updated.IsInClass,
                Status = updated.Status,
                CreatedAt = updated.CreatedAt,
                UpdatedAt = updated.UpdatedAt
            };

            var isValid = await elasticDocumentVectorSearchService.IndexDocumentAsync(elasticDoc);
            if (!isValid)
            {
                throw new InvalidOperationException("Failed to update document in search index.");
            }
            return updated;
        }

        public Document RequestEditDocument(int id, Guid userId)
        {
            var document = _repo.GetDocumentById(id) ?? throw new InvalidOperationException("Document not found");

            if (document.CreatedBy != userId)
                throw new InvalidOperationException("Only document owner can request edit");

            if (document.IsInClass)
                throw new InvalidOperationException("Class documents can be edited directly");

            if (document.IsApproved != true)
                throw new InvalidOperationException("Only approved documents need edit request");

            document.IsRequested = true;
            document.UpdatedAt = DateTime.Now;
            document.UpdatedBy = userId;

            return _repo.UpdateDocument(document);
        }

        public async Task<Document> CancelEditRequest(int id, Guid userId)
        {
            var document = _repo.GetDocumentById(id) ?? throw new InvalidOperationException("Document not found");

            if (document.CreatedBy != userId)
                throw new InvalidOperationException("Only document owner can cancel edit request");

            if (document.IsRequested != true)
                throw new InvalidOperationException("No pending edit request to cancel");

            document.IsRequested = null;
            document.IsApproved = false;
            document.UpdatedAt = DateTime.Now;
            document.UpdatedBy = userId;

            var isValid = await elasticDocumentVectorSearchService.UpdateDocumentUpdatedAtAsync(id, DateTime.Now);
            if (!isValid)
            {
                throw new InvalidOperationException("Failed to update document updated at in search index.");
            }
            return _repo.UpdateDocument(document);
        }

        public async Task<bool> DeleteDocument(int id)
        {
            var document = _repo.GetDocumentById(id);
            if (document == null) return false;

            DeleteExistingFile(document.DocumentUrl);
            if (!string.IsNullOrEmpty(document.Thumbnail))
                await _fileStorage.DeleteFileAsync(document.Thumbnail);

            await elasticDocumentVectorSearchService.DeleteDocumentByIdAsync(id);

            return _repo.DeleteDocument(id);
        }

        public async Task<bool> SoftDeleteDocument(int id, Guid deletedBy)
        {
            var document = _repo.GetDocumentById(id);
            if (document == null) return false;

            document.DeletedAt = DateTime.Now;
            document.UpdatedBy = deletedBy;
            document.Status = false;

            var isValid = await elasticDocumentVectorSearchService.UpdateDocumentStatusAsync(id, false);
            if (!isValid)
            {
                throw new InvalidOperationException("Failed to update document status in search index.");
            }
            _repo.UpdateDocument(document);
            return true;
        }

        public async Task<Document> ApproveDocument(int id, Guid approvedBy)
        {
            var document = _repo.GetDocumentById(id) ?? throw new InvalidOperationException("Document not found");
            if (document.IsInClass) throw new InvalidOperationException("Class documents do not require approval");

            document.IsApproved = true;
            document.UpdatedAt = DateTime.Now;
            document.UpdatedBy = approvedBy;
            var isValid = await elasticDocumentVectorSearchService.UpdateDocumentUpdatedAtAsync(id, DateTime.Now);
            if (!isValid)
            {
                throw new InvalidOperationException("Failed to update document updated at in search index.");
            }
            return _repo.UpdateDocument(document);
        }

        public async Task<Document> RejectDocument(int id, Guid rejectedBy)
        {
            var document = _repo.GetDocumentById(id) ?? throw new InvalidOperationException("Document not found");
            if (document.IsInClass) throw new InvalidOperationException("Class documents do not require approval");

            document.IsApproved = false;
            document.UpdatedAt = DateTime.Now;
            document.UpdatedBy = rejectedBy;
            var isValid = await elasticDocumentVectorSearchService.UpdateDocumentUpdatedAtAsync(id, DateTime.Now);
            if (!isValid)
            {
                throw new InvalidOperationException("Failed to update document updated at in search index.");
            }
            return _repo.UpdateDocument(document);
        }

        public async Task<Document> RevokeApproval(int id, Guid updatedBy)
        {
            var document = _repo.GetDocumentById(id) ?? throw new InvalidOperationException("Document not found");
            if (document.IsInClass) throw new InvalidOperationException("Class documents do not have approval status");
            if (document.IsApproved != true) throw new InvalidOperationException("Only approved documents can be revoked");

            document.Status = true;
            document.IsApproved = null;
            document.UpdatedAt = DateTime.Now;
            document.UpdatedBy = updatedBy;

            var isStatusValid = await elasticDocumentVectorSearchService.UpdateDocumentStatusAsync(id, true);
            if (!isStatusValid)
            {
                throw new InvalidOperationException("Failed to update document status in search index.");
            }
            var isUpdatedAtValid = await elasticDocumentVectorSearchService.UpdateDocumentUpdatedAtAsync(id, DateTime.Now);
            if (!isUpdatedAtValid)
            {
                throw new InvalidOperationException("Failed to update document updated at in search index.");
            }
            return _repo.UpdateDocument(document);
        }

        public async Task<Document> ToggleFeatured(int id, Guid updatedBy)
        {
            var document = _repo.GetDocumentById(id) ?? throw new InvalidOperationException("Document not found");

            document.IsFeatured = !document.IsFeatured;
            document.UpdatedAt = DateTime.Now;
            document.UpdatedBy = updatedBy;

            var isValid = await elasticDocumentVectorSearchService.UpdateDocumentUpdatedAtAsync(id, DateTime.Now);
            if (!isValid)
            {
                throw new InvalidOperationException("Failed to update document updated at in search index.");
            }
            return _repo.UpdateDocument(document);
        }

        public async Task<(byte[] fileBytes, string contentType, string fileName)> DownloadDocumentAsync(Document document)
        {
            if (string.IsNullOrEmpty(document.DocumentUrl))
                throw new InvalidOperationException("Document URL not available");

            byte[] fileBytes = await _fileStorage.ReadFileAsync(document.DocumentUrl);
            var contentType = GetContentType(document.DocumentUrl);
            var fileName = document.Name + Path.GetExtension(document.DocumentUrl);

            return (fileBytes, contentType, fileName);
        }

        private void DeleteExistingFile(string fileUrl)
        {
            var extension = Path.GetExtension(fileUrl).ToLowerInvariant();
            var imageExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg" };

            if (imageExtensions.Contains(extension))
                _fileStorage.DeleteFileAsync(fileUrl);
            else if (_fileStorage is CloudFileStorageService cloudService)
                cloudService.DeleteDocumentFile(fileUrl);
            else
                _fileStorage.DeleteFileAsync(fileUrl);
        }

        private void ValidateDocumentFile(IFormFile file)
        {
            if (file == null || file.Length == 0) throw new ArgumentException("Document file is required");

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!FileConstants.AllowedDocumentExtensions.Contains(extension))
                throw new ArgumentException($"File type {extension} not allowed");

            if (file.Length > FileConstants.MaxDocumentSize)
                throw new ArgumentException($"File size exceeds {FileConstants.MaxDocumentSize / (1024 * 1024)}MB");
        }

        private void ValidateThumbnailFile(IFormFile file)
        {
            if (file == null || file.Length == 0) throw new ArgumentException("Thumbnail file is required");

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!FileConstants.AllowedImageExtensions.Contains(extension))
                throw new ArgumentException($"Image type {extension} not allowed");

            if (file.Length > FileConstants.MaxImageSize)
                throw new ArgumentException($"Image size exceeds {FileConstants.MaxImageSize / (1024 * 1024)}MB");
        }
        public List<Document> GetDocumentsBySubject(int subjectId)
        {
            return _repo.GetDocumentsBySubject(subjectId);
        }
        public List<Document> GetDocumentsBySubjectForPublic(int subjectId)
        {
            return _repo.GetDocumentsBySubjectForPublic(subjectId);
        }
        public List<Document> GetDocumentsBySubjectForSchool(int subjectId, int schoolId)
        {
            return _repo.GetDocumentsBySubjectForSchool(subjectId, schoolId);
        }
        public async Task<Stream> StreamDocumentAsync(Document document)
        {
            if (string.IsNullOrEmpty(document.DocumentUrl))
                throw new InvalidOperationException("Document URL not available");

            return await _fileStorage.ReadFileStreamAsync(document.DocumentUrl);
        }
        public List<Document> GetDocumentsByClass(int classId) => _repo.GetDocumentsByClass(classId);

        public List<Class> GetClassesByDocument(int documentId) => _repo.GetClassesByDocument(documentId);
        //public Document RequestEditDocument(int id, Guid userId)
        //{
        //    var document = _repo.GetDocumentById(id) ?? throw new InvalidOperationException("Document not found");

        //    if (document.CreatedBy != userId)
        //        throw new InvalidOperationException("Only document owner can request edit");

        //    if (document.IsInClass)
        //        throw new InvalidOperationException("Class documents can be edited directly");

        //    if (document.IsApproved != true)
        //        throw new InvalidOperationException("Only approved documents need edit request");

        //    document.IsRequested = true;
        //    document.UpdatedAt = DateTime.Now;
        //    document.UpdatedBy = userId;

        //    return _repo.UpdateDocument(document);
        //}

        public async Task<Document> ApproveEditRequest(int id, Guid approvedBy)
        {
            var document = _repo.GetDocumentById(id) ?? throw new InvalidOperationException("Document not found");
            if (document.IsRequested != true) throw new InvalidOperationException("No pending edit request");

            document.IsRequested = null;
            document.IsApproved = false;
            document.UpdatedAt = DateTime.Now;
            document.UpdatedBy = approvedBy;

            var isValid = await elasticDocumentVectorSearchService.UpdateDocumentUpdatedAtAsync(id, DateTime.Now);
            if (!isValid)
            {
                throw new InvalidOperationException("Failed to update document updated at in search index.");
            }
            return _repo.UpdateDocument(document);
        }

        public (List<Document> documents, int totalCount) GetEditRequestDocuments(
    bool? isRequested = null, int pageNumber = 1, int pageSize = 10)
    => _repo.GetEditRequestDocuments(isRequested, pageNumber, pageSize);
        public async Task<Document> RejectEditRequest(int id, Guid rejectedBy)
        {
            var document = _repo.GetDocumentById(id) ?? throw new InvalidOperationException("Document not found");
            if (document.IsRequested != true) throw new InvalidOperationException("No pending edit request");

            document.IsRequested = false;
            document.UpdatedAt = DateTime.Now;
            document.UpdatedBy = rejectedBy;

            var isValid = await elasticDocumentVectorSearchService.UpdateDocumentUpdatedAtAsync(id, DateTime.Now);
            if (!isValid)
            {
                throw new InvalidOperationException("Failed to update document updated at in search index.");
            }
            return _repo.UpdateDocument(document);
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