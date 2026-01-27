/**
 * PDF Generator Utility (FIXED)
 * Generate PDF documents using Puppeteer with system Chrome
 * ✅ FIXED: Use system Chrome if puppeteer Chrome not installed
 */

import puppeteer from 'puppeteer';
import { Response } from 'express';

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
 * Generate PDF from HTML
 */
export const generatePDF = async (
  html: string,
  filename: string,
  res: Response
) => {
  let browser;
  
  try {
    // ✅ Try to use system Chrome if puppeteer Chrome not available
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: getChromeExecutablePath(), // Use system Chrome
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

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

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdf);
  } catch (error) {
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
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Arial', sans-serif; 
          padding: 15px; 
          font-size: 9px;
          line-height: 1.3;
        }
        .header {
          text-align: center;
          margin-bottom: 15px;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
        }
        .header h1 { 
          font-size: 16px; 
          margin-bottom: 3px;
          text-transform: uppercase;
        }
        .header h2 { 
          font-size: 12px; 
          font-weight: normal;
          margin-bottom: 2px;
        }
        .header p {
          font-size: 10px;
          font-weight: bold;
        }
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
      <div class="header">
        <h1>STT Diakonos</h1>
        <h2>Kartu Rencana Studi (KRS)</h2>
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
  const predikat = data.predikat || '-';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Arial', sans-serif; 
          padding: 30px; 
          font-size: 11px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #000;
          padding-bottom: 15px;
        }
        .header h1 { font-size: 18px; margin-bottom: 5px; }
        .header h2 { font-size: 14px; font-weight: normal; }
        .info { 
          margin-bottom: 20px;
          background: #f9f9f9;
          padding: 15px;
        }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #333; padding: 10px; text-align: left; }
        th { background: #e0e0e0; font-weight: bold; text-align: center; }
        td.center { text-align: center; }
        .summary {
          margin-top: 30px;
          background: #f0f0f0;
          padding: 15px;
          border-radius: 5px;
        }
        .summary-row {
          display: flex;
          margin-bottom: 8px;
        }
        .summary-label { width: 200px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>STT Diakonos</h1>
        <h2>Kartu Hasil Studi (KHS)</h2>
        <p>Semester ${data.semester?.periode || ''} ${data.semester?.tahunAkademik || ''}</p>
      </div>
      
      <div class="info">
        <p><strong>NIM:</strong> ${data.mahasiswa?.nim || '-'}</p>
        <p><strong>Nama:</strong> ${data.mahasiswa?.namaLengkap || '-'}</p>
        <p><strong>Program Studi:</strong> ${data.mahasiswa?.prodi?.nama || '-'}</p>
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
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Arial', sans-serif; 
          padding: 30px; 
          font-size: 10px;
        }
        .header {
          text-align: center;
          margin-bottom: 25px;
          border-bottom: 2px solid #000;
          padding-bottom: 15px;
        }
        .header h1 { font-size: 18px; margin-bottom: 5px; }
        .header h2 { font-size: 14px; font-weight: normal; }
        .info { 
          margin-bottom: 20px;
          background: #f9f9f9;
          padding: 15px;
        }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { border: 1px solid #333; padding: 8px; text-align: left; }
        th { background: #e0e0e0; font-weight: bold; text-align: center; }
        td.center { text-align: center; }
        .semester-header {
          background: #d0d0d0;
          font-weight: bold;
          padding: 10px;
          margin-top: 15px;
        }
        .summary {
          margin-top: 25px;
          background: #f0f0f0;
          padding: 15px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>STT Diakonos</h1>
        <h2>Transkrip Akademik</h2>
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
        <p style="margin-top: 5px;"><strong>IPS: ${formatNumber(semester.ips)} | IPK: ${formatNumber(semester.ipk)}</strong></p>
      `).join('')}
      
      <div class="summary">
        <h3 style="margin-bottom: 10px;">Ringkasan</h3>
        <p><strong>Total SKS:</strong> ${data.summary?.totalSKS || 0}</p>
        <p><strong>IPK Akhir:</strong> ${formatNumber(data.summary?.finalIPK)}</p>
        <p><strong>Predikat:</strong> ${data.summary?.predikat || '-'}</p>
        <p><strong>Total Semester:</strong> ${data.summary?.totalSemester || 0}</p>
      </div>
    </body>
    </html>
  `;
};