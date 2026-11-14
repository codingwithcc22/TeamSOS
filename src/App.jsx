import { useEffect, useRef, useState } from 'react';
import TripMap from './components/TripMap.jsx';

const Icon = ({ name, ...props }) => {
  const paths = {
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
    pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    moon: <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    check: <><path d="m5 12 4 4L19 6" /></>,
    checkCircle: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    people: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5m0-8h.01" /></>,
    alert: <><path d="m10.3 3.9-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3.1l-8-14a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4m0 4h.01" /></>,
    route: <><circle cx="6" cy="19" r="3" /><path d="M9 19h6a3 3 0 0 0 0-6h-6a3 3 0 0 1 0-6h6" /><circle cx="18" cy="5" r="3" /></>,
    star: <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />,
    arrow: <><path d="M5 12h14m-7-7 7 7-7 7" /></>,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.6 9a7 7 0 0 1 11.6-2L20 12M4 12l2.8 5a7 7 0 0 0 11.6-2" /></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
};

const INITIAL_FORM = { from: 'The High Line', to: 'Brooklyn Bridge', arrivalTime: '', checkInMinutes: '30', shareLocation: false };
const VOLUNTEER = { name: 'Jordan Lee', initials: 'JL', rating: '4.9', completedTrips: 38 };

function Dialog({ title, subtitle, onClose, children, label }) {
  const closeRef = useRef(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => {
    closeRef.current?.focus();
    const handleKey = (event) => { if (event.key === 'Escape') onCloseRef.current(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);
  return (
    <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" aria-describedby={subtitle ? 'dialog-subtitle' : undefined}>
        <header className="dialog-head">
          <div>
            {label && <span className="eyebrow">{label}</span>}
            <h2 id="dialog-title">{title}</h2>
            {subtitle && <p id="dialog-subtitle">{subtitle}</p>}
          </div>
          <button ref={closeRef} className="close-button" onClick={onClose} aria-label="Close dialog"><Icon name="close" /></button>
        </header>
        {children}
      </section>
    </div>
  );
}

function formatTime(value) {
  if (!value) return 'Choose an arrival time';
  const [hour, minute] = value.split(':').map(Number);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date);
}

export default function App() {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('teamsos-theme') || 'light'; } catch { return 'light'; }
  });
  const [trip, setTrip] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [dialog, setDialog] = useState('');
  const [toast, setToast] = useState('');
  const [checkinTime, setCheckinTime] = useState('');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('teamsos-theme', theme); } catch { /* Theme remains usable for this visit. */ }
  }, [theme]);
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(''), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const beginTrip = (event) => {
    event.preventDefault();
    const arrival = form.arrivalTime || (() => {
      const d = new Date(Date.now() + 90 * 60 * 1000);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    })();
    setTrip({
      id: `demo-${Date.now()}`, from: form.from.trim(), to: form.to.trim(), arrivalTime: arrival,
      checkInMinutes: Number(form.checkInMinutes), shareLocation: form.shareLocation,
      status: 'matching', volunteer: VOLUNTEER, nextCheckIn: 'in 30 minutes', demo: true,
    });
    setCheckinTime('');
    setDialog('');
    setToast('Demo trip started on this device.');
  };

  const goActive = () => {
    setTrip((current) => current ? { ...current, status: 'active' } : current);
    setToast('Demo trip is underway.');
  };
  const markSafe = () => {
    setTrip((current) => current ? { ...current, status: 'safe' } : current);
    setCheckinTime(new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date()));
    setToast('You marked yourself safe.');
  };
  const endTrip = () => {
    setTrip((current) => current ? { ...current, status: 'cancelled' } : current);
    setDialog('');
    setToast('Demo trip ended.');
  };
  const startFresh = () => {
    setTrip(null);
    setForm(INITIAL_FORM);
    setDialog('');
    setToast('Ready when you are.');
  };

  const status = trip?.status || 'ready';
  const hasTrip = Boolean(trip && ['matching', 'active', 'safe'].includes(trip.status));
  const statusText = status === 'matching' ? 'Demo match ready' : status === 'active' ? 'Demo trip in progress' : status === 'safe' ? 'Marked safe' : status === 'cancelled' ? 'Trip ended' : 'Ready to go';
  const arrivalTime = trip ? formatTime(trip.arrivalTime) : '—';

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand" aria-label="TeamSOS">
          <div className="brand-mark"><Icon name="shield" /></div>
          <div><div className="brand-name">TeamSOS</div><div className="brand-caption">A little more connected out there</div></div>
        </div>
        <div className="top-actions">
          <button className="icon-button" onClick={() => setTheme((t) => t === 'light' ? 'dark' : 'light')} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}>
            <Icon name={theme === 'light' ? 'moon' : 'sun'} /><span className="theme-label">{theme === 'light' ? 'Dark mode' : 'Light mode'}</span>
          </button>
        </div>
      </header>

      <main className="page">
        <section className="intro reveal">
          <div>
            <div className="eyebrow">Your NYC walk, with a little backup</div>
            <h1>Go your own way.<br />Stay connected.</h1>
            <p className="intro-copy">A simple trip plan can make exploring alone feel a little easier. You’re in control at every step.</p>
          </div>
          <div className="city-chip"><Icon name="pin" /> New York City <span aria-hidden="true">·</span> Local preview</div>
        </section>

        <aside className="demo-banner" role="note" aria-label="Preview mode notice">
          <span className="demo-symbol" aria-hidden="true">i</span>
          <div><strong>Preview mode — this is a practice trip</strong><p>No real volunteer is assigned. Nothing is sent, and no location or alerts are shared. Your trip stays on this device.</p></div>
        </aside>

        <div className="dashboard-grid">
          <section className="panel trip-panel" aria-labelledby="trip-heading">
            <div className="panel-heading">
              <div><h2 id="trip-heading">Your trip</h2><p>Set a destination and a time that works for you.</p></div>
              <span className={`status-badge ${status}`}>{statusText}</span>
            </div>
            {hasTrip ? (
              <>
                <TripMap from={trip.from} to={trip.to} />
                <div className="trip-facts">
                  <div className="fact"><span className="fact-label"><Icon name="clock" /> Planned arrival</span><strong className="fact-value">{arrivalTime}</strong></div>
                  <div className="fact"><span className="fact-label"><Icon name="calendar" /> Check-in reminder</span><strong className="fact-value">Every {trip.checkInMinutes} minutes</strong></div>
                </div>
                {status === 'matching' && <div className="progress-line"><Icon name="info" /><div><strong>Your practice match is ready.</strong><span>Review the clearly labeled demo match, then begin your practice trip.</span></div></div>}
                {status === 'active' && <div className="progress-line"><Icon name="clock" /><div><strong>Next check-in in {trip.checkInMinutes} minutes</strong><span>This is a visual reminder only; no one will be notified.</span></div></div>}
                {status === 'safe' && <div className="safe-state"><Icon name="checkCircle" /><div><strong>You marked yourself safe{checkinTime ? ` at ${checkinTime}` : ''}.</strong><span>Nice work checking in. Your practice trip is still open until you end it.</span></div></div>}
                <div className="button-row">
                  {status === 'matching' && <button className="button" onClick={goActive}>Begin demo trip <Icon name="arrow" /></button>}
                  {status === 'active' && <button className="button secondary" onClick={markSafe}><Icon name="checkCircle" /> I’m safe</button>}
                  {status === 'safe' && <button className="button secondary" onClick={markSafe}><Icon name="checkCircle" /> Check in again</button>}
                  <button className="button outline" onClick={() => setDialog('end')}>{status === 'matching' ? 'Cancel trip' : 'End trip'}</button>
                </div>
              </>
            ) : (
              <>
                <TripMap />
                <div className="trip-facts">
                  <div className="fact"><span className="fact-label"><Icon name="clock" /> Planned arrival</span><strong className="fact-value">{status === 'cancelled' ? 'Trip ended' : 'Not set yet'}</strong></div>
                  <div className="fact"><span className="fact-label"><Icon name="calendar" /> Check-in reminder</span><strong className="fact-value">Your choice</strong></div>
                </div>
                <div className="progress-line"><Icon name="info" /><div><strong>{status === 'cancelled' ? 'Your practice trip is over.' : 'A plan, not a promise of response.'}</strong><span>Choose where you’re headed and set a check-in rhythm that feels right.</span></div></div>
                <button className="button full" onClick={() => { setForm(INITIAL_FORM); setDialog('start'); }}>
                  {status === 'cancelled' ? 'Plan another demo trip' : 'Plan a demo trip'} <Icon name="arrow" />
                </button>
              </>
            )}
          </section>

          <section className="panel volunteer-panel" aria-labelledby="match-heading">
            <div className="panel-heading">
              <div><span className="match-label">A practice match</span><h2 id="match-heading">Your demo volunteer</h2><p>For trying the experience — not a real connection.</p></div>
              {trip && <span className={`status-badge ${status}`}>DEMO</span>}
            </div>
            {hasTrip ? (
              <>
                <div className="volunteer-card">
                  <div className="volunteer-top"><div className="avatar" aria-hidden="true">{trip.volunteer.initials}</div><div><h3 className="volunteer-name">{trip.volunteer.name}</h3><p className="volunteer-caption">TeamSOS demo volunteer</p></div></div>
                  <div className="rating-row"><span className="rating-star"><Icon name="star" style={{ width: 14, height: 14, fill: 'currentColor', verticalAlign: '-2px' }} /> {trip.volunteer.rating}</span><span className="separator">·</span><span>{trip.volunteer.completedTrips} demo trips</span></div>
                </div>
                <p className="match-disclaimer"><Icon name="info" /> This profile is illustrative. Jordan is not a real volunteer and has not received your trip details.</p>
                {status === 'matching' && <button className="button full" onClick={goActive}>Continue with this demo <Icon name="arrow" /></button>}
                {status === 'active' && <div className="progress-line"><Icon name="checkCircle" /><div><strong>Practice match shown</strong><span>No contact has been made. This preview does not provide monitoring.</span></div></div>}
                {status === 'safe' && <div className="safe-state"><Icon name="checkCircle" /><div><strong>Check-in recorded on this device</strong><span>No alerts or messages were sent.</span></div></div>}
              </>
            ) : (
              <>
                <div className="empty-match">
                  <div className="empty-icon"><Icon name="people" /></div>
                  <h3>{status === 'cancelled' ? 'No active practice match' : 'Your match appears here'}</h3>
                  <p>Plan a demo trip to see how a volunteer match could look. This example is always labeled as a preview.</p>
                </div>
                <p className="match-disclaimer"><Icon name="info" /> No real volunteer is assigned in this preview.</p>
              </>
            )}
            <button className="link-button" onClick={() => setDialog('sos')}>What if I need urgent help?</button>
          </section>
        </div>

        <div className="below-grid">
          <section className="panel checkin-panel" aria-labelledby="checkin-heading">
            <div className="checkin-left"><div className="checkin-icon"><Icon name="checkCircle" /></div><div className="checkin-copy"><h2 id="checkin-heading">Check in, at your pace</h2><p>{status === 'active' ? `Your next practice check-in is in ${trip.checkInMinutes} minutes.` : 'A quick “I’m safe” can help you pause and reassess.'}</p></div></div>
            {status === 'active' ? <button className="button secondary" onClick={markSafe}>I’m safe <Icon name="check" /></button> : status === 'safe' ? <span className="checkin-time">Last check-in: {checkinTime || 'Just now'}</span> : <button className="button outline" onClick={() => setDialog('sos')}>View safety info</button>}
          </section>
          <section className="panel sos-panel" aria-labelledby="sos-heading">
            <div className="sos-copy"><div className="sos-icon"><Icon name="alert" /></div><div><h2 id="sos-heading">Need help right now?</h2><p>Know what to do in an emergency.</p></div></div>
            <button className="button sos" onClick={() => setDialog('sos')}>SOS information</button>
          </section>
        </div>
        <footer className="footer">TeamSOS preview · Your trip information stays in this browser session. <button className="link-button" onClick={() => setDialog('sos')}>Safety information</button></footer>
      </main>

      {dialog === 'start' && <Dialog title="Plan a demo trip" subtitle="A small plan for your next NYC outing. This stays on your device." label="Trip setup" onClose={() => setDialog('')}>
        <form onSubmit={beginTrip}>
          <div className="form-grid">
            <div className="field"><label htmlFor="from">Starting point</label><input id="from" required maxLength="60" value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} placeholder="e.g. The High Line" /></div>
            <div className="field"><label htmlFor="to">Destination</label><input id="to" required maxLength="60" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} placeholder="e.g. Brooklyn Bridge" /></div>
            <div className="field"><label htmlFor="arrival">Planned arrival</label><input id="arrival" type="time" value={form.arrivalTime} onChange={(e) => setForm({ ...form, arrivalTime: e.target.value })} /><span className="field-hint">Optional — defaults to about 90 minutes from now.</span></div>
            <div className="field"><label htmlFor="interval">Check-in reminder</label><select id="interval" value={form.checkInMinutes} onChange={(e) => setForm({ ...form, checkInMinutes: e.target.value })}><option value="15">Every 15 minutes</option><option value="30">Every 30 minutes</option><option value="45">Every 45 minutes</option><option value="60">Every hour</option></select></div>
            <div className="toggle-row"><span><strong>Location sharing</strong><span>Unavailable in preview. Your location is never shared.</span></span><input className="switch" id="share-location" type="checkbox" disabled checked={false} aria-label="Location sharing is unavailable and disabled in preview" /></div>
          </div>
          <div className="modal-notice">Preview only: no volunteer is contacted, and location or alerts are not shared. This switch is for demonstration and does not enable location sharing.</div>
          <div className="dialog-actions"><button type="button" className="button outline" onClick={() => setDialog('')}>Not now</button><button className="button" type="submit">Create demo trip <Icon name="arrow" /></button></div>
        </form>
      </Dialog>}

      {dialog === 'sos' && <Dialog title="If you need urgent help" subtitle="TeamSOS preview cannot contact anyone or send an alert." label="Safety information" onClose={() => setDialog('')}>
        <div className="sos-callout"><strong>In immediate danger, call 911.</strong><p>Use your phone to call emergency services now. Do not wait for this app.</p></div>
        <ul className="safety-list">
          <li><span className="safety-num">1</span><span><strong>Move toward a staffed, public place</strong><br />A shop, hotel lobby, or transit station can offer people and light.</span></li>
          <li><span className="safety-num">2</span><span><strong>Contact someone you trust</strong><br />Call or message them directly and tell them where you are.</span></li>
          <li><span className="safety-num">3</span><span><strong>Use local emergency resources</strong><br />If you feel unsafe or threatened, call 911 or ask nearby staff for help.</span></li>
        </ul>
        <div className="modal-notice"><strong>Preview control:</strong> opening this information does not send an SOS, call anyone, or share your location.</div>
        <div className="dialog-actions"><button className="button outline" onClick={() => setDialog('')}>Close</button><a className="button danger" href="tel:911">Call 911</a></div>
      </Dialog>}

      {dialog === 'end' && <Dialog title={status === 'matching' ? 'Cancel this demo trip?' : 'End this demo trip?'} subtitle="This only changes the practice trip shown on this device." label="Confirm" onClose={() => setDialog('')}>
        <p className="confirm-copy">Your trip will be marked as ended. No volunteer or emergency contact will be notified.</p>
        <div className="confirm-box">No real trip is active, and ending the demo will not send an alert.</div>
        <div className="dialog-actions"><button className="button outline" onClick={() => setDialog('')}>Keep trip</button><button className="button danger" onClick={endTrip}>{status === 'matching' ? 'Cancel demo trip' : 'End demo trip'}</button></div>
      </Dialog>}
      {toast && <div className="toast" role="status" aria-live="polite">{toast}</div>}
    </div>
  );
}
