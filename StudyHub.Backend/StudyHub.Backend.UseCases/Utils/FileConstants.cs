namespace StudyHub.Backend.UseCases.Utils;

public static class FileConstants
{
    public static readonly string[] AllowedDocumentExtensions =
    {
        ".pdf", ".doc", ".docx", ".xls", ".xlsx",
        ".ppt", ".pptx", ".txt", ".jpg", ".jpeg",
        ".png", ".gif", ".zip", ".rar"
    };

    public static readonly string[] AllowedImageExtensions =
    {
        ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg"
    };

    public const long MaxDocumentSize = 1024L * 1024L * 1000L;
    public const long MaxImageSize = 5 * 1024 * 1024;

    public const string DocumentUploadPath = "Documents/Raw";
    public const string ThumbnailUploadPath = "Documents/Thumbnails";
    public const string ClassNotificationUploadPAth = "Class/NotificationFile";
    public const string CourseThumbnailUploadPath = "Courses/Thumbnails";
    public const string CourseResourceUploadPath = "Courses/Raw";
    public const string AvatarUploadPath = "Users/Avatars";
    public const string LandingPageBannerUploadPath = "LandingPage/Banner";
    public const string LandingPageLogoUploadPath = "LandingPage/Logo";
    public const string LandingPageImagesUploadPath = "LandingPage/Introduction";
    public const string ForumPostAttachmentUploadPath = "Forum/Attachments";
}