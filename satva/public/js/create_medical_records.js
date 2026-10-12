const APPOINTMENT_ID=sessionStorage.getItem("appointment_id")
if(!APPOINTMENT_ID){
  window.location.href=window.location.origin+'/doctor/dashboard'
}



  const backendData = {
    patientName: sessionStorage.getItem("patient_name"),
    chiefComplaint: sessionStorage.getItem("chief_complaint")
  };
  document.getElementById('patientName').value = backendData.patientName;
  document.getElementById('chiefComplaint').value = backendData.chiefComplaint;

  /* ============ Tabs (visual only in this demo) ============ */
  const ACTIVE_TAB = ['text-brand-dark', 'font-semibold', 'border-brand'];
  const INACTIVE_TAB = ['text-gray-400', 'font-medium', 'border-transparent'];

  document.querySelectorAll('.tab-btn').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(t => {
        t.classList.remove(...ACTIVE_TAB);
        t.classList.add(...INACTIVE_TAB);
      });
      tab.classList.remove(...INACTIVE_TAB);
      tab.classList.add(...ACTIVE_TAB);
    });
  });

  /* ============ Prescription items (dynamic rows) ============ */
  const rxList = document.getElementById('rxList');
  const rxEmpty = document.getElementById('rxEmpty');
  const addRxBtn = document.getElementById('addRxBtn');
  let rxCounter = 0;

  const RX_INPUT_CLASSES = "w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm placeholder-gray-300 focus:outline-none focus:border-brand focus:ring-2 focus:ring-[#14926f]/[0.12] transition-colors";

  function rxRowTemplate(num) {
    return `
      <div class="rx-item border border-gray-200 rounded-xl p-4 mb-3.5 bg-gray-50" data-rx-id="${num}">
        <div class="flex items-center justify-between mb-3.5">
          <span class="rx-item-title text-[12.5px] font-bold text-gray-400 uppercase tracking-wide">Medicine #${num}</span>
          <button type="button" class="remove-rx-btn text-gray-400 hover:bg-red-50 hover:text-danger rounded-md p-1.5 flex items-center transition-colors" aria-label="Remove medicine">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
        <div class="grid grid-cols-1 gap-3.5">
          <div>
            <label class="block text-[11.5px] font-semibold text-gray-400 mb-1.5">Medicine Name</label>
            <input type="text" class="rx-medicine_name ${RX_INPUT_CLASSES}" placeholder="e.g. Atorvastatin">
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label class="block text-[11.5px] font-semibold text-gray-400 mb-1.5">Dosage</label>
              <input type="text" class="rx-dosage ${RX_INPUT_CLASSES}" placeholder="e.g. 10mg">
            </div>
            <div>
              <label class="block text-[11.5px] font-semibold text-gray-400 mb-1.5">Frequency</label>
              <input type="text" class="rx-frequency ${RX_INPUT_CLASSES}" placeholder="e.g. Once daily">
            </div>
            <div>
              <label class="block text-[11.5px] font-semibold text-gray-400 mb-1.5">Duration</label>
              <input type="text" class="rx-duration ${RX_INPUT_CLASSES}" placeholder="e.g. 30 days">
            </div>
          </div>
          <div>
            <label class="block text-[11.5px] font-semibold text-gray-400 mb-1.5">Instructions</label>
            <input type="text" class="rx-instructions ${RX_INPUT_CLASSES}" placeholder="e.g. Take after meals">
          </div>
        </div>
      </div>
    `;
  }

  function renumberRx() {
    const items = rxList.querySelectorAll('.rx-item');
    items.forEach((item, i) => {
      item.querySelector('.rx-item-title').textContent = `Medicine #${i + 1}`;
    });
    if (items.length === 0) {
      rxEmpty.classList.remove('hidden');
    } else {
      rxEmpty.classList.add('hidden');
    }
  }

  function addRxRow() {
    rxCounter++;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = rxRowTemplate(rxCounter);
    rxList.appendChild(wrapper.firstElementChild);
    renumberRx();
  }

  addRxBtn.addEventListener('click', addRxRow);

  rxList.addEventListener('click', (e) => {
    const btn = e.target.closest('.remove-rx-btn');
    if (!btn) return;
    btn.closest('.rx-item').remove();
    renumberRx();
  });

  // Start with one empty prescription row
  addRxRow();

  function collectPrescriptionItems() {
    return Array.from(rxList.querySelectorAll('.rx-item')).map(item => ({
      medicine_name: item.querySelector('.rx-medicine_name').value.trim(),
      dosage: item.querySelector('.rx-dosage').value.trim(),
      frequency: item.querySelector('.rx-frequency').value.trim(),
      duration: item.querySelector('.rx-duration').value.trim(),
      instructions: item.querySelector('.rx-instructions').value.trim()
    })).filter(item =>
      item.medicine_name || item.dosage || item.frequency || item.duration || item.instructions
    ) || [];
  }

  /* ============ File attachments (multi-file) ============ */
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const chooseBtn = document.getElementById('chooseBtn');
  const fileList = document.getElementById('fileList');
  let attachedFiles = [];

  const DRAGOVER_CLASSES = ['border-brand', 'bg-brand-light'];

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function fileIconSVG() {
    return `<svg class="text-brand-dark flex-shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>`;
  }

  function renderFileList() {
    fileList.innerHTML = '';
    attachedFiles.forEach((file, index) => {
      const item = document.createElement('div');
      item.className = 'flex items-center gap-2.5 border border-gray-200 rounded-lg px-3 py-2.5 bg-gray-50 text-sm';
      item.innerHTML = `
        ${fileIconSVG()}
        <div class="flex-1 min-w-0">
          <div class="text-gray-900 font-medium truncate">${file.name}</div>
          <div class="text-gray-400 text-[11px]">${formatSize(file.size)}</div>
        </div>
        <button type="button" class="remove-btn flex-shrink-0 text-gray-400 hover:bg-gray-100 hover:text-danger rounded-full p-1 text-base leading-none transition-colors" data-index="${index}" aria-label="Remove file">&times;</button>
      `;
      fileList.appendChild(item);
    });
  }

  function addFiles(newFiles) {
    const existingKeys = new Set(attachedFiles.map(f => f.name + f.size));
    Array.from(newFiles).forEach(f => {
      const key = f.name + f.size;
      if (!existingKeys.has(key)) {
        attachedFiles.push(f);
        existingKeys.add(key);
      }
    });
    renderFileList();
  }

  chooseBtn.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('click', (e) => {
    if (e.target === chooseBtn) return;
    fileInput.click();
  });
  fileInput.addEventListener('change', (e) => {
    addFiles(e.target.files);
    fileInput.value = '';
  });

  ['dragenter', 'dragover'].forEach(evt =>
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.remove('border-gray-200');
      dropzone.classList.add(...DRAGOVER_CLASSES);
    })
  );
  ['dragleave', 'drop'].forEach(evt =>
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.remove(...DRAGOVER_CLASSES);
      dropzone.classList.add('border-gray-200');
    })
  );
  dropzone.addEventListener('drop', (e) => {
    if (e.dataTransfer.files && e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  });

  fileList.addEventListener('click', (e) => {
    const btn = e.target.closest('.remove-btn');
    if (!btn) return;
    attachedFiles.splice(parseInt(btn.dataset.index, 10), 1);
    renderFileList();
  });

  /* ============ Save ============ */
  const form = document.getElementById('medicalForm');
  const saveBtn = document.getElementById('saveBtn');
  const toast = document.getElementById('toast');

  const TOAST_BG = { success: 'bg-brand-dark', error: 'bg-danger', default: 'bg-gray-900' };

  function showToast(message, type) {
    toast.textContent = message;
    toast.classList.remove('opacity-0', '-translate-y-2', 'bg-gray-900', 'bg-brand-dark', 'bg-danger');
    const bg = TOAST_BG[type] || TOAST_BG.default;
    toast.classList.add('opacity-100', 'translate-y-0', bg);

    setTimeout(() => {
      toast.classList.remove('opacity-100', 'translate-y-0', bg);
      toast.classList.add('opacity-0', '-translate-y-2');
    }, 2800);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const record = {
      appointment_id:APPOINTMENT_ID,
      examination_notes: document.getElementById('examFindings').value.trim(),
      diagnosis: document.getElementById('diagnosis').value.trim(),
      // follow_upDate: document.getElementById('followUpDate').value,
      prescription_items: collectPrescriptionItems(),
      notes: document.getElementById('notes').value.trim()
      // attachments: attachedFiles.map(f => ({ name: f.name, size: f.size, type: f.type }))
    };

try
{
    const formData = new FormData();
    formData.append('payload', JSON.stringify(record));
    attachedFiles.forEach(f => formData.append('files', f));
 
    const response=await fetch('/api/v1/doctor/post-medical-records', { method: 'POST', 
      headers:{'Authorization':`Bearer ${localStorage.getItem("accessToken")}`},
      body: formData });
    const result=await response.json()
    window.location.href=window.location.origin+'/doctor/dashboard'
  }
    catch(err){

      console.log(err)
    }
      



    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    setTimeout(() => {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Medical Record';
      showToast('Medical record saved successfully.', 'success');
    }, 700);
  });