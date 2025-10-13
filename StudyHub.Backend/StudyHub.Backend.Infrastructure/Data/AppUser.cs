using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class AppUser
{
    public Guid Id { get; set; }

    public string Email { get; set; } = null!;

    public string? PasswordHash { get; set; }

    public string Username { get; set; } = null!;

    public string? Fullname { get; set; }

    public int? SchoolId { get; set; }

    public bool? Status { get; set; }

    public Guid RoleId { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public bool EmailConfirmed { get; set; }

    public string? RefreshToken { get; set; }

    public DateTime? RefreshTokenExpire { get; set; }

    public bool? IsLoginWithGoogle { get; set; }

    public string? Address { get; set; }

    public int CommuneId { get; set; }

    public virtual ICollection<AppClaim> AppClaims { get; set; } = new List<AppClaim>();

    public virtual ICollection<ClassMember> ClassMembers { get; set; } = new List<ClassMember>();

    public virtual Commune Commune { get; set; } = null!;

    public virtual ICollection<Manager> Managers { get; set; } = new List<Manager>();

    public virtual ICollection<Parent> Parents { get; set; } = new List<Parent>();

    public virtual ICollection<Student> Students { get; set; } = new List<Student>();

    public virtual ICollection<Teacher> Teachers { get; set; } = new List<Teacher>();

    public virtual ICollection<AppRole> Roles { get; set; } = new List<AppRole>();
}
