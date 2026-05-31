import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { HabitProvider } from "@/context/HabitContext";
import { STORAGE_KEYS } from "@/lib/storage";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Daily Habit Tracker",
  description: "Track your daily habits and build streaks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Apply the saved theme before first paint to avoid a flash of the wrong
  // theme (the ThemeToggle effect only runs after hydration).
  const themeScript = `(function(){try{var t=JSON.parse(localStorage.getItem(${JSON.stringify(
    STORAGE_KEYS.THEME
  )}));var c=document.documentElement.classList;c.remove("light","dark");c.add(t==="light"?"light":"dark");}catch(e){document.documentElement.classList.add("dark");}})();`;

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <HabitProvider>{children}</HabitProvider>
      </body>
    </html>
  );
}
