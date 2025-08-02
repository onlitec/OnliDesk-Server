using OnliDesk.Server.Core.DTOs;
using OnliDesk.Server.Core.Entities;

namespace OnliDesk.Server.Core.Interfaces;

public interface IConnectionService
{
    Task<Connection> CreateConnectionAsync(string clientId, string connectionId, int userId, string ipAddress, string userAgent);
    Task<Connection?> GetConnectionAsync(int id);
    Task<Connection?> GetConnectionByConnectionIdAsync(string connectionId);
    Task<IEnumerable<ConnectionDto>> GetActiveConnectionsAsync();
    Task<IEnumerable<ConnectionDto>> GetConnectionsByUserAsync(int userId);
    Task<bool> DisconnectAsync(int connectionId);
    Task<bool> DisconnectByConnectionIdAsync(string connectionId);
    Task<ConnectionStatistics> GetStatisticsAsync();
    Task<IEnumerable<string>> GetOnlineClientsAsync();
    Task LogActivityAsync(int connectionId, string activityType, string description, string? metadata = null);
    Task CleanupInactiveConnectionsAsync(TimeSpan timeout);
}