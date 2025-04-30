import React, { useState, useEffect } from "react";
import apiClient from "../api"; // Import our configured axios instance

// MUI Components
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";

// MUI Icons (Add necessary icons)
import WbSunnyIcon from "@mui/icons-material/WbSunny"; // Clear
import CloudIcon from "@mui/icons-material/Cloud"; // Cloudy variations
import GrainIcon from "@mui/icons-material/Grain"; // Rain/Drizzle
import HelpOutlineIcon from "@mui/icons-material/HelpOutline"; // Fallback
import ThermostatIcon from "@mui/icons-material/Thermostat"; // Temperature
import AirIcon from "@mui/icons-material/Air"; // Wind Speed
import WaterDropIcon from "@mui/icons-material/WaterDrop"; // Precipitation

interface WeatherData {
  temperature?: number;
  windSpeed?: number;
  precipitationIntensity?: number;
  weatherCode?: number | string; // Or appropriate type based on Tomorrow.io codes
  // Add other fields as needed from the API response
}

interface WeatherDisplayProps {
  location: string; // e.g., "London" or "40.7128,-74.0060"
}

// Helper to map weather codes to readable names (basic example)
// Based on: https://docs.tomorrow.io/reference/data-layers-weather-codes
const getWeatherDescription = (code: number | string | undefined): string => {
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

// Helper to map weather codes to MUI Icons
const getWeatherIcon = (
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

const WeatherDisplay: React.FC<WeatherDisplayProps> = ({ location }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!location) {
      setWeather(null); // Clear weather if location is cleared
      setLoading(false); // Not loading if no location
      setError(null);
      return;
    }
    const fetchWeather = async () => {
      setLoading(true);
      setError(null);
      setWeather(null);
      try {
        const encodedLocation = encodeURIComponent(location);
        const response = await apiClient.get(`/weather/${encodedLocation}`);
        setWeather(response.data);
      } catch (err: any) {
        console.error("Failed to fetch weather:", err);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to fetch weather data."
        );
      }
      setLoading(false);
    };
    fetchWeather();
  }, [location]);

  // --- Loading State ---
  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          p: 3,
          mt: 2,
          minHeight: "100px",
        }}
      >
        <CircularProgress size={24} sx={{ mr: 1 }} />
        <Typography variant="body2" color="text.secondary">
          Loading weather for {location}...
        </Typography>
      </Box>
    );
  }

  // --- Error State ---
  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!weather) {
    // Render nothing if no location or no data after loading/error checks
    return null;
  }

  // --- Success State ---
  return (
    <Grid container spacing={2} sx={{ mt: 1 }}>
      {weather.temperature !== undefined && (
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: "center", p: 2 }}>
              <Box sx={{ mb: 1 }}>
                <ThermostatIcon sx={{ fontSize: 40, color: "#ff9800" }} />
              </Box>
              <Typography
                sx={{ fontSize: 12, color: "text.secondary" }}
                gutterBottom
              >
                Temperature
              </Typography>
              <Typography variant="h6" component="div">
                {weather.temperature}°C
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      )}
      {weather.windSpeed !== undefined && (
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: "center", p: 2 }}>
              <Box sx={{ mb: 1 }}>
                <AirIcon sx={{ fontSize: 40, color: "#cfd8dc" }} />
              </Box>
              <Typography
                sx={{ fontSize: 12, color: "text.secondary" }}
                gutterBottom
              >
                Wind Speed
              </Typography>
              <Typography variant="h6" component="div">
                {weather.windSpeed} m/s
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      )}
      {weather.precipitationIntensity !== undefined && (
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: "center", p: 2 }}>
              <Box sx={{ mb: 1 }}>
                <WaterDropIcon sx={{ fontSize: 40, color: "#90caf9" }} />
              </Box>
              <Typography
                sx={{ fontSize: 12, color: "text.secondary" }}
                gutterBottom
              >
                Precipitation
              </Typography>
              <Typography variant="h6" component="div">
                {weather.precipitationIntensity} mm/hr
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      )}
      {weather.weatherCode !== undefined && (
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: "center", p: 2 }}>
              <Box sx={{ mb: 1 }}>{getWeatherIcon(weather.weatherCode)}</Box>
              <Typography
                sx={{ fontSize: 12, color: "text.secondary" }}
                gutterBottom
              >
                Condition
              </Typography>
              <Typography variant="h6" component="div">
                {getWeatherDescription(weather.weatherCode)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );
};

export default WeatherDisplay;
