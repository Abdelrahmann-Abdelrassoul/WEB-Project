import { AuthProvider } from "../context/AuthContext.jsx";
import { AppProvider } from "../context/AppContext.jsx";
import { SocketProvider } from "../context/SocketContext.jsx";
import "./globals.css";
import "@flaticon/flaticon-uicons/css/all/all.css";

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
            <SocketProvider>
              {children}
            </SocketProvider>
          </AuthProvider>
        </AppProvider>
      </body>
    </html>
  );
}