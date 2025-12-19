using Microsoft.EntityFrameworkCore;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Infrastructure.Exceptions;
using StudyHub.Backend.UseCases.Repositories;

namespace StudyHub.Backend.Infrastructure.Repositories
{
    public class ForumConfigRepository : IForumConfigRepository
    {
        private readonly Data.AppDbContext _context;

        public ForumConfigRepository(Data.AppDbContext context)
        {
            _context = context;
        }

        public async Task<ForumFlair?> GetFlairByIdAsync(int flairId)
        {
            try
            {
                var flair = await _context.ForumFlairs
                    .FirstOrDefaultAsync(f => f.Id == flairId);

                if (flair == null) return null;

                return MapFlairToEntity(flair);
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumConfigRepository", "GetFlairByIdAsync failed: " + ex.Message).LogError();
                return null;
            }
        }

        public async Task<(List<ForumFlair> flairs, int totalCount)> GetFlairsBySchoolIdAsync(
            int schoolId,
            bool? isProtected = null,
            bool? status = null,
            int? pageNumber = null,
            int? pageSize = null)
        {
            try
            {
                var dbQuery = _context.ForumFlairs
                    .Where(f => f.SchoolId == schoolId);

                if (isProtected.HasValue)
                    dbQuery = dbQuery.Where(f => f.IsProtected == isProtected.Value);

                if (status.HasValue)
                    dbQuery = dbQuery.Where(f => f.Status == status.Value);

                var totalCount = await dbQuery.CountAsync();

                dbQuery = dbQuery.OrderByDescending(f => f.CreatedAt);

                if (pageNumber.HasValue && pageSize.HasValue)
                    dbQuery = dbQuery.Skip((pageNumber.Value - 1) * pageSize.Value).Take(pageSize.Value);

                var flairs = await dbQuery.ToListAsync();
                var result = flairs.Select(f => MapFlairToEntity(f)).ToList();

                return (result, totalCount);
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumConfigRepository", "GetFlairsBySchoolIdAsync failed: " + ex.Message).LogError();
                return (new List<ForumFlair>(), 0);
            }
        }

        public async Task<List<ForumFlair>> GetActiveFlairsBySchoolIdAsync(int schoolId)
        {
            try
            {
                var flairs = await _context.ForumFlairs
                    .Where(f => f.SchoolId == schoolId && f.Status == true)
                    .ToListAsync();

                return flairs.Select(f => MapFlairToEntity(f)).ToList();
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumConfigRepository", "GetActiveFlairsBySchoolIdAsync failed: " + ex.Message).LogError();
                return new List<ForumFlair>();
            }
        }

        public async Task<List<ForumFlair>> GetProtectedFlairsBySchoolIdAsync(int schoolId)
        {
            try
            {
                var flairs = await _context.ForumFlairs
                    .Where(f => f.SchoolId == schoolId && f.IsProtected == true && f.Status == true)
                    .ToListAsync();

                return flairs.Select(f => MapFlairToEntity(f)).ToList();
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumConfigRepository", "GetProtectedFlairsBySchoolIdAsync failed: " + ex.Message).LogError();
                return new List<ForumFlair>();
            }
        }

        public async Task<ForumFlair> CreateFlairAsync(ForumFlair flair)
        {
            try
            {
                var entity = new Data.ForumFlair
                {
                    SchoolId = flair.SchoolId,
                    Name = flair.Name,
                    Description = flair.Description,
                    IsProtected = flair.IsProtected,
                    Status = flair.Status,
                    CreatedAt = flair.CreatedAt,
                    CreatedBy = flair.CreatedBy ?? Guid.Empty
                };

                _context.ForumFlairs.Add(entity);
                await _context.SaveChangesAsync();

                flair.Id = entity.Id;
                return flair;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumConfigRepository", "CreateFlairAsync failed: " + ex.Message).LogError();
                throw;
            }
        }

        public async Task<ForumFlair> UpdateFlairAsync(ForumFlair flair)
        {
            try
            {
                var entity = await _context.ForumFlairs.FindAsync(flair.Id);
                if (entity == null)
                    throw new InvalidOperationException("Flair not found");

                entity.Name = flair.Name;
                entity.Description = flair.Description;
                entity.IsProtected = flair.IsProtected;
                entity.UpdatedAt = DateTime.Now;
                entity.UpdatedBy = flair.UpdatedBy;

                await _context.SaveChangesAsync();
                return flair;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumConfigRepository", "UpdateFlairAsync failed: " + ex.Message).LogError();
                throw;
            }
        }

        public async Task<bool> DeleteFlairAsync(int flairId)
        {
            try
            {
                var entity = await _context.ForumFlairs.FindAsync(flairId);
                if (entity == null) return false;

                _context.ForumFlairs.Remove(entity);
                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumConfigRepository", "DeleteFlairAsync failed: " + ex.Message).LogError();
                return false;
            }
        }

        public async Task<bool> ToggleFlairStatusAsync(int flairId)
        {
            try
            {
                var entity = await _context.ForumFlairs.FindAsync(flairId);
                if (entity == null) return false;

                entity.Status = !entity.Status;
                entity.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumConfigRepository", "ToggleFlairStatusAsync failed: " + ex.Message).LogError();
                return false;
            }
        }

        public async Task<ForumAttachment?> GetAttachmentByIdAsync(int attachmentId)
        {
            try
            {
                var attachment = await _context.ForumAttachments
                    .FirstOrDefaultAsync(a => a.Id == attachmentId && a.DeletedAt == null);

                if (attachment == null) return null;

                return new ForumAttachment
                {
                    Id = attachment.Id,
                    PostId = attachment.PostId,
                    CommentId = attachment.CommentId,
                    FileUrl = attachment.FileUrl,
                    IsApproved = attachment.IsApproved,
                    CreatedAt = attachment.CreatedAt,
                    CreatedBy = attachment.CreatedBy
                };
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumConfigRepository", "GetAttachmentByIdAsync failed: " + ex.Message).LogError();
                return null;
            }
        }

        public async Task<List<ForumAttachment>> GetAttachmentsByPostIdAsync(int postId)
        {
            var attachments = await _context.ForumAttachments
                .Where(a => a.PostId == postId && a.DeletedAt == null)
                .ToListAsync();

            return attachments.Select(a => new ForumAttachment
            {
                Id = a.Id,
                PostId = a.PostId,
                FileUrl = a.FileUrl,
                IsApproved = a.IsApproved,
                CreatedAt = a.CreatedAt,
                CreatedBy = a.CreatedBy
            }).ToList();
        }

        public async Task<List<ForumAttachment>> GetAttachmentsByCommentIdAsync(int commentId)
        {
            var attachments = await _context.ForumAttachments
                .Where(a => a.CommentId == commentId && a.DeletedAt == null)
                .ToListAsync();

            return attachments.Select(a => new ForumAttachment
            {
                Id = a.Id,
                CommentId = a.CommentId,
                FileUrl = a.FileUrl,
                IsApproved = a.IsApproved,
                CreatedAt = a.CreatedAt,
                CreatedBy = a.CreatedBy
            }).ToList();
        }

        public async Task<(List<ForumAttachment> attachments, int totalCount)> GetPendingAttachmentsAsync(
            int? pageNumber = null,
            int? pageSize = null)
        {
            try
            {
                var dbQuery = _context.ForumAttachments
                    .Where(a => a.IsApproved == false && a.DeletedAt == null);

                var totalCount = await dbQuery.CountAsync();

                dbQuery = dbQuery.OrderBy(a => a.CreatedAt);

                if (pageNumber.HasValue && pageSize.HasValue)
                    dbQuery = dbQuery.Skip((pageNumber.Value - 1) * pageSize.Value).Take(pageSize.Value);

                var attachments = await dbQuery.ToListAsync();

                var result = attachments.Select(a => new ForumAttachment
                {
                    Id = a.Id,
                    PostId = a.PostId,
                    CommentId = a.CommentId,
                    FileUrl = a.FileUrl,
                    IsApproved = a.IsApproved,
                    CreatedAt = a.CreatedAt,
                    CreatedBy = a.CreatedBy
                }).ToList();

                return (result, totalCount);
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumConfigRepository", "GetPendingAttachmentsAsync failed: " + ex.Message).LogError();
                return (new List<ForumAttachment>(), 0);
            }
        }

        public async Task<ForumAttachment> CreateAttachmentAsync(ForumAttachment attachment)
        {
            try
            {
                var entity = new Data.ForumAttachment
                {
                    PostId = attachment.PostId,
                    CommentId = attachment.CommentId,
                    FileUrl = attachment.FileUrl,
                    IsApproved = attachment.IsApproved,
                    IsModerationPending = attachment.IsModerationPending ?? false,
                    CreatedAt = attachment.CreatedAt,
                    CreatedBy = attachment.CreatedBy ?? Guid.Empty
                };

                _context.ForumAttachments.Add(entity);
                await _context.SaveChangesAsync();

                attachment.Id = entity.Id;
                return attachment;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumConfigRepository", "CreateAttachmentAsync failed: " + ex.Message).LogError();
                throw;
            }
        }
        public async Task<bool> SoftDeleteAttachmentAsync(int attachmentId)
        {
            try
            {
                var entity = await _context.ForumAttachments.FindAsync(attachmentId);
                if (entity == null) return false;

                entity.DeletedAt = DateTime.Now;

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumConfigRepository", "SoftDeleteAttachmentAsync failed: " + ex.Message).LogError();
                return false;
            }
        }

        public async Task<bool> ApproveAttachmentAsync(int attachmentId, Guid approvedBy)
        {
            try
            {
                var entity = await _context.ForumAttachments.FindAsync(attachmentId);
                if (entity == null) return false;

                entity.IsApproved = true;
                entity.UpdatedAt = DateTime.Now;
                entity.UpdatedBy = approvedBy;

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumConfigRepository", "ApproveAttachmentAsync failed: " + ex.Message).LogError();
                return false;
            }
        }

        public async Task<bool> RejectAttachmentAsync(int attachmentId)
        {
            try
            {
                var entity = await _context.ForumAttachments.FindAsync(attachmentId);
                if (entity == null) return false;

                entity.DeletedAt = DateTime.Now;

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumConfigRepository", "RejectAttachmentAsync failed: " + ex.Message).LogError();
                return false;
            }
        }
        public async Task<List<ForumAttachment>> GetPendingModerationAttachmentsAsync(int limit)
        {
            try
            {
                var attachments = await _context.ForumAttachments
                    .Where(a => a.DeletedAt == null && a.IsModerationPending == true)
                    .OrderBy(a => a.CreatedAt)
                    .Take(limit)
                    .ToListAsync();

                return attachments.Select(a => new ForumAttachment
                {
                    Id = a.Id,
                    PostId = a.PostId,
                    CommentId = a.CommentId,
                    FileUrl = a.FileUrl,
                    IsApproved = a.IsApproved,
                    IsModerationPending = a.IsModerationPending ?? false,
                    CreatedBy = a.CreatedBy,
                    CreatedAt = a.CreatedAt
                }).ToList();
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumConfigRepository", "GetPendingModerationAttachmentsAsync failed: " + ex.Message).LogError();
                return new List<ForumAttachment>();
            }
        }

        public async Task UpdateAttachmentModerationStatusAsync(int attachmentId, bool isModerated, bool hasViolation)
        {
            try
            {
                var attachment = await _context.ForumAttachments.FindAsync(attachmentId);
                if (attachment != null)
                {
                    attachment.IsModerationPending = isModerated ? false : true;
                    attachment.IsApproved = !hasViolation;
                    await _context.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumConfigRepository", "UpdateAttachmentModerationStatusAsync failed: " + ex.Message).LogError();
            }
        }
        private static ForumFlair MapFlairToEntity(Data.ForumFlair f)
        {
            return new ForumFlair
            {
                Id = f.Id,
                SchoolId = f.SchoolId,
                Name = f.Name,
                Description = f.Description,
                IsProtected = f.IsProtected,
                Status = f.Status ?? false,
                CreatedAt = f.CreatedAt,
                CreatedBy = f.CreatedBy,
                UpdatedAt = f.UpdatedAt,
                UpdatedBy = f.UpdatedBy
            };
        }
    }
}