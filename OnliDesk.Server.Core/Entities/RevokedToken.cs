using System.ComponentModel.DataAnnotations;

namespace OnliDesk.Server.Core.Entities;

public class RevokedToken
{
    public int Id { get; set; }
    
    [Required]
    [StringLength(500)]
    public string TokenId { get; set; } = string.Empty;
    
    public int UserId { get; set; }
    
    public DateTime RevokedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime ExpiresAt { get; set; }
    
    [StringLength(100)]
    public string? Reason { get; set; }
    
    // Navigation properties
    public virtual User User { get; set; } = null!;
}