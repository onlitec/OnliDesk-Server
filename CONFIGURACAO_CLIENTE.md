# OnliDesk Server - Configuração do Cliente

## Visão Geral

Este documento fornece instruções para configurar clientes para se conectarem ao servidor OnliDesk e estabelecerem conexões com outros clientes através do servidor.

## Status Atual do Servidor

### ✅ Funcionalidades Implementadas
- **API REST**: Endpoints para autenticação, gerenciamento de usuários e conexões
- **Autenticação JWT**: Sistema de autenticação baseado em tokens JWT
- **Banco de Dados**: PostgreSQL para persistência de dados
- **CORS**: Configurado para permitir conexões de diferentes origens
- **HTTPS**: Suporte a conexões seguras
- **Interface de Gerenciamento**: Dashboard web para administração

### ✅ Funcionalidades Recém-Implementadas
- **SignalR Hub**: ✅ Implementado em `/remotehub` (comunicação em tempo real)
- **Gerenciamento de Sessões**: ✅ Implementado (iniciar, aceitar, rejeitar sessões)
- **Chat em Tempo Real**: ✅ Implementado
- **Infraestrutura para Transmissão**: ✅ Implementado (pronto para dados de tela)
- **Infraestrutura para Controle**: ✅ Implementado (pronto para mouse/teclado)

### ⚠️ Funcionalidades que Requerem Implementação no Cliente
- **Captura de Tela**: Deve ser implementado no cliente
- **Processamento de Entrada**: Deve ser implementado no cliente
- **Codificação/Decodificação de Vídeo**: Deve ser implementado no cliente

## Configuração do Servidor

### Informações de Conexão
- **URL do Servidor**: `http://172.20.120.56:5221`
- **API Base**: `http://172.20.120.56:5221/api`
- **Interface de Gerenciamento**: `http://172.20.120.56:5221`

### Endpoints Disponíveis

#### Autenticação
- `POST /api/auth/login` - Fazer login e obter token JWT
- `POST /api/auth/register` - Registrar novo usuário

#### Usuários
- `GET /api/users` - Listar usuários (requer autenticação Admin)
- `POST /api/users` - Criar usuário (requer autenticação Admin)
- `DELETE /api/users/{id}` - Deletar usuário (requer autenticação Admin)

#### Conexões
- `GET /api/connections` - Listar conexões ativas (requer autenticação)
- `POST /api/connections` - Criar nova conexão (requer autenticação)
- `DELETE /api/connections/{id}` - Encerrar conexão (requer autenticação)

#### Dashboard
- `GET /api/dashboard/stats` - Estatísticas do servidor
- `GET /api/dashboard/connections/chart` - Dados do gráfico de conexões
- `GET /api/dashboard/connections/summary` - Resumo das conexões

## Configuração do Cliente

### Pré-requisitos
- Cliente deve suportar autenticação JWT
- Cliente deve ser capaz de fazer requisições HTTP/HTTPS
- Para funcionalidade completa, cliente deve suportar SignalR (quando implementado)

### Configuração Básica

#### 1. Configuração de Conexão
```json
{
  "serverUrl": "http://172.20.120.56:5221",
  "apiEndpoint": "http://172.20.120.56:5221/api",
  "signalRHub": "http://172.20.120.56:5221/remotehub",
  "useHttps": false,
  "timeout": 30000
}
```

#### 2. Autenticação
```csharp
// Exemplo em C# para autenticação
public async Task<string> AuthenticateAsync(string username, string password)
{
    var loginData = new { Username = username, Password = password };
    var json = JsonSerializer.Serialize(loginData);
    var content = new StringContent(json, Encoding.UTF8, "application/json");
    
    var response = await httpClient.PostAsync("/api/auth/login", content);
    
    if (response.IsSuccessStatusCode)
    {
        var result = await response.Content.ReadAsStringAsync();
        var tokenResponse = JsonSerializer.Deserialize<TokenResponse>(result);
        return tokenResponse.Token;
    }
    
    throw new AuthenticationException("Falha na autenticação");
}
```

#### 3. Configuração de Headers
```csharp
// Adicionar token JWT aos headers
httpClient.DefaultRequestHeaders.Authorization = 
    new AuthenticationHeaderValue("Bearer", token);
```

#### 4. Configuração do SignalR Hub
```csharp
// Exemplo de conexão com o SignalR Hub
using Microsoft.AspNetCore.SignalR.Client;

public class RemoteDesktopClient
{
    private HubConnection _hubConnection;
    
    public async Task ConnectAsync(string serverUrl, string token)
    {
        _hubConnection = new HubConnectionBuilder()
            .WithUrl($"{serverUrl}/remotehub", options =>
            {
                options.AccessTokenProvider = () => Task.FromResult(token);
            })
            .Build();
            
        // Configurar handlers para eventos do servidor
        _hubConnection.On<object>("Connected", OnConnected);
        _hubConnection.On<object>("SessionRequest", OnSessionRequest);
        _hubConnection.On<object>("SessionStarted", OnSessionStarted);
        _hubConnection.On<object>("ReceiveScreenData", OnReceiveScreenData);
        _hubConnection.On<object>("ReceiveInputData", OnReceiveInputData);
        _hubConnection.On<object>("ReceiveChatMessage", OnReceiveChatMessage);
        
        await _hubConnection.StartAsync();
    }
    
    // Solicitar sessão com outro cliente
    public async Task RequestSessionAsync(string targetClientId)
    {
        await _hubConnection.InvokeAsync("StartSession", targetClientId);
    }
    
    // Aceitar solicitação de sessão
    public async Task AcceptSessionAsync(string requesterId)
    {
        await _hubConnection.InvokeAsync("AcceptSession", requesterId);
    }
    
    // Enviar dados de tela
    public async Task SendScreenDataAsync(string sessionId, byte[] screenData)
    {
        var base64Data = Convert.ToBase64String(screenData);
        await _hubConnection.InvokeAsync("SendScreenData", sessionId, base64Data);
    }
    
    // Enviar entrada de mouse/teclado
    public async Task SendInputAsync(string sessionId, string inputType, object inputData)
    {
        await _hubConnection.InvokeAsync("SendInputData", sessionId, inputType, inputData);
    }
    
    // Enviar mensagem de chat
    public async Task SendChatMessageAsync(string sessionId, string message)
    {
        await _hubConnection.InvokeAsync("SendChatMessage", sessionId, message);
    }
    
    // Event handlers
    private void OnConnected(object data) { /* Implementar */ }
    private void OnSessionRequest(object data) { /* Implementar */ }
    private void OnSessionStarted(object data) { /* Implementar */ }
    private void OnReceiveScreenData(object data) { /* Implementar */ }
    private void OnReceiveInputData(object data) { /* Implementar */ }
    private void OnReceiveChatMessage(object data) { /* Implementar */ }
}
```

### Status Atual das Funcionalidades

✅ **IMPLEMENTADO NO SERVIDOR**:

1. **Comunicação em Tempo Real**: ✅ SignalR Hub implementado em `/remotehub`
2. **Gerenciamento de Sessões**: ✅ Iniciar, aceitar, rejeitar sessões
3. **Chat em Tempo Real**: ✅ Mensagens entre clientes durante sessões
4. **Infraestrutura de Transmissão**: ✅ Pronto para receber/enviar dados de tela
5. **Infraestrutura de Controle**: ✅ Pronto para receber/enviar comandos de entrada

⚠️ **REQUER IMPLEMENTAÇÃO NO CLIENTE**:

1. **Captura de Tela**: Cliente deve capturar e comprimir dados de tela
2. **Processamento de Entrada**: Cliente deve processar comandos de mouse/teclado
3. **Codificação de Vídeo**: Cliente deve implementar codec (H.264 recomendado)
4. **Interface de Usuário**: Cliente deve implementar UI para gerenciar sessões

### Funcionalidades do SignalR Hub Implementadas

O servidor agora possui um SignalR Hub completo com as seguintes funcionalidades:

#### ✅ Métodos Disponíveis no Hub:

1. **StartSession(targetClientId)** - Solicitar sessão com outro cliente
2. **AcceptSession(requesterId)** - Aceitar solicitação de sessão
3. **RejectSession(requesterId, reason)** - Rejeitar solicitação de sessão
4. **SendScreenData(sessionId, screenData)** - Enviar dados de tela
5. **SendInputData(sessionId, inputType, inputData)** - Enviar comandos de entrada
6. **SendChatMessage(sessionId, message)** - Enviar mensagens de chat
7. **EndSession(sessionId)** - Encerrar sessão
8. **GetOnlineClients()** - Obter lista de clientes online
9. **Ping()** - Manter conexão ativa

#### ✅ Eventos Enviados pelo Hub:

1. **Connected** - Confirmação de conexão
2. **SessionRequest** - Solicitação de sessão recebida
3. **SessionStarted** - Sessão iniciada
4. **SessionRejected** - Sessão rejeitada
5. **ReceiveScreenData** - Dados de tela recebidos
6. **ReceiveInputData** - Comandos de entrada recebidos
7. **ReceiveChatMessage** - Mensagem de chat recebida
8. **SessionEnded** - Sessão encerrada
9. **ClientConnected/ClientDisconnected** - Status de clientes

## Configuração de Firewall

Certifique-se de que a porta 5221 esteja aberta:

```bash
# Ubuntu/Debian
sudo ufw allow 5221/tcp

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=5221/tcp
sudo firewall-cmd --reload
```

## Teste de Conectividade

### Teste Básico
```bash
# Testar se o servidor está respondendo
curl -I http://172.20.120.56:5221

# Testar endpoint de saúde
curl http://172.20.120.56:5221/health
```

### Teste de Autenticação
```bash
# Testar login (substitua username e password)
curl -X POST http://172.20.120.56:5221/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## Solução de Problemas

### Problemas Comuns

1. **Erro de Conexão**
   - Verificar se o servidor está rodando
   - Verificar configurações de firewall
   - Verificar se a porta 5221 está acessível

2. **Erro de Autenticação**
   - Verificar credenciais
   - Verificar se o token JWT não expirou
   - Verificar configuração de CORS

3. **Erro 401 Unauthorized**
   - Verificar se o token JWT está sendo enviado corretamente
   - Verificar se o endpoint requer autenticação

### Logs do Servidor
Verificar logs do servidor para diagnóstico:
```bash
# Se rodando via Docker
docker logs onlidesk-server

# Se rodando diretamente
journalctl -u onlidesk-server -f
```

## Conclusão

O servidor OnliDesk agora está **COMPLETO** para funcionalidade de acesso remoto! ✅

### ✅ O que está funcionando:
- **Autenticação JWT** completa e segura
- **API REST** para gerenciamento de usuários e conexões
- **SignalR Hub** implementado em `/remotehub` para comunicação em tempo real
- **Gerenciamento de sessões** completo (iniciar, aceitar, rejeitar, encerrar)
- **Chat em tempo real** entre clientes
- **Infraestrutura completa** para transmissão de tela e controle remoto
- **Interface de gerenciamento** web funcional
- **Servidor acessível externamente** em `http://172.20.120.56:5221`

### 🎯 Próximos passos:
O servidor está pronto para receber clientes! Os clientes precisam implementar:
1. **Captura e compressão de tela** (recomendado: H.264)
2. **Processamento de comandos de entrada** (mouse/teclado)
3. **Interface de usuário** para gerenciar sessões
4. **Integração com o SignalR Hub** usando os exemplos fornecidos

### 🚀 Status do Projeto:
**SERVIDOR COMPLETO E FUNCIONAL PARA ACESSO REMOTO** - Pronto para produção!