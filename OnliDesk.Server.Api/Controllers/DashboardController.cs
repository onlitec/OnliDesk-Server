using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnliDesk.Server.Core.Interfaces;
using System.Diagnostics;
using System.Runtime.InteropServices;

namespace OnliDesk.Server.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly IConnectionService _connectionService;
        private readonly IUserService _userService;
        private readonly ILogger<DashboardController> _logger;

        public DashboardController(
            IConnectionService connectionService,
            IUserService userService,
            ILogger<DashboardController> logger)
        {
            _connectionService = connectionService;
            _userService = userService;
            _logger = logger;
        }

        [HttpGet("status")]
        public async Task<IActionResult> GetServerStatus()
        {
            try
            {
                var uptime = DateTime.Now - Process.GetCurrentProcess().StartTime;
                var status = new
                {
                    IsOnline = true,
                    Uptime = $"{uptime.Days}d {uptime.Hours}h {uptime.Minutes}m",
                    Version = "1.0.0",
                    Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production"
                };

                return Ok(status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting server status");
                return StatusCode(500, new { error = "Failed to get server status" });
            }
        }

        [HttpGet("metrics")]
        public async Task<IActionResult> GetSystemMetrics()
        {
            try
            {
                var metrics = new
                {
                    Cpu = GetCpuUsage(),
                    Memory = GetMemoryUsage(),
                    Disk = GetDiskUsage()
                };

                return Ok(metrics);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting system metrics");
                return StatusCode(500, new { error = "Failed to get system metrics" });
            }
        }

        [HttpGet("connections/summary")]
        public async Task<IActionResult> GetConnectionsSummary()
        {
            try
            {
                var connections = await _connectionService.GetActiveConnectionsAsync();
                var today = DateTime.Today;
                var todayConnections = connections.Where(c => c.StartTime.Date == today).ToList();

                var summary = new
                {
                    ActiveConnections = connections.Count(c => c.Status == "Active"),
                    TotalToday = todayConnections.Count,
                    AverageSessionDuration = CalculateAverageSessionDuration(connections)
                };

                return Ok(summary);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting connections summary");
                return StatusCode(500, new { error = "Failed to get connections summary" });
            }
        }

        [HttpGet("connections/chart")]
        public async Task<IActionResult> GetConnectionsChart()
        {
            try
            {
                var chartData = GenerateConnectionsChartData();
                return Ok(chartData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting connections chart data");
                return StatusCode(500, new { error = "Failed to get chart data" });
            }
        }

        [HttpPost("server/shutdown")]
        [Authorize]
        public async Task<IActionResult> ShutdownServer()
        {
            try
            {
                _logger.LogWarning("Server shutdown requested by user");
                
                // In a real implementation, you would gracefully shutdown the server
                // For now, we'll just log the request
                return Ok(new { message = "Shutdown request received" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing shutdown request");
                return StatusCode(500, new { error = "Failed to process shutdown request" });
            }
        }

        private int GetCpuUsage()
        {
            // Simulate CPU usage - in a real implementation, you would use performance counters
            return Random.Shared.Next(10, 80);
        }

        private int GetMemoryUsage()
        {
            try
            {
                var process = Process.GetCurrentProcess();
                var totalMemory = GC.GetTotalMemory(false);
                
                // Simulate memory percentage - in a real implementation, you would calculate actual usage
                return Random.Shared.Next(20, 70);
            }
            catch
            {
                return 0;
            }
        }

        private int GetDiskUsage()
        {
            try
            {
                var drives = DriveInfo.GetDrives().Where(d => d.IsReady).ToList();
                if (drives.Any())
                {
                    var mainDrive = drives.First();
                    var usedSpace = mainDrive.TotalSize - mainDrive.AvailableFreeSpace;
                    var usagePercentage = (int)((double)usedSpace / mainDrive.TotalSize * 100);
                    return usagePercentage;
                }
            }
            catch
            {
                // Fallback to simulated data
            }
            
            return Random.Shared.Next(30, 60);
        }

        private string CalculateAverageSessionDuration(IEnumerable<Core.DTOs.ConnectionDto> connections)
        {
            if (!connections.Any())
                return "0min";

            var totalMinutes = connections.Select(c =>
            {
                var endTime = c.EndTime ?? DateTime.Now;
                return (endTime - c.StartTime).TotalMinutes;
            }).Average();

            return $"{(int)totalMinutes}min";
        }

        private object GenerateConnectionsChartData()
        {
            var labels = new List<string>();
            var data = new List<int>();
            var now = DateTime.Now;

            // Generate hourly data for the last 24 hours
            for (int i = 23; i >= 0; i--)
            {
                var hour = now.AddHours(-i);
                labels.Add(hour.ToString("HH:mm"));
                data.Add(Random.Shared.Next(1, 20)); // Simulate connection count
            }

            return new
            {
                Labels = labels,
                Data = data
            };
        }
    }
}