using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.Api.Dtos.PaymentDTOS;
using StudyHub.Backend.Api.Mappers;
using StudyHub.Backend.UseCases.Services;

namespace StudyHub.Backend.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentInfoController : ControllerBase
    {
        private readonly PaymentInfoService _service;
        public PaymentInfoController(PaymentInfoService service)
        {
            _service = service;
        }

        [HttpGet("{schoolId:int}")]
        public IActionResult Get(int schoolId)
        {
            var info = _service.GetPaymentInfo(schoolId);
            if (info == null) return NotFound();
            return Ok(info.ToDto());
        }

        [HttpPut]
        public IActionResult Update([FromBody] PaymentInfoDto dto)
        {
            if (dto == null || dto.SchoolId <= 0) return BadRequest("Invalid payload");
            var dom = dto.ToDomain();
            var ok = _service.UpdatePaymentInfo(dom);
            if (!ok) return BadRequest("Failed to update payment info");
            return Ok("Cập nhật thông tin thanh toán thành công");
        }
    }
}
