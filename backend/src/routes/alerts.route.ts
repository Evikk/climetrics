import { Router } from "express";
import validateRequest from "../middleware/validateRequest";
import { createAlertSchema } from "../schemas/alert.schema";
import {
  createAlert,
  getAllAlerts,
  getTriggeredAlerts,
  acknowledgeAlert,
  deleteAlert,
} from "../controllers/alerts.controller";

const router = Router();

router.post("/", validateRequest(createAlertSchema), createAlert);

router.get("/", getAllAlerts);

router.get("/triggered", getTriggeredAlerts);

router.patch("/:id/acknowledge", acknowledgeAlert);

router.delete("/:id", deleteAlert);

export default router;
