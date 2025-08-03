using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnliDesk.Server.Core.DTOs;
using System.Text.Json;

namespace OnliDesk.Server.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LogsController : ControllerBase
{
    private readonly ILogger<LogsController> _logger;
    private static readonly List<LogEntryDto> _logEntries = new();
    private static readonly object _lockObject = new();

    public LogsController(ILogger<LogsController> logger)
    {
        _logger = logger;
        
        // Initialize with some sample logs if empty
        if (!_logEntries.Any())
        {
            InitializeSampleLogs();
        }
    }

    [HttpGet]
    public ActionResult<IEnumerable<LogEntryDto>> GetLogs(
        [FromQuery] string? level = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? search = null)
    {
        try
        {
            lock (_lockObject)
            {
                var query = _logEntries.AsQueryable();

                // Filter by level
                if (!string.IsNullOrEmpty(level) && level.ToLower() != "all")
                {
                    query = query.Where(log => log.Level.ToLower() == level.ToLower());
                }

                // Filter by search term
                if (!string.IsNullOrEmpty(search))
                {
                    query = query.Where(log => log.Message.Contains(search, StringComparison.OrdinalIgnoreCase));
                }

                // Order by timestamp descending
                query = query.OrderByDescending(log => log.Timestamp);

                var totalCount = query.Count();
                var logs = query.Skip((page - 1) * pageSize).Take(pageSize).ToList();

                var result = new
                {
                    logs = logs,
                    totalCount = totalCount,
                    page = page,
                    pageSize = pageSize,
                    totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                };

                return Ok(result);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving logs");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost("add")]
    public ActionResult AddLog([FromBody] AddLogRequest request)
    {
        try
        {
            var logEntry = new LogEntryDto
            {
                Id = Guid.NewGuid().ToString(),
                Timestamp = DateTime.UtcNow,
                Level = request.Level,
                Message = request.Message,
                Source = request.Source ?? "System"
            };

            lock (_lockObject)
            {
                _logEntries.Add(logEntry);
                
                // Keep only last 1000 logs to prevent memory issues
                if (_logEntries.Count > 1000)
                {
                    var toRemove = _logEntries.Count - 1000;
                    _logEntries.RemoveRange(0, toRemove);
                }
            }

            _logger.LogInformation("Log entry added: {Level} - {Message}", request.Level, request.Message);
            return Ok(logEntry);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding log entry");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpDelete("clear")]
    [Authorize(Roles = "Admin")]
    public ActionResult ClearLogs()
    {
        try
        {
            lock (_lockObject)
            {
                _logEntries.Clear();
            }

            // Add a log entry about clearing
            var clearLogEntry = new LogEntryDto
            {
                Id = Guid.NewGuid().ToString(),
                Timestamp = DateTime.UtcNow,
                Level = "Info",
                Message = "Logs cleared by administrator",
                Source = "System"
            };

            lock (_lockObject)
            {
                _logEntries.Add(clearLogEntry);
            }

            _logger.LogInformation("Logs cleared by administrator");
            return Ok(new { message = "Logs cleared successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing logs");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("export")]
    public ActionResult ExportLogs([FromQuery] string format = "json")
    {
        try
        {
            lock (_lockObject)
            {
                var logs = _logEntries.OrderByDescending(log => log.Timestamp).ToList();

                if (format.ToLower() == "csv")
                {
                    var csv = "Timestamp,Level,Source,Message\n";
                    foreach (var log in logs)
                    {
                        csv += $"{log.Timestamp:yyyy-MM-dd HH:mm:ss},{log.Level},{log.Source},\"{log.Message}\"\n";
                    }
                    
                    var csvBytes = System.Text.Encoding.UTF8.GetBytes(csv);
                    return File(csvBytes, "text/csv", $"server-logs-{DateTime.Now:yyyyMMdd-HHmmss}.csv");
                }
                else
                {
                    var json = JsonSerializer.Serialize(logs, new JsonSerializerOptions { WriteIndented = true });
                    var jsonBytes = System.Text.Encoding.UTF8.GetBytes(json);
                    return File(jsonBytes, "application/json", $"server-logs-{DateTime.Now:yyyyMMdd-HHmmss}.json");
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error exporting logs");
            return StatusCode(500, "Internal server error");
        }
    }

    private void InitializeSampleLogs()
    {
        var sampleLogs = new List<LogEntryDto>
        {
            new() { Id = Guid.NewGuid().ToString(), Timestamp = DateTime.UtcNow.AddMinutes(-60), Level = "Info", Message = "Servidor OnliDesk iniciado com sucesso", Source = "System" },
            new() { Id = Guid.NewGuid().ToString(), Timestamp = DateTime.UtcNow.AddMinutes(-55), Level = "Info", Message = "Banco de dados conectado", Source = "Database" },
            new() { Id = Guid.NewGuid().ToString(), Timestamp = DateTime.UtcNow.AddMinutes(-50), Level = "Info", Message = "SignalR Hub configurado em /remotehub", Source = "SignalR" },
            new() { Id = Guid.NewGuid().ToString(), Timestamp = DateTime.UtcNow.AddMinutes(-45), Level = "Info", Message = "Interface web carregada", Source = "Web" },
            new() { Id = Guid.NewGuid().ToString(), Timestamp = DateTime.UtcNow.AddMinutes(-40), Level = "Warning", Message = "Tentativa de acesso não autorizado de IP: 192.168.1.100", Source = "Security" },
            new() { Id = Guid.NewGuid().ToString(), Timestamp = DateTime.UtcNow.AddMinutes(-35), Level = "Info", Message = "Dashboard acessado pelo administrador", Source = "Web" },
            new() { Id = Guid.NewGuid().ToString(), Timestamp = DateTime.UtcNow.AddMinutes(-30), Level = "Info", Message = "Backup automático iniciado", Source = "Backup" },
            new() { Id = Guid.NewGuid().ToString(), Timestamp = DateTime.UtcNow.AddMinutes(-25), Level = "Info", Message = "Backup automático concluído com sucesso", Source = "Backup" },
            new() { Id = Guid.NewGuid().ToString(), Timestamp = DateTime.UtcNow.AddMinutes(-20), Level = "Error", Message = "Falha na tentativa de conexão remota - timeout", Source = "Connection" },
            new() { Id = Guid.NewGuid().ToString(), Timestamp = DateTime.UtcNow.AddMinutes(-15), Level = "Info", Message = "Cache do sistema limpo automaticamente", Source = "Cache" },
            new() { Id = Guid.NewGuid().ToString(), Timestamp = DateTime.UtcNow.AddMinutes(-10), Level = "Info", Message = "Monitoramento de sistema ativo", Source = "Monitor" },
            new() { Id = Guid.NewGuid().ToString(), Timestamp = DateTime.UtcNow.AddMinutes(-5), Level = "Debug", Message = "Verificação de integridade do sistema executada", Source = "Health" },
            new() { Id = Guid.NewGuid().ToString(), Timestamp = DateTime.UtcNow.AddMinutes(-2), Level = "Info", Message = "API de logs acessada", Source = "API" },
            new() { Id = Guid.NewGuid().ToString(), Timestamp = DateTime.UtcNow.AddMinutes(-1), Level = "Info", Message = "Sistema funcionando normalmente", Source = "System" }
        };

        _logEntries.AddRange(sampleLogs);
    }

    // Static method to add logs from other parts of the application
    public static void AddLogEntry(string level, string message, string source = "System")
    {
        var logEntry = new LogEntryDto
        {
            Id = Guid.NewGuid().ToString(),
            Timestamp = DateTime.UtcNow,
            Level = level,
            Message = message,
            Source = source
        };

        lock (_lockObject)
        {
            _logEntries.Add(logEntry);
            
            // Keep only last 1000 logs
            if (_logEntries.Count > 1000)
            {
                var toRemove = _logEntries.Count - 1000;
                _logEntries.RemoveRange(0, toRemove);
            }
        }
    }
}

public class AddLogRequest
{
    public string Level { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? Source { get; set; }
}

public class LogEntryDto
{
    public string Id { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string Level { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Source { get; set; } = string.Empty;
}