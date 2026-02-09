import { logger as honoLoggerMiddleware } from "hono/logger";
import logger from "./index";

export const loggerMiddleware = honoLoggerMiddleware(
  async (message: string, ...rest: string[]) => {
    const logMessage = `${message}  context: ${JSON.stringify(rest)}`;
    console.log(logMessage);
    logger.info(logMessage);
  },
);
