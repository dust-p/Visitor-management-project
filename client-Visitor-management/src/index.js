import React from 'react';
import ReactDOM from 'react-dom/client';  // Import from 'react-dom/client' for React 18
import App from './App';
import "react-datepicker/dist/react-datepicker.css";
const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);  // Create the root with React 18 API

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);