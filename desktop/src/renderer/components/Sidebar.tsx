import React from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  IconButton,
  Typography,
  Badge,
} from '@mui/material';
import {
  Chat as ChatIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  Add as AddIcon,
} from '@mui/icons-material';

interface SidebarProps {
  isConnected: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isConnected }) => {
  const drawerWidth = 240;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <SecurityIcon color="primary" />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          SecureChat
        </Typography>
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: isConnected ? 'success.main' : 'error.main',
          }}
        />
      </Box>

      <Divider />

      <List>
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemIcon>
              <Badge badgeContent={3} color="error">
                <ChatIcon />
              </Badge>
            </ListItemIcon>
            <ListItemText primary="Chats" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            <ListItemText primary="Contacts" />
          </ListItemButton>
        </ListItem>
      </List>

      <Divider />

      <Box sx={{ p: 2 }}>
        <Typography
          variant="subtitle2"
          color="text.secondary"
          sx={{ mb: 1, display: 'flex', alignItems: 'center' }}
        >
          Recent Chats
          <IconButton size="small" sx={{ ml: 'auto' }}>
            <AddIcon fontSize="small" />
          </IconButton>
        </Typography>
        <List dense>
          {['Alice', 'Bob', 'Charlie'].map((name, index) => (
            <ListItem key={name} disablePadding>
              <ListItemButton>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      bgcolor: `hsl(${index * 120}, 70%, 50%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: 12,
                      fontWeight: 'bold',
                    }}
                  >
                    {name[0]}
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary={name}
                  secondary="Last message..."
                  secondaryTypographyProps={{
                    noWrap: true,
                    style: { maxWidth: 150 },
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      <Box sx={{ mt: 'auto' }}>
        <Divider />
        <List>
          <ListItem disablePadding>
            <ListItemButton>
              <ListItemIcon>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Settings" />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Drawer>
  );
}; 