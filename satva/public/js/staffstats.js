// public/js/stats.js

async function loadStats() {
  try {
    const token = localStorage.getItem('accessToken') ?? '';

    const res = await fetch('/api/v1/staff/stats', {
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`,
      }
    });

    if (!res.ok) throw new Error(`${res.status}`);

    const json = await res.json();
    const data = json.data ?? json;

    // Today's appointments
    setText('stat-appt',            data.today_appointments   ?? '—');
    setText('stat-appt-change',     data.appt_change          ?? '');

    // Active patients
    setText('stat-patients',        data.active_patients      ?? '—');
    setText('stat-patients-change', data.patients_change      ?? '');

    // Revenue today
    setText('stat-revenue',         data.revenue_today != null
      ? `$${Number(data.revenue_today).toLocaleString()}` : '—');
    setText('stat-revenue-change',  data.revenue_change       ?? '');

    // Active doctors
    setText('stat-doctors',         data.active_doctors       ?? '—');
    setText('stat-doctors-change',  data.doctors_change       ?? '');

  } catch (err) {
    // fallback — show dashes, don't crash the page
    console.warn('Stats failed to load:', err.message);
  }
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

// Run on every page that includes this script
loadStats();