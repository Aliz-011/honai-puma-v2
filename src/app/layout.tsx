import type { Metadata } from "next";
import localFont from "next/font/local";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import "./globals.css";

import { QueryProvider } from "@/components/query-provider";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

const dmSans = localFont({
  src: [
    { path: './fonts/DM_Sans/static/DMSans-Thin.ttf', weight: '200', style: 'normal' },
    { path: './fonts/DM_Sans/static/DMSans-Light.ttf', weight: '300', style: 'normal' },
    { path: './fonts/DM_Sans/static/DMSans-Regular.ttf', weight: '400', style: 'normal' },
    { path: './fonts/DM_Sans/static/DMSans-Medium.ttf', weight: '500', style: 'normal' },
    { path: './fonts/DM_Sans/static/DMSans-SemiBold.ttf', weight: '600', style: 'normal' },
    { path: './fonts/DM_Sans/static/DMSans-Bold.ttf', weight: '700', style: 'normal' },
  ],
  variable: "--font-dm-sans",
});

const ibmPlexMono = localFont({
  src: [
    { path: '/fonts/IBM_Plex_Mono/IBMPlexMono-Light.ttf', weight: '300', style: 'normal' },
    { path: '/fonts/IBM_Plex_Mono/IBMPlexMono-Regular.ttf', weight: '400', style: 'normal' },
    { path: '/fonts/IBM_Plex_Mono/IBMPlexMono-Medium.ttf', weight: '500', style: 'normal' },
    { path: '/fonts/IBM_Plex_Mono/IBMPlexMono-SemiBold.ttf', weight: '600', style: 'normal' },
    { path: '/fonts/IBM_Plex_Mono/IBMPlexMono-Bold.ttf', weight: '700', style: 'normal' },
  ],
  variable: "--font-ibm-plex-mono",
})

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${dmSans.variable} ${ibmPlexMono.variable} antialiased`}
      >
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster richColors />
            <ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
