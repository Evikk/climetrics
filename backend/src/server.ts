import dotenv from "dotenv";
dotenv.config();

import express, { Express, Request, Response } from "express";
import cors from "cors";
import mongoose from "mongoose";
import { EventEmitter } from "events";

import alertRoutes from "./routes/alerts.route";
import weatherRoutes from "./routes/weather.route";
import errorHandler from "./middleware/errorHandler";
import Logger from "./utils/logger";
import SchedulerService from "./services/scheduler.service";
import { IAlert } from "@acme/types";

const app: Express = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5001;
const eventEmitter = new EventEmitter();
let clients: { id: number; response: Response }[] = [];

// Middleware
app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;

if (!uri) {
  Logger.error("Error: MONGODB_URI is not defined in .env file");
  process.exit(1);
}

mongoose
  .connect(uri)
  .then(() => {
    Logger.info("MongoDB database connection established successfully");

    // --- Start Scheduler Service (after DB connection) ---
    // Get cron expression from env or default to every minute
    const cronExpression = process.env.SCHEDULER_CRON_EXPRESSION || "* * * * *";
    const schedulerService = new SchedulerService(eventEmitter);
    schedulerService.start(cronExpression);
  })
  .catch((err: Error) =>
    Logger.error("MongoDB connection error:", { error: err })
  );

app.get("/", (req: Request, res: Response) => {
  res.send("Weather Alert Backend is running!");
});

app.use("/api/alerts", alertRoutes);
app.use("/api/weather", weatherRoutes);

// --- SSE Endpoint ---
app.get("/api/events", (req: Request, res: Response) => {
  Logger.info("[SSE] Client connected");
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const clientId = Date.now();
  const newClient = {
    id: clientId,
    response: res,
  };
  clients.push(newClient);

  res.write(`event: connected
data: ${JSON.stringify({ clientId })}\n\n`);

  const onAlertTriggered = (alert: IAlert) => {
    Logger.debug(`[SSE] Sending alert ${alert._id} to client ${clientId}`);
    res.write(`event: alertTriggered
data: ${JSON.stringify(alert)}\n\n`);
  };

  eventEmitter.on("alertTriggered", onAlertTriggered);

  req.on("close", () => {
    Logger.info(`[SSE] Client ${clientId} disconnected`);
    clients = clients.filter((client) => client.id !== clientId);
    eventEmitter.removeListener("alertTriggered", onAlertTriggered);
    res.end();
  });
});

app.use(errorHandler);

app.listen(port, () => {
  Logger.info(`Server is running on port: ${port}`);
});
