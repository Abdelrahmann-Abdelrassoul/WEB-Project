import { AuthProvider } from "../context/AuthContext.jsx";
import { AppProvider } from "../context/AppContext.jsx";
import "./globals.css";

export const metadata = {
  title: "ClipSphere",
  description: "Share your moments",
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