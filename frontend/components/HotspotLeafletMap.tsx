"use client";

import React from "react";
import dynamic from "next/dynamic";
import { HotspotLeafletMapProps } from "./HotspotLeafletMapInner";

// Dynamically import Inner Leaflet Map to avoid SSR window errors
export const HotspotLeafletMap = dynamic<HotspotLeafletMapProps>(
  () => import("./HotspotLeafletMapInner").then((mod) => mod.HotspotLeafletMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[520px] flex flex-col items-center justify-center bg-surfaceCard rounded-2xl text-xs text-muted gap-2">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span>Initializing Geographic Spatial Renderer...</span>
      </div>
    ),
  }
);
