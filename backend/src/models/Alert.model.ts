import mongoose, { Schema, Document } from "mongoose";
import {
  ILocation as SharedLocation,
  ICondition as SharedCondition,
  WeatherParameter,
} from "@acme/types";

export interface IAlert extends Document {
  _id: mongoose.Schema.Types.ObjectId;
  name?: string;
  location: SharedLocation;
  condition: SharedCondition;
  status: "active" | "triggered" | "inactive";
  lastCheckedAt?: Date;
  lastTriggeredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LocationSchema = new Schema<SharedLocation>(
  {
    type: { type: String, required: true, enum: ["City", "Coordinates"] },
    value: { type: Schema.Types.Mixed, required: true }, // Can be string (City) or object (Coords)
  },
  { _id: false } // Don't create a separate _id for the subdocument
);

// Use shared interface for Schema definition
const ConditionSchema = new Schema<SharedCondition>(
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

const AlertSchema: Schema<IAlert> = new Schema(
  {
    // _id is automatically added by Mongoose
    name: { type: String, required: false, trim: true },
    location: { type: LocationSchema, required: true },
    condition: { type: ConditionSchema, required: true },
    status: {
      type: String,
      required: true,
      enum: ["active", "triggered", "inactive"],
      default: "active",
    },
    lastCheckedAt: { type: Date, required: false },
    lastTriggeredAt: { type: Date, required: false },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

const Alert = mongoose.model<IAlert>("Alert", AlertSchema);

export default Alert;
