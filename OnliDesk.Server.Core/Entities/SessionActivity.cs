using System.ComponentModel.DataAnnotations;

namespace OnliDesk.Server.Core.Entities;

public class SessionActivity
{
    public int Id { get; set; }
    
    public int ConnectionId { get; set; }
    
    [Required]
    [StringLength(50)]
    public string ActivityType { get; set; } = string.Empty; // ScreenShare, FileTransfer, Chat, Control
    
    [StringLength(1000)]
    public string Description { get; set; } = string.Empty;
    
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    
    [StringLength(500)]
    public string? Metadata { get; set; }
    
    // Navigation properties
    public virtual Connection Connection { get; set; } = null!;
}