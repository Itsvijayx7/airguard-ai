"use client";

import React, { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useApp } from "@/components/RoleContext";
import { HotspotLeafletMap } from "@/components/HotspotLeafletMap";
import {
  MapPin,
  Flame,
  Filter,
  Info,
  AlertCircle,
  ExternalLink,
  Layers,
} from "lucide-react";
import { getCategoryColor } from "@/lib/utils";

export default function PollutionMapPage() {
  const { analysis, setSelectedEvidenceId } = useApp();
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

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
              Geospatial OpenStreetMap telemetry. Only verified coordinates are plotted.
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

        {/* Map Container + Legend */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Leaflet Map (3 columns) */}
          <div className="lg:col-span-3 h-[540px] rounded-2xl overflow-hidden border border-surfaceBorder shadow-2xl relative">
            <HotspotLeafletMap wards={mappedWards} />
          </div>

          {/* Map Sidebar / Legend */}
          <div className="p-5 rounded-2xl bg-surfaceCard border border-surfaceBorder space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-1">
                <Layers className="w-4 h-4 text-primary" />
                <span>Severity Scale (PM2.5)</span>
              </h3>
              <p className="text-[11px] text-muted">Circle radius proportional to particulate concentration</p>
            </div>

            <div className="space-y-2.5 text-xs">
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
                <div className="text-sm font-bold text-foreground">{mappedWards[0].ward}</div>
                <p className="text-[11px] text-muted">
                  Averaging {mappedWards[0].avg_pm25} µg/m³ across validated readings.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Unmapped Locations Section (Requirement Section 11) */}
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
