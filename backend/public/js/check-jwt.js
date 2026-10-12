export async function checkJwt(){
    const token = localStorage.getItem("accessToken");
    if(!token){
        window.location.href = "/login";
        return;
    }

    // Allow access to profile page even if profile is not updated
    if (window.location.pathname.includes('/patient/profile')) {
        return;
    }

    let isProfileUpdated = localStorage.getItem('is_profile_updated');

    // If we don't know the status, fetch it from the server.
    if (isProfileUpdated === null) {
        try {
            const profileRes = await fetch("/api/v1/patient/profile", {
                method: "GET",
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (profileRes.status === 401) {
                localStorage.clear();
                window.location.href = "/login";
                return;
            }

            if (profileRes.ok) {
                const profile = await profileRes.json();
                isProfileUpdated = (profile.data.isProfileUpdated ?? false).toString(); // 'true' or 'false'
                localStorage.setItem('is_profile_updated', isProfileUpdated);
            } else {
                isProfileUpdated = 'false';
            }
        } catch (e) {
            console.error("Failed to fetch profile status", e);
            isProfileUpdated = 'false';
        }
    }

    if (isProfileUpdated === 'false') {
        alert('Please complete your profile before proceeding.');
        window.location.href = '/patient/profile';
    }
}