(async function () {
  const token = localStorage.getItem("accessToken");

  if (!token) {
    return;
  }

  try {
    const res = await fetch("/api/v1/auth/check-status", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      const { data } = await res.json();
      const userRole = data.role;

      localStorage.setItem("role", userRole);

      switch (userRole) {
        case "PATIENT":
          window.location.href = "/patient/dashboard";
          break;
        case "DOCTOR":
          window.location.href = "/doctor/dashboard";
          break;
        case "ADMIN":
          window.location.href = "/admin/dashboard";
          break;
        case "STAFF":
          window.location.href = "/staff/doctors";
          break;
        case "SUPER_ADMIN":
          window.location.href = "/super-admin/dashboard";
          break;
      }
    } else {
      localStorage.clear();
    }
  } catch (error) {
    console.error("Error checking authentication status:", error);
  }
})();