import axios from "axios";
import Logger from "../utils/logger";
import { getMockWeatherResponse, mockWeatherData } from "../mocks/weather.mock";

// Environment variables and constants
const TOMORROW_IO_API_KEY = process.env.TOMORROW_IO_API_KEY;
const TOMORROW_IO_API_URL = "https://api.tomorrow.io/v4/weather/realtime";
const USE_MOCK_API = process.env.USE_MOCK_API === "true"; // Read from env again

// Interface for the expected weather data structure returned by this service
// This should match the relevant parts of the ICondition parameter
export interface WeatherData {
  temperature?: number;
  windSpeed?: number;
  precipitationIntensity?: number;
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

/**
 * Fetches real-time weather data for a given location.
 * @param location String representing the location (e.g., "London" or "40.71,-74.00")
 * @returns A Promise resolving to the WeatherData object.
 * @throws An error if fetching fails or the API key is missing (when not using mocks).
 */
export const fetchWeatherData = async (
  location: string
): Promise<WeatherData> => {
  Logger.debug(`[WeatherService] Fetching weather for location: ${location}`);

  // --- MOCK API LOGIC ---
  if (USE_MOCK_API) {
    Logger.warn(
      `[WeatherService] Using MOCK API for weather data for ${location}`
    );
    try {
      const mockResponse = getMockWeatherResponse(location);
      // Ensure the mock response structure is correct before returning
      const weatherData = mockResponse.data?.values;
      if (!weatherData) {
        Logger.error(
          "[WeatherService] Mock data generation failed or invalid structure",
          { location }
        );
        throw new Error("Mock data generation failed");
      }
      Logger.info(
        `[WeatherService] Successfully returned mock weather for: ${location}`
      );
      // Ensure the returned object conforms to WeatherData
      return {
        temperature: weatherData.temperature,
        windSpeed: weatherData.windSpeed,
        precipitationIntensity: weatherData.precipitationIntensity,
        weatherCode: weatherData.weatherCode,
      };
    } catch (mockError: any) {
      Logger.error("[WeatherService] Error processing mock weather data", {
        location,
        error: mockError.message,
      });
      throw new Error(
        `Internal server error processing mock data: ${mockError.message}`
      );
    }
  }
  // --- END MOCK API LOGIC ---

  // --- REAL API LOGIC ---
  if (!TOMORROW_IO_API_KEY) {
    Logger.error("[WeatherService] API key for Tomorrow.io is not configured.");
    throw new Error("Server configuration error: Weather API key missing.");
  }

  let locationQuery: string;
  if (isCoordinates(location)) {
    locationQuery = location;
  } else {
    locationQuery = encodeURIComponent(location);
  }

  const fields = [
    "temperature",
    "windSpeed",
    "precipitationIntensity",
    "weatherCode",
    // Add any other fields needed for alert conditions
  ];
  const units = "metric";

  try {
    const response = await axios.get(TOMORROW_IO_API_URL, {
      params: {
        location: locationQuery,
        fields: fields.join(","),
        units: units,
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
    // Map the response to our WeatherData interface
    const weatherData: WeatherData = {
      temperature: responseData.temperature,
      windSpeed: responseData.windSpeed,
      precipitationIntensity: responseData.precipitationIntensity,
      weatherCode: responseData.weatherCode,
    };
    return weatherData;
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
