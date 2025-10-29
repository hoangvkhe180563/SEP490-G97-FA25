using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class Subject
{
    public short Id { get; set; }

    public string Name { get; set; } = null!;

    public virtual ICollection<AppUsersubjectclass> AppUsersubjectclasses { get; set; } = new List<AppUsersubjectclass>();

    public virtual ICollection<Class> Classes { get; set; } = new List<Class>();

    public virtual ICollection<Course> Courses { get; set; } = new List<Course>();

    public virtual ICollection<Document> Documents { get; set; } = new List<Document>();
}
