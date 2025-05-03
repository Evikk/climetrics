import React, { useState, useEffect } from "react";
import apiClient from "../api";
import {
  getWeatherIcon,
  getWeatherDescription,
  DEFAULT_WEATHER_FIELDS,
} from "../utils/weatherUtils";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import ThermostatIcon from "@mui/icons-material/Thermostat"; // Temperature
import AirIcon from "@mui/icons-material/Air"; // Wind Speed
import WaterDropIcon from "@mui/icons-material/WaterDrop"; // Precipitation

interface WeatherData {
  temperature?: number;
  windSpeed?: number;
  humidity?: number;
  weatherCode?: number | string;
}

interface WeatherDisplayProps {
  location: string; // e.g., "London" or "40.7128,-74.0060"
  fields?: string[];
}

const WeatherDisplay: React.FC<WeatherDisplayProps> = ({
  location,
  fields = DEFAULT_WEATHER_FIELDS,
}) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!location) {
      setWeather(null);
      setLoading(false);
      setError(null);
      return;
    }
    const fetchWeather = async () => {
      setLoading(true);
      setError(null);
      setWeather(null);
      try {
        const encodedLocation = encodeURIComponent(location);
        const response = await apiClient.get(
          `/weather/${encodedLocation}?fields=${fields.join(",")}`
        );
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
  }, [location, fields]);

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
      {weather.humidity !== undefined && (
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
                Humidity
              </Typography>
              <Typography variant="h6" component="div">
                {weather.humidity} %
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
