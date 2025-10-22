using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using StudyHub.Backend.Api.Dtos.AuthDTOS;
using StudyHub.Backend.Api.Filters;
using StudyHub.Backend.UseCases.Services;

namespace StudyHub.Backend.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;
        private readonly IConfiguration _configuration;
        private readonly StudyHub.Backend.Api.Services.IEmailService _emailService;

        public AuthController(AuthService authService, IConfiguration configuration, StudyHub.Backend.Api.Services.IEmailService emailService)
        {
            _authService = authService;
            _configuration = configuration;
            _emailService = emailService;
        }

        [HttpPost("signup")]
        [SkipAutoModelValidation]
        public IActionResult Signup([FromBody] SignupRequest req)
        {
            if (!ModelState.IsValid)
            {
                // return per-field errors
                var errors = ModelState.ToDictionary(
                    kvp => kvp.Key,
                    kvp => (kvp.Value?.Errors ?? new Microsoft.AspNetCore.Mvc.ModelBinding.ModelErrorCollection()).Select(e => e.ErrorMessage).ToArray()
                );
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors });
            }

            var user = _authService.Signup(req.Email, req.Password, req.Username, req.PhoneNumber, req.CommuneId, req.SchoolId, req.Fullname);
            if (user == null)
            {
                return BadRequest(new SignupResponse { Success = false, Message = "Người dùng đã tồn tại" });
            }
            return Ok(new SignupResponse { Success = true, Message = "Đăng kí thành công. Đã gửi email xác nhận vui lòng kiểm tra hòm thư hoặc mục spam.", Data = user });
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest req)
        {
            var (result, error) = _authService.Login(string.IsNullOrEmpty(req.Email) ? req.Username : req.Email, req.Password);
            if (result == null)
            {
                if (error == "unverified")
                    return StatusCode(StatusCodes.Status403Forbidden, new LoginResponse { Success = false, Message = "Email chưa được xác thực" });
                return Unauthorized(new LoginResponse { Success = false, Message = "Thông tin đăng nhập không hợp lệ" });
            }
            SetTokenInCookie(result);

            // Build user info response (do not return tokens in body)
            var userInfo = new UserInfoResponse
            {
                Id = result.User.Id,
                Email = result.User.Email,
                Username = result.User.Username,
                Roles = result.Roles ?? new List<string>(),
                Permissions = result.Permissions ?? new List<string>(),
                ClassIds = result.ClassIds ?? new List<int>(),
                SubjectIds = result.SubjectIds ?? new List<short>(),
                SchoolId = result.User.SchoolId
            };

            return Ok(new GenericResponse { Success = true, Message = "Đăng nhập thành công", Data = userInfo });
        }

        [HttpPost("refresh-token")]
        public IActionResult Refresh()
        {
            var refreshToken = Request.Cookies["refresh_token"];

            if (refreshToken == null)
            {
                return Unauthorized(new GenericResponse { Success = false, Message = "Refresh token không tìm thấy" });
            }
            var result = _authService.RefreshTokens(refreshToken);
            if (result == null) return Unauthorized(new GenericResponse { Success = false, Message = "Refresh token không hợp lệ" });
            SetTokenInCookie(result);
            var userInfo = new UserInfoResponse
            {
                Id = result.User.Id,
                Email = result.User.Email,
                Username = result.User.Username,
                Roles = result.Roles ?? new List<string>(),
                Permissions = result.Permissions ?? new List<string>(),
                ClassIds = result.ClassIds ?? new List<int>(),
                SubjectIds = result.SubjectIds ?? new List<short>(),
                SchoolId = result.User.SchoolId
            };
            return Ok(new GenericResponse { Success = true, Message = "Token được refresh thành công!", Data = userInfo });
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest req)
        {
            var token = _authService.ForgotPassword(req.Email);
            if (token == null) return NotFound(new GenericResponse { Success = false, Message = "Không tìm thấy người dùng" });

            // send email with reset token
            await _emailService.SendResetPasswordEmailAsync(req.Email, token);
            return Ok(new GenericResponse { Success = true, Message = "Email đặt lại mật khẩu đã được gửi" });
        }

        [HttpPost("send-verification")]
        public async Task<IActionResult> SendVerification([FromBody] ForgotPasswordRequest req)
        {
            // reuse ForgotPasswordRequest DTO since it only contains an Email property
            var token = _authService.CreateVerificationTokenForEmail(req.Email);
            if (token == null) return NotFound(new GenericResponse { Success = false, Message = "Không tìm thấy người dùng hoặc email đã được xác thực" });

            await _emailService.SendVerificationEmailAsync(req.Email, token);
            return Ok(new GenericResponse { Success = true, Message = "Email xác thực đã được gửi" });
        }

        [HttpPost("reset-password")]
        public IActionResult ResetPassword([FromBody] ResetPasswordRequest req)
        {
            var ok = _authService.ResetPassword(req.ResetToken, req.NewPassword);
            if (!ok) return BadRequest(new GenericResponse { Success = false, Message = "Reset token không hợp lệ hoặc đã quá hạn" });
            return Ok(new GenericResponse { Success = true, Message = "Mật khẩu được đặt lại thành công" });
        }

        [HttpGet("verify-email")]
        public IActionResult VerifyEmail([FromQuery] string? token)
        {
            if (string.IsNullOrEmpty(token)) return BadRequest(new GenericResponse { Success = false, Message = "Token xác thực không tìm thấy" });

            var ok = _authService.VerifyEmail(token!);
            if (!ok) return BadRequest(new GenericResponse { Success = false, Message = "Token không hợp lệ hoặc đã quá hạn" });

            return Ok(new GenericResponse { Success = true, Message = "Xác thực email thành công" });
        }

        private void SetTokenInCookie(UseCases.Dtos.LoginResult result)
        {
            var tokens = result.Tokens;

            var accessCookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Expires = tokens.AccessTokenExpire.ToUniversalTime()
            };

            // Cookie options for refresh token (longer-lived)
            var refreshCookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Expires = tokens.RefreshTokenExpire.ToUniversalTime()
            };

            Response.Cookies.Append("access_token", tokens.AccessToken, accessCookieOptions);
            Response.Cookies.Append("refresh_token", tokens.RefreshToken, refreshCookieOptions);
        }

        [HttpPost("logout")]
        public IActionResult Logout([FromBody] Guid userId)
        {
            // server-side: clear refresh token stored for the user
            _authService.Logout(userId);

            // clear cookies on client
            Response.Cookies.Delete("access_token");
            Response.Cookies.Delete("refresh_token");

            return Ok();
        }

        //[HttpPost("send-test-email")]
        //public async Task<IActionResult> SendTestEmail(string email)
        //{
        //    await _emailService.SendResetPasswordEmailAsync("nghianvhe123@email.com", "123456");

        //    return Ok(new { success = true, message = "Email sent successfully!" });
        //}

        [HttpGet("google/redirect")]
        public IActionResult GoogleRedirect()
        {
            try
            {
                var (url, state) = _authService.BuildGoogleAuthUrl();

                // Prevent CSRF attacks
                HttpContext.Session.SetString("google_oauth_state", state);
                return Ok(new { Success = true, Message = "Gửi link điều hướng Google URL thành công", Url = url });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("google/callback")]
        public IActionResult GoogleCallback([FromQuery] string? code, [FromQuery] string? state, [FromQuery] string? error)
        {
            if (!string.IsNullOrEmpty(error))
            {
                return BadRequest(new { success = false, message = "Lỗi khi xác thực ở Google", error });
            }

            // Check to valid CSRF attacks
            var expectedState = HttpContext.Session.GetString("google_oauth_state");
            HttpContext.Session.Remove("google_oauth_state"); // single use
            if (string.IsNullOrEmpty(state) || expectedState != state)
            {
                return BadRequest(new { success = false, message = "Tham số state không hợp lệ" });
            }


            if (string.IsNullOrEmpty(code))
                return BadRequest(new { success = false, message = "Thiếu tham số authorization code" });

            var loginResult = _authService.HandleGoogleCallback(code!);
            if (loginResult == null) return Unauthorized(new { success = false, message = "Đăng nhập với Google thất bại", error });

            SetTokenInCookie(loginResult);
            var userInfo = new UserInfoResponse
            {
                Id = loginResult.User.Id,
                Email = loginResult.User.Email,
                Username = loginResult.User.Username,
                Roles = loginResult.Roles ?? new List<string>(),
                Permissions = loginResult.Permissions ?? new List<string>(),
                ClassIds = loginResult.ClassIds ?? new List<int>(),
                SubjectIds = loginResult.SubjectIds ?? new List<short>(),
                SchoolId = loginResult.User.SchoolId
            };
            return Ok(new GenericResponse { Success = true, Message = "Đăng nhập với Google thành công!", Data = userInfo });
        }

        [HttpGet("check-auth")]
        public IActionResult CheckAuth()
        {
            var accessToken = Request.Cookies["access_token"];
            if (string.IsNullOrEmpty(accessToken))
            {
                return Unauthorized(new GenericResponse { Success = false, Message = "Access token không tìm thấy" });
            }

            var userId = _authService.ValidateAccessToken(accessToken);

            if (userId == null) return Unauthorized(new GenericResponse { Success = false, Message = "Token không hợp lệ hoặc đã hết hạn" });

            var info = _authService.GetUserInfoById(userId.Value);
            if (info == null) return Unauthorized(new GenericResponse { Success = false, Message = "Người dùng không tồn tại" });

            var userInfo = new UserInfoResponse
            {
                Id = info.User.Id,
                Email = info.User.Email,
                Username = info.User.Username,
                Roles = info.Roles ?? new List<string>(),
                Permissions = info.Permissions ?? new List<string>(),
                ClassIds = info.ClassIds ?? new List<int>(),
                SubjectIds = info.SubjectIds ?? new List<short>(),
                SchoolId = info.User.SchoolId
            };

            return Ok(new GenericResponse { Success = true, Message = "Người dùng đã xác thực", Data = userInfo });

        }
    }
}
