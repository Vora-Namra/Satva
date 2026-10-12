const token = localStorage.getItem("accessToken");


async function loadDashboard() {
  try {
    const profileRes = await fetch("/api/v1/patient/profile", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    console.log("hii this is token")
    const profile = await profileRes.json();
       console.log("hii this is token")
;

    if (profile.data) {
      document.getElementById("bloodGroup").textContent =
        profile.data.blood_group || "--";

      document.getElementById("gender").textContent=
        profile.data.gender || "--";

      document.getElementById("dob").textContent=
        profile.data.dob?.split("T")[0] || "--";
      const username = `${profile.data.first_name || ""} ${profile.data.last_name || ""}`;
      document.getElementById("patient_name").textContent = username;
      document.getElementById("patientName").textContent = username;
      document.getElementById("user_img").src = profile.data.picture || `https://ui-avatars.com/api/?name=${username}`;
    }

    localStorage.setItem("username",profile.data.first_name)

    const appointmentsRes = await fetch(
      "/api/v1/appointments/patient",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    const appointments = await appointmentsRes.json();
    console.log(appointments)
    document.getElementById("upcomingCount").textContent =
      appointments.data?.length || 0;

    const appointmentContainer =
      document.getElementById("appointmentsContainer");

    appointmentContainer.innerHTML = "";

    appointments.data?.slice(0, 3).forEach((appt) => {
      const app_date = appt.slot_date.split("T")[0];

console.log(app_date);
      appointmentContainer.innerHTML += `
        <div class="bg-white rounded-xl border p-4">
          <h4 class="font-semibold">
            Dr. ${appt.doctor_first_name || "unknown"} ${appt.doctor_last_name}  
          </h4>

          <p class="text-sm text-gray-500">
            ${app_date}
          </p>

          <p class="text-sm text-primary">
            ${appt.start_time}
          </p>

          <span class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
            ${appt.appointment_status}
          </span>
        </div>
      `;
    });

    const recordsRes = await fetch(
      "/api/v1/patient/records",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    const records = await recordsRes.json();

    document.getElementById("recordCount").textContent =
      records.data?.length || 0;

    const notificationsRes = await fetch(
      "/api/v1/patient/notifications",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    const notifications = await notificationsRes.json();

    document.getElementById("notificationCount").textContent =
      notifications.data?.length || 0;

  } catch (err) {
    console.error("Dashboard Error:", err);
  }
}

document.addEventListener("DOMContentLoaded", loadDashboard);
