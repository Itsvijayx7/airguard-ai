"use client";

import React, { useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { WardMetric } from "@/services/api";
import { useApp } from "./RoleContext";
import { GeoSearchResult, PreciseAirQualityEstimate } from "@/lib/geoAirQuality";
import {
  MapPin,
  Crosshair,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Compass,
  Copy,
  Check,
} from "lucide-react";
import { getCategoryColor } from "@/lib/utils";

export interface HotspotLeafletMapProps {
  wards: WardMetric[];
  selectedPreciseLocation?: GeoSearchResult | null;
  airQualityEstimate?: PreciseAirQualityEstimate | null;
  onMapClick?: (lat: number, lon: number) => void;
  onSelectWard?: (ward: WardMetric) => void;
}

// Controller component to smoothly fly map to searched coordinates
function MapController({ target }: { target: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (target && !isNaN(target[0]) && !isNaN(target[1])) {
      map.flyTo(target, 14, { duration: 1.2 });
    }
  }, [target, map]);
  return null;
}

// Map click event listener
function MapClickHandler({ onClick }: { onClick?: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      if (onClick) {
        onClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

// Custom pulsing pin for searched precise location
const preciseTargetIcon = L.divIcon({
  className: "precise-location-pin",
  html: `
    <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: rgba(16, 185, 129, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="position: absolute; width: 22px; height: 22px; border-radius: 50%; background: #10B981; border: 3px solid #0b1329; box-shadow: 0 0 16px rgba(16, 185, 129, 0.9); display: flex; align-items: center; justify-content: center;">
        <div style="width: 6px; height: 6px; border-radius: 50%; background: #ffffff;"></div>
      </div>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

export function HotspotLeafletMapInner({
  wards,
  selectedPreciseLocation,
  airQualityEstimate,
  onMapClick,
  onSelectWard,
}: HotspotLeafletMapProps) {
  const { setSelectedEvidenceId } = useApp();
  const [copied, setCopied] = React.useState(false);

  // Filter valid wards with coordinates
  const validWards = useMemo(
    () => wards.filter((w) => w.latitude !== null && w.longitude !== null),
    [wards]
  );

  // Determine initial center
  const centerLat = validWards.length > 0 ? (validWards[0].latitude as number) : 19.076;
  const centerLon = validWards.length > 0 ? (validWards[0].longitude as number) : 72.8777;

  // Selected target coordinate for flyTo
  const targetCoord = useMemo<[number, number] | null>(() => {
    if (selectedPreciseLocation) {
      return [selectedPreciseLocation.lat, selectedPreciseLocation.lon];
    }
    return null;
  }, [selectedPreciseLocation]);

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

  const copyCoords = (lat: number, lon: number) => {
    navigator.clipboard.writeText(`${lat.toFixed(6)}, ${lon.toFixed(6)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

        <MapController target={targetCoord} />
        <MapClickHandler onClick={onMapClick} />

        {/* 1. Verified Telemetry Wards (Circle Markers) */}
        {validWards.map((w) => {
          const markerColor = getColor(w.category);
          const isSelected =
            selectedPreciseLocation?.type === "ward" &&
            selectedPreciseLocation.name === w.ward;

          return (
            <CircleMarker
              key={w.ward}
              center={[w.latitude as number, w.longitude as number]}
              radius={Math.max(Math.min(w.avg_pm25 / 4, 26), 11)}
              pathOptions={{
                color: isSelected ? "#FFFFFF" : markerColor,
                fillColor: markerColor,
                fillOpacity: isSelected ? 0.9 : 0.65,
                weight: isSelected ? 3 : 2,
              }}
              eventHandlers={{
                click: () => {
                  if (onSelectWard) onSelectWard(w);
                },
              }}
            >
              <Popup>
                <div className="p-1 space-y-2 text-foreground font-sans text-xs">
                  <div className="font-bold text-sm text-foreground border-b border-surfaceBorder pb-1 flex items-center justify-between">
                    <span>{w.ward}</span>
                    <span
                      className="px-2 py-0.5 rounded text-[10px] uppercase font-bold"
                      style={{ color: markerColor }}
                    >
                      {w.category}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted block text-[10px]">Monitoring Station</span>
                    <span className="font-medium text-foreground">{w.station}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-muted text-[10px] block">Avg PM2.5</span>
                      <span className="font-bold text-sm" style={{ color: markerColor }}>
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
                  <div className="pt-1 flex items-center justify-between text-[11px]">
                    <span className="text-muted">Trend</span>
                    <span className="font-medium text-foreground">{w.trend_direction}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted">Completeness</span>
                    <span className="font-medium text-foreground">{w.data_completeness}%</span>
                  </div>
                  {w.evidence_ids.length > 0 && (
                    <button
                      onClick={() => setSelectedEvidenceId(w.evidence_ids[0])}
                      className="w-full mt-2 py-1 px-2 rounded bg-surface border border-surfaceBorder text-primary font-mono text-[10px] hover:border-primary transition-colors text-center block"
                    >
                      Inspect Audit Evidence ({w.evidence_ids[0]})
                    </button>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* 2. Searched Precise Location Marker */}
        {selectedPreciseLocation && (
          <Marker
            position={[selectedPreciseLocation.lat, selectedPreciseLocation.lon]}
            icon={preciseTargetIcon}
          >
            <Popup autoPan={true}>
              <div className="p-1 space-y-2 text-foreground font-sans text-xs min-w-[240px]">
                {/* Header */}
                <div className="border-b border-surfaceBorder pb-2">
                  <div className="flex items-center gap-1.5 text-primary text-[10px] font-semibold uppercase tracking-wider">
                    <Crosshair className="w-3 h-3" />
                    <span>Precise Geographic Target</span>
                  </div>
                  <div className="font-bold text-sm text-foreground mt-0.5 line-clamp-2">
                    {selectedPreciseLocation.name}
                  </div>
                  <div className="text-[10px] text-muted flex items-center justify-between mt-1">
                    <span className="font-mono">
                      {selectedPreciseLocation.lat.toFixed(5)}°, {selectedPreciseLocation.lon.toFixed(5)}°
                    </span>
                    <button
                      onClick={() =>
                        copyCoords(selectedPreciseLocation.lat, selectedPreciseLocation.lon)
                      }
                      className="text-primary hover:underline flex items-center gap-0.5 text-[10px]"
                    >
                      {copied ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                      <span>{copied ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                </div>

                {/* Estimated Air Quality if available */}
                {airQualityEstimate && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-muted text-[10px]">Estimated Ambient PM2.5</span>
                      <span
                        className="text-base font-bold"
                        style={{ color: getColor(airQualityEstimate.category) }}
                      >
                        {airQualityEstimate.estimatedPm25} µg/m³
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted">Air Quality Status</span>
                      <span
                        className="font-bold uppercase text-[10px] px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: `${getColor(airQualityEstimate.category)}20`,
                          color: getColor(airQualityEstimate.category),
                        }}
                      >
                        {airQualityEstimate.category}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-surface border border-surfaceBorder text-[10px] space-y-1">
                      <div className="flex items-center justify-between text-muted">
                        <span>Nearest Ground Monitor</span>
                        <span className="text-foreground font-medium">
                          {airQualityEstimate.distanceKm} km ({airQualityEstimate.direction})
                        </span>
                      </div>
                      <div className="font-medium text-foreground truncate">
                        {airQualityEstimate.nearestStation} ({airQualityEstimate.nearestWard})
                      </div>
                      <div className="text-[9px] text-muted pt-0.5">
                        {airQualityEstimate.confidenceExplanation}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
