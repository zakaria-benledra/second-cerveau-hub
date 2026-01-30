import { createRoot } from "react-dom/client";
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

createRoot(document.getElementById("root")!).render(<App />);
