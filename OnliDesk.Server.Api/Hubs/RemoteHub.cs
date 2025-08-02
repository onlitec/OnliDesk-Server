using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using OnliDesk.Server.Core.Interfaces;
using System.Security.Claims;

namespace OnliDesk.Server.Api.Hubs;

[Authorize]
public class RemoteHub : Hub
{
    private readonly IConnectionService _connectionService;
    private readonly ILogger<RemoteHub> _logger;

    public RemoteHub(
        IConnectionService connectionService,
        ILogger<RemoteHub> logger)
    {
        _connectionService = connectionService;
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userName = Context.User?.FindFirst(ClaimTypes.Name)?.Value ?? "Anonymous";
        
        _logger.LogInformation("User {UserName} (ID: {UserId}) connected with ConnectionId {ConnectionId}", 
            userName, userId, Context.ConnectionId);

        // Adicionar à lista de clientes online
        await Groups.AddToGroupAsync(Context.ConnectionId, "OnlineClients");
        
        // Notificar outros clientes que um novo cliente está online
        await Clients.Others.SendAsync("ClientConnected", new 
        {
            ConnectionId = Context.ConnectionId,
            UserName = userName,
            UserId = userId,
            ConnectedAt = DateTime.UtcNow
        });

        await Clients.Caller.SendAsync("Connected", new 
        {
            Message = $"Bem-vindo, {userName}!",
            ConnectionId = Context.ConnectionId,
            ServerTime = DateTime.UtcNow
        });

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userName = Context.User?.FindFirst(ClaimTypes.Name)?.Value ?? "Anonymous";
        
        _logger.LogInformation("User {UserName} (ID: {UserId}) disconnected. ConnectionId: {ConnectionId}", 
            userName, userId, Context.ConnectionId);

        // Remover da lista de clientes online
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, "OnlineClients");
        
        // Notificar outros clientes sobre a desconexão
        await Clients.Others.SendAsync("ClientDisconnected", new 
        {
            ConnectionId = Context.ConnectionId,
            UserName = userName,
            UserId = userId,
            DisconnectedAt = DateTime.UtcNow
        });

        if (exception != null)
        {
            _logger.LogError(exception, "Connection {ConnectionId} disconnected with error", Context.ConnectionId);
        }

        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Iniciar uma sessão de acesso remoto com um cliente específico
    /// </summary>
    /// <param name="targetClientId">ID da conexão do cliente alvo</param>
    public async Task StartSession(string targetClientId)
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userName = Context.User?.FindFirst(ClaimTypes.Name)?.Value ?? "Anonymous";
        
        _logger.LogInformation("User {UserName} requesting session with client {TargetClientId}", 
            userName, targetClientId);

        // Enviar solicitação de sessão para o cliente alvo
        await Clients.Client(targetClientId).SendAsync("SessionRequest", new 
        {
            RequesterId = Context.ConnectionId,
            RequesterName = userName,
            RequesterUserId = userId,
            RequestedAt = DateTime.UtcNow
        });

        // Confirmar para o solicitante que a requisição foi enviada
        await Clients.Caller.SendAsync("SessionRequestSent", new 
        {
            TargetClientId = targetClientId,
            Status = "Pending",
            SentAt = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Aceitar uma solicitação de sessão
    /// </summary>
    /// <param name="requesterId">ID da conexão do solicitante</param>
    public async Task AcceptSession(string requesterId)
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userName = Context.User?.FindFirst(ClaimTypes.Name)?.Value ?? "Anonymous";
        
        _logger.LogInformation("User {UserName} accepted session from {RequesterId}", 
            userName, requesterId);

        // Criar grupo para a sessão
        var sessionId = $"session_{requesterId}_{Context.ConnectionId}";
        await Groups.AddToGroupAsync(Context.ConnectionId, sessionId);
        await Groups.AddToGroupAsync(requesterId, sessionId);

        // Notificar ambos os clientes sobre o início da sessão
        await Clients.Group(sessionId).SendAsync("SessionStarted", new 
        {
            SessionId = sessionId,
            Participants = new[] { requesterId, Context.ConnectionId },
            StartedAt = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Rejeitar uma solicitação de sessão
    /// </summary>
    /// <param name="requesterId">ID da conexão do solicitante</param>
    /// <param name="reason">Motivo da rejeição</param>
    public async Task RejectSession(string requesterId, string reason = "Rejected by user")
    {
        var userName = Context.User?.FindFirst(ClaimTypes.Name)?.Value ?? "Anonymous";
        
        _logger.LogInformation("User {UserName} rejected session from {RequesterId}. Reason: {Reason}", 
            userName, requesterId, reason);

        await Clients.Client(requesterId).SendAsync("SessionRejected", new 
        {
            RejectedBy = Context.ConnectionId,
            RejectedByName = userName,
            Reason = reason,
            RejectedAt = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Enviar dados de tela para outros participantes da sessão
    /// </summary>
    /// <param name="sessionId">ID da sessão</param>
    /// <param name="screenData">Dados da tela (base64 ou bytes)</param>
    public async Task SendScreenData(string sessionId, string screenData)
    {
        await Clients.OthersInGroup(sessionId).SendAsync("ReceiveScreenData", new 
        {
            SessionId = sessionId,
            ScreenData = screenData,
            Timestamp = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Enviar dados de entrada (mouse, teclado) para outros participantes da sessão
    /// </summary>
    /// <param name="sessionId">ID da sessão</param>
    /// <param name="inputType">Tipo de entrada (mouse, keyboard)</param>
    /// <param name="inputData">Dados da entrada</param>
    public async Task SendInputData(string sessionId, string inputType, object inputData)
    {
        await Clients.OthersInGroup(sessionId).SendAsync("ReceiveInputData", new 
        {
            SessionId = sessionId,
            InputType = inputType,
            InputData = inputData,
            Timestamp = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Enviar mensagem de chat durante uma sessão
    /// </summary>
    /// <param name="sessionId">ID da sessão</param>
    /// <param name="message">Mensagem</param>
    public async Task SendChatMessage(string sessionId, string message)
    {
        var userName = Context.User?.FindFirst(ClaimTypes.Name)?.Value ?? "Anonymous";
        
        await Clients.Group(sessionId).SendAsync("ReceiveChatMessage", new 
        {
            SessionId = sessionId,
            SenderName = userName,
            SenderId = Context.ConnectionId,
            Message = message,
            Timestamp = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Encerrar uma sessão
    /// </summary>
    /// <param name="sessionId">ID da sessão</param>
    public async Task EndSession(string sessionId)
    {
        var userName = Context.User?.FindFirst(ClaimTypes.Name)?.Value ?? "Anonymous";
        
        _logger.LogInformation("User {UserName} ended session {SessionId}", userName, sessionId);

        // Notificar todos os participantes sobre o fim da sessão
        await Clients.Group(sessionId).SendAsync("SessionEnded", new 
        {
            SessionId = sessionId,
            EndedBy = Context.ConnectionId,
            EndedByName = userName,
            EndedAt = DateTime.UtcNow
        });

        // Remover todos os participantes do grupo da sessão
        await Clients.Group(sessionId).SendAsync("LeaveSession", sessionId);
    }

    /// <summary>
    /// Obter lista de clientes online
    /// </summary>
    public async Task GetOnlineClients()
    {
        // Esta é uma implementação simplificada
        // Em produção, você manteria uma lista de clientes online em cache/banco
        await Clients.Caller.SendAsync("OnlineClientsList", new 
        {
            Clients = new[] 
            {
                new 
                {
                    ConnectionId = Context.ConnectionId,
                    UserName = Context.User?.FindFirst(ClaimTypes.Name)?.Value ?? "Anonymous",
                    ConnectedAt = DateTime.UtcNow
                }
            },
            RequestedAt = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Ping para manter a conexão ativa
    /// </summary>
    public async Task Ping()
    {
        await Clients.Caller.SendAsync("Pong", DateTime.UtcNow);
    }
}