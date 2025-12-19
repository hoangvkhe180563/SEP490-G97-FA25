namespace StudyHub.Backend.Domain.Entities.ElasticSearch
{
    public class ElasticQuestion
    {
        public string Id { get; set; } = string.Empty;
        public string QuestionText { get; set; } = string.Empty;
        public string CorrectAnswer { get; set; } = string.Empty;
        public int? Grade { get; set; }
        public int? SubjectId { get; set; }
        public float[] QuestionVector { get; set; } = System.Array.Empty<float>();
        public string SearchableText { get; set; } = string.Empty;
        // Quality tag to allow filtering out low-quality / junk questions
        public string SearchableQuality { get; set; } = string.Empty;
    }
}
