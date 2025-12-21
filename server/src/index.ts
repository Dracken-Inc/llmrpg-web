import { GameServer } from './network/GameServer';

const PORT = parseInt(process.env.PORT || '3001', 10);

const gameServer = new GameServer(PORT);

process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  gameServer.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Server termination signal received');
  gameServer.close();
  process.exit(0);
});

export default gameServer;
