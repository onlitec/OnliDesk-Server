using Microsoft.AspNetCore.Mvc;
using OnliDesk.Server.Core.DTOs;
using OnliDesk.Server.Core.Interfaces;
using System.Security.Claims;
using System.ComponentModel.DataAnnotations;

namespace OnliDesk.Server.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly IJwtService _jwtService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        IUserService userService,
        IJwtService jwtService,
        ILogger<AuthController> logger)
    {
        _userService = userService;
        _jwtService = jwtService;
        _logger = logger;
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto loginDto)
    {
        try
        {
            var user = await _userService.AuthenticateAsync(loginDto.Username, loginDto.Password);
            if (user == null)
            {
                return Unauthorized(new { message = "Invalid username or password" });
            }

            var token = _jwtService.GenerateToken(user);
            var refreshToken = _jwtService.GenerateRefreshToken();

            await _userService.UpdateLastLoginAsync(user.Id);

            _logger.LogInformation("User {Username} logged in successfully", user.Username);

            return Ok(new AuthResponseDto
            {
                Token = token,
                RefreshToken = refreshToken,
                User = new UserDto
                {
                    Id = user.Id,
                    Username = user.Username,
                    Email = user.Email,
                    Role = user.Role,
                    IsActive = user.IsActive,
                    CreatedAt = user.CreatedAt,
                    LastLoginAt = user.LastLoginAt
                },
                ExpiresAt = DateTime.UtcNow.AddHours(1)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login for user {Username}", loginDto.Username);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponseDto>> RefreshToken([FromBody] RefreshTokenDto refreshTokenDto)
    {
        try
        {
            var principal = _jwtService.ValidateToken(refreshTokenDto.RefreshToken);
            if (principal == null)
            {
                return Unauthorized(new { message = "Invalid refresh token" });
            }

            var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Invalid token claims" });
            }

            var user = await _userService.GetByIdAsync(userId);
            if (user == null)
            {
                return Unauthorized(new { message = "User not found" });
            }

            var newToken = _jwtService.GenerateToken(user);
            var newRefreshToken = _jwtService.GenerateRefreshToken();

            // Revoke old refresh token
            var tokenId = _jwtService.GetTokenIdFromToken(newToken);
            if (tokenId != null)
            {
                await _jwtService.RevokeTokenAsync(tokenId, user.Id);
            }

            return Ok(new AuthResponseDto
            {
                Token = newToken,
                RefreshToken = newRefreshToken,
                User = new UserDto
                {
                    Id = user.Id,
                    Username = user.Username,
                    Email = user.Email,
                    Role = user.Role,
                    IsActive = user.IsActive,
                    CreatedAt = user.CreatedAt,
                    LastLoginAt = user.LastLoginAt
                },
                ExpiresAt = DateTime.UtcNow.AddHours(1)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during token refresh");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPost("logout")]
    public async Task<ActionResult> Logout([FromBody] LogoutDto logoutDto)
    {
        try
        {
            if (!string.IsNullOrEmpty(logoutDto.RefreshToken))
            {
                var tokenId = _jwtService.GetTokenIdFromToken(logoutDto.RefreshToken);
                if (tokenId != null)
                {
                    var principal = _jwtService.ValidateToken(logoutDto.RefreshToken);
                    if (principal != null)
                    {
                        var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                        if (int.TryParse(userIdClaim, out int userId))
                        {
                            await _jwtService.RevokeTokenAsync(tokenId, userId);
                        }
                    }
                }
            }

            _logger.LogInformation("User logged out successfully");
            return Ok(new { message = "Logged out successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during logout");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPost("validate")]
    public async Task<ActionResult> ValidateToken([FromBody] ValidateTokenDto validateTokenDto)
    {
        try
        {
            var principal = _jwtService.ValidateToken(validateTokenDto.Token);
            var isValid = principal != null;
            return Ok(new { isValid });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during token validation");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }
}

public class LoginDto
{
    [Required]
    public string Username { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}

public class RefreshTokenDto
{
    [Required]
    public string RefreshToken { get; set; } = string.Empty;
}

public class LogoutDto
{
    public string? RefreshToken { get; set; }
}

public class ValidateTokenDto
{
    [Required]
    public string Token { get; set; } = string.Empty;
}