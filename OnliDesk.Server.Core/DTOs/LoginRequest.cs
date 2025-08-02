using System.ComponentModel.DataAnnotations;

namespace OnliDesk.Server.Core.DTOs;

public class LoginRequest
{
    [Required]
    [StringLength(50)]
    public string Username { get; set; } = string.Empty;
    
    [Required]
    [StringLength(100)]
    public string Password { get; set; } = string.Empty;
}