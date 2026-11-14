"use client";

import React, { useState, useEffect, useRef } from "react";
import { WardMetric } from "@/services/api";
import {
  GeoSearchResult,
  searchOpenStreetMap,
  reverseGeocode,
} from "@/lib/geoAirQuality";
import {
  Search,
  MapPin,
  Crosshair,
  X,
  Loader2,
  Building2,
  Compass,
  CheckCircle2,
  Flame,
} from "lucide-react";
import { getCategoryColor } from "@/lib/utils";

interface LocationSearchProps {
  wards: WardMetric[];
  onSelectLocation: (result: GeoSearchResult) => void;
  onClearLocation?: () => void;
  selectedLocationName?: string | null;
}

export function LocationSearch({
  wards,
  onSelectLocation,
  onClearLocation,
  selectedLocationName,
}: LocationSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [osmResults, setOsmResults] = useState<GeoSearchResult[]>([]);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter dataset wards locally
  const matchedWards = React.useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return wards
      .filter((w) => {
        const matchesName = w.ward.toLowerCase().includes(q);
        const matchesStation = w.station.toLowerCase().includes(q);
        const matchesCategory = w.category.toLowerCase().includes(q);
        return matchesName || matchesStation || matchesCategory;
      })
      .map(
        (w): GeoSearchResult => ({
          id: `ward-${w.ward}`,
          name: w.ward,
          displayName: `${w.station} • PM2.5: ${w.avg_pm25} µg/m³ (${w.category})`,
          lat: (w.latitude as number) || 19.076,
          lon: (w.longitude as number) || 72.8777,
          type: "ward",
          wardData: w,
          category: w.category,
          pm25: w.avg_pm25,
        })
      );
  }, [query, wards]);

  // Debounced geocoding search via OpenStreetMap Nominatim
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (query.trim().length < 3) {
      setOsmResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    debounceTimer.current = setTimeout(async () => {
      const results = await searchOpenStreetMap(query);
      setOsmResults(results);
      setIsLoading(false);
    }, 350);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query]);

  const handleSelect = (item: GeoSearchResult) => {
    onSelectLocation(item);
    setQuery("");
    setIsOpen(false);
  };

  const handleGpsLocate = () => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser.");
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const address = await reverseGeocode(lat, lon);

        const gpsResult: GeoSearchResult = {
          id: "gps-current-location",
          name: "My Current Precise Location",
          displayName: address,
          lat,
          lon,
          type: "custom",
        };

        onSelectLocation(gpsResult);
        setGpsLoading(false);
        setIsOpen(false);
      },
      (err) => {
        setGpsLoading(false);
        setGpsError(err.message || "Could not retrieve GPS location.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  const clearSelection = () => {
    setQuery("");
    if (onClearLocation) onClearLocation();
  };

  // Top hotspot wards for quick suggest
  const topHotspots = wards.slice(0, 3);

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <div className="absolute left-3.5 text-muted pointer-events-none flex items-center">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={
            selectedLocationName
              ? `Filtered: ${selectedLocationName}`
              : "Search precise location, ward, address, or landmark..."
          }
          className="w-full pl-10 pr-24 py-2.5 rounded-2xl bg-surfaceCard border border-surfaceBorder text-xs text-foreground placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-primary shadow-lg transition-all outline-none"
        />

        {/* Action Buttons inside Input */}
        <div className="absolute right-2 flex items-center gap-1.5">
          {selectedLocationName && (
            <button
              onClick={clearSelection}
              title="Clear precise location filter"
              className="p-1 rounded-lg text-muted hover:text-foreground hover:bg-surface transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={handleGpsLocate}
            disabled={gpsLoading}
            title="Locate my exact GPS coordinates"
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary text-[11px] font-medium transition-all disabled:opacity-50"
          >
            {gpsLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Crosshair className="w-3 h-3" />
            )}
            <span className="hidden sm:inline">GPS</span>
          </button>
        </div>
      </div>

      {gpsError && (
        <div className="mt-1 text-[11px] text-danger px-2">{gpsError}</div>
      )}

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl bg-surfaceCard border border-surfaceBorder shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="max-h-80 overflow-y-auto divide-y divide-surfaceBorder/40">
            {/* 1. Quick Hotspots (if no query typed yet) */}
            {!query.trim() && topHotspots.length > 0 && (
              <div className="p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-2 flex items-center gap-1.5">
                  <Flame className="w-3 h-3 text-danger" />
                  <span>Monitored Hotspots in Active Dataset</span>
                </div>
                <div className="space-y-1">
                  {topHotspots.map((w) => {
                    const color = getCategoryColor(w.category);
                    return (
                      <button
                        key={w.ward}
                        onClick={() =>
                          handleSelect({
                            id: `ward-${w.ward}`,
                            name: w.ward,
                            displayName: `${w.station} • ${w.category}`,
                            lat: (w.latitude as number) || 19.076,
                            lon: (w.longitude as number) || 72.8777,
                            type: "ward",
                            wardData: w,
                            category: w.category,
                            pm25: w.avg_pm25,
                          })
                        }
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-surface transition-colors text-left text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          <div>
                            <span className="font-semibold text-foreground">{w.ward}</span>
                            <span className="text-muted block text-[10px]">{w.station}</span>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${color.bg} ${color.text} ${color.border}`}
                        >
                          {w.avg_pm25} µg/m³
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. Matched Dataset Wards */}
            {matchedWards.length > 0 && (
              <div className="p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-2 flex items-center gap-1.5">
                  <Building2 className="w-3 h-3 text-primary" />
                  <span>Telemetry Sensor Wards ({matchedWards.length})</span>
                </div>
                <div className="space-y-1">
                  {matchedWards.map((item) => {
                    const color = getCategoryColor(item.category || "Good");
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-surface transition-colors text-left text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          <div className="truncate">
                            <span className="font-semibold text-foreground block truncate">
                              {item.name}
                            </span>
                            <span className="text-muted text-[10px] block truncate">
                              {item.displayName}
                            </span>
                          </div>
                        </div>
                        {item.pm25 !== undefined && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border flex-shrink-0 ${color.bg} ${color.text} ${color.border}`}
                          >
                            {item.pm25} µg/m³
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. Global OpenStreetMap Results */}
            {osmResults.length > 0 && (
              <div className="p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-2 flex items-center gap-1.5">
                  <Compass className="w-3 h-3 text-cyan-400" />
                  <span>Precise Geographic Locations & Addresses ({osmResults.length})</span>
                </div>
                <div className="space-y-1">
                  {osmResults.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className="w-full flex items-start gap-2.5 p-2 rounded-xl hover:bg-surface transition-colors text-left text-xs"
                    >
                      <MapPin className="w-3.5 h-3.5 text-cyan-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-foreground block truncate">
                          {item.name}
                        </span>
                        <span className="text-muted text-[10px] block line-clamp-1">
                          {item.displayName}
                        </span>
                        <span className="text-[9px] font-mono text-muted">
                          {item.lat.toFixed(4)}°, {item.lon.toFixed(4)}°
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state when searching and no results found */}
            {query.trim().length >= 3 &&
              !isLoading &&
              matchedWards.length === 0 &&
              osmResults.length === 0 && (
                <div className="p-5 text-center text-xs text-muted">
                  No precise locations found matching &ldquo;{query}&rdquo;.
                  <p className="text-[11px] mt-1 text-muted">
                    Try searching by landmark, ward number, neighborhood, or city name.
                  </p>
                </div>
              )}
          </div>

          {/* Footer tip */}
          <div className="p-2.5 bg-surface/80 border-t border-surfaceBorder text-[10px] text-muted flex items-center justify-between">
            <span>💡 Tip: Click anywhere directly on the map to drop a pin.</span>
            <span className="text-primary font-medium">Global Geocoder Active</span>
          </div>
        </div>
      )}
    </div>
  );
}
