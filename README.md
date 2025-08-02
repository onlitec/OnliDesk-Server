# OnliDesk Server

Um sistema de gerenciamento de help desk moderno e eficiente desenvolvido em .NET Core.

## 📋 Sobre o Projeto

O OnliDesk Server é uma aplicação backend robusta para gerenciamento de tickets de suporte, desenvolvida com as melhores práticas de arquitetura limpa e padrões modernos de desenvolvimento.

## 🚀 Tecnologias Utilizadas

- **.NET Core 8.0** - Framework principal
- **Entity Framework Core** - ORM para acesso a dados
- **SQLite** - Banco de dados (desenvolvimento)
- **SignalR** - Comunicação em tempo real
- **AutoMapper** - Mapeamento de objetos
- **xUnit** - Framework de testes

## 🏗️ Arquitetura

O projeto segue os princípios da Clean Architecture:

```
├── OnliDesk.Server.Api/          # Camada de apresentação (Controllers, DTOs, Hubs)
├── OnliDesk.Server.Core/         # Camada de domínio (Entities, Interfaces)
├── OnliDesk.Server.Infrastructure/ # Camada de infraestrutura (Repositories, Services)
└── OnliDesk.Server.Tests/        # Testes unitários
```

## 📦 Pré-requisitos

- [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Git](https://git-scm.com/)

## 🔧 Instalação e Configuração

### 1. Clone o repositório

```bash
git clone https://github.com/onlitec/OnliDesk-Server.git
cd OnliDesk-Server
```

### 2. Restaure as dependências

```bash
dotnet restore
```

### 3. Configure o banco de dados

O projeto utiliza SQLite por padrão. As migrações são aplicadas automaticamente na inicialização.

### 4. Execute a aplicação

```bash
cd OnliDesk.Server.Api
dotnet run
```

A API estará disponível em: `http://localhost:5220`

## 🧪 Executando os Testes

```bash
dotnet test
```

## 📚 Documentação da API

Após executar a aplicação, acesse:
- Swagger UI: `http://localhost:5220/swagger`
- Arquivo HTTP de testes: `OnliDesk.Server.Api/OnliDesk.Server.Api.http`

## 🌿 Branches

- **main**: Branch principal (produção)
- **develop**: Branch de desenvolvimento
- **beta**: Branch de testes

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Contato

- **Desenvolvedor**: OnliTec
- **Email**: galvatec@gmail.com
- **GitHub**: [onlitec](https://github.com/onlitec)

---

⭐ Se este projeto foi útil para você, considere dar uma estrela no repositório!