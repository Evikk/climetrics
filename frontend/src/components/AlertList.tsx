import React, { useState, useEffect } from "react";
import apiClient from "../api";
import { IAlert } from "@acme/types";

// MUI Components
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";

interface AlertListProps {
  refreshKey: number; // A key that changes to trigger a refresh
}

const AlertList: React.FC<AlertListProps> = ({ refreshKey }) => {
  const [alerts, setAlerts] = useState<IAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get<IAlert[]>("/alerts");
        setAlerts(response.data);
      } catch (err: any) {
        console.error("Failed to fetch alerts:", err);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to fetch alerts."
        );
      }
      setLoading(false);
    };

    fetchAlerts();
  }, [refreshKey]); // Refetch when refreshKey changes

  const formatLocation = (location: IAlert["location"]) => {
    if (location.type === "City") {
      // Ensure value is treated as string, satisfying ReactNode requirement
      return String(location.value);
    } else if (typeof location.value === "object" && location.value !== null) {
      return `Lat: ${location.value.lat}, Lon: ${location.value.lon}`;
    }
    return "Invalid Location";
  };

  const formatCondition = (condition: IAlert["condition"]) => {
    return `${condition.parameter} ${condition.operator} ${condition.threshold}`;
  };

  const getStatusChipColor = (
    status: string
  ): "success" | "warning" | "default" => {
    switch (status) {
      case "active":
        return "success";
      case "triggered":
        return "warning";
      default:
        return "default";
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

  // --- Empty State ---
  if (alerts.length === 0) {
    return (
      <Typography
        variant="body2"
        color="text.secondary"
        align="center"
        sx={{ p: 2 }}
      >
        No alerts saved yet.
      </Typography>
    );
  }

  // --- Success State ---
  return (
    <List disablePadding>
      {alerts.map((alert, index) => (
        <React.Fragment key={alert._id}>
          <ListItem alignItems="flex-start" sx={{ py: 2 }}>
            <ListItemText
              primary={
                <Typography
                  variant="body1"
                  sx={{ fontWeight: "medium", mb: 0.5 }}
                >
                  {alert.name || `Alert #${alert._id.substring(0, 6)}...`}
                </Typography>
              }
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
                  {alert.lastCheckedAt && (
                    <Typography
                      variant="caption"
                      component="span"
                      display="block"
                      color="text.disabled"
                      sx={{ mt: 0.5 }}
                    >
                      Last Checked:{" "}
                      {new Date(alert.lastCheckedAt).toLocaleString()}
                    </Typography>
                  )}
                </React.Fragment>
              }
            />
            <Chip
              label={alert.status}
              color={getStatusChipColor(alert.status)}
              size="small"
              sx={{ ml: 2, textTransform: "capitalize" }}
            />
            {/* Optional: Add Edit/Delete Buttons here using IconButton */}
          </ListItem>
          {/* Add divider unless it's the last item */}
          {index < alerts.length - 1 && (
            <Divider variant="inset" component="li" />
          )}
        </React.Fragment>
      ))}
    </List>
  );
};

export default AlertList;
