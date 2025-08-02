# OnliDesk Server - Documentação Completa

## 📋 Visão Geral do Servidor

O OnliDesk Server é uma solução completa para acesso remoto entre clientes, implementada em .NET 8 com SignalR para comunicação em tempo real. O servidor atua como intermediário para estabelecer conexões peer-to-peer seguras entre clientes.

### 🏗️ Arquitetura do Sistema

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Cliente A     │◄──►│  OnliDesk       │◄──►│   Cliente B     │
│  (Controlador)  │    │   Server        │    │ (Controlado)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ • Captura Tela  │    │ • Autenticação  │    │ • Recebe Tela   │
│ • Envia Input   │    │ • SignalR Hub   │    │ • Processa Input│
│ • Chat          │    │ • Gerenc. Sessão│    │ • Chat          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Funcionalidades Implementadas

### ✅ Servidor (Completo)
- **Autenticação JWT**: Sistema seguro de autenticação
- **SignalR Hub**: Comunicação em tempo real (`/remotehub`)
- **API REST**: Endpoints para gerenciamento completo
- **Gerenciamento de Sessões**: Controle de conexões peer-to-peer
- **Chat em Tempo Real**: Comunicação durante sessões
- **Infraestrutura de Transmissão**: Pronta para dados de tela
- **Controle Remoto**: Infraestrutura para comandos de entrada
- **Interface Web**: Painel de gerenciamento
- **Banco de Dados**: PostgreSQL/SQLite para persistência
- **Configuração CORS**: Suporte a clientes web

### ⚠️ Cliente (Requer Implementação)
- Captura e compressão de tela
- Processamento de comandos de entrada
- Interface de usuário
- Codificação/decodificação de vídeo

## 🌐 Informações de Conexão

### URLs do Servidor
- **Servidor Principal**: `http://172.20.120.56:5221`
- **SignalR Hub**: `http://172.20.120.56:5221/remotehub`
- **API REST**: `http://172.20.120.56:5221/api`
- **Interface Web**: `http://172.20.120.56:5221`

### Configuração de Rede
- **Porta**: 5221
- **Protocolo**: HTTP/HTTPS
- **Firewall**: Configurado e aberto
- **CORS**: Habilitado para todos os origins

## 🔐 Sistema de Autenticação

### Fluxo de Autenticação
1. **Registro/Login**: `POST /api/auth/login`
2. **Recebimento do Token JWT**
3. **Uso do Token**: Header `Authorization: Bearer {token}`
4. **Conexão ao SignalR**: Token enviado na query string

### Exemplo de Autenticação
```http
POST http://172.20.120.56:5221/api/auth/login
Content-Type: application/json

{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

**Resposta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiration": "2024-08-03T00:00:00Z"
}
```

## 📡 API REST - Endpoints Disponíveis

### Autenticação
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Fazer login
- `GET /api/auth/validate` - Validar token

### Gerenciamento de Usuários
- `GET /api/users` - Listar usuários
- `GET /api/users/{id}` - Obter usuário específico
- `PUT /api/users/{id}` - Atualizar usuário
- `DELETE /api/users/{id}` - Deletar usuário

### Conexões e Sessões
- `GET /api/connections` - Listar conexões ativas
- `GET /api/connections/online` - Usuários online
- `POST /api/connections/request` - Solicitar conexão

### Dashboard e Monitoramento
- `GET /api/dashboard/stats` - Estatísticas do sistema
- `GET /api/dashboard/active-sessions` - Sessões ativas

## 🔌 SignalR Hub - Configuração do Cliente

### Conexão Básica (C#)
```csharp
using Microsoft.AspNetCore.SignalR.Client;

public class OnliDeskClient
{
    private HubConnection _connection;
    private string _jwtToken;
    
    public async Task ConnectAsync(string serverUrl, string jwtToken)
    {
        _jwtToken = jwtToken;
        
        _connection = new HubConnectionBuilder()
            .WithUrl($"{serverUrl}/remotehub", options =>
            {
                options.AccessTokenProvider = () => Task.FromResult(_jwtToken);
            })
            .WithAutomaticReconnect()
            .Build();
            
        // Configurar eventos
        ConfigureEvents();
        
        // Conectar
        await _connection.StartAsync();
    }
    
    private void ConfigureEvents()
    {
        // Receber dados de tela
        _connection.On<string, byte[]>("ReceiveScreenData", (sessionId, screenData) =>
        {
            // Processar dados de tela recebidos
            ProcessScreenData(sessionId, screenData);
        });
        
        // Receber comandos de entrada
        _connection.On<string, string>("ReceiveInputData", (sessionId, inputData) =>
        {
            // Processar comandos de mouse/teclado
            ProcessInputData(sessionId, inputData);
        });
        
        // Receber mensagens de chat
        _connection.On<string, string, string>("ReceiveChatMessage", (sessionId, userId, message) =>
        {
            // Exibir mensagem no chat
            DisplayChatMessage(sessionId, userId, message);
        });
        
        // Solicitação de sessão recebida
        _connection.On<string, string>("SessionRequested", (sessionId, requesterId) =>
        {
            // Mostrar diálogo para aceitar/rejeitar
            ShowSessionRequestDialog(sessionId, requesterId);
        });
        
        // Sessão aceita
        _connection.On<string>("SessionAccepted", (sessionId) =>
        {
            // Iniciar transmissão de tela
            StartScreenTransmission(sessionId);
        });
        
        // Sessão rejeitada
        _connection.On<string>("SessionRejected", (sessionId) =>
        {
            // Notificar usuário
            NotifySessionRejected(sessionId);
        });
        
        // Sessão encerrada
        _connection.On<string>("SessionEnded", (sessionId) =>
        {
            // Parar transmissão e limpar recursos
            StopSession(sessionId);
        });
        
        // Lista de clientes online atualizada
        _connection.On<List<string>>("OnlineClientsUpdated", (clients) =>
        {
            // Atualizar interface com clientes disponíveis
            UpdateOnlineClientsList(clients);
        });
    }
}
```

### Métodos do Hub Disponíveis

#### Gerenciamento de Sessões
```csharp
// Iniciar nova sessão
await _connection.InvokeAsync("StartSession", targetUserId);

// Aceitar sessão
await _connection.InvokeAsync("AcceptSession", sessionId);

// Rejeitar sessão
await _connection.InvokeAsync("RejectSession", sessionId);

// Encerrar sessão
await _connection.InvokeAsync("EndSession", sessionId);
```

#### Transmissão de Dados
```csharp
// Enviar dados de tela (como controlado)
await _connection.InvokeAsync("SendScreenData", sessionId, screenDataBytes);

// Enviar comandos de entrada (como controlador)
await _connection.InvokeAsync("SendInputData", sessionId, inputDataJson);

// Enviar mensagem de chat
await _connection.InvokeAsync("SendChatMessage", sessionId, message);
```

## 🖥️ Implementação do Cliente - Requisitos

### 1. Captura de Tela (Cliente Controlado)
```csharp
public class ScreenCapture
{
    public async Task<byte[]> CaptureScreenAsync()
    {
        // Implementar captura de tela
        // Recomendado: usar bibliotecas como ScreenCapture.NET
        // Comprimir com H.264 para eficiência
    }
    
    public async Task StartScreenTransmissionAsync(string sessionId)
    {
        while (_isTransmitting)
        {
            var screenData = await CaptureScreenAsync();
            await _hubConnection.InvokeAsync("SendScreenData", sessionId, screenData);
            await Task.Delay(33); // ~30 FPS
        }
    }
}
```

### 2. Processamento de Entrada (Cliente Controlado)
```csharp
public class InputProcessor
{
    public void ProcessInputData(string inputDataJson)
    {
        var inputData = JsonSerializer.Deserialize<InputData>(inputDataJson);
        
        switch (inputData.Type)
        {
            case "MouseMove":
                // Mover cursor
                break;
            case "MouseClick":
                // Simular clique
                break;
            case "KeyPress":
                // Simular tecla
                break;
        }
    }
}
```

### 3. Interface de Usuário
```csharp
public partial class MainWindow : Window
{
    private OnliDeskClient _client;
    
    private async void ConnectButton_Click(object sender, RoutedEventArgs e)
    {
        try
        {
            // Autenticar
            var token = await AuthenticateAsync();
            
            // Conectar ao hub
            await _client.ConnectAsync("http://172.20.120.56:5221", token);
            
            // Atualizar interface
            UpdateConnectionStatus(true);
        }
        catch (Exception ex)
        {
            MessageBox.Show($"Erro na conexão: {ex.Message}");
        }
    }
}
```

## 🔧 Configuração Automática do Cliente

### Arquivo de Configuração (appsettings.json)
```json
{
  "OnliDeskServer": {
    "ServerUrl": "http://172.20.120.56:5221",
    "HubEndpoint": "/remotehub",
    "ApiEndpoint": "/api",
    "AutoConnect": true,
    "ReconnectAttempts": 5,
    "ReconnectDelay": 3000,
    "ScreenCapture": {
      "FrameRate": 30,
      "Quality": "High",
      "Compression": "H264"
    },
    "Authentication": {
      "SaveCredentials": false,
      "TokenRefreshMinutes": 30
    }
  }
}
```

### Classe de Configuração
```csharp
public class OnliDeskConfig
{
    public string ServerUrl { get; set; } = "http://172.20.120.56:5221";
    public string HubEndpoint { get; set; } = "/remotehub";
    public string ApiEndpoint { get; set; } = "/api";
    public bool AutoConnect { get; set; } = true;
    public int ReconnectAttempts { get; set; } = 5;
    public int ReconnectDelay { get; set; } = 3000;
    
    public static OnliDeskConfig Load()
    {
        var config = new ConfigurationBuilder()
            .AddJsonFile("appsettings.json")
            .Build();
            
        return config.GetSection("OnliDeskServer").Get<OnliDeskConfig>();
    }
}
```

### Inicialização Automática
```csharp
public class AutoConnectService
{
    private readonly OnliDeskConfig _config;
    private readonly OnliDeskClient _client;
    
    public async Task<bool> TryAutoConnectAsync()
    {
        if (!_config.AutoConnect) return false;
        
        try
        {
            // Tentar usar credenciais salvas
            var savedCredentials = LoadSavedCredentials();
            if (savedCredentials != null)
            {
                var token = await AuthenticateAsync(savedCredentials);
                await _client.ConnectAsync(_config.ServerUrl, token);
                return true;
            }
        }
        catch (Exception ex)
        {
            // Log erro e solicitar credenciais manuais
            LogError(ex);
        }
        
        return false;
    }
}
```

## 🛡️ Segurança e Boas Práticas

### Configurações de Segurança
- **JWT Tokens**: Expiração configurável
- **HTTPS**: Recomendado para produção
- **Validação de Entrada**: Todos os dados são validados
- **Rate Limiting**: Proteção contra spam
- **Logs de Auditoria**: Rastreamento de ações

### Recomendações
1. **Use HTTPS em produção**
2. **Configure firewall adequadamente**
3. **Monitore logs regularmente**
4. **Mantenha tokens seguros**
5. **Implemente timeout de sessão**

## 🔍 Solução de Problemas

### Problemas Comuns

#### Erro de Conexão
```bash
# Verificar se servidor está rodando
curl -I http://172.20.120.56:5221

# Verificar porta
netstat -tlnp | grep 5221
```

#### Erro de Autenticação
- Verificar se token JWT é válido
- Confirmar formato do header Authorization
- Verificar expiração do token

#### Problemas de SignalR
- Verificar se WebSockets estão habilitados
- Confirmar configuração de CORS
- Testar conectividade de rede

### Logs e Monitoramento
```bash
# Ver logs do servidor
journalctl -f -u onlidesk-server

# Monitorar conexões
ss -tlnp | grep 5221
```

## 📦 Dependências Necessárias

### Cliente .NET
```xml
<PackageReference Include="Microsoft.AspNetCore.SignalR.Client" Version="8.0.0" />
<PackageReference Include="System.Text.Json" Version="8.0.0" />
<PackageReference Include="Microsoft.Extensions.Configuration" Version="8.0.0" />
<PackageReference Include="Microsoft.Extensions.Configuration.Json" Version="8.0.0" />
```

### Cliente JavaScript/Web
```html
<script src="https://unpkg.com/@microsoft/signalr@latest/dist/browser/signalr.min.js"></script>
```

## 🚀 Próximos Passos

### Para Desenvolvedores de Cliente
1. **Implementar captura de tela** usando bibliotecas apropriadas
2. **Criar interface de usuário** para gerenciar conexões
3. **Implementar processamento de entrada** para controle remoto
4. **Adicionar codificação de vídeo** para otimizar transmissão
5. **Testar conectividade** com o servidor

### Recursos Adicionais
- **Documentação SignalR**: https://docs.microsoft.com/signalr
- **JWT.io**: https://jwt.io para debug de tokens
- **Postman Collection**: Disponível para testes de API

---

**Status**: ✅ Servidor COMPLETO e FUNCIONAL
**Última Atualização**: 02/08/2025
**Versão**: 1.0.0