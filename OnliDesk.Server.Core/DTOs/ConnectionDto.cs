namespace OnliDesk.Server.Core.DTOs;

public class ConnectionDto
{
    public int Id { get; set; }
    public string ClientId { get; set; } = string.Empty;
    public string ConnectionId { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string IpAddress { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public string Status { get; set; } = string.Empty;
    public TimeSpan? Duration { get; set; }
}

public class ConnectionStatistics
{
    public int ActiveConnections { get; set; }
    public int TotalConnectionsToday { get; set; }
    public int TotalUsers { get; set; }
    public TimeSpan AverageSessionDuration { get; set; }
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
}

public class ServerInfo
{
    public string Version { get; set; } = string.Empty;
    public string Environment { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public TimeSpan Uptime { get; set; }
    public string OperatingSystem { get; set; } = string.Empty;
    public int MaxConnections { get; set; }
    public int CurrentConnections { get; set; }
}

public class HealthStatus
{
    public string Status { get; set; } = "Healthy";
    public TimeSpan Uptime { get; set; }
    public Dictionary<string, string> Checks { get; set; } = new();
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}