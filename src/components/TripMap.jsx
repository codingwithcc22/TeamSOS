import { useEffect, useMemo, useState } from 'react';
import { divIcon, latLngBounds } from 'leaflet';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './TripMap.css';
import demoWalkingRoute from './demo-walking-route.json';

// Local demo landmarks only. Typed trip details never go to a geocoding service.
const LANDMARKS = [
  { name: 'The High Line', aliases: ['high line', 'the high line'], point: [40.7396, -74.0080] },
  { name: 'Brooklyn Bridge', aliases: ['brooklyn bridge'], point: [40.7122, -74.0040] },
  { name: 'Times Square', aliases: ['times square'], point: [40.7580, -73.9855] },
  { name: 'Central Park', aliases: ['central park'], point: [40.7681, -73.9819] },
  { name: 'Grand Central Terminal', aliases: ['grand central', 'grand central terminal', 'grand central station'], point: [40.7527, -73.9772] },
  { name: 'Empire State Building', aliases: ['empire state building', 'empire state'], point: [40.7484, -73.9857] },
  { name: 'Washington Square Park', aliases: ['washington square park', 'washington square'], point: [40.7308, -73.9973] },
  { name: 'Union Square', aliases: ['union square', 'union square park'], point: [40.7359, -73.9906] },
  { name: 'Battery Park', aliases: ['battery park', 'the battery'], point: [40.7033, -74.0170] },
];
// Pedestrian geometry from FOSSGIS / OSRM, based on OpenStreetMap.
// Bundle the default demo so it follows streets even when routing is offline.
const DEFAULT_ROUTE = demoWalkingRoute.coordinates.map(([lng, lat]) => [lat, lng]);
const routeCache = new Map();
let requestQueue = Promise.resolve();
function walkingRoute(a, b) {
  if (a === LANDMARKS[0] && b === LANDMARKS[1]) return Promise.resolve(DEFAULT_ROUTE);
  if (a === LANDMARKS[1] && b === LANDMARKS[0]) return Promise.resolve([...DEFAULT_ROUTE].reverse());
  if (a === b) return Promise.resolve([a.point, b.point]);
  const key = `${a.point.join(',')};${b.point.join(',')}`;
  if (!routeCache.has(key)) {
    // Serialize and space requests to respect the public service's 1 request/second limit.
    const request = requestQueue.then(async () => {
      const coords = [a, b].map(place => `${place.point[1]},${place.point[0]}`).join(';');
      const response = await fetch(`https://routing.openstreetmap.de/routed-foot/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=false`, { signal: AbortSignal.timeout(12000) });
      if (!response.ok) throw new Error('Walking route unavailable');
      const data = await response.json();
      const coordinates = data.routes?.[0]?.geometry?.coordinates;
      if (data.code !== 'Ok' || !Array.isArray(coordinates) || coordinates.length < 2 ||
        !coordinates.every(p => Array.isArray(p) && p.length >= 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]) && Math.abs(p[0]) <= 180 && Math.abs(p[1]) <= 90)) {
        throw new Error('Invalid walking route');
      }
      return coordinates.map(([lng, lat]) => [lat, lng]);
    });
    requestQueue = request.catch(() => {}).then(() => new Promise(resolve => setTimeout(resolve, 1100)));
    routeCache.set(key, request);
    request.catch(() => routeCache.delete(key));
  }
  return routeCache.get(key);
}
function resolveLandmark(value) {
  const normalized = value?.trim().toLowerCase().replace(/[.,]/g, '');
  return LANDMARKS.find(place => place.aliases.includes(normalized));
}
const startIcon = divIcon({ className: 'trip-map-marker start', html: '<span>A</span>', iconSize: [30, 30], iconAnchor: [15, 15] });
const endIcon = divIcon({ className: 'trip-map-marker destination', html: '<span>B</span>', iconSize: [30, 30], iconAnchor: [15, 15] });

function FitRoute({ points }) {
  const map = useMap();
  useEffect(() => {
    const fit = () => {
      map.invalidateSize();
      map.fitBounds(latLngBounds(points), { padding: [38, 38], maxZoom: 15, animate: false });
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map, points]);
  return null;
}

export default function TripMap({ from, to }) {
  const [tileError, setTileError] = useState(false);
  const [resolvedRoute, setResolvedRoute] = useState(null);
  const route = useMemo(() => {
    const start = resolveLandmark(from);
    const end = resolveLandmark(to);
    const fallback = !start || !end;
    const a = fallback ? LANDMARKS[0] : start;
    const b = fallback ? LANDMARKS[1] : end;
    return { a, b, fallback, bounds: [a.point, b.point] };
  }, [from, to]);
  useEffect(() => {
    let cancelled = false;
    walkingRoute(route.a, route.b).then(points => {
      if (!cancelled) setResolvedRoute({ route, points });
    }).catch(() => {
      if (!cancelled) setResolvedRoute({ route, points: null });
    });
    return () => { cancelled = true; };
  }, [route]);
  const current = resolvedRoute?.route === route ? resolvedRoute : null;
  const points = current?.points;
  const bounds = points || route.bounds;
  // Snap demo markers to the pedestrian route's endpoints, too.
  const startPoint = points?.[0] || route.a.point;
  const endPoint = points?.[points.length - 1] || route.b.point;

  return <div className="trip-map-shell">
    <div className="trip-map-labels">
      <div className="route-stop"><span className="route-pin" /><div><small>Starting at</small><strong>{from || 'Somewhere in NYC'}</strong></div></div>
      <div className="route-stop end"><span className="route-pin" /><div><small>Heading to</small><strong>{to || 'Your next stop'}</strong></div></div>
    </div>
    <div className="trip-map-frame" role="region" aria-label="Interactive NYC demo route map">
      <MapContainer center={[40.735, -74.002]} zoom={13} className="trip-map-canvas" scrollWheelZoom={false} dragging touchZoom doubleClickZoom keyboard>
        <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          eventHandlers={{ tileerror: () => setTileError(true), load: () => setTileError(false) }} />
        {points && <>
          <Polyline positions={points} pathOptions={{ color: '#ffffff', weight: 9, opacity: 0.95 }} />
          <Polyline positions={points} pathOptions={{ color: '#1b3a6b', weight: 5, lineCap: 'round' }}>
            <Popup>Demo walking route following mapped pedestrian paths. Not live navigation.</Popup>
          </Polyline>
        </>}
        <Marker position={startPoint} icon={startIcon} title={`Starting point: ${route.a.name}`}><Popup><strong>A · {route.a.name}</strong><br />Demo starting point</Popup></Marker>
        <Marker position={endPoint} icon={endIcon} title={`Destination: ${route.b.name}`}><Popup><strong>B · {route.b.name}</strong><br />Demo destination</Popup></Marker>
        <FitRoute points={bounds} />
      </MapContainer>
      <span className="trip-map-badge">Demo walking route</span>
    </div>
    <p className="trip-map-note" role="status">{!current ? 'Finding a mapped walking route…' : points ? 'Demo route follows mapped walking paths; not live navigation.' : 'Walking route unavailable. Only endpoints are shown.'}{route.fallback && ` Sample points: ${route.a.name} → ${route.b.name}.`}{from && route.fallback && ' One or both entries are outside the local demo landmark list; markers do not represent your typed locations.'} Routing: <a href="https://routing.openstreetmap.de/about.html" target="_blank" rel="noreferrer">FOSSGIS / OSRM</a> · <a href="https://www.openstreetmap.org/" target="_blank" rel="noreferrer">Fix the map</a>.</p>
    {tileError && <p className="trip-map-note" role="status">Map tiles are unavailable. Demo markers and route remain visible; check your internet connection.</p>}
  </div>;
}
