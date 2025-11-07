using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using StudyHub.Backend.Api.Dtos.ForumDTOs;
using StudyHub.Backend.Api.Mappers;
using StudyHub.Backend.Api.Hubs;
using StudyHub.Backend.UseCases.Services;

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
        private readonly IHubContext<ForumHub> _forumHubContext;
        private readonly ILogger<ForumController> _logger;

        public ForumController(
            ForumPostService postService,
            ForumCommentService commentService,
            ForumConfigService configService,
            ForumModerationService moderationService,
            AppUserService userService,
            AuthService authService,
            IHubContext<ForumHub> forumHubContext,
            ILogger<ForumController> logger)
        {
            _postService = postService;
            _commentService = commentService;
            _configService = configService;
            _moderationService = moderationService;
            _userService = userService;
            _authService = authService;
            _forumHubContext = forumHubContext;
            _logger = logger;
        }

        private Guid? GetCurrentUserId()
        {
            var accessToken = Request.Cookies["access_token"];
            if (string.IsNullOrEmpty(accessToken))
                return null;

            return _authService.ValidateAccessToken(accessToken);
        }

        private Domain.Entities.AppUser? GetCurrentUser()
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
                return null;

            return _userService.GetUserById(userId.Value);
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
                var currentUser = GetCurrentUser();
                if (currentUser == null || currentUser.SchoolId != filter.SchoolId)
                {
                    _logger.LogWarning("Unauthorized access to posts for school {SchoolId}", filter.SchoolId);
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập với tài khoản thuộc trường này" });
                }

                var (posts, totalCount) = await _postService.GetPublicPostsAsync(
                    filter.SchoolId,
                    filter.SubjectId,
                    filter.FlairId,
                    filter.Query,
                    filter.SortBy,
                    filter.PageNumber,
                    filter.PageSize);

                var dtos = posts.Select(p => p.ToListDto()).ToList();
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
                var currentUser = GetCurrentUser();
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

                return Ok(new { success = true, data = post.ToDetailDto() });
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

                var currentUser = GetCurrentUser();
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

                var postDto = createdPost.ToListDto();
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
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { success = false, errors = ModelState });
                }

                if (postId != dto.PostId)
                {
                    return BadRequest(new { success = false, message = "PostId không khớp" });
                }

                var currentUser = GetCurrentUser();
                if (currentUser == null)
                {
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });
                }

                var existingPost = await _postService.GetPostByIdAsync(postId);
                if (existingPost == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy bài viết" });
                }

                if (existingPost.CreatedBy != currentUser.Id)
                {
                    return Forbid();
                }

                existingPost.FlairId = dto.FlairId;
                existingPost.Title = dto.Title;
                existingPost.Content = dto.Content;
                existingPost.UpdatedBy = currentUser.Id;

                var updatedPost = await _postService.UpdatePostAsync(existingPost);

                _logger.LogInformation("User {UserId} updated post {PostId}", currentUser.Id, postId);

                var postDto = updatedPost.ToDetailDto();
                await _forumHubContext.Clients.Group($"school-{existingPost.SchoolId}").SendAsync("PostUpdated", postDto);
                await _forumHubContext.Clients.Group($"post-{postId}").SendAsync("PostUpdated", postDto);

                return Ok(new { success = true, data = postDto });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating post {PostId}", postId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi cập nhật bài viết" });
            }
        }

        [HttpDelete("posts/{postId:int}")]
        public async Task<IActionResult> DeletePost(int postId)
        {
            try
            {
                var currentUser = GetCurrentUser();
                if (currentUser == null)
                {
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });
                }

                var post = await _postService.GetPostByIdAsync(postId);
                if (post == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy bài viết" });
                }

                if (post.CreatedBy != currentUser.Id)
                {
                    return Forbid();
                }

                await _postService.SoftDeletePostAsync(postId, currentUser.Id);

                _logger.LogInformation("User {UserId} deleted post {PostId}", currentUser.Id, postId);

                await _forumHubContext.Clients.Group($"school-{post.SchoolId}").SendAsync("PostDeleted", postId);
                await _forumHubContext.Clients.Group($"post-{postId}").SendAsync("PostDeleted", postId);

                return Ok(new { success = true, message = "Đã xóa bài viết" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting post {PostId}", postId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi xóa bài viết" });
            }
        }

        [HttpGet("posts/{postId:int}/comments")]
        public async Task<IActionResult> GetCommentsByPost(int postId, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 50)
        {
            try
            {
                var currentUser = GetCurrentUser();
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

                var (comments, totalCount) = await _commentService.GetCommentsByPostIdAsync(postId, pageNumber, pageSize);
                var dtos = comments.Select(c => c.ToListDto()).ToList();

                return PagedResult(dtos, totalCount, pageNumber, pageSize);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting comments for post {PostId}", postId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi tải bình luận" });
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

                var currentUser = GetCurrentUser();
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
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { success = false, errors = ModelState });
                }

                if (commentId != dto.CommentId)
                {
                    return BadRequest(new { success = false, message = "CommentId không khớp" });
                }

                var currentUser = GetCurrentUser();
                if (currentUser == null)
                {
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });
                }

                var existingComment = await _commentService.GetCommentByIdAsync(commentId);
                if (existingComment == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy bình luận" });
                }

                if (existingComment.CreatedBy != currentUser.Id)
                {
                    return Forbid();
                }

                existingComment.Content = dto.Content;
                existingComment.UpdatedBy = currentUser.Id;

                var updatedComment = await _commentService.UpdateCommentAsync(existingComment);

                _logger.LogInformation("User {UserId} updated comment {CommentId}", currentUser.Id, commentId);

                var commentDto = updatedComment.ToListDto();
                await _forumHubContext.Clients.Group($"post-{existingComment.PostId}").SendAsync("CommentUpdated", commentDto);

                return Ok(new { success = true, data = commentDto });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating comment {CommentId}", commentId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi cập nhật bình luận" });
            }
        }

        [HttpDelete("comments/{commentId:int}")]
        public async Task<IActionResult> DeleteComment(int commentId)
        {
            try
            {
                var currentUser = GetCurrentUser();
                if (currentUser == null)
                {
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });
                }

                var comment = await _commentService.GetCommentByIdAsync(commentId);
                if (comment == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy bình luận" });
                }

                if (comment.CreatedBy != currentUser.Id)
                {
                    return Forbid();
                }

                await _commentService.SoftDeleteCommentAsync(commentId, currentUser.Id);

                _logger.LogInformation("User {UserId} deleted comment {CommentId}", currentUser.Id, commentId);

                await _forumHubContext.Clients.Group($"post-{comment.PostId}").SendAsync("CommentDeleted", commentId);

                return Ok(new { success = true, message = "Đã xóa bình luận" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting comment {CommentId}", commentId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi xóa bình luận" });
            }
        }

        [HttpGet("moderator/posts")]
        public async Task<IActionResult> GetModeratorPosts([FromQuery] ForumPostFilterDto filter)
        {
            try
            {
                var currentUser = GetCurrentUser();
                if (currentUser == null || currentUser.SchoolId != filter.SchoolId)
                {
                    _logger.LogWarning("Unauthorized access to moderator posts for school {SchoolId}", filter.SchoolId);
                    return Unauthorized(new { success = false, message = "Không có quyền truy cập" });
                }

                var (posts, totalCount) = await _postService.GetModeratorPostsAsync(
                    filter.SchoolId,
                    filter.SubjectId,
                    filter.FlairId,
                    filter.Query,
                    filter.PostStatus,
                    filter.MinViolationScore,
                    filter.MaxViolationScore,
                    filter.CreatedFrom,
                    filter.CreatedTo,
                    filter.SortBy,
                    filter.PageNumber,
                    filter.PageSize);

                var dtos = posts.Select(p => p.ToListDto()).ToList();
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
                var currentUser = GetCurrentUser();
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

                var dtos = comments.Select(c => c.ToListDto()).ToList();
                return PagedResult(dtos, totalCount, filter.PageNumber, filter.PageSize);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting moderator comments");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi tải bình luận" });
            }
        }

        [HttpPost("posts/{postId:int}/approve")]
        public async Task<IActionResult> ApprovePost(int postId)
        {
            try
            {
                var currentUser = GetCurrentUser();
                if (currentUser == null)
                {
                    _logger.LogWarning("Unauthorized attempt to approve post {PostId}", postId);
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });
                }

                var result = await _postService.ApprovePostAsync(postId, currentUser.Id.ToString());
                if (!result)
                {
                    _logger.LogWarning("Post {PostId} not found for approval", postId);
                    return NotFound(new { success = false, message = "Không tìm thấy bài viết" });
                }

                _logger.LogInformation("Moderator {UserId} approved post {PostId}", currentUser.Id, postId);

                var post = await _postService.GetPostByIdAsync(postId);
                await _forumHubContext.Clients.Group($"moderators-{post.SchoolId}").SendAsync("ModerationAction", new
                {
                    ContentType = "post",
                    ContentId = postId,
                    Action = "approved",
                    Timestamp = DateTime.Now
                });

                return Ok(new { success = true, message = "Đã duyệt bài viết" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error approving post {PostId}", postId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi duyệt bài viết" });
            }
        }

        [HttpPost("posts/{postId:int}/reject")]
        public async Task<IActionResult> RejectPost(int postId)
        {
            try
            {
                var currentUser = GetCurrentUser();
                if (currentUser == null)
                {
                    _logger.LogWarning("Unauthorized attempt to reject post {PostId}", postId);
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });
                }

                var result = await _postService.RejectPostAsync(postId, currentUser.Id.ToString());
                if (!result)
                {
                    _logger.LogWarning("Post {PostId} not found for rejection", postId);
                    return NotFound(new { success = false, message = "Không tìm thấy bài viết" });
                }

                _logger.LogInformation("Moderator {UserId} rejected post {PostId}", currentUser.Id, postId);

                var post = await _postService.GetPostByIdAsync(postId);
                await _forumHubContext.Clients.Group($"moderators-{post.SchoolId}").SendAsync("ModerationAction", new
                {
                    ContentType = "post",
                    ContentId = postId,
                    Action = "rejected",
                    Timestamp = DateTime.Now
                });

                return Ok(new { success = true, message = "Đã từ chối bài viết" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error rejecting post {PostId}", postId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi từ chối bài viết" });
            }
        }

        [HttpPost("posts/{postId:int}/report")]
        public async Task<IActionResult> ReportPost(int postId, [FromBody] ReportPostDto dto)
        {
            try
            {
                var currentUser = GetCurrentUser();
                if (currentUser == null)
                {
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });
                }

                var result = await _postService.ReportPostAsync(postId, currentUser.Id, dto.RuleId, dto.Reason);
                if (!result)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy bài viết hoặc rule" });
                }

                _logger.LogInformation("User {UserId} reported post {PostId}", currentUser.Id, postId);

                var post = await _postService.GetPostByIdAsync(postId);
                await _forumHubContext.Clients.Group($"moderators-{post.SchoolId}").SendAsync("NewReport", new
                {
                    ContentType = "post",
                    ContentId = postId,
                    ReportedBy = currentUser.Id,
                    Timestamp = DateTime.Now
                });

                return Ok(new { success = true, message = "Đã gửi báo cáo" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reporting post {PostId}", postId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        [HttpPost("comments/{commentId:int}/report")]
        public async Task<IActionResult> ReportComment(int commentId, [FromBody] ReportCommentDto dto)
        {
            try
            {
                var currentUser = GetCurrentUser();
                if (currentUser == null)
                {
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });
                }

                var result = await _commentService.ReportCommentAsync(commentId, currentUser.Id, dto.RuleId, dto.Reason);
                if (!result)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy bình luận hoặc rule" });
                }

                _logger.LogInformation("User {UserId} reported comment {CommentId}", currentUser.Id, commentId);

                var comment = await _commentService.GetCommentByIdAsync(commentId);
                var post = await _postService.GetPostByIdAsync(comment.PostId);
                await _forumHubContext.Clients.Group($"moderators-{post.SchoolId}").SendAsync("NewReport", new
                {
                    ContentType = "comment",
                    ContentId = commentId,
                    ReportedBy = currentUser.Id,
                    Timestamp = DateTime.Now
                });

                return Ok(new { success = true, message = "Đã gửi báo cáo" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reporting comment {CommentId}", commentId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        [HttpPost("posts/{postId:int}/hide")]
        public async Task<IActionResult> HidePost(int postId, [FromBody] HidePostDto dto)
        {
            try
            {
                var currentUser = GetCurrentUser();
                if (currentUser == null)
                {
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });
                }

                var result = await _postService.HidePostByModeratorAsync(postId, currentUser.Id, dto.ViolationScore);
                if (!result)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy bài viết" });
                }

                _logger.LogInformation("Moderator {UserId} hid post {PostId}", currentUser.Id, postId);

                var post = await _postService.GetPostByIdAsync(postId);
                await _forumHubContext.Clients.Group($"school-{post.SchoolId}").SendAsync("PostHidden", postId);

                return Ok(new { success = true, message = "Đã ẩn bài viết" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error hiding post {PostId}", postId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }
    }
}