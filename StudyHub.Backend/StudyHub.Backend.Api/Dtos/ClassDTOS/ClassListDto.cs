namespace StudyHub.Backend.Api.Dtos.ClassDTOS
{
    public class ClassListDto
    {
        public int Id { get; set; }

        public string Name { get; set; }

        public string SubjectName { get; set; }

        public string InstructorName { get; set; }
        public string Description { get; set; }

        public short? SubjectId { get; set; }
    }
}
