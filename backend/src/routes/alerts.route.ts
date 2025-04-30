import { Router } from "express";
// Keep Logger import if needed elsewhere, otherwise remove
// import Logger from "../utils/logger";
// Import validation middleware and schema
import validateRequest from "../middleware/validateRequest";
import { createAlertSchema } from "../schemas/alert.schema";
// Import controller functions
import {
  createAlert,
  getAllAlerts,
  getTriggeredAlerts,
  acknowledgeAlert,
  deleteAlert,
} from "../controllers/alerts.controller";

const router = Router();

router.post(
  "/",
  validateRequest(createAlertSchema),
  createAlert // Use controller function
);

router.get(
  "/",
  getAllAlerts // Use controller function
);

router.get(
  "/triggered",
  getTriggeredAlerts // Use controller function
);

router.patch(
  "/:id/acknowledge",
  acknowledgeAlert // Use controller function
);

router.delete(
  "/:id",
  deleteAlert // Use controller function
);

export default router;
