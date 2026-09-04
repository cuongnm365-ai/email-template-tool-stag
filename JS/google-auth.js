/* =========================================================
   GOOGLE AUTHENTICATION SYSTEM
   Bản cập nhật: Bỏ phụ thuộc vào config.json — cấu hình Email Vùng miền/BCC
   giờ được region-detector.js tự động tải từ Google Sheet (CONFIG_API_URL)
   ngay khi mở trang, không cần đợi đăng nhập xong mới tải như trước.
   ========================================================= */

class GoogleAuthManager {
    constructor() {
        this.user = this.loadUser();
        this.waitForGoogleAuth();
    }

    waitForGoogleAuth() {
        if (window.google && window.google.accounts) {
            this.initGoogleAuth();
        } else {
            setTimeout(() => this.waitForGoogleAuth(), 150);
        }
    }

    loadUser() {
        try {
            const saved = localStorage.getItem("soc_user");
            return saved ? JSON.parse(saved) : null;
        } catch (e) { return null; }
    }

    saveUser(user) {
        try { localStorage.setItem("soc_user", JSON.stringify(user)); } catch (e) {}
        this.user = user;
        window.dispatchEvent(new CustomEvent("soc_auth_ready", { detail: user }));
    }

    logout() {
        try { localStorage.removeItem("soc_user"); } catch (e) {}
        this.user = null;
        if (window.google && window.google.accounts) google.accounts.id.disableAutoSelect();
        
        if (typeof regionManager !== "undefined") {
            regionManager.clearSettings();
        }
    }

    initGoogleAuth() {
        try {
            google.accounts.id.initialize({
                client_id: "714398035986-2jdd33n4h7kguauq73jbirq6rlfpkte2.apps.googleusercontent.com",
                callback: (response) => this.handleCredentialResponse(response),
                auto_select: false,
                cancel_on_tap_outside: false
            });

            const btn = document.getElementById("googleSignInBtn");
            if (btn) google.accounts.id.renderButton(btn, { theme: "outline", size: "large", width: "100%" });
            
            if (this.isLoggedIn()) {
                this.showMainInterface();
            } else {
                google.accounts.id.prompt(); 
            }
        } catch (error) { console.error("Lỗi khởi tạo Google Auth:", error); }
    }

    handleCredentialResponse(response) {
        try {
            const base64Url = response.credential.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
            const userData = JSON.parse(jsonPayload);
            
            const user = {
                name: userData.name,
                email: userData.email,
                picture: userData.picture,
                loginTime: new Date().toISOString(),
                provider: "google"
            };
            
            this.saveUser(user);
            this.showMainInterface();
            
        } catch (error) { 
            alert("Lỗi xác thực Google. Vui lòng thử lại!"); 
        }
    }

    showMainInterface() {
        const loginModal = document.getElementById("loginModal");
        const mainInterface = document.getElementById("mainInterface");
        
        if (loginModal) { loginModal.style.setProperty('display', 'none', 'important'); loginModal.classList.add("hidden"); }
        if (mainInterface) { mainInterface.style.setProperty('display', 'flex', 'important'); mainInterface.classList.remove("hidden"); }
        
        this.updateUserDisplay();
        window.dispatchEvent(new CustomEvent("soc_auth_ready", { detail: this.user }));
    }

    showLoginModal() {
        const loginModal = document.getElementById("loginModal");
        const mainInterface = document.getElementById("mainInterface");
        
        if (loginModal) { loginModal.style.setProperty('display', 'flex', 'important'); loginModal.classList.remove("hidden"); }
        if (mainInterface) { mainInterface.style.setProperty('display', 'none', 'important'); mainInterface.classList.add("hidden"); }
    }

    updateUserDisplay() {
        if (!this.user) return;
        try {
            const headerTitle = document.getElementById("headerTitle");
            if (headerTitle) headerTitle.textContent = `${this.user.name} - Dynamic Email Generator`;

            const elementsToUpdateName = ["sidebarUserName", "userNameDisplay"];
            elementsToUpdateName.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = this.user.name;
            });

            const elementsToUpdateEmail = ["sidebarUserEmail", "userEmailDisplay"];
            elementsToUpdateEmail.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = this.user.email;
            });
        } catch (e) { console.error("Lỗi cập nhật hiển thị:", e); }
    }

    isLoggedIn() { return this.user !== null; }
}

const authManager = new GoogleAuthManager();

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("#logoutBtn, #btnLogout").forEach(btn => {
        btn.addEventListener("click", () => {
            authManager.logout();
            authManager.showLoginModal();
        });
    });
});
