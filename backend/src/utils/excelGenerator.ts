/**
 * Excel Generator Utility (NEW)
 * Generate Excel documents using ExcelJS
 * ✅ FIXED: Implementasi export Excel untuk BAK/Admin
 */

import ExcelJS from 'exceljs';
import { Response } from 'express';

/**
 * Generate Excel from data
 */
export const generateExcel = async (
  data: any[],
  columns: any[],
  sheetName: string,
  filename: string,
  res: Response
) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  // Set columns
  worksheet.columns = columns;

  // Add rows
  worksheet.addRows(data);

  // Style header
  worksheet.getRow(1).font = { bold: true, size: 12 };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD3D3D3' },
  };
  worksheet.getRow(1).alignment = { 
    vertical: 'middle', 
    horizontal: 'center' 
  };
  worksheet.getRow(1).height = 20;

  // Auto-fit columns
  worksheet.columns.forEach((column) => {
    let maxLength = 0;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const columnLength = cell.value ? cell.value.toString().length : 10;
      if (columnLength > maxLength) {
        maxLength = columnLength;
      }
    });
    column.width = maxLength < 10 ? 10 : maxLength + 2;
  });

  // Add borders to all cells
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
};

/**
 * Generate Excel with multiple sheets
 */
export const generateExcelMultiSheet = async (
  sheets: Array<{
    name: string;
    data: any[];
    columns: any[];
  }>,
  filename: string,
  res: Response
) => {
  const workbook = new ExcelJS.Workbook();

  sheets.forEach(({ name, data, columns }) => {
    const worksheet = workbook.addWorksheet(name);

    worksheet.columns = columns;
    worksheet.addRows(data);

    // Style header
    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' },
    };
    worksheet.getRow(1).alignment = { 
      vertical: 'middle', 
      horizontal: 'center' 
    };

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      let maxLength = 0;
      column.eachCell?.({ includeEmpty: true }, (cell) => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = maxLength < 10 ? 10 : maxLength + 2;
    });

    // Add borders
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
};

/**
 * Format data mahasiswa untuk Excel
 */
export const formatMahasiswaForExcel = (mahasiswaList: any[]) => {
  return mahasiswaList.map((m) => ({
    nim: m.nim,
    namaLengkap: m.namaLengkap,
    prodi: m.prodi?.nama || '-',
    angkatan: m.angkatan,
    status: m.status,
    dosenWali: m.dosenWali?.namaLengkap || '-',
  }));
};

/**
 * Format data nilai untuk Excel
 */
export const formatNilaiForExcel = (nilaiList: any[]) => {
  return nilaiList.map((n) => ({
    nim: n.mahasiswa.nim,
    namaLengkap: n.mahasiswa.namaLengkap,
    kodeMK: n.kelasMK.mataKuliah.kodeMK,
    namaMK: n.kelasMK.mataKuliah.namaMK,
    sks: n.kelasMK.mataKuliah.sks,
    nilaiAngka: n.nilaiAngka || '-',
    nilaiHuruf: n.nilaiHuruf || '-',
    bobot: n.bobot || '-',
    dosen: n.kelasMK.dosen.namaLengkap,
  }));
};

/**
 * Format data KRS untuk Excel
 */
export const formatKRSForExcel = (krsList: any[]) => {
  return krsList.flatMap((krs) =>
    krs.detail.map((d: any) => ({
      nim: krs.mahasiswa.nim,
      namaLengkap: krs.mahasiswa.namaLengkap,
      semester: `${krs.semester.tahunAkademik} ${krs.semester.periode}`,
      kodeMK: d.kelasMK.mataKuliah.kodeMK,
      namaMK: d.kelasMK.mataKuliah.namaMK,
      sks: d.kelasMK.mataKuliah.sks,
      dosen: d.kelasMK.dosen.namaLengkap,
      hari: d.kelasMK.hari,
      jamMulai: d.kelasMK.jamMulai,
      jamSelesai: d.kelasMK.jamSelesai,
      status: krs.status,
    }))
  );
};

/**
 * Format data pembayaran untuk Excel
 */
export const formatPembayaranForExcel = (pembayaranList: any[]) => {
  return pembayaranList.map((p) => ({
    tanggalUpload: new Date(p.uploadedAt).toLocaleDateString('id-ID'),
    nim: p.mahasiswa.nim,
    namaLengkap: p.mahasiswa.namaLengkap,
    jenisPembayaran: p.jenisPembayaran,
    nominal: p.nominal,
    status: p.status,
    tanggalVerifikasi: p.verifiedAt 
      ? new Date(p.verifiedAt).toLocaleDateString('id-ID')
      : '-',
    catatan: p.catatan || '-',
  }));
};