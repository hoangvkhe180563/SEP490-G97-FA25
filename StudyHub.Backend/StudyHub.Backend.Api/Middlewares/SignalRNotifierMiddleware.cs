using Microsoft.AspNetCore.SignalR;
using StudyHub.Backend.Api.Hubs;
using StudyHub.Backend.Api.Mappers;
using StudyHub.Backend.UseCases.Services;

namespace StudyHub.Backend.Api.Middlewares
{
    public class SignalRNotifierMiddleware : ISignalRNotifier
    {
        private readonly IHubContext<ForumHub> _hubContext;
        private readonly IServiceProvider _serviceProvider;

        public SignalRNotifierMiddleware(
            IHubContext<ForumHub> hubContext,
            IServiceProvider serviceProvider)
        {
            _hubContext = hubContext;
            _serviceProvider = serviceProvider;
        }

        public async Task NotifyPostUpdated(int postId, int schoolId)
        {
            using var scope = _serviceProvider.CreateScope();
            var postService = scope.ServiceProvider.GetRequiredService<ForumPostService>();

            var post = await postService.GetPostByIdAsync(postId);
            if (post == null) return;

            var postDto = post.ToListDto(null, false);

            await _hubContext.Clients.Group($"school-{schoolId}")
                .SendAsync("PostUpdated", postDto);
            await _hubContext.Clients.Group($"post-{postId}")
                .SendAsync("PostUpdated", postDto);
        }

        public async Task NotifyPostDeleted(int postId, int schoolId)
        {
            await _hubContext.Clients.Group($"school-{schoolId}")
                .SendAsync("PostDeleted", postId);
            await _hubContext.Clients.Group($"post-{postId}")
                .SendAsync("PostDeleted", postId);
        }

        public async Task NotifyCommentUpdated(int commentId, int postId)
        {
            using var scope = _serviceProvider.CreateScope();
            var commentService = scope.ServiceProvider.GetRequiredService<ForumCommentService>();

            var comment = await commentService.GetCommentByIdAsync(commentId);
            if (comment == null) return;

            var commentDto = comment.ToListDto(null, false);

            await _hubContext.Clients.Group($"post-{postId}")
                .SendAsync("CommentUpdated", commentDto);
        }

        public async Task NotifyCommentDeleted(int commentId, int postId)
        {
            await _hubContext.Clients.Group($"post-{postId}")
                .SendAsync("CommentDeleted", commentId);
        }
    }
}