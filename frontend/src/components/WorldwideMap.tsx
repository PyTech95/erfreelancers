import React, { useEffect, useMemo, useRef, useState } from 'react';
import { geoOrthographic, geoPath, geoGraticule10, geoDistance } from 'd3-geo';
import { feature } from 'topojson-client';
import atlas from 'world-atlas/countries-110m.json';
import { ArrowRight, Globe2, MapPin, Minus, Plus, RotateCcw, Clock, Navigation, Loader2 } from 'lucide-react';
import { apiFetch } from '../api';
import { LocationEntity, ServiceDefinition } from '../types';

interface Props { services: ServiceDefinition[]; onSelectServiceLocation: (service: ServiceDefinition, location: LocationEntity) => void; onOpenEnquiry: (serviceId?: string, locationId?: string) => void; }
interface Hub { location: LocationEntity; latitude: number; longitude: number; region: string; localSpecialists: number; }
interface UserGeo { lat: number; lng: number; label: string; country: string; }

const countries: any = feature(atlas as any, atlas.objects.countries as any);
const regions: [string, string][] = [['all', 'Worldwide'], ['india', 'India'], ['middle-east', 'Middle East'], ['europe', 'Europe'], ['americas', 'Americas'], ['apac', 'Asia Pacific']];
// [lng, lat] geographic center each region rotates to face the viewer.
const regionCenter: Record<string, [number, number]> = { india: [78, 21], 'middle-east': [51, 28], europe: [9, 50], americas: [-95, 38], apac: [110, 5] };

const W = 900, H = 620, CX = W / 2, CY = H / 2, R0 = 285;

export const WorldwideMap: React.FC<Props> = ({ services, onSelectServiceLocation, onOpenEnquiry }) => {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [region, setRegion] = useState('all');
  const [selected, setSelected] = useState('loc-city-in-delhi');
  const [zoom, setZoom] = useState(1);
  const [serviceId, setServiceId] = useState('');
  const [rotation, setRotation] = useState<[number, number]>([-78, -21]);
  const [userGeo, setUserGeo] = useState<UserGeo | null>(null);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'locating' | 'done' | 'failed'>('idle');
  const [geoPrecise, setGeoPrecise] = useState(false);
  const [precising, setPrecising] = useState(false);

  // Animation refs so the rAF loop never gets stale values.
  const rotRef = useRef<[number, number]>([-78, -21]);
  const targetRef = useRef<[number, number] | null>(null);
  const autoRef = useRef(true);
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  const load = async () => {
    setError('');
    try { const res = await apiFetch('/api/map/hubs'); if (!res.ok) throw new Error(); setData(await res.json()); }
    catch { setError('Map locations could not load. Please retry.'); }
  };

  useEffect(() => { load(); }, []);

  // Continuous rotation + smooth "fly to" tweening loop.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const cur = rotRef.current;
      const target = targetRef.current;
      if (target) {
        const dl = target[0] - cur[0], dp = target[1] - cur[1];
        if (Math.abs(dl) < 0.4 && Math.abs(dp) < 0.4) { rotRef.current = [target[0], target[1]]; targetRef.current = null; }
        else { rotRef.current = [cur[0] + dl * 0.16, cur[1] + dp * 0.16]; }
        setRotation([rotRef.current[0], rotRef.current[1]]);
      } else if (autoRef.current && !dragRef.current) {
        rotRef.current = [cur[0] - 0.24, cur[1]];
        setRotation([rotRef.current[0], rotRef.current[1]]);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // IP geolocation (no permission prompt). Spins the globe to the visitor.
  useEffect(() => {
    let cancelled = false;
    setGeoStatus('locating');
    (async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        if (!res.ok) throw new Error();
        const j = await res.json();
        if (cancelled || typeof j.latitude !== 'number' || typeof j.longitude !== 'number') throw new Error();
        const geo: UserGeo = { lat: j.latitude, lng: j.longitude, country: j.country_name || '', label: [j.city, j.country_name].filter(Boolean).join(', ') || 'your location' };
        setUserGeo(geo);
        setGeoStatus('done');
        flyTo(geo.lng, geo.lat);
      } catch { if (!cancelled) setGeoStatus('failed'); }
    })();
    return () => { cancelled = true; };
  }, []);

  const flyTo = (lng: number, lat: number, pauseAuto = true) => {
    targetRef.current = [-lng, -lat];
    if (pauseAuto) { autoRef.current = false; setTimeout(() => { autoRef.current = true; }, 6000); }
  };

  // Ask the browser for exact GPS coordinates (permission prompt) for precise nearby matching.
  const useMyPreciseLocation = () => {
    if (!navigator.geolocation) { setGeoStatus('failed'); return; }
    setPrecising(true);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        let label = 'your precise location';
        try {
          const r = await apiFetch(`/api/locations/near-me?lat=${lat}&lng=${lng}`);
          if (r.ok) { const d = await r.json(); if (d?.location?.name) label = `${d.location.name} area`; }
        } catch { /* keep default label */ }
        setUserGeo({ lat, lng, country: '', label });
        setGeoPrecise(true);
        setGeoStatus('done');
        setPrecising(false);
        flyTo(lng, lat);
      },
      () => { setPrecising(false); if (geoStatus !== 'done') setGeoStatus('failed'); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const hubs: Hub[] = data?.hubs || [];
  const visible = hubs.filter(h => region === 'all' || h.region === region);
  const active = visible.find(h => h.location.id === selected) || visible[0];
  const service = services.find(s => s.id === serviceId) || services[0];

  // When user is located, highlight & select the nearest hub.
  useEffect(() => {
    if (!userGeo || hubs.length === 0) return;
    let best = hubs[0], bestD = Infinity;
    for (const h of hubs) {
      const d = geoDistance([userGeo.lng, userGeo.lat], [h.longitude, h.latitude]);
      if (d < bestD) { bestD = d; best = h; }
    }
    setSelected(best.location.id);
  }, [userGeo, data]);

  // Top-5 hubs nearest to the visitor — these pins get an emphasized "nearby" highlight.
  const nearby = useMemo(() => {
    if (!userGeo || hubs.length === 0) return [] as { hub: Hub; km: number }[];
    return hubs
      .map(h => ({ hub: h, km: Math.round(geoDistance([userGeo.lng, userGeo.lat], [h.longitude, h.latitude]) * 6371) }))
      .sort((a, b) => a.km - b.km)
      .slice(0, 5);
  }, [userGeo, data]);
  const nearbyIds = useMemo(() => new Set(nearby.map(n => n.hub.location.id)), [nearby]);

  const projection = useMemo(
    () => geoOrthographic().rotate([rotation[0], rotation[1], 0]).scale(R0 * zoom).translate([CX, CY]).clipAngle(90),
    [rotation, zoom]
  );
  const path = geoPath(projection);
  const center: [number, number] = [-rotation[0], -rotation[1]];
  const onFront = (lng: number, lat: number) => geoDistance(center, [lng, lat]) <= Math.PI / 2 - 0.02;

  const changeRegion = (next: string) => {
    setRegion(next);
    setZoom(1);
    if (next === 'all') { autoRef.current = true; setSelected(hubs[0]?.location.id || ''); }
    else { const [lng, lat] = regionCenter[next]; flyTo(lng, lat); setSelected(hubs.find(h => h.region === next)?.location.id || ''); }
  };

  const selectHub = (h: Hub) => { setSelected(h.location.id); flyTo(h.longitude, h.latitude); };

  // Drag-to-spin.
  const onPointerDown = (e: React.PointerEvent) => { dragRef.current = { x: e.clientX, y: e.clientY }; autoRef.current = false; targetRef.current = null; (e.target as Element).setPointerCapture?.(e.pointerId); };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x, dy = e.clientY - dragRef.current.y;
    dragRef.current = { x: e.clientX, y: e.clientY };
    const k = 0.28 / zoom;
    const next: [number, number] = [rotRef.current[0] + dx * k, Math.max(-85, Math.min(85, rotRef.current[1] - dy * k))];
    rotRef.current = next; setRotation(next);
  };
  const onPointerUp = () => { dragRef.current = null; setTimeout(() => { autoRef.current = true; }, 4000); };

  const userPt = userGeo ? projection([userGeo.lng, userGeo.lat]) : null;
  const userVisible = userGeo ? onFront(userGeo.lng, userGeo.lat) : false;

  return <section id="world-map" data-testid="world-map-section" className="border-y border-slate-200 bg-slate-50 py-16 sm:py-20">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase text-emerald-700"><Globe2 size={16} />Local expertise. Global reach.</p>
          <h2 data-testid="world-map-heading" className="font-display text-2xl font-bold text-slate-900">Find your next specialist, anywhere.</h2>
          <p className="mt-3 max-w-xl text-sm text-slate-600">Spin the live globe or explore our service hubs to connect with local or remote specialists.</p>
        </div>
        <p data-testid="world-map-coverage" className="text-sm font-semibold text-slate-700">{data?.totalLocations?.toLocaleString() || '—'} directory locations · {data?.totalCountries || '—'} countries</p>
      </div>

      <div data-testid="map-region-filter" className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Map region">
        {regions.map(([id, label]) => <button key={id} data-testid={`map-region-${id}`} aria-pressed={region === id} onClick={() => changeRegion(id)} className={`rounded-lg border px-4 py-2.5 text-xs font-semibold transition-colors ${region === id ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'}`}>{label}</button>)}
        <button data-testid="map-use-precise" onClick={useMyPreciseLocation} disabled={precising} className="ml-auto flex items-center gap-1.5 rounded-lg border border-emerald-600 bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-60">{precising ? <><Loader2 size={13} className="animate-spin" />Locating…</> : <><Navigation size={13} />Use my precise location</>}</button>
        {userGeo && <button data-testid="map-locate-me" onClick={() => flyTo(userGeo.lng, userGeo.lat)} className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"><MapPin size={13} />Fly to me</button>}
      </div>

      {error && <p data-testid="map-error" role="alert" className="mb-4 text-sm text-rose-700">{error} <button data-testid="map-retry" onClick={load} className="underline">Retry</button></p>}

      <div className="grid gap-7 lg:grid-cols-[minmax(0,2fr)_minmax(270px,1fr)]">
        <div>
          <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-b from-[#0b1220] to-[#111a2e]">
            {/* detected-location badge */}
            <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur">
              {geoStatus === 'locating' && <><Loader2 size={12} className="animate-spin" /> Detecting your location…</>}
              {geoStatus === 'done' && userGeo && <span data-testid="map-detected-badge"><Navigation size={11} className="mr-1 inline text-emerald-400" />{geoPrecise ? 'Precise' : 'Detected'}: {userGeo.label}</span>}
              {geoStatus === 'failed' && <><Globe2 size={12} /> Live interactive globe</>}
            </div>

            <svg data-testid="world-map-svg" aria-label="Interactive rotating world globe with service hubs" role="img" viewBox={`0 0 ${W} ${H}`} className="block w-full cursor-grab active:cursor-grabbing touch-none"
              onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}>
              <defs>
                <radialGradient id="ocean" cx="42%" cy="38%" r="72%">
                  <stop offset="0%" stopColor="#1f3a5f" />
                  <stop offset="70%" stopColor="#12233d" />
                  <stop offset="100%" stopColor="#0a1526" />
                </radialGradient>
                <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                  <stop offset="82%" stopColor="rgba(79,70,229,0)" />
                  <stop offset="100%" stopColor="rgba(79,70,229,0.35)" />
                </radialGradient>
              </defs>

              {/* atmosphere glow */}
              <circle cx={CX} cy={CY} r={R0 * zoom + 10} fill="url(#glow)" />
              {/* ocean sphere */}
              <path d={path({ type: 'Sphere' } as any) || ''} fill="url(#ocean)" />
              <circle cx={CX} cy={CY} r={R0 * zoom} fill="none" stroke="rgba(148,197,255,0.25)" strokeWidth={1} />
              {/* graticule */}
              <path d={path(geoGraticule10()) || ''} fill="none" stroke="rgba(148,197,255,0.13)" strokeWidth={0.6} />
              {/* landmasses */}
              {countries.features.map((f: any, i: number) => (
                <path key={`country-${f.id ?? 'unknown'}-${i}`} d={path(f) || ''} fill="#25406b" stroke="#3d5c8c" strokeWidth={0.5} className="transition-colors" />
              ))}

              {/* user location marker */}
              {userPt && userVisible && (
                <g data-testid="map-user-location" transform={`translate(${userPt[0]},${userPt[1]})`}>
                  <circle r={16} fill="#10b981" opacity={0.25}>
                    <animate attributeName="r" values="9;20;9" dur="2.2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.5;0;0.5" dur="2.2s" repeatCount="indefinite" />
                  </circle>
                  <circle r={6} fill="#10b981" stroke="#fff" strokeWidth={2} />
                </g>
              )}

              {/* service hub pins (front hemisphere only) */}
              {visible.filter(h => onFront(h.longitude, h.latitude)).map(h => {
                const p = projection([h.longitude, h.latitude]); if (!p) return null;
                const isActive = active?.location.id === h.location.id;
                const isNearby = nearbyIds.has(h.location.id);
                const dotColor = isActive ? '#34d399' : isNearby ? '#fbbf24' : '#818cf8';
                const dotR = isActive ? 7 : isNearby ? 6 : 5;
                return <g key={h.location.id} data-testid={`map-pin-${h.location.slug}`} role="button" tabIndex={0} aria-label={`Select ${h.location.name}`} aria-pressed={isActive} onClick={() => selectHub(h)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectHub(h); } }} className="cursor-pointer" transform={`translate(${p[0]},${p[1]})`}>
                  <title>{h.location.name}, {h.location.countryName}{isNearby ? ' · near you' : ''}</title>
                  {isActive && <circle r={13} fill="#34d399" opacity={0.3}><animate attributeName="r" values="8;16;8" dur="1.8s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.45;0;0.45" dur="1.8s" repeatCount="indefinite" /></circle>}
                  {!isActive && isNearby && <circle r={12} fill="#fbbf24" opacity={0.3}><animate attributeName="r" values="7;15;7" dur="1.6s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.5;0;0.5" dur="1.6s" repeatCount="indefinite" /></circle>}
                  {!isActive && !isNearby && <circle r={9} fill="#818cf8" opacity={0.22}><animate attributeName="r" values="5;10;5" dur="2.6s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.3;0;0.3" dur="2.6s" repeatCount="indefinite" /></circle>}
                  <circle r={20} fill="transparent" />
                  <circle r={dotR} fill={dotColor} stroke="white" strokeWidth={2} />
                </g>;
              })}
            </svg>

            <div className="absolute bottom-3 right-3 flex rounded-lg border border-white/15 bg-white/10 shadow-sm backdrop-blur">
              {([['out', Minus, () => setZoom(z => Math.max(1, +(z - 0.4).toFixed(2))), zoom <= 1],
                 ['in', Plus, () => setZoom(z => Math.min(2.6, +(z + 0.4).toFixed(2))), zoom >= 2.6],
                 ['reset', RotateCcw, () => { setZoom(1); changeRegion('all'); }, false]] as any).map(([id, Icon, fn, disabled]: any) =>
                <button key={id} data-testid={`map-zoom-${id}`} title={`Map zoom ${id}`} aria-label={`Map zoom ${id}`} disabled={disabled} onClick={fn} className="p-2.5 text-white/80 hover:bg-white/15 disabled:opacity-30"><Icon size={16} /></button>)}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2" aria-label="Service hubs">
            {visible.map(h => <button key={h.location.id} data-testid={`map-hub-${h.location.slug}`} onClick={() => selectHub(h)} aria-pressed={active?.location.id === h.location.id} className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors ${active?.location.id === h.location.id ? 'bg-emerald-100 text-emerald-900' : 'bg-white text-slate-600 hover:bg-slate-100'}`}><MapPin size={13} />{h.location.name}</button>)}
          </div>
          <p className="mt-3 text-[11px] text-slate-500">Drag to spin the globe · auto-rotates when idle · Geography: Natural Earth. Representative service hubs, not an office-location map.</p>
        </div>

        {active && <div data-testid="map-hub-detail" className="space-y-5 py-2">
          {userGeo && <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-800"><Navigation size={13} className="mr-1 inline" />{geoPrecise ? 'Precise location active' : 'Approx. location'} · nearest hub to <strong>{userGeo.label}</strong></div>}
          {nearby.length > 0 && <div data-testid="map-nearby-panel" className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-amber-800"><MapPin size={13} />Nearby hubs</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {nearby.map(({ hub, km }) => <button key={hub.location.id} data-testid={`map-nearby-${hub.location.slug}`} onClick={() => selectHub(hub)} aria-pressed={active?.location.id === hub.location.id} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors ${active?.location.id === hub.location.id ? 'bg-emerald-600 text-white' : 'bg-white text-amber-900 border border-amber-200 hover:bg-amber-100'}`}>{hub.location.name}<span className="opacity-70">· {km.toLocaleString()} km</span></button>)}
            </div>
          </div>}
          <div><p className="text-xs font-semibold uppercase text-emerald-700">{active.location.countryName}</p><h3 data-testid="map-active-location" className="mt-2 font-display text-2xl font-bold text-slate-900">{active.location.name}</h3><p className="mt-3 flex items-center gap-2 text-sm text-slate-600"><Clock size={16} />{active.location.timezone}</p></div>
          <p data-testid="map-local-count" className="border-y border-slate-200 py-4 text-sm text-slate-600"><strong className="text-slate-900">{active.localSpecialists}</strong> approved profiles based in this location<br /><span className="mt-1 inline-block text-xs">Remote matching is available on the service page.</span></p>
          <label className="block text-sm font-semibold text-slate-700">Service<select data-testid="map-service-select" value={service?.id || ''} onChange={e => setServiceId(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm font-normal">{services.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}</select></label>
          <button data-testid="map-explore-location" disabled={!service} onClick={() => onSelectServiceLocation(service, active.location)} className="flex w-full items-center justify-between gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50">Explore {active.location.name}<ArrowRight size={17} className="shrink-0" /></button>
          <button data-testid="map-submit-brief" disabled={!service} onClick={() => onOpenEnquiry(service.id, active.location.id)} className="w-full rounded-lg border border-slate-300 bg-white py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">Request a project proposal</button>
        </div>}
      </div>
    </div>
  </section>;
};
