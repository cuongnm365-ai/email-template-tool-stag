/* =========================================================
   BỘ NÃO XỬ LÝ (ENGINE) - SOC COMMAND CENTER
   Bản cập nhật: Bảo mật DOMPurify, Tracking Google Analytics,
   Format tiền tệ, Fix đồng bộ style cho nội dung sinh động, Fix hiển thị CC/BCC
   Bản vá (mới nhất): Fix lỗi nội dung email bị đẩy ra giữa khi soạn trên
   Thunderbird (cửa sổ soạn thư rộng) do khối bọc nội dung dùng
   "margin: 0 auto" (tự động canh giữa). Đổi thành "margin: 0" để nội dung
   luôn bắt đầu từ mép trái, không phụ thuộc độ rộng cửa sổ soạn thư.
   Không ảnh hưởng đến Webmail (khung soạn thư vốn đã hẹp nên trước đây
   không thấy bị lệch).
   Bản vá (mới nhất #2): Fix lỗi gõ tiếng Việt bị nhảy chữ/mất chữ khi dùng
   bộ gõ IME (fcitx5, Unikey...) trên Ubuntu tại các ô có định dạng tự động
   (viết hoa, viết hoa đầu từ). Nguyên nhân: trước đây code chỉnh sửa value
   của ô input ngay tại từng ký tự gõ (kể cả khi IME đang trong quá trình
   ghép chữ), làm phá vỡ bộ đệm ghép chữ của IME. Cách fix: theo dõi sự kiện
   compositionstart/compositionend, tạm ngưng việc tự động định dạng trong
   lúc IME đang ghép chữ, chỉ áp dụng định dạng sau khi ghép chữ xong.
   Bản vá (mới nhất #3): Thêm "Badge nhận diện khu vực" hiển thị ngay dưới
   ô Số hợp đồng (field_contractId) — khi nhân viên gõ số hợp đồng, hệ
   thống tự động nhận diện và hiển thị nổi bật tên khu vực tương ứng.
   Bản vá (mới nhất #4, đã thay thế bởi #5): Từng thử dùng "position: absolute"
   cho badge khu vực kèm margin-bottom cố định để bù khoảng trống — cách này
   không ổn định (margin cố định không đủ khi nội dung badge dài/xuống dòng,
   gây đè chữ lên field kế tiếp).
   Bản vá (mới nhất #5): Đổi hẳn sang badge nằm trong LUỒNG BÌNH THƯỜNG (không
   absolute) + đổi hàng chứa Số hợp đồng sang canh đỉnh (items-start) thay vì
   canh đáy (items-end). Kết quả: 3 ô Số hợp đồng/SĐT/Địa chỉ luôn ngang hàng
   nhau ở phía trên bất kể badge có hiện hay không, và khi badge xuất hiện thì
   layout tự động co giãn đẩy nội dung phía dưới xuống — không cần tính trước
   khoảng cách, không còn tình trạng đè chữ. Cảnh báo "không nhận diện được
   khu vực" vẫn nổi bật: nền đỏ đậm, chữ to hơn, nhấp nháy nhẹ (class
   .region-indicator-warning trong CSS/style.css).
   ========================================================= */

const SYSTEM_ASSETS = {
    "cai_dat": { img: "https://tools.manhcuongit.online/Images/Picture/cai-dat-nhanh.jpg", link: "https://hi.fpt.vn/rev/lbq/P3M3JDZB" },
    "theo_doi_ktv": { img: "https://tools.manhcuongit.online/Images/Picture/theo-doi-ktv.jpg", link: "https://hi.fpt.vn/rev/lbq/P3M3JDZB" },
    "thanh_toan": { img: "https://tools.manhcuongit.online/Images/Picture/thanh-toan-nhanh.jpg", link: "https://hi.fpt.vn/rev/fbu/1dnN3BoM" },
    "bao_hong": { img: "https://tools.manhcuongit.online/Images/Picture/bao-hong-nhanh.jpg", link: "https://hi.fpt.vn/rev/esv/Mq9r4jlG" }
};

window.SOC_TEMPLATES = window.SOC_TEMPLATES || {};
let currentTemplateId = "";

// --- HÀM TRACKING GOOGLE ANALYTICS ---
function trackTemplateUsage(method) {
    if (!currentTemplateId) return;
    const templateName = window.SOC_TEMPLATES[currentTemplateId]?.name || currentTemplateId;
    
    // Đẩy sự kiện về GTM/GA4
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        'event': 'use_template',
        'template_id': currentTemplateId,
        'template_name': templateName,
        'copy_method': method // Trả về 'button_click' hoặc 'manual_select'
    });
    console.log(`[Tracking] Đã ghi nhận sử dụng mẫu: ${templateName} (${method})`);
}

document.addEventListener("DOMContentLoaded", () => {
    // 1. Tải danh sách mẫu Email
    const selector = document.getElementById("templateSelector");
    if (selector) {
        selector.innerHTML = '<option value="">-- Chọn nghiệp vụ / Mẫu email phục vụ --</option>';
        for (const [id, template] of Object.entries(window.SOC_TEMPLATES)) {
            selector.innerHTML += `<option value="${id}">${template.name}</option>`;
        }
        selector.addEventListener("change", (e) => {
            currentTemplateId = e.target.value;
            renderForm(currentTemplateId);
        });
    }

    const btnReset = document.getElementById("btnReset");
    if (btnReset) btnReset.addEventListener("click", () => renderForm(currentTemplateId));
    
    const btnCopy = document.getElementById("btnCopy");
    if (btnCopy) btnCopy.addEventListener("click", () => {
        copyEmailContent();
        trackTemplateUsage('button_click'); // Bắn tracking khi bấm nút
    });

    setupDoubleClickCopy("ccDisplay", "ccValue", "CC");
    setupDoubleClickCopy("bccDisplay", "bccValue", "BCC");

    // 2. Lắng nghe sự kiện bôi đen copy (Ctrl+C) thủ công
    document.addEventListener("copy", (e) => {
        const selection = document.getSelection();
        const emailContentNode = document.getElementById("emailContent");
        
        // Nếu người dùng đang bôi đen text nằm TRONG khu vực nội dung email
        if (emailContentNode && selection.anchorNode && emailContentNode.contains(selection.anchorNode)) {
            trackTemplateUsage('manual_select'); // Bắn tracking khi copy thủ công
        }
    });
});

function getFieldHtml(field) {
    let formatAttr = field.format ? `data-format="${field.format}"` : "";
    let extraHtml = "";
    if (field.id === "phone") {
        extraHtml = `<div id="phone_error" style="display: none; color: #dc2626; font-size: 12px; margin-top: 4px; font-weight: 500;">Sai định dạng số ĐT</div>`;
    }

    // FIX #5: Badge nhận diện khu vực nằm trong LUỒNG BÌNH THƯỜNG (không còn
    // absolute) — tự động đẩy nội dung phía dưới xuống khi xuất hiện, không cần
    // tính trước khoảng cách. Là 1 khối (div) chứ không phải viên thuốc 1 dòng,
    // để chữ dài (thông báo cảnh báo) tự xuống dòng gọn trong bề rộng cột, không
    // tràn ra ngoài hay đè lên nội dung khác. Để 3 ô cùng hàng (VD: Số hợp đồng /
    // SĐT / Địa chỉ) luôn ngang hàng nhau bất kể badge có hiện hay không, hàng
    // chứa ô này phải dùng "items-start" (canh đỉnh) thay vì "items-end" — xem
    // renderForm().
    if (field.id === "contractId") {
        extraHtml += `<div id="regionIndicator" class="hidden mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold whitespace-nowrap" style="border: 1px solid transparent; font-size: 11px;">
            <i class="fa-solid fa-location-dot"></i><span id="regionIndicatorText"></span>
        </div>`;
    }

    if (field.type === "textarea") {
        return `<textarea id="field_${field.id}" rows="4" class="soc-input template-input w-full" ${formatAttr} placeholder="${field.placeholder || ''}"></textarea>${extraHtml}`;
    } else if (field.type === "select") {
        let html = `<select id="field_${field.id}" class="soc-input template-input w-full">`;
        field.options.forEach(opt => html += `<option value="${opt.value}">${opt.text}</option>`);
        return html + `</select>${extraHtml}`;
    } else if (field.type === "date") {
        return `<input type="date" id="field_${field.id}" class="soc-input template-input w-full">${extraHtml}`;
    } else if (field.type === "checkbox") {
        return `<input type="checkbox" id="field_${field.id}" class="template-input cursor-pointer" style="transform: scale(1.3);">${extraHtml}`;
    } else {
        return `<input type="text" id="field_${field.id}" class="soc-input template-input w-full" ${formatAttr} placeholder="${field.placeholder || ''}">${extraHtml}`;
    }
}

// FIX: Hàm cập nhật Badge nhận diện khu vực. Được gọi mỗi khi nội dung ô
// Số hợp đồng (field_contractId) thay đổi. Dùng chung logic detectRegion
// với phần tính CC trong displayEmailHeaders() để đảm bảo luôn đồng bộ:
// badge hiện khu vực nào thì CC cũng sẽ lấy đúng email của khu vực đó.
// FIX #4: Trạng thái "không nhận diện được" giờ nổi bật rõ rệt hơn — nền đỏ
// đậm, chữ trắng to hơn, có hiệu ứng nhấp nháy (class .region-indicator-warning
// định nghĩa trong CSS/style.css) để nhân viên dễ chú ý và kiểm tra lại.
function updateRegionIndicator(contractId) {
    const indicator = document.getElementById("regionIndicator");
    const textEl = document.getElementById("regionIndicatorText");
    if (!indicator || !textEl || typeof regionManager === "undefined") return;

    const value = (contractId || "").trim();

    if (!value) {
        indicator.classList.add("hidden");
        indicator.classList.remove("region-indicator-warning");
        return;
    }

    const region = regionManager.detectRegion(value);

    if (region) {
        textEl.textContent = `Khu vực: ${regionManager.getRegionLabel(region)}`;
        indicator.classList.remove("region-indicator-warning");
        indicator.style.background = "var(--success-soft)";
        indicator.style.color = "var(--success)";
        indicator.style.borderColor = "var(--success-soft)";
        indicator.style.fontSize = "11px";
    } else {
        textEl.textContent = "⚠ Không nhận diện được khu vực – kiểm tra lại Số hợp đồng!";
        indicator.classList.add("region-indicator-warning");
        indicator.style.background = "#DC2626";
        indicator.style.color = "#FFFFFF";
        indicator.style.borderColor = "#DC2626";
        indicator.style.fontSize = "12.5px";
    }
    indicator.classList.remove("hidden");
}

function renderForm(templateId) {
    const formContainer = document.getElementById("dynamicForm");
    const template = window.SOC_TEMPLATES[templateId];
    
    if (!template) {
        formContainer.innerHTML = '<p class="text-center text-slate-400 text-sm italic py-10 font-medium">Vui lòng chọn một mẫu để hệ thống tự động lắp ráp Form...</p>';
        const emailHeaders = document.getElementById("emailHeaders");
        if (emailHeaders) emailHeaders.classList.add("hidden");
        return;
    }

    let savedAgentName = localStorage.getItem("soc_agent_name") || "";
    if (!savedAgentName && typeof authManager !== "undefined" && authManager.user) {
        savedAgentName = authManager.user.name;
    }

    let html = "";

    if (!template.hideCustomerInfo) {
        html += `
            <div class="mb-4">
                <label class="soc-label">Tên Agent xử lý:</label>
                <input type="text" id="field_staffName" class="soc-input template-input w-full" data-format="titlecase" placeholder="Ví dụ: Nguyễn Văn A" value="${savedAgentName}">
            </div>
            <div class="flex gap-3 mb-4">
                <div class="w-1/3">
                    <label class="soc-label">Danh xưng:</label>
                    <select id="field_gender" class="soc-input template-input w-full">
                        <option value="Anh">Anh</option><option value="Chị">Chị</option>
                        <option value="Cô">Cô</option><option value="Chú">Chú</option>
                        <option value="Bác">Bác</option><option value="Doanh Nghiệp">Doanh Nghiệp</option>
                    </select>
                </div>
                <div class="w-2/3">
                    <label class="soc-label">Tên khách hàng:</label>
                    <input type="text" id="field_customerName" class="soc-input template-input w-full" data-format="titlecase" placeholder="Nhập tên KH">
                </div>
            </div>
        `;
    }

    if (template.fields) {
        template.fields.forEach(field => {
            if (field.type === "row") {
                // FIX #5: Nếu hàng này có ô Số hợp đồng (có thể hiện badge khu vực
                // bên dưới), canh đỉnh (items-start) thay vì canh đáy (items-end) —
                // nhờ vậy nhãn + ô nhập của cả 3 cột luôn ngang hàng nhau ở phía trên,
                // không bị lệch dù cột Số hợp đồng có cao hơn do có thêm badge.
                // Các hàng khác (VD: hàng chọn nguồn + checkbox SOS) vẫn giữ items-end
                // như cũ để không ảnh hưởng cách canh đã có.
                const rowHasContractId = field.fields.some(sub => sub.id === "contractId");
                const rowAlignCls = rowHasContractId ? "items-start" : "items-end";

                html += `<div class="flex gap-4 mb-4 ${rowAlignCls}">`;
                field.fields.forEach(sub => {
                    let wCls = sub.width || "flex-1";
                    html += `<div class="${wCls}">`;
                    if (sub.type !== "checkbox") {
                        html += `<label class="soc-label block mb-1">${sub.label}:</label>`;
                        html += getFieldHtml(sub);
                    } else {
                        html += `<div class="flex items-center h-[38px] pb-2">`;
                        html += getFieldHtml(sub);
                        html += `<label for="field_${sub.id}" class="soc-label mb-0 ml-2 cursor-pointer font-medium">${sub.label}</label>`;
                        html += `</div>`;
                    }
                    html += `</div>`;
                });
                html += `</div>`;
            } else {
                // Field đứng riêng (không nằm trong "row") vốn đã ở dạng khối
                // (div thường), badge bên dưới tự động đẩy nội dung tiếp theo
                // xuống mà không cần xử lý gì thêm.
                html += `<div class="mb-4">`;
                if (field.type !== "checkbox") {
                    html += `<label class="soc-label block mb-1">${field.label}:</label>`;
                    html += getFieldHtml(field);
                } else {
                    html += `<div class="flex items-center">`;
                    html += getFieldHtml(field);
                    html += `<label for="field_${field.id}" class="soc-label mb-0 ml-2 cursor-pointer font-medium">${field.label}</label>`;
                    html += `</div>`;
                }
                html += `</div>`;
            }
        });
    }

    formContainer.innerHTML = html;
    
    document.querySelectorAll('.template-input').forEach(input => {
        // ---- FIX: Theo dõi trạng thái đang gõ chữ qua bộ gõ IME (fcitx5, Unikey...) ----
        // Khi IME đang trong quá trình ghép chữ (composing) — ví dụ gõ "a" rồi "s" để
        // ra chữ "á" — TUYỆT ĐỐI không được can thiệp/chỉnh sửa value của ô input,
        // nếu không dấu tiếng Việt sẽ bị nhảy chữ, mất chữ hoặc sai thứ tự (do IME
        // dùng bộ đệm ghép chữ riêng, việc ép value/di chuyển con trỏ giữa chừng sẽ
        // phá vỡ bộ đệm này).
        input.addEventListener('compositionstart', () => {
            input.dataset.composing = "1";
        });

        input.addEventListener('compositionend', () => {
            input.dataset.composing = "";
            // Khi gõ xong 1 cụm từ (IME vừa ghép chữ xong), mới áp dụng định dạng
            // (viết hoa / viết hoa đầu từ / tiền tệ) rồi cập nhật lại email preview
            applyFieldFormatAndRender(input);
        });

        input.addEventListener('input', (e) => {
            if (e.target.id === "field_staffName") localStorage.setItem("soc_agent_name", e.target.value);

            // Nếu đang trong lúc IME ghép chữ thì bỏ qua bước định dạng ngay lúc này,
            // chỉ cập nhật email preview với giá trị thô hiện có, tránh phá vỡ IME
            if (e.target.dataset.composing === "1") {
                if (e.target.id === "field_contractId") updateRegionIndicator(e.target.value);
                renderEmail();
                return;
            }

            applyFieldFormatAndRender(e.target);
        });
        
        if(input.tagName === 'SELECT') {
            input.addEventListener('change', renderEmail);
        }
    });

    // Khởi tạo trạng thái Badge khu vực ngay khi mở form (phòng trường hợp
    // ô Số hợp đồng đã có sẵn giá trị từ trước, ví dụ sau khi bấm "Làm mới")
    updateRegionIndicator(document.getElementById("field_contractId")?.value || "");

    renderEmail(); 
}

// ---- FIX: Tách riêng phần định dạng (uppercase/titlecase/currency) ra thành hàm
// dùng chung, để có thể gọi lại đúng lúc sau khi IME ghép chữ xong (compositionend)
// thay vì chạy trên từng ký tự gõ như trước đây (gây lỗi với IME tiếng Việt).
function applyFieldFormatAndRender(target) {
    let formatAttr = target.getAttribute('data-format');
    if (formatAttr === 'uppercase') {
        let start = target.selectionStart;
        let end = target.selectionEnd;
        target.value = target.value.toUpperCase();
        target.setSelectionRange(start, end);
    } else if (formatAttr === 'titlecase') {
        let start = target.selectionStart;
        let end = target.selectionEnd;
        target.value = target.value.toLowerCase().replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
        target.setSelectionRange(start, end);
    } else if (formatAttr === 'currency') {
        let raw = target.value.replace(/[^\d]/g, '');
        if (raw) {
            raw = String(parseInt(raw, 10));
            target.value = Number(raw).toLocaleString('vi-VN');
        } else {
            target.value = '';
        }
        target.setSelectionRange(target.value.length, target.value.length);
    }

    // FIX: Cập nhật Badge nhận diện khu vực ngay sau khi định dạng (uppercase) áp dụng
    if (target.id === "field_contractId") updateRegionIndicator(target.value);

    renderEmail();
}

function renderEmail() {
    try {
        if (!currentTemplateId) return;
        const template = window.SOC_TEMPLATES[currentTemplateId];
        let data = {};
        
        document.querySelectorAll('.template-input').forEach(input => {
            let key = input.id.replace('field_', '');
            if (input.type === 'checkbox') {
                data[key] = input.checked;
            } else {
                let val = input.value;
                if (input.tagName.toLowerCase() === 'textarea' && val) {
                    val = val.replace(/\n/g, '<br>').replace(/ {2}/g, '&nbsp;&nbsp;');
                }
                data[key] = val || `[${key}]`;
            }
        });
        
        data.honorific = data.gender || "Anh/Chị";
        data.pronoun = (data.gender === 'Doanh Nghiệp') ? 'Quý công ty' : (data.gender || "Anh/Chị");
        data.pronounLc = data.pronoun.toLowerCase();
        if (data.gender === 'Doanh Nghiệp') data.honorific = 'Quý công ty';

        if (typeof template.computedVars === 'function') Object.assign(data, template.computedVars(data));
        
        const replaceVars = (text) => text ? text.replace(/\{\{(\w+)\}\}/g, (match, key) => data[key] !== undefined ? data[key] : match) : "";

        let infoBoxHtml = "";
        if (template.boxContent) {
            let qrSection = "";
            if (template.qrType && SYSTEM_ASSETS[template.qrType]) {
                let asset = SYSTEM_ASSETS[template.qrType];
                qrSection = `<td width="140" align="center" valign="middle" style="padding: 15px; border-left: 1px dashed #cbd5e0;"><a href="${asset.link}" target="_blank"><img src="${asset.img}" alt="QR Code" style="max-width: 120px;"></a></td>`;
            }
            
            let substitutedBox = replaceVars(template.boxContent);
            let formattedBox = substitutedBox
                .replace(/<ul[^>]*>/g, '<div style="margin: 0;">')
                .replace(/<\/ul>/g, '</div>')
                .replace(/<li[^>]*>/g, '<div style="margin-bottom: 6px; display: flex; align-items: flex-start;"><span style="margin-right: 8px; color: #f26f21;">➔</span><span>')
                .replace(/<\/li>/g, '</span></div>');

            infoBoxHtml = `<table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #f26f21; border-radius: 4px; margin: 12px 0;">
                <tr>
                    <td valign="middle" style="padding: 15px; font-family: sans-serif; font-size: 14.5px; color: #2d3748; line-height: 1.6;">
                        ${formattedBox}
                    </td>
                    ${qrSection}
                </tr>
            </table>`;
        }

        let finalBodyRaw = replaceVars(template.body).replace('{INFO_BOX}', infoBoxHtml);
        
        let finalBody = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(finalBodyRaw) : finalBodyRaw;

        let agentName = (data.staffName && data.staffName !== "[staffName]") ? data.staffName : "[Tên Agent]";
        let finalSigRaw = template.customSignature ? replaceVars(template.customSignature) : `Trân trọng,<br>Em <b>${agentName}</b> – CSKH FPT Telecom.`;
        
        let finalSig = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(finalSigRaw) : finalSigRaw;

        if (template.hideSignature) finalSig = "";

        displayEmailHeaders(template, data);

        const emailSubject = document.getElementById("emailSubject");
        if (emailSubject) emailSubject.innerText = replaceVars(template.subject);
        
        const emailContent = document.getElementById("emailContent");
        if (emailContent) emailContent.innerHTML = finalBody;
        
        const emailSignature = document.getElementById("emailSignature");
        if (emailSignature) emailSignature.innerHTML = finalSig;

    } catch (error) {
        console.error("Lỗi Render Email:", error);
    }
}

/* =========================================================
   HÀM CẬP NHẬT HEADER EMAIL (ĐÃ FIX LỖI HIỂN THỊ CẢ CC/BCC)
   ========================================================= */
function displayEmailHeaders(template, data) {
    try {
        const headersDiv = document.getElementById("emailHeaders");
        const ccDisplay = document.getElementById("ccDisplay");
        const bccDisplay = document.getElementById("bccDisplay");
        const ccValue = document.getElementById("ccValue");
        const bccValue = document.getElementById("bccValue");
        
        if (!headersDiv || !ccDisplay || !bccDisplay) return;
        
        // Reset trạng thái ẩn trước khi xử lý
        ccDisplay.classList.add("hidden");
        bccDisplay.classList.add("hidden");
        headersDiv.classList.add("hidden");

        if (typeof regionManager === "undefined") return;

        let hasCC = false;
        let hasBCC = false;

        // 1. XỬ LÝ CC (Dựa vào Vùng miền từ số hợp đồng)
        const contractId = document.getElementById("field_contractId")?.value || "";
        const region = regionManager.detectRegion(contractId);
        const regionEmail = regionManager.getRegionEmail(region);
        
        if (regionEmail) {
            ccValue.textContent = regionEmail;
            ccDisplay.classList.remove("hidden");
            hasCC = true;
        }

        // 2. XỬ LÝ BCC (Lấy trực tiếp từ cài đặt tải về qua Google Sheets API)
        // Mẫu nào khai báo hideBcc: true thì không hiển thị dòng BCC (VD: Mẫu Gửi nội bộ)
        const bccEmail = (!template.hideBcc) ? (regionManager.settings.defaultBccEmail || "") : "";
        if (bccEmail) {
            bccValue.textContent = bccEmail;
            bccDisplay.classList.remove("hidden");
            hasBCC = true;
        }

        // 3. HIỂN THỊ KHỐI CHỨA HEADER (Nếu có ít nhất 1 trong 2 giá trị CC hoặc BCC)
        if (hasCC || hasBCC) {
            headersDiv.classList.remove("hidden");
        }

    } catch (e) {
        console.error("Lỗi hiển thị Header CC/BCC:", e);
    }
}

function setupDoubleClickCopy(containerId, valueId, typeName) {
    const container = document.getElementById(containerId);
    const valueEl = document.getElementById(valueId);
    
    if (container && valueEl) {
        container.setAttribute("title", `Nhấp đúp chuột để copy nhanh danh sách email ${typeName}`);
        container.classList.add("cursor-pointer", "hover:bg-blue-100", "transition", "rounded", "px-1");
        container.addEventListener("dblclick", () => {
            const textToCopy = valueEl.textContent.trim();
            if (textToCopy) {
                navigator.clipboard.writeText(textToCopy).then(() => showToast(`Đã copy danh sách ${typeName}!`));
            }
        });
    }
}

function copyEmailContent() {
    const contentEl = document.getElementById('emailContent');
    const sigEl = document.getElementById('emailSignature');
    
    if (!contentEl) return;
    
    const cloneContent = document.createElement('div');
    cloneContent.innerHTML = contentEl.innerHTML;
    
    const qrImages = cloneContent.querySelectorAll('img[src*="tools.manhcuongit"]');
    qrImages.forEach(img => {
        img.style.width = "160px";
        img.style.height = "auto";
        img.style.maxWidth = "100%";
        if (img.closest('td')) {
            img.closest('td').style.width = "170px";
        }
    });

    const content = cloneContent.innerHTML;
    const sig = sigEl ? sigEl.innerHTML : "";
    
    // FIX: Trước đây dùng "margin: 0 auto" khiến khối nội dung (rộng tối đa 800px)
    // bị tự động canh GIỮA trong các cửa sổ soạn thư rộng hơn 800px (điển hình là
    // Thunderbird trên màn hình lớn), làm nội dung trông như bị "đẩy ra giữa".
    // Trên Webmail thì khung soạn thư vốn đã hẹp (< 800px) nên trước đây không
    // thấy hiện tượng này. Đổi thành "margin: 0" để nội dung luôn bắt đầu từ
    // mép trái, đồng nhất trên cả Webmail lẫn Thunderbird.
    const fullHtml = `
        <div style="font-family: 'Aptos', 'Segoe UI', Arial, sans-serif; font-size: 12pt; color: #2d3748; max-width: 800px; margin: 0; line-height: 1.5;">
            ${content}
            ${sig ? `<br><br>${sig}` : ''}
        </div>
    `;
    
    // --- KHỐI BỔ SUNG: GHI NHẬN THỐNG KÊ LOCAL VÀ PUSH LÊN GOOGLE SHEETS API ---
    if (typeof currentTemplateId !== 'undefined' && currentTemplateId) {
        // 1. Lưu thống kê Local
        try {
            let stats = JSON.parse(localStorage.getItem('soc_template_stats')) || {};
            stats[currentTemplateId] = (stats[currentTemplateId] || 0) + 1;
            localStorage.setItem('soc_template_stats', JSON.stringify(stats));
        } catch (e) { console.error("Lỗi local storage:", e); }

        // 2. Bắn dữ liệu lên Server Google Sheet
        const STATS_API_URL = "https://script.google.com/macros/s/AKfycbzIGRhMMZ5KLjjNgkocTxX0CrEM2_zTipwK4LGQfJweaEsRejqOksxG3C8XfopB0gZ4/exec";
        if (STATS_API_URL && !STATS_API_URL.includes("DÁN_LINK")) {
            const templateObj = window.SOC_TEMPLATES[currentTemplateId];
            const tName = templateObj ? templateObj.name : currentTemplateId;
            const user = (typeof authManager !== 'undefined' && authManager.user) 
                ? authManager.user 
                : {name: "Nhân viên", email: "Khuyết danh"};

            fetch(STATS_API_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({
                    userName: user.name,
                    userEmail: user.email,
                    templateId: currentTemplateId,
                    templateName: tName
                })
            }).catch(e => console.log("Gửi API ngầm bị lỗi (Mạng):", e));
        }
    }
    // -------------------------------------------------------------------------
    
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const data = [new ClipboardItem({ 'text/html': blob })];
    
    navigator.clipboard.write(data).then(() => {
        showToast("Đã copy thành công nội dung phục vụ!");
        // Refresh lại biểu đồ thống kê nếu người dùng đang đứng ở tab Thống kê
        if (typeof renderTemplateStatistics === 'function' && document.getElementById('statsTab').classList.contains('active')) {
            renderTemplateStatistics();
        }
    }).catch(() => {
        alert("Trình duyệt chặn Copy ẩn. Vui lòng bôi đen nội dung và nhấn Ctrl+C.");
    });
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    if (toast && toastMessage) {
        toastMessage.innerText = msg;
        toast.classList.remove('hidden');
        toast.classList.add('flex');
        setTimeout(() => {
            toast.classList.add('hidden');
            toast.classList.remove('flex');
        }, 3000);
    }
}
/* ==========================================================================
   KHỐI MÃ TOÀN DIỆN ĐO LƯỜNG GOOGLE ANALYTICS 4 (GA4) CHO SOC PORTAL
   (Thêm vào cuối file JS/engine.js - Không chỉnh sửa logic cũ)
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
    // Hàm gửi sự kiện an toàn lên GA4 (tránh lỗi nếu GA4 chưa tải xong)
    function emitGA4Event(eventName, eventParams) {
        if (typeof window.gtag === 'function') {
            window.gtag('event', eventName, eventParams);
        } else {
            console.warn('[GA4] Thẻ đo lường chưa sẵn sàng cho sự kiện:', eventName);
        }
    }

    // 1. TỰ ĐỘNG COPY TOÀN BỘ VÀ ĐO LƯỜNG KHI CLICK-DOUBLE VÀO DÒNG CC / BCC
    const attachMailFieldDblClick = (elementId, fieldType) => {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.cursor = "pointer"; // Hiển thị con trỏ dạng click để gợi ý cho user
            element.addEventListener("dblclick", () => {
                const textValue = element.innerText.trim();
                if (textValue && textValue !== "Không có" && textValue !== "Chưa có") {
                    navigator.clipboard.writeText(textValue).then(() => {
                        // Gửi dữ liệu về GA4
                        emitGA4Event('copy_mail_field', {
                            field_type: fieldType,
                            email_address: textValue,
                            action: 'double_click_copy'
                        });
                        
                        // Hiệu ứng thông báo nhanh trực quan cho nhân viên
                        const originalText = element.innerHTML;
                        element.style.color = "var(--accent)";
                        element.innerText = "✓ Đã copy toàn bộ!";
                        setTimeout(() => {
                            element.style.color = "";
                            element.innerHTML = originalText;
                        }, 1200);
                    }).catch(err => console.error("Lỗi hệ thống khi sao chép:", err));
                }
            });
        }
    };
    attachMailFieldDblClick("mailCC", "CC");
    attachMailFieldDblClick("mailBCC", "BCC");

    // 2. THEO DÕI HÀNH VI TÔ ĐEN RỒI COPY HOẶC CTRL-C TẠI DÒNG SUBJECT
    const subjectElement = document.getElementById("mailSubject");
    if (subjectElement) {
        subjectElement.addEventListener("copy", () => {
            // Lấy nội dung văn bản đang được bôi đen, nếu không bôi đen thì lấy toàn bộ dòng
            const selectionText = document.getSelection().toString() || subjectElement.innerText;
            emitGA4Event('copy_subject_text', {
                subject_content: selectionText.trim(),
                action: 'ctrl_c_or_context_menu'
            });
        });
    }

    // 3. ĐO LƯỜNG LƯỢT SỬ DỤNG TEMPLATE KHI CLICK NÚT "COPY NỘI DUNG"
    const btnCopyContent = document.getElementById("btnCopy");
    if (btnCopyContent) {
        btnCopyContent.addEventListener("click", () => {
            if (typeof currentTemplateId !== "undefined" && currentTemplateId) {
                const activeTemplate = (window.SOC_TEMPLATES && window.SOC_TEMPLATES[currentTemplateId]) || {};
                emitGA4Event('use_template', {
                    template_id: currentTemplateId,
                    template_name: activeTemplate.name || "Mẫu chưa xác định",
                    action: 'click_copy_content'
                });
            }
        });
    }

    // 4. THEO DÕI LƯỢT CLICK NÚT "LÀM MỚI"
    const btnRefreshForm = document.getElementById("btnRefresh");
    if (btnRefreshForm) {
        btnRefreshForm.addEventListener("click", () => {
            emitGA4Event('click_refresh_button', {
                action: 'refresh_input_form'
            });
        });
    }

    // 5. GHI NHẬN LƯỢT VIEW KHI NHÂN VIÊN CLICK VÀO TRANG/TAB NÀO
    // Lắng nghe tất cả các nút bấm chuyển Tab trên thanh Sidebar hệ thống
    const tabButtons = document.querySelectorAll(".tab-btn, .soc-sidebar .tab-btn");
    tabButtons.forEach(tabBtn => {
        tabBtn.addEventListener("click", function() {
            const pageTitle = this.innerText.trim() || this.id || "Trang không danh tính";
            const pseudoPath = "/" + pageTitle.toLowerCase().replace(/[^a-z0-9]/g, "_");
            
            if (typeof window.gtag === 'function') {
                window.gtag('event', 'page_view', {
                    page_title: "Trang: " + pageTitle,
                    page_path: pseudoPath,
                    page_location: window.location.origin + window.location.pathname + pseudoPath
                });
            }
        });
    });
});

// 6. THEO DÕI ĐĂNG NHẬP GOOGLE VÀ LƯU LẠI ACCOUNT QUA SỰ KIỆN HỆ THỐNG
window.addEventListener("soc_auth_ready", (event) => {
    const loggedInUser = event.detail;
    if (loggedInUser && loggedInUser.email) {
        if (typeof window.gtag === 'function') {
            // Thiết lập thuộc tính cấu hình định danh User trên hệ thống GA4
            window.gtag('set', 'user_properties', {
                'account_email': loggedInUser.email,
                'account_name': loggedInUser.name
            });
            
            // Gửi sự kiện log_in kèm chi tiết tài khoản nhân viên thao tác
            window.gtag('event', 'login', {
                method: 'Google OAuth 2.0',
                user_account: loggedInUser.email,
                user_display_name: loggedInUser.name
            });
        }
    }
});