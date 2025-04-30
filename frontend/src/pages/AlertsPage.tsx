import React, { useState } from "react";
import AlertForm from "../components/AlertForm";
import AlertList from "../components/AlertList";

import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";

const AlertsPage: React.FC = () => {
  // State to trigger AlertList refresh after adding an alert
  const [refreshKey, setRefreshKey] = useState<number>(0);
  // State for managing the dialog visibility
  const [openDialog, setOpenDialog] = useState<boolean>(false);

  const handleAlertCreated = () => {
    // Increment refreshKey to trigger refetch in AlertList
    setRefreshKey((prevKey) => prevKey + 1);
    // Close the dialog after creation
    setOpenDialog(false);
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  return (
    <Container
      maxWidth="xl"
      sx={{
        py: 4,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          align="center"
          sx={{
            flexGrow: 1,
            m: 0,
          }}
        >
          Manage Alerts
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Create New Alert
        </Button>
      </Box>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <Paper elevation={3} sx={{ p: 3, height: "100%" }}>
            <Typography variant="h6" component="h2" gutterBottom>
              Saved Alerts
            </Typography>

            <AlertList refreshKey={refreshKey} />
          </Paper>
        </Grid>
      </Grid>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Alert</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <AlertForm onAlertCreated={handleAlertCreated} />
          </Box>
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default AlertsPage;
