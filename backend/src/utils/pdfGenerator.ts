/**
 * PDF Generator Utility (NEW)
 * Generate PDF documents using Puppeteer
 * ✅ FIXED: Implementasi export PDF untuk KRS, KHS, Transkrip
 */

import puppeteer from 'puppeteer';
import { Response } from 'express';

/**
 * Generate PDF from HTML
 */
export const generatePDF = async (
  html: string,
  filename: string,
  res: Response
) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
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
};

/**
 * KRS HTML Template
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
          padding: 30px; 
          font-size: 11px;
          line-height: 1.4;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #000;
          padding-bottom: 15px;
        }
        .header h1 { 
          font-size: 18px; 
          margin-bottom: 5px;
          text-transform: uppercase;
        }
        .header h2 { 
          font-size: 14px; 
          font-weight: normal;
        }
        .info { 
          margin-bottom: 20px;
          background: #f9f9f9;
          padding: 15px;
          border-radius: 5px;
        }
        .info-row {
          display: flex;
          margin-bottom: 8px;
        }
        .info-label { 
          width: 150px;
          font-weight: bold;
        }
        .info-value { 
          flex: 1;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 20px;
        }
        th, td { 
          border: 1px solid #333; 
          padding: 10px; 
          text-align: left;
        }
        th { 
          background: #e0e0e0; 
          font-weight: bold;
          text-align: center;
        }
        td.center { text-align: center; }
        .footer { 
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #ccc;
        }
        .footer-row {
          display: flex;
          margin-bottom: 8px;
        }
        .footer-label {
          width: 150px;
          font-weight: bold;
        }
        .signature {
          margin-top: 50px;
          display: flex;
          justify-content: space-between;
        }
        .signature-box {
          text-align: center;
          width: 45%;
        }
        .signature-line {
          margin-top: 60px;
          border-top: 1px solid #000;
          padding-top: 5px;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>STT Diakonos</h1>
        <h2>Kartu Rencana Studi (KRS)</h2>
        <p>Semester ${data.semester.periode} ${data.semester.tahunAkademik}</p>
      </div>
      
      <div class="info">
        <div class="info-row">
          <div class="info-label">NIM</div>
          <div class="info-value">: ${data.mahasiswa.nim}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Nama Mahasiswa</div>
          <div class="info-value">: ${data.mahasiswa.namaLengkap}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Program Studi</div>
          <div class="info-value">: ${data.mahasiswa.prodi.nama}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Angkatan</div>
          <div class="info-value">: ${data.mahasiswa.angkatan}</div>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th style="width: 5%;">No</th>
            <th style="width: 12%;">Kode MK</th>
            <th style="width: 35%;">Mata Kuliah</th>
            <th style="width: 7%;">SKS</th>
            <th style="width: 20%;">Dosen</th>
            <th style="width: 21%;">Jadwal</th>
          </tr>
        </thead>
        <tbody>
          ${data.detail.map((d: any, i: number) => `
            <tr>
              <td class="center">${i + 1}</td>
              <td>${d.kelasMK.mataKuliah.kodeMK}</td>
              <td>${d.kelasMK.mataKuliah.namaMK}</td>
              <td class="center">${d.kelasMK.mataKuliah.sks}</td>
              <td>${d.kelasMK.dosen.namaLengkap}</td>
              <td>${d.kelasMK.hari}, ${d.kelasMK.jamMulai}-${d.kelasMK.jamSelesai}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="text-align: right; font-weight: bold;">Total SKS:</td>
            <td class="center" style="font-weight: bold;">${data.totalSKS}</td>
            <td colspan="2"></td>
          </tr>
        </tfoot>
      </table>
      
      <div class="footer">
        <div class="footer-row">
          <div class="footer-label">Status</div>
          <div>: ${data.status}</div>
        </div>
        ${data.approvedBy ? `
          <div class="footer-row">
            <div class="footer-label">Disetujui oleh</div>
            <div>: ${data.approvedBy.dosen.namaLengkap}</div>
          </div>
          <div class="footer-row">
            <div class="footer-label">Tanggal Approval</div>
            <div>: ${new Date(data.tanggalApproval).toLocaleDateString('id-ID', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}</div>
          </div>
        ` : ''}
      </div>
      
      <div class="signature">
        <div class="signature-box">
          <p>Mahasiswa</p>
          <div class="signature-line">${data.mahasiswa.namaLengkap}</div>
        </div>
        ${data.approvedBy ? `
          <div class="signature-box">
            <p>Dosen Wali</p>
            <div class="signature-line">${data.approvedBy.dosen.namaLengkap}</div>
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
  const predikat = data.predikat || '';
  
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
        <p>Semester ${data.semester.periode} ${data.semester.tahunAkademik}</p>
      </div>
      
      <div class="info">
        <p><strong>NIM:</strong> ${data.mahasiswa.nim}</p>
        <p><strong>Nama:</strong> ${data.mahasiswa.namaLengkap}</p>
        <p><strong>Program Studi:</strong> ${data.mahasiswa.prodi.nama}</p>
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
          ${data.nilai.map((n: any, i: number) => `
            <tr>
              <td class="center">${i + 1}</td>
              <td>${n.kelasMK.mataKuliah.kodeMK}</td>
              <td>${n.kelasMK.mataKuliah.namaMK}</td>
              <td class="center">${n.kelasMK.mataKuliah.sks}</td>
              <td class="center">${n.nilaiAngka || '-'}</td>
              <td class="center">${n.nilaiHuruf || '-'}</td>
              <td class="center">${n.bobot || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="summary">
        <div class="summary-row">
          <div class="summary-label">SKS Semester:</div>
          <div>${data.sksSemester}</div>
        </div>
        <div class="summary-row">
          <div class="summary-label">IPS (IP Semester):</div>
          <div>${Number(data.ips).toFixed(2)}</div>
        </div>
        <div class="summary-row">
          <div class="summary-label">SKS Kumulatif:</div>
          <div>${data.sksKumulatif}</div>
        </div>
        <div class="summary-row">
          <div class="summary-label">IPK (IP Kumulatif):</div>
          <div>${Number(data.ipk).toFixed(2)}</div>
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
        <p><strong>NIM:</strong> ${data.mahasiswa.nim}</p>
        <p><strong>Nama:</strong> ${data.mahasiswa.namaLengkap}</p>
        <p><strong>Program Studi:</strong> ${data.mahasiswa.prodi.nama}</p>
        <p><strong>Angkatan:</strong> ${data.mahasiswa.angkatan}</p>
      </div>
      
      ${data.khs.map((semester: any) => `
        <div class="semester-header">
          Semester ${semester.semester.periode} ${semester.semester.tahunAkademik}
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
            ${data.nilai
              .filter((n: any) => n.kelasMK.semester.id === semester.semesterId)
              .map((n: any, i: number) => `
                <tr>
                  <td class="center">${i + 1}</td>
                  <td>${n.kelasMK.mataKuliah.kodeMK}</td>
                  <td>${n.kelasMK.mataKuliah.namaMK}</td>
                  <td class="center">${n.kelasMK.mataKuliah.sks}</td>
                  <td class="center">${n.nilaiAngka || '-'}</td>
                  <td class="center">${n.nilaiHuruf || '-'}</td>
                  <td class="center">${n.bobot || '-'}</td>
                </tr>
              `).join('')}
          </tbody>
        </table>
        <p style="margin-top: 5px;"><strong>IPS: ${Number(semester.ips).toFixed(2)} | IPK: ${Number(semester.ipk).toFixed(2)}</strong></p>
      `).join('')}
      
      <div class="summary">
        <h3 style="margin-bottom: 10px;">Ringkasan</h3>
        <p><strong>Total SKS:</strong> ${data.summary.totalSKS}</p>
        <p><strong>IPK Akhir:</strong> ${Number(data.summary.finalIPK).toFixed(2)}</p>
        <p><strong>Predikat:</strong> ${data.summary.predikat}</p>
        <p><strong>Total Semester:</strong> ${data.summary.totalSemester}</p>
      </div>
    </body>
    </html>
  `;
};