

let doctor_name = document.getElementById("doctor_name")
let consultation_fee = document.getElementById("consultation_fee")
let experience_years = document.getElementById("experience_years")
let bio = document.getElementById("bio")


function getAccessToken() {

    const accessToken = window.localStorage.getItem('accessToken')
    if (!accessToken) {
        window.location.href = "/doctor/login"
    }
    return accessToken
}

const accessToken = getAccessToken()

function renderDoctorDetails(details) {

    doctor_name.innerText = `Dr. ${details.first_name} ${details.last_name}`
    consultation_fee.innerText = `${details.consultation_fee}`
    bio.innerText = `${details.bio}`
    experience_years.innerText = `${details.experience_years} Years`

}

function renderSpecialities(specialitiesList) {

    let specialities = document.getElementById("specialities")
    specialitiesList.forEach((s) => {

        specialities.innerHTML = specialities.innerHTML +
            `<span class="inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-full px-4 py-1.5">
            <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="4"/></svg>
            ${s.specialty_name}
          </span>`
    })


}


function renderQualification(qualificationList) {
    let qualification = document.getElementById("qualification")

    qualificationList.forEach((d) => {
        qualification.innerHTML = qualification.innerHTML +
            `
    <div class="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50 hover:border-teal-200 hover:bg-teal-50 transition-colors">
          <div class="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z"/>
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <p class="font-semibold text-gray-900">${d.degree}</p>
              <span class="text-xs font-medium text-teal-700 bg-teal-100 rounded-full px-3 py-0.5">${d.graduation_year}</span>
            </div>
            <p class="text-sm text-gray-500 mt-0.5">${d.college_name}</p>
          </div>
        </div>
    `
    })
}




async function renderHospitalDetails() {
    let doctor_id=document.getElementById('doctor-id')
    let hospital_id=document.getElementById("hospital-id")
    let hospital_name=document.getElementById("hospital-name")
    let hospital_name2=document.getElementById("hospital_name2")
    const response = await fetch("/api/v1/doctor/get-hospital-details", {
        method: 'GET',
        headers: {
            'Content-type': 'application/json',
            'Authorization':`Bearer ${accessToken}`
        }
    }
    )
    const result = await response.json()
    const hospital_detail=result.data[0].hospital_details
    doctor_id.innerText =hospital_detail.doctor_id 
    hospital_id.innerText=hospital_detail.hospital_id 
    hospital_name.innerText=hospital_detail.hospital_name
    hospital_name2.innerText=hospital_detail.hospital_name

}

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

async function renderDetails() {


    const doctor = await getDoctor()


    renderDoctorDetails(doctor.doctorDetails)
    renderSpecialities(doctor.docSpecialities)
    renderQualification(doctor.docQualifictionDetail)
    renderHospitalDetails()


}

renderDetails()


