import mongoose, { Schema, Document, Types } from "mongoose";
import { ILocation, ICondition, WeatherParameter, IAlert } from "@acme/types";

export interface IAlertDocument extends Omit<IAlert, "_id">, Document {
  _id: Types.ObjectId;
}

const LocationSchema = new Schema<ILocation>(
  {
    type: { type: String, required: true, enum: ["City", "Coordinates"] },
    value: { type: Schema.Types.Mixed, required: true },
  },
  { _id: false }
);

const ConditionSchema = new Schema<ICondition>(
  {
    parameter: {
      type: String,
      required: true,
      enum: Object.values<WeatherParameter>([
        "temperature",
        "windSpeed",
        "precipitation",
      ] as const),
    },
    operator: {
      type: String,
      required: true,
      enum: [">", "<", ">=", "<=", "="],
    },
    threshold: { type: Number, required: true },
  },
  { _id: false }
);

const AlertSchema: Schema<IAlertDocument> = new Schema(
  {
    name: { type: String, required: false, trim: true },
    location: { type: LocationSchema, required: true },
    condition: { type: ConditionSchema, required: true },
    status: {
      type: String,
      required: true,
      enum: ["active", "triggered", "inactive"],
      default: "active",
    },
    notifySMS: { type: Boolean, required: false, default: false },
    phoneNumber: { type: String, required: false, trim: true },
    lastCheckedAt: { type: Date, required: false },
    lastTriggeredAt: { type: Date, required: false },
  },
  { timestamps: true }
);

const Alert = mongoose.model<IAlertDocument>("Alert", AlertSchema);

export default Alert;
