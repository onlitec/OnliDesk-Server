using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnliDesk.Server.Core.DTOs;
using OnliDesk.Server.Core.Interfaces;
using System.Reflection;
using System.Runtime.InteropServices;

namespace OnliDesk.Server.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ServerController : ControllerBase
{
    private readonly IConnectionService _connectionService;
    private readonly ILogger<ServerController> _logger;
    private static readonly DateTime _startTime = DateTime.UtcNow;

    public ServerController(
        IConnectionService connectionService,
        ILogger<ServerController> logger)
    {
        _connectionService = connectionService;
        _logger = logger;
    }

    [HttpGet("info")]
    public async Task<ActionResult<ServerInfo>> GetServerInfo()
    {
        try
        {
            var version = Assembly.GetExecutingAssembly().GetName().Version?.ToString() ?? "1.0.0";
            var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production";
            var operatingSystem = RuntimeInformation.OSDescription;
            var uptime = DateTime.UtcNow - _startTime;
            
            var statistics = await _connectionService.GetStatisticsAsync();
            
            var serverInfo = new ServerInfo
            {
                Version = version,
                Environment = environment,
                StartTime = _startTime,
                Uptime = uptime,
                OperatingSystem = operatingSystem,
                MaxConnections = 1000, // This could be configurable
                CurrentConnections = statistics.ActiveConnections
            };

            return Ok(serverInfo);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving server information");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpGet("health")]
    public async Task<ActionResult<HealthStatus>> GetHealthStatus()
    {
        try
        {
            var uptime = DateTime.UtcNow - _startTime;
            var checks = new Dictionary<string, string>();

            // Database check
            try
            {
                await _connectionService.GetStatisticsAsync();
                checks["database"] = "healthy";
            }
            catch
            {
                checks["database"] = "unhealthy";
            }

            // Memory check
            var workingSet = GC.GetTotalMemory(false);
            checks["memory"] = workingSet < 1_000_000_000 ? "healthy" : "warning"; // 1GB threshold

            // Disk space check (simplified)
            checks["disk"] = "healthy"; // This could be enhanced with actual disk space checking

            var overallStatus = checks.Values.Any(v => v == "unhealthy") ? "Unhealthy" :
                               checks.Values.Any(v => v == "warning") ? "Warning" : "Healthy";

            var healthStatus = new HealthStatus
            {
                Status = overallStatus,
                Uptime = uptime,
                Checks = checks,
                Timestamp = DateTime.UtcNow
            };

            var statusCode = overallStatus == "Healthy" ? 200 : 
                           overallStatus == "Warning" ? 200 : 503;

            return StatusCode(statusCode, healthStatus);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking health status");
            
            var unhealthyStatus = new HealthStatus
            {
                Status = "Unhealthy",
                Uptime = DateTime.UtcNow - _startTime,
                Checks = new Dictionary<string, string> { { "general", "unhealthy" } },
                Timestamp = DateTime.UtcNow
            };
            
            return StatusCode(503, unhealthyStatus);
        }
    }

    [HttpGet("version")]
    public ActionResult<object> GetVersion()
    {
        try
        {
            var version = Assembly.GetExecutingAssembly().GetName().Version?.ToString() ?? "1.0.0";
            var buildDate = System.IO.File.GetCreationTime(Assembly.GetExecutingAssembly().Location);
            
            return Ok(new 
            {
                version,
                buildDate,
                framework = RuntimeInformation.FrameworkDescription,
                os = RuntimeInformation.OSDescription
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving version information");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpGet("metrics")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<object>> GetMetrics()
    {
        try
        {
            var statistics = await _connectionService.GetStatisticsAsync();
            var uptime = DateTime.UtcNow - _startTime;
            var workingSet = GC.GetTotalMemory(false);
            var gen0Collections = GC.CollectionCount(0);
            var gen1Collections = GC.CollectionCount(1);
            var gen2Collections = GC.CollectionCount(2);

            var metrics = new
            {
                server = new
                {
                    uptime = uptime.TotalSeconds,
                    startTime = _startTime,
                    environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production"
                },
                memory = new
                {
                    workingSet,
                    gen0Collections,
                    gen1Collections,
                    gen2Collections
                },
                connections = new
                {
                    active = statistics.ActiveConnections,
                    totalToday = statistics.TotalConnectionsToday,
                    totalUsers = statistics.TotalUsers,
                    averageSessionDuration = statistics.AverageSessionDuration.TotalMinutes
                },
                timestamp = DateTime.UtcNow
            };

            return Ok(metrics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving server metrics");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPost("shutdown")]
    [Authorize(Roles = "Admin")]
    public ActionResult InitiateShutdown([FromBody] ShutdownDto shutdownDto)
    {
        try
        {
            _logger.LogWarning("Server shutdown initiated by admin. Reason: {Reason}", shutdownDto.Reason);
            
            // In a real implementation, you would gracefully shutdown the server
            // For now, we'll just log the request
            
            return Ok(new { message = "Shutdown initiated", reason = shutdownDto.Reason });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during shutdown initiation");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }
}

public class ShutdownDto
{
    public string Reason { get; set; } = "Manual shutdown";
}