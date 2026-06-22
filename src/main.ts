import { createServer } from "http";

import { env } from "./config/env";
import { createApp } from "./app";
import { configureWebSocket } from "./infrastructure/websocket/socketServer";

const app = createApp();
const httpServer = createServer(app);

configureWebSocket(httpServer);

httpServer.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on port ${env.PORT}`);
});
