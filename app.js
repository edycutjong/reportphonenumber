// ==========================================================================
// 📱 PHONESHIELD EXCEL-TO-CARD REPORT GENERATOR (Vanilla JS)
// ==========================================================================

let currentData = [];

// DOM Elements & Initialization
document.addEventListener('DOMContentLoaded', () => {
  initExcelUploader();
  initExportActions();
  initParticleEngine();
  loadLatestVersion();
});

async function loadLatestVersion() {
  try {
    const response = await fetch('https://api.github.com/repos/edycutjong/reportphonenumber/releases/latest');
    if (response.ok) {
      const data = await response.json();
      if (data.tag_name) {
        const versionSpan = document.getElementById('appVersion');
        if (versionSpan) {
          versionSpan.innerText = data.tag_name;
        }
      }
    }
  } catch (err) {
    console.warn('Failed to fetch latest version from GitHub releases:', err);
  }
}

// ==========================================================================
// 📂 SPREADSHEET PARSER & DRAG-AND-DROP SETUP
// ==========================================================================
function initExcelUploader() {
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('excelFileInput');

  if (!dropZone || !fileInput) return;

  dropZone.addEventListener('click', () => fileInput.click());

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--primary)';
    dropZone.style.background = 'rgba(6, 182, 212, 0.08)';
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = 'var(--border-color)';
    dropZone.style.background = 'rgba(0, 0, 0, 0.1)';
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--border-color)';
    dropZone.style.background = 'rgba(0, 0, 0, 0.1)';
    if (e.dataTransfer.files.length) {
      handleSpreadsheet(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
      handleSpreadsheet(e.target.files[0]);
    }
  });

  const loadExampleBtn = document.getElementById('loadExampleBtn');
  if (loadExampleBtn) {
    loadExampleBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Stop click propagating to the dropZone parent click handler
      loadExampleFile();
    });
  }

  const loadStressBtn = document.getElementById('loadStressBtn');
  if (loadStressBtn) {
    loadStressBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      loadStressFile();
    });
  }
}

async function loadExampleFile() {
  try {
    const fileTextEl = document.getElementById('fileInfoText');
    if (fileTextEl) fileTextEl.innerText = 'Fetching test.xlsx from workspace...';
    
    const response = await fetch('test.xlsx');
    if (!response.ok) {
      throw new Error('test.xlsx not found. Please make sure test.xlsx exists in the workspace folder.');
    }
    const blob = await response.blob();
    const file = new File([blob], "test.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    handleSpreadsheet(file);
  } catch (err) {
    alert("Error loading example file: " + err.message);
    const fileTextEl = document.getElementById('fileInfoText');
    if (fileTextEl) fileTextEl.innerText = '';
  }
}

async function loadStressFile() {
  try {
    const fileTextEl = document.getElementById('fileInfoText');
    if (fileTextEl) fileTextEl.innerText = 'Fetching test_stress.xlsx from workspace...';
    
    const response = await fetch('test_stress.xlsx');
    if (!response.ok) {
      throw new Error('test_stress.xlsx not found. Please make sure test_stress.xlsx exists in the workspace folder.');
    }
    const blob = await response.blob();
    const file = new File([blob], "test_stress.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    handleSpreadsheet(file);
  } catch (err) {
    alert("Error loading stress test file: " + err.message);
    const fileTextEl = document.getElementById('fileInfoText');
    if (fileTextEl) fileTextEl.innerText = '';
  }
}

function handleSpreadsheet(file) {
  if (!file) return;

  const fileTextEl = document.getElementById('fileInfoText');
  fileTextEl.innerText = `Reading "${file.name}"...`;

  const reader = new FileReader();
  const ext = file.name.split('.').pop().toLowerCase();

  reader.onload = function(e) {
    try {
      const data = e.target.result;
      let workbook;

      if (ext === 'csv') {
        const text = new TextDecoder('utf-8').decode(data);
        workbook = XLSX.read(text, { type: 'string' });
      } else {
        const bytes = new Uint8Array(data);
        workbook = XLSX.read(bytes, { type: 'array' });
      }

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      
      // Use raw: false to get formatted cell string values directly, preserving large integers
      const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });

      if (rawRows.length < 2) {
        alert('Spreadsheet is empty or lacks data rows.');
        fileTextEl.innerText = '';
        return;
      }

      const headers = rawRows[0].map(h => String(h || '').trim());
      const dataRows = rawRows.slice(1).filter(row => row.some(cell => cell !== ''));

      if (dataRows.length === 0) {
        alert('No data rows found in sheet.');
        fileTextEl.innerText = '';
        return;
      }

      // Map spreadsheet columns dynamically
      const noIdx = headers.findIndex(h => h.toLowerCase() === 'no');
      const phoneIdx = headers.findIndex(h => h.toLowerCase().includes('pelanggan') || h.toLowerCase().includes('phone') || h.toLowerCase().includes('number') || h.toLowerCase() === 'tel');
      const dateIdx = headers.findIndex(h => h.toLowerCase().includes('tanggal') || h.toLowerCase().includes('date'));
      const timeIdx = headers.findIndex(h => h.toLowerCase().includes('waktu') || h.toLowerCase().includes('time'));
      const providerIdx = headers.findIndex(h => h.toLowerCase().includes('provider') || h.toLowerCase().includes('operator') || h.toLowerCase().includes('carrier'));
      const serialIdx = headers.findIndex(h => h.toLowerCase().includes('serial') || h.toLowerCase() === 'sn' || h.toLowerCase() === 's/n');
      const statusIdx = headers.findIndex(h => h.toLowerCase().includes('status'));

      if (phoneIdx === -1) {
        alert('Could not detect a Phone Number or "No Pelanggan" column in spreadsheet.');
        fileTextEl.innerText = '';
        return;
      }

      // Format records
      currentData = dataRows.map((row, index) => {
        return {
          no: noIdx !== -1 ? String(row[noIdx] || '').trim() : String(index + 1),
          noPelanggan: String(row[phoneIdx] || '').trim(),
          tanggal: dateIdx !== -1 ? String(row[dateIdx] || '').trim() : new Date().toLocaleDateString('en-GB'),
          waktu: timeIdx !== -1 ? String(row[timeIdx] || '').trim() : new Date().toLocaleTimeString('en-GB'),
          provider: providerIdx !== -1 ? String(row[providerIdx] || '').trim() : 'Unknown',
          serialNumber: serialIdx !== -1 ? String(row[serialIdx] || '').trim() : `SN-${20260000 + index}`,
          status: statusIdx !== -1 ? String(row[statusIdx] || '').trim() : 'Sukses'
        };
      });

      fileTextEl.innerText = `Loaded ${currentData.length} records successfully.`;
      
      // Render Preview Cards
      renderCardsGrid();
      
      // Show controls and preview
      document.getElementById('exportControls').style.display = 'flex';
      document.getElementById('previewSection').style.display = 'block';
      
      // Trigger particles
      emitConfetti(window.innerWidth);
      showToast(`Imported ${currentData.length} records. Layout generated!`);
      
    } catch (err) {
      console.error(err);
      alert('Error parsing spreadsheet file: ' + err.message);
      fileTextEl.innerText = '';
    }
  };

  reader.readAsArrayBuffer(file);
}

// ==========================================================================
// 🖼️ RENDER CARDS GRID IN PREVIEW
// ==========================================================================
function renderCardsGrid() {
  const grid = document.getElementById('reportsCardGrid');
  if (!grid) return;
  grid.innerHTML = '';

  currentData.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'visual-card';

    // Status styling classes
    let statusClass = '';
    const statusLower = item.status.toLowerCase();
    if (statusLower.includes('sukses') || statusLower.includes('success') || statusLower.includes('ok') || statusLower.includes('safe')) {
      statusClass = ''; // Green
    } else if (statusLower.includes('pending') || statusLower.includes('warn') || statusLower.includes('process')) {
      statusClass = 'warning'; // Amber
    } else {
      statusClass = 'danger'; // Red
    }

    card.innerHTML = `
      <div class="visual-card-header">
        <span class="visual-card-no">${item.no}</span>
        <span class="visual-card-phone">${item.noPelanggan}</span>
      </div>
      <hr class="visual-card-divider">
      <div class="visual-card-body">
        <div class="visual-card-row">
          <span class="visual-card-label">Tanggal</span>
          <span class="visual-card-value">${item.tanggal}</span>
        </div>
        <div class="visual-card-row">
          <span class="visual-card-label">Waktu</span>
          <span class="visual-card-value">${item.waktu}</span>
        </div>
        <div class="visual-card-row">
          <span class="visual-card-label">Provider</span>
          <span class="visual-card-value">${item.provider}</span>
        </div>
        <div class="visual-card-row">
          <span class="visual-card-label">No. Pelanggan</span>
          <span class="visual-card-value">${item.noPelanggan}</span>
        </div>
        <div class="visual-card-row">
          <span class="visual-card-label">Serial Number</span>
          <span class="visual-card-value" style="font-family: monospace;">${item.serialNumber}</span>
        </div>
        <div class="visual-card-row">
          <span class="visual-card-label">Status</span>
          <span class="visual-card-value">
            <span class="visual-card-status-pill ${statusClass}">${item.status}</span>
          </span>
        </div>
      </div>
    `;
    grid.appendChild(card);

    // Insert page break after every 6th card (for PDF pagination)
    if ((index + 1) % 6 === 0 && index !== currentData.length - 1) {
      const pageBreak = document.createElement('div');
      pageBreak.className = 'pdf-page-break';
      grid.appendChild(pageBreak);
    }
  });
}

// ==========================================================================
// 💾 EXPORTS & DOWNLOAD ACTIONS
// ==========================================================================
function initExportActions() {
  document.getElementById('downloadWordBtn').addEventListener('click', downloadWordReport);
  document.getElementById('downloadPdfBtn').addEventListener('click', downloadPdfReport);
}

function downloadWordReport() {
  if (currentData.length === 0) return;

  // Generate a Word-compatible HTML table structure to render cards side-by-side
  let tableRowsHTML = '';
  
  for (let i = 0; i < currentData.length; i += 2) {
    const item1 = currentData[i];
    const item2 = currentData[i + 1];

    let card1HTML = buildWordCardHTML(item1);
    let card2HTML = item2 ? buildWordCardHTML(item2) : '<div style="width:330pt;"></div>';

    tableRowsHTML += `
      <tr>
        <td valign="top" style="padding: 10px; width: 50%;">${card1HTML}</td>
        <td valign="top" style="padding: 10px; width: 50%;">${card2HTML}</td>
      </tr>
    `;
  }

  const wordTemplate = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>PhoneShield Report</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #ffffff; margin: 0; }
        .card-table { border-collapse: collapse; width: 100%; }
        .card-container {
          background-color: #ffffff;
          border: 2px solid #d1d5db;
          border-radius: 15px;
          padding: 20px;
          margin-bottom: 20px;
        }
        .card-title-no { font-size: 20pt; font-weight: bold; color: #0f172a; }
        .card-title-phone { font-size: 20pt; font-weight: bold; color: #0f172a; text-align: right; }
        .blue-divider { height: 3px; background-color: #1a73e8; margin-top: 5px; margin-bottom: 15px; border-radius: 2px; }
        .item-row { margin-bottom: 8px; font-size: 11pt; }
        .item-label { font-weight: bold; color: #4b5563; width: 130pt; display: inline-block; text-align: left; }
        .item-value { color: #111827; }
        .pill-success { background-color: #e6f4ea; color: #137333; border: 1px solid #ceead6; padding: 2px 14px; border-radius: 12px; font-weight: bold; }
        .pill-warning { background-color: #fef3c7; color: #92400e; border: 1px solid #fde68a; padding: 2px 14px; border-radius: 12px; font-weight: bold; }
        .pill-danger { background-color: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; padding: 2px 14px; border-radius: 12px; font-weight: bold; }
      </style>
    </head>
    <body>
      <table class="card-table">
        ${tableRowsHTML}
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff' + wordTemplate], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `PhoneShield_Report_${new Date().toISOString().split('T')[0]}.doc`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  
  showToast("Word document download started!");
}

function buildWordCardHTML(item) {
  if (!item) return '';

  let pillClass = 'pill-success';
  const statusLower = item.status.toLowerCase();
  if (statusLower.includes('sukses') || statusLower.includes('success') || statusLower.includes('ok') || statusLower.includes('safe')) {
    pillClass = 'pill-success';
  } else if (statusLower.includes('pending') || statusLower.includes('warn') || statusLower.includes('process')) {
    pillClass = 'pill-warning';
  } else {
    pillClass = 'pill-danger';
  }

  return `
    <div class="card-container">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td class="card-title-no" style="font-family: Arial; font-weight: bold; font-size: 20pt; color: #000000; width: 30pt;">${item.no}</td>
          <td class="card-title-phone" style="font-family: Arial; font-weight: bold; font-size: 20pt; color: #000000; text-align: right;">${item.noPelanggan}</td>
        </tr>
      </table>
      <div class="blue-divider"></div>
      <div class="item-row">
        <span class="item-label">Tanggal</span>
        <span class="item-value">${item.tanggal}</span>
      </div>
      <div class="item-row" style="margin-top: 6px;">
        <span class="item-label">Waktu</span>
        <span class="item-value">${item.waktu}</span>
      </div>
      <div class="item-row" style="margin-top: 6px;">
        <span class="item-label">Provider</span>
        <span class="item-value">${item.provider}</span>
      </div>
      <div class="item-row" style="margin-top: 6px;">
        <span class="item-label">No. Pelanggan</span>
        <span class="item-value">${item.noPelanggan}</span>
      </div>
      <div class="item-row" style="margin-top: 6px;">
        <span class="item-label">Serial Number</span>
        <span class="item-value" style="font-family: Courier New, monospace;">${item.serialNumber}</span>
      </div>
      <div class="item-row" style="margin-top: 10px;">
        <span class="item-label">Status</span>
        <span class="${pillClass}">${item.status}</span>
      </div>
    </div>
  `;
}

function downloadPdfReport() {
  if (currentData.length === 0) return;

  const element = document.getElementById('reportsCardGrid');
  
  // Set options for html2pdf rendering
  const opt = {
    margin: 10,
    filename: `PhoneShield_Report_${new Date().toISOString().split('T')[0]}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2, 
      useCORS: true, 
      backgroundColor: '#e5e7eb', // Keep matching screenshot background color
      scrollY: 0,
      scrollX: 0
    },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4', 
      orientation: 'portrait' // Fits 2-column portrait layouts (3 rows of 2 cards = 6 cards) perfectly
    },
    pagebreak: { 
      mode: ['css', 'legacy'], 
      avoid: '.visual-card' 
    }
  };

  showToast("Compiling PDF report cards...");
  
  // Generate PDF
  html2pdf().from(element).set(opt).save()
    .then(() => {
      showToast("PDF report cards downloaded!");
    })
    .catch(err => {
      console.error(err);
      alert('Error generating PDF: ' + err.message);
    });
}

// ==========================================================================
// 💡 TOAST SYSTEM
// ==========================================================================
function showToast(message) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%) translateY(20px);
    background: rgba(17, 24, 39, 0.95);
    color: var(--primary);
    border: 1px solid var(--primary);
    border-radius: var(--radius-sm);
    padding: 14px 28px;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 4px 20px var(--primary-glow);
    z-index: 10000;
    pointer-events: none;
    opacity: 0;
    transition: all var(--transition-normal);
  `;
  toast.innerHTML = `🛡️ ${message}`;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  }, 50);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(-20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ==========================================================================
// ✨ CONFETTI CANVAS EFFECTS
// ==========================================================================
const particles = [];
let canvas, ctx;

function initParticleEngine() {
  canvas = document.getElementById('effects-canvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  
  const resizeCanvas = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  requestAnimationFrame(particleLoop);
}

class Particle {
  constructor(x, y, options = {}) {
    this.x = x;
    this.y = y;
    this.vx = options.vx ?? (Math.random() - 0.5) * 6;
    this.vy = options.vy ?? (Math.random() - 0.5) * 6;
    this.life = options.life ?? 1.0;
    this.decay = options.decay ?? 0.02 + Math.random() * 0.02;
    this.size = options.size ?? 2 + Math.random() * 3;
    this.color = options.color ?? '#06b6d4';
    this.gravity = options.gravity ?? 0.1;
    this.shrink = options.shrink ?? true;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.life -= this.decay;
  }

  draw(cContext) {
    if (this.life <= 0) return;
    cContext.save();
    cContext.globalAlpha = this.life;
    cContext.fillStyle = this.color;
    const s = this.shrink ? this.size * this.life : this.size;
    cContext.fillRect(this.x - s / 2, this.y - s / 2, s, s);
    cContext.restore();
  }
}

function particleLoop() {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  if (particles.length > 200) {
    particles.splice(0, particles.length - 200);
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].draw(ctx);
    if (particles[i].life <= 0) {
      particles.splice(i, 1);
    }
  }

  requestAnimationFrame(particleLoop);
}

function emitConfetti(canvasWidth, count = 60) {
  const colors = ['#06b6d4', '#a855f7', '#10b981', '#f59e0b', '#ef4444'];
  for (let i = 0; i < count; i++) {
    particles.push(new Particle(
      Math.random() * canvasWidth, -10,
      {
        vx: (Math.random() - 0.5) * 5,
        vy: 2 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 5 + Math.random() * 6,
        gravity: 0.04,
        decay: 0.005 + Math.random() * 0.005,
        shrink: false
      }
    ));
  }
}
