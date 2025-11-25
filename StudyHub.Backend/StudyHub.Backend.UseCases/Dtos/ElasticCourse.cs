namespace StudyHub.Backend.UseCases.Dtos
{
    public class ElasticCourse
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Information { get; set; }
        public string Status { get; set; }
        public int? SchoolId { get; set; }
        public string SubjectName { get; set; }
        public string Difficulty { get; set; }
        public string Length { get; set; }
        public int Grade { get; set; }
        public float[] CourseVector { get; set; }
        public string SearchableText { get; set; }
    }
}
