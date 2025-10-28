using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Api.Dtos
{
    public class RoleDto
    {
        public Guid Id { get; set; }
        public string? Name { get; set; }
    }

    public class PolicyDto
    {
        public int ResourceId { get; set; }
        public string ActionType { get; set; } = null!;
        public string? Condition { get; set; }
        public string? Description { get; set; }
        public ResourceDto? Resource { get; set; }
    }

    public class ResourceDto
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public string? ResourceType { get; set; }
    }

    public class PolicyKeyDto
    {
        public int ResourceId { get; set; }
        public string ActionType { get; set; } = null!;
    }

    public class UpdateRolePoliciesRequest
    {
        public List<PolicyDto>? AddPolicies { get; set; }
        public List<PolicyKeyDto>? RemovePolicies { get; set; }
    }
}
