import { z } from "zod";

// Schema for the params of the GET /api/weather/:location request
export const getWeatherSchema = z.object({
  params: z.object({
    location: z
      .string()
      .min(1, "Location parameter cannot be empty")
      // Basic regex to check for either non-empty string or lat,lon format
      // More specific validation (like numeric ranges for coords) could be added
      // but the route handler already checks isCoordinates.
      // We mainly want to ensure it's a non-empty string.
      .refine((val) => val.trim().length > 0, {
        message: "Location parameter cannot be empty or just whitespace",
      }),
  }),
});

// Type helper (optional, mainly for params)
export type GetWeatherParams = z.infer<typeof getWeatherSchema>["params"];
