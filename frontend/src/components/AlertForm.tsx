import React, { useState } from "react";
import apiClient from "../api";

import { ILocation, ICondition } from "@acme/types";

import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Grid from "@mui/material/Grid";
import Alert from "@mui/material/Alert";
import Collapse from "@mui/material/Collapse";
import CircularProgress from "@mui/material/CircularProgress";

interface AlertFormData {
  name?: string;
  location: ILocation;
  condition: ICondition;
}

interface AlertFormProps {
  onAlertCreated: () => void;
}

const AlertForm: React.FC<AlertFormProps> = ({ onAlertCreated }) => {
  const [name, setName] = useState<string>("");
  const [locationType, setLocationType] = useState<"City" | "Coordinates">(
    "City"
  );
  const [locationValue, setLocationValue] = useState<string>("");
  const [lat, setLat] = useState<string>("");
  const [lon, setLon] = useState<string>("");
  const [parameter, setParameter] =
    useState<ICondition["parameter"]>("temperature");
  const [operator, setOperator] = useState<ICondition["operator"]>(">");
  const [threshold, setThreshold] = useState<string>("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    let locationInput: ILocation;
    if (locationType === "City") {
      if (!locationValue.trim()) {
        setError("City name cannot be empty.");
        setSubmitting(false);
        return;
      }
      locationInput = { type: "City", value: locationValue.trim() };
    } else {
      const latNum = parseFloat(lat);
      const lonNum = parseFloat(lon);
      if (isNaN(latNum) || isNaN(lonNum)) {
        setError("Latitude and Longitude must be valid numbers.");
        setSubmitting(false);
        return;
      }
      locationInput = {
        type: "Coordinates",
        value: { lat: latNum, lon: lonNum },
      };
    }

    const thresholdNum = parseFloat(threshold);
    if (isNaN(thresholdNum)) {
      setError("Threshold must be a valid number.");
      setSubmitting(false);
      return;
    }

    const newAlertData: AlertFormData = {
      name: name.trim() || undefined,
      location: locationInput,
      condition: {
        parameter,
        operator,
        threshold: thresholdNum,
      },
    };

    try {
      await apiClient.post("/alerts", newAlertData);
      setSuccess("Alert created successfully!");
      // Clear form
      setName("");
      setLocationValue("");
      setLat("");
      setLon("");
      setThreshold("");
      setParameter("temperature");
      setOperator(">");
      setLocationType("City");
      onAlertCreated();
      // Hide success message after a delay
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Failed to create alert:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to create alert."
      );
    }
    setSubmitting(false);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
      <Collapse in={!!error}>
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      </Collapse>
      <Collapse in={!!success}>
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      </Collapse>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <TextField
            label="Name (Optional)"
            variant="outlined"
            size="small"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={submitting}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Location Type</InputLabel>
            <Select
              value={locationType}
              label="Location Type"
              onChange={(e: SelectChangeEvent) =>
                setLocationType(e.target.value as typeof locationType)
              }
              disabled={submitting}
            >
              <MenuItem value="City">City</MenuItem>
              <MenuItem value="Coordinates">Coordinates</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {locationType === "City" ? (
          <Grid size={{ xs: 12, sm: 8 }}>
            <TextField
              label="City Name"
              variant="outlined"
              size="small"
              fullWidth
              required
              value={locationValue}
              onChange={(e) => setLocationValue(e.target.value)}
              disabled={submitting}
              placeholder="e.g., Paris"
            />
          </Grid>
        ) : (
          <React.Fragment>
            <Grid size={{ xs: 6, sm: 4 }}>
              <TextField
                label="Latitude"
                variant="outlined"
                size="small"
                fullWidth
                required
                type="number"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                disabled={submitting}
                placeholder="e.g., 40.71"
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <TextField
                label="Longitude"
                variant="outlined"
                size="small"
                fullWidth
                required
                type="number"
                value={lon}
                onChange={(e) => setLon(e.target.value)}
                disabled={submitting}
                placeholder="e.g., -74.00"
              />
            </Grid>
          </React.Fragment>
        )}

        <Grid size={{ xs: 12, sm: 4 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Parameter</InputLabel>
            <Select
              value={parameter}
              label="Parameter"
              onChange={(e: SelectChangeEvent) =>
                setParameter(e.target.value as typeof parameter)
              }
              disabled={submitting}
            >
              <MenuItem value="temperature">Temperature</MenuItem>
              <MenuItem value="windSpeed">Wind Speed</MenuItem>
              <MenuItem value="precipitation">Precipitation</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Operator</InputLabel>
            <Select
              value={operator}
              label="Operator"
              onChange={(e: SelectChangeEvent) =>
                setOperator(e.target.value as typeof operator)
              }
              disabled={submitting}
            >
              <MenuItem value=">">&gt;</MenuItem>
              <MenuItem value="<">&lt;</MenuItem>
              <MenuItem value=">=">&gt;=</MenuItem>
              <MenuItem value="<=">&lt;=</MenuItem>
              <MenuItem value="=">=</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <TextField
            label="Threshold"
            variant="outlined"
            size="small"
            fullWidth
            required
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            disabled={submitting}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={submitting}
            fullWidth
            sx={{ mt: 1 }}
          >
            {submitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Create Alert"
            )}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AlertForm;
