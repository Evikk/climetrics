import dotenv from "dotenv";
dotenv.config();

import express, { Express, Request, Response } from "express";
import cors from "cors";
import mongoose from "mongoose";

import alertRoutes from "./routes/alerts.route";
import weatherRoutes from "./routes/weather.route";
import errorHandler from "./middleware/errorHandler";
import Logger from "./utils/logger";
import SchedulerService from "./services/scheduler.service";

class Server {
  private app: Express;
  private port: number;
  private schedulerService: SchedulerService;

  constructor() {
    this.app = express();
    this.port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5001;
    this.schedulerService = new SchedulerService();

    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandler();
  }

  private initializeMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
  }

  private async connectToDatabase(): Promise<void> {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      Logger.error("Error: MONGODB_URI is not defined in .env file");
      process.exit(1);
    }

    try {
      await mongoose.connect(uri);
      Logger.info("MongoDB database connection established successfully");
    } catch (err) {
      Logger.error("MongoDB connection error:", { error: err });
      process.exit(1); // Exit if DB connection fails
    }
  }

  private startScheduler(): void {
    const cronExpression = process.env.SCHEDULER_CRON_EXPRESSION || "* * * * *";
    this.schedulerService.start(cronExpression);
    Logger.info(`Scheduler started with cron expression: ${cronExpression}`);
  }

  private initializeRoutes(): void {
    this.app.get("/", (req: Request, res: Response) => {
      res.send("Climetrics Backend is running!");
    });
    this.app.use("/api/alerts", alertRoutes);
    this.app.use("/api/weather", weatherRoutes);
  }

  private initializeErrorHandler(): void {
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    await this.connectToDatabase();
    // this.startScheduler();

    this.app.listen(this.port, () => {
      Logger.info(`Server is running on port: ${this.port}`);
    });
  }
}

const server = new Server();
server.start();
