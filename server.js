const express = require('express');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files (index.html, style.css, script.js)
app.use(express.static(path.join(__dirname, '..')));

// Route to serve index.html at root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'index.html'));
});


// Handle WebSocket connections
wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        console.log('Received:', data);

        // Broadcast to all clients
        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// Start the server
const PORT = 3001;
server.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});
