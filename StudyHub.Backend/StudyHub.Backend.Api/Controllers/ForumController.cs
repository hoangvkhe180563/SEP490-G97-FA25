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

        [HttpDelete("posts/{postId:int}")]
        public async Task<IActionResult> DeletePost(int postId)
        {
            try
            {
                var currentUser = _authService.GetCurrentUser();
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

        [HttpDelete("comments/{commentId:int}")]
        public async Task<IActionResult> DeleteComment(int commentId)
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

        [HttpPost("posts/{postId:int}/approve")]
        public async Task<IActionResult> ApprovePost(int postId)
        {
            try
            {
                var currentUser = _authService.GetCurrentUser();
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
                await _forumHubContext.Clients.Group($"moderators-{post?.SchoolId}").SendAsync("ModerationAction", new
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
                var currentUser = _authService.GetCurrentUser();
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
                await _forumHubContext.Clients.Group($"moderators-{post?.SchoolId}").SendAsync("ModerationAction", new
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
                var currentUser = _authService.GetCurrentUser();
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
                await _forumHubContext.Clients.Group($"moderators-{post?.SchoolId}").SendAsync("NewReport", new
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
                var currentUser = _authService.GetCurrentUser();
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
                var post = await _postService.GetPostByIdAsync(comment!.PostId);
                await _forumHubContext.Clients.Group($"moderators-{post?.SchoolId}").SendAsync("NewReport", new
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
                var currentUser = _authService.GetCurrentUser();
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
                await _forumHubContext.Clients.Group($"school-{post?.SchoolId}").SendAsync("PostHidden", postId);

                return Ok(new { success = true, message = "Đã ẩn bài viết" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error hiding post {PostId}", postId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }
        [HttpPost("comments/{commentId:int}/hide")]
        public async Task<IActionResult> HideComment(int commentId, [FromBody] HideCommentDto dto)
        {
            try
            {
                var currentUser = _authService.GetCurrentUser();
                if (currentUser == null)
                {
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });
                }

                var result = await _commentService.HideCommentByModeratorAsync(commentId, currentUser.Id, dto.ViolationScore);
                if (!result)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy bình luận" });
                }

                _logger.LogInformation("Moderator {UserId} hid comment {CommentId}", currentUser.Id, commentId);

                var comment = await _commentService.GetCommentByIdAsync(commentId);
                await _forumHubContext.Clients.Group($"post-{comment?.PostId}").SendAsync("CommentHidden", commentId);

                return Ok(new { success = true, message = "Đã ẩn bình luận" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error hiding comment {CommentId}", commentId);
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

        [HttpDelete("flairs/{flairId:int}")]
        public async Task<IActionResult> DeleteFlair(int flairId)
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

                if (currentUser.SchoolId != flair.SchoolId)
                {
                    return Forbid();
                }

                var result = await _configService.DeleteFlairAsync(flairId);
                if (!result)
                {
                    return BadRequest(new { success = false, message = "Không thể xóa flair" });
                }

                _logger.LogInformation("Moderator {UserId} deleted flair {FlairId}", currentUser.Id, flairId);

                return Ok(new { success = true, message = "Đã xóa flair" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting flair {FlairId}", flairId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        [HttpPost("flairs/{flairId:int}/toggle-status")]
        public async Task<IActionResult> ToggleFlairStatus(int flairId)
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

                if (currentUser.SchoolId != flair.SchoolId)
                {
                    return Forbid();
                }

                var result = await _configService.ToggleFlairStatusAsync(flairId);
                if (!result)
                {
                    return BadRequest(new { success = false, message = "Không thể toggle status" });
                }

                _logger.LogInformation("Moderator {UserId} toggled flair {FlairId} status", currentUser.Id, flairId);

                return Ok(new { success = true, message = "Đã cập nhật trạng thái flair" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling flair status {FlairId}", flairId);
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

        [HttpDelete("rules/{ruleId:int}")]
        public async Task<IActionResult> DeleteRule(int ruleId)
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

                var result = await _moderationService.DeleteRuleAsync(ruleId);
                if (!result)
                {
                    return BadRequest(new { success = false, message = "Không thể xóa rule" });
                }

                _logger.LogInformation("Moderator {UserId} deleted rule {RuleId}", currentUser.Id, ruleId);

                return Ok(new { success = true, message = "Đã xóa rule" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting rule {RuleId}", ruleId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        [HttpPost("rules/{ruleId:int}/toggle-status")]
        public async Task<IActionResult> ToggleRuleStatus(int ruleId)
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

                var result = await _moderationService.ToggleRuleStatusAsync(ruleId);
                if (!result)
                {
                    return BadRequest(new { success = false, message = "Không thể toggle status" });
                }

                _logger.LogInformation("Moderator {UserId} toggled rule {RuleId} status", currentUser.Id, ruleId);

                return Ok(new { success = true, message = "Đã cập nhật trạng thái rule" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling rule status {RuleId}", ruleId);
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

        [HttpDelete("patterns/{patternId:int}")]
        public async Task<IActionResult> DeletePattern(int patternId)
        {
            try
            {
                var currentUser = _authService.GetCurrentUser();
                if (currentUser == null)
                {
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });
                }

                var pattern = await _moderationService.GetPatternByIdAsync(patternId);
                if (pattern == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy pattern" });
                }

                var rule = await _moderationService.GetRuleByIdAsync(pattern.RuleId);
                if (currentUser.SchoolId != rule?.SchoolId)
                {
                    return Forbid();
                }

                var result = await _moderationService.DeletePatternAsync(patternId);
                if (!result)
                {
                    return BadRequest(new { success = false, message = "Không thể xóa pattern" });
                }

                _logger.LogInformation("Moderator {UserId} deleted pattern {PatternId}", currentUser.Id, patternId);

                return Ok(new { success = true, message = "Đã xóa pattern" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting pattern {PatternId}", patternId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        [HttpPost("patterns/{patternId:int}/toggle-status")]
        public async Task<IActionResult> TogglePatternStatus(int patternId)
        {
            try
            {
                var currentUser = _authService.GetCurrentUser();
                if (currentUser == null)
                {
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });
                }

                var pattern = await _moderationService.GetPatternByIdAsync(patternId);
                if (pattern == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy pattern" });
                }

                var rule = await _moderationService.GetRuleByIdAsync(pattern.RuleId);
                if (currentUser.SchoolId != rule?.SchoolId)
                {
                    return Forbid();
                }

                var result = await _moderationService.TogglePatternStatusAsync(patternId);
                if (!result)
                {
                    return BadRequest(new { success = false, message = "Không thể toggle status" });
                }

                _logger.LogInformation("Moderator {UserId} toggled pattern {PatternId} status", currentUser.Id, patternId);

                return Ok(new { success = true, message = "Đã cập nhật trạng thái pattern" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling pattern status {PatternId}", patternId);
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

        [HttpPost("appeals/{appealId:int}/approve")]
        public async Task<IActionResult> ApproveAppeal(int appealId)
        {
            try
            {
                var currentUser = _authService.GetCurrentUser();
                if (currentUser == null)
                {
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });
                }

                var result = await _moderationService.ApproveAppealAsync(appealId, currentUser.Id);
                if (!result)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy khiếu nại" });
                }

                _logger.LogInformation("Moderator {UserId} approved appeal {AppealId}", currentUser.Id, appealId);

                return Ok(new { success = true, message = "Đã chấp nhận khiếu nại" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error approving appeal {AppealId}", appealId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi duyệt khiếu nại" });
            }
        }

        [HttpPost("appeals/{appealId:int}/reject")]
        public async Task<IActionResult> RejectAppeal(int appealId)
        {
            try
            {
                var currentUser = _authService.GetCurrentUser();
                if (currentUser == null)
                {
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });
                }

                var result = await _moderationService.RejectAppealAsync(appealId, currentUser.Id);
                if (!result)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy khiếu nại" });
                }

                _logger.LogInformation("Moderator {UserId} rejected appeal {AppealId}", currentUser.Id, appealId);

                return Ok(new { success = true, message = "Đã từ chối khiếu nại" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error rejecting appeal {AppealId}", appealId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi từ chối khiếu nại" });
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
        [HttpPost("report/{violationReportId:int}/approve")]
        public async Task<IActionResult> ApproveReport(int violationReportId)
        {
            try
            {
                var currentUser = _authService.GetCurrentUser();
                if (currentUser == null)
                {
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });
                }

                var result = await _moderationService.ApproveReportAsync(violationReportId, currentUser.Id);
                if (!result)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy tố cáo" });
                }

                _logger.LogInformation("Moderator {UserId} approved appeal {violationReportId}", currentUser.Id, violationReportId);

                return Ok(new { success = true, message = "Đã chấp nhận tố cáo" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error approving report {violationReportId}", violationReportId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi duyệt tố cáo" });
            }
        }

        [HttpPost("report/{violationReportId:int}/reject")]
        public async Task<IActionResult> RejectReport(int violationReportId)
        {
            try
            {
                var currentUser = _authService.GetCurrentUser();
                if (currentUser == null)
                {
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });
                }

                var result = await _moderationService.RejectReportAsync(violationReportId, currentUser.Id);
                if (!result)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy tố cáo" });
                }

                _logger.LogInformation("Moderator {UserId} rejected report {violationReportId}", currentUser.Id, violationReportId);

                return Ok(new { success = true, message = "Đã từ chối tố cáoi" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error rejecting report {violationReportId}", violationReportId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi từ chối tố cáo" });
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
                            TotalViolationScore = 50,
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

        [HttpPost("moderator/mute-user/{userId}")]
        public async Task<IActionResult> MuteUser(Guid userId, [FromBody] MuteUserRequestDto dto)
        {
            try
            {
                var currentUser = _authService.GetCurrentUser();
                if (currentUser == null || currentUser.SchoolId != dto.SchoolId)
                {
                    return Unauthorized(new { success = false, message = "Không có quyền truy cập" });
                }

                var muteUntil = DateTime.UtcNow.AddDays(7);
                var result = await _moderationService.MuteUserAsync(userId, dto.SchoolId, muteUntil);

                if (!result)
                {
                    return BadRequest(new { success = false, message = "Không thể cấm người dùng" });
                }

                _logger.LogInformation("Moderator {ModeratorId} muted user {UserId} until {MuteUntil}",
                    currentUser.Id, userId, muteUntil);

                return Ok(new { success = true, message = "Đã cấm người dùng trong 7 ngày" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error muting user {UserId}", userId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        [HttpPost("moderator/unmute-user/{userId}")]
        public async Task<IActionResult> UnmuteUser(Guid userId, [FromQuery] int schoolId)
        {
            try
            {
                var currentUser = _authService.GetCurrentUser();
                if (currentUser == null || currentUser.SchoolId != schoolId)
                {
                    return Unauthorized(new { success = false, message = "Không có quyền truy cập" });
                }

                var result = await _moderationService.UnmuteUserAsync(userId, schoolId);

                if (!result)
                {
                    return BadRequest(new { success = false, message = "Không thể bỏ cấm người dùng" });
                }

                _logger.LogInformation("Moderator {ModeratorId} unmuted user {UserId}",
                    currentUser.Id, userId);

                return Ok(new { success = true, message = "Đã bỏ cấm người dùng" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error unmuting user {UserId}", userId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        [HttpPost("moderator/reset-violation-score")]
        public async Task<IActionResult> ResetViolationScore([FromBody] ResetUserViolationScoreDto dto)
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

                var result = await _moderationService.ResetViolationScoreAsync(dto.UserId, dto.SchoolId);
                if (!result)
                {
                    return BadRequest(new { success = false, message = "Không thể reset điểm vi phạm" });
                }

                _logger.LogInformation("Moderator {ModeratorId} reset violation score for user {UserId}",
                    currentUser.Id, dto.UserId);

                return Ok(new { success = true, message = "Đã reset điểm vi phạm" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resetting violation score");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

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

        [HttpGet("attachments/pending")]
        public async Task<IActionResult> GetPendingAttachments([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                var currentUser = _authService.GetCurrentUser();
                if (currentUser == null)
                {
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });
                }

                var (attachments, totalCount) = await _configService.GetPendingAttachmentsAsync(pageNumber, pageSize);
                var dtos = attachments.Select(a => a.ToDto()).ToList();

                return PagedResult(dtos, totalCount, pageNumber, pageSize);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting pending attachments");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        [HttpPost("attachments/{attachmentId:int}/approve")]
        public async Task<IActionResult> ApproveAttachment(int attachmentId)
        {
            try
            {
                var currentUser = _authService.GetCurrentUser();
                if (currentUser == null)
                {
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });
                }

                var result = await _configService.ApproveAttachmentAsync(attachmentId, currentUser.Id);
                if (!result)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy attachment" });
                }

                _logger.LogInformation("Moderator {UserId} approved attachment {AttachmentId}",
                    currentUser.Id, attachmentId);

                return Ok(new { success = true, message = "Đã duyệt attachment" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error approving attachment {AttachmentId}", attachmentId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        [HttpPost("attachments/{attachmentId:int}/reject")]
        public async Task<IActionResult> RejectAttachment(int attachmentId)
        {
            try
            {
                var currentUser = _authService.GetCurrentUser();
                if (currentUser == null)
                {
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });
                }

                var result = await _configService.RejectAttachmentAsync(attachmentId);
                if (!result)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy attachment" });
                }

                _logger.LogInformation("Moderator {UserId} rejected attachment {AttachmentId}",
                    currentUser.Id, attachmentId);

                return Ok(new { success = true, message = "Đã từ chối attachment" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error rejecting attachment {AttachmentId}", attachmentId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        [HttpDelete("attachments/{attachmentId:int}")]
        public async Task<IActionResult> DeleteAttachment(int attachmentId)
        {
            try
            {
                var currentUser = _authService.GetCurrentUser();
                if (currentUser == null)
                {
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });
                }

                var attachment = await _configService.GetAttachmentByIdAsync(attachmentId);
                if (attachment == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy attachment" });
                }

                if (attachment.CreatedBy != currentUser.Id)
                {
                    return Forbid();
                }

                var result = await _configService.SoftDeleteAttachmentAsync(attachmentId);
                if (!result)
                {
                    return BadRequest(new { success = false, message = "Không thể xóa attachment" });
                }

                _logger.LogInformation("User {UserId} deleted attachment {AttachmentId}",
                    currentUser.Id, attachmentId);

                return Ok(new { success = true, message = "Đã xóa attachment" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting attachment {AttachmentId}", attachmentId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        [HttpGet("statistics")]
        public async Task<IActionResult> GetForumStatistics([FromQuery] int schoolId)
        {
            try
            {
                var currentUser = _authService.GetCurrentUser();
                if (currentUser == null || currentUser.SchoolId != schoolId)
                {
                    return Unauthorized(new { success = false, message = "Không có quyền truy cập" });
                }

                var (posts, _) = await _postService.GetPublicPostsAsync(schoolId, null, null, null, null, 1, 1);
                var (comments, _) = await _commentService.GetCommentsByPostIdAsync(posts.FirstOrDefault()?.Id ?? 0, 1, 1);

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        TotalPosts = posts.Count,
                        TotalComments = comments.Count,
                        LastUpdated = DateTime.Now
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting forum statistics");
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