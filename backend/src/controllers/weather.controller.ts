import { Request, Response, NextFunction } from "express";
import Logger from "../utils/logger";
import { GetWeatherParams } from "../schemas/weather.schema";
// Import the new weather service function
import { fetchWeatherData } from "../services/weather.service";

export const getWeatherByLocation = async (
  req: Request<GetWeatherParams>, // Use the validated params type
  res: Response,
  next: NextFunction
) => {
  const locationParam = req.params.location;

  try {
    // Call the service function to get weather data
    Logger.debug(
      `[WeatherController] Calling WeatherService for location: ${locationParam}`
    );
    const weatherData = await fetchWeatherData(locationParam);

    // Service function succeeded, send response
    Logger.info(
      `[WeatherController] Successfully got weather for ${locationParam} via service.`
    );
    res.status(200).json({
      location: locationParam,
      ...weatherData, // Spread the data returned by the service
    });
  } catch (error: any) {
    // Service function threw an error, pass it to the central error handler
    Logger.error(
      `[WeatherController] Error getting weather for ${locationParam}: ${error.message}`,
      { location: locationParam }
    );

    // Add a default status code if the service error didn't provide one
    // Although the service should throw errors with appropriate context/messages.
    // We might want to map specific service errors to status codes here.
    if (!error.statusCode) {
      // Basic check for common error types, can be expanded
      if (error.message.includes("API key missing")) {
        error.statusCode = 500; // Internal Server Error (config issue)
      } else if (error.message.includes("Network error")) {
        error.statusCode = 503; // Service Unavailable
      } else if (error.message.includes("Weather API error")) {
        // Try to extract code from message like "Weather API error (401): ..."
        const match = error.message.match(/\((\d{3})\)/);
        error.statusCode = match ? parseInt(match[1], 10) : 400; // Default to Bad Request for other API errors
      } else {
        error.statusCode = 500; // Default internal error
      }
    }
    next(error);
  }
};
