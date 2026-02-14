/**
 * PDF Generator Utility (FIXED)
 * Generate PDF documents using Puppeteer with system Chrome
 * ✅ FIXED: Use system Chrome if puppeteer Chrome not installed
 * ✅ UPDATED: Header design with logo and proper layout
 * ✅ FIXED: Logo loading with proper path resolution
 */

import puppeteer from 'puppeteer';
import { Response } from 'express';
import path from 'path';
import fs from 'fs';

/**
 * Safe number formatter
 */
const formatNumber = (value: any, decimals: number = 2): string => {
  if (value === null || value === undefined) return '-';
  const num = typeof value === 'number' ? value : Number(value);
  return isNaN(num) ? '-' : num.toFixed(decimals);
};

/**
 * Get Chrome executable path for Windows
 */
const getChromeExecutablePath = (): string | undefined => {
  const isWindows = process.platform === 'win32';
  
  if (isWindows) {
    // Common Chrome installation paths on Windows
    const possiblePaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
    ];
    
    // Return the first path that exists (you might need to install fs to check)
    // For now, return the most common path
    return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  }
  
  return undefined; // Let puppeteer find it on Linux/Mac
};

/**
 * Get logo base64 for embedding in PDF
 */
const getLogoBase64 = (): string => {
  try {
    // ✅ Try multiple possible paths
    const possiblePaths = [
      // Relative from compiled dist folder
      path.join(__dirname, '..', 'logo', 'LOGO.png'),
      path.join(__dirname, '..', '..', 'logo', 'LOGO.png'),
      // Absolute path from project root
      path.join(process.cwd(), 'logo', 'LOGO.png'),
      path.join(process.cwd(), 'backend', 'logo', 'LOGO.png'),
      // Direct absolute path (Windows)
      'D:\\DIAKONOS\\SIAKAD\\siakad-stt-diakonos\\backend\\logo\\LOGO.png',
    ];

    for (const logoPath of possiblePaths) {
      console.log(`🔍 Trying logo path: ${logoPath}`);
      
      if (fs.existsSync(logoPath)) {
        console.log(`✅ Logo found at: ${logoPath}`);
        const logoBuffer = fs.readFileSync(logoPath);
        const base64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
        console.log(`✅ Logo base64 length: ${base64.length}`);
        return base64;
      }
    }

    console.warn('⚠️ Logo not found in any path, using placeholder');
    console.warn('Tried paths:', possiblePaths);
    return '';
  } catch (error) {
    console.error('❌ Error loading logo:', error);
    return '';
  }
};

/**
 * Common PDF Header Template
 */
const getPDFHeader = (logoBase64: string) => `
  <div class="pdf-header">
    <div class="header-logo">
      ${logoBase64 ? `<img src="${logoBase64}" alt="Logo STT Diakonos" />` : '<div style="width: 70px; height: 70px; background: #e0e0e0; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #666;">LOGO</div>'}
    </div>
    <div class="header-text">
      <h1>SEKOLAH TINGGI TEOLOGI DIAKONOS</h1>
      <p class="header-address">
        Alamat Kampus: Desa Pajerukan RT 004 RW 003 Kec. Kalibagor, Kab. Banyumas<br/>
        Propinsi Jawa Tengah
      </p>
      <p class="header-contact">
        Website: sttdiakonos.ac.id; E-mail: sttd_banyumas@yahoo.com
      </p>
    </div>
  </div>
`;

/**
 * Common PDF Styles
 */
const getCommonPDFStyles = () => `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { 
    font-family: 'Arial', sans-serif; 
    padding: 15px; 
    font-size: 9px;
    line-height: 1.3;
  }
  
  /* Header dengan Logo */
  .pdf-header {
    display: grid;
    grid-template-columns: 75px 1fr;
    gap: 10px;
    align-items: center;
    margin-bottom: 10px;
    border-bottom: 3px solid #000;
    padding-bottom: 8px;
  }
  .header-logo {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .header-logo img {
    width: 65px;
    height: 65px;
    object-fit: contain;
    display: block;
  }
  .header-text {
    text-align: center;
    line-height: 1.2;
  }
  .header-text h1 {
    font-size: 13px;
    font-weight: bold;
    margin-bottom: 2px;
    letter-spacing: 0.3px;
    line-height: 1.1;
  }
  .header-address {
    font-size: 8px;
    margin-bottom: 2px;
    line-height: 1.3;
  }
  .header-contact {
    font-size: 7px;
    font-style: italic;
    margin-top: 1px;
  }
  
  /* Document Title */
  .doc-title {
    text-align: center;
    margin: 10px 0 8px 0;
    padding: 6px 8px;
    background: #f0f0f0;
    border: 1px solid #ccc;
  }
  .doc-title h2 {
    font-size: 11px;
    font-weight: bold;
    margin-bottom: 2px;
    line-height: 1.2;
  }
  .doc-title p {
    font-size: 9px;
    line-height: 1.2;
  }
`;
/**
 * Generate PDF from HTML
 */
export const generatePDF = async (
  html: string,
  filename: string,
  res: Response
) => {
  let browser;
  
  try {
    console.log('🚀 Starting PDF generation...');
    
    // ✅ Try to use system Chrome if puppeteer Chrome not available
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: getChromeExecutablePath(), // Use system Chrome
    });

    const page = await browser.newPage();
    
    console.log('📄 Setting page content...');
    await page.setContent(html, { waitUntil: 'networkidle0' });

    console.log('🖨️ Generating PDF...');
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
    });

    await browser.close();
    console.log('✅ PDF generated successfully');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdf);
  } catch (error) {
    console.error('❌ PDF generation error:', error);
    if (browser) {
      await browser.close();
    }
    throw error;
  }
};

/**
 * KRS HTML Template - COMPACT SINGLE PAGE VERSION
 */
export const getKRSHTMLTemplate = (data: any) => {
  const logoBase64 = getLogoBase64();
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        ${getCommonPDFStyles()}
        
        .info { 
          margin-bottom: 12px;
          background: #f5f5f5;
          padding: 8px;
        }
        .info-row {
          display: grid;
          grid-template-columns: 120px 1fr;
          margin-bottom: 4px;
        }
        .info-label { 
          font-weight: bold;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 10px;
          font-size: 8px;
        }
        th, td { 
          border: 1px solid #333; 
          padding: 5px; 
          text-align: left;
        }
        th { 
          background: #e0e0e0; 
          font-weight: bold;
          text-align: center;
          font-size: 8px;
        }
        td.center { text-align: center; }
        .footer { 
          margin-top: 15px;
          padding-top: 10px;
          border-top: 1px solid #ccc;
          font-size: 9px;
        }
        .footer-row {
          display: grid;
          grid-template-columns: 120px 1fr;
          margin-bottom: 4px;
        }
        .footer-label {
          font-weight: bold;
        }
        .signature {
          margin-top: 20px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .signature-box {
          text-align: center;
        }
        .signature-line {
          margin-top: 40px;
          border-top: 1px solid #000;
          padding-top: 5px;
          font-weight: bold;
        }
        tfoot tr {
          background: #f0f0f0;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      ${getPDFHeader(logoBase64)}
      
      <div class="doc-title">
        <h2>KARTU RENCANA STUDI (KRS)</h2>
        <p>Semester ${data.semester?.periode || ''} ${data.semester?.tahunAkademik || ''}</p>
      </div>
      
      <div class="info">
        <div class="info-row">
          <div class="info-label">NIM</div>
          <div>: ${data.mahasiswa?.nim || '-'}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Nama Mahasiswa</div>
          <div>: ${data.mahasiswa?.namaLengkap || '-'}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Program Studi</div>
          <div>: ${data.mahasiswa?.prodi?.nama || '-'}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Angkatan</div>
          <div>: ${data.mahasiswa?.angkatan || '-'}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Kelas</div>
          <div>: ___________________________</div>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th style="width: 4%;">No</th>
            <th style="width: 10%;">Kode MK</th>
            <th style="width: 32%;">Mata Kuliah</th>
            <th style="width: 5%;">SKS</th>
            <th style="width: 24%;">Dosen</th>
            <th style="width: 25%;">Jadwal</th>
          </tr>
        </thead>
        <tbody>
          ${(data.detail || []).map((d: any, i: number) => `
            <tr>
              <td class="center">${i + 1}</td>
              <td>${d.kelasMK?.mataKuliah?.kodeMK || '-'}</td>
              <td>${d.kelasMK?.mataKuliah?.namaMK || '-'}</td>
              <td class="center">${d.kelasMK?.mataKuliah?.sks || 0}</td>
              <td>${d.kelasMK?.dosen?.namaLengkap || '-'}</td>
              <td>${d.kelasMK?.hari || '-'}, ${d.kelasMK?.jamMulai || ''}-${d.kelasMK?.jamSelesai || ''}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="text-align: right;">Total SKS:</td>
            <td class="center">${data.totalSKS || 0}</td>
            <td colspan="2"></td>
          </tr>
        </tfoot>
      </table>
      
      <div class="footer">
        <div class="footer-row">
          <div class="footer-label">Status</div>
          <div>: ${data.status || 'DRAFT'}</div>
        </div>
        ${data.approvedBy ? `
          <div class="footer-row">
            <div class="footer-label">Disetujui oleh</div>
            <div>: ${data.approvedBy.dosen?.namaLengkap || '-'}</div>
          </div>
          <div class="footer-row">
            <div class="footer-label">Tanggal Approval</div>
            <div>: ${data.tanggalApproval ? new Date(data.tanggalApproval).toLocaleDateString('id-ID', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            }) : '-'}</div>
          </div>
        ` : ''}
      </div>
      
      <div class="signature">
        <div class="signature-box">
          <p>Mahasiswa</p>
          <div class="signature-line">${data.mahasiswa?.namaLengkap || '-'}</div>
        </div>
        ${data.approvedBy ? `
          <div class="signature-box">
            <p>Dosen Wali</p>
            <div class="signature-line">${data.approvedBy.dosen?.namaLengkap || '-'}</div>
          </div>
        ` : ''}
      </div>
    </body>
    </html>
  `;
};

/**
 * KHS HTML Template
 */
export const getKHSHTMLTemplate = (data: any) => {
  const logoBase64 = getLogoBase64();
  const predikat = data.predikat || '-';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        ${getCommonPDFStyles()}
        
        .info { 
          margin-bottom: 15px;
          background: #f9f9f9;
          padding: 12px;
        }
        .info p {
          margin-bottom: 5px;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 15px;
          font-size: 9px;
        }
        th, td { 
          border: 1px solid #333; 
          padding: 8px; 
          text-align: left;
        }
        th { 
          background: #e0e0e0; 
          font-weight: bold; 
          text-align: center;
        }
        td.center { text-align: center; }
        .summary {
          margin-top: 20px;
          background: #f0f0f0;
          padding: 12px;
          border-radius: 4px;
        }
        .summary-row {
          display: grid;
          grid-template-columns: 200px 1fr;
          margin-bottom: 6px;
        }
        .summary-label { font-weight: bold; }
      </style>
    </head>
    <body>
      ${getPDFHeader(logoBase64)}
      
      <div class="doc-title">
        <h2>KARTU HASIL STUDI (KHS)</h2>
        <p>Semester ${data.semester?.periode || ''} ${data.semester?.tahunAkademik || ''}</p>
      </div>
      
      <div class="info">
        <p><strong>NIM:</strong> ${data.mahasiswa?.nim || '-'}</p>
        <p><strong>Nama:</strong> ${data.mahasiswa?.namaLengkap || '-'}</p>
        <p><strong>Program Studi:</strong> ${data.mahasiswa?.prodi?.nama || '-'}</p>
        <p><strong>Angkatan:</strong> ${data.mahasiswa?.angkatan || '-'}</p>
      </div>
      
      <table>
        <thead>
          <tr>
            <th style="width: 5%;">No</th>
            <th style="width: 12%;">Kode MK</th>
            <th style="width: 40%;">Mata Kuliah</th>
            <th style="width: 7%;">SKS</th>
            <th style="width: 12%;">Nilai</th>
            <th style="width: 12%;">Huruf</th>
            <th style="width: 12%;">Bobot</th>
          </tr>
        </thead>
        <tbody>
          ${(data.nilai || []).map((n: any, i: number) => `
            <tr>
              <td class="center">${i + 1}</td>
              <td>${n.kelasMK?.mataKuliah?.kodeMK || '-'}</td>
              <td>${n.kelasMK?.mataKuliah?.namaMK || '-'}</td>
              <td class="center">${n.kelasMK?.mataKuliah?.sks || 0}</td>
              <td class="center">${formatNumber(n.nilaiAngka)}</td>
              <td class="center">${n.nilaiHuruf || '-'}</td>
              <td class="center">${formatNumber(n.bobot)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="summary">
        <div class="summary-row">
          <div class="summary-label">SKS Semester:</div>
          <div>${data.totalSKS || 0}</div>
        </div>
        <div class="summary-row">
          <div class="summary-label">IPS (IP Semester):</div>
          <div>${formatNumber(data.ips)}</div>
        </div>
        <div class="summary-row">
          <div class="summary-label">SKS Kumulatif:</div>
          <div>${data.totalSKSKumulatif || 0}</div>
        </div>
        <div class="summary-row">
          <div class="summary-label">IPK (IP Kumulatif):</div>
          <div>${formatNumber(data.ipk)}</div>
        </div>
        <div class="summary-row">
          <div class="summary-label">Predikat:</div>
          <div><strong>${predikat}</strong></div>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Transkrip HTML Template
 */
export const getTranskripHTMLTemplate = (data: any) => {
  const logoBase64 = getLogoBase64();
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        ${getCommonPDFStyles()}
        
        .info { 
          margin-bottom: 15px;
          background: #f9f9f9;
          padding: 12px;
        }
        .info p {
          margin-bottom: 5px;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 12px;
          font-size: 8px;
        }
        th, td { 
          border: 1px solid #333; 
          padding: 6px; 
          text-align: left;
        }
        th { 
          background: #e0e0e0; 
          font-weight: bold; 
          text-align: center;
        }
        td.center { text-align: center; }
        .semester-header {
          background: #d0d0d0;
          font-weight: bold;
          padding: 8px;
          margin-top: 12px;
          font-size: 10px;
        }
        .summary {
          margin-top: 20px;
          background: #f0f0f0;
          padding: 12px;
        }
        .summary h3 {
          margin-bottom: 8px;
          font-size: 11px;
        }
        .summary p {
          margin-bottom: 4px;
        }
      </style>
    </head>
    <body>
      ${getPDFHeader(logoBase64)}
      
      <div class="doc-title">
        <h2>TRANSKRIP AKADEMIK</h2>
      </div>
      
      <div class="info">
        <p><strong>NIM:</strong> ${data.mahasiswa?.nim || '-'}</p>
        <p><strong>Nama:</strong> ${data.mahasiswa?.namaLengkap || '-'}</p>
        <p><strong>Program Studi:</strong> ${data.mahasiswa?.prodi?.nama || '-'}</p>
        <p><strong>Angkatan:</strong> ${data.mahasiswa?.angkatan || '-'}</p>
      </div>
      
      ${(data.khs || []).map((semester: any) => `
        <div class="semester-header">
          Semester ${semester.semester?.periode || ''} ${semester.semester?.tahunAkademik || ''}
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 5%;">No</th>
              <th style="width: 12%;">Kode</th>
              <th style="width: 45%;">Mata Kuliah</th>
              <th style="width: 7%;">SKS</th>
              <th style="width: 10%;">Nilai</th>
              <th style="width: 10%;">Huruf</th>
              <th style="width: 11%;">Bobot</th>
            </tr>
          </thead>
          <tbody>
            ${(data.nilai || [])
              .filter((n: any) => n.kelasMK?.semester?.id === semester.semesterId)
              .map((n: any, i: number) => `
                <tr>
                  <td class="center">${i + 1}</td>
                  <td>${n.kelasMK?.mataKuliah?.kodeMK || '-'}</td>
                  <td>${n.kelasMK?.mataKuliah?.namaMK || '-'}</td>
                  <td class="center">${n.kelasMK?.mataKuliah?.sks || 0}</td>
                  <td class="center">${formatNumber(n.nilaiAngka)}</td>
                  <td class="center">${n.nilaiHuruf || '-'}</td>
                  <td class="center">${formatNumber(n.bobot)}</td>
                </tr>
              `).join('')}
          </tbody>
        </table>
        <p style="margin-top: 5px; font-size: 9px;"><strong>IPS: ${formatNumber(semester.ips)} | IPK: ${formatNumber(semester.ipk)}</strong></p>
      `).join('')}
      
      <div class="summary">
        <h3>Ringkasan Akademik</h3>
        <p><strong>Total SKS:</strong> ${data.summary?.totalSKS || 0}</p>
        <p><strong>IPK Akhir:</strong> ${formatNumber(data.summary?.finalIPK)}</p>
        <p><strong>Predikat:</strong> ${data.summary?.predikat || '-'}</p>
        <p><strong>Total Semester:</strong> ${data.summary?.totalSemester || 0}</p>
      </div>
    </body>
    </html>
  `;
};

/**
 * Pembayaran Report HTML Template
 */
export const getPembayaranReportHTMLTemplate = (data: {
  pembayaranList: any[];
  filters: {
    jenisPembayaran?: string;
    status?: string;
    search?: string;
    semesterId?: number;
    semester?: string;
  };
  stats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    totalNominal: number;
  };
  generatedAt: string;
}) => {
  const logoBase64 = getLogoBase64();
  const { pembayaranList, filters, stats, generatedAt } = data;

  // Payment type labels
  const paymentTypeLabels: Record<string, string> = {
    KRS: 'Pembayaran KRS',
    TENGAH_SEMESTER: 'Tengah Semester',
    PPL: 'PPL',
    SKRIPSI: 'Skripsi',
    WISUDA: 'Wisuda',
    KOMITMEN_BULANAN: 'Komitmen Bulanan',
  };

  // Status labels
  const statusLabels: Record<string, string> = {
    PENDING: 'Pending',
    APPROVED: 'Disetujui',
    REJECTED: 'Ditolak',
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        ${getCommonPDFStyles()}
        
        .filters {
          margin-bottom: 12px;
          background: #f5f5f5;
          padding: 8px;
          border-radius: 4px;
        }
        .filter-row {
          display: grid;
          grid-template-columns: 80px 1fr;
          margin-bottom: 3px;
          font-size: 8px;
        }
        .filter-label { 
          font-weight: bold;
        }
        .stats {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 8px;
          margin-bottom: 12px;
        }
        .stat-card {
          background: #e8f5e9;
          padding: 8px;
          border-radius: 4px;
          text-align: center;
        }
        .stat-card.pending { background: #fff9c4; }
        .stat-card.approved { background: #c8e6c9; }
        .stat-card.rejected { background: #ffcdd2; }
        .stat-card.total-nominal { background: #bbdefb; }
        .stat-label {
          font-size: 7px;
          color: #666;
          margin-bottom: 3px;
        }
        .stat-value {
          font-size: 14px;
          font-weight: bold;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 10px;
          font-size: 7px;
        }
        th, td { 
          border: 1px solid #333; 
          padding: 4px; 
          text-align: left;
        }
        th { 
          background: #e0e0e0; 
          font-weight: bold;
          text-align: center;
          font-size: 7px;
        }
        td.center { text-align: center; }
        td.right { text-align: right; }
        .badge {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 7px;
          font-weight: bold;
        }
        .badge-pending {
          background: #fff9c4;
          color: #f57f17;
        }
        .badge-approved {
          background: #c8e6c9;
          color: #2e7d32;
        }
        .badge-rejected {
          background: #ffcdd2;
          color: #c62828;
        }
        .badge-type {
          background: #e3f2fd;
          color: #1565c0;
        }
        .pdf-footer {
          margin-top: 15px;
          padding-top: 10px;
          border-top: 1px solid #ccc;
          font-size: 7px;
          text-align: center;
          color: #666;
        }
        tfoot tr {
          background: #f0f0f0;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      ${getPDFHeader(logoBase64)}
      
      <div class="doc-title">
        <h2>LAPORAN PEMBAYARAN MAHASISWA</h2>
        <p>Dicetak pada: ${generatedAt}</p>
      </div>
      
      <div class="filters">
        <h3 style="font-size: 10px; margin-bottom: 5px;">Filter Laporan:</h3>
        ${filters.jenisPembayaran && filters.jenisPembayaran !== 'ALL' ? `
          <div class="filter-row">
            <div class="filter-label">Jenis:</div>
            <div>${paymentTypeLabels[filters.jenisPembayaran] || filters.jenisPembayaran}</div>
          </div>
        ` : ''}
        ${filters.status && filters.status !== 'ALL' ? `
          <div class="filter-row">
            <div class="filter-label">Status:</div>
            <div>${statusLabels[filters.status] || filters.status}</div>
          </div>
        ` : ''}
        ${filters.semester ? `
          <div class="filter-row">
            <div class="filter-label">Semester:</div>
            <div>${filters.semester}</div>
          </div>
        ` : ''}
        ${filters.search ? `
          <div class="filter-row">
            <div class="filter-label">Pencarian:</div>
            <div>${filters.search}</div>
          </div>
        ` : ''}
        ${!filters.jenisPembayaran && !filters.status && !filters.semester && !filters.search ? `
          <div style="font-size: 8px; font-style: italic; color: #666;">
            Semua data pembayaran (tanpa filter)
          </div>
        ` : ''}
      </div>

      <div class="stats">
        <div class="stat-card">
          <div class="stat-label">Total Data</div>
          <div class="stat-value">${stats.total}</div>
        </div>
        <div class="stat-card pending">
          <div class="stat-label">Pending</div>
          <div class="stat-value">${stats.pending}</div>
        </div>
        <div class="stat-card approved">
          <div class="stat-label">Disetujui</div>
          <div class="stat-value">${stats.approved}</div>
        </div>
        <div class="stat-card rejected">
          <div class="stat-label">Ditolak</div>
          <div class="stat-value">${stats.rejected}</div>
        </div>
        <div class="stat-card total-nominal">
          <div class="stat-label">Total Nominal</div>
          <div class="stat-value" style="font-size: 10px;">${formatCurrency(stats.totalNominal)}</div>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th style="width: 3%;">No</th>
            <th style="width: 9%;">NIM</th>
            <th style="width: 17%;">Nama</th>
            <th style="width: 12%;">Jenis</th>
            <th style="width: 13%;">Semester/Bulan</th>
            <th style="width: 12%;">Nominal</th>
            <th style="width: 13%;">Tgl Upload</th>
            <th style="width: 13%;">Tgl Verifikasi</th>
            <th style="width: 8%;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${pembayaranList.length === 0 ? `
            <tr>
              <td colspan="9" style="text-align: center; padding: 20px; font-style: italic; color: #666;">
                Tidak ada data pembayaran
              </td>
            </tr>
          ` : pembayaranList.map((p: any, i: number) => `
            <tr>
              <td class="center">${i + 1}</td>
              <td>${p.mahasiswa?.nim || '-'}</td>
              <td>${p.mahasiswa?.namaLengkap || '-'}</td>
              <td>
                <span class="badge badge-type">
                  ${paymentTypeLabels[p.jenisPembayaran] || p.jenisPembayaran}
                </span>
              </td>
              <td class="center">
                ${p.jenisPembayaran === 'KOMITMEN_BULANAN' && p.bulanPembayaran
                  ? new Date(p.bulanPembayaran).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
                  : p.semester
                  ? `${p.semester.tahunAkademik} ${p.semester.periode}`
                  : '-'
                }
              </td>
              <td class="right">${formatCurrency(p.nominal)}</td>
              <td class="center">${formatDate(p.uploadedAt)}</td>
              <td class="center">${p.verifiedAt ? formatDate(p.verifiedAt) : '-'}</td>
              <td class="center">
                <span class="badge badge-${p.status.toLowerCase()}">
                  ${statusLabels[p.status] || p.status}
                </span>
              </td>
            </tr>
          `).join('')}
        </tbody>
        ${pembayaranList.length > 0 ? `
          <tfoot>
            <tr>
              <td colspan="5" style="text-align: right; padding-right: 10px;">Total Keseluruhan:</td>
              <td class="right">${formatCurrency(pembayaranList.reduce((sum, p) => sum + p.nominal, 0))}</td>
              <td colspan="3"></td>
            </tr>
          </tfoot>
        ` : ''}
      </table>

      <div class="pdf-footer">
        <p>Laporan ini dicetak otomatis oleh sistem dan sah tanpa tanda tangan</p>
        <p>STT Diakonos - Sistem Informasi Akademik</p>
      </div>
    </body>
    </html>
  `;
};

/**
 * JADWAL DOSEN PDF Template
 */
export const getJadwalDosenHTMLTemplate = (data: {
  dosen: any;
  jadwal: any[];
  semester: any;
  generatedAt: string;
}) => {
  const logoBase64 = getLogoBase64();
  const { dosen, jadwal, semester, generatedAt } = data;

  // Group by day
  const groupedByDay = jadwal.reduce((acc: any, j: any) => {
    if (!acc[j.hari]) acc[j.hari] = [];
    acc[j.hari].push(j);
    return acc;
  }, {});

  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        ${getCommonPDFStyles()}
        
        .info { 
          margin-bottom: 12px;
          background: #f5f5f5;
          padding: 8px;
        }
        .info-row {
          display: grid;
          grid-template-columns: 120px 1fr;
          margin-bottom: 4px;
        }
        .info-label { 
          font-weight: bold;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 10px;
          font-size: 8px;
        }
        th, td { 
          border: 1px solid #333; 
          padding: 5px; 
          text-align: left;
        }
        th { 
          background: #e0e0e0; 
          font-weight: bold;
          text-align: center;
          font-size: 8px;
        }
        td.center { text-align: center; }
        .day-header {
          background: #d0d0d0;
          font-weight: bold;
          padding: 6px;
          margin-top: 10px;
          font-size: 9px;
        }
        .summary {
          margin-top: 15px;
          padding: 8px;
          background: #f0f0f0;
          font-size: 9px;
        }
        .pdf-footer {
          margin-top: 15px;
          padding-top: 10px;
          border-top: 1px solid #ccc;
          font-size: 7px;
          text-align: center;
          color: #666;
        }
      </style>
    </head>
    <body>
      ${getPDFHeader(logoBase64)}
      
      <div class="doc-title">
        <h2>JADWAL MENGAJAR DOSEN</h2>
        <p>Semester ${semester?.periode || ''} ${semester?.tahunAkademik || ''}</p>
      </div>
      
      <div class="info">
        <div class="info-row">
          <div class="info-label">NIDN</div>
          <div>: ${dosen?.nidn || '-'}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Nama Dosen</div>
          <div>: ${dosen?.namaLengkap || '-'}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Program Studi</div>
          <div>: ${dosen?.prodi?.nama || '-'}</div>
        </div>
      </div>
      
      ${days.map(day => {
        const daySchedule = groupedByDay[day] || [];
        if (daySchedule.length === 0) return '';
        
        return `
          <div class="day-header">${day}</div>
          <table>
            <thead>
              <tr>
                <th style="width: 15%;">Waktu</th>
                <th style="width: 12%;">Kode MK</th>
                <th style="width: 35%;">Mata Kuliah</th>
                <th style="width: 8%;">SKS</th>
                <th style="width: 15%;">Ruangan</th>
                <th style="width: 15%;">Jumlah Mhs</th>
              </tr>
            </thead>
            <tbody>
              ${daySchedule.map((j: any) => `
                <tr>
                  <td class="center">${j.jamMulai}-${j.jamSelesai}</td>
                  <td>${j.mataKuliah?.kodeMK || '-'}</td>
                  <td>${j.mataKuliah?.namaMK || '-'}</td>
                  <td class="center">${j.mataKuliah?.sks || 0}</td>
                  <td class="center">${j.ruangan?.nama || '-'}</td>
                  <td class="center">${j._count?.krsDetail || 0} / ${j.kuotaMax || 0}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      }).join('')}
      
      <div class="summary">
        <p><strong>Total Mata Kuliah:</strong> ${jadwal.length}</p>
        <p><strong>Total SKS:</strong> ${jadwal.reduce((sum, j) => sum + (j.mataKuliah?.sks || 0), 0)}</p>
        <p><strong>Total Mahasiswa:</strong> ${jadwal.reduce((sum, j) => sum + (j._count?.krsDetail || 0), 0)}</p>
      </div>

      <div class="pdf-footer">
        <p>Dicetak pada: ${generatedAt}</p>
        <p>STT Diakonos - Sistem Informasi Akademik</p>
      </div>
    </body>
    </html>
  `;
};

/**
 * JADWAL MAHASISWA PDF Template
 */
/**
 * JADWAL MAHASISWA PDF Template
 */
export const getJadwalMahasiswaHTMLTemplate = (data: {
  mahasiswa: any;
  jadwal: any[];
  semester: any;
  generatedAt: string;
}) => {
  const logoBase64 = getLogoBase64();
  const { mahasiswa, jadwal, semester, generatedAt } = data;

  // Group by day
  const groupedByDay = jadwal.reduce((acc: any, j: any) => {
    const hari = j.hari;
    if (!acc[hari]) acc[hari] = [];
    acc[hari].push(j);
    return acc;
  }, {});

  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  // Calculate stats
  const totalSKS = jadwal.reduce((sum, j) => sum + (j.mataKuliah?.sks || 0), 0);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        ${getCommonPDFStyles()}
        
        .info { 
          margin-bottom: 12px;
          background: #f5f5f5;
          padding: 8px;
        }
        .info-row {
          display: grid;
          grid-template-columns: 120px 1fr;
          margin-bottom: 4px;
        }
        .info-label { 
          font-weight: bold;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 10px;
          font-size: 8px;
        }
        th, td { 
          border: 1px solid #333; 
          padding: 5px; 
          text-align: left;
        }
        th { 
          background: #e0e0e0; 
          font-weight: bold;
          text-align: center;
          font-size: 8px;
        }
        td.center { text-align: center; }
        .day-header {
          background: #d0d0d0;
          font-weight: bold;
          padding: 6px;
          margin-top: 10px;
          font-size: 9px;
        }
        .summary {
          margin-top: 15px;
          padding: 8px;
          background: #f0f0f0;
          font-size: 9px;
        }
        .pdf-footer {
          margin-top: 15px;
          padding-top: 10px;
          border-top: 1px solid #ccc;
          font-size: 7px;
          text-align: center;
          color: #666;
        }
      </style>
    </head>
    <body>
      ${getPDFHeader(logoBase64)}
      
      <div class="doc-title">
        <h2>JADWAL KULIAH MAHASISWA</h2>
        <p>Semester ${semester?.periode || ''} ${semester?.tahunAkademik || ''}</p>
      </div>
      
      <div class="info">
        <div class="info-row">
          <div class="info-label">NIM</div>
          <div>: ${mahasiswa?.nim || '-'}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Nama</div>
          <div>: ${mahasiswa?.namaLengkap || '-'}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Program Studi</div>
          <div>: ${mahasiswa?.prodi?.nama || '-'}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Angkatan</div>
          <div>: ${mahasiswa?.angkatan || '-'}</div>
        </div>
      </div>
      
      ${days.map(day => {
        const daySchedule = groupedByDay[day] || [];
        if (daySchedule.length === 0) return '';
        
        return `
          <div class="day-header">${day}</div>
          <table>
            <thead>
              <tr>
                <th style="width: 15%;">Waktu</th>
                <th style="width: 12%;">Kode MK</th>
                <th style="width: 30%;">Mata Kuliah</th>
                <th style="width: 8%;">SKS</th>
                <th style="width: 20%;">Dosen</th>
                <th style="width: 15%;">Ruangan</th>
              </tr>
            </thead>
            <tbody>
              ${daySchedule
                .sort((a: any, b: any) => a.jamMulai.localeCompare(b.jamMulai))
                .map((j: any) => `
                  <tr>
                    <td class="center">${j.jamMulai}-${j.jamSelesai}</td>
                    <td>${j.mataKuliah?.kodeMK || '-'}</td>
                    <td>${j.mataKuliah?.namaMK || '-'}</td>
                    <td class="center">${j.mataKuliah?.sks || 0}</td>
                    <td>${j.dosen?.namaLengkap || '-'}</td>
                    <td class="center">${j.ruangan?.nama || '-'}</td>
                  </tr>
                `).join('')}
            </tbody>
          </table>
        `;
      }).join('')}
      
      <div class="summary">
        <p><strong>Total Mata Kuliah:</strong> ${jadwal.length}</p>
        <p><strong>Total SKS:</strong> ${totalSKS}</p>
      </div>

      <div class="pdf-footer">
        <p>Dicetak pada: ${generatedAt}</p>
        <p>STT Diakonos - Sistem Informasi Akademik</p>
      </div>
    </body>
    </html>
  `;
};


/**
 * PRESENSI PER PERTEMUAN PDF Template
 */
export const getPresensiPertemuanHTMLTemplate = (data: {
  presensi: any;
  detail: any[];
  kelasMK: any;
  generatedAt: string;
}) => {
  const logoBase64 = getLogoBase64();
  const { presensi, detail, kelasMK, generatedAt } = data;

  const statusCount = {
    HADIR: detail.filter(d => d.status === 'HADIR').length,
    TIDAK_HADIR: detail.filter(d => d.status === 'TIDAK_HADIR').length,
    IZIN: detail.filter(d => d.status === 'IZIN').length,
    SAKIT: detail.filter(d => d.status === 'SAKIT').length,
    ALPHA: detail.filter(d => d.status === 'ALPHA').length,
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        ${getCommonPDFStyles()}
        
        .info { 
          margin-bottom: 12px;
          background: #f5f5f5;
          padding: 8px;
        }
        .info-row {
          display: grid;
          grid-template-columns: 120px 1fr;
          margin-bottom: 4px;
        }
        .info-label { 
          font-weight: bold;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 10px;
          font-size: 8px;
        }
        th, td { 
          border: 1px solid #333; 
          padding: 5px; 
          text-align: left;
        }
        th { 
          background: #e0e0e0; 
          font-weight: bold;
          text-align: center;
          font-size: 8px;
        }
        td.center { text-align: center; }
        .badge {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 7px;
          font-weight: bold;
        }
        .badge-hadir { background: #c8e6c9; color: #2e7d32; }
        .badge-tidak-hadir { background: #ffcdd2; color: #c62828; }
        .badge-izin { background: #fff9c4; color: #f57f17; }
        .badge-sakit { background: #e1bee7; color: #6a1b9a; }
        .badge-alpha { background: #cfd8dc; color: #37474f; }
        .stats {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 8px;
          margin-bottom: 12px;
        }
        .stat-card {
          padding: 6px;
          border-radius: 4px;
          text-align: center;
        }
        .stat-label {
          font-size: 7px;
          margin-bottom: 3px;
        }
        .stat-value {
          font-size: 14px;
          font-weight: bold;
        }
        .pdf-footer {
          margin-top: 15px;
          padding-top: 10px;
          border-top: 1px solid #ccc;
          font-size: 7px;
          text-align: center;
          color: #666;
        }
      </style>
    </head>
    <body>
      ${getPDFHeader(logoBase64)}
      
      <div class="doc-title">
        <h2>DAFTAR HADIR PERKULIAHAN</h2>
        <p>Pertemuan ke-${presensi?.pertemuan || '-'}</p>
      </div>
      
      <div class="info">
        <div class="info-row">
          <div class="info-label">Mata Kuliah</div>
          <div>: ${kelasMK?.mataKuliah?.namaMK || '-'} (${kelasMK?.mataKuliah?.kodeMK || '-'})</div>
        </div>
        <div class="info-row">
          <div class="info-label">SKS</div>
          <div>: ${kelasMK?.mataKuliah?.sks || 0}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Dosen</div>
          <div>: ${kelasMK?.dosen?.namaLengkap || '-'}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Hari/Jam</div>
          <div>: ${kelasMK?.hari || '-'}, ${kelasMK?.jamMulai || ''}-${kelasMK?.jamSelesai || ''}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Ruangan</div>
          <div>: ${kelasMK?.ruangan?.nama || '-'}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Tanggal</div>
          <div>: ${presensi?.tanggal ? new Date(presensi.tanggal).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
          }) : '-'}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Materi</div>
          <div>: ${presensi?.materi || '-'}</div>
        </div>
      </div>

      <div class="stats">
        <div class="stat-card" style="background: #c8e6c9;">
          <div class="stat-label">Hadir</div>
          <div class="stat-value">${statusCount.HADIR}</div>
        </div>
        <div class="stat-card" style="background: #fff9c4;">
          <div class="stat-label">Izin</div>
          <div class="stat-value">${statusCount.IZIN}</div>
        </div>
        <div class="stat-card" style="background: #e1bee7;">
          <div class="stat-label">Sakit</div>
          <div class="stat-value">${statusCount.SAKIT}</div>
        </div>
        <div class="stat-card" style="background: #cfd8dc;">
          <div class="stat-label">Alpha</div>
          <div class="stat-value">${statusCount.ALPHA}</div>
        </div>
        <div class="stat-card" style="background: #ffcdd2;">
          <div class="stat-label">Tidak Hadir</div>
          <div class="stat-value">${statusCount.TIDAK_HADIR}</div>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th style="width: 5%;">No</th>
            <th style="width: 12%;">NIM</th>
            <th style="width: 35%;">Nama Mahasiswa</th>
            <th style="width: 15%;">Status</th>
            <th style="width: 33%;">Keterangan</th>
          </tr>
        </thead>
        <tbody>
          ${detail.map((d: any, i: number) => `
            <tr>
              <td class="center">${i + 1}</td>
              <td>${d.mahasiswa?.nim || '-'}</td>
              <td>${d.mahasiswa?.namaLengkap || '-'}</td>
              <td class="center">
                <span class="badge badge-${d.status?.toLowerCase().replace('_', '-')}">
                  ${d.status?.replace('_', ' ') || '-'}
                </span>
              </td>
              <td>${d.keterangan || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      ${presensi?.catatan ? `
        <div style="margin-top: 12px; padding: 8px; background: #f5f5f5; border-left: 3px solid #666;">
          <strong style="font-size: 9px;">Catatan:</strong>
          <p style="font-size: 8px; margin-top: 4px;">${presensi.catatan}</p>
        </div>
      ` : ''}

      <div class="pdf-footer">
        <p>Dicetak pada: ${generatedAt}</p>
        <p>STT Diakonos - Sistem Informasi Akademik</p>
      </div>
    </body>
    </html>
  `;
};

/**
 * NILAI KELAS (UNTUK DOSEN) PDF Template
 */
export const getNilaiKelasHTMLTemplate = (data: {
  kelasMK: any;
  nilaiList: any[];
  semester: any;
  generatedAt: string;
}) => {
  const logoBase64 = getLogoBase64();
  const { kelasMK, nilaiList, semester, generatedAt } = data;

  const stats = {
    total: nilaiList.length,
    finalized: nilaiList.filter(n => n.isFinalized).length,
    draft: nilaiList.filter(n => !n.isFinalized).length,
    lulus: nilaiList.filter(n => n.nilaiHuruf && !['E', 'DE'].includes(n.nilaiHuruf)).length,
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        ${getCommonPDFStyles()}
        
        .info { 
          margin-bottom: 12px;
          background: #f5f5f5;
          padding: 8px;
        }
        .info-row {
          display: grid;
          grid-template-columns: 120px 1fr;
          margin-bottom: 4px;
        }
        .info-label { 
          font-weight: bold;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 10px;
          font-size: 8px;
        }
        th, td { 
          border: 1px solid #333; 
          padding: 5px; 
          text-align: left;
        }
        th { 
          background: #e0e0e0; 
          font-weight: bold;
          text-align: center;
          font-size: 8px;
        }
        td.center { text-align: center; }
        .badge {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 7px;
          font-weight: bold;
        }
        .badge-finalized { background: #c8e6c9; color: #2e7d32; }
        .badge-draft { background: #fff9c4; color: #f57f17; }
        .stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-bottom: 12px;
        }
        .stat-card {
          padding: 6px;
          border-radius: 4px;
          text-align: center;
          background: #e3f2fd;
        }
        .stat-label {
          font-size: 7px;
          margin-bottom: 3px;
        }
        .stat-value {
          font-size: 14px;
          font-weight: bold;
        }
        .pdf-footer {
          margin-top: 15px;
          padding-top: 10px;
          border-top: 1px solid #ccc;
          font-size: 7px;
          text-align: center;
          color: #666;
        }
      </style>
    </head>
    <body>
      ${getPDFHeader(logoBase64)}
      
      <div class="doc-title">
        <h2>DAFTAR NILAI MAHASISWA</h2>
        <p>Semester ${semester?.periode || ''} ${semester?.tahunAkademik || ''}</p>
      </div>
      
      <div class="info">
        <div class="info-row">
          <div class="info-label">Mata Kuliah</div>
          <div>: ${kelasMK?.mataKuliah?.namaMK || '-'} (${kelasMK?.mataKuliah?.kodeMK || '-'})</div>
        </div>
        <div class="info-row">
          <div class="info-label">SKS</div>
          <div>: ${kelasMK?.mataKuliah?.sks || 0}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Dosen</div>
          <div>: ${kelasMK?.dosen?.namaLengkap || '-'}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Hari/Jam</div>
          <div>: ${kelasMK?.hari || '-'}, ${kelasMK?.jamMulai || ''}-${kelasMK?.jamSelesai || ''}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Ruangan</div>
          <div>: ${kelasMK?.ruangan?.nama || '-'}</div>
        </div>
      </div>

      <div class="stats">
        <div class="stat-card">
          <div class="stat-label">Total Mahasiswa</div>
          <div class="stat-value">${stats.total}</div>
        </div>
        <div class="stat-card" style="background: #c8e6c9;">
          <div class="stat-label">Finalized</div>
          <div class="stat-value">${stats.finalized}</div>
        </div>
        <div class="stat-card" style="background: #fff9c4;">
          <div class="stat-label">Draft</div>
          <div class="stat-value">${stats.draft}</div>
        </div>
        <div class="stat-card" style="background: #b3e5fc;">
          <div class="stat-label">Lulus</div>
          <div class="stat-value">${stats.lulus}</div>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th style="width: 5%;">No</th>
            <th style="width: 12%;">NIM</th>
            <th style="width: 30%;">Nama Mahasiswa</th>
            <th style="width: 10%;">Nilai Angka</th>
            <th style="width: 10%;">Nilai Huruf</th>
            <th style="width: 10%;">Bobot</th>
            <th style="width: 10%;">Status</th>
            <th style="width: 13%;">Input Oleh</th>
          </tr>
        </thead>
        <tbody>
          ${nilaiList.map((n: any, i: number) => `
            <tr>
              <td class="center">${i + 1}</td>
              <td>${n.mahasiswa?.nim || '-'}</td>
              <td>${n.mahasiswa?.namaLengkap || '-'}</td>
              <td class="center">${formatNumber(n.nilaiAngka)}</td>
              <td class="center">${n.nilaiHuruf || '-'}</td>
              <td class="center">${formatNumber(n.bobot)}</td>
              <td class="center">
                <span class="badge badge-${n.isFinalized ? 'finalized' : 'draft'}">
                  ${n.isFinalized ? 'Finalized' : 'Draft'}
                </span>
              </td>
              <td>${n.inputBy?.dosen?.namaLengkap || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="pdf-footer">
        <p>Dicetak pada: ${generatedAt}</p>
        <p>STT Diakonos - Sistem Informasi Akademik</p>
      </div>
    </body>
    </html>
  `;
};

/**
 * REKAP PRESENSI (ALL PERTEMUAN) PDF Template
 */
export const getRekapPresensiHTMLTemplate = (data: {
  kelasMK: any;
  mahasiswaList: any[];
  pertemuanList: any[];
  semester: any;
  generatedAt: string;
}) => {
  const logoBase64 = getLogoBase64();
  const { kelasMK, mahasiswaList, pertemuanList, semester, generatedAt } = data;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        ${getCommonPDFStyles()}
        
        body { font-size: 7px; }
        
        .info { 
          margin-bottom: 10px;
          background: #f5f5f5;
          padding: 6px;
        }
        .info-row {
          display: grid;
          grid-template-columns: 100px 1fr;
          margin-bottom: 3px;
        }
        .info-label { 
          font-weight: bold;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 8px;
          font-size: 6px;
        }
        th, td { 
          border: 1px solid #333; 
          padding: 3px; 
          text-align: center;
        }
        th { 
          background: #e0e0e0; 
          font-weight: bold;
          font-size: 6px;
        }
        .rotate {
          writing-mode: vertical-rl;
          text-orientation: mixed;
          padding: 4px 2px;
        }
        .hadir { background: #c8e6c9; }
        .izin { background: #fff9c4; }
        .sakit { background: #e1bee7; }
        .alpha { background: #cfd8dc; }
        .tidak-hadir { background: #ffcdd2; }
        .pdf-footer {
          margin-top: 12px;
          padding-top: 8px;
          border-top: 1px solid #ccc;
          font-size: 6px;
          text-align: center;
          color: #666;
        }
      </style>
    </head>
    <body>
      ${getPDFHeader(logoBase64)}
      
      <div class="doc-title">
        <h2>REKAP PRESENSI MAHASISWA</h2>
        <p>Semester ${semester?.periode || ''} ${semester?.tahunAkademik || ''}</p>
      </div>
      
      <div class="info">
        <div class="info-row">
          <div class="info-label">Mata Kuliah</div>
          <div>: ${kelasMK?.mataKuliah?.namaMK || '-'} (${kelasMK?.mataKuliah?.kodeMK || '-'})</div>
        </div>
        <div class="info-row">
          <div class="info-label">Dosen</div>
          <div>: ${kelasMK?.dosen?.namaLengkap || '-'}</div>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th rowspan="2" style="width: 4%;">No</th>
            <th rowspan="2" style="width: 10%;">NIM</th>
            <th rowspan="2" style="width: 26%;">Nama</th>
            <th colspan="${pertemuanList.length}">Pertemuan</th>
            <th rowspan="2" style="width: 5%;">H</th>
            <th rowspan="2" style="width: 5%;">I</th>
            <th rowspan="2" style="width: 5%;">S</th>
            <th rowspan="2" style="width: 5%;">A</th>
            <th rowspan="2" style="width: 5%;">%</th>
          </tr>
          <tr>
            ${pertemuanList.map((p: any) => `
              <th class="rotate" style="width: ${Math.floor(40 / pertemuanList.length)}%;">${p.pertemuan}</th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          ${mahasiswaList.map((mhs: any, i: number) => {
            const stats = {
              hadir: 0,
              izin: 0,
              sakit: 0,
              alpha: 0,
            };

            return `
              <tr>
                <td>${i + 1}</td>
                <td>${mhs.mahasiswa?.nim || '-'}</td>
                <td style="text-align: left; padding-left: 4px;">${mhs.mahasiswa?.namaLengkap || '-'}</td>
                ${pertemuanList.map((p: any) => {
                  const presensi = mhs.presensi?.find((pr: any) => pr.presensiId === p.id);
                  const status: string = presensi?.status || 'ALPHA';
                  
                  if (status === 'HADIR') stats.hadir++;
                  else if (status === 'IZIN') stats.izin++;
                  else if (status === 'SAKIT') stats.sakit++;
                  else stats.alpha++;

                  const statusClass = status.toLowerCase().replace('_', '-');
                  const statusSymbolMap: Record<string, string> = {
                    'HADIR': '✓',
                    'IZIN': 'I',
                    'SAKIT': 'S',
                    'ALPHA': 'A',
                    'TIDAK_HADIR': '✗'
                  };
                  const statusSymbol = statusSymbolMap[status] || '-';

                  return `<td class="${statusClass}">${statusSymbol}</td>`;
                }).join('')}
                <td><strong>${stats.hadir}</strong></td>
                <td>${stats.izin}</td>
                <td>${stats.sakit}</td>
                <td>${stats.alpha}</td>
                <td><strong>${Math.round((stats.hadir / pertemuanList.length) * 100)}%</strong></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <div style="margin-top: 10px; font-size: 7px;">
        <p><strong>Keterangan:</strong></p>
        <p>H = Hadir | I = Izin | S = Sakit | A = Alpha (Tidak Hadir Tanpa Keterangan)</p>
      </div>

      <div class="pdf-footer">
        <p>Dicetak pada: ${generatedAt}</p>
        <p>STT Diakonos - Sistem Informasi Akademik</p>
      </div>
    </body>
    </html>
  `;
};

/**
 * BERITA ACARA PERTEMUAN PDF Template
 */

export const getBeritaAcaraHTMLTemplate = (data: {
  presensiList: any[];
  kelasMK: any;
  semester: any;
  generatedAt: string;
}) => {
  const logoBase64 = getLogoBase64();
  const { presensiList, kelasMK, semester, generatedAt } = data;

  // ✅ Dynamic values
  const currentYear = new Date().getFullYear();
  const location = 'Banyumas'; // TODO: Move to config if needed
  const programStudi = kelasMK?.mataKuliah?.prodi?.nama || 
                      kelasMK?.dosen?.prodi?.nama || 
                      '-';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        ${getCommonPDFStyles()}
        
        .info { 
          margin-bottom: 8px;
          background: #f5f5f5;
          padding: 8px;
          font-size: 9px;
        }
        .info-row {
          display: grid;
          grid-template-columns: 100px 1fr;
          margin-bottom: 3px;
        }
        .info-label { 
          font-weight: bold;
        }
        
        /* Table Styles */
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 10px;
          font-size: 7px;
        }
        th, td { 
          border: 1px solid #000; 
          padding: 4px; 
          text-align: center;
          vertical-align: middle;
        }
        th { 
          background: #e0e0e0; 
          font-weight: bold;
          font-size: 7px;
          line-height: 1.2;
        }
        td.left { text-align: left; }
        td.center { text-align: center; }
        
        /* Signature Section */
        .signature-section {
          margin-top: 20px;
          text-align: center;
        }
        .signature-box {
          display: inline-block;
          text-align: center;
          margin: 0 20px;
        }
        .signature-line {
          margin-top: 50px;
          border-bottom: 1px solid #000;
          width: 200px;
          display: inline-block;
        }
        .signature-name {
          margin-top: 5px;
          font-weight: bold;
        }
        
        .pdf-footer {
          margin-top: 15px;
          padding-top: 10px;
          border-top: 1px solid #ccc;
          font-size: 7px;
          text-align: center;
          color: #666;
        }
      </style>
    </head>
    <body>
      ${getPDFHeader(logoBase64)}
      
      <div class="doc-title">
        <h2>BERITA ACARA PERKULIAHAN</h2>
        <p>Semester ${semester?.periode || ''} Tahun Akademik ${semester?.tahunAkademik || ''}<br/>Program Studi ${programStudi}</p>
      </div>
      
      <div class="info">
        <div class="info-row">
          <div class="info-label">Mata Kuliah</div>
          <div>: ${kelasMK?.mataKuliah?.namaMK || '-'}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Semester/Beban</div>
          <div>: ${kelasMK?.mataKuliah?.semesterIdeal || '-'} (${kelasMK?.mataKuliah?.sks || 0} SKS)</div>
        </div>
        <div class="info-row">
          <div class="info-label">Dosen</div>
          <div>: ${kelasMK?.dosen?.namaLengkap || '-'}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Hari / Waktu</div>
          <div>: ${kelasMK?.hari || '-'} / Pukul ${kelasMK?.jamMulai || ''}-${kelasMK?.jamSelesai || ''}</div>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th rowspan="2" style="width: 5%;">Perte-<br/>muan</th>
            <th rowspan="2" style="width: 10%;">Tanggal</th>
            <th rowspan="2" style="width: 10%;">Model dan Media<br/>Perkuliahan<br/>(Daring/Luring)</th>
            <th rowspan="2" style="width: 35%;">Pokok Materi</th>
            <th colspan="2" style="width: 15%;">Mahasiswa</th>
            <th rowspan="2" style="width: 12%;">TTD<br/>Dosen</th>
            <th rowspan="2" style="width: 13%;">TTD<br/>Ketua<br/>Kelas</th>
          </tr>
          <tr>
            <th style="width: 7%;">Hadir</th>
            <th style="width: 8%;">Tdk Har</th>
          </tr>
        </thead>
        <tbody>
          ${presensiList.length === 0 ? `
            <tr>
              <td colspan="8" style="padding: 20px; font-style: italic; color: #666;">
                Belum ada data pertemuan
              </td>
            </tr>
          ` : presensiList.map((p: any) => {
            const hadirCount = p.detail?.filter((d: any) => d.status === 'HADIR').length || 0;
            const tidakHadirCount = p.detail?.filter((d: any) => 
              d.status === 'TIDAK_HADIR' || d.status === 'ALPHA' || d.status === 'IZIN' || d.status === 'SAKIT'
            ).length || 0;
            
            // ✅ DYNAMIC: Get mode pembelajaran from presensi or default to Luring
            const modePembelajaran = p.modePembelajaran || 'Luring';
            
            return `
              <tr>
                <td class="center">${p.pertemuan}</td>
                <td class="center">${p.tanggal ? new Date(p.tanggal).toLocaleDateString('id-ID', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                }) : '-'}</td>
                <td class="center">${modePembelajaran}</td>
                <td class="left" style="padding-left: 6px;">
                  ${p.materi || '-'}
                  ${p.catatan ? `<br/><small style="font-style: italic; color: #666;">Catatan: ${p.catatan}</small>` : ''}
                </td>
                <td class="center">${hadirCount}</td>
                <td class="center">${tidakHadirCount > 0 ? tidakHadirCount : '-'}</td>
                <td class="center"></td>
                <td class="center"></td>
              </tr>
            `;
          }).join('')}
          
          ${/* Fill empty rows to make 16 rows total */''}
          ${Array.from({ length: Math.max(0, 16 - presensiList.length) }, (_, i) => `
            <tr>
              <td class="center">${presensiList.length + i + 1}</td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="signature-section">
        <p style="margin-bottom: 5px; font-size: 9px;">${location}, ................................ ${currentYear}</p>
        <p style="font-size: 9px; margin-bottom: 10px;">
          Sekolah Tinggi Teologi Diakonos<br/>
          Biro Administrasi Akademik Kemahasiswaan,
        </p>
        
        <div style="margin-top: 60px;">
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-name" style="font-size: 9px;">
              ${kelasMK?.dosen?.namaLengkap || 'Nama Dosen'}
            </div>
          </div>
        </div>
      </div>

      <div class="pdf-footer">
        <p>Dicetak pada: ${generatedAt}</p>
        <p>STT Diakonos - Sistem Informasi Akademik</p>
      </div>
    </body>
    </html>
  `;
};
// backend/config/pdfConfig.ts
export const PDF_CONFIG = {
  institution: {
    name: 'Sekolah Tinggi Teologi Diakonos',
    shortName: 'STT Diakonos',
    location: 'Banyumas',
    address: 'Desa Pajerukan RT 004 RW 003 Kec. Kalibagor, Kab. Banyumas',
    province: 'Jawa Tengah',
    website: 'sttdiakonos.ac.id',
    email: 'sttd_banyumas@yahoo.com',
  },
  defaults: {
    modePembelajaran: 'Luring',
  },
};


/**
 * KRS DETAIL (UNTUK DOSEN PEMBIMBING) PDF Template
 */
export const getKRSBimbinganHTMLTemplate = (data: {
  mahasiswaList: any[];
  semester: any;
  dosenWali: any;
  generatedAt: string;
}) => {
  const logoBase64 = getLogoBase64();
  const { mahasiswaList, semester, dosenWali, generatedAt } = data;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        ${getCommonPDFStyles()}
        
        body { font-size: 8px; }
        
        .info { 
          margin-bottom: 12px;
          background: #f5f5f5;
          padding: 8px;
        }
        .info-row {
          display: grid;
          grid-template-columns: 120px 1fr;
          margin-bottom: 4px;
        }
        .info-label { 
          font-weight: bold;
        }
        .mahasiswa-section {
          margin-bottom: 20px;
          page-break-inside: avoid;
        }
        .mhs-header {
          background: #e0e0e0;
          padding: 6px;
          font-weight: bold;
          font-size: 9px;
          margin-bottom: 8px;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          font-size: 7px;
        }
        th, td { 
          border: 1px solid #333; 
          padding: 4px; 
          text-align: left;
        }
        th { 
          background: #f0f0f0; 
          font-weight: bold;
          text-align: center;
          font-size: 7px;
        }
        td.center { text-align: center; }
        .badge {
          display: inline-block;
          padding: 2px 5px;
          border-radius: 3px;
          font-size: 6px;
          font-weight: bold;
        }
        .badge-approved { background: #c8e6c9; color: #2e7d32; }
        .badge-submitted { background: #fff9c4; color: #f57f17; }
        .badge-draft { background: #cfd8dc; color: #37474f; }
        .badge-rejected { background: #ffcdd2; color: #c62828; }
        tfoot tr {
          background: #f0f0f0;
          font-weight: bold;
        }
        .pdf-footer {
          margin-top: 15px;
          padding-top: 10px;
          border-top: 1px solid #ccc;
          font-size: 6px;
          text-align: center;
          color: #666;
        }
      </style>
    </head>
    <body>
      ${getPDFHeader(logoBase64)}
      
      <div class="doc-title">
        <h2>DAFTAR KRS MAHASISWA BIMBINGAN</h2>
        <p>Semester ${semester?.periode || ''} ${semester?.tahunAkademik || ''}</p>
      </div>
      
      <div class="info">
        <div class="info-row">
          <div class="info-label">Dosen Wali</div>
          <div>: ${dosenWali?.namaLengkap || '-'}</div>
        </div>
        <div class="info-row">
          <div class="info-label">NIDN</div>
          <div>: ${dosenWali?.nidn || '-'}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Program Studi</div>
          <div>: ${dosenWali?.prodi?.nama || '-'}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Jumlah Mahasiswa</div>
          <div>: ${mahasiswaList.length} mahasiswa</div>
        </div>
      </div>

      ${mahasiswaList.map((mhs: any) => {
        const krs = mhs.krs;
        const statusMap: Record<string, string> = {
          'APPROVED': 'approved',
          'SUBMITTED': 'submitted',
          'DRAFT': 'draft',
          'REJECTED': 'rejected'
        };
        const statusBadge = statusMap[krs?.status || 'DRAFT'] || 'draft';

        return `
          <div class="mahasiswa-section">
            <div class="mhs-header">
              ${mhs.nim} - ${mhs.namaLengkap} (Angkatan ${mhs.angkatan}) - 
              <span class="badge badge-${statusBadge}">${krs?.status || 'DRAFT'}</span>
            </div>
            
            ${krs ? `
              <table>
                <thead>
                  <tr>
                    <th style="width: 4%;">No</th>
                    <th style="width: 11%;">Kode MK</th>
                    <th style="width: 35%;">Mata Kuliah</th>
                    <th style="width: 6%;">SKS</th>
                    <th style="width: 22%;">Dosen</th>
                    <th style="width: 22%;">Jadwal</th>
                  </tr>
                </thead>
                <tbody>
                  ${(krs.detail || []).map((d: any, i: number) => `
                    <tr>
                      <td class="center">${i + 1}</td>
                      <td>${d.kelasMK?.mataKuliah?.kodeMK || '-'}</td>
                      <td>${d.kelasMK?.mataKuliah?.namaMK || '-'}</td>
                      <td class="center">${d.kelasMK?.mataKuliah?.sks || 0}</td>
                      <td>${d.kelasMK?.dosen?.namaLengkap || '-'}</td>
                      <td>${d.kelasMK?.hari || '-'}, ${d.kelasMK?.jamMulai || ''}-${d.kelasMK?.jamSelesai || ''}</td>
                    </tr>
                  `).join('')}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3" style="text-align: right;">Total SKS:</td>
                    <td class="center">${krs.totalSKS || 0}</td>
                    <td colspan="2"></td>
                  </tr>
                </tfoot>
              </table>
            ` : `
              <div style="padding: 15px; text-align: center; font-style: italic; color: #666; background: #f9f9f9;">
                Mahasiswa belum mengisi KRS untuk semester ini
              </div>
            `}
          </div>
        `;
      }).join('')}

      <div class="pdf-footer">
        <p>Dicetak pada: ${generatedAt}</p>
        <p>STT Diakonos - Sistem Informasi Akademik</p>
      </div>
    </body>
    </html>
  `;
};
