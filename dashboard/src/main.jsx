import React from 'react';
import { createRoot } from 'react-dom/client';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import App from './App.jsx';
import './styles.css';

const theme = createTheme({
  palette: { primary: { main: '#326a85' }, background: { default: '#ffffff' } },
  typography: { fontFamily: 'Inter, Segoe UI, Arial, sans-serif', button: { textTransform: 'none', fontWeight: 600 } },
  shape: { borderRadius: 4 },
  components: { MuiTableCell: { styleOverrides: { head: { fontWeight: 600, backgroundColor: '#f8fafb' } } } },
});

createRoot(document.getElementById('root')).render(
  <React.StrictMode><ThemeProvider theme={theme}><CssBaseline /><App /></ThemeProvider></React.StrictMode>,
);
