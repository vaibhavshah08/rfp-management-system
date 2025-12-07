import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
} from "@mui/material";
import {
  Create as CreateIcon,
  Business as BusinessIcon,
  Send as SendIcon,
  Inbox as InboxIcon,
} from "@mui/icons-material";

export default function LandingPage() {
  const navigate = useNavigate();

  const menuItems = [
    {
      title: "Create RFP",
      description: "Create a new Request for Proposal using natural language. AI will structure it automatically.",
      icon: <CreateIcon sx={{ fontSize: 48 }} />,
      path: "/",
      color: "#4CAF50",
    },
    {
      title: "Vendor Details",
      description: "Manage your vendor database. Add, edit, or remove vendors.",
      icon: <BusinessIcon sx={{ fontSize: 48 }} />,
      path: "/vendors",
      color: "#2196F3",
    },
    {
      title: "View Sent Proposals",
      description: "View all RFPs that have been sent to vendors and their delivery status.",
      icon: <SendIcon sx={{ fontSize: 48 }} />,
      path: "/sent-proposals",
      color: "#FF9800",
    },
    {
      title: "View Received Proposals",
      description: "View and manage all proposals received from vendors. Edit parsed data if needed.",
      icon: <InboxIcon sx={{ fontSize: 48 }} />,
      path: "/received-proposals",
      color: "#9C27B0",
    },
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 8, textAlign: "center" }}>
        <Typography variant="h2" gutterBottom fontWeight="bold">
          RFP Management System
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph sx={{ mb: 6 }}>
          AI-Powered Request for Proposal Management
        </Typography>

        <Grid container spacing={4}>
          {menuItems.map((item) => (
            <Grid item xs={12} sm={6} md={3} key={item.path}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 6,
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1, textAlign: "center", pt: 4 }}>
                  <Box sx={{ color: item.color, mb: 2 }}>{item.icon}</Box>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.description}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: "center", pb: 3 }}>
                  <Button
                    variant="contained"
                    onClick={() => navigate(item.path)}
                    sx={{ bgcolor: item.color, "&:hover": { bgcolor: item.color, opacity: 0.9 } }}
                  >
                    Open
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
}

