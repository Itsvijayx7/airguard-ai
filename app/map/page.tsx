"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useApp } from "@/components/RoleContext";
import { HotspotLeafletMap } from "@/components/HotspotLeafletMap";
import { LocationSearch } from "@/components/LocationSearch";
import {
  GeoSearchResult,
  PreciseAirQualityEstimate,
  interpolateAirQuality,
  reverseGeocode,
} from "@/lib/geoAirQuality";
import { WardMetric } from "@/services/api";
import {
  MapPin,
  Flame,
  Filter,
  Info,
  AlertCircle,
  ExternalLink,
  Layers,
  Crosshair,
  ShieldCheck,
  Compass,
  Sparkles,
  X,
  ArrowRight,
  MessageSquare,
} from "lucide-react";
import { getCategoryColor } from "@/lib/utils";

export default function PollutionMapPage() {
  const router = useRouter();
  const { analysis, setSelectedEvidenceId } = useApp();
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  // Precise search state
  const [selectedLocation, setSelectedLocation] = useState<GeoSearchResult | null>(null);
  const [airQualityEstimate, setAirQualityEstimate] =
    useState<PreciseAirQualityEstimate | null>(null);

  const wards = analysis?.ward_rankings || [];

  // Mapped wards vs unmapped wards
  const mappedWards = useMemo(() => {
    return wards.filter((w) => {
      const hasCoords = w.latitude !== null && w.longitude !== null;
      if (!hasCoords) return false;
      if (categoryFilter === "ALL") return true;
      return w.category.toLowerCase() === categoryFilter.toLowerCase();
    });
  }, [wards, categoryFilter]);

  const unmappedWards = useMemo(() => {
    return wards.filter((w) => w.latitude === null || w.longitude === null);
  }, [wards]);

  // Handle location selected from search bar
  const handleSelectLocation = useCallback(
    (item: GeoSearchResult) => {
      setSelectedLocation(item);
      const estimate = interpolateAirQuality(item.lat, item.lon, wards, item.displayName);
      setAirQualityEstimate(estimate);
    },
    [wards]
  );

  // Handle map click anywhere
  const handleMapClick = useCallback(
    async (lat: number, lon: number) => {
      const addr = await reverseGeocode(lat, lon);
      const clickedResult: GeoSearchResult = {
        id: `click-${Date.now()}`,
        name: `Pin at ${lat.toFixed(4)}°, ${lon.toFixed(4)}°`,
        displayName: addr,
        lat,
        lon,
        type: "custom",
      };
      setSelectedLocation(clickedResult);
      const estimate = interpolateAirQuality(lat, lon, wards, addr);
      setAirQualityEstimate(estimate);
    },
    [wards]
  );

  // Clear precise search selection
  const handleClearLocation = useCallback(() => {
    setSelectedLocation(null);
    setAirQualityEstimate(null);
  }, []);

  // When clicking a ward circle marker
  const handleSelectWard = useCallback(
    (w: WardMetric) => {
      if (w.latitude !== null && w.longitude !== null) {
        handleSelectLocation({
          id: `ward-${w.ward}`,
          name: w.ward,
          displayName: `${w.station} • ${w.category}`,
          lat: w.latitude,
          lon: w.longitude,
          type: "ward",
          wardData: w,
          category: w.category,
          pm25: w.avg_pm25,
        });
      }
    },
    [handleSelectLocation]
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-surfaceBorder">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <MapPin className="w-6 h-6 text-primary" />
              <span>Pollution Hotspot Spatial Intelligence Map</span>
            </h1>
            <p className="text-xs text-muted mt-1">
              Geospatial OpenStreetMap telemetry with precise micro-location search & IDW air quality estimation.
            </p>
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">Filter Severity:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-surfaceCard border border-surfaceBorder text-xs text-foreground outline-none focus:border-primary"
            >
              <option value="ALL">All Categories ({mappedWards.length})</option>
              <option value="Severe">Severe</option>
              <option value="Very Poor">Very Poor</option>
              <option value="Poor">Poor</option>
              <option value="Moderate">Moderate</option>
              <option value="Good">Good</option>
            </select>
          </div>
        </div>

        {/* Precise Location Search Bar Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-surfaceCard border border-surfaceBorder shadow-md">
          <div className="flex-1">
            <LocationSearch
              wards={mappedWards}
              onSelectLocation={handleSelectLocation}
              onClearLocation={handleClearLocation}
              selectedLocationName={selectedLocation?.name}
            />
          </div>

          <div className="flex items-center gap-2 text-[11px] text-muted self-end sm:self-center">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-surface border border-surfaceBorder">
              <Crosshair className="w-3 h-3 text-primary" />
              <span>Click anywhere on map to pin</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-surface border border-surfaceBorder">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>IDW Spatial Model</span>
            </span>
          </div>
        </div>

        {/* Map Container + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Leaflet Map (3 columns) */}
          <div className="lg:col-span-3 h-[560px] rounded-2xl overflow-hidden border border-surfaceBorder shadow-2xl relative">
            <HotspotLeafletMap
              wards={mappedWards}
              selectedPreciseLocation={selectedLocation}
              airQualityEstimate={airQualityEstimate}
              onMapClick={handleMapClick}
              onSelectWard={handleSelectWard}
            />
          </div>

          {/* Map Sidebar: Conditional on whether a precise location is targeted */}
          <div className="space-y-5">
            {/* If precise location is targeted */}
            {selectedLocation && airQualityEstimate ? (
              <div className="p-5 rounded-2xl bg-surfaceCard border border-primary/40 shadow-glow space-y-4 animate-in fade-in duration-300">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 border-b border-surfaceBorder pb-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-primary text-[10px] font-bold uppercase tracking-wider">
                      <Crosshair className="w-3.5 h-3.5 animate-pulse" />
                      <span>Precise Location Target</span>
                    </div>
                    <h3 className="text-sm font-bold text-foreground mt-1 line-clamp-2">
                      {selectedLocation.name}
                    </h3>
                  </div>
                  <button
                    onClick={handleClearLocation}
                    title="Clear location filter"
                    className="p-1 rounded-lg text-muted hover:text-foreground hover:bg-surface"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Full Address */}
                <div className="text-[11px] text-muted line-clamp-2">
                  {airQualityEstimate.address}
                </div>

                {/* Coordinates */}
                <div className="p-2 rounded-xl bg-surface border border-surfaceBorder flex items-center justify-between text-[11px]">
                  <span className="text-muted">GIS Coordinates</span>
                  <span className="font-mono text-foreground font-medium">
                    {selectedLocation.lat.toFixed(5)}°, {selectedLocation.lon.toFixed(5)}°
                  </span>
                </div>

                {/* Air Quality Reading */}
                <div className="p-3.5 rounded-xl bg-surface border border-surfaceBorder space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted">Estimated PM2.5</span>
                    <span
                      className="text-xl font-bold"
                      style={{
                        color:
                          airQualityEstimate.category === "Severe" ||
                          airQualityEstimate.category === "Very Poor"
                            ? "#EF4444"
                            : airQualityEstimate.category === "Poor"
                            ? "#F59E0B"
                            : "#10B981",
                      }}
                    >
                      {airQualityEstimate.estimatedPm25} µg/m³
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">Estimated PM10</span>
                    <span className="font-semibold text-foreground">
                      {airQualityEstimate.estimatedPm10} µg/m³
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-surfaceBorder/50">
                    <span className="text-[11px] text-muted">Air Quality Index</span>
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                      style={{
                        backgroundColor:
                          airQualityEstimate.category === "Severe" ||
                          airQualityEstimate.category === "Very Poor"
                            ? "rgba(239, 68, 68, 0.15)"
                            : "rgba(16, 185, 129, 0.15)",
                        color:
                          airQualityEstimate.category === "Severe" ||
                          airQualityEstimate.category === "Very Poor"
                            ? "#EF4444"
                            : "#10B981",
                      }}
                    >
                      {airQualityEstimate.category}
                    </span>
                  </div>
                </div>

                {/* Proximity Ground Monitor */}
                <div className="p-3 rounded-xl bg-surface border border-surfaceBorder space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-muted text-[11px]">
                    <span className="flex items-center gap-1">
                      <Compass className="w-3 h-3 text-primary" />
                      <span>Nearest Physical Sensor</span>
                    </span>
                    <span className="font-medium text-foreground">
                      {airQualityEstimate.distanceKm} km ({airQualityEstimate.direction})
                    </span>
                  </div>
                  <div className="font-semibold text-foreground">
                    {airQualityEstimate.nearestStation}
                  </div>
                  <div className="text-[10px] text-muted">
                    {airQualityEstimate.confidenceExplanation}
                  </div>
                </div>

                {/* Recommended Civic Action */}
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 text-primary font-semibold text-[11px]">
                    <Sparkles className="w-3 h-3" />
                    <span>Recommended Intervention</span>
                  </div>
                  <p className="text-[11px] text-muted leading-relaxed">
                    {airQualityEstimate.recommendedAction}
                  </p>
                </div>

                {/* Action button: Ask AirGuard AI */}
                <button
                  onClick={() =>
                    router.push(
                      `/assistant?prompt=${encodeURIComponent(
                        `Analyze precise air quality for ${selectedLocation.name} (${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lon.toFixed(4)}) with estimated PM2.5 of ${airQualityEstimate.estimatedPm25} µg/m³.`
                      )}`
                    )
                  }
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-primary hover:bg-primary-hover text-background text-xs font-semibold shadow-glow transition-all"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Ask AI About This Location</span>
                </button>
              </div>
            ) : (
              /* Default Overview Sidebar (Severity Scale & Top Hotspot) */
              <div className="p-5 rounded-2xl bg-surfaceCard border border-surfaceBorder space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-1">
                    <Layers className="w-4 h-4 text-primary" />
                    <span>Severity Scale (PM2.5)</span>
                  </h3>
                  <p className="text-[11px] text-muted">
                    Circle radius proportional to particulate concentration
                  </p>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-surface border border-surfaceBorder">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="font-medium text-foreground">Severe</span>
                    </div>
                    <span className="text-muted font-mono">&gt; 120 µg/m³</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-surface border border-surfaceBorder">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-orange-500" />
                      <span className="font-medium text-foreground">Very Poor</span>
                    </div>
                    <span className="text-muted font-mono">91 - 120 µg/m³</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-surface border border-surfaceBorder">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-amber-500" />
                      <span className="font-medium text-foreground">Poor</span>
                    </div>
                    <span className="text-muted font-mono">61 - 90 µg/m³</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-surface border border-surfaceBorder">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-cyan-500" />
                      <span className="font-medium text-foreground">Moderate</span>
                    </div>
                    <span className="text-muted font-mono">31 - 60 µg/m³</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-surface border border-surfaceBorder">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="font-medium text-foreground">Good</span>
                    </div>
                    <span className="text-muted font-mono">0 - 30 µg/m³</span>
                  </div>
                </div>

                {/* Quick Hotspot Highlight */}
                {mappedWards.length > 0 && (
                  <div className="p-3 rounded-xl bg-danger/10 border border-danger/30 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-danger">
                      <Flame className="w-3.5 h-3.5" />
                      <span>Primary Hotspot</span>
                    </div>
                    <div className="text-sm font-bold text-foreground">
                      {mappedWards[0].ward}
                    </div>
                    <p className="text-[11px] text-muted">
                      Averaging {mappedWards[0].avg_pm25} µg/m³ across validated readings.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Unmapped Locations Section (Section 11) */}
        {unmappedWards.length > 0 && (
          <div className="p-5 rounded-2xl bg-surfaceCard border border-surfaceBorder space-y-3">
            <div className="flex items-center gap-2 text-warning">
              <AlertCircle className="w-5 h-5" />
              <h3 className="text-sm font-semibold text-foreground">
                Unmapped Monitored Wards ({unmappedWards.length})
              </h3>
            </div>
            <p className="text-xs text-muted">
              In accordance with AirGuard AI strict integrity rules, latitude and longitude coordinates are never fabricated.
              The following wards have validated measurements but lack GIS coordinates:
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-surfaceBorder text-muted text-[10px] uppercase">
                    <th className="py-2 px-3">Ward</th>
                    <th className="py-2 px-3">Station</th>
                    <th className="py-2 px-3">Avg PM2.5</th>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 px-3">Reason for Map Exclusion</th>
                    <th className="py-2 px-3 text-right">Audit Evidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surfaceBorder/40">
                  {unmappedWards.map((w) => (
                    <tr key={w.ward} className="hover:bg-surface/50">
                      <td className="py-2.5 px-3 font-medium text-foreground">{w.ward}</td>
                      <td className="py-2.5 px-3 text-muted">{w.station}</td>
                      <td className="py-2.5 px-3 font-semibold text-foreground">{w.avg_pm25} µg/m³</td>
                      <td className="py-2.5 px-3 text-muted">{w.category}</td>
                      <td className="py-2.5 px-3 text-warning text-[11px]">
                        Coordinates missing in source dataset column
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {w.evidence_ids.length > 0 && (
                          <button
                            onClick={() => setSelectedEvidenceId(w.evidence_ids[0])}
                            className="inline-flex items-center gap-1 text-primary text-[10px] font-mono hover:underline"
                          >
                            <span>{w.evidence_ids[0]}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
