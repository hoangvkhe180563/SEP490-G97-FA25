namespace StudyHub.Backend.Api.Dtos.ClassStatisticDTOS
{
    public class ScoreDistributionDto
    {
        public string Range { get; set; } = string.Empty;
        public int Count { get; set; }
        public double Pct { get; set; } // fraction 0..1
    }
}
