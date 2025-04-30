import React, { useState } from "react";
import AlertForm from "../components/AlertForm";
import AlertList from "../components/AlertList";

import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

const AlertsPage: React.FC = () => {
  // State to trigger AlertList refresh after adding an alert
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const handleAlertCreated = () => {
    // Increment refreshKey to trigger refetch in AlertList
    setRefreshKey((prevKey) => prevKey + 1);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        align="center"
        sx={{ mb: 4 }}
      >
        Manage Alerts
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={3} sx={{ p: 3, height: "100%" }}>
            <Typography variant="h6" component="h2" gutterBottom>
              Create New Alert
            </Typography>
            <AlertForm onAlertCreated={handleAlertCreated} />
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={3} sx={{ p: 3, height: "100%" }}>
            <Typography variant="h6" component="h2" gutterBottom>
              Saved Alerts
            </Typography>

            <AlertList refreshKey={refreshKey} />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AlertsPage;
