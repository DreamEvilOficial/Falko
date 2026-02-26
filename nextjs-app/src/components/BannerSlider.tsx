"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { sanitizeURL } from "@/lib/security";

type BannerItem = { url: string; link?: string };

interface BannerSliderProps {
  initialConfig?: Record<string, any>;
}

export default function BannerSlider({ initialConfig }: BannerSliderProps) {

  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [intervalo, setIntervalo] = useState(5000);
  const [tienda, setTienda] = useState({
    nombre:
      (initialConfig as any)?.nombre_tienda ||
      (initialConfig as any)?.tienda_nombre ||
      "URBAN",
    lema:
      (initialConfig as any)?.lema_tienda ||
      (initialConfig as any)?.tienda_lema ||
      "Streetwear — drops — fits",
  });
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const hoverRef = useRef(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    cargarConfig();
    window.addEventListener("config-updated", cargarConfig);
    return () => window.removeEventListener("config-updated", cargarConfig);
  }, []);

  async function cargarConfig() {
    try {
      const res = await fetch("/api/config");
      const data = await res.json();

      setTienda({
        nombre: data.nombre_tienda || "URBAN",
        lema: data.lema_tienda || "Streetwear — drops — fits",
      });

      if (data.slider_velocidad) setIntervalo(Number(data.slider_velocidad));

      let parsed: BannerItem[] = [];
      const raw = data.banner_urls;
      if (Array.isArray(raw)) parsed = raw;
      else if (typeof raw === "string") {
        try {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr)) parsed = arr;
        } catch {}
      }

      if (parsed.length === 0) {
        const hero =
          typeof data.hero_banner_url === "string" ? data.hero_banner_url : "";
        setBanners(
          hero
            ? [{ url: hero, link: "/productos" }]
            : [
                {
                  url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&h=900&fit=crop",
                  link: "/productos",
                },
              ]
        );
      } else {
        setBanners(
          parsed.filter(
            (b) => b && typeof b.url === "string" && b.url.trim().length
          )
        );
      }
    } catch {
      setBanners([
        {
          url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&h=900&fit=crop",
          link: "/productos",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const next = () => {
    if (banners.length <= 1) return;
    setCurrent((p) => (p + 1) % banners.length);
  };
  const prev = () => {
    if (banners.length <= 1) return;
    setCurrent((p) => (p - 1 + banners.length) % banners.length);
  };

  useEffect(() => {
    if (banners.length <= 1) return;
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    autoPlayRef.current = setInterval(() => {
      if (!hoverRef.current) next();
    }, intervalo);
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [banners.length, intervalo]);

  useEffect(() => {
    if (current >= banners.length && banners.length > 0) setCurrent(0);
  }, [banners.length]);

  if (loading)
    return (
      <div className="w-full h-[320px] md:h-[55vh] lg:h-[65vh] bg-black animate-pulse" />
    );

  return (
    <div
      className="relative w-full h-[320px] md:h-[55vh] lg:h-[65vh] max-h-[700px] overflow-hidden bg-[#05060a]"
      onMouseEnter={() => {
        hoverRef.current = true;
      }}
      onMouseLeave={() => {
        hoverRef.current = false;
      }}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        const start = touchStartX.current;
        const end = e.changedTouches[0].clientX;
        touchStartX.current = null;
        if (start === null) return;
        const delta = end - start;
        if (Math.abs(delta) > 50) {
          if (delta < 0) next();
          else prev();
        }
      }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-35 mix-blend-overlay bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.10),transparent_50%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.08),transparent_55%)]" />
      </div>

      <div className="absolute inset-0">
        {banners.map((b, i) => {
          const raw = b.link || "";
          const safeLink =
            typeof raw === "string" && raw.startsWith("/")
              ? raw
              : sanitizeURL(raw);
          return (
            <div
              key={i}
              className={`absolute inset-0 transition-opacity duration-700`}
              style={{ opacity: current === i ? 1 : 0 }}
            >
              <img
                src={b.url}
                alt=""
                className="w-full h-full object-cover"
                loading={i === 0 ? "eager" : "lazy"}
                decoding="async"
                fetchPriority={i === 0 ? "high" : "auto"}
                draggable={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/50" />
              {safeLink && (
                <a href={safeLink} className="absolute inset-0 z-10" />
              )}
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#05060a] via-[#05060a]/80 to-transparent z-10 pointer-events-none" />

      <div className="relative z-20 h-full max-w-[1400px] mx-auto px-6 md:px-10 flex items-center">
        <div className="w-full md:w-[60%] space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-accent2 shadow-[0_0_18px_rgba(0,229,255,0.45)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.35em] text-white/70">
              Envío rápido
            </span>
          </div>

          <div className="space-y-2">
            <div className="font-display text-white text-5xl md:text-7xl tracking-[0.06em] uppercase leading-none">
              {tienda.nombre}
            </div>
            <div className="text-white/70 text-sm md:text-base font-medium max-w-xl">
              {tienda.lema}
            </div>
          </div>
        </div>
      </div>

      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-4 bg-black/25 hover:bg-black/50 text-white rounded-full backdrop-blur-md z-30"
          >
            <ChevronLeft />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-black/25 hover:bg-black/50 text-white rounded-full backdrop-blur-md z-30"
          >
            <ChevronRight />
          </button>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-30">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === current ? "w-10 bg-white" : "w-2 bg-white/30"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
