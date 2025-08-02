using OnliDesk.Server.Core.Entities;
using System.Security.Claims;

namespace OnliDesk.Server.Core.Interfaces;

public interface IJwtService
{
    string GenerateToken(User user);
    string GenerateRefreshToken();
    ClaimsPrincipal? ValidateToken(string token);
    Task<bool> IsTokenRevokedAsync(string tokenId);
    Task RevokeTokenAsync(string tokenId, int userId, string? reason = null);
    Task CleanupExpiredTokensAsync();
    string? GetTokenIdFromToken(string token);
    DateTime GetTokenExpiration(string token);
}