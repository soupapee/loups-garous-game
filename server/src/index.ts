import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import { RoomManager } from './game/RoomManager';
import { setupSocketHandlers } from './socket/socketHandler';
import { ROLE_DEFINITIONS } from './types';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

// Routes API REST informatives et utilitaires
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Récupération des définitions officielles des rôles et règles
app.get('/api/roles', (req, res) => {
  res.json({ roles: Object.values(ROLE_DEFINITIONS) });
});

// Création du serveur HTTP et initialisation de Socket.IO
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const roomManager = new RoomManager();
setupSocketHandlers(io, roomManager);

httpServer.listen(PORT, () => {
  console.log(`🐺 Serveur Loups-Garous démarré sur le port ${PORT}`);
  console.log(`📡 Socket.IO prêt pour les connexions temps réel`);
  console.log(`🌐 CORS configuré pour l'origine : ${CORS_ORIGIN}`);
});

export { app, httpServer, io, roomManager };
