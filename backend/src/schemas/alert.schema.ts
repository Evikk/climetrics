import { z } from "zod";

// Reusable schema for Coordinates
const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
});

// Schema for the Location part of an alert
const locationSchema = z
  .object({
    type: z.enum(["City", "Coordinates"]),
    value: z.union([
      z.string().min(1, "City name cannot be empty"), // For City type
      coordinatesSchema, // For Coordinates type
    ]),
  })
  .refine(
    (data) => {
      // Ensure value matches type
      if (data.type === "City") {
        return typeof data.value === "string";
      } else if (data.type === "Coordinates") {
        return (
          typeof data.value === "object" &&
          data.value !== null &&
          "lat" in data.value &&
          "lon" in data.value
        );
      }
      return false;
    },
    {
      message:
        "Location value must match the specified type (string for City, {lat, lon} for Coordinates)",
      path: ["value"], // Point error to the value field
    }
  );

// Schema for the Condition part of an alert
const conditionSchema = z.object({
  parameter: z.enum(["temperature", "windSpeed", "precipitation"]),
  operator: z.enum([">", "<", ">=", "<=", "="]),
  threshold: z.number(),
});

// Schema for the body of the POST /api/alerts request
export const createAlertSchema = z.object({
  body: z
    .object({
      name: z.string().optional(), // Optional name
      location: locationSchema, // Required location object
      condition: conditionSchema, // Required condition object
      notifySMS: z.boolean().optional(), // Optional boolean
      phoneNumber: z
        .string()
        .trim()
        .min(1, "Phone number cannot be empty")
        .optional(), // Optional string
    })
    .refine(
      (data) => {
        // If notifySMS is true, phoneNumber must be provided
        if (data.notifySMS && !data.phoneNumber) {
          return false;
        }
        return true;
      },
      {
        message: "Phone number is required when SMS notification is enabled",
        path: ["phoneNumber"], // Point error to the phoneNumber field
      }
    ),
});

// Type helper for inferring the shape of the validated body
export type CreateAlertInput = z.infer<typeof createAlertSchema>["body"];
