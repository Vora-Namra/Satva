import { createServer, Server } from "http";
import { buildApp } from "./app.js";
import { env } from "./config/index.js";
import logger from "./common/logger.js";
import { dbConnection, pool, query } from "./database/connection.js";

const PORT = env.PORT;
const NODE_ENV = env.NODE_ENV;
async function buildServer(): Promise<void> {
  try {
    await dbConnection();
    const app = buildApp();
    const server: Server = createServer(app);

    server.listen(PORT, () => {
      logger.info("server started running");
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(`Server is in ${NODE_ENV} ENVIRONMENT`);
    });
  } catch (error) {
    logger.error("server stopped");
    console.log(`Failed to start Server`, error);
  }
}
buildServer();
