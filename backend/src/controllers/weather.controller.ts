import { Request, Response, NextFunction } from "express";
import Logger from "../utils/logger";
import { GetWeatherParams, GetWeatherQuery } from "../schemas/weather.schema";
import { fetchWeatherData } from "../services/weather.service";

export const getWeatherByLocation = async (
  req: Request<GetWeatherParams, {}, {}, GetWeatherQuery>,
  res: Response,
  next: NextFunction
) => {
  const locationParam = req.params.location;
  const fieldsString = req.query.fields;

  const fieldsArray = fieldsString
    ? fieldsString.split(",").map((s) => s.trim())
    : undefined;

  try {
    const weatherData = await fetchWeatherData(locationParam, fieldsArray);

    Logger.info(
      `[WeatherController] Successfully got weather for ${locationParam} via service.`
    );
    res.status(200).json({
      location: locationParam,
      ...weatherData,
    });
  } catch (error: any) {
    Logger.error(
      `[WeatherController] Error getting weather for ${locationParam}: ${error.message}`,
      { location: locationParam }
    );

    if (!error.statusCode) {
      if (error.message.includes("API key missing")) {
        error.statusCode = 500;
      } else if (error.message.includes("Network error")) {
        error.statusCode = 503;
      } else if (error.message.includes("Weather API error")) {
        const match = error.message.match(/\((\d{3})\)/);
        error.statusCode = match ? parseInt(match[1], 10) : 400;
      } else {
        error.statusCode = 500;
      }
    }
    next(error);
  }
};
