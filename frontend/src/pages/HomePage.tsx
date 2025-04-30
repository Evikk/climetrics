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
  // State for the location input field
  const [locationInput, setLocationInput] = useState<string>("London");
  // State for the location currently being displayed/fetched
  const [currentLocation, setCurrentLocation] = useState<string>("London");

  const handleLocationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLocationInput(event.target.value);
  };

  const handleFetchWeather = () => {
    if (locationInput.trim()) {
      setCurrentLocation(locationInput.trim());
    } else {
      // Optionally provide feedback if input is empty
      console.warn("Location input cannot be empty.");
      // Or set a default location like setCurrentLocation("London");
    }
  };

  // Style with MUI components
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {" "}
      {/* Added padding */}
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
        {" "}
        {/* Center the grid items */}
        {/* Weather Section */}
        <Grid size={{ xs: 12, md: 8, lg: 6 }}>
          {" "}
          {/* Adjusted width for better centering */} {/* Takes full width */}
          <Paper elevation={3} sx={{ p: 3 }}>
            {" "}
            {/* Card-like container */}
            <Typography variant="h6" component="h2" gutterBottom>
              Current Weather
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              {" "}
              {/* Input group */}
              <TextField
                label="Location"
                variant="outlined"
                size="small"
                value={locationInput}
                onChange={handleLocationChange}
                placeholder="Enter City or lat,lon"
                fullWidth // Takes available width
                sx={{ mr: 1 }} // Margin right
              />
              <Button variant="contained" onClick={handleFetchWeather}>
                Get Weather
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
