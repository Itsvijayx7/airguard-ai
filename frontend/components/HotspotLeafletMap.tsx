"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { WardMetric } from "@/services/api";
import { useApp } from "./RoleContext";
import { getCategoryColor } from "@/lib/utils";

// Dynamically import Leaflet components to avoid SSR window errors
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const CircleMarker = dynamic(
  () => import("react-leaflet").then((mod) => mod.CircleMarker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

interface HotspotLeafletMapProps {
  wards: WardMetric[];
}

export function HotspotLeafletMap({ wards }: HotspotLeafletMapProps) {
  const { setSelectedEvidenceId } = useApp();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-surfaceCard rounded-2xl text-xs text-muted">
        Loading geographic spatial renderer...
      </div>
    );
  }

  // Find center coordinate from valid wards
  const validWards = wards.filter((w) => w.latitude !== null && w.longitude !== null);
  const centerLat = validWards.length > 0 ? (validWards[0].latitude as number) : 19.0760;
  const centerLon = validWards.length > 0 ? (validWards[0].longitude as number) : 72.8777;

  const getColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case "severe":
      case "very poor":
        return "#EF4444";
      case "poor":
        return "#F59E0B";
      case "moderate":
        return "#06B6D4";
      default:
        return "#10B981";
    }
  };

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer
        center={[centerLat, centerLon]}
        zoom={12}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%", minHeight: "520px" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {validWards.map((w) => {
          const markerColor = getColor(w.category);
          return (
            <CircleMarker
              key={w.ward}
              center={[w.latitude as number, w.longitude as number]}
              radius={Math.max(Math.min(w.avg_pm25 / 4, 24), 10)}
              pathOptions={{
                color: markerColor,
                fillColor: markerColor,
                fillOpacity: 0.6,
                weight: 2,
              }}
            >
              <Popup>
                <div className="p-1 space-y-2 text-foreground font-sans text-xs">
                  <div className="font-bold text-sm text-foreground border-b border-surfaceBorder pb-1">
                    {w.ward}
                  </div>
                  <div>
                    <span className="text-muted block text-[10px]">Station</span>
                    <span className="font-medium text-foreground">{w.station}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-muted text-[10px] block">Avg PM2.5</span>
                      <span className="font-bold text-foreground text-sm" style={{ color: markerColor }}>
                        {w.avg_pm25} µg/m³
                      </span>
                    </div>
                    <div>
                      <span className="text-muted text-[10px] block">Avg PM10</span>
                      <span className="font-semibold text-foreground text-sm">
                        {w.avg_pm10} µg/m³
                      </span>
                    </div>
                  </div>
                  <div className="pt-1">
                    <span className="text-muted text-[10px] block">Air Category</span>
                    <span className="font-medium" style={{ color: markerColor }}>
                      {w.category} ({w.trend_direction})
                    </span>
                  </div>
                  <div className="pt-1">
                    <span className="text-muted text-[10px] block">Completeness</span>
                    <span className="font-medium text-foreground">{w.data_completeness}%</span>
                  </div>
                  {w.evidence_ids.length > 0 && (
                    <button
                      onClick={() => setSelectedEvidenceId(w.evidence_ids[0])}
                      className="w-full mt-2 py-1 px-2 rounded bg-surface border border-surfaceBorder text-primary font-mono text-[10px] hover:border-primary transition-colors text-center block"
                    >
                      Inspect Audit Evidence
                    </button>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
