import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

// Add CSS variables for the TextEditor component
document.documentElement.style.setProperty('--primary', '#4a90e2');
document.documentElement.style.setProperty('--primary-foreground', '#ffffff');
document.documentElement.style.setProperty('--border', '#dddddd');
document.documentElement.style.setProperty('--card', '#ffffff');
document.documentElement.style.setProperty('--card-foreground', '#333333');
document.documentElement.style.setProperty('--background', '#f5f5f5');
document.documentElement.style.setProperty('--background-rgb', '245, 245, 245');
document.documentElement.style.setProperty('--muted-foreground', '#888888');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
