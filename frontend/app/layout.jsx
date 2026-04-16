import { AuthProvider } from "../context/AuthContext.jsx";
import { AppProvider } from "../context/AppContext.jsx";
import "./globals.css";
import "@flaticon/flaticon-uicons/css/all/all.css";
import { icons } from "lucide-react";

export const metadata = {
  title: "ClipSphere",
  description: "Share your moments",
  icons: {
    icon: "images/Small_logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-black">
        <AppProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </AppProvider>
      </body>
    </html>
  );
}