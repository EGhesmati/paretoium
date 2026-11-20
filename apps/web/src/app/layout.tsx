import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Paretoium | Course Path Optimizer",
  description: "A course path optimizer balancing study time and difficulty.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
