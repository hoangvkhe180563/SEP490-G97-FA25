namespace StudyHub.Backend.UseCases.Dtos
{
    public class RevenueExportRow
    {
        // Flexible label (date or course name depending on aggregation)
        public string Label { get; set; } = string.Empty;

        public int? CourseId { get; set; }
        public string? CourseName { get; set; }

        public System.Guid? TeacherId { get; set; }
        public string? TeacherName { get; set; }

        public long TotalAmount { get; set; }
        public int TransactionCount { get; set; }
    }
}
