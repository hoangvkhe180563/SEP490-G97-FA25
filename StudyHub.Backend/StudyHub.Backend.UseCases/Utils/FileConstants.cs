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
        ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"
    };

    public const long MaxDocumentSize = 50 * 1024 * 1024;
    public const long MaxImageSize = 5 * 1024 * 1024;

    public const string DocumentUploadPath = "uploads/documents";
    public const string ThumbnailUploadPath = "uploads/thumbnails";
}