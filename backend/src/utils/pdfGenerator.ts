/**
 * PDF Generator Utility - PDFKit Version  
 * 🔥 100% DROP-IN REPLACEMENT - No controller changes needed!
 * ✨ Production-ready with modern styling
 * 📦 Just: cp this file over pdfGenerator.ts and it works!
 */

import PDFDocument from 'pdfkit';
import { Response } from 'express';
import path from 'path';
import fs from 'fs';

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

/**
 * Safe number formatter
 */
const formatNumber = (value: any, decimals: number = 2): string => {
  if (value === null || value === undefined) return '-';
  const num = typeof value === 'number' ? value : Number(value);
  return isNaN(num) ? '-' : num.toFixed(decimals);
};

/**
 * Format currency
 */
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format date
 */
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Get Chrome executable path - KEPT FOR COMPATIBILITY (not used)
 */
export const getChromeExecutablePath = (): string | undefined => {
  return undefined; // Not needed for PDFKit
};

/**
 * Get logo path
 */
const getLogoPath = (): string | null => {
  try {
    const possiblePaths = [
      path.join(__dirname, '..', 'logo', 'LOGO.png'),
      path.join(__dirname, '..', '..', 'logo', 'LOGO.png'),
      path.join(process.cwd(), 'logo', 'LOGO.png'),
      path.join(process.cwd(), 'backend', 'logo', 'LOGO.png'),
      'D:\\DIAKONOS\\SIAKAD\\siakad-stt-diakonos\\backend\\logo\\LOGO.png',
    ];

    for (const logoPath of possiblePaths) {
      if (fs.existsSync(logoPath)) {
        console.log(`✅ Logo found at: ${logoPath}`);
        return logoPath;
      }
    }

    console.warn('⚠️ Logo not found');
    return null;
  } catch (error) {
    console.error('❌ Error loading logo:', error);
    return null;
  }
};

/**
 * Get logo base64 - KEPT FOR COMPATIBILITY
 */
const getLogoBase64 = (): string => {
  const logoPath = getLogoPath();
  if (!logoPath) return '';
  
  try {
    const logoBuffer = fs.readFileSync(logoPath);
    return `data:image/png;base64,${logoBuffer.toString('base64')}`;
  } catch (error) {
    return '';
  }
};

/**
 * Common PDF styles - KEPT FOR COMPATIBILITY (not used in PDFKit)
 */
const getCommonPDFStyles = () => {
  return ''; // Not used anymore
};

/**
 * PDF Header - KEPT FOR COMPATIBILITY (not used in PDFKit)
 */
const getPDFHeader = (logoBase64: string) => {
  return ''; // Not used anymore
};

// ===========================================
// DRAWING HELPER FUNCTIONS
// ===========================================

/**
 * Draw PDF header with logo and institution info
 */
const drawPDFHeader = (doc: PDFKit.PDFDocument, logoPath: string | null) => {
  const startY = doc.y;
  
  // Logo
  if (logoPath && fs.existsSync(logoPath)) {
    try {
      doc.image(logoPath, 50, startY, { width: 65, height: 65 });
    } catch (error) {
      doc.rect(50, startY, 65, 65).stroke();
      doc.fontSize(8).text('LOGO', 62, startY + 28, { width: 40, align: 'center' });
    }
  } else {
    doc.rect(50, startY, 65, 65).stroke();
    doc.fontSize(8).text('LOGO', 62, startY + 28, { width: 40, align: 'center' });
  }
  
  // Institution name
  doc.fontSize(13).font('Helvetica-Bold')
     .text('SEKOLAH TINGGI TEOLOGI DIAKONOS', 125, startY, { align: 'center' });
  
  // Accreditation info
  doc.fontSize(6.5).font('Helvetica-Oblique')
     .text('Akreditasi BAN-PT Institusi: SK. Badan Akreditasi Nasional Perguruan Tinggi No. 775/SK/BAN-PT/Akred/PT/VIII/2021', 125, startY + 18, { width: 420, align: 'center' })
     .text('Akreditasi LAMDIK Prodi PAK: SK. Lembaga Akreditasi Mandiri Kependidikan No. 1064/SK/LAMDIK/Ak/S/X/2023', 125, doc.y, { width: 420, align: 'center' })
     .text('Akreditasi Prodi Teologi: SK. Badan Akreditasi Nasional Perguruan Tinggi No. 7070/SK/BAN-PT/Ak.Ppj/S1/VII/2025', 125, doc.y, { width: 420, align: 'center' })
     .text('Alamat Kampus: Desa Pajerukan RT 004 RW 003 Kec. Kalibagor, Kab. Banyumas, Provinsi Jawa Tengah 53191', 125, doc.y + 3, { width: 420, align: 'center' })
     .text('Website: sttdiakonos.ac.id; E-mail: sttdiakonia@gmail.com', 125, doc.y, { width: 420, align: 'center' });
  
  // Separator line
  doc.moveTo(50, doc.y + 8).lineTo(545, doc.y + 8).lineWidth(3).stroke();
  doc.moveDown(1);
};

/**
 * Draw document title with optional subtitle
 */
const drawDocTitle = (doc: PDFKit.PDFDocument, title: string, subtitle?: string) => {
  const y = doc.y + 10;
  const height = subtitle ? 40 : 28;
  
  doc.rect(50, y, 495, height).fillAndStroke('#f0f0f0', '#cccccc');
  doc.fillColor('#000000').fontSize(11).font('Helvetica-Bold')
     .text(title, 50, y + 8, { width: 495, align: 'center' });
  
  if (subtitle) {
    doc.fontSize(9).font('Helvetica')
       .text(subtitle, 50, doc.y + 2, { width: 495, align: 'center' });
  }
  doc.moveDown(1.5);
};

/**
 * Draw information box with label-value pairs
 */
const drawInfoBox = (doc: PDFKit.PDFDocument, info: { label: string; value: string }[]) => {
  const startY = doc.y;
  const lineHeight = 15;
  const padding = 8;
  const boxHeight = info.length * lineHeight + (padding * 2);
  
  // Background box
  doc.rect(50, startY, 495, boxHeight).fillAndStroke('#f5f5f5', '#d0d0d0');
  
  let currentY = startY + padding;
  
  info.forEach((item) => {
    // Label (bold)
    doc.fillColor('#000000').fontSize(9).font('Helvetica-Bold')
      .text(item.label + ':', 58, currentY, { width: 120, align: 'left' });
    
    // Value (regular)
    doc.font('Helvetica')
      .text(item.value, 180, currentY, { width: 360, align: 'left' });
    
    currentY += lineHeight;
  });
  
  doc.y = startY + boxHeight + 10;
};

/**
 * Draw table with headers and data rows
 */
const drawTable = (
  doc: PDFKit.PDFDocument,
  headers: { label: string; width: number; align?: 'left' | 'center' | 'right' }[],
  rows: string[][],
  options?: { fontSize?: number; footerRows?: string[][] }
) => {
  const fontSize = options?.fontSize || 8;
  const startX = 50;
  let currentY = doc.y;
  const rowHeight = fontSize + 8;
  const totalWidth = headers.reduce((sum, h) => sum + h.width, 0);
  
  // Thin lines for cleaner look
  doc.lineWidth(0.5);

  // Header row
  let currentX = startX;
  doc.rect(startX, currentY, totalWidth, rowHeight).fillAndStroke('#e0e0e0', '#333333');
  
  headers.forEach((header) => {
    doc.fillColor('#000000').fontSize(fontSize).font('Helvetica-Bold')
      .text(header.label, currentX + 5, currentY + 5, { 
        width: header.width - 10, 
        align: header.align || 'center' 
      });
    
    if (currentX !== startX) {
      doc.moveTo(currentX, currentY).lineTo(currentX, currentY + rowHeight).stroke();
    }
    currentX += header.width;
  });
  
  currentY += rowHeight;

  // Data rows with alternating colors
  rows.forEach((row, rowIndex) => {
    currentX = startX;
    
    // Pagination
    if (currentY + rowHeight > doc.page.height - 80) {
      doc.addPage();
      currentY = 50;
    }

    const rowBg = rowIndex % 2 === 0 ? '#ffffff' : '#fafafa';
    doc.rect(startX, currentY, totalWidth, rowHeight).fillAndStroke(rowBg, '#333333');
    
    row.forEach((cell, cellIndex) => {
      const header = headers[cellIndex];
      doc.fillColor('#000000').fontSize(fontSize - 1).font('Helvetica')
        .text(cell || '-', currentX + 5, currentY + 5, { 
          width: header.width - 10, 
          align: header.align || 'left',
          height: rowHeight - 10
        });
      
      if (currentX !== startX) {
        doc.moveTo(currentX, currentY).lineTo(currentX, currentY + rowHeight).stroke();
      }
      currentX += header.width;
    });
    
    currentY += rowHeight;
  });

  // Footer rows (totals, etc.)
  if (options?.footerRows) {
    options.footerRows.forEach((footerRow) => {
      currentX = startX;
      doc.rect(startX, currentY, totalWidth, rowHeight).fillAndStroke('#f0f0f0', '#333333');
      
      footerRow.forEach((cell, cellIndex) => {
        const header = headers[cellIndex];
        doc.fillColor('#000000').fontSize(fontSize).font('Helvetica-Bold')
          .text(cell || '', currentX + 5, currentY + 5, { 
            width: header.width - 10, 
            align: header.align || 'left' 
          });
        
        if (currentX !== startX) {
          doc.moveTo(currentX, currentY).lineTo(currentX, currentY + rowHeight).stroke();
        }
        currentX += header.width;
      });
      
      currentY += rowHeight;
    });
  }

  doc.y = currentY + 10;
  
  // Reset line width
  doc.lineWidth(1);
};

/**
 * Draw summary box with label-value pairs
 */
const drawSummaryBox = (
  doc: PDFKit.PDFDocument,
  data: { label: string; value: string }[],
  height: number = 80
) => {
  const summaryY = doc.y + 15;
  doc.rect(50, summaryY, 495, height).fillAndStroke('#f0f0f0', '#d0d0d0');
  
  let currentY = summaryY + 10;
  
  data.forEach((item) => {
    doc.fillColor('#000000').fontSize(9).font('Helvetica-Bold')
       .text(item.label, 60, currentY, { width: 150, align: 'left' });
    doc.font('Helvetica')
       .text(item.value, 215, currentY, { width: 300, align: 'left' });
    currentY += 13;
  });
};

/**
 * Draw stat cards (for reports)
 */
const drawStatCards = (
  doc: PDFKit.PDFDocument,
  stats: { label: string; value: any; color: string; small?: boolean }[]
) => {
  const statsY = doc.y + 10;
  const cardWidth = Math.floor((495 - (stats.length - 1) * 5) / stats.length);
  
  stats.forEach((stat, i) => {
    const x = 50 + (i * (cardWidth + 5));
    doc.rect(x, statsY, cardWidth, 35).fillAndStroke(stat.color, '#cccccc');
    
    doc.fillColor('#666666').fontSize(7).font('Helvetica')
       .text(stat.label, x + 5, statsY + 5, { width: cardWidth - 10, align: 'center' });
    
    doc.fillColor('#000000').fontSize(stat.small ? 8 : 14).font('Helvetica-Bold')
       .text(String(stat.value), x + 5, statsY + 15, { width: cardWidth - 10, align: 'center' });
  });
  
  doc.y = statsY + 50;
};

// ===========================================
// MAIN EXPORT: generatePDF
// ===========================================

export const generatePDF = async (
  html: string,
  filename: string,
  res: Response
) => {
  try {
    console.log('🚀 Starting PDF generation with PDFKit...');
    
    // Parse embedded data from HTML
    const dataMatch = html.match(/<!--PDF_DATA:(.+?)-->/s);
    if (!dataMatch) {
      throw new Error('No PDF data found in HTML');
    }
    
    const { type, data } = JSON.parse(dataMatch[1]);
    
    // Route to appropriate generator
    switch (type) {
      case 'KRS':
        return await generateKRS(data, filename, res);
      case 'KHS':
        return await generateKHS(data, filename, res);
      case 'TRANSKRIP':
        return await generateTranskrip(data, filename, res);
      case 'PEMBAYARAN_REPORT':
        return await generatePembayaranReport(data, filename, res);
      case 'JADWAL_DOSEN':
        return await generateJadwalDosen(data, filename, res);
      case 'JADWAL_MAHASISWA':
        return await generateJadwalMahasiswa(data, filename, res);
      case 'PRESENSI_PERTEMUAN':
        return await generatePresensiPertemuan(data, filename, res);
      case 'NILAI_KELAS':
        return await generateNilaiKelas(data, filename, res);
      case 'REKAP_PRESENSI':
        return await generateRekapPresensi(data, filename, res);
      case 'BERITA_ACARA':
        return await generateBeritaAcara(data, filename, res);
      case 'KRS_BIMBINGAN':
        return await generateKRSBimbingan(data, filename, res);
      default:
        throw new Error(`Unknown PDF type: ${type}`);
    }
  } catch (error) {
    console.error('❌ PDF generation error:', error);
    throw error;
  }
};

// ===========================================
// TEMPLATE FUNCTIONS - RETURN HTML WITH EMBEDDED DATA
// ===========================================

export const getKRSHTMLTemplate = (data: any) => {
  const payload = { type: 'KRS', data };
  return `<!--PDF_DATA:${JSON.stringify(payload)}-->`;
};

export const getKHSHTMLTemplate = (data: any) => {
  const payload = { type: 'KHS', data };
  return `<!--PDF_DATA:${JSON.stringify(payload)}-->`;
};

export const getTranskripHTMLTemplate = (data: any) => {
  const payload = { type: 'TRANSKRIP', data };
  return `<!--PDF_DATA:${JSON.stringify(payload)}-->`;
};

export const getPembayaranReportHTMLTemplate = (data: any) => {
  const payload = { type: 'PEMBAYARAN_REPORT', data };
  return `<!--PDF_DATA:${JSON.stringify(payload)}-->`;
};

export const getJadwalDosenHTMLTemplate = (data: any) => {
  const payload = { type: 'JADWAL_DOSEN', data };
  return `<!--PDF_DATA:${JSON.stringify(payload)}-->`;
};

export const getJadwalMahasiswaHTMLTemplate = (data: any) => {
  const payload = { type: 'JADWAL_MAHASISWA', data };
  return `<!--PDF_DATA:${JSON.stringify(payload)}-->`;
};

export const getPresensiPertemuanHTMLTemplate = (data: any) => {
  const payload = { type: 'PRESENSI_PERTEMUAN', data };
  return `<!--PDF_DATA:${JSON.stringify(payload)}-->`;
};

export const getNilaiKelasHTMLTemplate = (data: any) => {
  const payload = { type: 'NILAI_KELAS', data };
  return `<!--PDF_DATA:${JSON.stringify(payload)}-->`;
};

export const getRekapPresensiHTMLTemplate = (data: any) => {
  const payload = { type: 'REKAP_PRESENSI', data };
  return `<!--PDF_DATA:${JSON.stringify(payload)}-->`;
};

export const getBeritaAcaraHTMLTemplate = (data: any) => {
  const payload = { type: 'BERITA_ACARA', data };
  return `<!--PDF_DATA:${JSON.stringify(payload)}-->`;
};

export const getKRSBimbinganHTMLTemplate = (data: any) => {
  const payload = { type: 'KRS_BIMBINGAN', data };
  return `<!--PDF_DATA:${JSON.stringify(payload)}-->`;
};

// ===========================================
// PDF GENERATORS
// ===========================================

/**
 * Generate KRS (Kartu Rencana Studi)
 */
const generateKRS = async (data: any, filename: string, res: Response) => {
  const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 50, right: 50 } });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);
  
  const logoPath = getLogoPath();
  drawPDFHeader(doc, logoPath);
  drawDocTitle(doc, 'KARTU RENCANA STUDI (KRS)', `Semester ${data.semester?.periode || ''} ${data.semester?.tahunAkademik || ''}`);
  
  drawInfoBox(doc, [
    { label: 'NIM', value: data.mahasiswa?.nim || '-' },
    { label: 'Nama Mahasiswa', value: data.mahasiswa?.namaLengkap || '-' },
    { label: 'Program Studi', value: data.mahasiswa?.prodi?.nama || '-' },
    { label: 'Angkatan', value: data.mahasiswa?.angkatan || '-' },
    { label: 'Kelas', value: '___________________________' }
  ]);
  
  const headers = [
    { label: 'No', width: 30, align: 'center' as const },
    { label: 'Kode MK', width: 60, align: 'center' as const },
    { label: 'Mata Kuliah', width: 160, align: 'left' as const },
    { label: 'SKS', width: 35, align: 'center' as const },
    { label: 'Dosen', width: 110, align: 'left' as const },
    { label: 'Jadwal', width: 100, align: 'left' as const }
  ];
  
  const rows = (data.detail || []).map((d: any, i: number) => [
    String(i + 1),
    d.kelasMK?.mataKuliah?.kodeMK || '-',
    d.kelasMK?.mataKuliah?.namaMK || '-',
    String(d.kelasMK?.mataKuliah?.sks || 0),
    d.kelasMK?.dosen?.namaLengkap || '-',
    `${d.kelasMK?.hari || '-'}, ${d.kelasMK?.jamMulai || ''}-${d.kelasMK?.jamSelesai || ''}`
  ]);
  
  const footerRows = [['', '', 'Total SKS:', String(data.totalSKS || 0), '', '']];
  drawTable(doc, headers, rows, { fontSize: 8, footerRows });
  
  doc.fontSize(9).font('Helvetica-Bold').text(`Status: ${data.status || 'DRAFT'}`, 50, doc.y + 10);
  
  if (data.approvedBy) {
    doc.font('Helvetica').text(`Disetujui oleh: ${data.approvedBy.dosen?.namaLengkap || '-'}`, 50, doc.y + 5);
    if (data.tanggalApproval) {
      const approvalDate = new Date(data.tanggalApproval).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric'
      });
      doc.text(`Tanggal Approval: ${approvalDate}`, 50, doc.y + 5);
    }
  }
  
  doc.moveDown(2);
  const sigY = doc.y;
  doc.fontSize(9).text('Mahasiswa', 80, sigY, { width: 150, align: 'center' });
  doc.text(data.mahasiswa?.namaLengkap || '-', 80, sigY + 60, { width: 150, align: 'center' });
  doc.moveTo(80, sigY + 55).lineTo(230, sigY + 55).stroke();
  
  if (data.approvedBy) {
    doc.text('Dosen Wali', 365, sigY, { width: 150, align: 'center' });
    doc.text(data.approvedBy.dosen?.namaLengkap || '-', 365, sigY + 60, { width: 150, align: 'center' });
    doc.moveTo(365, sigY + 55).lineTo(515, sigY + 55).stroke();
  }
  
  doc.end();
};

/**
 * Generate KHS (Kartu Hasil Studi)
 */
const generateKHS = async (data: any, filename: string, res: Response) => {
  const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 50, right: 50 } });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);
  
  const logoPath = getLogoPath();
  drawPDFHeader(doc, logoPath);
  drawDocTitle(doc, 'KARTU HASIL STUDI (KHS)', `Semester ${data.semester?.periode || ''} ${data.semester?.tahunAkademik || ''}`);
  
  drawInfoBox(doc, [
    { label: 'NIM', value: data.mahasiswa?.nim || '-' },
    { label: 'Nama', value: data.mahasiswa?.namaLengkap || '-' },
    { label: 'Program Studi', value: data.mahasiswa?.prodi?.nama || '-' },
    { label: 'Angkatan', value: data.mahasiswa?.angkatan || '-' }
  ]);
  
  const headers = [
    { label: 'No', width: 30, align: 'center' as const },
    { label: 'Kode MK', width: 60, align: 'center' as const },
    { label: 'Mata Kuliah', width: 180, align: 'left' as const },
    { label: 'SKS', width: 35, align: 'center' as const },
    { label: 'Nilai', width: 50, align: 'center' as const },
    { label: 'Huruf', width: 50, align: 'center' as const },
    { label: 'Bobot', width: 50, align: 'center' as const }
  ];
  
  const rows = (data.nilai || []).map((n: any, i: number) => [
    String(i + 1),
    n.kelasMK?.mataKuliah?.kodeMK || '-',
    n.kelasMK?.mataKuliah?.namaMK || '-',
    String(n.kelasMK?.mataKuliah?.sks || 0),
    formatNumber(n.nilaiAngka),
    n.nilaiHuruf || '-',
    formatNumber(n.bobot)
  ]);
  
  drawTable(doc, headers, rows, { fontSize: 8 });
  
  drawSummaryBox(doc, [
    { label: 'SKS Semester:', value: String(data.totalSKS || 0) },
    { label: 'IPS (IP Semester):', value: formatNumber(data.ips) },
    { label: 'SKS Kumulatif:', value: String(data.totalSKSKumulatif || 0) },
    { label: 'IPK (IP Kumulatif):', value: formatNumber(data.ipk) },
    { label: 'Predikat:', value: data.predikat || '-' }
  ], 80);
  
  doc.end();
};

/**
 * Generate Transkrip Akademik
 */
const generateTranskrip = async (data: any, filename: string, res: Response) => {
  const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 50, right: 50 } });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);
  
  const logoPath = getLogoPath();
  drawPDFHeader(doc, logoPath);
  drawDocTitle(doc, 'TRANSKRIP AKADEMIK');
  
  drawInfoBox(doc, [
    { label: 'NIM', value: data.mahasiswa?.nim || '-' },
    { label: 'Nama', value: data.mahasiswa?.namaLengkap || '-' },
    { label: 'Program Studi', value: data.mahasiswa?.prodi?.nama || '-' },
    { label: 'Angkatan', value: data.mahasiswa?.angkatan || '-' }
  ]);
  
  const headers = [
    { label: 'No', width: 25, align: 'center' as const },
    { label: 'Kode', width: 50, align: 'center' as const },
    { label: 'Mata Kuliah', width: 200, align: 'left' as const },
    { label: 'SKS', width: 30, align: 'center' as const },
    { label: 'Nilai', width: 45, align: 'center' as const },
    { label: 'Huruf', width: 45, align: 'center' as const },
    { label: 'Bobot', width: 50, align: 'center' as const }
  ];
  
  (data.khs || []).forEach((semester: any, semIndex: number) => {
    if (semIndex > 0) doc.addPage();
    
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000')
       .text(`Semester ${semester.semester?.periode || ''} ${semester.semester?.tahunAkademik || ''}`, 50, doc.y + 10);
    doc.moveDown(0.5);
    
    const semesterNilai = (data.nilai || []).filter(
      (n: any) => n.kelasMK?.semester?.id === semester.semesterId
    );
    
    const rows = semesterNilai.map((n: any, i: number) => [
      String(i + 1),
      n.kelasMK?.mataKuliah?.kodeMK || '-',
      n.kelasMK?.mataKuliah?.namaMK || '-',
      String(n.kelasMK?.mataKuliah?.sks || 0),
      formatNumber(n.nilaiAngka),
      n.nilaiHuruf || '-',
      formatNumber(n.bobot)
    ]);
    
    drawTable(doc, headers, rows, { fontSize: 7 });
    
    doc.fontSize(9).font('Helvetica-Bold')
       .text(`IPS: ${formatNumber(semester.ips)} | IPK: ${formatNumber(semester.ipk)}`, 50, doc.y + 5);
  });
  
  // Summary box (CLEAN VERSION)
  if (doc.y > 600) {
    doc.addPage();
  }

  const summaryY = doc.y + 20;
  const boxHeight = 60;
  doc.rect(50, summaryY, 495, boxHeight).fillAndStroke('#f0f0f0', '#d0d0d0');

  let currentY = summaryY + 10;

  const summaryData = [
    { label: 'Total SKS', value: String(data.summary?.totalSKS || 0) },
    { label: 'IPK Akhir', value: formatNumber(data.summary?.finalIPK) },
    { label: 'Predikat', value: data.summary?.predikat || '-' },
    { label: 'Total Semester', value: String(data.summary?.totalSemester || 0) }
  ];

  summaryData.forEach((item) => {
    doc.fillColor('#000000').fontSize(9).font('Helvetica-Bold')
      .text(item.label + ':', 60, currentY, { width: 100, align: 'left' });
    
    doc.font('Helvetica')
      .text(item.value, 165, currentY, { width: 300, align: 'left' });
    
    currentY += 13;
  });

  doc.end();
};

/**
 * Generate Laporan Pembayaran
 */
const generatePembayaranReport = async (data: any, filename: string, res: Response) => {
  const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 50, right: 50 } });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);
  
  const logoPath = getLogoPath();
  const { pembayaranList, filters, stats, generatedAt } = data;
  
  drawPDFHeader(doc, logoPath);
  drawDocTitle(doc, 'LAPORAN PEMBAYARAN MAHASISWA', `Dicetak pada: ${generatedAt}`);
  
  // Filters info
  const filterInfo: string[] = [];
  if (filters.jenisPembayaran && filters.jenisPembayaran !== 'ALL') {
    filterInfo.push(`Jenis: ${filters.jenisPembayaran}`);
  }
  if (filters.status && filters.status !== 'ALL') {
    filterInfo.push(`Status: ${filters.status}`);
  }
  if (filters.semester) {
    filterInfo.push(`Semester: ${filters.semester}`);
  }
  if (filters.search) {
    filterInfo.push(`Pencarian: ${filters.search}`);
  }
  
  if (filterInfo.length > 0) {
    doc.fontSize(8).font('Helvetica')
       .text(`Filter: ${filterInfo.join(', ')}`, 50, doc.y + 5);
    doc.moveDown(0.5);
  }
  
  // Stats cards
  drawStatCards(doc, [
    { label: 'Total', value: stats.total, color: '#e8f5e9' },
    { label: 'Pending', value: stats.pending, color: '#fff9c4' },
    { label: 'Disetujui', value: stats.approved, color: '#c8e6c9' },
    { label: 'Ditolak', value: stats.rejected, color: '#ffcdd2' },
    { label: 'Nominal', value: formatCurrency(stats.totalNominal), color: '#bbdefb', small: true }
  ]);
  
  // Table
  const headers = [
    { label: 'No', width: 20, align: 'center' as const },
    { label: 'NIM', width: 45, align: 'left' as const },
    { label: 'Nama', width: 90, align: 'left' as const },
    { label: 'Jenis', width: 60, align: 'left' as const },
    { label: 'Semester', width: 55, align: 'center' as const },
    { label: 'Nominal', width: 60, align: 'right' as const },
    { label: 'Tgl Upload', width: 55, align: 'center' as const },
    { label: 'Tgl Verif', width: 55, align: 'center' as const },
    { label: 'Status', width: 40, align: 'center' as const }
  ];
  
  const rows = pembayaranList.map((p: any, i: number) => {
    const semesterInfo = p.jenisPembayaran === 'KOMITMEN_BULANAN' && p.bulanPembayaran
      ? new Date(p.bulanPembayaran).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
      : p.semester ? `${p.semester.tahunAkademik} ${p.semester.periode}` : '-';
    
    return [
      String(i + 1),
      p.mahasiswa?.nim || '-',
      p.mahasiswa?.namaLengkap || '-',
      p.jenisPembayaran || '-',
      semesterInfo,
      formatCurrency(p.nominal),
      formatDate(p.uploadedAt).split(',')[0],
      p.verifiedAt ? formatDate(p.verifiedAt).split(',')[0] : '-',
      p.status || '-'
    ];
  });
  
  const footerRows = pembayaranList.length > 0 ? [[
    '', '', '', '', 'Total:',
    formatCurrency(pembayaranList.reduce((sum: number, p: any) => sum + p.nominal, 0)),
    '', '', ''
  ]] : undefined;
  
  drawTable(doc, headers, rows, { fontSize: 7, footerRows });
  
  doc.fontSize(7).fillColor('#666666')
     .text('STT Diakonos - Sistem Informasi Akademik', 50, doc.page.height - 50, {
       width: 495, align: 'center'
     });
  
  doc.end();
};

/**
 * Generate Jadwal Mengajar Dosen
 */
const generateJadwalDosen = async (data: any, filename: string, res: Response) => {
  const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 50, right: 50 } });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);
  
  const logoPath = getLogoPath();
  const { dosen, jadwal, semester, generatedAt } = data;
  
  drawPDFHeader(doc, logoPath);
  drawDocTitle(doc, 'JADWAL MENGAJAR DOSEN', `Semester ${semester?.periode || ''} ${semester?.tahunAkademik || ''}`);
  
  drawInfoBox(doc, [
    { label: 'NIDN', value: dosen?.nidn || '-' },
    { label: 'Nama Dosen', value: dosen?.namaLengkap || '-' },
    { label: 'Program Studi', value: dosen?.prodi?.nama || '-' }
  ]);
  
  // Group by day
  const groupedByDay = jadwal.reduce((acc: any, j: any) => {
    if (!acc[j.hari]) acc[j.hari] = [];
    acc[j.hari].push(j);
    return acc;
  }, {});
  
  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  
  days.forEach(day => {
    const daySchedule = groupedByDay[day] || [];
    if (daySchedule.length === 0) return;
    
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000')
       .text(day, 50, doc.y + 10);
    doc.moveDown(0.5);
    
    const headers = [
      { label: 'Waktu', width: 75, align: 'center' as const },
      { label: 'Kode MK', width: 60, align: 'center' as const },
      { label: 'Mata Kuliah', width: 170, align: 'left' as const },
      { label: 'SKS', width: 35, align: 'center' as const },
      { label: 'Ruangan', width: 70, align: 'center' as const },
      { label: 'Jml Mhs', width: 75, align: 'center' as const }
    ];
    
    const rows = daySchedule.map((j: any) => [
      `${j.jamMulai}-${j.jamSelesai}`,
      j.mataKuliah?.kodeMK || '-',
      j.mataKuliah?.namaMK || '-',
      String(j.mataKuliah?.sks || 0),
      j.ruangan?.nama || '-',
      `${j._count?.krsDetail || 0} / ${j.kuotaMax || 0}`
    ]);
    
    drawTable(doc, headers, rows, { fontSize: 8 });
  });
  
  // Summary
  drawSummaryBox(doc, [
    { label: 'Total Mata Kuliah:', value: String(jadwal.length) },
    { label: 'Total SKS:', value: String(jadwal.reduce((sum: number, j: any) => sum + (j.mataKuliah?.sks || 0), 0)) },
    { label: 'Total Mahasiswa:', value: String(jadwal.reduce((sum: number, j: any) => sum + (j._count?.krsDetail || 0), 0)) }
  ], 50);
  
  doc.fontSize(7).fillColor('#666666')
     .text(`Dicetak pada: ${generatedAt}`, 50, doc.page.height - 50, { width: 495, align: 'center' });
  
  doc.end();
};

/**
 * Generate Jadwal Kuliah Mahasiswa
 */
const generateJadwalMahasiswa = async (data: any, filename: string, res: Response) => {
  const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 50, right: 50 } });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);
  
  const logoPath = getLogoPath();
  const { mahasiswa, jadwal, semester, generatedAt } = data;
  
  drawPDFHeader(doc, logoPath);
  drawDocTitle(doc, 'JADWAL KULIAH MAHASISWA', `Semester ${semester?.periode || ''} ${semester?.tahunAkademik || ''}`);
  
  drawInfoBox(doc, [
    { label: 'NIM', value: mahasiswa?.nim || '-' },
    { label: 'Nama', value: mahasiswa?.namaLengkap || '-' },
    { label: 'Program Studi', value: mahasiswa?.prodi?.nama || '-' },
    { label: 'Angkatan', value: mahasiswa?.angkatan || '-' }
  ]);
  
  // Group by day
  const groupedByDay = jadwal.reduce((acc: any, j: any) => {
    if (!acc[j.hari]) acc[j.hari] = [];
    acc[j.hari].push(j);
    return acc;
  }, {});
  
  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  
  days.forEach(day => {
    const daySchedule = (groupedByDay[day] || []).sort((a: any, b: any) => 
      a.jamMulai.localeCompare(b.jamMulai)
    );
    if (daySchedule.length === 0) return;
    
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000')
       .text(day, 50, doc.y + 10);
    doc.moveDown(0.5);
    
    const headers = [
      { label: 'Waktu', width: 75, align: 'center' as const },
      { label: 'Kode MK', width: 60, align: 'center' as const },
      { label: 'Mata Kuliah', width: 145, align: 'left' as const },
      { label: 'SKS', width: 35, align: 'center' as const },
      { label: 'Dosen', width: 100, align: 'left' as const },
      { label: 'Ruangan', width: 70, align: 'center' as const }
    ];
    
    const rows = daySchedule.map((j: any) => [
      `${j.jamMulai}-${j.jamSelesai}`,
      j.mataKuliah?.kodeMK || '-',
      j.mataKuliah?.namaMK || '-',
      String(j.mataKuliah?.sks || 0),
      j.dosen?.namaLengkap || '-',
      j.ruangan?.nama || '-'
    ]);
    
    drawTable(doc, headers, rows, { fontSize: 8 });
  });
  
  // Summary
  const totalSKS = jadwal.reduce((sum: number, j: any) => sum + (j.mataKuliah?.sks || 0), 0);
  
  drawSummaryBox(doc, [
    { label: 'Total Mata Kuliah:', value: String(jadwal.length) },
    { label: 'Total SKS:', value: String(totalSKS) }
  ], 35);
  
  doc.fontSize(7).fillColor('#666666')
     .text(`Dicetak pada: ${generatedAt}`, 50, doc.page.height - 50, { width: 495, align: 'center' });
  
  doc.end();
};

/**
 * Generate Daftar Hadir Perkuliahan
 */
const generatePresensiPertemuan = async (data: any, filename: string, res: Response) => {
  const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 50, right: 50 } });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);
  
  const logoPath = getLogoPath();
  const { presensi, detail, kelasMK, generatedAt } = data;
  
  drawPDFHeader(doc, logoPath);
  drawDocTitle(doc, 'DAFTAR HADIR PERKULIAHAN', `Pertemuan ke-${presensi?.pertemuan || '-'}`);
  
  drawInfoBox(doc, [
    { label: 'Mata Kuliah', value: `${kelasMK?.mataKuliah?.namaMK || '-'} (${kelasMK?.mataKuliah?.kodeMK || '-'})` },
    { label: 'SKS', value: String(kelasMK?.mataKuliah?.sks || 0) },
    { label: 'Dosen', value: kelasMK?.dosen?.namaLengkap || '-' },
    { label: 'Hari/Jam', value: `${kelasMK?.hari || '-'}, ${kelasMK?.jamMulai || ''}-${kelasMK?.jamSelesai || ''}` },
    { label: 'Ruangan', value: kelasMK?.ruangan?.nama || '-' },
    { label: 'Tanggal', value: presensi?.tanggal ? new Date(presensi.tanggal).toLocaleDateString('id-ID', {
        day: '2-digit', month: 'long', year: 'numeric'
      }) : '-' },
    { label: 'Materi', value: presensi?.materi || '-' }
  ]);
  
  // Stats
  const statusCount = {
    HADIR: detail.filter((d: any) => d.status === 'HADIR').length,
    IZIN: detail.filter((d: any) => d.status === 'IZIN').length,
    SAKIT: detail.filter((d: any) => d.status === 'SAKIT').length,
    ALPHA: detail.filter((d: any) => d.status === 'ALPHA').length,
    TIDAK_HADIR: detail.filter((d: any) => d.status === 'TIDAK_HADIR').length
  };
  
  drawStatCards(doc, [
    { label: 'Hadir', value: statusCount.HADIR, color: '#c8e6c9' },
    { label: 'Izin', value: statusCount.IZIN, color: '#fff9c4' },
    { label: 'Sakit', value: statusCount.SAKIT, color: '#e1bee7' },
    { label: 'Alpha', value: statusCount.ALPHA, color: '#cfd8dc' },
    { label: 'Tdk Hadir', value: statusCount.TIDAK_HADIR, color: '#ffcdd2' }
  ]);
  
  // Table
  const headers = [
    { label: 'No', width: 25, align: 'center' as const },
    { label: 'NIM', width: 60, align: 'left' as const },
    { label: 'Nama Mahasiswa', width: 170, align: 'left' as const },
    { label: 'Status', width: 75, align: 'center' as const },
    { label: 'Keterangan', width: 155, align: 'left' as const }
  ];
  
  const rows = detail.map((d: any, i: number) => [
    String(i + 1),
    d.mahasiswa?.nim || '-',
    d.mahasiswa?.namaLengkap || '-',
    d.status?.replace('_', ' ') || '-',
    d.keterangan || '-'
  ]);
  
  drawTable(doc, headers, rows, { fontSize: 8 });
  
  if (presensi?.catatan) {
    const noteY = doc.y + 10;
    doc.rect(50, noteY, 495, 30).fillAndStroke('#f5f5f5', '#666666');
    doc.fillColor('#000000').fontSize(9).font('Helvetica-Bold')
       .text('Catatan:', 55, noteY + 5);
    doc.font('Helvetica').fontSize(8)
       .text(presensi.catatan, 55, noteY + 17, { width: 485 });
    doc.y = noteY + 35;
  }
  
  doc.fontSize(7).fillColor('#666666')
     .text(`Dicetak pada: ${generatedAt}`, 50, doc.page.height - 50, { width: 495, align: 'center' });
  
  doc.end();
};

/**
 * Generate Daftar Nilai Mahasiswa
 */
const generateNilaiKelas = async (data: any, filename: string, res: Response) => {
  const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 50, right: 50 } });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);
  
  const logoPath = getLogoPath();
  const { kelasMK, nilaiList, semester, generatedAt } = data;
  
  drawPDFHeader(doc, logoPath);
  drawDocTitle(doc, 'DAFTAR NILAI MAHASISWA', `Semester ${semester?.periode || ''} ${semester?.tahunAkademik || ''}`);
  
  drawInfoBox(doc, [
    { label: 'Mata Kuliah', value: `${kelasMK?.mataKuliah?.namaMK || '-'} (${kelasMK?.mataKuliah?.kodeMK || '-'})` },
    { label: 'SKS', value: String(kelasMK?.mataKuliah?.sks || 0) },
    { label: 'Dosen', value: kelasMK?.dosen?.namaLengkap || '-' },
    { label: 'Hari/Jam', value: `${kelasMK?.hari || '-'}, ${kelasMK?.jamMulai || ''}-${kelasMK?.jamSelesai || ''}` },
    { label: 'Ruangan', value: kelasMK?.ruangan?.nama || '-' }
  ]);
  
  // Stats
  const stats = {
    total: nilaiList.length,
    finalized: nilaiList.filter((n: any) => n.isFinalized).length,
    draft: nilaiList.filter((n: any) => !n.isFinalized).length,
    lulus: nilaiList.filter((n: any) => n.nilaiHuruf && !['E', 'DE'].includes(n.nilaiHuruf)).length
  };
  
  drawStatCards(doc, [
    { label: 'Total Mahasiswa', value: stats.total, color: '#e3f2fd' },
    { label: 'Finalized', value: stats.finalized, color: '#c8e6c9' },
    { label: 'Draft', value: stats.draft, color: '#fff9c4' },
    { label: 'Lulus', value: stats.lulus, color: '#b3e5fc' }
  ]);
  
  // Table
  const headers = [
    { label: 'No', width: 25, align: 'center' as const },
    { label: 'NIM', width: 55, align: 'left' as const },
    { label: 'Nama Mahasiswa', width: 140, align: 'left' as const },
    { label: 'Nilai Angka', width: 50, align: 'center' as const },
    { label: 'Nilai Huruf', width: 50, align: 'center' as const },
    { label: 'Bobot', width: 45, align: 'center' as const },
    { label: 'Status', width: 50, align: 'center' as const },
    { label: 'Input Oleh', width: 70, align: 'left' as const }
  ];
  
  const rows = nilaiList.map((n: any, i: number) => [
    String(i + 1),
    n.mahasiswa?.nim || '-',
    n.mahasiswa?.namaLengkap || '-',
    formatNumber(n.nilaiAngka),
    n.nilaiHuruf || '-',
    formatNumber(n.bobot),
    n.isFinalized ? 'Finalized' : 'Draft',
    n.inputBy?.dosen?.namaLengkap || '-'
  ]);
  
  drawTable(doc, headers, rows, { fontSize: 7 });
  
  doc.fontSize(7).fillColor('#666666')
     .text(`Dicetak pada: ${generatedAt}`, 50, doc.page.height - 50, { width: 495, align: 'center' });
  
  doc.end();
};

/**
 * Generate Rekap Presensi Mahasiswa
 */
const generateRekapPresensi = async (data: any, filename: string, res: Response) => {
  const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 50, right: 50 } });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);
  
  const logoPath = getLogoPath();
  const { kelasMK, mahasiswaList, pertemuanList, semester, generatedAt } = data;
  
  drawPDFHeader(doc, logoPath);
  drawDocTitle(doc, 'REKAP PRESENSI MAHASISWA', `Semester ${semester?.periode || ''} ${semester?.tahunAkademik || ''}`);
  
  drawInfoBox(doc, [
    { label: 'Mata Kuliah', value: `${kelasMK?.mataKuliah?.namaMK || '-'} (${kelasMK?.mataKuliah?.kodeMK || '-'})` },
    { label: 'Dosen', value: kelasMK?.dosen?.namaLengkap || '-' }
  ]);
  
  // Create custom table for attendance recap
  const fontSize = 6;
  const startX = 50;
  let currentY = doc.y;
  const rowHeight = fontSize + 6;
  
  // Column widths
  const noWidth = 20;
  const nimWidth = 50;
  const namaWidth = 130;
  const pertemuanWidth = Math.min(15, Math.floor(200 / pertemuanList.length));
  const totalPertemuanWidth = pertemuanWidth * pertemuanList.length;
  const statsWidth = 25;
  const totalWidth = noWidth + nimWidth + namaWidth + totalPertemuanWidth + (statsWidth * 5);
  
  doc.lineWidth(0.5);
  
  // Header row 1
  doc.rect(startX, currentY, totalWidth, rowHeight).fillAndStroke('#e0e0e0', '#333333');
  doc.fillColor('#000000').fontSize(fontSize).font('Helvetica-Bold');
  
  let currentX = startX;
  doc.text('No', currentX + 2, currentY + 3, { width: noWidth - 4, align: 'center' });
  currentX += noWidth;
  doc.text('NIM', currentX + 2, currentY + 3, { width: nimWidth - 4, align: 'center' });
  currentX += nimWidth;
  doc.text('Nama', currentX + 2, currentY + 3, { width: namaWidth - 4, align: 'center' });
  currentX += namaWidth;
  doc.text('Pertemuan', currentX + 2, currentY + 3, { width: totalPertemuanWidth - 4, align: 'center' });
  currentX += totalPertemuanWidth;
  doc.text('H', currentX + 2, currentY + 3, { width: statsWidth - 4, align: 'center' });
  currentX += statsWidth;
  doc.text('I', currentX + 2, currentY + 3, { width: statsWidth - 4, align: 'center' });
  currentX += statsWidth;
  doc.text('S', currentX + 2, currentY + 3, { width: statsWidth - 4, align: 'center' });
  currentX += statsWidth;
  doc.text('A', currentX + 2, currentY + 3, { width: statsWidth - 4, align: 'center' });
  currentX += statsWidth;
  doc.text('%', currentX + 2, currentY + 3, { width: statsWidth - 4, align: 'center' });
  
  currentY += rowHeight;
  
  // Header row 2 (pertemuan numbers)
  doc.rect(startX, currentY, totalWidth, rowHeight).fillAndStroke('#e0e0e0', '#333333');
  currentX = startX + noWidth + nimWidth + namaWidth;
  
  pertemuanList.forEach((p: any) => {
    doc.fillColor('#000000').fontSize(fontSize - 1).font('Helvetica-Bold')
       .text(String(p.pertemuan), currentX + 1, currentY + 3, { width: pertemuanWidth - 2, align: 'center' });
    doc.moveTo(currentX, currentY).lineTo(currentX, currentY + rowHeight).stroke();
    currentX += pertemuanWidth;
  });
  
  currentY += rowHeight;
  
  // Data rows
  mahasiswaList.forEach((mhs: any, index: number) => {
    if (currentY + rowHeight > doc.page.height - 80) {
      doc.addPage();
      currentY = 50;
    }
    
    const stats = { hadir: 0, izin: 0, sakit: 0, alpha: 0 };
    
    const rowBg = index % 2 === 0 ? '#ffffff' : '#fafafa';
    doc.rect(startX, currentY, totalWidth, rowHeight).fillAndStroke(rowBg, '#333333');
    
    currentX = startX;
    
    // No
    doc.fillColor('#000000').fontSize(fontSize).font('Helvetica')
       .text(String(index + 1), currentX + 2, currentY + 3, { width: noWidth - 4, align: 'center' });
    currentX += noWidth;
    
    // NIM
    doc.text(mhs.mahasiswa?.nim || '-', currentX + 2, currentY + 3, { width: nimWidth - 4, align: 'left' });
    currentX += nimWidth;
    
    // Nama
    doc.text(mhs.mahasiswa?.namaLengkap || '-', currentX + 2, currentY + 3, { width: namaWidth - 4, align: 'left' });
    currentX += namaWidth;
    
    // Pertemuan status
    pertemuanList.forEach((p: any) => {
      const presensi = mhs.presensi?.find((pr: any) => pr.presensiId === p.id);
      const status: string = presensi?.status || 'ALPHA';
      
      if (status === 'HADIR') stats.hadir++;
      else if (status === 'IZIN') stats.izin++;
      else if (status === 'SAKIT') stats.sakit++;
      else stats.alpha++;
      
      const statusSymbolMap: Record<string, string> = {
        'HADIR': '✓',
        'IZIN': 'I',
        'SAKIT': 'S',
        'ALPHA': 'A',
        'TIDAK_HADIR': '✗'
      };
      const statusSymbol = statusSymbolMap[status] || '-';
      
      const statusColorMap: Record<string, string> = {
        'HADIR': '#c8e6c9',
        'IZIN': '#fff9c4',
        'SAKIT': '#e1bee7',
        'ALPHA': '#cfd8dc',
        'TIDAK_HADIR': '#ffcdd2'
      };
      const bgColor = statusColorMap[status] || '#ffffff';
      
      doc.rect(currentX, currentY, pertemuanWidth, rowHeight).fillAndStroke(bgColor, '#333333');
      doc.fillColor('#000000').fontSize(fontSize - 1).font('Helvetica')
         .text(statusSymbol, currentX + 1, currentY + 3, { width: pertemuanWidth - 2, align: 'center' });
      
      currentX += pertemuanWidth;
    });
    
    // Summary stats
    doc.font('Helvetica-Bold');
    doc.text(String(stats.hadir), currentX + 2, currentY + 3, { width: statsWidth - 4, align: 'center' });
    currentX += statsWidth;
    doc.text(String(stats.izin), currentX + 2, currentY + 3, { width: statsWidth - 4, align: 'center' });
    currentX += statsWidth;
    doc.text(String(stats.sakit), currentX + 2, currentY + 3, { width: statsWidth - 4, align: 'center' });
    currentX += statsWidth;
    doc.text(String(stats.alpha), currentX + 2, currentY + 3, { width: statsWidth - 4, align: 'center' });
    currentX += statsWidth;
    const percentage = Math.round((stats.hadir / pertemuanList.length) * 100);
    doc.text(`${percentage}%`, currentX + 2, currentY + 3, { width: statsWidth - 4, align: 'center' });
    
    currentY += rowHeight;
  });
  
  doc.lineWidth(1);
  doc.y = currentY + 10;
  
  // Legend
  doc.fontSize(7).font('Helvetica')
     .text('Keterangan: H = Hadir | I = Izin | S = Sakit | A = Alpha (Tidak Hadir Tanpa Keterangan)', 50, doc.y);
  
  doc.fontSize(7).fillColor('#666666')
     .text(`Dicetak pada: ${generatedAt}`, 50, doc.page.height - 50, { width: 495, align: 'center' });
  
  doc.end();
};

/**
 * Generate Berita Acara Perkuliahan
 */
const generateBeritaAcara = async (data: any, filename: string, res: Response) => {
  const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 50, right: 50 } });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);
  
  const logoPath = getLogoPath();
  const { presensiList, kelasMK, semester, generatedAt } = data;
  
  const currentYear = new Date().getFullYear();
  const location = 'Banyumas';
  const programStudi = kelasMK?.mataKuliah?.prodi?.nama || kelasMK?.dosen?.prodi?.nama || '-';
  
  drawPDFHeader(doc, logoPath);
  drawDocTitle(doc, 'BERITA ACARA PERKULIAHAN', 
    `Semester ${semester?.periode || ''} Tahun Akademik ${semester?.tahunAkademik || ''}\nProgram Studi ${programStudi}`);
  
  drawInfoBox(doc, [
    { label: 'Mata Kuliah', value: kelasMK?.mataKuliah?.namaMK || '-' },
    { label: 'Semester/Beban', value: `${kelasMK?.mataKuliah?.semesterIdeal || '-'} (${kelasMK?.mataKuliah?.sks || 0} SKS)` },
    { label: 'Dosen', value: kelasMK?.dosen?.namaLengkap || '-' },
    { label: 'Hari / Waktu', value: `${kelasMK?.hari || '-'} / Pukul ${kelasMK?.jamMulai || ''}-${kelasMK?.jamSelesai || ''}` }
  ]);
  
  // Custom table for Berita Acara
  const fontSize = 7;
  const startX = 50;
  let currentY = doc.y;
  const rowHeight = fontSize + 8;

  const colWidths = {
    pertemuan: 35,
    tanggal: 50,
    model: 50,
    materi: 170,
    hadir: 35,
    tidakHadir: 40,
    ttdDosen: 60,
    ttdKetua: 55,
  };

  const totalWidth = Object.values(colWidths).reduce((a, b) => a + b, 0);

  doc.lineWidth(0.5);

  // Header row (complex merged cells)
  doc.rect(startX, currentY, totalWidth, rowHeight * 2).fillAndStroke('#e0e0e0', '#333333');
  
  let currentX = startX;
  doc.fillColor('#000000').fontSize(fontSize).font('Helvetica-Bold');

  // Pertemuan (rowspan 2)
  doc.text('Perte-\nmuan', currentX + 2, currentY + 5, { 
    width: colWidths.pertemuan - 4, 
    align: 'center' 
  });
  doc.moveTo(currentX + colWidths.pertemuan, currentY)
     .lineTo(currentX + colWidths.pertemuan, currentY + rowHeight * 2)
     .stroke();
  currentX += colWidths.pertemuan;

  // Tanggal (rowspan 2)
  doc.text('Tanggal', currentX + 2, currentY + 8, { 
    width: colWidths.tanggal - 4, 
    align: 'center' 
  });
  doc.moveTo(currentX + colWidths.tanggal, currentY)
     .lineTo(currentX + colWidths.tanggal, currentY + rowHeight * 2)
     .stroke();
  currentX += colWidths.tanggal;

  // Model (rowspan 2)
  doc.text('Model\n(Luring/\nDaring)', currentX + 2, currentY + 2, { 
    width: colWidths.model - 4, 
    align: 'center' 
  });
  doc.moveTo(currentX + colWidths.model, currentY)
     .lineTo(currentX + colWidths.model, currentY + rowHeight * 2)
     .stroke();
  currentX += colWidths.model;

  // Materi (rowspan 2)
  doc.text('Pokok Materi', currentX + 2, currentY + 8, { 
    width: colWidths.materi - 4, 
    align: 'center' 
  });
  doc.moveTo(currentX + colWidths.materi, currentY)
     .lineTo(currentX + colWidths.materi, currentY + rowHeight * 2)
     .stroke();
  currentX += colWidths.materi;

  // Mahasiswa (colspan 2)
  doc.text('Mahasiswa', currentX + 2, currentY + 3, { 
    width: colWidths.hadir + colWidths.tidakHadir - 4, 
    align: 'center' 
  });
  doc.moveTo(currentX, currentY + rowHeight)
     .lineTo(currentX + colWidths.hadir + colWidths.tidakHadir, currentY + rowHeight)
     .stroke();

  // Hadir
  doc.text('Hadir', currentX + 2, currentY + rowHeight + 3, { 
    width: colWidths.hadir - 4, 
    align: 'center' 
  });
  doc.moveTo(currentX + colWidths.hadir, currentY + rowHeight)
     .lineTo(currentX + colWidths.hadir, currentY + rowHeight * 2)
     .stroke();
  currentX += colWidths.hadir;

  // Tidak Hadir
  doc.text('Tdk Har', currentX + 2, currentY + rowHeight + 3, { 
    width: colWidths.tidakHadir - 4, 
    align: 'center' 
  });
  doc.moveTo(currentX + colWidths.tidakHadir, currentY)
     .lineTo(currentX + colWidths.tidakHadir, currentY + rowHeight * 2)
     .stroke();
  currentX += colWidths.tidakHadir;

  // TTD Dosen (rowspan 2)
  doc.text('TTD\nDosen', currentX + 2, currentY + 5, { 
    width: colWidths.ttdDosen - 4, 
    align: 'center' 
  });
  doc.moveTo(currentX + colWidths.ttdDosen, currentY)
     .lineTo(currentX + colWidths.ttdDosen, currentY + rowHeight * 2)
     .stroke();
  currentX += colWidths.ttdDosen;

  // TTD Ketua (rowspan 2)
  doc.text('TTD\nKetua\nKelas', currentX + 2, currentY + 3, { 
    width: colWidths.ttdKetua - 4, 
    align: 'center' 
  });

  currentY += rowHeight * 2;

  // Data rows (16 rows total)
  for (let i = 0; i < 16; i++) {
    const p = presensiList[i];
    
    if (currentY + rowHeight > doc.page.height - 100) {
      doc.addPage();
      currentY = 50;
    }

    doc.rect(startX, currentY, totalWidth, rowHeight).fillAndStroke('#ffffff', '#333333');
    currentX = startX;
    
    doc.fillColor('#000000').fontSize(fontSize).font('Helvetica');

    // Pertemuan
    doc.text(String(i + 1), currentX + 2, currentY + 3, { 
      width: colWidths.pertemuan - 4, 
      align: 'center' 
    });
    doc.moveTo(currentX + colWidths.pertemuan, currentY)
       .lineTo(currentX + colWidths.pertemuan, currentY + rowHeight)
       .stroke();
    currentX += colWidths.pertemuan;

    if (p) {
      const hadirCount = p.detail?.filter((d: any) => d.status === 'HADIR').length || 0;
      const tidakHadirCount = p.detail?.filter((d: any) => 
        d.status === 'TIDAKHADIR' || d.status === 'ALPHA' || d.status === 'IZIN' || d.status === 'SAKIT'
      ).length || 0;

      // Tanggal
      const tanggalText = p.tanggal 
        ? new Date(p.tanggal).toLocaleDateString('id-ID', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
          })
        : '';
      doc.text(tanggalText, currentX + 2, currentY + 3, { 
        width: colWidths.tanggal - 4, 
        align: 'center' 
      });
      doc.moveTo(currentX + colWidths.tanggal, currentY)
         .lineTo(currentX + colWidths.tanggal, currentY + rowHeight)
         .stroke();
      currentX += colWidths.tanggal;

      // Model
      doc.text(p.modePembelajaran || 'Luring', currentX + 2, currentY + 3, { 
        width: colWidths.model - 4, 
        align: 'center' 
      });
      doc.moveTo(currentX + colWidths.model, currentY)
         .lineTo(currentX + colWidths.model, currentY + rowHeight)
         .stroke();
      currentX += colWidths.model;

      // Materi
      const materiText = p.materi || '';
      doc.text(materiText, currentX + 2, currentY + 3, { 
        width: colWidths.materi - 4, 
        align: 'left' 
      });
      doc.moveTo(currentX + colWidths.materi, currentY)
         .lineTo(currentX + colWidths.materi, currentY + rowHeight)
         .stroke();
      currentX += colWidths.materi;

      // Hadir
      doc.text(String(hadirCount), currentX + 2, currentY + 3, { 
        width: colWidths.hadir - 4, 
        align: 'center' 
      });
      doc.moveTo(currentX + colWidths.hadir, currentY)
         .lineTo(currentX + colWidths.hadir, currentY + rowHeight)
         .stroke();
      currentX += colWidths.hadir;

      // Tidak Hadir
      doc.text(tidakHadirCount > 0 ? String(tidakHadirCount) : '', currentX + 2, currentY + 3, { 
        width: colWidths.tidakHadir - 4, 
        align: 'center' 
      });
      doc.moveTo(currentX + colWidths.tidakHadir, currentY)
         .lineTo(currentX + colWidths.tidakHadir, currentY + rowHeight)
         .stroke();
      currentX += colWidths.tidakHadir;
    } else {
      // Empty cells with vertical lines
      currentX += colWidths.tanggal + colWidths.model + colWidths.materi + colWidths.hadir + colWidths.tidakHadir;
      
      let tempX = startX + colWidths.pertemuan;
      doc.moveTo(tempX, currentY).lineTo(tempX, currentY + rowHeight).stroke();
      tempX += colWidths.tanggal;
      doc.moveTo(tempX, currentY).lineTo(tempX, currentY + rowHeight).stroke();
      tempX += colWidths.model;
      doc.moveTo(tempX, currentY).lineTo(tempX, currentY + rowHeight).stroke();
      tempX += colWidths.materi;
      doc.moveTo(tempX, currentY).lineTo(tempX, currentY + rowHeight).stroke();
      tempX += colWidths.hadir;
      doc.moveTo(tempX, currentY).lineTo(tempX, currentY + rowHeight).stroke();
      tempX += colWidths.tidakHadir;
      doc.moveTo(tempX, currentY).lineTo(tempX, currentY + rowHeight).stroke();
    }

    // TTD columns (empty)
    doc.moveTo(currentX + colWidths.ttdDosen, currentY)
       .lineTo(currentX + colWidths.ttdDosen, currentY + rowHeight)
       .stroke();
    currentX += colWidths.ttdDosen + colWidths.ttdKetua;

    currentY += rowHeight;
  }

  doc.lineWidth(1);
  doc.y = currentY + 15;
  
  // Signature section
  doc.fontSize(9).font('Helvetica')
     .text(`${location}, ................................ ${currentYear}`, 50, doc.y, { width: 495, align: 'center' });
  doc.text('Sekolah Tinggi Teologi Diakonos', 50, doc.y + 5, { width: 495, align: 'center' });
  doc.text('Biro Administrasi Akademik Kemahasiswaan,', 50, doc.y + 5, { width: 495, align: 'center' });
  
  const sigY = doc.y + 60;
  doc.moveTo(220, sigY).lineTo(370, sigY).stroke();
  doc.fontSize(9).font('Helvetica-Bold')
     .text(kelasMK?.dosen?.namaLengkap || 'Nama Dosen', 220, sigY + 5, { width: 150, align: 'center' });
  
  doc.fontSize(7).fillColor('#666666')
     .text(`Dicetak pada: ${generatedAt}`, 50, doc.page.height - 50, { width: 495, align: 'center' });
  
  doc.end();
};

/**
 * Generate Daftar KRS Mahasiswa Bimbingan
 */
const generateKRSBimbingan = async (data: any, filename: string, res: Response) => {
  const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 50, right: 50 } });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);
  
  const logoPath = getLogoPath();
  const { mahasiswaList, semester, dosenWali, generatedAt } = data;
  
  drawPDFHeader(doc, logoPath);
  drawDocTitle(doc, 'DAFTAR KRS MAHASISWA BIMBINGAN', `Semester ${semester?.periode || ''} ${semester?.tahunAkademik || ''}`);
  
  drawInfoBox(doc, [
    { label: 'Dosen Wali', value: dosenWali?.namaLengkap || '-' },
    { label: 'NIDN', value: dosenWali?.nidn || '-' },
    { label: 'Program Studi', value: dosenWali?.prodi?.nama || '-' },
    { label: 'Jumlah Mahasiswa', value: `${mahasiswaList.length} mahasiswa` }
  ]);
  
  // Process each student
  mahasiswaList.forEach((mhs: any, mhsIndex: number) => {
    if (mhsIndex > 0) {
      // Pagination
      if (doc.y > doc.page.height - 300) {
        doc.addPage();
      } else {
        doc.moveDown(1.5);
      }
    }
    
    const krs = mhs.krs;
    
    // Student header
    const headerY = doc.y + 10;
    const statusColors: Record<string, string> = {
      'APPROVED': '#c8e6c9',
      'SUBMITTED': '#fff9c4',
      'DRAFT': '#cfd8dc',
      'REJECTED': '#ffcdd2'
    };
    const statusColor = statusColors[krs?.status || 'DRAFT'] || '#cfd8dc';
    
    doc.rect(50, headerY, 495, 20).fillAndStroke(statusColor, '#333333');
    doc.fillColor('#000000').fontSize(9).font('Helvetica-Bold')
       .text(`${mhs.nim} - ${mhs.namaLengkap} (Angkatan ${mhs.angkatan}) - Status: ${krs?.status || 'DRAFT'}`, 
             55, headerY + 6, { width: 485 });
    
    doc.y = headerY + 25;
    
    if (krs) {
      // KRS table
      const headers = [
        { label: 'No', width: 20, align: 'center' as const },
        { label: 'Kode MK', width: 55, align: 'center' as const },
        { label: 'Mata Kuliah', width: 170, align: 'left' as const },
        { label: 'SKS', width: 30, align: 'center' as const },
        { label: 'Dosen', width: 110, align: 'left' as const },
        { label: 'Jadwal', width: 110, align: 'left' as const }
      ];
      
      const rows = (krs.detail || []).map((d: any, i: number) => [
        String(i + 1),
        d.kelasMK?.mataKuliah?.kodeMK || '-',
        d.kelasMK?.mataKuliah?.namaMK || '-',
        String(d.kelasMK?.mataKuliah?.sks || 0),
        d.kelasMK?.dosen?.namaLengkap || '-',
        `${d.kelasMK?.hari || '-'}, ${d.kelasMK?.jamMulai || ''}-${d.kelasMK?.jamSelesai || ''}`
      ]);
      
      const footerRows = [['', '', 'Total SKS:', String(krs.totalSKS || 0), '', '']];
      
      drawTable(doc, headers, rows, { fontSize: 7, footerRows });
    } else {
      // No KRS message
      const msgY = doc.y;
      doc.rect(50, msgY, 495, 30).fillAndStroke('#f9f9f9', '#d0d0d0');
      doc.fillColor('#666666').fontSize(8).font('Helvetica-Oblique')
         .text('Mahasiswa belum mengisi KRS untuk semester ini', 55, msgY + 10, { width: 485, align: 'center' });
      doc.y = msgY + 35;
    }
  });
  
  doc.fontSize(7).fillColor('#666666')
     .text(`Dicetak pada: ${generatedAt}`, 50, doc.page.height - 50, { width: 495, align: 'center' });
  
  doc.end();
};
