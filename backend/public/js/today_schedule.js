const accessToken = window.localStorage.getItem('accessToken')
const ICON_TELEMEDICINE = `
    <svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round"
        d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
    </svg>`;

  const ICON_IN_PERSON = `
    <svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round"
        d="M8 7V3m8 4V3m-9 4h10M5 11h14M5 19h14a2 2 0 002-2v-5H3v5a2 2 0 002 2z"/>
    </svg>`;

  const ICON_COMPLETE_CHECK = `
    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
    </svg>`;

async function viewMedicalRecords(btn, appointment_id,patient_name,chief_complaint) {
  localStorage.setItem("appointment_id", appointment_id)
  localStorage.setItem("patient_name",patient_name)
  localStorage.setItem("chief_complaint",chief_complaint)
  window.location.href = window.location.origin + `/doctor/view-medical-record/${appointment_id}`

}

async function createMedicalRecords(appointment_id, patient_name, chief_complaint) {

  sessionStorage.setItem("appointment_id", appointment_id)
  sessionStorage.setItem("patient_name", patient_name)
  sessionStorage.setItem("chief_complaint", chief_complaint)

  window.location.href = window.location.origin + '/doctor/create-medical-record'

}

async function startConsultation(btn, appointment_id, patient_name, chief_complaint,appointment_type,link) {

  
  const NEXT_STATUS = 'IN_PROGRESS';
  const payload = { appointment_id: appointment_id, appointment_status: NEXT_STATUS };

  try {
    const result = await fetch("/api/v1/doctor/appointment-status-update", {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!result.ok) throw new Error(`HTTP ${result.status}`);

    btn.setAttribute('class', 'bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium px-3 py-2 rounded-lg transition flex items-center gap-1.5')
    btn.innerHTML = ` ${ICON_COMPLETE_CHECK} Complete`
    btn.onclick = () => { updateInProgress(btn, appointment_id,patient_name,chief_complaint) }

    let btn1=document.createElement("button")
    btn1.setAttribute('class','border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-medium px-3 py-2 rounded-lg transition')
    btn.parentNode.insertBefore(btn1,btn)
    btn1.innerText=` Create Medical Records`
    btn1.onclick=()=>{createMedicalRecords(appointment_id , patient_name , chief_complaint)}
    const response = await result.json();


    if(appointment_type==='TELEMEDICINE'){
     window.open(link, "_blank");
    }

  } catch (err) {
    console.error('Failed to start Consultation:', err);
  }

}

async function updateInProgress(btn, appointment_id,patient_name,chief_complaint) {



  const NEXT_STATUS = 'COMPLETED';
  const payload = { appointment_id: appointment_id, appointment_status: NEXT_STATUS };

  try {
    const result = await fetch("/api/v1/doctor/appointment-status-update", {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!result.ok) throw new Error(`HTTP ${result.status}`);
    btn.previousElementSibling.classList.add('hidden')
    btn.setAttribute('class', 'border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-medium px-3 py-2 rounded-lg transition')
    btn.innerText = 'View Record'
    btn.onclick = () => { viewMedicalRecords(btn, appointment_id,patient_name,chief_complaint) }
    const response = await result.json();


  } catch (err) {
    console.error('Failed to update appointment:', err);
  }
}


(function () {

  let appts = [];

  // ---- Date helpers ----
  function todayISO() {
    const d = new Date();
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d - tzOffset).toISOString().split('T')[0]; // "YYYY-MM-DD"
  }

  function formatLabel(isoDate) {
    const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    // Parse as local date, not UTC, to avoid off-by-one day issues
    const [y, m, d] = isoDate.split('-').map(Number);
    const localDate = new Date(y, m - 1, d);
    return localDate.toLocaleDateString('en-US', opts);
  }


  const STATUS_CONFIG = {
    CONFIRMED: { cls: 'bg-blue-50 text-blue-600', label: 'Upcoming' },
    IN_PROGRESS: { cls: 'bg-amber-50 text-amber-600', label: 'In Progress' },
    COMPLETED: { cls: 'bg-emerald-50 text-emerald-600', label: 'Completed' },
    NO_SHOW: { cls: 'bg-red-50 text-red-600', label: 'No Show' },
    CANCELLED: { cls: 'bg-rose-50 text-rose-600', label: 'Cancelled' },
    RESCHEDULED: { cls: 'bg-violet-50 text-violet-600', label: 'Rescheduled' },
    CHECKED_IN: { cls: 'bg-blue-50 text-blue-600', label: 'Upcoming' }
  };


  function isConsultationTime(start_time, end_time, selectedDateISO) {
    // Only allow "Start Consultation" to be enabled for today's date
    if (selectedDateISO !== todayISO()) return false;

    const localTime = new Date().toLocaleTimeString().substring(0, 5)

    const [start_hour, start_minute] = start_time.split(":")
    const [end_hour, end_minute] = end_time.split(":")
    const [current_hour, current_minute] = localTime.split(":")

    const startTime = Number(start_hour) * 60 + Number(start_minute)
    const endTime = Number(end_hour) * 60 + Number(end_minute)
    const currentTime = Number(current_hour) * 60 + Number(current_minute)

    return startTime <= currentTime && currentTime <= endTime
  }


  function renderActions(status, start_time, end_time, appointment_id, patient_name, chief_complaint,appointment_type,link, selectedDateISO) {


    if (status === 'IN_PROGRESS') {
      return `
          
            <button id="appt-${appointment_id}"  onclick='createMedicalRecords(${appointment_id} , "${patient_name}" , "${chief_complaint}")' class="border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-medium px-3 py-2 rounded-lg transition">
          Create Medical Records
        </button>

            <button id="appt-${appointment_id}" onclick='updateInProgress(this, ${appointment_id},"${patient_name}","${chief_complaint}")' class="bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium px-3 py-2 rounded-lg transition flex items-center gap-1.5">
  ${ICON_COMPLETE_CHECK}
  Complete
</button>`;
    }
    if (status === 'COMPLETED') {
      return `
        <button id="appt-${appointment_id}"  onclick='viewMedicalRecords(this,${appointment_id},"${patient_name}","${chief_complaint}")' class="border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-medium px-3 py-2 rounded-lg transition">
          View Record
        </button>`;
    }
    if (status === 'CONFIRMED' || status === "CHECKED_IN") {
      const disabled = !isConsultationTime(start_time, end_time, selectedDateISO);

      return `
    <button  id="appt-${appointment_id}" onclick='startConsultation(this,${appointment_id}, "${patient_name}" , "${chief_complaint}","${appointment_type}","${link}")'
      class="bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium px-3 py-2 rounded-lg transition whitespace-nowrap ${disabled ? 'opacity-50 cursor-not-allowed' : ''}"
     
      ${disabled ? 'disabled' : ''}>
      Start Consultation
    </button>
  `;
    }
    return '';
  }

  function renderCard(appt, selectedDateISO) {
    const { cls: badgeCls, label: badgeLabel } = STATUS_CONFIG[appt.appointment_status] || {};
    const isTelemedicine = appt.appointment_type === 'TELEMEDICINE';
    const typeIcon = isTelemedicine ? ICON_TELEMEDICINE : ICON_IN_PERSON;
    const typeLabel = isTelemedicine ? 'Telemedicine' : 'In-Person';

    return `
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4">

        <!-- Time -->
        <div class="flex-shrink-0 w-14 text-center">
          <p class="text-xl font-bold text-teal-600 leading-none">${appt.start_time}</p>
          
        </div>

        <!-- Divider -->
        <div class="flex-shrink-0 w-px h-10 bg-gray-100"></div>

        <!-- Patient info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <p class="font-semibold text-gray-900 text-sm">${appt.patient_name}</p>
            <span class="text-xs text-gray-400">Age: ${appt.age}</span>
            <span class="text-xs font-medium px-2 py-0.5 rounded-full ${badgeCls}">${badgeLabel}</span>
          </div>
          <p class="text-xs text-gray-500 mt-0.5 truncate">${appt.chief_complaint}</p>
          <div class="flex items-center gap-1 mt-1">
            ${typeIcon}
            <span class="text-xs text-gray-400">${typeLabel}</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex-shrink-0 flex items-center gap-2">
          ${renderActions(appt.appointment_status, appt.start_time, appt.end_time, appt.appointment_id, appt.patient_name, appt.chief_complaint,appt.appointment_type,appt.link, selectedDateISO)}
        </div>

      </div>`;
  }


  function mountHeader(count, selectedDateISO) {
    const label = formatLabel(selectedDateISO);

    const dateEl = document.getElementById('today-date-label');
    const countEl = document.getElementById('today-count-label');
    if (dateEl) dateEl.textContent = label;
    if (countEl) countEl.textContent = `${count} appointment${count !== 1 ? 's' : ''} scheduled`;
  }


  function render(selectedDateISO) {
    const list = document.getElementById('today-appointments-list');
    const emptyState = document.getElementById('today-empty-state');
    if (!list) return;

    if (!appts || appts.length === 0) {
      list.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
      mountHeader(0, selectedDateISO);
      return;
    }

    list.innerHTML = appts.map(appt => renderCard(appt, selectedDateISO)).join('');
    if (emptyState) emptyState.classList.add('hidden');
    mountHeader(appts.length, selectedDateISO);
  }


  function renderError() {
    const list = document.getElementById('today-appointments-list');
    if (!list) return;
    list.innerHTML = `
      <div class="py-16 flex flex-col items-center gap-3 text-red-400">
        <svg class="w-10 h-10" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
        </svg>
        <p class="text-sm">Could not load appointments. Please try again.</p>
      </div>`;
  }


  function renderLoading() {
    const list = document.getElementById('today-appointments-list');
    const emptyState = document.getElementById('today-empty-state');
    if (emptyState) emptyState.classList.add('hidden');
    if (!list) return;
    list.innerHTML = `
      <div class="py-16 flex flex-col items-center gap-3 text-gray-400">
        <p class="text-sm">Loading appointments…</p>
      </div>`;
  }


  async function fetchAppointments(selectedDateISO) {
    renderLoading();
    try {
      const res = await fetch(`/api/v1/doctor/get-appointment?appointment_date=${selectedDateISO}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      appts = (result.data && result.data[0] && result.data[0].appointment_list) || [];
      render(selectedDateISO);
    } catch (err) {
      console.error('Failed to load appointments:', err);
      appts = [];
      renderError();
      mountHeader(0, selectedDateISO);
    }
  }


  // ---- Init ----
  function init() {
    const dateInput = document.getElementById('today-date-input');
    const initialDate = todayISO();

    if (dateInput) {
      dateInput.value = initialDate;
      dateInput.addEventListener('change', () => {
        const selected = dateInput.value || todayISO();
        fetchAppointments(selected);
      });
    }

    fetchAppointments(initialDate);
  }

  init();

})();