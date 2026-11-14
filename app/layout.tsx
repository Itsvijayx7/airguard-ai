import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/components/RoleContext";
import { EvidenceModal } from "@/components/EvidenceModal";

export const metadata: Metadata = {
  title: "AirGuard AI — Understand the Air. Protect Your Community.",
  description: "AI-Powered Civic Intelligence Platform transforming messy environmental data into actionable local interventions.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="bg-background text-foreground min-h-screen antialiased selection:bg-primary/20 selection:text-primary">
        <AppProvider>
          {children}
          <EvidenceModal />
        </AppProvider>
      </body>
    </html>
  );
}
