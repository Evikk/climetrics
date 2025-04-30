import React from "react";
import { Link as RouterLink } from "react-router-dom";

// Import MUI components
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";

const NavBar: React.FC = () => {
  return (
    // AppBar provides the main bar structure and background
    <AppBar
      position="static"
      elevation={1}
      sx={{ bgcolor: "#1f2937" /* Darker gray/slate */ }}
    >
      <Toolbar>
        {/* Optional: Add a logo or title here */}
        {/* <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          WeatherApp
        </Typography> */}

        {/* Use Box to group navigation links */}
        <Box sx={{ flexGrow: 1, display: "flex", gap: 2 }}>
          <Button
            component={RouterLink}
            to="/"
            color="inherit"
            sx={{ textTransform: "none", fontWeight: "medium" }}
          >
            Home
          </Button>
          <Button
            component={RouterLink}
            to="/alerts"
            color="inherit"
            sx={{ textTransform: "none", fontWeight: "medium" }}
          >
            Alerts
          </Button>
          <Button
            component={RouterLink}
            to="/current-state"
            color="inherit"
            sx={{ textTransform: "none", fontWeight: "medium" }}
          >
            Current State
          </Button>
        </Box>

        {/* Optional: Add user/account controls on the right */}
        {/* <Button color="inherit">Login</Button> */}
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;
