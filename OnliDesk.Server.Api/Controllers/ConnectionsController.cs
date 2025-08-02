using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnliDesk.Server.Core.DTOs;
using OnliDesk.Server.Core.Interfaces;
using System.ComponentModel.DataAnnotations;

namespace OnliDesk.Server.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ConnectionsController : ControllerBase
{
    private readonly IConnectionService _connectionService;
    private readonly ILogger<ConnectionsController> _logger;

    public ConnectionsController(
        IConnectionService connectionService,
        ILogger<ConnectionsController> logger)
    {
        _connectionService = connectionService;
        _logger = logger;
    }

    [HttpPost]
    public async Task<ActionResult<ConnectionDto>> CreateConnection([FromBody] CreateConnectionDto createConnectionDto)
    {
        try
        {
            var connection = await _connectionService.CreateConnectionAsync(
                createConnectionDto.ConnectionId,
                createConnectionDto.ClientId,
                createConnectionDto.UserId ?? 0,
                createConnectionDto.Username,
                createConnectionDto.IpAddress);

            _logger.LogInformation("Connection created: {ConnectionId} for user {UserId}", 
                connection.ConnectionId, connection.UserId);

            return CreatedAtAction(nameof(GetConnection), new { id = connection.Id }, connection);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating connection for user {Username}", createConnectionDto.Username);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ConnectionDto>> GetConnection(int id)
    {
        try
        {
            var connection = await _connectionService.GetConnectionAsync(id);
            if (connection == null)
            {
                return NotFound(new { message = "Connection not found" });
            }

            return Ok(connection);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving connection {ConnectionId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpGet("by-connection-id/{connectionId}")]
    public async Task<ActionResult<ConnectionDto>> GetConnectionByConnectionId(string connectionId)
    {
        try
        {
            var connection = await _connectionService.GetConnectionByConnectionIdAsync(connectionId);
            if (connection == null)
            {
                return NotFound(new { message = "Connection not found" });
            }

            return Ok(connection);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving connection by connection ID {ConnectionId}", connectionId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpGet("active")]
    public async Task<ActionResult<IEnumerable<ConnectionDto>>> GetActiveConnections()
    {
        try
        {
            var connections = await _connectionService.GetActiveConnectionsAsync();
            return Ok(connections);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving active connections");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpGet("user/{userId}")]
    public async Task<ActionResult<IEnumerable<ConnectionDto>>> GetConnectionsByUser(int userId)
    {
        try
        {
            var connections = await _connectionService.GetConnectionsByUserAsync(userId);
            return Ok(connections);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving connections for user {UserId}", userId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPost("{id}/disconnect")]
    public async Task<ActionResult> DisconnectConnection(int id)
    {
        try
        {
            await _connectionService.DisconnectAsync(id);
            _logger.LogInformation("Connection {ConnectionId} disconnected", id);
            return Ok(new { message = "Connection disconnected successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error disconnecting connection {ConnectionId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPost("disconnect-by-connection-id/{connectionId}")]
    public async Task<ActionResult> DisconnectByConnectionId(string connectionId)
    {
        try
        {
            await _connectionService.DisconnectByConnectionIdAsync(connectionId);
            _logger.LogInformation("Connection {ConnectionId} disconnected", connectionId);
            return Ok(new { message = "Connection disconnected successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error disconnecting connection {ConnectionId}", connectionId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPost("{id}/log-activity")]
    public async Task<ActionResult> LogActivity(int id, [FromBody] LogActivityDto logActivityDto)
    {
        try
        {
            await _connectionService.LogActivityAsync(id, logActivityDto.Activity, "", null);
            return Ok(new { message = "Activity logged successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error logging activity for connection {ConnectionId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpGet("statistics")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ConnectionStatistics>> GetStatistics()
    {
        try
        {
            var statistics = await _connectionService.GetStatisticsAsync();
            return Ok(statistics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving connection statistics");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpGet("online-clients")]
    public async Task<ActionResult<IEnumerable<string>>> GetOnlineClients()
    {
        try
        {
            var clients = await _connectionService.GetOnlineClientsAsync();
            return Ok(clients);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving online clients");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPost("cleanup-inactive")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> CleanupInactiveConnections([FromBody] CleanupDto cleanupDto)
    {
        try
        {
            var inactivityThreshold = TimeSpan.FromMinutes(cleanupDto.InactivityMinutes);
            await _connectionService.CleanupInactiveConnectionsAsync(inactivityThreshold);
            
            _logger.LogInformation("Cleanup completed for connections inactive for more than {Minutes} minutes", 
                cleanupDto.InactivityMinutes);
            
            return Ok(new { message = "Inactive connections cleaned up successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during cleanup of inactive connections");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }
}

public class CreateConnectionDto
{
    [Required]
    public string ConnectionId { get; set; } = string.Empty;

    [Required]
    public string ClientId { get; set; } = string.Empty;

    public int? UserId { get; set; }

    [Required]
    public string Username { get; set; } = string.Empty;

    [Required]
    public string IpAddress { get; set; } = string.Empty;
}

public class LogActivityDto
{
    [Required]
    public string Activity { get; set; } = string.Empty;
}

public class CleanupDto
{
    [Required]
    [Range(1, 1440)] // 1 minute to 24 hours
    public int InactivityMinutes { get; set; } = 30;
}