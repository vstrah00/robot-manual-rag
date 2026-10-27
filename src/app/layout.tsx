import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Classroom Rover · Manual Chat",
  description:
    "A learning project: chat with a fictional educational robot manual.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
