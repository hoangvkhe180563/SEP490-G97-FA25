using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Domain.Entities
{
    public class ClassworkSubmission
    {
        public int Id { get; set; }
        public int ClassworkId { get; set; }
        public Guid StudentId { get; set; }
        public DateTime FirstSubmissionTime { get; set; }
        public DateTime LatestSubmissionTime { get; set; }
        public int Status { get; set; }

        public Classwork? Classwork { get; set; }
        public Student? Student { get; set; }
        public List<SubmissionFile> SubmissionFiles { get; set; } = new();
    }
}
