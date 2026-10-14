
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";

import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";

import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

const drawerWidth = 250;
const headerHeight = 68;

const navigationItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: DashboardRoundedIcon,
  },
  {
    label: "Forms",
    path: "/forms",
    icon: DescriptionOutlinedIcon,
  },
  {
    label: "Responses",
    path: "/responses",
    icon: FactCheckOutlinedIcon,
  },
  {
    label: "Analytics",
    path: "/analytics",
    icon: BarChartOutlinedIcon,
  },
  {
    label: "Activity Logs",
    path: "/activity-logs",
    icon: HistoryOutlinedIcon,
  },
];

export default function MainLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const userName = user?.name || "User";
  const userEmail = user?.email || "";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        minWidth: 0,
        bgcolor: "#f5f7fb",
        overflowX: "clip",
      }}
    >
      {/* Top header */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          height: headerHeight,
          justifyContent: "center",
          bgcolor: "#ffffff",
          color: "#172033",
          borderBottom: "1px solid #e8edf5",
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar
          sx={{
            minHeight: `${headerHeight}px !important`,
            px: { xs: 2, sm: 3, md: 3.5 },
            gap: 1.5,
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: { xs: 16, sm: 20 },
                fontWeight: 800,
                letterSpacing: "-0.5px",
                color: "#172033",
                lineHeight: 1.3,
              }}
            >
              Dynamic Form Builder
            </Typography>

            <Typography
              sx={{
                display: { xs: "none", sm: "block" },
                color: "#8994a7",
                fontSize: 11,
                mt: 0.25,
              }}
            >
              Manage your forms and submissions
            </Typography>
          </Box>

          <Avatar
            sx={{
              width: 38,
              height: 38,
              bgcolor: "#2563eb",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: 15,
            }}
          >
            {userName.charAt(0).toUpperCase()}
          </Avatar>

          <Box
            sx={{
              display: { xs: "none", sm: "block" },
              minWidth: 0,
              maxWidth: 190,
              mr: { xs: 0, sm: 1 },
            }}
          >
            <Typography
              noWrap
              sx={{ fontSize: 13, fontWeight: 750, color: "#263247" }}
            >
              {userName}
            </Typography>

            <Typography
              noWrap
              sx={{ fontSize: 11, color: "#8994a7", mt: 0.25 }}
            >
              {userEmail}
            </Typography>
          </Box>

          <Button
            variant="outlined"
            color="error"
            onClick={handleLogout}
            startIcon={<LogoutRoundedIcon />}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              fontSize: 13,
              borderRadius: "10px",
              px: { xs: 1, sm: 1.75 },
              minWidth: "auto",
              borderColor: "#fecaca",
              "&:hover": {
                bgcolor: "#fff1f2",
                borderColor: "#f87171",
              },
            }}
          >
            <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
              Logout
            </Box>
          </Button>
        </Toolbar>
      </AppBar>

      {/* Desktop sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            top: `${headerHeight}px`,
            height: `calc(100% - ${headerHeight}px)`,
            borderRight: "1px solid #e8edf5",
            bgcolor: "#ffffff",
            overflowX: "hidden",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            minHeight: "100%",
            px: 1.5,
            py: 3,
          }}
        >
          <Typography
            sx={{
              px: 1.5,
              mb: 1.5,
              color: "#94a0b2",
              fontSize: 10.5,
              fontWeight: 800,
              letterSpacing: "1.2px",
            }}
          >
            MAIN MENU
          </Typography>

          <List disablePadding>
            {navigationItems.map((item) => {
              const active =
                location.pathname === item.path ||
                location.pathname.startsWith(`${item.path}/`);

              const Icon = item.icon;

              return (
                <ListItemButton
                  key={item.path}
                  component={NavLink}
                  to={item.path}
                  selected={active}
                  sx={{
                    minHeight: 46,
                    px: 1.5,
                    mb: 0.75,
                    borderRadius: "11px",
                    color: active ? "#1d4ed8" : "#64748b",
                    transition: "all 0.18s ease",
                    "& .MuiListItemText-primary": {
                      fontSize: 13.5,
                      fontWeight: active ? 750 : 550,
                    },
                    "&.Mui-selected": {
                      bgcolor: "#edf3ff",
                      color: "#2459d3",
                    },
                    "&.Mui-selected:hover": {
                      bgcolor: "#e4edff",
                    },
                    "&:hover": {
                      bgcolor: "#f5f7fb",
                    },
                  }}
                >
                  <Icon
                    sx={{
                      mr: 1.5,
                      fontSize: 20,
                      color: active ? "#2563eb" : "#8994a7",
                    }}
                  />

                  <ListItemText primary={item.label} />
                </ListItemButton>
              );
            })}
          </List>

          <Box sx={{ mt: 2 }}>
            <Divider sx={{ borderColor: "#edf0f5", mb: 2 }} />

            <Box
              sx={{
                mx: 0.5,
                p: 1.75,
                bgcolor: "#f7f9fc",
                border: "1px solid #edf0f5",
                borderRadius: "12px",
              }}
            >
              <Typography
                sx={{
                  color: "#526078",
                  fontWeight: 750,
                  fontSize: 12,
                  mb: 0.75,
                }}
              >
                Workspace
              </Typography>

              <Typography
                sx={{
                  color: "#8994a7",
                  fontSize: 11.5,
                  lineHeight: 1.8,
                }}
              >
                Create forms, review responses, analyze results, and track
                activity in one place.
              </Typography>
            </Box>
          </Box>
        </Box>
      </Drawer>

      {/* Main page content */}
      <Box
        component="main"
        sx={{
          ml: { xs: 0, md: `${drawerWidth}px` },
          pt: `${headerHeight}px`,
          minHeight: "100vh",
          minWidth: 0,
          width: {
            xs: "100%",
            md: `calc(100% - ${drawerWidth}px)`,
          },
          boxSizing: "border-box",
          bgcolor: "#f5f7fb",
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: "none",
            minWidth: 0,
            boxSizing: "border-box",
            px: { xs: 2, sm: 3, lg: 4 },
            py: { xs: 3, md: 3.5 },
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
