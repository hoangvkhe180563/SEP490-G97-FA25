using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Utils;

namespace StudyHub.Backend.UseCases.Dtos
{
    public class LoginResult
    {
        public TokenPair Tokens { get; set; } = new TokenPair();
        public AppUser User { get; set; } = new AppUser();
        public List<string> Roles { get; set; } = new List<string>();
        public List<string> Permissions { get; set; } = new List<string>();
        public List<short> SubjectIds { get; set; } = new List<short>();
        public List<int> ClassIds { get; set; } = new List<int>();
        // Session id created for this login - stored in DB and returned as cookie
        public Guid? SessionId { get; set; }
        // Optional resolved location names to avoid extra lookups on the frontend

        public int? SchoolId { get; set; }
        public string? SchoolName { get; set; }
        public int? CommuneId { get; set; }
        public string? CommuneName { get; set; }
        public int? CityId { get; set; }
        public string? CityName { get; set; }
    }


    // Result returned when creating an access token
    public class AccessTokenResult
    {
        public string Token { get; set; } = string.Empty;
        public DateTime Expires { get; set; }
    }

    // Simple token pair DTO returned from the use-case layer
    public class TokenPair
    {
        public string AccessToken { get; set; } = string.Empty;
        public DateTime AccessTokenExpire { get; set; }
        public string RefreshToken { get; set; } = string.Empty;
        public DateTime RefreshTokenExpire { get; set; }
    }
}
