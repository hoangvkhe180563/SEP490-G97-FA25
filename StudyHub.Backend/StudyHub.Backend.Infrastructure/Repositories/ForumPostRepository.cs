using Microsoft.EntityFrameworkCore;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Infrastructure.Exceptions;
using StudyHub.Backend.UseCases.Repositories;
using System.Linq;

namespace StudyHub.Backend.Infrastructure.Repositories
{
    public class ForumPostRepository : IForumPostRepository
    {
        private readonly Data.AppDbContext _context;
        private readonly IForumCommentRepository _commentRepo;

        public ForumPostRepository(Data.AppDbContext context, IForumCommentRepository commentRepo)
        {
            _context = context;
            _commentRepo = commentRepo;
        }

        public async Task<ForumPost?> GetPostByIdAsync(int postId)
        {
            try
            {
                var post = await _context.ForumPosts
                    .Include(p => p.Subject)
                    .Include(p => p.Flair)
                    .Include(p => p.CreatedByNavigation)
                    .FirstOrDefaultAsync(p => p.Id == postId && p.DeletedAt == null);

                if (post == null) return null;

                var mappedPost = MapPostToEntity(post);

                var school = await _context.Schools.FindAsync(post.SchoolId);
                if (school != null)
                {
                    mappedPost.School = new School
                    {
                        Id = school.Id,
                        Name = school.Name
                    };
                }

                mappedPost.Attachments = await _context.ForumAttachments
                    .Where(a => a.PostId == postId && a.DeletedAt == null)
                    .Where(a => mappedPost.Status == null || a.IsApproved == true)
                    .Select(a => new ForumAttachment
                    {
                        Id = a.Id,
                        PostId = a.PostId,
                        FileUrl = a.FileUrl,
                        IsApproved = a.IsApproved,
                        CreatedAt = a.CreatedAt,
                        CreatedBy = a.CreatedBy
                    })
                    .ToListAsync();

                mappedPost.ViolationRecords = await GetViolationRecordsByPostIdAsync(postId);

                var (comments, _) = await _commentRepo.GetCommentsByPostIdAsync(postId);
                mappedPost.CommentCount = await _context.ForumComments
                    .CountAsync(c => c.PostId == postId && c.DeletedAt == null);
                mappedPost.Comments = comments;

                return mappedPost;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumPostRepository", "GetPostByIdAsync failed: " + ex.Message).LogError();
                return null;
            }
        }

        public async Task<(List<ForumPost> posts, int totalCount)> GetPublicPostsAsync(
     int schoolId,
     List<short>? subjectIds = null,
     List<int>? flairIds = null,
     string? query = null,
     string? sortBy = null,
     int? pageNumber = null,
     int? pageSize = null)
        {
            try
            {
                var dbQuery = _context.ForumPosts
     .Include(p => p.Subject)
     .Include(p => p.Flair)
     .Include(p => p.CreatedByNavigation)
     .Where(p => p.SchoolId == schoolId && p.DeletedAt == null && p.Status == true && !(p.IsHidden == true && p.Status == false));

                if (subjectIds != null && subjectIds.Any())
                    dbQuery = dbQuery.Where(p => subjectIds.Contains(p.SubjectId));

                if (flairIds != null && flairIds.Any())
                    dbQuery = dbQuery.Where(p => flairIds.Contains(p.FlairId!.Value));

                if (!string.IsNullOrWhiteSpace(query))
                    dbQuery = dbQuery.Where(p =>
                        p.Title.Contains(query) ||
                        p.CreatedByNavigation.Fullname.Contains(query));

                var totalCount = await dbQuery.CountAsync();

                dbQuery = sortBy?.ToLower() switch
                {
                    "date_asc" => dbQuery.OrderBy(p => p.CreatedAt),
                    "violation_score" => dbQuery.OrderByDescending(p => p.TotalViolationScore),
                    "comment_count" => dbQuery.OrderByDescending(p => _context.ForumComments
        .Count(c => c.PostId == p.Id && c.DeletedAt == null)),
                    _ => dbQuery.OrderByDescending(p => p.CreatedAt)
                };

                if (pageNumber.HasValue && pageSize.HasValue)
                    dbQuery = dbQuery.Skip((pageNumber.Value - 1) * pageSize.Value).Take(pageSize.Value);

                var posts = await dbQuery.ToListAsync();
                var result = posts.Select(p => MapPostToEntity(p)).ToList();

                foreach (var post in result)
                {
                    var school = await _context.Schools.FindAsync(post.SchoolId);
                    if (school != null)
                    {
                        post.School = new School { Id = school.Id, Name = school.Name };
                    }

                    post.CommentCount = await _context.ForumComments
                        .CountAsync(c => c.PostId == post.Id && c.DeletedAt == null);

                    post.AttachmentCount = await _context.ForumAttachments
                        .CountAsync(a => a.PostId == post.Id && a.DeletedAt == null);

                    post.Attachments = await _context.ForumAttachments
                        .Where(a => a.PostId == post.Id && a.DeletedAt == null)
                        .Select(a => new ForumAttachment
                        {
                            Id = a.Id,
                            PostId = a.PostId,
                            FileUrl = a.FileUrl,
                            IsApproved = a.IsApproved,
                            CreatedAt = a.CreatedAt,
                            CreatedBy = a.CreatedBy
                        })
                        .ToListAsync();

                    var (comments, _) = await _commentRepo.GetCommentsByPostIdAsync(post.Id);
                    post.Comments = comments;
                }

                return (result, totalCount);
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumPostRepository", "GetPublicPostsAsync failed: " + ex.Message).LogError();
                return (new List<ForumPost>(), 0);
            }
        }

        public async Task<(List<ForumPost> posts, int totalCount)> GetOwnedPostsAsync(
        Guid userId,
        int schoolId,
        List<short>? subjectIds = null,
        List<int>? flairIds = null,
        string? query = null,
        bool? status = null,
        DateTime? createdFrom = null,
        DateTime? createdTo = null,
        int? pageNumber = null,
        int? pageSize = null)
        {
            try
            {
                var dbQuery = _context.ForumPosts
                    .Include(p => p.Subject)
                    .Include(p => p.Flair)
                    .Include(p => p.CreatedByNavigation)
                    .Where(p => p.SchoolId == schoolId && p.CreatedBy == userId && p.DeletedAt == null);

                if (subjectIds != null && subjectIds.Any())
                    dbQuery = dbQuery.Where(p => subjectIds.Contains(p.SubjectId));

                if (flairIds != null && flairIds.Any())
                    dbQuery = dbQuery.Where(p => flairIds.Contains(p.FlairId!.Value));

                if (!string.IsNullOrWhiteSpace(query))
                    dbQuery = dbQuery.Where(p =>
                        p.Title.Contains(query) ||
                        p.CreatedByNavigation.Fullname.Contains(query));

                if (status.HasValue)
                    dbQuery = dbQuery.Where(p => p.Status == status.Value);

                if (createdFrom.HasValue)
                    dbQuery = dbQuery.Where(p => p.CreatedAt >= createdFrom.Value);

                if (createdTo.HasValue)
                    dbQuery = dbQuery.Where(p => p.CreatedAt <= createdTo.Value);

                var totalCount = await dbQuery.CountAsync();

                dbQuery = dbQuery.OrderByDescending(p => p.CreatedAt);

                if (pageNumber.HasValue && pageSize.HasValue)
                    dbQuery = dbQuery.Skip((pageNumber.Value - 1) * pageSize.Value).Take(pageSize.Value);

                var posts = await dbQuery.ToListAsync();
                var result = posts.Select(p => MapPostToEntity(p)).ToList();

                foreach (var post in result)
                {
                    var school = await _context.Schools.FindAsync(post.SchoolId);
                    if (school != null)
                    {
                        post.School = new School { Id = school.Id, Name = school.Name };
                    }

                    post.CommentCount = await _context.ForumComments
                        .CountAsync(c => c.PostId == post.Id && c.DeletedAt == null);

                    post.AttachmentCount = await _context.ForumAttachments
                        .CountAsync(a => a.PostId == post.Id && a.DeletedAt == null);

                    post.Attachments = await _context.ForumAttachments
                        .Where(a => a.PostId == post.Id && a.DeletedAt == null)
                        .Select(a => new ForumAttachment
                        {
                            Id = a.Id,
                            PostId = a.PostId,
                            FileUrl = a.FileUrl,
                            IsApproved = a.IsApproved,
                            CreatedAt = a.CreatedAt,
                            CreatedBy = a.CreatedBy
                        })
                        .ToListAsync();

                    var (comments, _) = await _commentRepo.GetCommentsByPostIdAsync(post.Id);
                    post.Comments = comments;
                }

                return (result, totalCount);
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumPostRepository", "GetOwnedPostsAsync failed: " + ex.Message).LogError();
                return (new List<ForumPost>(), 0);
            }
        }

        public async Task<(List<ForumPost> posts, int totalCount)> GetModeratorPostsAsync(
         int schoolId,
         List<short>? subjectIds = null,
         List<int>? flairIds = null,
         string? query = null,
         string? postStatus = null,
         int? minViolationScore = null,
         int? maxViolationScore = null,
         DateTime? createdFrom = null,
         DateTime? createdTo = null,
         string? sortBy = null,
         int? pageNumber = null,
         int? pageSize = null)
        {
            try
            {
                var dbQuery = _context.ForumPosts
                    .Include(p => p.Subject)
                    .Include(p => p.Flair)
                    .Include(p => p.CreatedByNavigation)
                    .Where(p => p.SchoolId == schoolId && p.DeletedAt == null);

                if (subjectIds != null && subjectIds.Any())
                    dbQuery = dbQuery.Where(p => subjectIds.Contains(p.SubjectId));

                if (flairIds != null && flairIds.Any())
                    dbQuery = dbQuery.Where(p => flairIds.Contains(p.FlairId!.Value));

                if (!string.IsNullOrWhiteSpace(query))
                    dbQuery = dbQuery.Where(p =>
                        p.Title.Contains(query) ||
                        p.CreatedByNavigation.Fullname.Contains(query));

                if (!string.IsNullOrWhiteSpace(postStatus))
                {
                    switch (postStatus.ToLower())
                    {
                        case "pending":
                            dbQuery = dbQuery.Where(p => p.Status == null);
                            break;
                        case "approved":
                            dbQuery = dbQuery.Where(p => p.Status == true);
                            break;
                        case "rejected":
                            dbQuery = dbQuery.Where(p => p.Status == false);
                            break;
                    }
                }

                if (minViolationScore.HasValue)
                    dbQuery = dbQuery.Where(p => p.TotalViolationScore >= minViolationScore.Value);

                if (maxViolationScore.HasValue)
                    dbQuery = dbQuery.Where(p => p.TotalViolationScore <= maxViolationScore.Value);

                if (createdFrom.HasValue)
                    dbQuery = dbQuery.Where(p => p.CreatedAt >= createdFrom.Value);

                if (createdTo.HasValue)
                    dbQuery = dbQuery.Where(p => p.CreatedAt <= createdTo.Value);

                var totalCount = await dbQuery.CountAsync();

                dbQuery = sortBy?.ToLower() switch
                {
                    "date_asc" => dbQuery.OrderBy(p => p.CreatedAt),
                    "violation_score" => dbQuery.OrderByDescending(p => p.TotalViolationScore),
                    "comment_count" => dbQuery.OrderByDescending(p => _context.ForumComments
        .Count(c => c.PostId == p.Id && c.DeletedAt == null)),
                    _ => dbQuery.OrderByDescending(p => p.CreatedAt)
                };

                if (pageNumber.HasValue && pageSize.HasValue)
                    dbQuery = dbQuery.Skip((pageNumber.Value - 1) * pageSize.Value).Take(pageSize.Value);

                var posts = await dbQuery.ToListAsync();
                var result = posts.Select(p => MapPostToEntity(p)).ToList();

                foreach (var post in result)
                {
                    var school = await _context.Schools.FindAsync(post.SchoolId);
                    if (school != null)
                    {
                        post.School = new School { Id = school.Id, Name = school.Name };
                    }

                    post.CommentCount = await _context.ForumComments
                        .CountAsync(c => c.PostId == post.Id && c.DeletedAt == null);
                    post.AttachmentCount = await _context.ForumAttachments
                        .CountAsync(a => a.PostId == post.Id && a.DeletedAt == null);

                    post.Attachments = await _context.ForumAttachments
                        .Where(a => a.PostId == post.Id && a.DeletedAt == null)
                        .Select(a => new ForumAttachment
                        {
                            Id = a.Id,
                            PostId = a.PostId,
                            FileUrl = a.FileUrl,
                            IsApproved = a.IsApproved,
                            CreatedAt = a.CreatedAt,
                            CreatedBy = a.CreatedBy
                        })
                        .ToListAsync();
                    var (comments, _) = await _commentRepo.GetCommentsByPostIdAsync(post.Id);
                    post.Comments = comments;
                    post.ViolationRecords = await GetViolationRecordsByPostIdAsync(post.Id);
                }

                return (result, totalCount);
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumPostRepository", "GetModeratorPostsAsync failed: " + ex.Message).LogError();
                return (new List<ForumPost>(), 0);
            }
        }

        public async Task<ForumPost> CreatePostAsync(ForumPost post)
        {
            try
            {
                var entity = new Data.ForumPost
                {
                    SchoolId = post.SchoolId,
                    SubjectId = post.SubjectId,
                    FlairId = post.FlairId,
                    Title = post.Title,
                    Content = post.Content,
                    TotalViolationScore = post.TotalViolationScore,
                    Status = post.Status,
                    IsHidden = post.IsHidden,
                    CreatedAt = post.CreatedAt,
                    CreatedBy = post.CreatedBy
                };

                _context.ForumPosts.Add(entity);
                await _context.SaveChangesAsync();

                post.Id = entity.Id;
                return post;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumPostRepository", "CreatePostAsync failed: " + ex.Message).LogError();
                throw;
            }
        }

        public async Task<ForumPost> UpdatePostAsync(ForumPost post)
        {
            try
            {
                var entity = await _context.ForumPosts.FindAsync(post.Id);
                if (entity == null)
                    throw new InvalidOperationException("Post not found");

                entity.FlairId = post.FlairId;
                entity.Title = post.Title;
                entity.Content = post.Content;
                entity.TotalViolationScore = post.TotalViolationScore;
                entity.Status = post.Status;
                entity.UpdatedAt = DateTime.Now;
                entity.UpdatedBy = post.UpdatedBy;

                await _context.SaveChangesAsync();
                return post;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumPostRepository", "UpdatePostAsync failed: " + ex.Message).LogError();
                throw;
            }
        }

        public async Task<bool> SoftDeletePostAsync(int postId, Guid deletedBy)
        {
            try
            {
                var entity = await _context.ForumPosts.FindAsync(postId);
                if (entity == null) return false;

                entity.DeletedAt = DateTime.Now;
                entity.UpdatedBy = deletedBy;

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumPostRepository", "SoftDeletePostAsync failed: " + ex.Message).LogError();
                return false;
            }
        }

        public async Task<bool> ApprovePostAsync(int postId, Guid moderatorId)
        {
            try
            {
                var entity = await _context.ForumPosts.FindAsync(postId);
                if (entity == null) return false;

                entity.Status = true;
                entity.UpdatedAt = DateTime.Now;
                entity.UpdatedBy = moderatorId;

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumPostRepository", "ApprovePostAsync failed: " + ex.Message).LogError();
                return false;
            }
        }

        public async Task<bool> RejectPostAsync(int postId, Guid moderatorId)
        {
            try
            {
                var entity = await _context.ForumPosts.FindAsync(postId);
                if (entity == null) return false;

                entity.Status = false;
                entity.UpdatedAt = DateTime.Now;
                entity.UpdatedBy = moderatorId;

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumPostRepository", "RejectPostAsync failed: " + ex.Message).LogError();
                return false;
            }
        }

        public async Task<bool> UpdatePostViolationScoreAsync(int postId, int additionalScore)
        {
            try
            {
                var entity = await _context.ForumPosts.FindAsync(postId);
                if (entity == null) return false;

                entity.TotalViolationScore += additionalScore;
                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumPostRepository", "UpdatePostViolationScoreAsync failed: " + ex.Message).LogError();
                return false;
            }
        }

        private async Task<List<ViolationRecord>> GetViolationRecordsByPostIdAsync(int postId)
        {
            try
            {
                var records = await _context.ViolationRecords
                    .Include(r => r.User)
                    .Include(r => r.MatchedRule)
                    .Include(r => r.MatchedPattern)
                    .Where(r => r.PostId == postId && r.DeletedAt == null)
                    .OrderByDescending(r => r.CreatedAt)
                    .ToListAsync();

                return records.Select(r => MapViolationRecordToEntity(r)).ToList();
            }
            catch (Exception ex)
            {
                new InfrastructureException("ForumPostRepository", "GetViolationRecordsByPostIdAsync failed: " + ex.Message).LogError();
                return new List<ViolationRecord>();
            }
        }

        private static ForumPost MapPostToEntity(Data.ForumPost p)
        {
            return new ForumPost
            {
                Id = p.Id,
                SchoolId = p.SchoolId,
                SubjectId = p.SubjectId,
                FlairId = p.FlairId,
                Title = p.Title,
                Content = p.Content,
                TotalViolationScore = p.TotalViolationScore,
                Status = p.Status,
                IsHidden = p.IsHidden,
                CreatedAt = p.CreatedAt,
                CreatedBy = p.CreatedBy,
                UpdatedAt = p.UpdatedAt,
                UpdatedBy = p.UpdatedBy,
                DeletedAt = p.DeletedAt,
                Subject = p.Subject != null ? new Subject { Id = p.Subject.Id, Name = p.Subject.Name } : null,
                School = null,
                Flair = p.Flair != null ? new ForumFlair
                {
                    Id = p.Flair.Id,
                    Name = p.Flair.Name,
                    IsProtected = p.Flair.IsProtected
                } : null,
                Creator = p.CreatedByNavigation != null ? new AppUser
                {
                    Id = Guid.Parse(p.CreatedByNavigation.Id.ToString()),
                    Username = p.CreatedByNavigation.Username,
                    Fullname = p.CreatedByNavigation.Fullname,
                    Avatar = p.CreatedByNavigation.Avatar
                } : null,
                Comments = new List<ForumComment>()
            };
        }

        private static ViolationRecord MapViolationRecordToEntity(Data.ViolationRecord r)
        {
            return new ViolationRecord
            {
                Id = r.Id,
                UserId = r.UserId,
                SchoolId = r.SchoolId,
                PostId = r.PostId,
                CommentId = r.CommentId,
                MatchedRuleId = r.MatchedRuleId,
                MatchedPatternId = r.MatchedPatternId,
                ViolationScore = r.ViolationScore,
                SourceType = r.SourceType,
                ReportedBy = r.ReportedBy,
                CreatedAt = r.CreatedAt,
                DeletedAt = r.DeletedAt,
                User = r.User != null ? new AppUser
                {
                    Id = Guid.Parse(r.User.Id.ToString()),
                    Username = r.User.Username,
                    Fullname = r.User.Fullname
                } : null,
                Post = r.Post != null ? new ForumPost
                {
                    Id = r.Post.Id,
                    Title = r.Post.Title,
                    Content = r.Post.Content
                } : null,
                Comment = r.Comment != null ? new ForumComment
                {
                    CommentId = r.Comment.Id,
                    Content = r.Comment.Content,
                    PostId = r.Comment.PostId
                } : null,
                Rule = r.MatchedRule != null ? new ForumRule
                {
                    Id = r.MatchedRule.Id,
                    Name = r.MatchedRule.Name,
                    Severity = r.MatchedRule.Severity,
                    Description = r.MatchedRule.Description,
                    ViolationScore = r.MatchedRule.ViolationScore
                } : null,
                Pattern = r.MatchedPattern != null ? new RulePattern
                {
                    Id = r.MatchedPattern.Id,
                    Pattern = r.MatchedPattern.Pattern
                } : null,
                Reporter = r.ReportedByNavigation != null ? new AppUser
                {
                    Id = Guid.Parse(r.ReportedByNavigation.Id.ToString()),
                    Username = r.ReportedByNavigation.Username,
                    Fullname = r.ReportedByNavigation.Fullname
                } : null
            };
        }
    }
}