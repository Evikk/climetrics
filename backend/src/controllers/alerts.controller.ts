import { Request, Response, NextFunction } from "express";
import Alert from "../models/Alert.model";
import Logger from "../utils/logger";
import { CreateAlertInput } from "../schemas/alert.schema";

// --- Create a new Alert ---
export const createAlert = async (
  req: Request<{}, {}, CreateAlertInput>, // Use validated body type
  res: Response,
  next: NextFunction
) => {
  try {
    const newAlert = new Alert({
      ...req.body,
      status: "active",
    });
    await newAlert.save();

    Logger.info(`Alert created successfully: ${newAlert._id}`, {
      alertId: newAlert._id,
    });
    res.status(201).json(newAlert);
  } catch (error) {
    Logger.error("Error saving alert to DB", { error });
    next(error);
  }
};

// --- Get all Alerts ---
export const getAllAlerts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const alerts = await Alert.find().lean();
    res.status(200).json(alerts);
  } catch (error) {
    Logger.error("Error fetching all alerts", { error });
    next(error);
  }
};

// --- Get Triggered Alerts ---
export const getTriggeredAlerts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const triggeredAlerts = await Alert.find({ status: "triggered" }).lean();
    res.status(200).json(triggeredAlerts);
  } catch (error) {
    Logger.error("Error fetching triggered alerts", { error });
    next(error);
  }
};

// --- Acknowledge an Alert ---
export const acknowledgeAlert = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const alert = await Alert.findByIdAndUpdate(
      id,
      { status: "active" },
      { new: true }
    );
    res.status(200).json(alert);
  } catch (error) {
    Logger.error("Error acknowledging alert", { error });
    next(error);
  }
};

// --- Delete an Alert ---
export const deleteAlert = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    await Alert.findByIdAndDelete(id);
    res.status(204).send();
  } catch (error) {
    Logger.error("Error deleting alert", { error });
    next(error);
  }
};
