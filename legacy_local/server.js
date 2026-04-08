const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const cors = require('cors');
const path = require('path');
const os = require('os');

// Configuración
const HTTP_PORT = 3000;
const WS_PORT = 3001;

// Datos del carrusel (en memoria)
let currentContent = {
    items: [],
    logo: null,
    qr: null,
    eventTitle: 'Evento en vivo',
    slideDuration: 5
};

// Clientes conectados
const clients = new Map();
let adminClient = null;

// Configurar servidor HTTP
const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Servir archivos estáticos
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/pantalla', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pantalla.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// API para actualizar contenido desde el admin
app.post('/api/update-content', (req, res) => {
    try {
        const content = req.body;
        
        // Validar datos
        if (!content || !Array.isArray(content.items)) {
            return res.status(400).json({ error: 'Datos inválidos' });
        }
        
        // Actualizar contenido
        currentContent = {
            items: content.items || [],
            logo: content.logo || null,
            qr: content.qr || null,
            eventTitle: content.eventTitle || 'Evento en vivo',
            slideDuration: content.slideDuration || 5
        };
        
        console.log(`Contenido actualizado: ${currentContent.items.length} items`);
        
        // Enviar a todos los clientes
        broadcastToAll({
            type: 'content_update',
            content: currentContent
        });
        
        res.json({ success: true, message: 'Contenido actualizado' });
    } catch (error) {
        console.error('Error actualizando contenido:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// API para obtener estado
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        clients: clients.size,
        contentItems: currentContent.items.length,
        serverTime: new Date().toISOString()
    });
});

// Obtener IP local
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const interfaceName in interfaces) {
        for (const iface of interfaces[interfaceName]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}

// Configurar servidor WebSocket
const wss = new WebSocket.Server({ port: WS_PORT });

wss.on('connection', (ws, req) => {
    const clientId = generateClientId();
    const clientIP = req.socket.remoteAddress;
    
    console.log(`Nuevo cliente conectado: ${clientId} desde ${clientIP}`);
    
    clients.set(clientId, {
        ws,
        id: clientId,
        ip: clientIP,
        isAdmin: false,
        connectedAt: new Date()
    });
    
    // Enviar ID al cliente
    ws.send(JSON.stringify({
        type: 'client_id',
        clientId: clientId
    }));
    
    // Enviar información del servidor
    ws.send(JSON.stringify({
        type: 'server_info',
        ip: getLocalIP(),
        port: HTTP_PORT,
        clientsCount: clients.size
    }));
    
    // Enviar contenido actual
    ws.send(JSON.stringify({
        type: 'content_update',
        content: currentContent
    }));
    
    // Manejar mensajes del cliente
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            handleClientMessage(clientId, data);
        } catch (error) {
            console.error('Error procesando mensaje:', error);
        }
    });
    
    // Manejar desconexión
    ws.on('close', () => {
        console.log(`Cliente desconectado: ${clientId}`);
        
        if (adminClient === clientId) {
            adminClient = null;
            console.log('Administrador desconectado');
        }
        
        clients.delete(clientId);
        
        // Notificar a otros clientes (opcional)
        broadcastToAll({
            type: 'client_disconnected',
            clientId: clientId,
            clientsCount: clients.size
        });
    });
    
    ws.on('error', (error) => {
        console.error(`Error con cliente ${clientId}:`, error);
    });
});

// Manejar mensajes de clientes
function handleClientMessage(clientId, data) {
    const client = clients.get(clientId);
    
    switch (data.type) {
        case 'client_ready':
            console.log(`Cliente listo: ${clientId}`);
            break;
            
        case 'request_update':
            // Reenviar contenido actual
            client.ws.send(JSON.stringify({
                type: 'content_update',
                content: currentContent
            }));
            break;
            
        case 'set_admin':
            // Marcar como administrador
            adminClient = clientId;
            client.isAdmin = true;
            console.log(`Cliente ${clientId} marcado como administrador`);
            break;
            
        case 'ping':
            // Responder ping
            client.ws.send(JSON.stringify({
                type: 'pong',
                timestamp: data.timestamp
            }));
            break;
            
        case 'admin_update':
            // Actualización desde el administrador
            if (clientId === adminClient) {
                currentContent = data.content;
                
                // Reenviar a todos los clientes
                broadcastToAll({
                    type: 'content_update',
                    content: currentContent
                });
                
                console.log(`Contenido actualizado por administrador: ${currentContent.items.length} items`);
            }
            break;
    }
}

// Transmitir a todos los clientes
function broadcastToAll(message) {
    const messageStr = JSON.stringify(message);
    
    clients.forEach((client) => {
        if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(messageStr);
        }
    });
}

// Generar ID único para cliente
function generateClientId() {
    return 'client_' + Math.random().toString(36).substr(2, 9);
}

// Iniciar servidor HTTP
const server = app.listen(HTTP_PORT, () => {
    const localIP = getLocalIP();
    console.log('='.repeat(50));
    console.log('🚀 Servidor de Proyección en Red Local');
    console.log('='.repeat(50));
    console.log(`📡 Panel de Administración:`);
    console.log(`   Local:    http://localhost:${HTTP_PORT}/admin`);
    console.log(`   Red:      http://${localIP}:${HTTP_PORT}/admin`);
    console.log('');
    console.log(`📺 Pantalla de Proyección:`);
    console.log(`   Local:    http://localhost:${HTTP_PORT}/pantalla`);
    console.log(`   Red:      http://${localIP}:${HTTP_PORT}/pantalla`);
    console.log('');
    console.log(`🔌 WebSocket Server: ws://${localIP}:${WS_PORT}`);
    console.log('='.repeat(50));
    console.log('');
    console.log('💡 Para proyectar en otros dispositivos:');
    console.log('1. Asegúrate de que todos estén en la misma red WiFi');
    console.log('2. Abre un navegador en otro dispositivo y visita:');
    console.log(`   http://${localIP}:${HTTP_PORT}/pantalla`);
    console.log('3. Para controlar el contenido, abre en tu computadora:');
    console.log(`   http://localhost:${HTTP_PORT}/admin`);
});

// Manejar cierre elegante
process.on('SIGINT', () => {
    console.log('\nApagando servidor...');
    
    // Cerrar todas las conexiones WebSocket
    clients.forEach((client) => {
        client.ws.close();
    });
    
    server.close(() => {
        console.log('Servidor apagado correctamente');
        process.exit(0);
    });
});