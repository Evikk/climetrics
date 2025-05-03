import { z } from "zod";

// Schema for the GET /api/weather/:location request
export const getWeatherSchema = z.object({
  params: z.object({
    location: z
      .string()
      .min(1, "Location parameter cannot be empty")
      .refine((val) => val.trim().length > 0, {
        message: "Location parameter cannot be empty or just whitespace",
      }),
  }),
  query: z.object({
    fields: z.string().optional(),
  }),
});

export type GetWeatherParams = z.infer<typeof getWeatherSchema>["params"];
export type GetWeatherQuery = z.infer<typeof getWeatherSchema>["query"];
