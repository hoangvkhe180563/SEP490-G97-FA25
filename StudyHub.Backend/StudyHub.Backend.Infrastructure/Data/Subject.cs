using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class Subject
{
    public short Id { get; set; }

    public string Name { get; set; } = null!;

    public List<AppClaim> AppClaims { get; set; } = new List<AppClaim>();

    public List<Class> Classes { get; set; } = new List<Class>();

    public List<Course> Courses { get; set; } = new List<Course>();

    public List<Document> Documents { get; set; } = new List<Document>();
}
