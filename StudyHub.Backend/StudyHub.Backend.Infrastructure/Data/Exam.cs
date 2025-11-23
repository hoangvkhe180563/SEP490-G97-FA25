using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class Exam
{
    public int Id { get; set; }

    public string Title { get; set; } = null!;

    public string? Description { get; set; }

    public int? LessonId { get; set; }

    public int? ClassId { get; set; }

    public DateTime OpenTime { get; set; }

    public DateTime? CloseTime { get; set; }

    public uint Duration { get; set; }

    public Guid CreatedBy { get; set; }

    public bool? ShowAnswers { get; set; }

    public bool ShowCorrectAnswers { get; set; }

    public bool IsMultipleAttempts { get; set; }

    public virtual Class? Class { get; set; }

    public virtual ICollection<ExamQuestion> ExamQuestions { get; set; } = new List<ExamQuestion>();

    public virtual ICollection<ExamResult> ExamResults { get; set; } = new List<ExamResult>();
}
