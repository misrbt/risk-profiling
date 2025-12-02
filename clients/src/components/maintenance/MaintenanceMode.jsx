import React from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  LinearProgress,
} from "@mui/material";
import {
  Build as BuildIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material";
import { keyframes } from "@mui/system";

// Animation for the gear icon
const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
`;

const MaintenanceMode = () => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: 3,
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={24}
          sx={{
            padding: { xs: 4, md: 8 },
            borderRadius: 4,
            textAlign: "center",
            animation: `${pulse} 2s infinite ease-in-out`,
          }}
        >
          {/* Animated Icon */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            <Box
              sx={{
                position: "relative",
                width: 120,
                height: 120,
              }}
            >
              <BuildIcon
                sx={{
                  fontSize: 120,
                  color: "primary.main",
                  animation: `${rotate} 3s linear infinite`,
                }}
              />
            </Box>
          </Box>

          {/* Main Heading */}
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
              color: "text.primary",
              fontSize: { xs: "2rem", md: "2.5rem" },
              marginBottom: 2,
            }}
          >
            We&apos;ll Be Back Soon!
          </Typography>

          {/* Subtitle */}
          <Typography
            variant="h5"
            component="h2"
            sx={{
              color: "primary.main",
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            System Under Maintenance
          </Typography>

          {/* Loading Bar */}
          <Box sx={{ marginBottom: 4 }}>
            <LinearProgress
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: "grey.200",
                "& .MuiLinearProgress-bar": {
                  borderRadius: 4,
                  background:
                    "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
                },
              }}
            />
          </Box>

          {/* Main Message */}
          <Typography
            variant="body1"
            sx={{
              color: "text.secondary",
              fontSize: "1.1rem",
              lineHeight: 1.8,
              marginBottom: 4,
            }}
          >
            We are currently performing scheduled maintenance to improve your
            experience with the Risk Profiling System. We apologize for any
            inconvenience this may cause.
          </Typography>

          {/* Info Box */}
          <Paper
            variant="outlined"
            sx={{
              padding: 3,
              marginBottom: 4,
              backgroundColor: "#f8f9ff",
              borderLeft: "4px solid",
              borderLeftColor: "primary.main",
              borderRadius: 2,
              textAlign: "left",
            }}
          >
            <Box
              sx={{ display: "flex", alignItems: "center", marginBottom: 2 }}
            >
              <ScheduleIcon sx={{ color: "primary.main", marginRight: 1 }} />
              <Typography
                variant="h6"
                sx={{
                  color: "primary.main",
                  fontWeight: 600,
                }}
              >
                What&apos;s Happening?
              </Typography>
            </Box>
            <Typography
              variant="body2"
              sx={{ marginBottom: 1, color: "text.secondary" }}
            >
              the system developer is working on:
            </Typography>
            <Box
              component="ul"
              sx={{ paddingLeft: 3, color: "text.secondary" }}
            >
              <li>
                <Typography variant="body2">
                  System upgrades and improvements
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  User can edit risk assessment
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  Request user to edit assesment
                </Typography>
              </li>
              <li>
                <Typography variant="body2">Database optimization</Typography>
              </li>
            </Box>
          </Paper>

          {/* Closing Message */}
          <Typography
            variant="body1"
            sx={{
              color: "text.secondary",
              fontSize: "1.1rem",
              lineHeight: 1.8,
              marginBottom: 4,
            }}
          >
            We expect to be back online shortly. Thank you for your patience and
            understanding.
          </Typography>

          {/* Footer */}
          <Box
            sx={{
              marginTop: 6,
              paddingTop: 3,
              borderTop: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography
              variant="body2"
              sx={{ color: "text.secondary", marginBottom: 1 }}
            >
              If you need immediate assistance, please contact the system
              developer.
            </Typography>
            <Typography variant="body2" sx={{ color: "text.disabled" }}>
              &copy; {new Date().getFullYear()} RBT bank Inc. Risk Profiling
              System. All rights reserved.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default MaintenanceMode;
