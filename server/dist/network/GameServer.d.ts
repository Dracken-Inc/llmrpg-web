export declare class GameServer {
    private app;
    private httpServer;
    private io;
    private connectedUsers;
    constructor(port?: number);
    private setupRoutes;
    private setupWebSocket;
    close(): void;
}
//# sourceMappingURL=GameServer.d.ts.map