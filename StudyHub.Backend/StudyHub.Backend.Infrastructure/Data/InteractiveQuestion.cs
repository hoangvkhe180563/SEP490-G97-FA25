using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class InteractiveQuestion
{
    public int Id { get; set; }

    public int LessonId { get; set; }

    /// <summary>
    /// Thời điểm tính bằng giây trong video
    /// </summary>
    public int TimeSec { get; set; }

    public string QuestionText { get; set; } = null!;

    /// <summary>
    /// mc = multiple choice, text = trả lời tự do
    /// </summary>
    public string Type { get; set; } = null!;

    /// <summary>
    /// Danh sách lựa chọn (JSON array) nếu là MC
    /// </summary>
    public string? Options { get; set; }

    /// <summary>
    /// Chỉ số đáp án đúng (0-based) nếu là MC
    /// </summary>
    public int? CorrectIndex { get; set; }

    /// <summary>
    /// Đáp án đúng nếu là câu hỏi dạng text
    /// </summary>
    public string? CorrectAnswer { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual ICollection<InteractiveResponse> InteractiveResponses { get; set; } = new List<InteractiveResponse>();

    public virtual Lesson Lesson { get; set; } = null!;
}
