import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClinicDesk AI",
  description: "AI Patient Relations and CRM for Clinics",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}



