import React from "react";
import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Keyboard } from "@capacitor/keyboard";
import App from "./App.tsx";
import "./index.css";

// Apply theme from localStorage on initial load
const storedTheme = localStorage.getItem('theme');
const prefersDark = storedTheme === 'dark' || (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);

if (prefersDark) {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

// Initialize Capacitor plugins
async function initializeApp() {
  if (Capacitor.isNativePlatform()) {
    // Configure status bar
    try {
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#1a1a2e' });
    } catch (e) {
      console.log('StatusBar not available:', e);
    }

    // Configure keyboard
    try {
      Keyboard.setAccessoryBarVisible({ isVisible: false });
      Keyboard.setScroll({ isDisabled: false });
    } catch (e) {
      console.log('Keyboard not available:', e);
    }

    // Hide splash screen after app is ready
    setTimeout(async () => {
      try {
        await SplashScreen.hide();
      } catch (e) {
        console.log('SplashScreen not available:', e);
      }
    }, 500);
  }
}

// Render the app
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Initialize native features
initializeApp();

// Register Service Worker (only for web, not native)
if (!Capacitor.isNativePlatform() && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('SW registered:', registration.scope);
      })
      .catch((error) => {
        console.log('SW registration failed:', error);
      });
  });
}
