import React from "react";

// MUI Icons
import WbSunnyIcon from "@mui/icons-material/WbSunny"; // Clear
import CloudIcon from "@mui/icons-material/Cloud"; // Cloudy variations
import GrainIcon from "@mui/icons-material/Grain"; // Rain/Drizzle
import HelpOutlineIcon from "@mui/icons-material/HelpOutline"; // Fallback

export const DEFAULT_WEATHER_FIELDS: string[] = [
  "temperature",
  "windSpeed",
  "humidity",
  "weatherCode",
];

export const getWeatherIcon = (
  code: number | string | undefined
): React.ReactElement => {
  const codeStr = String(code);
  switch (codeStr) {
    case "1000": // Clear
    case "1100": // Mostly Clear
      return <WbSunnyIcon sx={{ fontSize: 40, color: "#ffeb3b" }} />; // Yellow sun
    case "1001": // Cloudy
    case "1101": // Partly Cloudy
    case "1102": // Mostly Cloudy
      return <CloudIcon sx={{ fontSize: 40, color: "#bdbdbd" }} />; // Gray cloud
    case "4000": // Drizzle
    case "4001": // Rain
    case "4200": // Light Rain
    case "4201": // Heavy Rain
      return <GrainIcon sx={{ fontSize: 40, color: "#64b5f6" }} />; // Blueish rain drops
    // Add more cases for other codes (Snow, Fog, Thunderstorm etc.)
    default:
      return <HelpOutlineIcon sx={{ fontSize: 40, color: "text.secondary" }} />; // Fallback question mark
  }
};

// Helper to map weather codes to readable names (basic example)
// Based on: https://docs.tomorrow.io/reference/data-layers-weather-codes
export const getWeatherDescription = (
  code: number | string | undefined
): string => {
  const codeStr = String(code);
  // This is a very simplified mapping, the Tomorrow.io docs have many more
  const map: { [key: string]: string } = {
    "1000": "Clear",
    "1001": "Cloudy",
    "1100": "Mostly Clear",
    "1101": "Partly Cloudy",
    "1102": "Mostly Cloudy",
    "4000": "Drizzle",
    "4001": "Rain",
    "4200": "Light Rain",
    "4201": "Heavy Rain",
  };
  return map[codeStr] || `Code: ${codeStr}`; // Fallback to code
};
