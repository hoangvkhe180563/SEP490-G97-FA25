using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.UseCases.Services;
using StudyHub.Backend.Api.Mappers;
using StudyHub.Backend.Api.Dtos;
using StudyHub.Backend.Domain.Entities;
using System;
using System.Linq;

namespace StudyHub.Backend.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LessonCommentController : ControllerBase
    {
        private readonly LessonCommentService _commentService;
        private readonly AppUserService _userService;
        private readonly AuthService _authService;

        public LessonCommentController(LessonCommentService commentService, AppUserService userService, AuthService authService)
        {
            _commentService = commentService;
            _userService = userService;
            _authService = authService;
        }

        // Use AuthService.GetCurrentUser() which reads HttpContext.User

        [HttpGet("lesson/{lessonId:int}")]
        public IActionResult GetCommentsForLesson(int lessonId)
        {
            var list = _commentService.GetCommentsByLessonId(lessonId);
            return Ok(list.Select(c => c.ToListDto()));
        }

        [HttpPost("create")]
        public IActionResult Create([FromBody] CreateLessonCommentDto dto)
        {
            if (dto == null) return BadRequest(new { success = false, message = "Invalid payload" });
            Domain.Entities.AppUser currentUser;
            try
            {
                currentUser = _authService.GetCurrentUser();
            }
            catch
            {
                return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });
            }

            var comment = new Domain.Entities.LessonComment
            {
                LessonId = dto.LessonId,
                AppUserId = currentUser.Id,
                Content = dto.Content,
                CreatedAt = DateTime.UtcNow,
                AppUser = new Domain.Entities.AppUser { Id = currentUser.Id, Fullname = currentUser.Fullname, Avatar = currentUser.Avatar }
            };

            var created = _commentService.CreateComment(comment);
            return CreatedAtAction(nameof(GetCommentsForLesson), new { lessonId = dto.LessonId }, created.ToListDto());
        }

        [HttpDelete("{id:int}")]
        public IActionResult Delete(int id)
        {
            Domain.Entities.AppUser currentUser;
            try
            {
                currentUser = _authService.GetCurrentUser();
            }
            catch
            {
                return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });
            }

            var existing = _commentService.GetCommentById(id);
            if (existing == null) return NotFound(new { success = false, message = "Không tìm thấy bình luận" });
            if (existing.AppUserId != currentUser.Id) return Forbid();

            var ok = _commentService.DeleteComment(id, currentUser.Id);
            if (!ok) return NotFound(new { success = false, message = "Xóa thất bại" });
            return NoContent();
        }

        [HttpPut("{id:int}")]
        public IActionResult Edit(int id, [FromBody] UpdateLessonCommentDto dto)
        {
            if (dto == null) return BadRequest(new { success = false, message = "Invalid payload" });

            Domain.Entities.AppUser currentUser;
            try
            {
                currentUser = _authService.GetCurrentUser();
            }
            catch
            {
                return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });
            }

            var existing = _commentService.GetCommentById(id);
            if (existing == null) return NotFound(new { success = false, message = "Không tìm thấy bình luận" });
            if (existing.AppUserId != currentUser.Id) return Forbid();

            existing.Content = dto.Content;
            var updated = _commentService.UpdateComment(existing);
            return Ok(updated.ToListDto());
        }
    }
}
