/* =========================================================
   UI ENHANCEMENTS — Theme Sáng/Tối + Chấm trạng thái header
   + Cột chức năng: Drawer trên di động, Thu gọn/Cố định trên Desktop
   File riêng, không đụng tới logic nghiệp vụ trong engine.js
   ========================================================= */

(function () {
    // ---- 1. Theme Sáng / Tối ----
    const THEME_KEY = "soc_theme";

    function applyTheme(theme) {
        document.documentElement.setAttribute("data-theme", theme);
        const icon = document.getElementById("themeToggleIcon");
        if (icon) icon.className = theme === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon";
    }

    // Áp dụng ngay từ đầu để tránh nháy sáng/tối khi tải trang
    applyTheme(localStorage.getItem(THEME_KEY) || "light");

    document.addEventListener("DOMContentLoaded", () => {
        const toggleBtn = document.getElementById("themeToggle");
        if (toggleBtn) {
            toggleBtn.addEventListener("click", () => {
                const current = document.documentElement.getAttribute("data-theme") || "light";
                const next = current === "dark" ? "light" : "dark";
                applyTheme(next);
                localStorage.setItem(THEME_KEY, next);
            });
        }

        // ---- 2. Chấm trạng thái header: phản ánh đã chọn mẫu email hay chưa ----
        const selector = document.getElementById("templateSelector");
        const pill = document.getElementById("statusPill");
        const pillLabel = document.getElementById("statusPillLabel");

        function updateStatusPill() {
            if (!selector || !pill || !pillLabel) return;
            const templateId = selector.value;
            const template = templateId && window.SOC_TEMPLATES ? window.SOC_TEMPLATES[templateId] : null;

            if (template) {
                pill.classList.add("is-ready");
                pillLabel.textContent = `Đang soạn: ${template.name.replace(/^Mẫu (Mới|Cũ) \d+: /, "")}`;
            } else {
                pill.classList.remove("is-ready");
                pillLabel.textContent = "Chưa chọn mẫu";
            }
        }

        if (selector) selector.addEventListener("change", updateStatusPill);
        updateStatusPill();

        // ---- 3. Cột chức năng: Ẩn/hiện trên Mobile + Cố định/Thu gọn trên Desktop ----
        const sidebar = document.getElementById("sidebar");
        const overlay = document.getElementById("sidebarOverlay");
        const mobileMenuBtn = document.getElementById("mobileMenuBtn");
        const sidebarCloseBtn = document.getElementById("sidebarCloseBtn");
        const collapseBtn = document.getElementById("sidebarCollapseBtn");
        const COLLAPSE_KEY = "soc_sidebar_collapsed";
        const DESKTOP_BREAKPOINT = 768;

        function openMobileSidebar() {
            if (!sidebar || !overlay) return;
            sidebar.classList.add("sidebar-open");
            overlay.classList.add("is-visible");
        }

        function closeMobileSidebar() {
            if (!sidebar || !overlay) return;
            sidebar.classList.remove("sidebar-open");
            overlay.classList.remove("is-visible");
        }

        if (mobileMenuBtn) mobileMenuBtn.addEventListener("click", openMobileSidebar);
        if (sidebarCloseBtn) sidebarCloseBtn.addEventListener("click", closeMobileSidebar);
        if (overlay) overlay.addEventListener("click", closeMobileSidebar);

        // Chọn xong 1 mục thì tự đóng menu (đỡ thao tác thêm) trên mobile
        document.querySelectorAll(".soc-sidebar .tab-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                if (window.innerWidth < DESKTOP_BREAKPOINT) closeMobileSidebar();
            });
        });

        // Thu gọn / mở rộng cột chức năng trên Desktop — nhớ lựa chọn qua localStorage
        function applyCollapsedState(isCollapsed) {
            if (!sidebar) return;
            sidebar.classList.toggle("sidebar-collapsed", isCollapsed);
            if (collapseBtn) {
                const icon = collapseBtn.querySelector("i");
                if (icon) icon.className = isCollapsed ? "fa-solid fa-chevron-right" : "fa-solid fa-chevron-left";
                collapseBtn.title = isCollapsed ? "Mở rộng cột chức năng" : "Thu gọn cột chức năng";
            }
        }

        applyCollapsedState(localStorage.getItem(COLLAPSE_KEY) === "1");

        if (collapseBtn) {
            collapseBtn.addEventListener("click", () => {
                const next = !sidebar.classList.contains("sidebar-collapsed");
                applyCollapsedState(next);
                localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
            });
        }

        // Resize từ mobile sang desktop (hoặc ngược lại) thì reset trạng thái drawer
        window.addEventListener("resize", () => {
            if (window.innerWidth >= DESKTOP_BREAKPOINT) closeMobileSidebar();
        });
    });
})();