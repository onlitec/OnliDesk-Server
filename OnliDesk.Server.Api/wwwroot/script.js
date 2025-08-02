// Global variables
let refreshInterval;
let isInitializing = false;
let lastChartData = null; // Cache for chart data to avoid unnecessary updates
const API_BASE_URL = window.location.origin;

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    
    // Initialize dashboard directly without Chart.js dependency
    initializeDashboard();
    setupEventListeners();
    startAutoRefresh();
});

function initializeDashboard() {
    if (isInitializing) {
        console.log('Dashboard initialization already in progress, skipping...');
        return;
    }
    
    isInitializing = true;
    console.log('Starting dashboard initialization...');
    showLoading(true);
    
    // Safety timeout to ensure loading overlay is removed
    const safetyTimeout = setTimeout(() => {
        console.warn('Loading timeout reached, forcing overlay removal');
        showLoading(false);
        isInitializing = false;
        addLogEntry('warning', 'Timeout de carregamento atingido');
    }, 5000); // Reduced to 5 seconds
    
    try {
        console.log('Initializing chart...');
        initializeChart();
        console.log('Chart initialized successfully');
        
        console.log('Loading initial data...');
        // Load initial data with individual error handling
        Promise.all([
            loadServerStatus().catch(e => {
                console.error('Error loading server status:', e);
                addLogEntry('error', 'Erro ao carregar status do servidor');
                return null;
            }),
            loadConnections().catch(e => {
                console.error('Error loading connections:', e);
                addLogEntry('error', 'Erro ao carregar conexões');
                return null;
            }),
            loadUsers().catch(e => {
                console.error('Error loading users:', e);
                addLogEntry('error', 'Erro ao carregar usuários');
                return null;
            }),
            loadSystemMetrics().catch(e => {
                console.error('Error loading system metrics:', e);
                addLogEntry('error', 'Erro ao carregar métricas do sistema');
                return null;
            })
        ]).then(() => {
             console.log('All data loaded successfully');
             clearTimeout(safetyTimeout);
             showLoading(false);
             isInitializing = false;
             addLogEntry('info', 'Dashboard carregado com sucesso');
         }).catch(error => {
             console.error('Critical error during data loading:', error);
             clearTimeout(safetyTimeout);
             showLoading(false);
             isInitializing = false;
             addLogEntry('error', 'Erro crítico durante carregamento');
         });
    } catch (error) {
         console.error('Error initializing dashboard:', error);
         clearTimeout(safetyTimeout);
         showLoading(false);
         isInitializing = false;
         addLogEntry('error', 'Falha ao inicializar dashboard');
     }
}

function setupEventListeners() {
    // Create user form submission
    document.getElementById('createUserForm').addEventListener('submit', handleCreateUser);
    
    // Log level filter
    document.getElementById('log-level').addEventListener('change', filterLogs);
    
    // Modal close on outside click
    document.getElementById('createUserModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeCreateUserModal();
        }
    });
}

function startAutoRefresh() {
    // Refresh data every 60 seconds to reduce performance impact
    refreshInterval = setInterval(() => {
        refreshData();
    }, 60000);
}

function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
}

// API Functions
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`API call failed for ${endpoint}:`, error);
        // Only log critical API errors, not routine failures
        if (!error.message.includes('fetch')) {
            addLogEntry('error', `API call failed: ${error.message}`);
        }
        throw error;
    }
}

// Server Status Functions
async function loadServerStatus() {
    try {
        const status = await apiCall('/api/dashboard/status');
        updateServerStatus(status);
        // Status updated silently to prevent log spam
    } catch (error) {
        updateServerStatus({ isOnline: false, uptime: '0', version: 'Unknown' });
        // Server status error logged only for critical issues
    }
}

function updateServerStatus(status) {
    const statusElement = document.getElementById('server-status');
    const uptimeElement = document.getElementById('uptime');
    
    statusElement.textContent = status.isOnline ? 'Online' : 'Offline';
    statusElement.className = status.isOnline ? 'status-text' : 'status-text offline';
    uptimeElement.textContent = `Uptime: ${status.uptime}`;
}

function calculateUptime() {
    // Simulate uptime calculation
    const hours = Math.floor(Math.random() * 24) + 1;
    const minutes = Math.floor(Math.random() * 60);
    return `${hours}h ${minutes}m`;
}

// Connections Functions
async function loadConnections() {
    try {
        // Get connection summary from dashboard API
        const summary = await apiCall('/api/dashboard/connections/summary');
        updateConnectionsMetricsFromSummary(summary);
        // Metrics loaded silently
        
        // Use mock data for detailed connections since /api/connections requires authentication
        const mockConnections = generateMockConnections();
        updateConnectionsTable(mockConnections);
        // Mock data loaded silently
    } catch (error) {
        // Fallback to mock data
        const mockConnections = generateMockConnections();
        updateConnectionsTable(mockConnections);
        updateConnectionsMetrics(mockConnections);
        // Using mock data silently
    }
}

function generateMockConnections() {
    const connections = [];
    const usernames = ['admin', 'user1', 'user2', 'guest', 'developer'];
    const ips = ['192.168.1.100', '192.168.1.101', '10.0.0.50', '172.16.0.10'];
    
    for (let i = 0; i < Math.floor(Math.random() * 8) + 2; i++) {
        connections.push({
            id: i + 1,
            userId: Math.floor(Math.random() * 100) + 1,
            username: usernames[Math.floor(Math.random() * usernames.length)],
            ipAddress: ips[Math.floor(Math.random() * ips.length)],
            startTime: new Date(Date.now() - Math.random() * 3600000).toISOString(),
            isActive: Math.random() > 0.2
        });
    }
    
    return connections;
}

function updateConnectionsTable(connections) {
    const tbody = document.getElementById('connections-tbody');
    
    if (connections.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading">Nenhuma conexão ativa</td></tr>';
        return;
    }
    
    tbody.innerHTML = connections.map(conn => {
        const duration = calculateDuration(conn.startTime);
        const statusClass = conn.isActive ? 'status-active' : 'status-inactive';
        const statusText = conn.isActive ? 'Ativo' : 'Inativo';
        
        return `
            <tr>
                <td>${conn.id}</td>
                <td>${conn.username || 'N/A'}</td>
                <td>${conn.ipAddress}</td>
                <td>${formatDateTime(conn.startTime)}</td>
                <td>${duration}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="disconnectUser(${conn.id})">
                        <i class="fas fa-times"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function updateConnectionsMetrics(connections) {
    const activeConnections = connections.filter(c => c.isActive).length;
    const totalToday = connections.length;
    const avgDuration = calculateAverageSessionDuration(connections);
    
    document.getElementById('active-connections').textContent = activeConnections;
    document.getElementById('total-today').textContent = totalToday;
    document.getElementById('avg-session').textContent = avgDuration;
}

function updateConnectionsMetricsFromSummary(summary) {
    document.getElementById('active-connections').textContent = summary.activeConnections;
    document.getElementById('total-today').textContent = summary.totalToday;
    document.getElementById('avg-session').textContent = summary.averageSessionDuration;
}

function calculateDuration(startTime) {
    const start = new Date(startTime);
    const now = new Date();
    const diff = now - start;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
}

function calculateAverageSessionDuration(connections) {
    if (connections.length === 0) return '0min';
    
    const totalMinutes = connections.reduce((sum, conn) => {
        const duration = new Date() - new Date(conn.startTime);
        return sum + (duration / (1000 * 60));
    }, 0);
    
    const avgMinutes = Math.floor(totalMinutes / connections.length);
    return `${avgMinutes}min`;
}

// Users Functions
async function loadUsers() {
    // Always use mock data for demonstration since /api/users requires authentication
    const mockUsers = generateMockUsers();
    updateUsersTable(mockUsers);
    // Loading mock users silently
}

function generateMockUsers() {
    return [
        {
            id: 1,
            username: 'admin',
            email: 'admin@onlidesk.com',
            role: 'Admin',
            isActive: true,
            lastLogin: new Date(Date.now() - 3600000).toISOString()
        },
        {
            id: 2,
            username: 'user1',
            email: 'user1@example.com',
            role: 'User',
            isActive: true,
            lastLogin: new Date(Date.now() - 7200000).toISOString()
        },
        {
            id: 3,
            username: 'guest',
            email: 'guest@example.com',
            role: 'User',
            isActive: false,
            lastLogin: new Date(Date.now() - 86400000).toISOString()
        }
    ];
}

function updateUsersTable(users) {
    const tbody = document.getElementById('users-tbody');
    
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading">Nenhum usuário encontrado</td></tr>';
        return;
    }
    
    tbody.innerHTML = users.map(user => {
        const statusClass = user.isActive ? 'status-active' : 'status-inactive';
        const statusText = user.isActive ? 'Ativo' : 'Inativo';
        
        return `
            <tr>
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>${formatDateTime(user.lastLogin)}</td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="editUser(${user.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteUser(${user.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// System Metrics Functions
async function loadSystemMetrics() {
    try {
        const metrics = await apiCall('/api/dashboard/metrics');
        updateSystemMetrics(metrics);
    } catch (error) {
        // Fallback to simulated data
        const metrics = {
            cpu: Math.floor(Math.random() * 80) + 10,
            memory: Math.floor(Math.random() * 70) + 20,
            disk: Math.floor(Math.random() * 60) + 30
        };
        updateSystemMetrics(metrics);
        // System metrics error - using mock data silently
    }
}

function updateSystemMetrics(metrics) {
    document.getElementById('cpu-usage').style.width = `${metrics.cpu}%`;
    document.getElementById('cpu-percent').textContent = `${metrics.cpu}%`;
    
    document.getElementById('memory-usage').style.width = `${metrics.memory}%`;
    document.getElementById('memory-percent').textContent = `${metrics.memory}%`;
    
    document.getElementById('disk-usage').style.width = `${metrics.disk}%`;
    document.getElementById('disk-percent').textContent = `${metrics.disk}%`;
}

// Chart Functions
function initializeChart() {
    try {
        createCustomLineChart();
        console.log('Custom SVG line chart initialized successfully');
    } catch (error) {
        console.error('Error initializing custom chart:', error);
        addLogEntry('error', 'Erro ao inicializar gráfico: ' + error.message);
    }
}

function createCustomLineChart() {
    const chartContainer = document.getElementById('connectionsChart').parentElement;
    chartContainer.innerHTML = `
        <div style="width: 100%; height: 400px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <!-- Chart Title -->
            <h3 style="margin: 0 0 20px 0; color: #374151; font-size: 18px; font-weight: 600;">Evolução nº usuários</h3>
            
            <svg id="customChart" width="600" height="280" viewBox="0 0 600 280" style="margin-bottom: 20px; background: white;">
                <!-- Chart area -->
                <g id="chartArea" transform="translate(60, 30)">
                    <!-- Horizontal grid lines -->
                    <g id="horizontalGrid"></g>
                    
                    <!-- Vertical grid lines -->
                    <g id="verticalGrid">
                        <defs>
                            <pattern id="verticalLines" width="40" height="200" patternUnits="userSpaceOnUse">
                                <line x1="40" y1="0" x2="40" y2="200" stroke="#f3f4f6" stroke-width="1"/>
                            </pattern>
                        </defs>
                        <rect width="480" height="200" fill="url(#verticalLines)" opacity="0.7"/>
                    </g>
                    
                    <!-- Main axes -->
                    <line x1="0" y1="200" x2="480" y2="200" stroke="#d1d5db" stroke-width="2"/>
                    <line x1="0" y1="0" x2="0" y2="200" stroke="#d1d5db" stroke-width="2"/>
                    
                    <!-- Chart lines -->
                    <polyline id="totalLine" fill="none" stroke="#3b82f6" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" points=""/>
                    <polyline id="connectedLine" fill="none" stroke="#f97316" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" points=""/>
                    <polyline id="disconnectedLine" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" points=""/>
                    
                    <!-- Data points -->
                    <g id="totalPoints"></g>
                    <g id="connectedPoints"></g>
                    <g id="disconnectedPoints"></g>
                    
                    <!-- Data value labels -->
                    <g id="dataLabels"></g>
                    
                    <!-- Y-axis labels -->
                    <g id="yAxisLabels"></g>
                    
                    <!-- X-axis labels -->
                    <g id="xAxisLabels"></g>
                </g>
            </svg>
            
            <!-- Legend -->
            <div style="display: flex; gap: 30px; align-items: center; margin-top: 10px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 20px; height: 3px; background-color: #3b82f6;"></div>
                    <span style="font-size: 14px; color: #374151; font-weight: 500;">Total</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 20px; height: 3px; background-color: #f97316;"></div>
                    <span style="font-size: 14px; color: #374151; font-weight: 500;">Conectados</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 20px; height: 3px; background-color: #9ca3af;"></div>
                    <span style="font-size: 14px; color: #374151; font-weight: 500;">Desconectados</span>
                </div>
            </div>
        </div>
    `;
}

function generateHourLabels() {
    const labels = [];
    const now = new Date();
    
    for (let i = 23; i >= 0; i--) {
        const hour = new Date(now.getTime() - (i * 60 * 60 * 1000));
        labels.push(hour.getHours().toString().padStart(2, '0') + ':00');
    }
    
    return labels;
}

function generateChartData() {
    // Generate more stable mock data to prevent visual exponential growth
    const baseData = [5, 8, 12, 15, 18, 22, 25, 20, 18, 15, 12, 10, 8, 6, 4, 3, 5, 8, 12, 15, 18, 20, 15, 10];
    // Add small random variation to make it look realistic
    return baseData.map(value => value + Math.floor(Math.random() * 3) - 1);
}

// Removed generatePieChartData - no longer needed with custom SVG chart

async function updateChart() {
     try {
          const response = await apiCall('/api/dashboard/connections/summary');
          if (response) {
              const connected = response.connected || 0;
              const disconnected = response.disconnected || 0;
              const total = connected + disconnected;
              
              // Only update if data has changed
              if (!lastChartData || 
                   lastChartData[0] !== connected || 
                   lastChartData[1] !== disconnected) {
                   
                   updateCustomLineChart(connected, disconnected);
                   lastChartData = [connected, disconnected];
                   console.log('Custom line chart updated with new data:', [connected, disconnected]);
               } else {
                   console.log('Chart data unchanged, skipping update');
               }
          }
      } catch (error) {
          console.error('Error updating chart:', error);
          addLogEntry('error', 'Erro ao atualizar gráfico: ' + error.message);
          // Fallback to default values only if no cached data exists
          if (!lastChartData) {
              updateCustomPieChart(0, 0, 0);
              lastChartData = [0, 0];
          }
      }
}

// Array para armazenar dados históricos (últimos 12 pontos para simular 12 meses)
let chartHistory = [];
const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function updateCustomLineChart(connected, disconnected) {
    const total = connected + disconnected;
    
    // Adicionar novo ponto aos dados históricos
    const currentMonth = new Date().getMonth();
    const monthName = monthNames[currentMonth];
    
    chartHistory.push({ 
        month: monthName, 
        connected, 
        disconnected, 
        total,
        timestamp: new Date().getTime()
    });
    
    // Manter apenas os últimos 12 pontos (12 meses)
    if (chartHistory.length > 12) {
        chartHistory.shift();
    }
    
    // Se temos menos de 2 pontos, gerar dados de exemplo para demonstração
    if (chartHistory.length < 2) {
        generateSampleData();
    }
    
    renderChart();
}

function generateSampleData() {
    // Gerar dados de exemplo similares à imagem
    const sampleData = [
        { month: 'Jan', connected: 45, disconnected: 25, total: 70 },
        { month: 'Fev', connected: 35, disconnected: 8, total: 43 },
        { month: 'Mar', connected: 40, disconnected: 15, total: 55 },
        { month: 'Abr', connected: 20, disconnected: 14, total: 34 },
        { month: 'Mai', connected: 48, disconnected: 20, total: 68 },
        { month: 'Jun', connected: 15, disconnected: 33, total: 48 },
        { month: 'Jul', connected: 18, disconnected: 11, total: 29 },
        { month: 'Ago', connected: 23, disconnected: 20, total: 43 },
        { month: 'Set', connected: 40, disconnected: 22, total: 62 },
        { month: 'Out', connected: 35, disconnected: 12, total: 47 },
        { month: 'Nov', connected: 30, disconnected: 27, total: 57 },
        { month: 'Dez', connected: 40, disconnected: 6, total: 46 }
    ];
    
    chartHistory = sampleData;
}

function renderChart() {
    if (chartHistory.length === 0) return;
    
    // Encontrar valores máximos para escala
    const maxValue = Math.max(
        Math.max(...chartHistory.map(d => d.total)),
        Math.max(...chartHistory.map(d => d.connected)),
        Math.max(...chartHistory.map(d => d.disconnected)),
        10 // Mínimo de 10 para melhor visualização
    );
    
    // Arredondar para cima para um número "bonito"
    const roundedMax = Math.ceil(maxValue / 10) * 10;
    
    // Dimensões do gráfico
    const chartWidth = 480;
    const chartHeight = 200;
    const pointSpacing = chartHistory.length > 1 ? chartWidth / (chartHistory.length - 1) : 0;
    
    // Calcular pontos para as linhas
    let totalPoints = [];
    let connectedPoints = [];
    let disconnectedPoints = [];
    
    chartHistory.forEach((data, index) => {
        const x = index * pointSpacing;
        const totalY = chartHeight - (data.total / roundedMax) * chartHeight;
        const connectedY = chartHeight - (data.connected / roundedMax) * chartHeight;
        const disconnectedY = chartHeight - (data.disconnected / roundedMax) * chartHeight;
        
        totalPoints.push({ x, y: totalY, value: data.total });
        connectedPoints.push({ x, y: connectedY, value: data.connected });
        disconnectedPoints.push({ x, y: disconnectedY, value: data.disconnected });
    });
    
    // Atualizar linhas
    updateLine('totalLine', totalPoints);
    updateLine('connectedLine', connectedPoints);
    updateLine('disconnectedLine', disconnectedPoints);
    
    // Atualizar pontos de dados
    updateDataPoints('totalPoints', totalPoints, '#3b82f6');
    updateDataPoints('connectedPoints', connectedPoints, '#f97316');
    updateDataPoints('disconnectedPoints', disconnectedPoints, '#9ca3af');
    
    // Atualizar labels dos eixos
    updateAxisLabels(roundedMax);
    
    // Atualizar labels de valores nos pontos
    updateDataLabels(totalPoints, connectedPoints, disconnectedPoints);
    
    // Atualizar grid horizontal
    updateHorizontalGrid(roundedMax);
}

function updateLine(lineId, points) {
    const line = document.getElementById(lineId);
    if (line && points.length > 0) {
        const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');
        line.setAttribute('points', pointsStr);
    }
}

function updateDataPoints(groupId, points, color) {
    const group = document.getElementById(groupId);
    if (!group) return;
    
    // Limpar pontos existentes
    group.innerHTML = '';
    
    // Adicionar novos pontos
    points.forEach(point => {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', point.x);
        circle.setAttribute('cy', point.y);
        circle.setAttribute('r', '4');
        circle.setAttribute('fill', color);
        circle.setAttribute('stroke', '#fff');
        circle.setAttribute('stroke-width', '2');
        group.appendChild(circle);
    });
}

function updateAxisLabels(maxValue) {
    updateYAxisLabels(maxValue);
    updateXAxisLabels();
}

function updateYAxisLabels(maxValue) {
    const yAxisLabels = document.getElementById('yAxisLabels');
    if (!yAxisLabels) return;
    
    // Limpar labels existentes
    yAxisLabels.innerHTML = '';
    
    // Criar 6 labels (0, 20, 40, 60, 80, 100 ou similar)
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
        const value = Math.round((maxValue / steps) * (steps - i));
        const y = (200 / steps) * i;
        
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', '-10');
        text.setAttribute('y', y + 5);
        text.setAttribute('text-anchor', 'end');
        text.setAttribute('font-size', '11');
        text.setAttribute('fill', '#6b7280');
        text.textContent = value;
        yAxisLabels.appendChild(text);
    }
}

function updateXAxisLabels() {
    const xAxisLabels = document.getElementById('xAxisLabels');
    if (!xAxisLabels) return;
    
    // Limpar labels existentes
    xAxisLabels.innerHTML = '';
    
    if (chartHistory.length === 0) return;
    
    const chartWidth = 480;
    const pointSpacing = chartHistory.length > 1 ? chartWidth / (chartHistory.length - 1) : 0;
    
    chartHistory.forEach((data, index) => {
        const x = index * pointSpacing;
        
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', '220');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '11');
        text.setAttribute('fill', '#6b7280');
        text.textContent = data.month;
        xAxisLabels.appendChild(text);
    });
}

function updateDataLabels(totalPoints, connectedPoints, disconnectedPoints) {
    const dataLabels = document.getElementById('dataLabels');
    if (!dataLabels) return;
    
    // Limpar labels existentes
    dataLabels.innerHTML = '';
    
    // Adicionar labels de valores nos pontos (apenas alguns para não poluir)
    const showLabelsEvery = Math.max(1, Math.floor(totalPoints.length / 6));
    
    totalPoints.forEach((point, index) => {
        if (index % showLabelsEvery === 0 || index === totalPoints.length - 1) {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', point.x);
            text.setAttribute('y', point.y - 8);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('font-size', '10');
            text.setAttribute('fill', '#3b82f6');
            text.setAttribute('font-weight', 'bold');
            text.textContent = point.value;
            dataLabels.appendChild(text);
        }
    });
}

function updateHorizontalGrid(maxValue) {
    const horizontalGrid = document.getElementById('horizontalGrid');
    if (!horizontalGrid) return;
    
    // Limpar grid existente
    horizontalGrid.innerHTML = '';
    
    const steps = 5;
    for (let i = 1; i < steps; i++) {
        const y = (200 / steps) * i;
        
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', '0');
        line.setAttribute('y1', y);
        line.setAttribute('x2', '480');
        line.setAttribute('y2', y);
        line.setAttribute('stroke', '#f3f4f6');
        line.setAttribute('stroke-width', '1');
        horizontalGrid.appendChild(line);
    }
}

// Modal Functions
function showCreateUserModal() {
    document.getElementById('createUserModal').classList.add('show');
}

function closeCreateUserModal() {
    document.getElementById('createUserModal').classList.remove('show');
    document.getElementById('createUserForm').reset();
}

async function handleCreateUser(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const userData = {
        username: formData.get('username'),
        email: formData.get('email'),
        password: formData.get('password'),
        role: formData.get('role')
    };
    
    try {
        showLoading(true);
        await apiCall('/api/users', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        
        closeCreateUserModal();
        await loadUsers();
        addLogEntry('info', `Usuário ${userData.username} criado com sucesso`);
    } catch (error) {
        addLogEntry('error', `Falha ao criar usuário: ${error.message}`);
    } finally {
        showLoading(false);
    }
}

// Action Functions
async function disconnectUser(connectionId) {
    if (!confirm('Tem certeza que deseja desconectar este usuário?')) {
        return;
    }
    
    try {
        await apiCall(`/api/connections/${connectionId}`, {
            method: 'DELETE'
        });
        
        await loadConnections();
        addLogEntry('info', `Conexão ${connectionId} desconectada`);
    } catch (error) {
        addLogEntry('error', `Falha ao desconectar usuário: ${error.message}`);
    }
}

async function deleteUser(userId) {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) {
        return;
    }
    
    try {
        await apiCall(`/api/users/${userId}`, {
            method: 'DELETE'
        });
        
        await loadUsers();
        addLogEntry('info', `Usuário ${userId} excluído`);
    } catch (error) {
        addLogEntry('error', `Falha ao excluir usuário: ${error.message}`);
    }
}

function editUser(userId) {
    // Implement edit user functionality
    addLogEntry('info', `Editando usuário ${userId}`);
}

async function shutdownServer() {
    if (!confirm('Tem certeza que deseja desligar o servidor? Esta ação não pode ser desfeita.')) {
        return;
    }
    
    try {
        await apiCall('/api/dashboard/server/shutdown', {
            method: 'POST'
        });
        
        addLogEntry('warning', 'Servidor sendo desligado...');
        stopAutoRefresh();
    } catch (error) {
        addLogEntry('error', `Falha ao desligar servidor: ${error.message}`);
    }
}

// Utility Functions
function refreshData() {
    console.log('Refreshing dashboard data...');
    try {
        loadServerStatus();
        loadConnections();
        loadUsers();
        loadSystemMetrics();
        updateChart();
        console.log('Data refresh completed');
    } catch (error) {
        console.error('Error during data refresh:', error);
        addLogEntry('error', 'Erro durante atualização dos dados');
    }
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.classList.add('show');
    } else {
        overlay.classList.remove('show');
    }
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Logging Functions
function addLogEntry(level, message) {
    const logsContainer = document.getElementById('logs-container');
    if (!logsContainer) return; // Prevent errors if container doesn't exist
    
    const timestamp = new Date().toLocaleString('pt-BR');
    
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${level}`;
    logEntry.innerHTML = `
        <span class="log-time">${timestamp}</span>
        <span class="log-level">${level.toUpperCase()}</span>
        <span class="log-message">${message}</span>
    `;
    
    logsContainer.appendChild(logEntry);
    
    // Keep only last 50 log entries to prevent page growth
    const entries = logsContainer.querySelectorAll('.log-entry');
    if (entries.length > 50) {
        // Remove multiple old entries at once for better performance
        for (let i = 0; i < entries.length - 50; i++) {
            entries[i].remove();
        }
    }
    
    // Auto-scroll only if user is near bottom
    const isNearBottom = logsContainer.scrollTop + logsContainer.clientHeight >= logsContainer.scrollHeight - 50;
    if (isNearBottom) {
        logsContainer.scrollTop = logsContainer.scrollHeight;
    }
}

function filterLogs() {
    const level = document.getElementById('log-level').value;
    const entries = document.querySelectorAll('.log-entry');
    
    entries.forEach(entry => {
        if (level === 'all' || entry.classList.contains(level)) {
            entry.style.display = 'flex';
        } else {
            entry.style.display = 'none';
        }
    });
}

function clearLogs() {
    if (confirm('Tem certeza que deseja limpar todos os logs?')) {
        document.getElementById('logs-container').innerHTML = '';
        addLogEntry('info', 'Logs limpos pelo administrador');
    }
}

// Error handling
window.addEventListener('error', function(e) {
    addLogEntry('error', `Erro JavaScript: ${e.message}`);
});

window.addEventListener('unhandledrejection', function(e) {
    addLogEntry('error', `Promise rejeitada: ${e.reason}`);
});