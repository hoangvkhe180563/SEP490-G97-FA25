using Microsoft.EntityFrameworkCore;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Infrastructure.Exceptions;
using StudyHub.Backend.UseCases.Repositories;

namespace StudyHub.Backend.Infrastructure.Repositories
{
    public class ForumCommentRepository : IForumCommentRepository
    {
        private readonly Data.AppDbContext _context;

        public ForumCommentRepository(Data.AppDbContext context)
        {
            _context = context;
        }

        public async Task<ForumComment?> GetCommentByIdAsync(int commentId)
        {
            try
            {
                var comment = await _context.ForumComments
                    .Include(c => c.CreatedByNavigation)
                    .FirstOrDefaultAsync(c => c.Id == commentId && c.DeletedAt == null);

                if (comment == null) return null;

                var mappedComment = MapCommentToEntity(comment);

                mappedComment.Attachments = await _context.ForumAttachments
                    .Where(a => a.CommentId == commentId && a.DeletedAt == null)
                    .Select(a => new ForumAttachment
                    {
                        Id = a.Id,
                        CommentId = a.CommentId,
                        FileUrl = a.FileUrl,
                        IsApproved = a.IsApproved,
                        CreatedAt = a.CreatedAt,
                        CreatedBy = a.CreatedBy
                    })
                    .ToListAsync();

                return mappedComment;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumCommentRepository", "GetCommentByIdAsync failed: " + ex.Message).LogError();
                return null;
            }
        }

        public async Task<(List<ForumComment> comments, int totalCount)> GetCommentsByPostIdAsync(
            int postId,
            int? pageNumber = null,
            int? pageSize = null)
        {
            try
            {
                var rootComments = await GetRootCommentsByPostIdAsync(postId);

                foreach (var comment in rootComments)
                {
                    comment.Replies = await GetRepliesByParentIdAsync(comment.CommentId);
                    comment.ReplyCount = comment.Replies.Count;
                }

                var totalCount = rootComments.Count;

                if (pageNumber.HasValue && pageSize.HasValue)
                {
                    rootComments = rootComments
                        .Skip((pageNumber.Value - 1) * pageSize.Value)
                        .Take(pageSize.Value)
                        .ToList();
                }

                return (rootComments, totalCount);
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumCommentRepository", "GetCommentsByPostIdAsync failed: " + ex.Message).LogError();
                return (new List<ForumComment>(), 0);
            }
        }

        public async Task<List<ForumComment>> GetRootCommentsByPostIdAsync(int postId)
        {
            try
            {
                var comments = await _context.ForumComments
                    .Include(c => c.CreatedByNavigation)
                    .Where(c => c.PostId == postId && c.ParentCommentId == null && c.DeletedAt == null)
                    .OrderBy(c => c.CreatedAt)
                    .ToListAsync();

                var result = comments.Select(c => MapCommentToEntity(c)).ToList();

                foreach (var comment in result)
                {
                    comment.Attachments = await _context.ForumAttachments
                        .Where(a => a.CommentId == comment.CommentId && a.DeletedAt == null)
                        .Select(a => new ForumAttachment
                        {
                            Id = a.Id,
                            CommentId = a.CommentId,
                            FileUrl = a.FileUrl,
                            IsApproved = a.IsApproved,
                            CreatedAt = a.CreatedAt
                        })
                        .ToListAsync();
                }

                return result;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumCommentRepository", "GetRootCommentsByPostIdAsync failed: " + ex.Message).LogError();
                return new List<ForumComment>();
            }
        }

        public async Task<List<ForumComment>> GetRepliesByParentIdAsync(int parentCommentId)
        {
            try
            {
                var comments = await _context.ForumComments
                    .Include(c => c.CreatedByNavigation)
                    .Where(c => c.ParentCommentId == parentCommentId && c.DeletedAt == null)
                    .OrderBy(c => c.CreatedAt)
                    .ToListAsync();

                var result = comments.Select(c => MapCommentToEntity(c)).ToList();

                foreach (var comment in result)
                {
                    comment.Attachments = await _context.ForumAttachments
                        .Where(a => a.CommentId == comment.CommentId && a.DeletedAt == null)
                        .Select(a => new ForumAttachment
                        {
                            Id = a.Id,
                            CommentId = a.CommentId,
                            FileUrl = a.FileUrl,
                            IsApproved = a.IsApproved,
                            CreatedAt = a.CreatedAt
                        })
                        .ToListAsync();

                    comment.Replies = await GetRepliesByParentIdAsync(comment.CommentId);
                    comment.ReplyCount = comment.Replies.Count;
                }

                return result;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumCommentRepository", "GetRepliesByParentIdAsync failed: " + ex.Message).LogError();
                return new List<ForumComment>();
            }
        }

        public async Task<(List<ForumComment> comments, int totalCount)> GetModeratorCommentsAsync(
            int? postId = null,
            string? commentStatus = null,
            int? minViolationScore = null,
            DateTime? createdFrom = null,
            DateTime? createdTo = null,
            int? pageNumber = null,
            int? pageSize = null)
        {
            try
            {
                var dbQuery = _context.ForumComments
                    .Include(c => c.CreatedByNavigation)
                    .Where(c => c.DeletedAt == null);

                if (postId.HasValue)
                    dbQuery = dbQuery.Where(c => c.PostId == postId.Value);

                if (!string.IsNullOrWhiteSpace(commentStatus))
                {
                    switch (commentStatus.ToLower())
                    {
                        case "pending":
                            dbQuery = dbQuery.Where(c => c.Status == null);
                            break;
                        case "approved":
                            dbQuery = dbQuery.Where(c => c.Status == true);
                            break;
                        case "rejected":
                            dbQuery = dbQuery.Where(c => c.Status == false);
                            break;
                    }
                }

                if (minViolationScore.HasValue)
                    dbQuery = dbQuery.Where(c => c.TotalViolationScore >= minViolationScore.Value);

                if (createdFrom.HasValue)
                    dbQuery = dbQuery.Where(c => c.CreatedAt >= createdFrom.Value);

                if (createdTo.HasValue)
                    dbQuery = dbQuery.Where(c => c.CreatedAt <= createdTo.Value);

                var totalCount = await dbQuery.CountAsync();

                dbQuery = dbQuery.OrderByDescending(c => c.CreatedAt);

                if (pageNumber.HasValue && pageSize.HasValue)
                    dbQuery = dbQuery.Skip((pageNumber.Value - 1) * pageSize.Value).Take(pageSize.Value);

                var comments = await dbQuery.ToListAsync();
                var result = comments.Select(c => MapCommentToEntity(c)).ToList();

                foreach (var comment in result)
                {
                    comment.Attachments = await _context.ForumAttachments
                        .Where(a => a.CommentId == comment.CommentId && a.DeletedAt == null)
                        .Select(a => new ForumAttachment
                        {
                            Id = a.Id,
                            CommentId = a.CommentId,
                            FileUrl = a.FileUrl,
                            IsApproved = a.IsApproved,
                            CreatedAt = a.CreatedAt,
                            CreatedBy = a.CreatedBy
                        })
                        .ToListAsync();
                }

                return (result, totalCount);
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumCommentRepository", "GetModeratorCommentsAsync failed: " + ex.Message).LogError();
                return (new List<ForumComment>(), 0);
            }
        }

        public async Task<ForumComment> CreateCommentAsync(ForumComment comment)
        {
            try
            {
                var entity = new Data.ForumComment
                {
                    PostId = comment.PostId,
                    Id = comment.CommentId,
                    ParentCommentId = comment.ParentCommentId,
                    Content = comment.Content,
                    TotalViolationScore = comment.TotalViolationScore,
                    Status = comment.Status,
                    CreatedAt = comment.CreatedAt,
                    CreatedBy = comment.CreatedBy
                };

                _context.ForumComments.Add(entity);
                await _context.SaveChangesAsync();

                comment.CommentId = entity.Id;
                return comment;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumCommentRepository", "CreateCommentAsync failed: " + ex.Message).LogError();
                throw;
            }
        }

        public async Task<ForumComment> UpdateCommentAsync(ForumComment comment)
        {
            try
            {
                var entity = await _context.ForumComments.FindAsync(comment.CommentId);
                if (entity == null)
                    throw new InvalidOperationException("Comment not found");

                entity.Content = comment.Content;
                entity.TotalViolationScore = comment.TotalViolationScore;
                entity.Status = comment.Status;
                entity.UpdatedAt = DateTime.Now;
                entity.UpdatedBy = comment.UpdatedBy;

                await _context.SaveChangesAsync();
                return comment;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumCommentRepository", "UpdateCommentAsync failed: " + ex.Message).LogError();
                throw;
            }
        }

        public async Task<bool> SoftDeleteCommentAsync(int commentId, Guid deletedBy)
        {
            try
            {
                var entity = await _context.ForumComments.FindAsync(commentId);
                if (entity == null) return false;

                entity.DeletedAt = DateTime.Now;
                entity.UpdatedBy = deletedBy;

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumCommentRepository", "SoftDeleteCommentAsync failed: " + ex.Message).LogError();
                return false;
            }
        }

        public async Task<bool> ApproveCommentAsync(int commentId, Guid moderatorId)
        {
            try
            {
                var entity = await _context.ForumComments.FindAsync(commentId);
                if (entity == null) return false;

                entity.Status = true;
                entity.UpdatedAt = DateTime.Now;
                entity.UpdatedBy = moderatorId;

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumCommentRepository", "ApproveCommentAsync failed: " + ex.Message).LogError();
                return false;
            }
        }

        public async Task<bool> RejectCommentAsync(int commentId, Guid moderatorId)
        {
            try
            {
                var entity = await _context.ForumComments.FindAsync(commentId);
                if (entity == null) return false;

                entity.Status = false;
                entity.DeletedAt = DateTime.Now;
                entity.UpdatedAt = DateTime.Now;
                entity.UpdatedBy = moderatorId;

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumCommentRepository", "RejectCommentAsync failed: " + ex.Message).LogError();
                return false;
            }
        }

        public async Task<bool> UpdateCommentViolationScoreAsync(int commentId, int additionalScore)
        {
            try
            {
                var entity = await _context.ForumComments.FindAsync(commentId);
                if (entity == null) return false;

                entity.TotalViolationScore += additionalScore;
                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumCommentRepository", "UpdateCommentViolationScoreAsync failed: " + ex.Message).LogError();
                return false;
            }
        }

        private static ForumComment MapCommentToEntity(Data.ForumComment c)
        {
            return new ForumComment
            {
                CommentId = c.Id,
                PostId = c.PostId,
                //SchoolId = c.SchoolId,
                ParentCommentId = c.ParentCommentId,
                Content = c.Content,
                TotalViolationScore = c.TotalViolationScore,
                Status = c.Status,
                IsHidden = c.IsHidden,
                CreatedAt = c.CreatedAt,
                CreatedBy = c.CreatedBy,
                UpdatedAt = c.UpdatedAt,
                UpdatedBy = c.UpdatedBy,
                DeletedAt = c.DeletedAt,
                Creator = c.CreatedByNavigation != null ? new AppUser
                {
                    Id = Guid.Parse(c.CreatedByNavigation.Id.ToString()),
                    Username = c.CreatedByNavigation.Username,
                    Fullname = c.CreatedByNavigation.Fullname,
                    Avatar = c.CreatedByNavigation.Avatar
                } : null
            };
        }
    }
}