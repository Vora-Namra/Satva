(function () {

 
  const API_BASE = window.API_BASE || '/api/v1/doctor';

  function getAccessToken() {
    return localStorage.getItem('accessToken');
  }

  const DAY_NAMES  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const DAY_SHORT  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  function getMondayOf(d) {
    const day = d.getDay();
    const diff = (day === 0) ? -6 : 1 - day;
    const m = new Date(d);
    m.setDate(d.getDate() + diff);
    m.setHours(0, 0, 0, 0);
    return m;
  }

  function toYMD(d) {
    return d.getFullYear() + '-' +
           String(d.getMonth() + 1).padStart(2, '0') + '-' +
           String(d.getDate()).padStart(2, '0');
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  // ── 7-day window starting Monday of the NEXT week ───────────────────────
  const today    = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  const monday   = getMondayOf(nextWeek);
  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    weekDays.push(d);
  }

  let activeIdx = 0; // which day tab is currently open

  // ── state — populated entirely from the API, no hand-rolled defaults ───
  window.weekScheduleMap = window.weekScheduleMap || {}; // ymd -> { start_time, end_time, slot_duration }
  window.doctorLeaves    = window.doctorLeaves    || []; // [{ from_date, to_date, reason }]

  // ── fetch helpers — doctor identity comes from the token, never from the client ──

  async function apiGet(path) {
    const res = await fetch(API_BASE + path, {
      headers: { 'Authorization': `Bearer ${getAccessToken()}` },
    });
    const json = await res.json();
    if (!res.ok || json.success === false) {
      throw Object.assign(new Error(json.message || 'Request failed'), { code: json.code });
    }
    return json.data ?? json;
  }

  async function apiSend(method, path, body) {
  
    const res = await fetch(API_BASE + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAccessToken()}`,
      },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok || json.success === false) {
      throw Object.assign(new Error(json.message || 'Request failed'), { code: json.code });
    }
    return json.data ?? json;
  }


  async function loadWeeklySchedule() {
    const fromDate = toYMD(weekDays[0]);
    const data = await apiGet(`/get-weekly-schedule`);

    const list   = data[0].weekScheduleList || [];
    const leaves = data[0].doctorLeavesSchedule || [];

    const map = {};
    list.forEach(function (row) {
      map[row.working_date] = {
        start_time:    row.working_from  || '',
        end_time:      row.working_to    || '',
        slot_duration: row.slot_duration || '',
      };

    });


    window.weekScheduleMap = map;
    window.doctorLeaves    = leaves;
  }

  // ── leave helpers ────────────────────────────────────────────────────

  function getLeaveForDate(ymd) {
    return (window.doctorLeaves || []).find(function (l) {
      return ymd >= l.from_date && ymd <= l.to_date;
    }) || null;
  }

  function isDateOnLeave(ymd) {
    return !!getLeaveForDate(ymd);
  }


  function getDayData(ymd) {
    const saved = window.weekScheduleMap[ymd] || { start_time: '', end_time: '', slot_duration: '' };
    const leave = getLeaveForDate(ymd);
    return {
      start_time:    saved.start_time,
      end_time:      saved.end_time,
      slot_duration: saved.slot_duration,
      is_on_leave:   !!leave,
      leave_reason:  leave ? (leave.reason || 'Doctor on Leave') : null,
      is_set:        !!(saved.start_time && saved.end_time && saved.slot_duration),
    };
  }

  // ── dropdown option lists — '' always means "nothing chosen yet" ───────

  const START_TIMES = ['','06:00','06:30','07:00','07:30','08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00'];
  const END_TIMES   = ['','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00','18:30','19:00','20:00'];
  const DURATIONS   = ['',10,15,20,25,30,45,60];

  function timeOptionsHtml(values, placeholder, current) {
    return values.map(function (v) {
      const label = v === '' ? placeholder : v;

      return `<option value="${v}" ${current.substring(0,5) === v ? 'selected' : ''}>${label}</option>`;
    }).join('');
  }

  function durationOptionsHtml(current) {
    return DURATIONS.map(function (v) {
      const label = v === '' ? 'Select Duration' : `${v} min`;
      return `<option value="${v}" ${String(current) === String(v) ? 'selected' : ''}>${label}</option>`;
    }).join('');
  }

  const CHEVRON_SVG = '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>';
  const LOCK_SVG = '<svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>';

  // ── rendering ────────────────────────────────────────────────────────

  function renderDayTabs() {
    let html = '<div class="flex gap-2 overflow-x-auto pb-1 scrollbar-none" id="week-day-tabs">';
    weekDays.forEach(function (d, idx) {
      const ymd      = toYMD(d);
      const day      = getDayData(ymd);
      const isActive = idx === activeIdx;

      const btnCls = isActive
        ? 'bg-teal-600 text-white border-teal-600'
        : 'bg-white text-gray-600 border-gray-200 hover:border-teal-300 hover:text-teal-600';

      const dotCls = day.is_on_leave
        ? 'bg-red-400'
        : (day.is_set ? (isActive ? 'bg-teal-300' : 'bg-teal-400') : 'bg-gray-300');

      html += `
        <button onclick="selectWeekDay(${idx})" id="wday-btn-${idx}" data-idx="${idx}"
          class="wday-btn flex-shrink-0 flex flex-col items-center px-4 py-2.5 rounded-xl border text-xs font-medium transition ${btnCls}">
          <span class="text-[11px] uppercase tracking-wide ${isActive ? 'text-teal-100' : 'text-gray-400'}">${DAY_SHORT[d.getDay()]}</span>
          <span class="text-base font-bold mt-0.5 leading-none">${d.getDate()}</span>
          <span class="mt-1 w-1 h-1 rounded-full ${dotCls} inline-block"></span>
        </button>`;
    });
    html += '</div>';
    return html;
  }

  function renderLeaveConfig() {
    const existing = (window.doctorLeaves || []).map(function (l) {
      return `
        <div class="flex items-center justify-between bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-2">
          <span class="text-xs text-red-700 font-medium">${escapeHtml(l.from_date)} &rarr; ${escapeHtml(l.to_date)}${l.reason ? ' · ' + escapeHtml(l.reason) : ''}</span>
          <button onclick="cancelDoctorLeave('${l.leave_id}', this)"
            class="text-xs font-semibold text-red-600 hover:text-red-800">Cancel</button>
        </div>`;
    }).join('');

    return `
      <div class="bg-white border border-gray-200 rounded-2xl px-5 py-4 mb-4 shadow-sm">
        <p class="text-xs font-semibold text-red-600 uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-red-500 inline-block"></span> Doctor Leave
        </p>
        ${existing || '<p class="text-xs text-gray-400 mb-3">No leave currently applied.</p>'}
        <div class="grid grid-cols-2 gap-4 mt-2">
          <div>
            <label class="block text-xs text-gray-500 mb-1">Leave From</label>
            <input type="date" id="leave-from" 
              class="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm font-medium rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400 transition" />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Leave To</label>
            <input type="date" id="leave-to"
              class="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm font-medium rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400 transition" />
          </div>
        </div>
        <button onclick="applyDoctorLeave(this)"
          class="mt-3 w-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold py-2.5 rounded-xl transition">
          Apply Leave
        </button>
      </div>`;
  }

  function renderSlotConfig(idx, day) {
    if (day.is_on_leave) {
      return `
        <div class="bg-red-50/50 border border-dashed border-red-200 rounded-2xl px-5 py-5 flex items-center gap-3.5">
          <div class="p-2 bg-red-100 rounded-xl text-red-600">${LOCK_SVG}</div>
          <div>
            <p class="text-sm font-bold text-gray-900">Configuration Blocked</p>
            <p class="text-xs text-gray-500 mt-0.5">Cannot set a schedule while Doctor Leave is active for this date. Cancel the leave first, then set the schedule.</p>
          </div>
        </div>`;
    }

    const startOpts = timeOptionsHtml(START_TIMES, 'Select Start Time', day.start_time);
    const endOpts   = timeOptionsHtml(END_TIMES, 'Select End Time', day.end_time);
    const durOpts   = durationOptionsHtml(day.slot_duration);

    return `
      <div class="bg-teal-50 border border-teal-100 rounded-2xl px-5 py-4">
        <p class="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-3">Slot Configuration</p>
        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block text-xs text-gray-500 mb-1">Start Time</label>
            <div class="relative">
              <select onchange="updateSlotConfig(${idx}, 'start_time', this.value)" 
                class="w-full appearance-none bg-white border border-gray-200 text-gray-800 text-sm font-medium rounded-lg px-3 py-2 pr-7 focus:outline-none focus:ring-2 focus:ring-teal-400 transition">
                ${startOpts}
              </select>
              <span class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">${CHEVRON_SVG}</span>
            </div>
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">End Time</label>
            <div class="relative">
              <select onchange="updateSlotConfig(${idx}, 'end_time', this.value)"
                class="w-full appearance-none bg-white border border-gray-200 text-gray-800 text-sm font-medium rounded-lg px-3 py-2 pr-7 focus:outline-none focus:ring-2 focus:ring-teal-400 transition">
                ${endOpts}
              </select>
              <span class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">${CHEVRON_SVG}</span>
            </div>
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Slot Duration</label>
            <div class="relative">
              <select onchange="updateSlotConfig(${idx}, 'slot_duration', this.value)"
                class="w-full appearance-none bg-white border border-gray-200 text-gray-800 text-sm font-medium rounded-lg px-3 py-2 pr-7 focus:outline-none focus:ring-2 focus:ring-teal-400 transition">
                ${durOpts}
              </select>
              <span class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">${CHEVRON_SVG}</span>
            </div>
          </div>
        </div>
        <button onclick="saveSlotConfig(${idx}, this)"
          class="mt-4 w-full bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold py-2.5 rounded-xl transition">
          Save Slot Configuration
        </button>
      </div>`;
  }

  function statusBadgeHtml(day) {
    if (day.is_on_leave) {
      return `<span class="text-xs font-medium text-red-600 bg-red-50 border border-red-100 px-3 py-1 rounded-full">${escapeHtml(day.leave_reason)}</span>`;
    }
    if (day.is_set) {
      return '<span class="text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">Available</span>';
    }
    return '<span class="text-xs font-medium text-amber-600 bg-amber-50 px-3 py-1 rounded-full">Not Set</span>';
  }

  function renderDayPanel(d, idx) {
    const ymd = toYMD(d);
    const day = getDayData(ymd);

    const header = `
      <div class="flex items-center justify-between">
        <p class="font-semibold text-gray-900 text-sm">
          ${DAY_NAMES[d.getDay()]} &ndash; ${d.getDate()} ${MONTH_ABBR[d.getMonth()]} ${d.getFullYear()}
        </p>
        ${statusBadgeHtml(day)}
      </div>`;

    const slotCard = renderSlotConfig(idx, day);

    return `<div id="wday-panel-${idx}" class="wday-panel space-y-4 ${idx !== activeIdx ? 'hidden' : ''}">${header}${slotCard}</div>`;
  }

  function renderApp() {
    const titleBar = `
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-base font-semibold text-gray-900">Weekly Schedule (Next Week)</h2>
        <span class="text-xs text-gray-400 font-medium bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
          ${monday.getDate()} ${MONTH_ABBR[monday.getMonth()]} &ndash; ${weekDays[6].getDate()} ${MONTH_ABBR[weekDays[6].getMonth()]}
        </span>
      </div>`;

    const leaveForm = renderLeaveConfig();
    const tabs      = renderDayTabs();
    const panels    = weekDays.map(renderDayPanel).join('');

    document.getElementById('tab-weekly').innerHTML = titleBar + leaveForm + tabs + panels;
  }

  function selectWeekDay(idx) {
    activeIdx = idx;
    document.querySelectorAll('.wday-panel').forEach(function (p) { p.classList.add('hidden'); });
    document.querySelectorAll('.wday-btn').forEach(function (b) {
      const i = parseInt(b.dataset.idx, 10);
      b.classList.remove('bg-teal-600', 'text-white', 'border-teal-600', 'bg-white', 'text-gray-600', 'border-gray-200');
      if (i === idx) {
        b.classList.add('bg-teal-600', 'text-white', 'border-teal-600');
      } else {
        b.classList.add('bg-white', 'text-gray-600', 'border-gray-200');
      }
    });
    const panel = document.getElementById('wday-panel-' + idx);
    if (panel) panel.classList.remove('hidden');
  }
  window.selectWeekDay = selectWeekDay;


  function validateLeaveForm(fromVal, toVal) {
    if (!fromVal) return '"Leave From" date is required.';
    if (!toVal)   return '"Leave To" date is required.';
    if (toVal < fromVal) return '"Leave To" cannot be before "Leave From".';
    return null;
  }

  async function applyDoctorLeave(btn) {
    const fromVal = document.getElementById('leave-from').value;
    const toVal   = document.getElementById('leave-to').value;

    const error = validateLeaveForm(fromVal, toVal);
    if (error) { alert(error); return; }

    const original = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Applying...';
    try {
      await apiSend('POST', '/apply-doctor-leave', { from_date: fromVal, to_date: toVal, reason: 'Doctor on Leave' });
      await loadWeeklySchedule();
      renderApp();
      selectWeekDay(activeIdx);
    } catch (e) {
      alert(e.message || 'Failed to apply leave.');
      btn.disabled = false;
      btn.textContent = original;
    }
  }
  window.applyDoctorLeave = applyDoctorLeave;

  async function cancelDoctorLeave(leave_id, btn) {
    if (btn) { btn.disabled = true; btn.textContent = 'Cancelling...'; }
    try {
      await apiSend('DELETE', '/cancel-doctor-leave', { leave_id });
      await loadWeeklySchedule();
      renderApp();
      selectWeekDay(activeIdx);
    } catch (e) {
      alert(e.message || 'Failed to cancel leave.');
      if (btn) { btn.disabled = false; btn.textContent = 'Cancel'; }
    }
  }
  window.cancelDoctorLeave = cancelDoctorLeave;



  const pendingEdits = {};

  function updateSlotConfig(idx, field, value) {
    if (!pendingEdits[idx]) pendingEdits[idx] = {};
    pendingEdits[idx][field] = value;
  }
  window.updateSlotConfig = updateSlotConfig;

  function validateSlotConfig(cfg) {
    if (!cfg.start_time)    return 'Please select a start time.';
    if (!cfg.end_time)      return 'Please select an end time.';
    if (!cfg.slot_duration) return 'Please select a slot duration.';
    if (cfg.end_time <= cfg.start_time) return 'End time must be after start time.';
    return null;
  }

  async function saveSlotConfig(idx, btn) {
    const ymd = toYMD(weekDays[idx]);

    // client-side guard for instant feedback — the API call below is the real guard
    if (isDateOnLeave(ymd)) {
      alert('Cannot set a schedule — doctor is on leave for this date. Cancel the leave first.');
      return;
    }

    const day = getDayData(ymd);
    const cfg = Object.assign(
      { start_time: day.start_time, end_time: day.end_time, slot_duration: day.slot_duration },
      pendingEdits[idx] || {}
    );

    const error = validateSlotConfig(cfg);
    if (error) { alert(error); return; }

    const original = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Saving...';

    try {
      await apiSend('POST', '/post-weekly-schedule', {
        working_date:  ymd,
        working_from:  cfg.start_time,
        working_to:    cfg.end_time,
        slot_duration: Number(cfg.slot_duration),
      });

      window.weekScheduleMap[ymd] = {
        start_time:    cfg.start_time,
        end_time:      cfg.end_time,
        slot_duration: Number(cfg.slot_duration),
      };
      delete pendingEdits[idx];

      
      renderApp();
      selectWeekDay(idx);
    } catch (e) {
      if (e.code === 'DOCTOR_ON_LEAVE') {
        alert(e.message);
        await loadWeeklySchedule(); 
        renderApp();
        selectWeekDay(idx);
        return;
      }
      alert(e.message || 'Failed to save schedule.');
      btn.textContent = original;
      btn.disabled = false;
    }
  }
  window.saveSlotConfig = saveSlotConfig;



  async function init() {
    if (!getAccessToken()) {
      document.getElementById('tab-weekly').innerHTML =
        '<p class="text-sm text-red-500 py-8 text-center">Please log in to view your schedule.</p>';
      return;
    }

    document.getElementById('tab-weekly').innerHTML =
      '<p class="text-sm text-gray-400 py-8 text-center">Loading schedule…</p>';

    try {
      await loadWeeklySchedule();
    } catch (e) {
      console.error('Failed to load weekly schedule:', e);
      document.getElementById('tab-weekly').innerHTML =
        '<p class="text-sm text-red-500 py-8 text-center">Failed to load schedule. Please refresh the page.</p>';
      return;
    }

    


    renderApp();

   const today = new Date();

// Find this week's Monday (treating Monday as start of week)
const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
const daysUntilNextMonday = ((8 - dayOfWeek) % 7) || 7; // always jumps to *next* week's Monday

const nextMonday = new Date(today);
nextMonday.setDate(today.getDate() + daysUntilNextMonday);

const nextSunday = new Date(nextMonday);
nextSunday.setDate(nextMonday.getDate() + 6);

function formatDate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const minDate = formatDate(nextMonday);
const maxDate = formatDate(nextSunday);

const leave_from = document.getElementById("leave-from");
const leave_to = document.getElementById("leave-to");

leave_from.min = minDate;
leave_from.max = maxDate;
leave_to.min = minDate;
leave_to.max = maxDate;

leave_from.addEventListener("change", (e) => {
 
  leave_to.min = leave_from.value;
  // leave_to.max = maxDate;
});
    
  }

  init();


    
    

})();

