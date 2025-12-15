namespace StudyHub.Backend.Api.Dtos.ClassStatisticDTOS
{
    public class StudentsPerClassDto
    {
        public int ClassId { get; set; }
        public string ClassName { get; set; } = string.Empty;
        public int Students { get; set; }
    }
}
