import React, { useState } from "react";
import WeatherDisplay from "../components/WeatherDisplay";

// Import MUI components
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";

const HomePage: React.FC = () => {
  const [locationInput, setLocationInput] = useState<string>("London");
  const [currentLocation, setCurrentLocation] = useState<string>("London");

  const handleLocationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLocationInput(event.target.value);
  };

  const handleFetchWeather = () => {
    if (locationInput.trim()) {
      setCurrentLocation(locationInput.trim());
    } else {
      console.warn("Location input cannot be empty.");
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        align="center"
        sx={{ mb: 4 }}
      >
        Weather Dashboard
      </Typography>
      <Grid container spacing={3} justifyContent="center">
        <Grid size={{ xs: 12, md: 8, lg: 6 }}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" component="h2" gutterBottom>
              Current Weather
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <TextField
                label="Location"
                variant="outlined"
                size="small"
                value={locationInput}
                onChange={handleLocationChange}
                placeholder="Enter City or lat,lon"
                fullWidth
                sx={{ mr: 1 }}
              />
              <Button
                variant="contained"
                onClick={handleFetchWeather}
                size="medium"
              >
                Get
              </Button>
            </Box>
            <WeatherDisplay location={currentLocation} />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default HomePage;
