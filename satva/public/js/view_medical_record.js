
(function () {
  const APPOINTMENT_ID_PARAM = "appointment_id";
  const LIST_PAGE_URL = "/view-medical-record"; 
  const accessToken=localStorage.getItem("accessToken")
 
  function getIdFromUrl(queryParam) {
    const search = new URLSearchParams(window.location.search);
    const fromQuery = search.get(queryParam);
    if (fromQuery) return fromQuery;

    const segments = window.location.pathname.split("/").filter(Boolean);
    return segments.length > 0 ? segments[segments.length - 1] : null;
  }

  const els = {
    doctorName: document.getElementById("doctorName"),
    visitMeta: document.getElementById("visitMeta"),
    loadingState: document.getElementById("loadingState"),
    errorState: document.getElementById("errorState"),
    recordContent: document.getElementById("recordContent"),
    retryBtn: document.getElementById("retryBtn"),
    backBtn: document.getElementById("backBtn"),
    toast: document.getElementById("toast"),
    patientName: document.getElementById("patientName"),
    chiefComplaint: document.getElementById("chiefComplaint"),
    examFindings: document.getElementById("examFindings"),
    diagnosis: document.getElementById("diagnosis"),
    rxList: document.getElementById("rxList"),
    rxEmpty: document.getElementById("rxEmpty"),
    notes: document.getElementById("notes"),
    filesList: document.getElementById("filesList"),
    filesEmpty: document.getElementById("filesEmpty"),
  };

  const appointmentId = getIdFromUrl(APPOINTMENT_ID_PARAM);
  console.log(appointmentId)
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
    if (!value) return "";
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
    els.errorState.classList.toggle("hidden", state !== "error");
    els.recordContent.classList.toggle("hidden", state !== "ready");
  }

  function fileIcon() {
    return `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" class="text-gray-400 flex-shrink-0">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>`;
  }

  function renderPrescriptions(prescriptions) {
    els.rxList.innerHTML = "";
    if (!prescriptions || prescriptions.length === 0) {
      els.rxEmpty.classList.remove("hidden");
      return;
    }
    els.rxEmpty.classList.add("hidden");

    prescriptions.forEach((rx) => {
      const row = document.createElement("div");
      row.className = "border border-gray-200 rounded-lg px-3.5 py-3";
      row.innerHTML = `
        <div class="text-[13.5px] font-semibold text-gray-800 mb-1.5">${escapeHtml(rx.medicine_name || rx.name || "Medicine")}</div>
        <div class="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-gray-500">
          ${rx.dosage ? `<span><span class="text-gray-400">Dosage:</span> ${escapeHtml(rx.dosage)}</span>` : ""}
          ${rx.frequency ? `<span><span class="text-gray-400">Frequency:</span> ${escapeHtml(rx.frequency)}</span>` : ""}
          ${rx.duration ? `<span><span class="text-gray-400">Duration:</span> ${escapeHtml(rx.duration)}</span>` : ""}
        </div>
        ${rx.instructions ? `<div class="text-[12px] text-gray-500 mt-1.5"><span class="text-gray-400">Instructions:</span> ${escapeHtml(rx.instructions)}</div>` : ""}
      `;
      els.rxList.appendChild(row);
    });
  }

  function renderAttachments(attachments) {
    els.filesList.innerHTML = "";
    if (!attachments || attachments.length === 0) {
      els.filesEmpty.classList.remove("hidden");
      return;
    }
    els.filesEmpty.classList.add("hidden");

    attachments.forEach((file) => {
      const name = file.file_name  || "Attachment";
      const url = file.file_path || "#";

      const row = document.createElement("a");
      // console.log(url)
      row.href = '/doctor/view-file?file_path='+url;
      row.target = "_blank";
      row.rel = "noopener noreferrer";
      row.className =
        "flex items-center gap-2.5 border border-gray-200 rounded-lg px-3.5 py-2.5 text-[13px] text-gray-700 hover:border-brand hover:bg-brand-light/40 transition-colors";
      row.innerHTML = `
        ${fileIcon()}
        <span class="truncate flex-1">${escapeHtml(name)}</span>
        <span class="text-[12px] font-semibold text-brand">Open</span>
      `;
      els.filesList.appendChild(row);
    });
  }

  function renderRecord(record) {
  
    els.doctorName.textContent = record.doctor_name || "Medical Record";
    els.visitMeta.textContent = formatDate(record.visit_date || record.created_at);
    els.patientName.value = localStorage.getItem('patient_name') || JSON.parse(localStorage.getItem("patient_detail")).name
    els.chiefComplaint.value = localStorage.getItem('chief_complaint')|| JSON.parse(localStorage.getItem("patient_detail")).chiefComplaint;
    els.examFindings.value = record[0].examination_notes || "";
    els.diagnosis.value = record[0].diagnosis || "";
    els.notes.value = record[2].prescription.notes || "";

    renderPrescriptions(record[2].prescription_items);
    renderAttachments(record[1].medical_attachments);
  }

  async function loadRecord() {
    if (!appointmentId) {
      setState("error");
      showToast("Missing record_id in the URL.", true);
      return;
    }

    setState("loading");

    try {
      const res = await fetch(`/api/v1/doctor/get-patient-all-medical-record-data/${encodeURIComponent(appointmentId)}`,{
        method:'GET',
        headers:{
          'Authorization':`Bearer ${accessToken}`
        }
      });
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
      const result = await res.json();

      
      const record = result.data || result.record || result;

      if (!record || typeof record !== "object") {
        throw new Error("Empty response");
      }

      renderRecord(record);
      setState("ready");
    } catch (err) {
      err.message.includes('404')
      setState("error");
      
      showToast("Couldn't load this medical record.", true);
    }
  }

  els.retryBtn.addEventListener("click", loadRecord);
  els.backBtn.addEventListener("click", () => {
    localStorage.removeItem('patient_name')
    localStorage.removeItem("chief_complaint")
    if (window.history.length > 1) window.history.back();
    else window.location.href = LIST_PAGE_URL;
  });

  loadRecord();
})();