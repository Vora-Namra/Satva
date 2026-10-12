export async function logout() {
    try {
        const token = localStorage.getItem("accessToken");
        if (token) {
            await fetch('/api/v1/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        }
    } catch (error) {
        console.error("Logout failed on server, clearing client session anyway.", error);
    } finally {
        localStorage.clear();
        window.location.href = '/login';
    }
}