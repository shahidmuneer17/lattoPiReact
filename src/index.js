import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Tailwind directives included
import App from './App'; // We will use App.jsx
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
