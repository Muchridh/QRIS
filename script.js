let scannedData = "";
let cachedBgImg = null;

// --- Inisialisasi ---
document.addEventListener('DOMContentLoaded', function() {
    const feeInput = document.getElementById('fee-value');
    if (document.getElementById('fee-type').value === '') {
        feeInput.disabled = true;
        feeInput.style.backgroundColor = 'var(--bg-app)';
    }
    loadTemplates();
    
    // Preload background image agar generate lebih cepat
    cachedBgImg = new Image();
    cachedBgImg.src = 'qris2.png';
});

// --- Tab System ---
function switchTab(mode) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('mode-scan').classList.add('hidden');
    document.getElementById('mode-text').classList.add('hidden');
    document.getElementById('mode-saved').classList.add('hidden');

    if (mode === 'scan') {
        document.getElementById('btn-scan').classList.add('active');
        document.getElementById('mode-scan').classList.remove('hidden');
    } else if (mode === 'text') {
        document.getElementById('btn-text').classList.add('active');
        document.getElementById('mode-text').classList.remove('hidden');
    } else if (mode === 'saved') {
        document.getElementById('btn-saved').classList.add('active');
        document.getElementById('mode-saved').classList.remove('hidden');
    }
}

// --- Logic Scan Gambar (jsQR) ---
document.getElementById('file-input').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    document.getElementById('file-label').innerText = "Memproses...";

    const reader = new FileReader();
    reader.onload = function(ev) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width; canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, canvas.width, canvas.height);

            if (code) {
                scannedData = code.data;
                document.getElementById('scan-status').classList.remove('hidden');
                document.getElementById('file-label').innerText = file.name;
                document.getElementById('text-input').value = scannedData;
            } else {
                alert("QR tidak terbaca! Gunakan gambar yang lebih jelas.");
                document.getElementById('file-label').innerText = "Coba Lagi";
            }
        };
        img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
});

// --- Logic QRIS Client-Side (Pengganti API) ---
function convertCRC16(str) {
    let crc = 0xFFFF;
    for (let c = 0; c < str.length; c++) {
        crc ^= str.charCodeAt(c) << 8;
        for (let i = 0; i < 8; i++) {
            if (crc & 0x8000) {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc = crc << 1;
            }
            crc &= 0xFFFF;
        }
    }
    let hex = crc.toString(16).toUpperCase();
    while (hex.length < 4) hex = '0' + hex;
    return hex;
}

function generateQRISPayload(rawQris, nominal, feeType, feeValue) {
    let qris = rawQris.trim();
    if (!qris || !nominal) throw new Error("QRIS dan Nominal wajib diisi!");
    
    let qris_body = qris.slice(0, -4);
    if (qris_body.slice(-4) === "6304") {
        qris_body = qris_body.slice(0, -4);
    }
    
    qris_body = qris_body.replace('010211', '010212');
    
    let total_amount = parseInt(nominal);
    let fee = parseInt(feeValue) || 0;
    if (feeType && fee > 0) {
        if (feeType === 'r') {
            total_amount += fee;
        } else if (feeType === 'p') {
            total_amount += Math.round(nominal * (fee / 100));
        }
    }
    
    let totalStr = total_amount.toString();
    let len = totalStr.length.toString().padStart(2, '0');
    let amount_tag = "54" + len + totalStr;
    
    let parts = qris_body.split("5802ID");
    if (parts.length !== 2) {
        throw new Error("Format QRIS tidak valid (Tag 5802ID tidak ditemukan).");
    }
    
    let payload = parts[0] + amount_tag + "5802ID" + parts[1];
    payload += "6304";
    let crc = convertCRC16(payload);
    return payload + crc;
}

function processQRIS() {
    let qrisRaw = scannedData;
    
    if (!document.getElementById('mode-text').classList.contains('hidden')) {
        qrisRaw = document.getElementById('text-input').value;
    } else if (!document.getElementById('mode-saved').classList.contains('hidden')) {
        qrisRaw = document.getElementById('saved-input').value;
    }

    const nominalStr = document.getElementById('nominal').value;
    const nominal = nominalStr.replace(/\./g, '');
    const feeType = document.getElementById('fee-type').value;
    const feeValueStr = document.getElementById('fee-value').value;
    const feeValue = feeValueStr.replace(/\./g, '');

    if (!qrisRaw || !nominal) {
        alert("Mohon lengkapi Data QRIS dan Nominal!");
        return;
    }

    const btn = document.getElementById('btn-generate');
    btn.innerText = "Memproses...";
    btn.disabled = true;

    try {
        const finalPayload = generateQRISPayload(qrisRaw, nominal, feeType, feeValue);
        renderResult(finalPayload);
    } catch (error) {
        console.error(error);
        alert("Error: " + error.message);
    } finally {
        btn.innerText = "Generate QRIS Dinamis";
        btn.disabled = false;
    }
}

// --- Render Hasil ---
function renderResult(payload) {
    const emptyState = document.getElementById('empty-state');
    if(emptyState) emptyState.classList.add('hidden');
    
    document.getElementById('result-area').classList.remove('hidden');
    
    const nominalVal = document.getElementById('nominal').value || '0';
    const nominalClean = parseInt(nominalVal.replace(/\./g, '')) || 0;
    
    const feeType = document.getElementById('fee-type').value;
    const feeValStr = document.getElementById('fee-value').value || '0';
    const feeClean = parseInt(feeValStr.replace(/\./g, '')) || 0;
    
    let totalNominal = nominalClean;
    let feeText = "";
    
    if (feeType === 'r' && feeClean > 0) {
        totalNominal += feeClean;
        feeText = ` (+ Rp ${feeClean.toLocaleString('id-ID')})`;
    } else if (feeType === 'p' && feeClean > 0) {
        const percentFee = Math.round(nominalClean * (feeClean / 100));
        totalNominal += percentFee;
        feeText = ` (+ ${feeClean}%)`;
    }
    
    document.getElementById('result-info').innerText = "Rp " + totalNominal.toLocaleString('id-ID') + feeText;
    document.getElementById('final-payload').value = payload;

    const container = document.getElementById('qr-container');
    container.innerHTML = "<p>Memproses QRIS...</p>";
    
    const tempDiv = document.createElement('div');
    new QRCode(tempDiv, {
        text: payload,
        width: 400,
        height: 400,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.M
    });

    setTimeout(() => {
        let qrCanvas = tempDiv.querySelector('canvas');
        if (!qrCanvas) {
            const qrImg = tempDiv.querySelector('img');
            if (qrImg) {
                qrCanvas = document.createElement('canvas');
                qrCanvas.width = qrImg.width;
                qrCanvas.height = qrImg.height;
                qrCanvas.getContext('2d').drawImage(qrImg, 0, 0);
            }
        }

        if (!qrCanvas) {
            container.innerHTML = "Gagal membuat QR.";
            return;
        }

        const drawFinal = (bg) => {
            const finalCanvas = document.createElement('canvas');
            const ctx = finalCanvas.getContext('2d');
            
            finalCanvas.width = bg.width;
            finalCanvas.height = bg.height;
            ctx.drawImage(bg, 0, 0);
            
            const qrSize = Math.round(bg.width * 0.60);
            const qrX = (bg.width - qrSize) / 2;
            const qrY = (bg.height - qrSize) / 2; 

            ctx.fillStyle = "#ffffff";
            ctx.fillRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);
            ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);
            
            const now = new Date();
            const day = String(now.getDate()).padStart(2, '0');
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const year = now.getFullYear();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const timestampText = `Dicetak pada : ${day}/${month}/${year} ${hours}:${minutes}`;

            const fontSize = Math.max(16, Math.round(bg.width * 0.025));
            ctx.font = `bold ${fontSize}px sans-serif`;
            ctx.textAlign = "left";
            ctx.fillStyle = "#000000";
            
            const textX = bg.width * 0.05;
            const textY = bg.height - (bg.height * 0.03);

            ctx.lineWidth = 4;
            ctx.strokeStyle = "#ffffff";
            ctx.strokeText(timestampText, textX, textY);
            ctx.fillText(timestampText, textX, textY);

            container.innerHTML = "";
            finalCanvas.style.width = '100%';
            finalCanvas.style.maxWidth = '350px';
            finalCanvas.style.borderRadius = '12px';
            finalCanvas.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
            container.appendChild(finalCanvas);
        };

        if (cachedBgImg && cachedBgImg.complete && cachedBgImg.naturalWidth !== 0) {
            drawFinal(cachedBgImg);
        } else {
            const bgImg = new Image();
            bgImg.src = 'qris2.png';
            bgImg.onload = () => drawFinal(bgImg);
            bgImg.onerror = () => {
                container.innerHTML = "";
                container.appendChild(qrCanvas);
            };
        }
    }, 50);
}

// --- Local Storage Templates ---
function loadTemplates() {
    const templates = JSON.parse(localStorage.getItem('qris_templates') || '[]');
    const select = document.getElementById('saved-input');
    const listContainer = document.getElementById('saved-list-container');
    
    select.innerHTML = '<option value="">-- Pilih QRIS --</option>';
    templates.forEach(t => {
        let opt = document.createElement('option');
        opt.value = t.qris;
        opt.text = t.name;
        select.appendChild(opt);
    });
    
    if(listContainer) {
        listContainer.innerHTML = '';
        if (templates.length === 0) {
            listContainer.innerHTML = '<p style="color:var(--text-secondary); text-align:center; padding:10px;">Belum ada template.</p>';
        } else {
            templates.forEach((t, i) => {
                listContainer.innerHTML += `
                    <div class="saved-item">
                        <div class="saved-item-info">
                            <span class="saved-item-name">${t.name}</span>
                            <span class="saved-item-qris">${t.qris.substring(0, 15)}...</span>
                        </div>
                        <div class="saved-item-actions">
                            <button onclick="deleteTemplate(${i})" class="btn-danger">Hapus</button>
                        </div>
                    </div>
                `;
            });
        }
    }
}

function saveTemplate() {
    const name = document.getElementById('save-name').value.trim();
    const qris = document.getElementById('save-string').value.trim();
    if (!name || !qris) {
        alert("Nama dan String QRIS wajib diisi!");
        return;
    }
    
    const templates = JSON.parse(localStorage.getItem('qris_templates') || '[]');
    templates.push({ name, qris });
    localStorage.setItem('qris_templates', JSON.stringify(templates));
    
    document.getElementById('save-name').value = '';
    document.getElementById('save-string').value = '';
    loadTemplates();
}

function deleteTemplate(index) {
    if(confirm("Hapus template ini?")) {
        const templates = JSON.parse(localStorage.getItem('qris_templates') || '[]');
        templates.splice(index, 1);
        localStorage.setItem('qris_templates', JSON.stringify(templates));
        loadTemplates();
    }
}

function openSaveModal() {
    loadTemplates();
    document.getElementById('save-modal').classList.remove('hidden');
}

function closeSaveModal() {
    document.getElementById('save-modal').classList.add('hidden');
}

// --- Helper UI ---
document.getElementById('nominal').addEventListener('input', function(e) {
    let value = this.value.replace(/[^0-9]/g, '');
    this.value = value ? parseInt(value, 10).toLocaleString('id-ID') : '';
});

document.getElementById('fee-value').addEventListener('input', function(e) {
    const feeType = document.getElementById('fee-type').value;
    if (feeType === 'r') {
        let value = this.value.replace(/[^0-9]/g, '');
        this.value = value ? parseInt(value, 10).toLocaleString('id-ID') : '';
    }
});

document.getElementById('fee-type').addEventListener('change', function(e) {
    const feeInput = document.getElementById('fee-value');
    feeInput.value = '';
    if (this.value === '') {
        feeInput.disabled = true;
        feeInput.style.backgroundColor = 'var(--bg-app)';
    } else {
        feeInput.disabled = false;
        feeInput.style.backgroundColor = 'var(--input-bg)';
        feeInput.focus();
    }
});

document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
        if (e.target.id !== 'btn-generate') {
            e.preventDefault(); 
            processQRIS();
        }
    }
});

function downloadQR() {
    const canvas = document.querySelector('#qr-container canvas');
    if (canvas) {
        const a = document.createElement('a');
        a.href = canvas.toDataURL("image/png");
        a.download = 'qris-dinamis.png';
        a.click();
    }
}

function copyQR() {
    const text = document.getElementById('final-payload');
    text.select();
    document.execCommand('copy');
    alert("String QRIS berhasil disalin!");
}

function fullPreview() {
    const canvas = document.querySelector('#qr-container canvas');
    if (canvas) {
        document.getElementById('full-preview-img').src = canvas.toDataURL("image/png");
        document.getElementById('full-preview-modal').classList.remove('hidden');
    } else {
        alert("Buat QRIS terlebih dahulu!");
    }
}

function closeFullPreview() {
    document.getElementById('full-preview-modal').classList.add('hidden');
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('full-preview-modal');
        if (modal && !modal.classList.contains('hidden')) {
            closeFullPreview();
        }
        closeSaveModal();
    }
});

// --- Dark Mode ---
const themeToggleBtn = document.getElementById('theme-toggle');
const htmlEl = document.documentElement;
const currentTheme = localStorage.getItem('theme') || 'light';
htmlEl.setAttribute('data-theme', currentTheme);
updateIcon(currentTheme);

themeToggleBtn.addEventListener('click', () => {
    let theme = htmlEl.getAttribute('data-theme');
    let newTheme = theme === 'light' ? 'dark' : 'light';
    htmlEl.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateIcon(newTheme);
});

function updateIcon(theme) {
    const iconEl = document.getElementById('theme-icon');
    iconEl.dataset.icon = theme === 'dark' ? 'sun' : 'moon';
    injectIcons();
}
