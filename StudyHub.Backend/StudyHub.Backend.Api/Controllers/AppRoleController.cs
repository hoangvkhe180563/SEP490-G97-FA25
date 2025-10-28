using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.UseCases.Services;
using StudyHub.Backend.Api.Dtos;
using StudyHub.Backend.Api.Mappers;
using System;
using System.Linq;
using Microsoft.AspNetCore.Authorization;

namespace StudyHub.Backend.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AppRoleController : ControllerBase
    {
        private readonly AppRoleService _roleService;
        public AppRoleController(AppRoleService roleService)
        {
            _roleService = roleService;
        }

        // GET api/approle?search=admin
        //[Authorize(Roles = "School Manager")]
        [HttpGet]
        public IActionResult GetRoles([FromQuery] string? search)
        {
            var roles = _roleService.GetAllRoles(search);
            if (roles == null)
            {
                return NotFound(new { Success = false, Message = "Không tìm thấy vai trò" });
            }
            var data = roles.Select(r => r.ToDto());
            var response = new
            {
                Success = true,
                Message = "Lấy danh sách vai trò thành công",
                Data = data
            };
            return Ok(response);
        }

        // GET api/approle/{roleId}/policies
        //[Authorize(Roles = "School Manager")]
        [HttpGet("{roleId:guid}/policies")]
        public IActionResult GetPoliciesForRole([FromRoute] Guid roleId)
        {
            var policies = _roleService.GetPoliciesForRole(roleId);
            return Ok(policies.Select(p => p.ToDto()));
        }

        // PUT api/approle/{roleId}/policies
        //[Authorize(Roles = "School Manager")]
        [HttpPut("{roleId:guid}/policies")]
        public IActionResult UpdateRolePolicies([FromRoute] Guid roleId, [FromBody] UpdateRolePoliciesRequest req)
        {
            // map AddPolicies
            var add = req?.AddPolicies?.Select(p => new StudyHub.Backend.Domain.Entities.AppPolicy
            {
                RoleId = roleId,
                ResourceId = p.ResourceId,
                ActionType = p.ActionType,
                Condition = p.Condition,
                Description = p.Description
            }).ToList() ?? new List<StudyHub.Backend.Domain.Entities.AppPolicy>();

            var remove = req?.RemovePolicies?.Select(r => (r.ResourceId, r.ActionType)).ToList() ?? new List<(int, string)>();

            _roleService.UpdateRolePolicies(roleId, add, remove);

            return Ok(new { success = true });
        }
    }
}
