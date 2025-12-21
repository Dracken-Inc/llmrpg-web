"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const GameServer_1 = require("./network/GameServer");
const PORT = parseInt(process.env.PORT || '3001', 10);
const gameServer = new GameServer_1.GameServer(PORT);
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
exports.default = gameServer;
//# sourceMappingURL=index.js.map