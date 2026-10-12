export async function checkSuperAdminJwt() {
    let token = localStorage.getItem("accessToken");
   
    
    if (!token) {
        try {
            // Attempt to get a new access token using the HttpOnly refresh token cookie
            const res = await fetch("/api/v1/auth/refresh", {
                method: "GET"
            });
        
            if (res.ok) {
                const result = await res.json();
                token = result.data.accessToken;
         
                localStorage.setItem("accessToken", token);
                window.location.reload();
            } else {
                window.location.href = "/super-admin/login";
                return;
            }
        } catch (error) {
            window.location.href = "/super-admin/login";
            return;
        }
    }
}
