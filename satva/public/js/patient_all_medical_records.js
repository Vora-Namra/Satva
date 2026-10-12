(function () {
  const accessToken=localStorage.getItem("accessToken")
  const DETAIL_PAGE_URL = "/view-medical-record"; 

  const els = {
    patientName: document.getElementById("patientName"),
    patientMeta: document.getElementById("patientMeta"),
    recordCount: document.getElementById("recordCount"),
    loadingState: document.getElementById("loadingState"),
    emptyState: document.getElementById("emptyState"),
    errorState: document.getElementById("errorState"),
    recordsList: document.getElementById("recordsList"),
    retryBtn: document.getElementById("retryBtn"),
    backBtn: document.getElementById("backBtn"),
    toast: document.getElementById("toast"),
  };

 
  const patientId =localStorage.getItem("patient_id");

  function showToast(message, isError) {
    els.toast.textContent = message;
    els.toast.classList.toggle("bg-gray-900", !isError);
    els.toast.classList.toggle("bg-danger", !!isError);
    els.toast.classList.remove("opacity-0", "-translate-y-2");
    setTimeout(() => {
      els.toast.classList.add("opacity-0", "-translate-y-2");
    }, 2600);
  }

  function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value == null ? "" : String(value);
    return div.innerHTML;
  }

  function formatDate(value) {
    if (!value) return "Date unknown";
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function setState(state) {
    els.loadingState.classList.toggle("hidden", state !== "loading");
    els.emptyState.classList.toggle("hidden", state !== "empty");
    els.errorState.classList.toggle("hidden", state !== "error");
    els.recordsList.classList.toggle("hidden", state !== "ready");
  }

  function renderPatientHeader(patient) {
    if (!patient) {
      els.patientName.textContent = "Medical Records";
      els.patientMeta.textContent = "";
      return;
    }
    els.patientName.textContent = patient.name || "Patient";
    const metaParts = [];
    if (patient.age != null) metaParts.push(`${patient.age} yrs`);
    if (patient.gender) metaParts.push(patient.gender);
    els.patientMeta.textContent = metaParts.join(" • ");
  }

  function recordCard(record) {
   
    const id = record.appointment_id;
    const complaintSnippet = (record.chief_complaint || "No chief complaint recorded").slice(0, 110);
    const appointment_type = record.appointment_type=="IN_PERSON"?"In Person":"Telemedicine"
    // const rxCount = record.prescription_count ?? (record.prescriptions ? record.prescriptions.length : 0);
    // const fileCount = record.attachment_count ?? (record.attachments ? record.attachments.length : 0);

    const card = document.createElement("button");
    card.type = "button";
    card.className =
      "w-full text-left border border-gray-200 rounded-xl px-4.5 py-4 hover:border-brand hover:bg-brand-light/40 transition-colors";
    card.innerHTML = `
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-[13px] font-semibold text-gray-800">${escapeHtml(formatDate(record.slot_date))}</span>
            ${record.doctor_name ? `<span class="text-[12px] text-gray-400">• ${escapeHtml(record.doctor_name)}</span>` : ""}
          </div>
          <div class="text-[13.5px] text-gray-700 truncate">${escapeHtml(complaintSnippet)}</div>
          <div class="inline-flex items-center mt-2 text-[11.5px] font-semibold text-brand-dark bg-brand-light rounded-md px-2 py-1">
            ${escapeHtml(appointment_type)}
          </div>
        </div>
        <div class="flex flex-col items-end gap-1.5 shrink-0">
         
          <span class="text-[12px] font-semibold text-brand">View &rarr;</span>
        </div>
      </div>
    `;
    card.addEventListener("click", () => {
      localStorage.setItem("chief_complaint",complaintSnippet)
      window.location.href = `/doctor${DETAIL_PAGE_URL}/${encodeURIComponent(id)}`;
    });
    return card;
  }

  function renderRecords(records) {
    els.recordsList.innerHTML = "";
    records.forEach((record) => els.recordsList.appendChild(recordCard(record)));
    els.recordCount.textContent = `${records.length} record${records.length === 1 ? "" : "s"}`;
  }

  async function loadRecords() {
    if (!patientId) {
      setState("error");
      showToast("Missing patient_id in the URL.", true);
      return;
    }

    setState("loading");

    try {
      const res = await fetch(`/api/v1/doctor/get-patient-all-medical-records/${encodeURIComponent(patientId)}`,{
        method:'GET'
        ,headers:{
          'Authorization':`Bearer ${accessToken}`
        }
      });
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
      const result = await res.json();

      
      const records = result.data.result
      const patient=JSON.parse(localStorage.getItem("patient_detail"))
      renderPatientHeader(patient);

      if (!records || records.length === 0) {
        setState("empty");
        return;
      }

      renderRecords(records);
      setState("ready");
    } catch (err) {
      console.error(err);
      setState("error");
      showToast("Couldn't load medical records.", true);
    }
  }

  els.retryBtn.addEventListener("click", loadRecords);
  els.backBtn.addEventListener("click", () => {
    localStorage.removeItem("patient_detail")
    localStorage.removeItem("patient_id")
    if (window.history.length > 1) window.history.back();
    else window.location.href = "/";
  });

  loadRecords();
})();
