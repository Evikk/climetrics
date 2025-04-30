import React from "react";
import TriggeredAlertsList from "../components/TriggeredAlertsList";

import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";

const CurrentStatePage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        align="center"
        sx={{ mb: 4 }}
      >
        Current Alert State
      </Typography>
      <TriggeredAlertsList />
    </Container>
  );
};

export default CurrentStatePage;
