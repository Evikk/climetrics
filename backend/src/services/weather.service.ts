import axios from "axios";
import Logger from "../utils/logger";
import { getMockWeatherResponse, mockWeatherData } from "../mocks/weather.mock";

const TOMORROW_IO_API_KEY = process.env.TOMORROW_IO_API_KEY;
const TOMORROW_IO_API_URL = "https://api.tomorrow.io/v4/weather/realtime";

const DEFAULT_WEATHER_FIELDS = [
  "temperature",
  "windSpeed",
  "humidity",
  "weatherCode",
];

export interface WeatherData {
  temperature?: number;
  windSpeed?: number;
  humidity?: number;
  weatherCode?: number;
}

// Helper function to determine if location is coordinates
const isCoordinates = (location: string): boolean => {
  const parts = location.split(",");
  return (
    parts.length === 2 &&
    !isNaN(parseFloat(parts[0])) &&
    !isNaN(parseFloat(parts[1]))
  );
};

export const fetchWeatherData = async (
  location: string,
  fields: string[] = DEFAULT_WEATHER_FIELDS
): Promise<WeatherData> => {
  Logger.debug(`[WeatherService] Fetching weather for location: ${location}`);

  if (!TOMORROW_IO_API_KEY) {
    Logger.error("[WeatherService] API key for Tomorrow.io is not configured.");
    throw new Error("Server configuration error: Weather API key missing.");
  }

  const locationQuery: string = isCoordinates(location)
    ? location
    : encodeURIComponent(location);

  try {
    const response = await axios.get(TOMORROW_IO_API_URL, {
      params: {
        location: locationQuery,
        fields: fields.join(","),
        units: "metric",
        apikey: TOMORROW_IO_API_KEY,
      },
      timeout: 10000,
    });

    const responseData = response.data?.data?.values;

    if (!responseData) {
      Logger.error(
        "[WeatherService] Invalid or empty data structure from Tomorrow.io API",
        { locationQuery, responseData: response.data }
      );
      throw new Error(
        "Invalid or empty data structure received from Tomorrow.io API"
      );
    }

    Logger.info(
      `[WeatherService] Successfully fetched real weather for: ${location}`
    );

    return {
      temperature: responseData.temperature,
      windSpeed: responseData.windSpeed,
      humidity: responseData.humidity,
      weatherCode: responseData.weatherCode,
    };
  } catch (error: any) {
    Logger.error(
      `[WeatherService] Error fetching real weather for ${locationQuery}`,
      {
        locationQuery,
        errorData: error.response?.data,
        errorMessage: error.message,
        isAxiosError: error.isAxiosError,
      }
    );

    // Rethrow a more specific error based on the type
    if (error.response) {
      throw new Error(
        `Weather API error (${error.response.status}): ${
          error.response.data?.message ||
          error.response.statusText ||
          "Unknown API error"
        }`
      );
    } else if (error.request) {
      throw new Error("Network error communicating with weather service.");
    } else {
      throw new Error(`Failed to fetch weather data: ${error.message}`);
    }
  }
};
