using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using StudyHub.Backend.Api.Mappers;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Services;
namespace StudyHub.Backend.Api.Hubs
{
    public class ForumHub : Hub
    {
        private readonly ForumPostService _postService;
        private readonly ForumCommentService _commentService;
        private readonly ForumModerationService _moderationService;
        private readonly AuthService _authService;
        private readonly AppUserService _userService;

        public ForumHub(
            ForumPostService postService,
            ForumCommentService commentService,
            ForumModerationService moderationService,
            AuthService authService,
            AppUserService userService)
        {
            _postService = postService;
            _commentService = commentService;
            _moderationService = moderationService;
            _authService = authService;
            _userService = userService;
        }

        private Guid? GetCurrentUserId()
        {
            var httpContext = Context.GetHttpContext();
            if (httpContext == null) return null;

            var accessToken = httpContext.Request.Cookies["access_token"];
            if (string.IsNullOrEmpty(accessToken)) return null;

            return _authService.ValidateAccessToken(accessToken);
        }

        private AppUser? GetCurrentUser()
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue) return null;

            return _userService.GetUserById(userId.Value);
        }

        public async Task JoinSchoolForum(int schoolId)
        {
            var currentUser = GetCurrentUser();
            if (currentUser == null || currentUser.SchoolId != schoolId)
                return;

            await Groups.AddToGroupAsync(Context.ConnectionId, $"school-{schoolId}");
        }

        public async Task LeaveSchoolForum(int schoolId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"school-{schoolId}");
        }

        public async Task JoinPost(int postId)
        {
            var currentUser = GetCurrentUser();
            if (currentUser == null) return;

            var post = await _postService.GetPostByIdAsync(postId);
            if (post == null || currentUser.SchoolId != post.SchoolId)
                return;

            await Groups.AddToGroupAsync(Context.ConnectionId, $"post-{postId}");
        }

        public async Task LeavePost(int postId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"post-{postId}");
        }

        public async Task<object> CreatePost(int schoolId, short subjectId, int? flairId, string title, string content)
        {
            try
            {
                var currentUser = GetCurrentUser();
                if (currentUser == null || currentUser.SchoolId != schoolId)
                {
                    return new { success = false, message = "Không có quyền truy cập" };
                }

                var isMuted = await _moderationService.IsUserMutedAsync(currentUser.Id.ToString(), schoolId);
                if (isMuted)
                {
                    return new { success = false, message = "Bạn đang bị cấm đăng bài" };
                }

                var post = new ForumPost
                {
                    SchoolId = schoolId,
                    SubjectId = subjectId,
                    FlairId = flairId,
                    Title = title,
                    Content = content,
                    CreatedBy = currentUser.Id,
                    CreatedAt = DateTime.Now
                };

                var createdPost = await _postService.CreatePostAsync(post, null);

                var postWithDetails = await _postService.GetPostByIdAsync(createdPost.Id);
                var dto = postWithDetails.ToListDto();

                await Clients.Group($"school-{schoolId}").SendAsync("ReceiveNewPost", dto);

                return new { success = true, data = dto };
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("vi phạm"))
            {
                return new { success = false, message = ex.Message };
            }
            catch (Exception ex)
            {
                return new { success = false, message = "Có lỗi xảy ra khi tạo bài viết" };
            }
        }

        public async Task<object> CreateComment(int postId, int? parentCommentId, string content)
        {
            try
            {
                var currentUser = GetCurrentUser();
                if (currentUser == null || !currentUser.SchoolId.HasValue)
                {
                    return new { success = false, message = "Vui lòng đăng nhập" };
                }

                var post = await _postService.GetPostByIdAsync(postId);
                if (post == null)
                {
                    return new { success = false, message = "Không tìm thấy bài viết" };
                }

                if (currentUser.SchoolId != post.SchoolId)
                {
                    return new { success = false, message = "Không có quyền truy cập" };
                }

                var isMuted = await _moderationService.IsUserMutedAsync(currentUser.Id.ToString(), post.SchoolId);
                if (isMuted)
                {
                    return new { success = false, message = "Bạn đang bị cấm bình luận" };
                }

                var comment = new ForumComment
                {
                    PostId = postId,
                    SchoolId = post.SchoolId,
                    ParentCommentId = parentCommentId,
                    Content = content,
                    CreatedBy = currentUser.Id,
                    CreatedAt = DateTime.Now
                };

                var createdComment = await _commentService.CreateCommentAsync(comment, null);

                var commentWithDetails = await _commentService.GetCommentByIdAsync(createdComment.CommentId);
                var dto = commentWithDetails.ToListDto();

                await Clients.Group($"post-{postId}").SendAsync("ReceiveNewComment", dto);

                var updatedPost = await _postService.GetPostByIdAsync(postId);
                var updatedPostDto = updatedPost.ToListDto();

                await Clients.Group($"post-{postId}").SendAsync("PostUpdated", updatedPostDto);
                await Clients.Group($"school-{post.SchoolId}").SendAsync("PostUpdated", updatedPostDto);

                return new { success = true, data = dto };
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("vi phạm"))
            {
                return new { success = false, message = ex.Message };
            }
            catch (Exception ex)
            {
                return new { success = false, message = "Có lỗi xảy ra khi tạo bình luận" };
            }
        }

        public async Task TypingInPost(int postId, bool isTyping)
        {
            var currentUser = GetCurrentUser();
            if (currentUser == null) return;

            await Clients.OthersInGroup($"post-{postId}").SendAsync("UserTyping", new
            {
                PostId = postId,
                UserId = currentUser.Id,
                Username = currentUser.Username,
                IsTyping = isTyping
            });
        }

        public async Task UpdatePost(int postId, int? flairId, string title, string content)
        {
            try
            {
                var currentUser = GetCurrentUser();
                if (currentUser == null) return;

                var post = await _postService.GetPostByIdAsync(postId);
                if (post == null || post.CreatedBy != currentUser.Id)
                    return;

                post.FlairId = flairId;
                post.Title = title;
                post.Content = content;
                post.UpdatedBy = currentUser.Id;

                var updatedPost = await _postService.UpdatePostAsync(post);
                var dto = updatedPost.ToListDto();

                await Clients.Group($"school-{post.SchoolId}").SendAsync("PostUpdated", dto);
                await Clients.Group($"post-{postId}").SendAsync("PostUpdated", dto);
            }
            catch (Exception) { }
        }

        public async Task DeletePost(int postId)
        {
            try
            {
                var currentUser = GetCurrentUser();
                if (currentUser == null) return;

                var post = await _postService.GetPostByIdAsync(postId);
                if (post == null || post.CreatedBy != currentUser.Id)
                    return;

                await _postService.SoftDeletePostAsync(postId, currentUser.Id);

                await Clients.Group($"school-{post.SchoolId}").SendAsync("PostDeleted", postId);
                await Clients.Group($"post-{postId}").SendAsync("PostDeleted", postId);
            }
            catch (Exception) { }
        }

        public async Task DeleteComment(int commentId)
        {
            try
            {
                var currentUser = GetCurrentUser();
                if (currentUser == null) return;

                var comment = await _commentService.GetCommentByIdAsync(commentId);
                if (comment == null || comment.CreatedBy != currentUser.Id)
                    return;

                await _commentService.SoftDeleteCommentAsync(commentId, currentUser.Id);

                await Clients.Group($"post-{comment.PostId}").SendAsync("CommentDeleted", commentId);
            }
            catch (Exception) { }
        }

        public async Task ReactToPost(int postId, string reactionType)
        {
            var currentUser = GetCurrentUser();
            if (currentUser == null) return;

            await Clients.Group($"post-{postId}").SendAsync("PostReaction", new
            {
                PostId = postId,
                UserId = currentUser.Id,
                ReactionType = reactionType
            });
        }

        public async Task NotifyModeration(int schoolId, string contentType, int contentId, string action)
        {
            await Clients.Group($"moderators-{schoolId}").SendAsync("ModerationAction", new
            {
                ContentType = contentType,
                ContentId = contentId,
                Action = action,
                Timestamp = DateTime.Now
            });
        }
    }
}