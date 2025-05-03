import { Router } from "express";
import dotenv from "dotenv";
import validateRequest from "../middleware/validateRequest";
import { getWeatherSchema } from "../schemas/weather.schema";
import { getWeatherByLocation } from "../controllers/weather.controller";

dotenv.config(); // Load environment variables

const router = Router();

router.get(
  "/:location",
  validateRequest(getWeatherSchema),
  getWeatherByLocation
);

export default router;
