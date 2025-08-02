using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnliDesk.Server.Core.DTOs;
using OnliDesk.Server.Core.Interfaces;
using OnliDesk.Server.Api.DTOs;
using System.ComponentModel.DataAnnotations;

namespace OnliDesk.Server.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ILogger<UsersController> _logger;

    public UsersController(
        IUserService userService,
        ILogger<UsersController> logger)
    {
        _userService = userService;
        _logger = logger;
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetAllUsers()
    {
        try
        {
            var users = await _userService.GetAllAsync();
            return Ok(users);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving all users");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<UserDto>> GetUser(int id)
    {
        try
        {
            var user = await _userService.GetByIdAsync(id);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            return Ok(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user {UserId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpGet("username/{username}")]
    public async Task<ActionResult<UserDto>> GetUserByUsername(string username)
    {
        try
        {
            var user = await _userService.GetByUsernameAsync(username);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            return Ok(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user by username {Username}", username);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<UserDto>> CreateUser([FromBody] CreateUserDto createUserDto)
    {
        try
        {
            if (await _userService.ExistsAsync(createUserDto.Username))
            {
                return Conflict(new { message = "Username already exists" });
            }

            var createRequest = new CreateUserRequest
            {
                Username = createUserDto.Username,
                Email = createUserDto.Email,
                Password = createUserDto.Password,
                Role = createUserDto.Role
            };
            var user = await _userService.CreateAsync(createRequest);
            _logger.LogInformation("User {Username} created successfully", user.Username);

            return CreatedAtAction(nameof(GetUser), new { id = user.Id }, user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user {Username}", createUserDto.Username);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<UserDto>> UpdateUser(int id, [FromBody] UpdateUserDto updateUserDto)
    {
        try
        {
            var existingUser = await _userService.GetByIdAsync(id);
            if (existingUser == null)
            {
                return NotFound(new { message = "User not found" });
            }

            var updateRequest = new UpdateUserRequest
            {
                Email = updateUserDto.Email,
                Role = updateUserDto.Role,
                IsActive = updateUserDto.IsActive
            };
            var user = await _userService.UpdateAsync(id, updateRequest);
            _logger.LogInformation("User {UserId} updated successfully", id);

            return Ok(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user {UserId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> DeleteUser(int id)
    {
        try
        {
            var user = await _userService.GetByIdAsync(id);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            await _userService.DeleteAsync(id);
            _logger.LogInformation("User {UserId} deleted successfully", id);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting user {UserId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPost("{id}/change-password")]
    public async Task<ActionResult> ChangePassword(int id, [FromBody] ChangePasswordDto changePasswordDto)
    {
        try
        {
            var user = await _userService.GetByIdAsync(id);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            // Verify current password
            var authenticatedUser = await _userService.AuthenticateAsync(user.Username, changePasswordDto.CurrentPassword);
            if (authenticatedUser == null)
            {
                return BadRequest(new { message = "Current password is incorrect" });
            }

            // Update password
            var updateDto = new UpdateUserDto
            {
                Username = user.Username,
                Email = user.Email,
                Role = user.Role,
                IsActive = user.IsActive,
                Password = changePasswordDto.NewPassword
            };

            var updateRequest = new UpdateUserRequest
            {
                Email = updateDto.Email,
                Role = updateDto.Role,
                IsActive = updateDto.IsActive
            };
            await _userService.UpdateAsync(id, updateRequest);
            _logger.LogInformation("Password changed for user {UserId}", id);

            return Ok(new { message = "Password changed successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error changing password for user {UserId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpGet("exists/{username}")]
    public async Task<ActionResult<bool>> CheckUserExists(string username)
    {
        try
        {
            var exists = await _userService.ExistsAsync(username);
            return Ok(new { exists });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking if user exists {Username}", username);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }
}