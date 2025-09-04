import React from 'react'
import { createRoot } from 'react-dom/client'
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom"
import App from './App'
import './index.css'
import { bootTheme } from "./utils/theme"

bootTheme(); // <- apply before React mounts

createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
 )
