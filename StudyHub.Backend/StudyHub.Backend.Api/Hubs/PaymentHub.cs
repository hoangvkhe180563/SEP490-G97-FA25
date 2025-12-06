using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;
using StudyHub.Backend.UseCases.Services;

namespace StudyHub.Backend.Api.Hubs
{
    public class PaymentHub : Hub
    {
        private readonly ILogger<PaymentHub> _logger;

        private readonly AuthService _authService;

        public PaymentHub(ILogger<PaymentHub> logger, AuthService authService)
        {
            _logger = logger;
            _authService = authService;
        }

        public override async Task OnConnectedAsync()
        {
            var connId = Context.ConnectionId;
            // determine user id from claims or querystring
            var http = Context.GetHttpContext();
            // support JWT 'sub' claim as well as ClaimTypes.NameIdentifier
            string? userId = Context.User?.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                ?? Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? http?.Request.Query["userId"].ToString();
            var group = $"user_{userId}";
            await Groups.AddToGroupAsync(connId, group);
            _logger.LogInformation("PaymentHub: Added ConnectionId={connId} to Group={group}", connId, group);

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var connId = Context.ConnectionId;
            // determine user id from claims or querystring
            var http = Context.GetHttpContext();
            // support JWT 'sub' claim as well as ClaimTypes.NameIdentifier
            string? userId = Context.User?.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                ?? Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? http?.Request.Query["userId"].ToString();
            var group = $"user_{userId}";
            await Groups.RemoveFromGroupAsync(connId, group);
            _logger.LogInformation("PaymentHub: Removed ConnectionId={connId} from Group={group}", connId, group);

            await base.OnDisconnectedAsync(exception);
        }
    }
}
