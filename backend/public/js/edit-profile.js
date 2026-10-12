function getAccessToken() {

    const accessToken = window.localStorage.getItem('accessToken')
    return accessToken
}


const accessToken = getAccessToken()
async function getDoctor() {
    const response = await fetch('/api/v1/doctor/get-doctor', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    })

    const result = await response.json()
    return result.data[0]
}


const doctor_name = document.getElementById("doctor_name")
const exp_years = document.getElementById("experience_years")
const consultation_fee = document.getElementById("consultation_fee")
const bio = document.getElementById('bio')
const avatar=document.getElementById("avatar-preview")
let specialties = []
let qualifications = [];
let doctor_id=null;

let isDirty = false;


window.addEventListener('DOMContentLoaded', async () => {
    const result = await getDoctor()
    doctorDetails = result.doctorDetails
    specialties = result.docSpecialities
    qualifications = result.docQualifictionDetail

    renderDoctorDetails(doctorDetails)
    renderSpecialties();
    renderQualifications();
});

/* ─────────── DIRTY FLAG ─────────── */
function markDirty() {
    if (!isDirty) {
        isDirty = true;
        const badge = document.getElementById('unsaved-badge');
        badge.classList.remove('hidden');
        badge.classList.add('inline-flex');
    }
}
function clearDirty() {
    isDirty = false;
    const badge = document.getElementById('unsaved-badge');
    badge.classList.add('hidden');
    badge.classList.remove('inline-flex');
}


function previewPhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        const preview = document.getElementById('avatar-preview');
        preview.innerHTML = `<img src="${ev.target.result}" class="w-full h-full object-cover" alt="Profile photo"/>`;
        markDirty();
    };
    reader.readAsDataURL(file);
}


function renderSpecialties() {

    const list = document.getElementById('specialty-list');
    if (specialties.length === 0) {
        list.innerHTML = '<p class="text-sm text-gray-400">No specialties added.</p>';
        return;
    }
    list.innerHTML = specialties.map((s, i) => `
        <span class="inline-flex items-center gap-2 text-sm font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-full pl-4 pr-2 py-1.5">
          ${s.specialty_name}
          <button onclick="removeSpecialty(${i})" class="w-5 h-5 rounded-full bg-teal-100 hover:bg-teal-200 flex items-center justify-center transition flex-shrink-0">
            <svg class="w-3 h-3 text-teal-600" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </span>
      `).join('');
}


let dropdownItems = [];  
let dropdownOpen = false;

async function openDropdown() {
    if (dropdownOpen) return;
    dropdownOpen = true;
    const spinner = document.getElementById('specialty-spinner');
    spinner.classList.remove('hidden');
    dropdownItems = await fetchSpecialtiesFromAPI('');
    spinner.classList.add('hidden');
    renderDropdown(dropdownItems);
}

async function filterSpecialtyDropdown() {
    const q = document.getElementById('specialty-search').value;
    const spinner = document.getElementById('specialty-spinner');
    spinner.classList.remove('hidden');
    dropdownItems = await fetchSpecialtiesFromAPI(q);

    spinner.classList.add('hidden');
    renderDropdown(dropdownItems);
}

function renderDropdown(items) {

    const dd = document.getElementById('specialty-dropdown');
    const alreadySelected = new Set(specialties.map((s) => s.specialty_name));

    const available = items.filter(s => !alreadySelected.has(s.specialty_name));

    if (available.length === 0) {
        dd.innerHTML = `<div class="px-4 py-3 text-sm text-gray-400 text-center">No results found</div>`;
    } else {
        dd.innerHTML = available.map(s => `
          <button type="button" onclick="selectSpecialty(${s.specialty_id},'${s.specialty_name.replace(/'/g, "\\'")}')"
            class="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition flex items-center gap-2 group">
            <svg class="w-3.5 h-3.5 text-teal-400 opacity-0 group-hover:opacity-100 transition flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
            ${s.specialty_name}
          </button>
        `).join('');
    }
    dd.classList.remove('hidden');
}

function selectSpecialty(id, name) {


    if (!specialties.includes(name)) {
        specialties.push({ specialty_id: id, specialty_name: name });
        renderSpecialties();
        markDirty();
    }
    // Reset search
    document.getElementById('specialty-search').value = '';
    document.getElementById('specialty-dropdown').classList.add('hidden');
    dropdownOpen = false;
}


document.addEventListener('click', e => {
    const wrapper = document.getElementById('specialty-dropdown-wrapper');
    if (wrapper && !wrapper.contains(e.target)) {
        document.getElementById('specialty-dropdown').classList.add('hidden');
        dropdownOpen = false;
    }
});
function removeSpecialty(i) {
    specialties.splice(i, 1);
    renderSpecialties();
    markDirty();
}

/* ─────────── QUALIFICATIONS ─────────── */
function renderQualifications() {

    const list = document.getElementById('qualification-list');
    const empty = document.getElementById('qual-empty');
    if (qualifications.length === 0) {
        list.innerHTML = '';
        empty.classList.remove('hidden');
        return;
    }
    empty.classList.add('hidden');
    list.innerHTML = qualifications.map((q, i) => `
        <div class="grid grid-cols-1 sm:grid-cols-[1fr_120px_1fr_40px] gap-3 items-start p-4 rounded-xl bg-gray-50 border border-gray-100 group">
          <!-- Degree -->
          <div>
            <label class="block text-xs font-medium text-gray-400 mb-1">Degree <span class="text-red-400">*</span></label>
            <input type="text" value="${q.degree}"
              oninput="qualifications[${i}].degree=this.value; markDirty()"
              placeholder="e.g. MBBS"
              class="field-input w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 transition"/>
          </div>
          <!-- Year -->
          <div>
            <label class="block text-xs font-medium text-gray-400 mb-1">Year <span class="text-red-400">*</span></label>
            <input type="number" value="${q.graduation_year}" min="1950" max="2099"
              oninput="qualifications[${i}].graduation_year=this.value; markDirty()"
              placeholder="2024"
              class="field-input w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 transition"/>
          </div>
          <!-- College -->
          <div>
            <label class="block text-xs font-medium text-gray-400 mb-1">College / Institution <span class="text-red-400">*</span></label>
            <input type="text" value="${q.college_name}"
              oninput="qualifications[${i}].college_name=this.value; markDirty()"
              placeholder="e.g. AIIMS, New Delhi"
              class="field-input w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 transition"/>
          </div>
          <!-- Remove -->
          <div class="flex items-end pb-0.5">
            <button onclick="removeQualification(${i})"
              class="w-9 h-9 rounded-lg border border-gray-200 bg-white hover:bg-red-50 hover:border-red-200 flex items-center justify-center transition">
              <svg class="w-4 h-4 text-gray-400 hover:text-red-500 transition" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>
        </div>
      `).join('');
}
function addQualification() {
    qualifications.push({ degree: '', graduation_year: '', college_name: '' });
    renderQualifications();
    markDirty();

    const list = document.getElementById('qualification-list');
    list.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function removeQualification(i) {
    qualifications.splice(i, 1);
    renderQualifications();
    markDirty();
}

async function fetchSpecialtiesFromAPI(query = '') {
    if (!query || query == "") {
        return {}
    }
    const res = await fetch(`/api/v1/doctor/get-specialities?search=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });
    const data = await res.json();
    return data.data[0].specialities_list;
}

function renderDoctorDetails(data) {


    doctor_name.value = `Dr. ${data.first_name} ${data.last_name}`
    exp_years.value = data.experience_years
    consultation_fee.value = data.consultation_fee
    console.log(data)
    bio.innerText = data.bio
    avatar.innerHTML=`<img src="/${data.profile_path}" alt="Profile" class="w-full h-full object-cover">`
    doctor_id=data.doctor_id
}

/* ─────────── TEXTAREA AUTO-RESIZE ─────────── */
function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
}

function formData(){
    const doctorName=doctor_name.value
    const first_name=doctorName.split(" ")[1]
    const last_name=doctorName.split(" ")[2]
   
    const form_data={doctor_details:{doctor_id:doctor_id,
            first_name:first_name,
            last_name:last_name,
            experience_years:exp_years.value,
            consultation_fee:consultation_fee.value ,
            bio:bio.value},
            specialties:specialties,
            qualifications:qualifications
    }
    return form_data
}

/* ─────────── SAVE ─────────── */
async function saveProfile() {
    clearDirty();
    const form_data=formData()
    
    const payload=new FormData()
    payload.append('data',JSON.stringify(form_data))

    const fileInput = document.getElementById('photo-upload');
    if (fileInput && fileInput.files[0]) {
        payload.append('profile_image', fileInput.files[0]);
    }
    
    const response= await fetch('/api/v1/doctor/profile/update',{
        method:'POST',
        headers:{
            'Authorization':`Bearer ${accessToken}`
        },body:payload
    })

    const result=await response.json()
    console.log(result)
    const toast = document.getElementById('toast');
    toast.classList.remove('hidden');
    toast.classList.add('toast-show');
    setTimeout(() => {
        toast.classList.add('hidden');
        toast.classList.remove('toast-show');
    }, 3000);
}


window.addEventListener('beforeunload', e => {
    if (isDirty) { e.preventDefault(); e.returnValue = ''; }
});



