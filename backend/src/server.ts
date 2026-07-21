import http from 'http';
import { Server } from 'socket.io'
import app from './app';
import socketsAuth from './sockets/auth';
import lobbyHandlers from './sockets/lobby';
import gameplayHandlers from './sockets/game';

const server = http.createServer(app);
const io = new Server(server, {
  path: '/socket.io',
  cors: { origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ["https://play.pointtaken.social"], credentials: true },
  pingInterval: 25000,
  pingTimeout: 20000,
});

socketsAuth(io)

io.on('connection', (socket) => {
  lobbyHandlers(io, socket);
  gameplayHandlers(io, socket)
})
  
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`server is up on port ${PORT}`);
});