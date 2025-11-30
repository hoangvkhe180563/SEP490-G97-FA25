
namespace StudyHub.Backend.UseCases.Services
{
    public interface ISignalRNotifier
    {
        Task NotifyPostUpdated(int postId, int schoolId);
        Task NotifyPostDeleted(int postId, int schoolId);
        Task NotifyCommentUpdated(int commentId, int postId);
        Task NotifyCommentDeleted(int commentId, int postId);
    }
    public class NoOpSignalRNotifier : ISignalRNotifier
    {
        public Task NotifyPostUpdated(int postId, int schoolId) => Task.CompletedTask;
        public Task NotifyPostDeleted(int postId, int schoolId) => Task.CompletedTask;
        public Task NotifyCommentUpdated(int commentId, int postId) => Task.CompletedTask;
        public Task NotifyCommentDeleted(int commentId, int postId) => Task.CompletedTask;
    }
}