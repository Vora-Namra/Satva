function showPatientHistory(patientid,first_name,last_name,age,gender){
    
    localStorage.setItem("patient_id",patientid)
    const patient_details={name:first_name+" "+last_name, age:age, gender:gender}
    localStorage.setItem("patient_detail",JSON.stringify(patient_details))
    window.location.href=window.location.origin+'/doctor/view-patient-medical-records'
}
const patientListTemplate=(first_name,last_name,age,gender,blood_group,patient_id)=>{
    return ` <div class="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-start gap-4">
        <div class="flex-shrink-0 w-11 h-11 bg-teal-50 rounded-full flex items-center justify-center">
          <svg class="w-6 h-6 text-teal-500" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-gray-900">${first_name} ${last_name}</p>
          <p class="text-xs text-gray-500 mt-0.5">Age ${age} &bull; ${gender}</p>
          <p class="text-xs text-gray-500 mt-0.5">Blood Group ${blood_group}</p>
      
        </div>
        <button class="flex-shrink-0 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition" onclick='showPatientHistory(${patient_id},"${first_name}","${last_name}","${age}","${gender}")'>View History</button>
      </div>`
}


function getAccessToken(){

const accessToken=window.localStorage.getItem('accessToken')
return accessToken
}

//patient list 
async function patientListLoad(){
const patient_tab=document.getElementById("tab-patients")
patient_tab.innerHTML=""

const accessToken=getAccessToken()

const response =await fetch('/api/v1/doctor/get-patient-list',{
    method:'GET',
    headers:{
        'Content-Type':'application/json',
        'Authorization':`Bearer ${accessToken}`
    }  
})
const result =await response.json()
const patient_list =result.data[0].result
patient_list.forEach((l)=>{
    patient_tab.innerHTML=patient_tab.innerHTML+patientListTemplate(l.first_name,l.last_name,l.age,l.gender,l.blood_group,l.patient_id)

})
}


async function  dashboardData(){

const appointment=document.getElementById("appointment_count")
const upcoming=document.getElementById("upcoming_count")
const rescheduled=document.getElementById("rescheduled_count")
const cancelled=document.getElementById("cancelled_count")

const accessToken=getAccessToken()

const response=await fetch("/api/v1/doctor/get-dashboard-data",{
    method:'GET',
    headers:{
        'Content-Type':'application/json',
        'Authorization':`Bearer ${accessToken}`
    }
})

const result=await response.json()
const dashboardData=result.data[0].dashboard_data

appointment.innerText=dashboardData['TOTAL APPOINTMENT']
upcoming.innerText=dashboardData['UPCOMING']
rescheduled.innerText=dashboardData['RESCHEDULED']
cancelled.innerText=dashboardData['CANCELLED']


}

dashboardData()
patientListLoad()
