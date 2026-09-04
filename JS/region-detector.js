/* =========================================================
   HỆ THỐNG NHẬN DIỆN VÀ CẤU HÌNH VÙNG MIỀN (API CLOUD LOAD)
   Bản cập nhật: Chuyển từ 2 vùng (Nam/Bắc) sang 7 vùng CC:
   Hà Nội, Hồ Chí Minh, Tây Bắc Bộ + Quảng Ninh,
   Đông Bắc Bộ + Hải Phòng + Hải Dương,
   Miền Trung Tây Nguyên + Khánh Hòa + Đà Nẵng,
   Đông Nam Bộ + Đồng Nai + Bình Dương + Vũng Tàu, Tây Nam Bộ.
   Mỗi vùng có 1 email CC riêng, lấy từ Google Sheet qua "sheetKey".
   Phần BCC (defaultBccEmail) giữ nguyên như cũ.
   ========================================================= */

class RegionManager {
    constructor() {
        // DÁN LINK API CẤU HÌNH (SHEET 1) VÀO ĐÂY:
        this.CONFIG_API_URL = "https://script.google.com/macros/s/AKfycbyPnMb6B_t5Gv_7K0PtbYWpZVNuoPZZC5KkQ4roe1HbkM8LmkrX2TSMr8HRvPzH3I6y4A/exec";

        // Danh sách 7 vùng miền + ký tự nhận diện + tên key tương ứng trên Google Sheet (cột A)
        this.regions = [
            {
                key: "HN",
                label: "Hà Nội",
                sheetKey: "emailHN",
                patterns: ["HN"],
                email: ""
            },
            {
                key: "HCM",
                label: "Hồ Chí Minh",
                sheetKey: "emailHCM",
                patterns: ["HCM"],
                email: ""
            },
            {
                key: "TAY_BAC_QN",
                label: "Tây Bắc Bộ + Quảng Ninh",
                sheetKey: "emailTayBacQN",
                patterns: ["BG", "BN", "CB", "LS", "LC", "PT", "TQ", "TN", "VP", "YB", "HA", "QN"],
                email: ""
            },
            {
                key: "DONG_BAC_HP_HD",
                label: "Đông Bắc Bộ + Hải Phòng + Hải Dương",
                sheetKey: "emailDongBacHPHD",
                patterns: ["DB", "HM", "HT", "HB", "HY", "ND", "NB", "NA", "SL", "TB", "TH", "HP", "HD"],
                email: ""
            },
            {
                key: "MIEN_TRUNG_TN",
                label: "Miền Trung Tây Nguyên, Khánh Hòa, Đà Nẵng",
                sheetKey: "emailMienTrungTayNguyen",
                patterns: ["BI", "DL", "GL", "HU", "KT", "PY", "QB", "QA", "QI", "QT", "DK", "NT", "DA"],
                email: ""
            },
            {
                key: "DONG_NAM_BO",
                label: "Đông Nam Bộ + Đồng Nai + Bình Dương + Vũng Tàu",
                sheetKey: "emailDongNamBo",
                patterns: ["BP", "BT", "LD", "LA", "NN", "TI", "DN", "BD"],
                email: ""
            },
            {
                key: "TAY_NAM_BO",
                label: "Tây Nam Bộ",
                sheetKey: "emailTayNamBo",
                patterns: ["AG", "BL", "BE", "CM", "CT", "DT", "HG", "KG", "ST", "TG", "TV", "VL"],
                email: ""
            }
        ];

        // BCC giữ nguyên, không đổi
        this.settings = {
            defaultBccEmail: ""
        };

        // Tự động tải cấu hình từ Google Sheets khi khởi chạy
        this.loadRemoteConfig();
    }

    async loadRemoteConfig() {
        if (!this.CONFIG_API_URL || this.CONFIG_API_URL.includes("DÁN_LINK")) return;

        try {
            const response = await fetch(this.CONFIG_API_URL);
            const data = await response.json();

            // Gán email CC cho từng vùng dựa theo "sheetKey" khai báo ở trên
            this.regions.forEach(region => {
                if (data[region.sheetKey]) region.email = data[region.sheetKey];
            });

            // BCC giữ nguyên logic cũ
            if (data.defaultBccEmail) this.settings.defaultBccEmail = data.defaultBccEmail;

            // Cập nhật lên UI ngay khi kéo dữ liệu xong
            if (typeof loadSettingsUI === "function") {
                loadSettingsUI();
            }
        } catch (error) {
            console.error("Lỗi khi kéo cấu hình từ Google Sheets:", error);
        }
    }

    clearSettings() {
        this.regions.forEach(region => { region.email = ""; });
        this.settings.defaultBccEmail = "";
    }

    // Nhận diện vùng miền từ Số hợp đồng. Ưu tiên kiểm tra 3 ký tự đầu (dành cho "HCM"),
    // sau đó kiểm tra 2 ký tự đầu cho các vùng còn lại.
    detectRegion(contractId) {
        if (!contractId) return null;
        const code2 = contractId.substring(0, 2).toUpperCase();
        const code3 = contractId.substring(0, 3).toUpperCase();

        for (const region of this.regions) {
            if (region.patterns.includes(code3) || region.patterns.includes(code2)) {
                return region.key;
            }
        }
        return null;
    }

    // Trả về email CC tương ứng với "key" vùng miền (vd: "HN", "HCM", "TAY_BAC_QN"...)
    getRegionEmail(regionKey) {
        const region = this.regions.find(r => r.key === regionKey);
        return region ? region.email : "";
    }

    getRegionLabel(regionKey) {
        const region = this.regions.find(r => r.key === regionKey);
        return region ? region.label : "";
    }
}

const regionManager = new RegionManager();