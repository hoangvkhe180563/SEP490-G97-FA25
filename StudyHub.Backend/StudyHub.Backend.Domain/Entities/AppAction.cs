using System.Collections.Generic;

namespace StudyHub.Backend.Domain.Entities
{
    public class AppAction
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public List<AppPermission> AppPermissions { get; set; } = new();
    }
}
