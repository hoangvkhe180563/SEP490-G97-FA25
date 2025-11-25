    using Microsoft.AspNetCore.Mvc;
    using Microsoft.AspNetCore.SignalR;
    using StudyHub.Backend.Api.Dtos.ForumDTOs;
    using StudyHub.Backend.Api.Hubs;
    using StudyHub.Backend.Api.Mappers;
    using StudyHub.Backend.UseCases.Services;
    using StudyHub.Backend.UseCases.Utils;

namespace StudyHub.Backend.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ForumController : ControllerBase
    {
        private readonly ForumPostService _postService;
        private readonly ForumCommentService _commentService;
        private readonly ForumConfigService _configService;
        private readonly ForumModerationService _moderationService;
        private readonly AppUserService _userService;
        private readonly AuthService _authService;
        private readonly AppRoleService _roleService;
        private readonly IHubContext<ForumHub> _forumHubContext;
        private readonly ILogger<ForumController> _logger;
        //private readonly AbacUtils _abacUtils;
        public ForumController(
            ForumPostService postService,
            ForumCommentService commentService,
            ForumConfigService configService,
            ForumModerationService moderationService,
            AppUserService userService,
            AuthService authService,
            AppRoleService roleService,
            IHubContext<ForumHub> forumHubContext,
            ILogger<ForumController> logger)
        {
            _postService = postService;
            _commentService = commentService;
            _configService = configService;
            _moderationService = moderationService;
            _userService = userService;
            _authService = authService;
            _roleService = roleService;
            _forumHubContext = forumHubContext;
            _logger = logger;
        }

        private IActionResult PagedResult<T>(List<T> items, int total, int page, int limit)
        {
            return Ok(new
            {
                success = true,
                data = new StudyHub.Backend.UseCases.Dtos.PagedResult<T>
                {
                    Items = items,
                    Total = total,
                    Page = page,
                    Limit = limit,
                    TotalPages = (int)Math.Ceiling(total / (double)limit)
                }
            });
        }

        [HttpGet("posts")]
        public async Task<IActionResult> GetPublicPosts([FromQuery] ForumPostFilterDto filter)
        {
            try
            {
                var currentUser = _authService.GetCurrentUser();
                if (currentUser == null || currentUser.SchoolId != filter.SchoolId)
                {
                    _logger.LogWarning("Unauthorized access to posts for school {SchoolId}", filter.SchoolId);
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập với tài khoản thuộc trường này" });
                }

                bool isModerator = IsModerator();

                var (posts, totalCount) = await _postService.GetPublicPostsAsync(
                    filter.SchoolId,
                    filter.SubjectIds,
                    filter.FlairIds,
                    filter.Query,
                    filter.SortBy,
                    filter.PageNumber,
                    filter.PageSize);

                var dtos = posts.Select(p => p.ToListDto(currentUser.Id, isModerator)).ToList();
                return PagedResult(dtos, totalCount, filter.PageNumber, filter.PageSize);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting public posts");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi tải bài viết" });
            }
        }

        [HttpGet("posts/{postId:int}")]
        public async Task<IActionResult> GetPostById(int postId)
        {
            try
            {
                var currentUser = _authService.GetCurrentUser();
                if (currentUser == null)
                {
                    _logger.LogWarning("Unauthorized access to post {PostId}", postId);
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });
                }

                var post = await _postService.GetPostByIdAsync(postId);
                if (post == null)
                {
                    _logger.LogWarning("Post {PostId} not found", postId);
                    return NotFound(new { success = false, message = "Không tìm thấy bài viết" });
                }

                if (currentUser.SchoolId != post.SchoolId)
                {
                    _logger.LogWarning("User {UserId} attempted to access post {PostId} from different school",
                        currentUser.Id, postId);
                    return Forbid();
                }

                bool isOwner = post.CreatedBy == currentUser.Id;
                bool isModerator = IsModerator();
                bool isApproved = post.Status == true;

                if (!isApproved && !isOwner && !isModerator)
                {
                    _logger.LogWarning("User {UserId} attempted to access pending/hidden post {PostId} without permission",
                        currentUser.Id, postId);
                    return NotFound(new { success = false, message = "Không tìm thấy bài viết" });
                }

                return Ok(new { success = true, data = post.ToDetailDto(currentUser.Id, isModerator) });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting post {PostId}", postId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi tải bài viết" });
            }
        }

        [HttpPost("posts/create")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> CreatePost([FromForm] CreateForumPostDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    _logger.LogWarning("Invalid model state for create post");
                    return BadRequest(new { success = false, errors = ModelState });
                }

                var currentUser = _authService.GetCurrentUser();
                if (currentUser == null)
                {
                    _logger.LogWarning("Unauthorized attempt to create post");
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });
                }

                if (currentUser.SchoolId != dto.SchoolId)
                {
                    _logger.LogWarning("User {UserId} attempted to create post for different school", currentUser.Id);
                    return Forbid();
                }

                var isMuted = await _moderationService.IsUserMutedAsync(currentUser.Id.ToString(), dto.SchoolId);
                if (isMuted)
                {
                    _logger.LogWarning("Muted user {UserId} attempted to create post", currentUser.Id);
                    return BadRequest(new { success = false, message = "Bạn đang bị cấm đăng bài" });
                }

                var post = dto.ToEntity(currentUser.Id);
                var createdPost = await _postService.CreatePostAsync(post, dto.Attachments);

                _logger.LogInformation("User {UserId} created post {PostId}", currentUser.Id, createdPost.Id);

                var postDto = createdPost.ToDetailDto(currentUser.Id, IsModerator());
                await _forumHubContext.Clients.Group($"school-{dto.SchoolId}").SendAsync("ReceiveNewPost", postDto);

                return CreatedAtAction(nameof(GetPostById), new { postId = createdPost.Id },
                    new { success = true, data = postDto });
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("vi phạm") || ex.Message.Contains("kiểm duyệt"))
            {
                _logger.LogWarning(ex, "Image moderation or content violation");
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating post");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi tạo bài viết" });
            }
        }

        [HttpPut("posts/{postId:int}")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UpdatePost(int postId, [FromForm] UpdateForumPostDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { success = false, errors = ModelState });

            if (postId != dto.PostId)
                return BadRequest(new { success = false, message = "PostId không khớp" });

            var currentUser = _authService.GetCurrentUser();
            if (currentUser == null)
                return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

            var existingPost = await _postService.GetPostByIdAsync(postId);
            if (existingPost == null)
                return NotFound(new { success = false, message = "Không tìm thấy bài viết" });

            if (existingPost.CreatedBy != currentUser.Id)
                return Forbid();

            existingPost.FlairId = dto.FlairId;
            existingPost.Title = dto.Title;
            existingPost.Content = dto.Content;
            existingPost.UpdatedBy = currentUser.Id;

            var updatedPost = await _postService.UpdatePostWithAttachmentsAsync(existingPost, dto.NewAttachments, dto.DeletedAttachmentUrls);

            var postDto = updatedPost.ToDetailDto();
            await _forumHubContext.Clients.Group($"school-{existingPost.SchoolId}").SendAsync("PostUpdated", postDto);
            await _forumHubContext.Clients.Group($"post-{postId}").SendAsync("PostUpdated", postDto);

            return Ok(new { success = true, data = postDto });
        }


        [HttpGet("comments/{commentId:int}")]
        public async Task<IActionResult> GetCommentById(int commentId)
        {
            try
            {
                var currentUser = _authService.GetCurrentUser();
                if (currentUser == null)
                {
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });
                }

                var comment = await _commentService.GetCommentByIdAsync(commentId);
                if (comment == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy bình luận" });
                }

                bool isModerator = IsModerator();
                return Ok(new { success = true, data = comment.ToListDto(currentUser.Id, isModerator) });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting comment {CommentId}", commentId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        [HttpGet("posts/{postId:int}/comments")]
        public async Task<IActionResult> GetCommentsByPost(int postId, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 50)
        {
            try
            {
                var currentUser = _authService.GetCurrentUser();
                if (currentUser == null)
                {
                    _logger.LogWarning("Unauthorized access to comments for post {PostId}", postId);
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });
                }

                var post = await _postService.GetPostByIdAsync(postId);
                if (post == null)
                {
                    _logger.LogWarning("Post {PostId} not found", postId);
                    return NotFound(new { success = false, message = "Không tìm thấy bài viết" });
                }

                if (currentUser.SchoolId != post.SchoolId)
                {
                    _logger.LogWarning("User {UserId} attempted to access comments from different school", currentUser.Id);
                    return Forbid();
                }

                bool isModerator = IsModerator();

                var (comments, totalCount) = await _commentService.GetCommentsByPostIdAsync(postId, pageNumber, pageSize);
                var dtos = comments.Select(c => c.ToListDto(currentUser.Id, isModerator)).ToList();

                return PagedResult(dtos, totalCount, pageNumber, pageSize);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting comments for post {PostId}", postId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi tải bình luận" });
            }
        }
        [HttpPost("{entityType}/{entityId:int}/{status}")]
        public async Task<IActionResult> ModerateEntity(string entityType, int entityId, string status)
        {
            try
            {
                if (status != "approve" && status != "reject")
                {
                    return BadRequest(new { success = false, message = "Status không hợp lệ" });
                }

                var currentUser = _authService.GetCurrentUser();
                if (currentUser == null)
                {
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });
                }

                bool result;
                string successMessage;
                string notFoundMessage;

                switch (entityType.ToLower())
                {
                    case "posts":
                        result = status == "approve"
                            ? await _postService.ApprovePostAsync(entityId, currentUser.Id.ToString())
                            : await _postService.RejectPostAsync(entityId, currentUser.Id.ToString());
                        successMessage = status == "approve" ? "Đã duyệt bài viết" : "Đã từ chối bài viết";
                        notFoundMessage = "Không tìm thấy bài viết";

                        if (result)
                        {
                            var post = await _postService.GetPostByIdAsync(entityId);
                            await _forumHubContext.Clients.Group($"moderators-{post?.SchoolId}").SendAsync("ModerationAction", new
                            {
                                ContentType = "post",
                                ContentId = entityId,
                                Action = status + "d",
                                Timestamp = DateTime.Now
                            });
                        }
                        break;

                    case "appeals":
                        result = status == "approve"
                            ? await _moderationService.ApproveAppealAsync(entityId, currentUser.Id)
                            : await _moderationService.RejectAppealAsync(entityId, currentUser.Id);
                        successMessage = status == "approve" ? "Đã chấp nhận khiếu nại" : "Đã từ chối khiếu nại";
                        notFoundMessage = "Không tìm thấy khiếu nại";
                        break;

                    case "reports":
                        result = status == "approve"
                            ? await _moderationService.ApproveReportAsync(entityId, currentUser.Id)
                            : await _moderationService.RejectReportAsync(entityId, currentUser.Id);
                        successMessage = status == "approve" ? "Đã chấp nhận tố cáo" : "Đã từ chối tố cáo";
                        notFoundMessage = "Không tìm thấy tố cáo";
                        break;

                    case "attachments":
                        result = status == "approve"
                            ? await _configService.ApproveAttachmentAsync(entityId, currentUser.Id)
                            : await _configService.RejectAttachmentAsync(entityId);
                        successMessage = status == "approve" ? "Đã duyệt attachment" : "Đã từ chối attachment";
                        notFoundMessage = "Không tìm thấy attachment";
                        break;

                    default:
                        return BadRequest(new { success = false, message = "Entity type không hợp lệ" });
                }

                if (!result)
                {
                    return NotFound(new { success = false, message = notFoundMessage });
                }

                _logger.LogInformation("Moderator {UserId} {Status}d {EntityType} {EntityId}",
                    currentUser.Id, status, entityType, entityId);

                return Ok(new { success = true, message = successMessage });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error {Status}ing {EntityType} {EntityId}", status, entityType, entityId);
                return StatusCode(500, new { success = false, message = $"Có lỗi xảy ra khi {status} {entityType}" });
            }
        }
        [HttpPost("comments/create")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> CreateComment([FromForm] CreateForumCommentDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    _logger.LogWarning("Invalid model state for create comment");
                    return BadRequest(new { success = false, errors = ModelState });
                }

                var currentUser = _authService.GetCurrentUser();
                if (currentUser == null)
                {
                    _logger.LogWarning("Unauthorized attempt to create comment");
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });
                }

                if (!currentUser.SchoolId.HasValue)
                {
                    _logger.LogWarning("User {UserId} has no school", currentUser.Id);
                    return BadRequest(new { success = false, message = "Bạn không thuộc trường học nào" });
                }

                var post = await _postService.GetPostByIdAsync(dto.PostId);
                if (post == null)
                {
                    _logger.LogWarning("Post {PostId} not found for comment", dto.PostId);
                    return NotFound(new { success = false, message = "Không tìm thấy bài viết" });
                }

                if (currentUser.SchoolId != post.SchoolId)
                {
                    _logger.LogWarning("User {UserId} attempted to comment on post from different school", currentUser.Id);
                    return Forbid();
                }

                var isMuted = await _moderationService.IsUserMutedAsync(currentUser.Id.ToString(), post.SchoolId);
                if (isMuted)
                {
                    _logger.LogWarning("Muted user {UserId} attempted to create comment", currentUser.Id);
                    return BadRequest(new { success = false, message = "Bạn đang bị cấm bình luận" });
                }

                var comment = dto.ToEntity(currentUser.Id, post.SchoolId);
                var createdComment = await _commentService.CreateCommentAsync(comment, dto.Attachments);

                _logger.LogInformation("User {UserId} created comment {CommentId} on post {PostId}",
                    currentUser.Id, createdComment.CommentId, dto.PostId);

                var commentDto = createdComment.ToListDto();
                await _forumHubContext.Clients.Group($"post-{dto.PostId}").SendAsync("ReceiveNewComment", commentDto);

                var updatedPost = await _postService.GetPostByIdAsync(dto.PostId);

                await _forumHubContext.Clients.Group($"post-{dto.PostId}").SendAsync("UpdateCommentCount", new
                {
                    postId = dto.PostId,
                    commentCount = updatedPost?.CommentCount
                });

                await _forumHubContext.Clients.Group($"school-{post.SchoolId}").SendAsync("UpdateCommentCount", new
                {
                    postId = dto.PostId,
                    commentCount = updatedPost?.CommentCount
                });

                return Ok(new { success = true, data = commentDto });
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("vi phạm") || ex.Message.Contains("kiểm duyệt"))
            {
                _logger.LogWarning(ex, "Image moderation or content violation in comment");
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating comment");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi tạo bình luận" });
            }
        }

        [HttpPut("comments/{commentId:int}")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UpdateComment(int commentId, [FromForm] UpdateForumCommentDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { success = false, errors = ModelState });

            if (commentId != dto.CommentId)
                return BadRequest(new { success = false, message = "CommentId không khớp" });

            var currentUser = _authService.GetCurrentUser();
            if (currentUser == null)
                return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

            var existingComment = await _commentService.GetCommentByIdAsync(commentId);
            if (existingComment == null)
                return NotFound(new { success = false, message = "Không tìm thấy bình luận" });

            if (existingComment.CreatedBy != currentUser.Id)
                return Forbid();

            existingComment.Content = dto.Content;
            existingComment.UpdatedBy = currentUser.Id;

            var updatedComment = await _commentService.UpdateCommentWithAttachmentsAsync(existingComment, dto.NewAttachments, dto.DeletedAttachmentUrls);

            var commentDto = updatedComment.ToListDto();
            await _forumHubContext.Clients.Group($"post-{existingComment.PostId}").SendAsync("CommentUpdated", commentDto);

            return Ok(new { success = true, data = commentDto });
        }


        [HttpGet("moderator/posts")]
        public async Task<IActionResult> GetModeratorPosts([FromQuery] ForumPostFilterDto filter)
        {
            try
            {
                var currentUser = _authService.GetCurrentUser();
                if (currentUser == null || currentUser.SchoolId != filter.SchoolId)
                {
                    _logger.LogWarning("Unauthorized access to moderator posts for school {SchoolId}", filter.SchoolId);
                    return Unauthorized(new { success = false, message = "Không có quyền truy cập" });
                }
                var (posts, totalCount) = await _postService.GetModeratorPostsAsync(
                    filter.SchoolId,
                    filter.SubjectIds,
                    filter.FlairIds,
                    filter.Query,
                    filter.PostStatus,
                    filter.MinViolationScore,
                    filter.MaxViolationScore,
                    filter.CreatedFrom,
                    filter.CreatedTo,
                    filter.SortBy,
                    filter.PageNumber,
                    filter.PageSize);
                var dtos = posts.Select(p => p.ToListDto(currentUser.Id, true)).ToList();
                return PagedResult(dtos, totalCount, filter.PageNumber, filter.PageSize);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting moderator posts");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi tải bài viết" });
            }
        }

        [HttpGet("moderator/comments")]
        public async Task<IActionResult> GetModeratorComments([FromQuery] ForumCommentFilterDto filter)
        {
            try
            {
                var currentUser = _authService.GetCurrentUser();
                if (currentUser == null || currentUser.SchoolId != filter.SchoolId)
                {
                    _logger.LogWarning("Unauthorized access to moderator comments for school {SchoolId}", filter.SchoolId);
                    return Unauthorized(new { success = false, message = "Không có quyền truy cập" });
                }

                var (comments, totalCount) = await _commentService.GetModeratorCommentsAsync(
                    filter.PostId,
                    filter.CommentStatus,
                    filter.MinViolationScore,
                    filter.CreatedFrom,
                    filter.CreatedTo,
                    filter.PageNumber,
                    filter.PageSize);

                var dtos = comments.Select(c => c.ToListDto(currentUser.Id, true)).ToList();
                return PagedResult(dtos, totalCount, filter.PageNumber, filter.PageSize);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting moderator comments");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi tải bình luận" });
            }
        }
        [HttpDelete("{entityType}/{entityId:int}")]
        public async Task<IActionResult> DeleteEntity(string entityType, int entityId, [FromQuery] int? schoolId = null)
        {
            try
            {
                var currentUser = _authService.GetCurrentUser();
                if (currentUser == null)
                {
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });
                }

                bool result;
                string entityName;
                object? entity = null;

                switch (entityType.ToLower())
                {
                    case "posts":
                        var post = await _postService.GetPostByIdAsync(entityId);
                        if (post == null)
                        {
                            return NotFound(new { success = false, message = "Không tìm thấy bài viết" });
                        }
                        if (post.CreatedBy != currentUser.Id)
                        {
                            return Forbid();
                        }
                        await _postService.SoftDeletePostAsync(entityId, currentUser.Id);
                        await _forumHubContext.Clients.Group($"school-{post.SchoolId}")
                            .SendAsync("PostDeleted", entityId);
                        await _forumHubContext.Clients.Group($"post-{entityId}")
                            .SendAsync("PostDeleted", entityId);
                        entityName = "bài viết";
                        result = true;
                        break;

                    case "comments":
                        var comment = await _commentService.GetCommentByIdAsync(entityId);
                        if (comment == null)
                        {
                            return NotFound(new { success = false, message = "Không tìm thấy bình luận" });
                        }
                        if (comment.CreatedBy != currentUser.Id)
                        {
                            return Forbid();
                        }
                        await _commentService.SoftDeleteCommentAsync(entityId, currentUser.Id);
                        await _forumHubContext.Clients.Group($"post-{comment.PostId}")
                            .SendAsync("CommentDeleted", entityId);
                        entityName = "bình luận";
                        result = true;
                        break;

                    case "flairs":
                        var flair = await _configService.GetFlairByIdAsync(entityId);
                        if (flair == null)
                        {
                            return NotFound(new { success = false, message = "Không tìm thấy flair" });
                        }
                        if (currentUser.SchoolId != flair.SchoolId)
                        {
                            return Forbid();
                        }
                        result = await _configService.DeleteFlairAsync(entityId);
                        entityName = "flair";
                        break;

                    case "rules":
                        var rule = await _moderationService.GetRuleByIdAsync(entityId);
                        if (rule == null)
                        {
                            return NotFound(new { success = false, message = "Không tìm thấy rule" });
                        }
                        if (currentUser.SchoolId != rule.SchoolId)
                        {
                            return Forbid();
                        }
                        result = await _moderationService.DeleteRuleAsync(entityId);
                        entityName = "rule";
                        break;

                    case "patterns":
                        var pattern = await _moderationService.GetPatternByIdAsync(entityId);
                        if (pattern == null)
                        {
                            return NotFound(new { success = false, message = "Không tìm thấy pattern" });
                        }
                        var patternRule = await _moderationService.GetRuleByIdAsync(pattern.RuleId);
                        if (currentUser.SchoolId != patternRule?.SchoolId)
                        {
                            return Forbid();
                        }
                        result = await _moderationService.DeletePatternAsync(entityId);
                        entityName = "pattern";
                        break;

                    case "attachments":
                        var attachment = await _configService.GetAttachmentByIdAsync(entityId);
                        if (attachment == null)
                        {
                            return NotFound(new { success = false, message = "Không tìm thấy attachment" });
                        }
                        if (attachment.CreatedBy != currentUser.Id)
                        {
                            return Forbid();
                        }
                        result = await _configService.SoftDeleteAttachmentAsync(entityId);
                        entityName = "attachment";
                        break;

                    default:
                        return BadRequest(new { success = false, message = "Entity type không hợp lệ" });
                }

                if (!result)
                {
                    return BadRequest(new { success = false, message = $"Không thể xóa {entityName}" });
                }

                _logger.LogInformation("User {UserId} deleted {EntityType} {EntityId}",
                    currentUser.Id, entityType, entityId);

                return Ok(new { success = true, message = $"Đã xóa {entityName}" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting {EntityType} {EntityId}", entityType, entityId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }
        [HttpGet("flairs")]
        public async Task<IActionResult> GetFlairs([FromQuery] ForumFlairFilterDto filter)
        {
            try
            {
                var currentUser = _authService.GetCurrentUser();
                if (currentUser == null || currentUser.SchoolId != filter.SchoolId)
                {
                    return Unauthorized(new { success = false, message = "Không có quyền truy cập" });
                }

                var (flairs, totalCount) = await _configService.GetFlairsBySchoolAsync(
                    filter.SchoolId,
                    filter.IsProtected,
                    filter.Status,
                    filter.PageNumber,
                    filter.PageSize);

                var dtos = flairs.Select(f => f.ToListDto()).ToList();
                return PagedResult(dtos, totalCount, filter.PageNumber, filter.PageSize);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting flairs");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }
        [HttpPost("{contentType}/{contentId:int}/report")]
        public async Task<IActionResult> ReportContent(string contentType, int contentId, [FromBody] ReportContentDto dto)
        {
            try
            {
                var currentUser = _authService.GetCurrentUser();
                if (currentUser == null)
                {
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });
                }

                bool result;
                int? schoolId = null;
                string entityName;

                switch (contentType.ToLower())
                {
                    case "posts":
                        result = await _postService.ReportPostAsync(contentId, currentUser.Id, dto.RuleId, dto.Reason);
                        var post = await _postService.GetPostByIdAsync(contentId);
                        schoolId = post?.SchoolId;
                        entityName = "bài viết";

                        if (result)
                        {
                            await _forumHubContext.Clients.Group($"moderators-{schoolId}")
                                .SendAsync("NewReport", new
                                {
                                    ContentType = "post",
                                    ContentId = contentId,
                                    ReportedBy = currentUser.Id,
                                    Timestamp = DateTime.Now
                                });
                        }
                        break;

                    case "comments":
                        result = await _commentService.ReportCommentAsync(contentId, currentUser.Id, dto.RuleId, dto.Reason);
                        var comment = await _commentService.GetCommentByIdAsync(contentId);
                        if (comment != null)
                        {
                            var commentPost = await _postService.GetPostByIdAsync(comment.PostId);
                            schoolId = commentPost?.SchoolId;
                        }
                        entityName = "bình luận";

                        if (result)
                        {
                            await _forumHubContext.Clients.Group($"moderators-{schoolId}")
                                .SendAsync("NewReport", new
                                {
                                    ContentType = "comment",
                                    ContentId = contentId,
                                    ReportedBy = currentUser.Id,
                                    Timestamp = DateTime.Now
                                });
                        }
                        break;

                    default:
                        return BadRequest(new { success = false, message = "Content type không hợp lệ" });
                }

                if (!result)
                {
                    return NotFound(new { success = false, message = $"Không tìm thấy {entityName} hoặc rule" });
                }

                _logger.LogInformation("User {UserId} reported {ContentType} {ContentId}",
                    currentUser.Id, contentType, contentId);

                return Ok(new { success = true, message = "Đã gửi báo cáo" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reporting {ContentType} {ContentId}", contentType, contentId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        [HttpGet("flairs/{flairId:int}")]
        public async Task<IActionResult> GetFlairById(int flairId)
        {
            try
            {
                var currentUser = _authService.GetCurrentUser();
                if (currentUser == null)
                {
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });
                }

                var flair = await _configService.GetFlairByIdAsync(flairId);
                if (flair == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy flair" });
                }

                return Ok(new { success = true, data = flair.ToListDto() });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting flair {FlairId}", flairId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        [HttpPost("flairs/create")]
        public async Task<IActionResult> CreateFlair([FromBody] CreateForumFlairDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { success = false, errors = ModelState });
                }

                var currentUser = _authService.GetCurrentUser();
                if (currentUser == null || currentUser.SchoolId != dto.SchoolId)
                {
                    return Unauthorized(new { success = false, message = "Không có quyền truy cập" });
                }

                var flair = dto.ToEntity(currentUser.Id, dto.SchoolId);
                var createdFlair = await _configService.CreateFlairAsync(flair);

                _logger.LogInformation("Moderator {UserId} created flair {FlairId}", currentUser.Id, createdFlair.Id);

                return Ok(new { success = true, data = createdFlair.ToListDto() });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating flair");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        [HttpPut("flairs/{flairId:int}")]
        public async Task<IActionResult> UpdateFlair(int flairId, [FromBody] UpdateForumFlairDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { success = false, errors = ModelState });
                }

                if (flairId != dto.FlairId)
                {
                    return BadRequest(new { success = false, message = "FlairId không khớp" });
                }

                var currentUser = _authService.GetCurrentUser();
                if (currentUser == null)
                {
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });
                }

                var existingFlair = await _configService.GetFlairByIdAsync(flairId);
                if (existingFlair == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy flair" });
                }

                if (currentUser.SchoolId != existingFlair.SchoolId)
                {
                    return Forbid();
                }

                var updatedFlair = dto.ToEntity(existingFlair);
                updatedFlair.UpdatedBy = currentUser.Id;
                var result = await _configService.UpdateFlairAsync(updatedFlair);

                _logger.LogInformation("Moderator {UserId} updated flair {FlairId}", currentUser.Id, flairId);

                return Ok(new { success = true, data = result.ToListDto() });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating flair {FlairId}", flairId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }


        [HttpGet("rules")]
        public async Task<IActionResult> GetRules([FromQuery] ForumRuleFilterDto filter)
        {
            try
            {
                var currentUser = _authService.GetCurrentUser();
                if (currentUser == null || currentUser.SchoolId != filter.SchoolId)
                {
                    return Unauthorized(new { success = false, message = "Không có quyền truy cập" });
                }

                var (rules, totalCount) = await _moderationService.GetRulesBySchoolAsync(
                    filter.SchoolId,
                    filter.RuleType,
                    filter.IsActive,
                    filter.PageNumber,
                    filter.PageSize);

                var dtos = rules.Select(r => r.ToListDto()).ToList();
                return PagedResult(dtos, totalCount, filter.PageNumber, filter.PageSize);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting rules");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        [HttpGet("rules/{ruleId:int}")]
        public async Task<IActionResult> GetRuleById(int ruleId)
        {
            try
            {
                var currentUser = _authService.GetCurrentUser();
                if (currentUser == null)
                {
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });
                }

                var rule = await _moderationService.GetRuleByIdAsync(ruleId);
                if (rule == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy rule" });
                }

                return Ok(new { success = true, data = rule.ToDetailDto() });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting rule {RuleId}", ruleId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        [HttpPost("rules/create")]
        public async Task<IActionResult> CreateRule([FromBody] CreateForumRuleDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { success = false, errors = ModelState });
                }

                var currentUser = _authService.GetCurrentUser();
                if (currentUser == null || currentUser.SchoolId != dto.SchoolId)
                {
                    return Unauthorized(new { success = false, message = "Không có quyền truy cập" });
                }

                var rule = dto.ToEntity(currentUser.Id, dto.SchoolId);
                var createdRule = await _moderationService.CreateRuleWithPatternsAsync(rule, dto.Patterns);

                _logger.LogInformation("Moderator {UserId} created rule {RuleId} with {PatternCount} patterns",
                    currentUser.Id, createdRule.Id, dto.Patterns.Count);

                return Ok(new { success = true, data = createdRule.ToDetailDto() });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating rule");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        [HttpPut("rules/{ruleId:int}")]
        public async Task<IActionResult> UpdateRule(int ruleId, [FromBody] UpdateForumRuleDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { success = false, errors = ModelState });
                }

                if (ruleId != dto.RuleId)
                {
                    return BadRequest(new { success = false, message = "RuleId không khớp" });
                }

                var currentUser = _authService.GetCurrentUser();
                if (currentUser == null)
                {
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });
                }

                var existingRule = await _moderationService.GetRuleByIdAsync(ruleId);
                if (existingRule == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy rule" });
                }

                if (currentUser.SchoolId != existingRule.SchoolId)
                {
                    return Forbid();
                }

                var updatedRule = dto.ToEntity(existingRule);
                updatedRule.UpdatedBy = currentUser.Id;
                var result = await _moderationService.UpdateRuleAsync(updatedRule);

                _logger.LogInformation("Moderator {UserId} updated rule {RuleId}", currentUser.Id, ruleId);

                return Ok(new { success = true, data = result.ToDetailDto() });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating rule {RuleId}", ruleId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }



        [HttpGet("rules/{ruleId:int}/patterns")]
        public async Task<IActionResult> GetPatternsByRule(int ruleId, [FromQuery] RulePatternFilterDto filter)
        {
            try
            {
                var currentUser = _authService.GetCurrentUser();
                if (currentUser == null)
                {
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });
                }

                var rule = await _moderationService.GetRuleByIdAsync(ruleId);
                if (rule == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy rule" });
                }

                if (currentUser.SchoolId != rule.SchoolId)
                {
                    return Forbid();
                }

                var (patterns, totalCount) = await _moderationService.GetPatternsByRuleAsync(
                    ruleId,
                    filter.IsActive,
                    filter.PageNumber,
                    filter.PageSize);

                var dtos = patterns.Select(p => p.ToDto()).ToList();
                return PagedResult(dtos, totalCount, filter.PageNumber, filter.PageSize);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting patterns for rule {RuleId}", ruleId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        [HttpPost("patterns/create")]
        public async Task<IActionResult> CreatePattern([FromBody] CreateRulePatternDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { success = false, errors = ModelState });
                }

                var currentUser = _authService.GetCurrentUser();
                if (currentUser == null)
                {
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });
                }

                var rule = await _moderationService.GetRuleByIdAsync(dto.RuleId);
                if (rule == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy rule" });
                }

                if (currentUser.SchoolId != rule.SchoolId)
                {
                    return Forbid();
                }

                var pattern = dto.ToEntity(currentUser.Id);
                var createdPattern = await _moderationService.CreatePatternAsync(pattern);

                _logger.LogInformation("Moderator {UserId} created pattern {PatternId} for rule {RuleId}",
                    currentUser.Id, createdPattern.Id, dto.RuleId);

                return Ok(new { success = true, data = createdPattern.ToDto() });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating pattern");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        [HttpPut("patterns/{patternId:int}")]
        public async Task<IActionResult> UpdatePattern(int patternId, [FromBody] UpdateRulePatternDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { success = false, errors = ModelState });
                }

                if (patternId != dto.PatternId)
                {
                    return BadRequest(new { success = false, message = "PatternId không khớp" });
                }

                var currentUser = _authService.GetCurrentUser();
                if (currentUser == null)
                {
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });
                }

                var existingPattern = await _moderationService.GetPatternByIdAsync(patternId);
                if (existingPattern == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy pattern" });
                }

                var rule = await _moderationService.GetRuleByIdAsync(existingPattern.RuleId);
                if (currentUser.SchoolId != rule?.SchoolId)
                {
                    return Forbid();
                }

                var updatedPattern = dto.ToEntity(existingPattern);
                updatedPattern.UpdatedBy = currentUser.Id;
                var result = await _moderationService.UpdatePatternAsync(updatedPattern);

                _logger.LogInformation("Moderator {UserId} updated pattern {PatternId}", currentUser.Id, patternId);

                return Ok(new { success = true, data = result.ToDto() });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating pattern {PatternId}", patternId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

 

        [HttpGet("appeals")]
        public async Task<IActionResult> GetUserAppeals([FromQuery] ForumAppealFilterDto filter)
        {
            try
            {
                var currentUser = _authService.GetCurrentUser();
                if (currentUser == null)
                {
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });
                }

                var (appeals, totalCount) = await _moderationService.GetAppealsByUserAsync(
                    currentUser.Id,
                    filter.SchoolId,
                    filter.Status,
                    filter.PageNumber,
                    filter.PageSize);

                var dtos = appeals.Select(a => a.ToListDto()).ToList();
                return PagedResult(dtos, totalCount, filter.PageNumber, filter.PageSize);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user appeals");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi tải khiếu nại" });
            }
        }

        [HttpPost("appeals/create")]
        public async Task<IActionResult> CreateAppeal([FromBody] CreateForumAppealDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { success = false, errors = ModelState });
                }

                var currentUser = _authService.GetCurrentUser();
                if (currentUser == null)
                {
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });
                }

                if (currentUser.SchoolId != dto.SchoolId)
                {
                    return Forbid();
                }

                var appeal = dto.ToEntity(currentUser.Id, dto.SchoolId);
                var createdAppeal = await _moderationService.CreateAppealAsync(appeal);
                createdAppeal.User = new Domain.Entities.AppUser
                {
                    Id = currentUser.Id,
                    Username = currentUser.Username,
                    Fullname = currentUser.Fullname,
                    Avatar = currentUser.Avatar
                };
                _logger.LogInformation("User {UserId} created appeal {AppealId}", currentUser.Id, createdAppeal.Id);

                return Ok(new { success = true, data = createdAppeal.ToListDto() });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating appeal");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi tạo khiếu nại" });
            }
        }

        [HttpGet("moderator/appeals")]
        public async Task<IActionResult> GetModeratorAppeals([FromQuery] ForumAppealFilterDto filter)
        {
            try
            {
                var currentUser = _authService.GetCurrentUser();
                if (currentUser == null || currentUser.SchoolId != filter.SchoolId)
                {
                    return Unauthorized(new { success = false, message = "Không có quyền truy cập" });
                }

                var (appeals, totalCount) = await _moderationService.GetAppealsBySchoolAsync(
                    filter.SchoolId,
                    filter.Status,
                    filter.Query,
                    filter.CreatedFrom,
                    filter.CreatedTo,
                    filter.PageNumber,
                    filter.PageSize);

                var dtos = appeals.Select(a => a.ToListDto()).ToList();
                return PagedResult(dtos, totalCount, filter.PageNumber, filter.PageSize);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting moderator appeals");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi tải khiếu nại" });
            }
        }

        [HttpGet("moderator/violations")]
        public async Task<IActionResult> GetViolationRecords([FromQuery] ViolationRecordFilterDto filter)
        {
            try
            {
                var currentUser = _authService.GetCurrentUser();
                if (currentUser == null || currentUser.SchoolId != filter.SchoolId)
                {
                    _logger.LogWarning("Unauthorized access to violations for school {SchoolId}", filter.SchoolId);
                    return Unauthorized(new { success = false, message = "Không có quyền truy cập" });
                }

                var (records, totalCount) = await _moderationService.GetViolationRecordsBySchoolAsync(
                    filter.SchoolId,
                    filter.SourceType,
                    filter.From,
                    filter.To,
                    filter.PageNumber,
                    filter.PageSize);

                var dtos = records.Select(r => r.ToDto()).ToList();
                return PagedResult(dtos, totalCount, filter.PageNumber, filter.PageSize);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting violation records");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi tải vi phạm" });
            }
        }

        [HttpGet("moderator/user-status")]
        public async Task<IActionResult> GetUserForumStatuses([FromQuery] UserForumStatusFilterDto filter)
        {
            try
            {
                var currentUser = _authService.GetCurrentUser();
                if (currentUser == null || currentUser.SchoolId != filter.SchoolId)
                {
                    return Unauthorized(new { success = false, message = "Không có quyền truy cập" });
                }

                var (statuses, totalCount) = await _moderationService.GetUserForumStatusesAsync(
                    filter.SchoolId,
                    filter.SearchTerm,
                    filter.IsMute,
                    filter.MinViolationScore,
                    filter.MaxViolationScore,
                    null,
                    filter.PageNumber,
                    filter.PageSize);

                var dtos = statuses.Select(s => s.ToDto()).ToList();

                return PagedResult(dtos, totalCount, filter.PageNumber, filter.PageSize);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user forum statuses");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        [HttpGet("user/status")]
        public async Task<IActionResult> GetCurrentUserStatus([FromQuery] int schoolId)
        {
            try
            {
                var currentUser = _authService.GetCurrentUser();
                if (currentUser == null || currentUser.SchoolId != schoolId)
                {
                    return Unauthorized(new { success = false, message = "Không có quyền truy cập" });
                }

                var status = await _moderationService.GetUserForumStatusAsync(currentUser.Id, schoolId);

                if (status == null)
                {
                    return Ok(new
                    {
                        success = true,
                        data = new
                        {
                            UserId = currentUser.Id,
                            TotalViolationScore = 100,
                            IsMute = false,
                            MuteUntil = (DateTime?)null
                        }
                    });
                }

                return Ok(new { success = true, data = status.ToDto() });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user status");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        //[HttpPost("moderator/reset-violation-score")]
        //public async Task<IActionResult> ResetViolationScore([FromBody] ResetUserViolationScoreDto dto)
        //{
        //    try
        //    {
        //        if (!ModelState.IsValid)
        //        {
        //            return BadRequest(new { success = false, errors = ModelState });
        //        }

        //        var currentUser = _authService.GetCurrentUser();
        //        if (currentUser == null || currentUser.SchoolId != dto.SchoolId)
        //        {
        //            return Unauthorized(new { success = false, message = "Không có quyền truy cập" });
        //        }

        //        var result = await _moderationService.ResetViolationScoreAsync(dto.UserId, dto.SchoolId);
        //        if (!result)
        //        {
        //            return BadRequest(new { success = false, message = "Không thể reset điểm vi phạm" });
        //        }

        //        _logger.LogInformation("Moderator {ModeratorId} reset violation score for user {UserId}",
        //            currentUser.Id, dto.UserId);

        //        return Ok(new { success = true, message = "Đã reset điểm vi phạm" });
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Error resetting violation score");
        //        return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
        //    }
        //}

        [HttpGet("user/violations")]
        public async Task<IActionResult> GetUserViolations([FromQuery] ViolationRecordFilterDto filter)
        {
            try
            {
                var currentUser = _authService.GetCurrentUser();
                if (currentUser == null)
                {
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });
                }

                var (records, totalCount) = await _moderationService.GetViolationRecordsByUserAsync(
                    currentUser.Id,
                    filter.SchoolId,
                    filter.From,
                    filter.To,
                    filter.SourceType,
                    filter.PageNumber,
                    filter.PageSize);

                var dtos = records.Select(r => r.ToDto()).ToList();
                return PagedResult(dtos, totalCount, filter.PageNumber, filter.PageSize);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user violations");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        [HttpGet("my-posts")]
        public async Task<IActionResult> GetMyPosts([FromQuery] ForumPostFilterDto filter)
        {
            try
            {
                var currentUser = _authService.GetCurrentUser();
                if (currentUser == null || currentUser.SchoolId != filter.SchoolId)
                {
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });
                }
                var (posts, totalCount) = await _postService.GetOwnedPostsAsync(
                    currentUser.Id,
                    filter.SchoolId,
                    filter.SubjectIds,
                    filter.FlairIds,
                    filter.Query,
                    null,
                    filter.CreatedFrom,
                    filter.CreatedTo,
                    filter.PageNumber,
                    filter.PageSize);
                var dtos = posts.Select(p => p.ToListDto(currentUser.Id, IsModerator())).ToList();
                return PagedResult(dtos, totalCount, filter.PageNumber, filter.PageSize);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user's posts");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        [HttpPost("{contentType}/{contentId:int}/hide")]
        public async Task<IActionResult> HideContent(string contentType, int contentId, [FromBody] HideContentDto dto)
        {
            try
            {
                var currentUser = _authService.GetCurrentUser();
                if (currentUser == null)
                {
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });
                }

                bool result;
                string entityName;
                object? entity = null;

                switch (contentType.ToLower())
                {
                    case "posts":
                        result = await _postService.HidePostByModeratorAsync(contentId, currentUser.Id, dto.ViolationScore);
                        entityName = "bài viết";
                        entity = await _postService.GetPostByIdAsync(contentId);
                        if (result && entity != null)
                        {
                            await _forumHubContext.Clients.Group($"school-{((dynamic)entity).SchoolId}")
                                .SendAsync("PostHidden", contentId);
                        }
                        break;

                    case "comments":
                        result = await _commentService.HideCommentByModeratorAsync(contentId, currentUser.Id, dto.ViolationScore);
                        entityName = "bình luận";
                        entity = await _commentService.GetCommentByIdAsync(contentId);
                        if (result && entity != null)
                        {
                            await _forumHubContext.Clients.Group($"post-{((dynamic)entity).PostId}")
                                .SendAsync("CommentHidden", contentId);
                        }
                        break;

                    default:
                        return BadRequest(new { success = false, message = "Content type không hợp lệ" });
                }

                if (!result)
                {
                    return NotFound(new { success = false, message = $"Không tìm thấy {entityName}" });
                }

                _logger.LogInformation("Moderator {UserId} hid {ContentType} {ContentId}",
                    currentUser.Id, contentType, contentId);

                return Ok(new { success = true, message = $"Đã ẩn {entityName}" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error hiding {ContentType} {ContentId}", contentType, contentId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        [HttpPost("{entityType}/{entityId:int}/toggle-status")]
        public async Task<IActionResult> ToggleStatus(string entityType, int entityId)
        {
            try
            {
                var currentUser = _authService.GetCurrentUser();
                if (currentUser == null)
                {
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });
                }

                bool result;
                string entityName;

                switch (entityType.ToLower())
                {
                    case "flairs":
                        var flair = await _configService.GetFlairByIdAsync(entityId);
                        if (flair == null)
                        {
                            return NotFound(new { success = false, message = "Không tìm thấy flair" });
                        }
                        if (currentUser.SchoolId != flair.SchoolId)
                        {
                            return Forbid();
                        }
                        result = await _configService.ToggleFlairStatusAsync(entityId);
                        entityName = "flair";
                        break;

                    case "rules":
                        var rule = await _moderationService.GetRuleByIdAsync(entityId);
                        if (rule == null)
                        {
                            return NotFound(new { success = false, message = "Không tìm thấy rule" });
                        }
                        if (currentUser.SchoolId != rule.SchoolId)
                        {
                            return Forbid();
                        }
                        result = await _moderationService.ToggleRuleStatusAsync(entityId);
                        entityName = "rule";
                        break;

                    case "patterns":
                        var pattern = await _moderationService.GetPatternByIdAsync(entityId);
                        if (pattern == null)
                        {
                            return NotFound(new { success = false, message = "Không tìm thấy pattern" });
                        }
                        var patternRule = await _moderationService.GetRuleByIdAsync(pattern.RuleId);
                        if (currentUser.SchoolId != patternRule?.SchoolId)
                        {
                            return Forbid();
                        }
                        result = await _moderationService.TogglePatternStatusAsync(entityId);
                        entityName = "pattern";
                        break;

                    default:
                        return BadRequest(new { success = false, message = "Entity type không hợp lệ" });
                }

                if (!result)
                {
                    return BadRequest(new { success = false, message = "Không thể toggle status" });
                }

                _logger.LogInformation("Moderator {UserId} toggled {EntityType} {EntityId} status",
                    currentUser.Id, entityType, entityId);

                return Ok(new { success = true, message = $"Đã cập nhật trạng thái {entityName}" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling {EntityType} status {EntityId}", entityType, entityId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }
    
        [HttpPost("moderator/mute-user/{userId}/{action}")]
        public async Task<IActionResult> MuteAction(Guid userId, string action, [FromQuery] int schoolId)
        {
            try
            {
                if (action != "mute" && action != "unmute")
                {
                    return BadRequest(new { success = false, message = "Action không hợp lệ" });
                }

                var currentUser = _authService.GetCurrentUser();
                if (currentUser == null || currentUser.SchoolId != schoolId)
                {
                    return Unauthorized(new { success = false, message = "Không có quyền truy cập" });
                }

                bool result;
                string successMessage;

                if (action == "mute")
                {
                    var muteUntil = DateTime.UtcNow.AddDays(7);
                    result = await _moderationService.MuteUserAsync(userId, schoolId, muteUntil);
                    successMessage = "Đã cấm người dùng trong 7 ngày";

                    if (result)
                    {
                        _logger.LogInformation("Moderator {ModeratorId} muted user {UserId} until {MuteUntil}",
                            currentUser.Id, userId, muteUntil);
                    }
                }
                else
                {
                    result = await _moderationService.UnmuteUserAsync(userId, schoolId);
                    successMessage = "Đã bỏ cấm người dùng";

                    if (result)
                    {
                        _logger.LogInformation("Moderator {ModeratorId} unmuted user {UserId}",
                            currentUser.Id, userId);
                    }
                }

                if (!result)
                {
                    return BadRequest(new { success = false, message = $"Không thể {action} người dùng" });
                }

                return Ok(new { success = true, message = successMessage });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error {Action} user {UserId}", action, userId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        private bool IsModerator()
        {
            var roleClaim = User.Claims.FirstOrDefault(c =>
                c.Type == "http://schemas.microsoft.com/ws/2008/06/identity/claims/role");

            if (roleClaim == null) return false;

            var roles = roleClaim.Value.Split(',').Select(r => r.Trim());
            return roles.Any(r => r == "Moderator" || r == "School Moderator");
        }
    }
}