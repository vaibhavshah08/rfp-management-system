import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import { Create as CreateIcon, Business as BusinessIcon, Home as HomeIcon, Send as SendIcon, Inbox as InboxIcon, Description as DraftIcon } from '@mui/icons-material';

import CreateRfpPage from './pages/CreateRfpPage';
import VendorListPage from './pages/VendorListPage';
import RfpDetailsPage from './pages/RfpDetailsPage';
import ProposalComparisonPage from './pages/ProposalComparisonPage';
import LandingPage from './pages/LandingPage';
import SentProposalsPage from './pages/SentProposalsPage';
import ReceivedProposalsPage from './pages/ReceivedProposalsPage';
import DraftsPage from './pages/DraftsPage';

const queryClient = new QueryClient();

const theme = createTheme({
  palette: {
    primary: {
      main: '#4CAF50',
    },
    secondary: {
      main: '#2196F3',
    },
  },
});

const drawerWidth = 240;

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/home' },
    { text: 'Create RFP', icon: <CreateIcon />, path: '/' },
    { text: 'Drafts', icon: <DraftIcon />, path: '/drafts' },
    { text: 'Vendors', icon: <BusinessIcon />, path: '/vendors' },
    { text: 'Sent Proposals', icon: <SendIcon />, path: '/sent-proposals' },
    { text: 'Received Proposals', icon: <InboxIcon />, path: '/received-proposals' },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: '1px solid rgba(0, 0, 0, 0.12)',
          },
        }}
        variant="permanent"
        anchor="left"
      >
        <Toolbar
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="h6" noWrap component="div" fontWeight="bold">
            RFP Management
          </Typography>
        </Toolbar>
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => navigate(item.path)}
                  sx={{
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'white',
                      },
                    },
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                    transition: 'all 0.2s ease-in-out',
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: location.pathname === item.path ? 'white' : 'inherit',
                      transition: 'color 0.2s ease-in-out',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          p: 3,
          width: `calc(100% - ${drawerWidth}px)`,
          minHeight: '100vh',
        }}
      >
        <Box
          key={location.pathname}
          sx={{
            animation: 'fadeIn 0.3s ease-in-out',
            '@keyframes fadeIn': {
              from: {
                opacity: 0,
                transform: 'translateY(10px)',
              },
              to: {
                opacity: 1,
                transform: 'translateY(0)',
              },
            },
          }}
        >
          <Routes location={location}>
            <Route path="/home" element={<LandingPage />} />
            <Route path="/" element={<CreateRfpPage />} />
            <Route path="/drafts" element={<DraftsPage />} />
            <Route path="/vendors" element={<VendorListPage />} />
            <Route path="/sent-proposals" element={<SentProposalsPage />} />
            <Route path="/received-proposals" element={<ReceivedProposalsPage />} />
            <Route path="/rfp/:id" element={<RfpDetailsPage />} />
            <Route path="/rfp/:id/compare" element={<ProposalComparisonPage />} />
          </Routes>
        </Box>
      </Box>
    </Box>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <AppContent />
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
