using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class InteractiveResponse
{
    public int Id { get; set; }

    public int QuestionId { get; set; }

    public int LessonId { get; set; }

    /// <summary>
    /// Người học trả lời (nullable cho khách)
    /// </summary>
    public Guid? AppUserId { get; set; }

    /// <summary>
    /// Câu trả lời nếu dạng text
    /// </summary>
    public string? AnswerText { get; set; }

    /// <summary>
    /// Chỉ số lựa chọn nếu dạng MC
    /// </summary>
    public int? SelectedIndex { get; set; }

    /// <summary>
    /// TRUE = đúng, FALSE = sai, NULL = không xác định
    /// </summary>
    public bool? IsCorrect { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual AppUser? AppUser { get; set; }

    public virtual Lesson Lesson { get; set; } = null!;

    public virtual InteractiveQuestion Question { get; set; } = null!;
}
