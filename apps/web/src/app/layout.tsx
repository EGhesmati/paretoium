import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Paretoium — Course Path Optimizer",
  description:
    "Multi-objective curriculum path optimizer balancing study time and cumulative difficulty.",
};

const themeInitScript = `
(function() {
  try {
    var saved = localStorage.getItem('paretoium-theme');
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full bg-[var(--bg-ground)] text-[var(--ink-primary)]">
        {children}
      </body>
    </html>
  );
}
