using System.ComponentModel.DataAnnotations;

namespace OnliDesk.Server.Core.Entities;

public class Connection
{
    public int Id { get; set; }
    
    [Required]
    [StringLength(100)]
    public string ClientId { get; set; } = string.Empty;
    
    [Required]
    [StringLength(100)]
    public string ConnectionId { get; set; } = string.Empty;
    
    public int UserId { get; set; }
    
    [StringLength(45)]
    public string IpAddress { get; set; } = string.Empty;
    
    [StringLength(500)]
    public string UserAgent { get; set; } = string.Empty;
    
    public DateTime StartTime { get; set; } = DateTime.UtcNow;
    
    public DateTime? EndTime { get; set; }
    
    [StringLength(20)]
    public string Status { get; set; } = "Active"; // Active, Disconnected, Timeout
    
    public TimeSpan? Duration => EndTime?.Subtract(StartTime);
    
    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual ICollection<SessionActivity> SessionActivities { get; set; } = new List<SessionActivity>();
}