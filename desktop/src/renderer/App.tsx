import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  ThemeProvider,
  createTheme,
  CssBaseline,
  useMediaQuery,
} from '@mui/material';
import { CryptoManager } from '@securechat/shared';
import { ChatWindow } from './components/ChatWindow';
import { Sidebar } from './components/Sidebar';
import { ipcRenderer } from 'electron';

const App: React.FC = () => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [messages, setMessages] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const cryptoManager = CryptoManager.getInstance();

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersDarkMode ? 'dark' : 'light',
          primary: {
            main: '#2196f3',
          },
          secondary: {
            main: '#f50057',
          },
        },
      }),
    [prefersDarkMode]
  );

  useEffect(() => {
    const connectWebSocket = async () => {
      try {
        await cryptoManager.initialize();
        const deviceKeys = cryptoManager.getDeviceKeys();

        // In a real app, you would get these from secure storage or user login
        const userId = await ipcRenderer.invoke('secure-store-get', 'userId') || 'test-user';
        const deviceId = await ipcRenderer.invoke('secure-store-get', 'deviceId') || 'test-device';

        const ws = new WebSocket(
          `ws://localhost:8080/ws?user_id=${userId}&device_id=${deviceId}`
        );

        ws.onopen = () => {
          setIsConnected(true);
          console.log('WebSocket connected');
        };

        ws.onmessage = async (event) => {
          const data = JSON.parse(event.data);
          if (data.type === 'message') {
            // In a real app, you would decrypt the message here
            const newMessage = {
              id: Math.random().toString(),
              text: data.content,
              sender: data.from,
              timestamp: Date.now(),
            };
            setMessages((prev) => [...prev, newMessage]);
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          console.log('WebSocket disconnected');
          // Attempt to reconnect after a delay
          setTimeout(connectWebSocket, 5000);
        };

        wsRef.current = ws;
      } catch (error) {
        console.error('WebSocket connection error:', error);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const sendMessage = async (text: string, recipientId: string) => {
    if (!text.trim() || !wsRef.current || !isConnected) return;

    try {
      // In a real app, you would encrypt the message here
      const message = {
        type: 'message',
        to: recipientId,
        content: text,
      };

      wsRef.current.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          display: 'flex',
          height: '100vh',
          overflow: 'hidden',
          bgcolor: 'background.default',
        }}
      >
        <Sidebar isConnected={isConnected} />
        <Container
          maxWidth={false}
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            p: 0,
          }}
        >
          <ChatWindow
            messages={messages}
            onSendMessage={sendMessage}
            isConnected={isConnected}
          />
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default App; 