import { useEffect, useRef } from "react";
import { loadGoogleMaps } from "@/lib/google-maps";
import type { Adventure } from "@/lib/queries";
import { useNavigate } from "@tanstack/react-router";

interface Props {
  adventures: Adventure[];
  center?: { lat: number; lng: number };
  zoom?: number;
  onPick?: (lat: number, lng: number) => void;
  pickerMarker?: { lat: number; lng: number } | null;
  className?: string;
}

// Höga Kusten center
const DEFAULT_CENTER = { lat: 63.1, lng: 18.4 };

export function MapView({ adventures, center, zoom = 9, onPick, pickerMarker, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    void loadGoogleMaps().then((g) => {
      if (cancelled || !ref.current) return;
      const map = new g.maps.Map(ref.current, {
        center: center ?? DEFAULT_CENTER,
        zoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          { featureType: "poi", stylers: [{ visibility: "off" }] },
        ],
      });
      mapRef.current = map;
      if (onPick) {
        map.addListener("click", (e: google.maps.MapMouseEvent) => {
          if (e.latLng) onPick(e.latLng.lat(), e.latLng.lng());
        });
      }
    }).catch((err) => console.error(err));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || typeof google === "undefined") return;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    adventures.forEach((a) => {
      if (a.lat == null || a.lng == null) return;
      const marker = new google.maps.Marker({
        position: { lat: a.lat, lng: a.lng },
        map,
        title: a.title,
      });
      marker.addListener("click", () => navigate({ to: "/aventyr/$id", params: { id: a.id } }));
      markersRef.current.push(marker);
    });
    if (pickerMarker) {
      const m = new google.maps.Marker({
        position: pickerMarker,
        map,
        animation: google.maps.Animation.DROP,
      });
      markersRef.current.push(m);
    }
  }, [adventures, pickerMarker, navigate]);

  return <div ref={ref} className={className ?? "h-[60vh] w-full"} />;
}
