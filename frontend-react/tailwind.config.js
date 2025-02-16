/** @type {import('tailwindcss').Config} */
export default {
  content: [ "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",],
  theme: {
    extend: {
      fontFamily:{
        inter: ["Inter", "sans-serif"], 
      },
      colors:{
        chatgpt: {
          light: "#F7F7F8", // Chat background (light mode)
          dark: "#343541", // Background (dark mode)
          sidebar: "#ECECF1", // Sidebar (light mode)
          "sidebar-dark": "#202123", // Sidebar (dark mode)
          primary: "#202123", // Primary text (light mode)
          "primary-dark": "#ECECF1", // Primary text (dark mode)
          secondary: "#6E6E80", // Secondary text (light mode)
          "secondary-dark": "#ACACBE", // Secondary text (dark mode)
          user: "#10A37F", // User message bubble
          assistant: "#444654", // AI response bubble (dark mode)
          error: "#FF4A4A", // Error messages
        }
      }
    },
  },
  plugins: [],
}

