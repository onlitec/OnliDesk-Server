// Global variables
let refreshInterval;
let isInitializing = false;
let lastChartData = null; // Cache for chart data to avoid unnecessary updates
const API_BASE_URL = window.location.origin;

// Initialize the enhanced dashboard
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    
    // Initialize glassmorphism dashboard
    initializeGlassmorphismDashboard();
    setupEventListeners();
    startAutoRefresh();
    initializeEnhancedCharts();
    loadEnhancedMetrics();
    
    // Start real-time clock
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Chart period selector
    const chartPeriodSelect = document.getElementById('chart-period');
    if (chartPeriodSelect) {
        chartPeriodSelect.addEventListener('change', function() {
            updateChartsForPeriod(this.value);
        });
    }
    
    // Initialize sidebar navigation
    initializeSidebarNavigation();
});

function initializeGlassmorphismDashboard() {
    if (isInitializing) {
        console.log('Dashboard initialization already in progress, skipping...');
        return;
    }
    
    isInitializing = true;
    console.log('Starting glassmorphism dashboard initialization...');
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
            }),
            loadServerLogs().catch(e => {
                console.error('Error loading server logs:', e);
                addLogEntry('error', 'Erro ao carregar logs do servidor');
                return null;
            })
        ]).then(() => {
             console.log('All data loaded successfully');
             clearTimeout(safetyTimeout);
             showLoading(false);
             isInitializing = false;
             initializeGlassmorphismEffects();
             animateCards();
             setupLogEventListeners();
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
    const createUserForm = document.getElementById('createUserForm');
    if (createUserForm) {
        createUserForm.addEventListener('submit', handleCreateUser);
    }
    
    // Log level filter
    const logLevel = document.getElementById('log-level');
    if (logLevel) {
        logLevel.addEventListener('change', filterLogs);
    }
    
    // Glass button hover effects
    document.querySelectorAll('.glass-btn').forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
        });
        btn.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });
    
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
        updateEnhancedMetrics();
        updateCharts();
    }, 60000);
}

// Enhanced Charts Initialization
function initializeEnhancedCharts() {
    const canvas = document.getElementById('connectionsChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Create enhanced line chart
    window.connectionsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: generateTimeLabels(24),
            datasets: [{
                label: 'Conexões Ativas',
                data: generateRandomData(24, 10, 50),
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#667eea',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }, {
                label: 'Desconexões',
                data: generateRandomData(24, 2, 15),
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#f59e0b',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#667eea',
                    borderWidth: 1,
                    cornerRadius: 8
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#6b7280',
                        font: {
                            size: 12
                        }
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#6b7280',
                        font: {
                            size: 12
                        }
                    },
                    beginAtZero: true
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            elements: {
                line: {
                    borderWidth: 2
                }
            }
        }
    });
    
    // Initialize donut chart for connection types
    initializeDonutChart();
}

// Generate time labels
function generateTimeLabels(hours) {
    const labels = [];
    const now = new Date();
    
    for (let i = hours - 1; i >= 0; i--) {
        const time = new Date(now.getTime() - (i * 60 * 60 * 1000));
        labels.push(time.getHours().toString().padStart(2, '0') + ':00');
    }
    
    return labels;
}

// Generate random data for demonstration
function generateRandomData(count, min, max) {
    const data = [];
    for (let i = 0; i < count; i++) {
        data.push(Math.floor(Math.random() * (max - min + 1)) + min);
    }
    return data;
}

// Initialize donut chart
function initializeDonutChart() {
    const donutCanvas = document.getElementById('donutChart');
    if (!donutCanvas) return;
    
    const donutCtx = donutCanvas.getContext('2d');
    
    window.donutChart = new Chart(donutCtx, {
        type: 'doughnut',
        data: {
            labels: ['Desktop', 'Mobile', 'Tablet'],
            datasets: [{
                data: [60, 30, 10],
                backgroundColor: [
                    '#10b981',
                    '#f59e0b',
                    '#6b7280'
                ],
                borderWidth: 0,
                cutout: '70%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#10b981',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            },
            onHover: (event, activeElements) => {
                event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
            }
        }
    });
    
    // Update the center total
    updateDonutTotal();
}

// Update donut chart total
function updateDonutTotal() {
    if (window.donutChart) {
        const data = window.donutChart.data.datasets[0].data;
        const total = data.reduce((a, b) => a + b, 0);
        const totalElement = document.getElementById('donutTotal');
        if (totalElement) {
            totalElement.textContent = total;
        }
        
        // Update percentages in legend
        data.forEach((value, index) => {
            const percentage = Math.round((value / total) * 100);
            const percentageElements = [
                document.getElementById('desktopPercentage'),
                document.getElementById('mobilePercentage'),
                document.getElementById('tabletPercentage')
            ];
            
            if (percentageElements[index]) {
                percentageElements[index].textContent = percentage;
            }
        });
    }
}

// Load enhanced metrics
function loadEnhancedMetrics() {
    // Simulate enhanced metrics data
    updateMetricValue('requests-per-minute', Math.floor(Math.random() * 100) + 50);
    updateMetricValue('response-time', Math.floor(Math.random() * 50) + 25 + 'ms');
    
    // Update geographic distribution with animation
    animateGeographicBars();
    
    // Update donut chart
    updateDonutChart();
}

// Update enhanced metrics
function updateEnhancedMetrics() {
    // Simulate real-time updates
    const requestsPerMin = Math.floor(Math.random() * 100) + 50;
    const responseTime = Math.floor(Math.random() * 50) + 25;
    
    updateMetricValue('requests-per-minute', requestsPerMin);
    updateMetricValue('response-time', responseTime + 'ms');
    
    // Update trends
    updateTrendIndicators();
}

// Update metric value with animation
function updateMetricValue(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.transform = 'scale(1.1)';
        element.textContent = value;
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 200);
    }
}

// Animate geographic bars
function animateGeographicBars() {
    const geoBars = document.querySelectorAll('.geo-fill');
    geoBars.forEach((bar, index) => {
        setTimeout(() => {
            bar.style.transition = 'width 1s ease-out';
            bar.style.width = bar.style.width; // Trigger animation
        }, index * 200);
    });
}

// Update donut chart data
function updateDonutChart() {
    const donutTotal = document.querySelector('.donut-total');
    if (donutTotal) {
        const total = Math.floor(Math.random() * 50) + 150;
        donutTotal.textContent = total;
    }
}

// Update trend indicators
function updateTrendIndicators() {
    const trends = document.querySelectorAll('.status-trend');
    trends.forEach(trend => {
        const isPositive = Math.random() > 0.3; // 70% chance of positive trend
        const span = trend.querySelector('span');
        
        if (span && !span.textContent.includes('%') && !span.textContent.includes('ms') && !span.textContent.includes('/')) {
            const value = Math.floor(Math.random() * 20) + 1;
            span.textContent = isPositive ? `+${value}%` : `-${value}%`;
            
            trend.className = trend.className.replace(/positive|negative|neutral/, '');
            trend.classList.add(isPositive ? 'positive' : 'negative');
        }
    });
}

// Update charts for different time periods
function updateChartsForPeriod(period) {
    if (!window.connectionsChart) return;
    
    let hours, labels, data1, data2;
    
    switch(period) {
        case '24h':
            hours = 24;
            labels = generateTimeLabels(24);
            data1 = generateRandomData(24, 10, 50);
            data2 = generateRandomData(24, 2, 15);
            break;
        case '7d':
            hours = 7;
            labels = generateDayLabels(7);
            data1 = generateRandomData(7, 100, 500);
            data2 = generateRandomData(7, 20, 150);
            break;
        case '30d':
            hours = 30;
            labels = generateDayLabels(30);
            data1 = generateRandomData(30, 200, 800);
            data2 = generateRandomData(30, 50, 300);
            break;
    }
    
    window.connectionsChart.data.labels = labels;
    window.connectionsChart.data.datasets[0].data = data1;
    window.connectionsChart.data.datasets[1].data = data2;
    window.connectionsChart.update('active');
}

// Generate day labels
function generateDayLabels(days) {
    const labels = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
        labels.push((date.getMonth() + 1) + '/' + date.getDate());
    }
    
    return labels;
}

// Update charts (for auto-refresh)
function updateCharts() {
    if (window.connectionsChart) {
        const currentPeriod = document.getElementById('chart-period')?.value || '24h';
        updateChartsForPeriod(currentPeriod);
    }
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
        updateConnectionsGrid(mockConnections);
        // Mock data loaded silently
    } catch (error) {
        // Fallback to mock data for both table and cards
        const mockConnections = generateMockConnections();
        updateConnectionsTable(mockConnections);
        updateConnectionsGrid(mockConnections);
        updateConnectionsMetrics(mockConnections);
        
        // Also update glassmorphism cards with mock summary
        const mockSummary = {
            activeConnections: 24,
            totalToday: 156,
            averageSessionDuration: '12min'
        };
        updateConnectionsMetricsFromSummary(mockSummary);
        
        addLogEntry('error', 'Erro ao carregar conexões - usando dados mock');
    }
}

function generateMockConnections() {
    const connections = [];
    const usernames = ['admin', 'user1', 'user2', 'guest', 'developer'];
    const ips = ['192.168.1.100', '192.168.1.101', '10.0.0.50', '172.16.0.10'];
    
    for (let i = 0; i < Math.floor(Math.random() * 8) + 2; i++) {
        const startTime = new Date(Date.now() - Math.random() * 3600000);
        const isActive = Math.random() > 0.2;
        
        connections.push({
            id: i + 1,
            userId: Math.floor(Math.random() * 100) + 1,
            username: usernames[Math.floor(Math.random() * usernames.length)],
            user: usernames[Math.floor(Math.random() * usernames.length)], // For card compatibility
            ipAddress: ips[Math.floor(Math.random() * ips.length)],
            ip: ips[Math.floor(Math.random() * ips.length)], // For card compatibility
            startTime: startTime.toISOString(),
            duration: calculateDuration(startTime.toISOString()),
            isActive: isActive,
            status: isActive ? 'Ativo' : 'Inativo'
        });
    }
    
    return connections;
}

function updateConnectionsTable(connections) {
    const tbody = document.getElementById('connections-tbody');
    
    // Check if table element exists (for backward compatibility)
    if (!tbody) {
        return;
    }
    
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
    
    // Update glassmorphism stat cards
    updateStatCard('active-connections-card', activeConnections, 'positive', '+12%');
    updateStatCard('total-today-card', totalToday, 'positive', '+8%');
    updateStatCard('performance-card', 98, 'positive', '+2%');
    
    // Update individual elements if they exist (fallback)
    const activeElement = document.getElementById('active-connections');
    const totalElement = document.getElementById('total-today');
    const avgElement = document.getElementById('avg-session');
    
    if (activeElement) activeElement.textContent = activeConnections;
    if (totalElement) totalElement.textContent = totalToday;
    if (avgElement) avgElement.textContent = avgDuration;
}

function updateConnectionsMetricsFromSummary(summary) {
    // Update glassmorphism stat cards
    updateStatCard('active-connections-card', summary.activeConnections || 0, 'positive', '+12%');
    updateStatCard('total-today-card', summary.totalToday || 0, 'positive', '+8%');
    updateStatCard('performance-card', 98, 'positive', '+2%');
    
    // Update individual elements if they exist
    const activeElement = document.getElementById('active-connections');
    const totalElement = document.getElementById('total-today');
    const avgElement = document.getElementById('avg-session');
    
    if (activeElement) activeElement.textContent = summary.activeConnections;
    if (totalElement) totalElement.textContent = summary.totalToday;
    if (avgElement) avgElement.textContent = summary.averageSessionDuration;
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
    updateUsersGrid(mockUsers);
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
            status: 'Ativo',
            lastLogin: formatDateTime(new Date(Date.now() - 3600000).toISOString())
        },
        {
            id: 2,
            username: 'user1',
            email: 'user1@example.com',
            role: 'User',
            isActive: true,
            status: 'Ativo',
            lastLogin: formatDateTime(new Date(Date.now() - 7200000).toISOString())
        },
        {
            id: 3,
            username: 'guest',
            email: 'guest@example.com',
            role: 'User',
            isActive: false,
            status: 'Inativo',
            lastLogin: formatDateTime(new Date(Date.now() - 86400000).toISOString())
        }
    ];
}

function updateUsersTable(users) {
    const tbody = document.getElementById('users-tbody');
    
    // Check if table element exists (for backward compatibility)
    if (!tbody) {
        return;
    }
    
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
        addLogEntry('error', 'Erro ao carregar métricas - usando dados mock');
    }
}

function updateSystemMetrics(metrics) {
    // Update glassmorphism metric cards
    updateMetricCard('cpu', metrics.cpu, {
        'used': `${metrics.cpu}%`,
        'cores': '8 cores'
    });
    
    updateMetricCard('memory', metrics.memory, {
        'used': `${(metrics.memory * 16 / 100).toFixed(1)}GB`,
        'total': '16GB'
    });
    
    updateMetricCard('disk', metrics.disk, {
        'used': `${(metrics.disk * 500 / 100).toFixed(0)}GB`,
        'total': '500GB'
    });
    
    updateMetricCard('network', Math.floor(Math.random() * 80) + 10, {
        'upload': '2.4 MB/s',
        'download': '15.8 MB/s'
    });
    
    // Fallback for legacy elements if they exist
    const cpuUsage = document.getElementById('cpu-usage');
    const cpuPercent = document.getElementById('cpu-percent');
    const memoryUsage = document.getElementById('memory-usage');
    const memoryPercent = document.getElementById('memory-percent');
    const diskUsage = document.getElementById('disk-usage');
    const diskPercent = document.getElementById('disk-percent');
    
    if (cpuUsage) cpuUsage.style.width = `${metrics.cpu}%`;
    if (cpuPercent) cpuPercent.textContent = `${metrics.cpu}%`;
    if (memoryUsage) memoryUsage.style.width = `${metrics.memory}%`;
    if (memoryPercent) memoryPercent.textContent = `${metrics.memory}%`;
    if (diskUsage) diskUsage.style.width = `${metrics.disk}%`;
    if (diskPercent) diskPercent.textContent = `${metrics.disk}%`;
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

// Glassmorphism Dashboard Functions
function updateDateTime() {
    const now = new Date();
    const timeElement = document.querySelector('.current-time');
    const dateElement = document.querySelector('.current-date');
    
    if (timeElement) {
        timeElement.textContent = now.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
    
    if (dateElement) {
        dateElement.textContent = now.toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

function initializeSidebarNavigation() {
    // Add active state to current nav item
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            // Remove active class from all items
            navItems.forEach(nav => nav.classList.remove('active'));
            // Add active class to clicked item
            this.classList.add('active');
        });
    });
    
    // Set dashboard as active by default
    const dashboardNav = document.querySelector('.nav-item[href="#dashboard"]');
    if (dashboardNav) {
        dashboardNav.classList.add('active');
    }
}

// Enhanced card animations
function animateCards() {
    const cards = document.querySelectorAll('.glass-card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('animate-in');
    });
}

// Update stat cards with glassmorphism effects
function updateStatCard(cardId, value, trend = null, trendValue = null) {
    const card = document.getElementById(cardId);
    if (!card) return;
    
    const valueElement = card.querySelector('.value');
    const trendElement = card.querySelector('.card-trend');
    
    if (valueElement) {
        // Animate number change
        const currentValue = parseInt(valueElement.textContent) || 0;
        animateNumber(valueElement, currentValue, value, 1000);
    }
    
    if (trendElement && trend && trendValue) {
        trendElement.className = `card-trend ${trend}`;
        const icon = trend === 'positive' ? '↗' : trend === 'negative' ? '↘' : '→';
        trendElement.innerHTML = `${icon} ${trendValue}`;
    }
}

// Animate number changes
function animateNumber(element, start, end, duration) {
    const startTime = performance.now();
    const difference = end - start;
    
    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const current = Math.floor(start + (difference * easeOutCubic(progress)));
        element.textContent = current.toLocaleString('pt-BR');
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }
    
    requestAnimationFrame(updateNumber);
}

// Easing function for smooth animations
function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

// Enhanced metric updates with glassmorphism
function updateMetricCard(cardId, percentage, details = {}) {
    const card = document.querySelector(`[data-metric="${cardId}"]`);
    if (!card) return;
    
    const valueElement = card.querySelector('.metric-value');
    const progressFill = card.querySelector('.progress-fill');
    const detailElements = card.querySelectorAll('.detail-value');
    
    if (valueElement) {
        valueElement.textContent = `${percentage}%`;
    }
    
    if (progressFill) {
        progressFill.style.width = `${percentage}%`;
    }
    
    // Update detail values
    Object.keys(details).forEach((key, index) => {
        if (detailElements[index]) {
            detailElements[index].textContent = details[key];
        }
    });
}

// Responsive sidebar toggle for mobile
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
}

// Initialize glassmorphism effects
function initializeGlassmorphismEffects() {
    // Add intersection observer for card animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationPlayState = 'running';
            }
        });
    });
    
    document.querySelectorAll('.glass-card').forEach(card => {
        observer.observe(card);
    });
    
    // Add parallax effect to background
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const bgElements = document.querySelector('.bg-elements');
        if (bgElements) {
            bgElements.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
    });
}

// Functions for connection cards
function createConnectionCard(connection) {
    return `
        <div class="connection-card">
            <div class="connection-header">
                <div class="connection-id">#${connection.id}</div>
                <div class="connection-status ${connection.status.toLowerCase()}">
                    <span class="status-dot"></span>
                    ${connection.status}
                </div>
            </div>
            <div class="connection-info">
                <div class="info-item">
                    <span class="info-label">Usuário:</span>
                    <span class="info-value">${connection.user}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">IP:</span>
                    <span class="info-value">${connection.ip}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Início:</span>
                    <span class="info-value">${connection.startTime}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Duração:</span>
                    <span class="info-value">${connection.duration}</span>
                </div>
            </div>
            <div class="connection-actions">
                <button class="action-btn view" onclick="viewConnectionDetails(${connection.id})" title="Ver detalhes">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn refresh" onclick="refreshConnection(${connection.id})" title="Atualizar">
                    <i class="fas fa-sync-alt"></i>
                </button>
                <button class="action-btn disconnect" onclick="disconnectUser(${connection.id})" title="Desconectar">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;
}

function createUserCard(user) {
    return `
        <div class="user-card">
            <div class="user-header">
                <div class="user-id">#${user.id}</div>
                <div class="user-status ${user.status.toLowerCase()}">
                    <span class="status-dot"></span>
                    ${user.status}
                </div>
            </div>
            <div class="user-info">
                <div class="info-item">
                    <span class="info-label">Nome:</span>
                    <span class="info-value">${user.username}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Email:</span>
                    <span class="info-value">${user.email}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Função:</span>
                    <span class="info-value">${user.role}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Último Login:</span>
                    <span class="info-value">${user.lastLogin}</span>
                </div>
            </div>
            <div class="user-actions">
                <button class="action-btn view" onclick="viewUserDetails(${user.id})" title="Ver detalhes">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn edit" onclick="editUser(${user.id})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn reset" onclick="resetUserPassword(${user.id})" title="Resetar senha">
                    <i class="fas fa-key"></i>
                </button>
                <button class="action-btn delete" onclick="deleteUser(${user.id})" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
}

function updateConnectionsGrid(connections) {
    const connectionsGrid = document.getElementById('connections-grid');
    const connectionsTable = document.getElementById('connections-table');
    
    if (connectionsGrid) {
        if (connections && connections.length > 0) {
            connectionsGrid.innerHTML = connections.map(connection => createConnectionCard(connection)).join('');
        } else {
            connectionsGrid.innerHTML = '<div class="no-data">Nenhuma conexão ativa encontrada</div>';
        }
    }
    
    // Update table as well for backward compatibility
    if (connectionsTable && connections) {
        updateConnectionsTable(connections);
    }
}

function updateUsersGrid(users) {
    const usersGrid = document.getElementById('users-grid');
    const usersTable = document.getElementById('users-table');
    
    if (usersGrid) {
        if (users && users.length > 0) {
            usersGrid.innerHTML = users.map(user => createUserCard(user)).join('');
        } else {
            usersGrid.innerHTML = '<div class="no-data">Nenhum usuário encontrado</div>';
        }
    }
    
    // Update table as well for backward compatibility
    if (usersTable && users) {
        updateUsersTable(users);
    }
}

function toggleConnectionsView() {
    const connectionsGrid = document.getElementById('connections-grid');
    const connectionsTable = document.getElementById('connections-table');
    const toggleBtn = document.querySelector('#connections-section .toggle-view-btn');
    
    if (connectionsGrid && connectionsTable && toggleBtn) {
        if (connectionsGrid.style.display === 'none') {
            connectionsGrid.style.display = 'grid';
            connectionsTable.style.display = 'none';
            toggleBtn.innerHTML = '<i class="fas fa-table"></i> Visualização em Tabela';
        } else {
            connectionsGrid.style.display = 'none';
            connectionsTable.style.display = 'block';
            toggleBtn.innerHTML = '<i class="fas fa-th-large"></i> Visualização em Cards';
        }
    }
}

function toggleUsersView() {
    const usersGrid = document.getElementById('users-grid');
    const usersTable = document.getElementById('users-table');
    const toggleBtn = document.querySelector('#users-section .toggle-view-btn');
    
    if (usersGrid && usersTable && toggleBtn) {
        if (usersGrid.style.display === 'none') {
            usersGrid.style.display = 'grid';
            usersTable.style.display = 'none';
            toggleBtn.innerHTML = '<i class="fas fa-table"></i> Visualização em Tabela';
        } else {
            usersGrid.style.display = 'none';
            usersTable.style.display = 'block';
            toggleBtn.innerHTML = '<i class="fas fa-th-large"></i> Visualização em Cards';
        }
    }
}

// Action functions for connections
function viewConnectionDetails(connectionId) {
    console.log('Visualizando detalhes da conexão:', connectionId);
    // Implementar modal ou página de detalhes
    alert(`Detalhes da conexão #${connectionId}`);
}

function refreshConnection(connectionId) {
    console.log('Atualizando conexão:', connectionId);
    // Implementar atualização específica da conexão
    loadConnections();
}

// Action functions for users
function viewUserDetails(userId) {
    console.log('Visualizando detalhes do usuário:', userId);
    // Implementar modal ou página de detalhes
    alert(`Detalhes do usuário #${userId}`);
}

function resetUserPassword(userId) {
    if (confirm('Tem certeza que deseja resetar a senha deste usuário?')) {
        console.log('Resetando senha do usuário:', userId);
        // Implementar reset de senha
        alert(`Senha do usuário #${userId} foi resetada`);
    }
}

// Server Logs Functions
async function loadServerLogs() {
    try {
        // Try to fetch real logs from API
        const response = await apiCall('/api/logs');
        if (response.ok) {
            const logs = await response.json();
            updateLogsContainer(logs);
        } else {
            throw new Error('Failed to fetch logs');
        }
    } catch (error) {
        console.warn('Failed to load server logs, using mock data:', error);
        // Use mock data if API fails
        const mockLogs = generateMockLogs();
        updateLogsContainer(mockLogs);
    }
}

function generateMockLogs() {
    const levels = ['info', 'warning', 'error', 'debug'];
    const messages = [
        'Servidor iniciado com sucesso',
        'Dashboard carregado com sucesso',
        'Tentativa de conexão de IP não autorizado: 192.168.1.999',
        'Falha na autenticação do usuário: admin',
        'Backup automático concluído',
        'Conexão estabelecida com banco de dados',
        'Cache limpo automaticamente',
        'Usuário admin fez login',
        'Configuração atualizada',
        'Sistema de monitoramento ativo'
    ];
    
    const logs = [];
    for (let i = 0; i < 20; i++) {
        const date = new Date();
        date.setMinutes(date.getMinutes() - i * 5);
        
        logs.push({
            id: i + 1,
            timestamp: date.toISOString(),
            level: levels[Math.floor(Math.random() * levels.length)],
            message: messages[Math.floor(Math.random() * messages.length)]
        });
    }
    
    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function updateLogsContainer(logs) {
    const container = document.getElementById('logs-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    logs.forEach(log => {
        const logEntry = createLogEntry(log);
        container.appendChild(logEntry);
    });
    
    updateLogsCount(logs.length);
}

function createLogEntry(log) {
    const entry = document.createElement('div');
    entry.className = `log-entry ${log.level}`;
    
    const indicator = document.createElement('div');
    indicator.className = 'log-indicator';
    
    const content = document.createElement('div');
    content.className = 'log-content';
    
    const time = document.createElement('span');
    time.className = 'log-time';
    time.textContent = formatLogTime(log.timestamp);
    
    const level = document.createElement('span');
    level.className = `log-level ${log.level}`;
    level.textContent = log.level.toUpperCase();
    
    const message = document.createElement('span');
    message.className = 'log-message';
    message.textContent = log.message;
    
    content.appendChild(time);
    content.appendChild(level);
    content.appendChild(message);
    
    entry.appendChild(indicator);
    entry.appendChild(content);
    
    return entry;
}

function formatLogTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('pt-BR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

function updateLogsCount(count) {
    const countElement = document.querySelector('.logs-count');
    if (countElement) {
        countElement.textContent = `Exibindo ${Math.min(count, 10)} de ${count} logs`;
    }
}

function refreshLogs() {
    console.log('Refreshing logs...');
    loadServerLogs();
}

function exportLogs() {
    console.log('Exporting logs...');
    // Implement log export functionality
    alert('Funcionalidade de exportação será implementada em breve!');
}

function loadMoreLogs() {
    console.log('Loading more logs...');
    // Implement pagination for logs
    alert('Carregamento de mais logs será implementado em breve!');
}

// Modal Functions
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const toggleButton = document.querySelector('.password-toggle i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleButton.className = 'fas fa-eye-slash';
    } else {
        passwordInput.type = 'password';
        toggleButton.className = 'fas fa-eye';
    }
}

// Enhanced log filtering
function enhancedFilterLogs() {
    const levelFilter = document.getElementById('log-level');
    const selectedLevel = levelFilter ? levelFilter.value : 'all';
    const logEntries = document.querySelectorAll('.log-entry');
    
    logEntries.forEach(entry => {
        if (selectedLevel === 'all' || entry.classList.contains(selectedLevel)) {
            entry.style.display = 'flex';
        } else {
            entry.style.display = 'none';
        }
    });
    
    // Update visible count
    const visibleLogs = document.querySelectorAll('.log-entry[style*="flex"], .log-entry:not([style*="none"])');
    const countElement = document.querySelector('.logs-count');
    if (countElement) {
        const totalLogs = document.querySelectorAll('.log-entry').length;
        const visibleCount = selectedLevel === 'all' ? totalLogs : visibleLogs.length;
        countElement.textContent = `Exibindo ${visibleCount} de ${totalLogs} logs`;
    }
}

// Setup event listeners for logs section
function setupLogEventListeners() {
    // Log filter event listeners
    const logLevelFilter = document.getElementById('log-level-filter');
    const logSearch = document.getElementById('log-search');
    const refreshLogsBtn = document.getElementById('refresh-logs');
    const exportLogsBtn = document.getElementById('export-logs');
    const loadMoreLogsBtn = document.getElementById('load-more-logs');
    const clearLogsBtn = document.getElementById('clear-logs');
    
    if (logLevelFilter) {
        logLevelFilter.addEventListener('change', enhancedFilterLogs);
    }
    
    if (logSearch) {
        logSearch.addEventListener('input', enhancedFilterLogs);
    }
    
    if (refreshLogsBtn) {
        refreshLogsBtn.addEventListener('click', refreshLogs);
    }
    
    if (exportLogsBtn) {
        exportLogsBtn.addEventListener('click', exportLogs);
    }
    
    if (loadMoreLogsBtn) {
        loadMoreLogsBtn.addEventListener('click', loadMoreLogs);
    }
    
    if (clearLogsBtn) {
        clearLogsBtn.addEventListener('click', clearLogs);
    }
    
    // Modal event listeners
    const createUserModal = document.getElementById('create-user-modal');
    const closeModalBtn = document.querySelector('.close-modal');
    const cancelBtn = document.querySelector('.btn-cancel');
    const passwordToggle = document.getElementById('toggle-password');
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeCreateUserModal);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeCreateUserModal);
    }
    
    if (passwordToggle) {
        passwordToggle.addEventListener('click', togglePasswordVisibility);
    }
    
    // Close modal when clicking outside
    if (createUserModal) {
        createUserModal.addEventListener('click', (e) => {
            if (e.target === createUserModal) {
                closeCreateUserModal();
            }
        });
    }
    
    console.log('Log event listeners configured successfully');
}