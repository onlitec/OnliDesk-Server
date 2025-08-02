using Microsoft.EntityFrameworkCore;
using OnliDesk.Server.Core.DTOs;
using OnliDesk.Server.Core.Entities;
using OnliDesk.Server.Core.Interfaces;

namespace OnliDesk.Server.Infrastructure.Services;

public class ConnectionService : IConnectionService
{
    private readonly IUnitOfWork _unitOfWork;

    public ConnectionService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Connection> CreateConnectionAsync(string clientId, string connectionId, int userId, string ipAddress, string userAgent)
    {
        var connection = new Connection
        {
            ClientId = clientId,
            ConnectionId = connectionId,
            UserId = userId,
            IpAddress = ipAddress,
            UserAgent = userAgent,
            StartTime = DateTime.UtcNow,
            Status = "Connected"
        };

        await _unitOfWork.Repository<Connection>().AddAsync(connection);
        await _unitOfWork.SaveChangesAsync();

        return connection;
    }

    public async Task<Connection?> GetConnectionAsync(int id)
    {
        return await _unitOfWork.Repository<Connection>()
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<Connection?> GetConnectionByConnectionIdAsync(string connectionId)
    {
        return await _unitOfWork.Repository<Connection>()
            .FirstOrDefaultAsync(c => c.ConnectionId == connectionId);
    }

    public async Task<IEnumerable<ConnectionDto>> GetActiveConnectionsAsync()
    {
        var connections = await _unitOfWork.Repository<Connection>()
            .FindAsync(c => c.Status == "Connected");

        return connections.Select(c => new ConnectionDto
        {
            Id = c.Id,
            ClientId = c.ClientId,
            ConnectionId = c.ConnectionId,
            IpAddress = c.IpAddress,
            StartTime = c.StartTime,
            EndTime = c.EndTime,
            Status = c.Status
        });
    }

    public async Task<IEnumerable<ConnectionDto>> GetConnectionsByUserAsync(int userId)
    {
        var connections = await _unitOfWork.Repository<Connection>()
            .FindAsync(c => c.UserId == userId);

        return connections.OrderByDescending(c => c.StartTime).Select(c => new ConnectionDto
        {
            Id = c.Id,
            ClientId = c.ClientId,
            ConnectionId = c.ConnectionId,
            IpAddress = c.IpAddress,
            StartTime = c.StartTime,
            EndTime = c.EndTime,
            Status = c.Status
        });
    }

    public async Task<bool> DisconnectAsync(int connectionId)
    {
        var connection = await _unitOfWork.Repository<Connection>()
            .FirstOrDefaultAsync(c => c.Id == connectionId);

        if (connection == null)
        {
            return false;
        }

        connection.EndTime = DateTime.UtcNow;
        connection.Status = "Disconnected";

        await _unitOfWork.Repository<Connection>().UpdateAsync(connection);
        await _unitOfWork.SaveChangesAsync();

        return true;
    }

    public async Task<bool> DisconnectByConnectionIdAsync(string connectionId)
    {
        var connection = await _unitOfWork.Repository<Connection>()
            .FirstOrDefaultAsync(c => c.ConnectionId == connectionId);

        if (connection == null)
        {
            return false;
        }

        connection.EndTime = DateTime.UtcNow;
        connection.Status = "Disconnected";

        await _unitOfWork.Repository<Connection>().UpdateAsync(connection);
        await _unitOfWork.SaveChangesAsync();

        return true;
    }

    public async Task LogActivityAsync(int connectionId, string activityType, string description, string? metadata = null)
    {
        var activity = new SessionActivity
        {
            ConnectionId = connectionId,
            ActivityType = activityType,
            Description = description,
            Timestamp = DateTime.UtcNow,
            Metadata = metadata
        };

        await _unitOfWork.Repository<SessionActivity>().AddAsync(activity);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<ConnectionStatistics> GetStatisticsAsync()
    {
        var allConnections = await _unitOfWork.Repository<Connection>().GetAllAsync();
        var activeConnections = allConnections.Count(c => c.Status == "Connected");
        var totalConnectionsToday = allConnections.Count(c => c.StartTime.Date == DateTime.UtcNow.Date);
        var totalUsers = allConnections.Select(c => c.UserId).Distinct().Count();
        
        var completedConnections = allConnections.Where(c => c.EndTime.HasValue);
        var averageSessionDuration = completedConnections.Any() 
            ? TimeSpan.FromTicks((long)completedConnections.Average(c => (c.EndTime!.Value - c.StartTime).Ticks))
            : TimeSpan.Zero;

        return new ConnectionStatistics
        {
            ActiveConnections = activeConnections,
            TotalConnectionsToday = totalConnectionsToday,
            TotalUsers = totalUsers,
            AverageSessionDuration = averageSessionDuration,
            LastUpdated = DateTime.UtcNow
        };
    }

    public async Task<IEnumerable<string>> GetOnlineClientsAsync()
    {
        var allConnections = await _unitOfWork.Repository<Connection>().GetAllAsync();
        var activeConnections = allConnections
            .Where(c => c.Status == "Connected")
            .Select(c => c.ClientId)
            .ToList();

        return activeConnections;
    }

    public async Task CleanupInactiveConnectionsAsync(TimeSpan inactivityThreshold)
    {
        var cutoffTime = DateTime.UtcNow.Subtract(inactivityThreshold);
        var allConnections = await _unitOfWork.Repository<Connection>().GetAllAsync();
        var inactiveConnections = allConnections
            .Where(c => c.Status == "Connected" && c.StartTime < cutoffTime)
            .ToList();

        foreach (var connection in inactiveConnections)
        {
            connection.EndTime = DateTime.UtcNow;
            connection.Status = "Timeout";
            await _unitOfWork.Repository<Connection>().UpdateAsync(connection);
        }

        if (inactiveConnections.Any())
        {
            await _unitOfWork.SaveChangesAsync();
        }
    }
}