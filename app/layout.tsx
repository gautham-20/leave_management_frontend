// src/app/layout.tsx
import { AuthProvider } from "@/context/AuthContext";
import { LeaveProvider } from "@/context/LeaveContext";
import { PolicyProvider } from "@/context/PolicyContext";
import Navbar from "@/components/Navbar";
import "./globals.css";

export const metadata = { title: "Leave Management System" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <LeaveProvider>
            {/* Inside AuthProvider so it shares the rehydrated token, and above
                the pages so every dashboard reads the same policy rows. */}
            <PolicyProvider>
              <Navbar />
              <main className="container">
                {children}
              </main>
            </PolicyProvider>
          </LeaveProvider>
        </AuthProvider>
      </body>
    </html>
  );
}