using OnliDesk.Server.Core.DTOs;
using OnliDesk.Server.Core.Entities;

namespace OnliDesk.Server.Core.Interfaces;

public interface IUserService
{
    Task<User?> AuthenticateAsync(string username, string password);
    Task<User?> GetByIdAsync(int id);
    Task<User?> GetByUsernameAsync(string username);
    Task<IEnumerable<UserDto>> GetAllAsync();
    Task<User> CreateAsync(CreateUserRequest request);
    Task<User?> UpdateAsync(int id, UpdateUserRequest request);
    Task<bool> DeleteAsync(int id);
    Task<bool> ExistsAsync(string username);
    Task UpdateLastLoginAsync(int userId);
}