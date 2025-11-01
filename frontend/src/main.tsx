import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import rtlPlugin from 'stylis-plugin-rtl';
import App from './App';
import './i18n/config';

// إنشاء cache للـ RTL
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [rtlPlugin],
});

// إنشاء theme بسيط بأسلوب Medium
const theme = createTheme({
  direction: 'rtl',
  palette: {
    primary: {
      main: '#000000',
      light: '#333333',
      dark: '#000000',
    },
    secondary: {
      main: '#666666',
      light: '#999999',
      dark: '#333333',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
    text: {
      primary: '#000000',
      secondary: '#666666',
    },
    divider: '#e0e0e0',
  },
  typography: {
    fontFamily: [
      'Segoe UI',
      'Tahoma',
      'Arial',
      'system-ui',
      '-apple-system',
      'BlinkMacSystemFont',
      'Roboto',
      'sans-serif'
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      color: '#000000',
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      color: '#000000',
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: '#000000',
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      color: '#333333',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      color: '#666666',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          direction: 'rtl',
          backgroundColor: '#ffffff',
        },
        '*': {
          direction: 'rtl',
        },
        html: {
          direction: 'rtl',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          textTransform: 'none',
          fontSize: '1rem',
          fontWeight: 500,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        contained: {
          backgroundColor: '#000000',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#333333',
          },
        },
        outlined: {
          borderColor: '#e0e0e0',
          color: '#000000',
          '&:hover': {
            borderColor: '#000000',
            backgroundColor: 'rgba(0,0,0,0.04)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none',
          border: '1px solid #e0e0e0',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          fontSize: '0.75rem',
        },
        filled: {
          backgroundColor: '#f5f5f5',
          color: '#333333',
        },
        outlined: {
          borderColor: '#e0e0e0',
          color: '#666666',
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          direction: 'rtl',
        },
      },
    },

    MuiStack: {
      styleOverrides: {
        root: {
          direction: 'rtl',
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          direction: 'rtl',
        },
        h1: {
          textAlign: 'center',
        },
        h2: {
          textAlign: 'center',
        },
        h3: {
          textAlign: 'right',
        },
        h4: {
          textAlign: 'right',
        },
        body1: {
          textAlign: 'right',
        },
        body2: {
          textAlign: 'right',
        },
      },
    },
  },
});

// إنشاء QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 دقائق
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </ThemeProvider>
    </CacheProvider>
  </React.StrictMode>
);