import React, { useState, useEffect } from "react";
import { IAlert } from "@acme/types";
import apiClient from "../api";

import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

const TriggeredAlertsList: React.FC = () => {
  const [triggeredAlerts, setTriggeredAlerts] = useState<IAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTriggeredAlerts = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch from the specific endpoint for triggered alerts
        const response = await apiClient.get<IAlert[]>("/alerts/triggered");
        setTriggeredAlerts(response.data);
      } catch (err: any) {
        console.error("Failed to fetch triggered alerts:", err);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to fetch triggered alerts."
        );
      }
      setLoading(false);
    };

    fetchTriggeredAlerts();

    const intervalId = setInterval(fetchTriggeredAlerts, 20000); // Refresh every 20 seconds
    return () => clearInterval(intervalId);
  }, []);

  const formatLocation = (location: IAlert["location"]) => {
    if (location.type === "City") {
      return String(location.value);
    } else if (typeof location.value === "object" && location.value !== null) {
      return `Lat: ${location.value.lat}, Lon: ${location.value.lon}`;
    }
    return "Invalid Location";
  };

  const formatCondition = (condition: IAlert["condition"]) => {
    return `${condition.parameter} ${condition.operator} ${condition.threshold}`;
  };

  // Placeholder function for acknowledging an alert
  const handleAcknowledge = async (alertId: string) => {
    try {
      await apiClient.patch(`/alerts/${alertId}/acknowledge`);
      setTriggeredAlerts((prevAlerts) =>
        prevAlerts.filter((alert) => alert._id !== alertId)
      );
    } catch (err: any) {
      console.error(`Failed to acknowledge alert ${alertId}:`, err);
      setError(
        err.response?.data?.message ||
          err.message ||
          `Failed to acknowledge alert ${alertId}.`
      );
    }
  };

  // --- Loading State ---
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  // --- Error State ---
  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  // --- Empty State ("All Clear") ---
  if (triggeredAlerts.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          bgcolor: "success.light",
          color: "success.contrastText",
        }}
      >
        <CheckCircleOutlineIcon sx={{ mr: 1 }} />
        <Typography variant="body2" sx={{ fontWeight: "medium" }}>
          All Clear - No alerts are currently triggered.
        </Typography>
      </Paper>
    );
  }

  // --- Success State (Has Triggered Alerts) ---
  return (
    <>
      {" "}
      {/* Use Fragment as List is the main container */}
      <Typography
        variant="h6"
        component="h3"
        gutterBottom
        sx={{ display: "flex", alignItems: "center", color: "warning.main" }} // Warning color for title
      >
        <WarningAmberIcon sx={{ mr: 1 }} />
        Currently Triggered Alerts
      </Typography>
      <List disablePadding sx={{ mt: 1 }}>
        {triggeredAlerts.map((alert, index) => (
          <React.Fragment key={alert._id}>
            <ListItem
              alignItems="flex-start"
              sx={{ py: 1.5 }}
              secondaryAction={
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleAcknowledge(alert._id)}
                >
                  Acknowledge
                </Button>
              }
            >
              <ListItemText
                primary={
                  <React.Fragment>
                    {alert.name || `Alert #${alert._id.substring(0, 6)}...`}
                    <Chip
                      label={alert.status}
                      color="warning"
                      size="small"
                      sx={{ ml: 1, textTransform: "capitalize" }}
                    />
                  </React.Fragment>
                }
                primaryTypographyProps={{
                  fontWeight: "medium",
                  mb: 0.5,
                  display: "flex",
                  alignItems: "center",
                }}
                secondary={
                  <React.Fragment>
                    <Typography
                      variant="body2"
                      component="span"
                      display="block"
                      color="text.secondary"
                    >
                      Location: {formatLocation(alert.location)}
                    </Typography>
                    <Typography
                      variant="body2"
                      component="span"
                      display="block"
                      color="text.secondary"
                    >
                      Condition: {formatCondition(alert.condition)}
                    </Typography>
                    {alert.lastTriggeredAt && (
                      <Typography
                        variant="caption"
                        component="span"
                        display="block"
                        color="text.disabled"
                        sx={{ mt: 0.5 }}
                      >
                        Triggered At:{" "}
                        {new Date(alert.lastTriggeredAt).toLocaleString()}
                      </Typography>
                    )}
                  </React.Fragment>
                }
              />
            </ListItem>
            {index < triggeredAlerts.length - 1 && (
              <Divider variant="inset" component="li" />
            )}
          </React.Fragment>
        ))}
      </List>
    </>
  );
};

export default TriggeredAlertsList;
