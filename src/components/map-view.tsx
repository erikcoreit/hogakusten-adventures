import { useEffect, useRef, useState } from "react";
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
  mapTypeToggle?: boolean;
  defaultMapType?: "roadmap" | "hybrid";
}

const DEFAULT_CENTER = { lat: 63.1, lng: 18.4 };

// Distinct teardrop SVG marker in the brand primary (forest green) so adventures stand out clearly.
const markerIcon = (g: typeof google) => ({
  path: "M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24c0-6.6-5.4-12-12-12z",
  fillColor: "#2f5d3a",
  fillOpacity: 1,
  strokeColor: "#f5efe0",
  strokeWeight: 2,
  scale: 1.1,
  anchor: new g.maps.Point(12, 36),
});

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function popupHtml(a: Adventure): string {
  const img = a.image_url
    ? `<img src="${escapeHtml(a.image_url)}" alt="" style="width:100%;height:110px;object-fit:cover;display:block;margin-bottom:8px;border-radius:2px"/>`
    : "";
  const meta: string[] = [];
  if (a.duration_minutes) meta.push(`${a.duration_minutes} min`);
  if (a.address) meta.push(escapeHtml(a.address));
  const metaLine = meta.length
    ? `<div style="font-size:11px;color:#666;margin-top:4px">${meta.join(" · ")}</div>`
    : "";
  const desc = a.description
    ? `<div style="font-size:12px;color:#444;margin-top:6px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">${escapeHtml(a.description)}</div>`
    : "";
  return `
    <div style="width:220px;font-family:Inter,system-ui,sans-serif">
      ${img}
      <div style="font-weight:600;font-size:14px;line-height:1.2;color:#111">${escapeHtml(a.title)}</div>
      ${metaLine}
      ${desc}
      <a data-adv-id="${escapeHtml(a.id)}" href="#" style="display:inline-block;margin-top:8px;font-size:11px;font-family:'JetBrains Mono',monospace;letter-spacing:0.05em;text-transform:uppercase;color:#2f5d3a;text-decoration:none;border-bottom:1px solid #2f5d3a;padding-bottom:1px">Visa →</a>
    </div>`;
}

export function MapView({ adventures, center, zoom = 9, onPick, pickerMarker, className, mapTypeToggle = true, defaultMapType = "roadmap" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoRef = useRef<google.maps.InfoWindow | null>(null);
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadGoogleMaps().then((g) => {
      if (cancelled || !ref.current) return;
      const map = new g.maps.Map(ref.current, {
        center: center ?? DEFAULT_CENTER,
        zoom,
        mapTypeId: defaultMapType,
        mapTypeControl: mapTypeToggle,
        mapTypeControlOptions: mapTypeToggle ? {
          style: g.maps.MapTypeControlStyle.HORIZONTAL_BAR,
          position: g.maps.ControlPosition.TOP_LEFT,
          mapTypeIds: ["roadmap", "hybrid"],
        } : undefined,
        streetViewControl: false,
        fullscreenControl: false,
        styles: defaultMapType === "roadmap" ? [
          { featureType: "poi", stylers: [{ visibility: "off" }] },
        ] : undefined,
      });
      mapRef.current = map;
      infoRef.current = new g.maps.InfoWindow();
      if (onPick) {
        map.addListener("click", (e: google.maps.MapMouseEvent) => {
          if (e.latLng) onPick(e.latLng.lat(), e.latLng.lng());
        });
      }
      setReady(true);
    }).catch((err) => console.error(err));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || typeof google === "undefined") return;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    const info = infoRef.current;
    adventures.forEach((a) => {
      if (a.lat == null || a.lng == null) return;
      const marker = new google.maps.Marker({
        position: { lat: a.lat, lng: a.lng },
        map,
        title: a.title,
        icon: onPick ? undefined : markerIcon(google),
      });
      marker.addListener("click", () => {
        if (!info) {
          navigate({ to: "/aventyr/$id", params: { id: a.id } });
          return;
        }
        info.setContent(popupHtml(a));
        info.open({ map, anchor: marker });
        // wire the "Visa" link after the DOM mounts
        google.maps.event.addListenerOnce(info, "domready", () => {
          const link = document.querySelector<HTMLAnchorElement>(`a[data-adv-id="${a.id}"]`);
          link?.addEventListener("click", (ev) => {
            ev.preventDefault();
            navigate({ to: "/aventyr/$id", params: { id: a.id } });
          });
        });
      });
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
  }, [adventures, pickerMarker, navigate, onPick, ready]);

  return <div ref={ref} className={className ?? "h-[60vh] w-full"} />;
}
