/**
 * IPK/IPS Calculator Utilities
 * Calculate IPS (semester GPA) and IPK (cumulative GPA)
 */

import { nilaiHurufToBobot } from './konversiNilai';

/**
 * Interface for nilai data
 */
interface NilaiData {
  nilaiHuruf: string | null;
  kelasMK: {
    mataKuliah: {
      sks: number;
    };
  };
}

/**
 * Calculate IPS (Index Prestasi Semester)
 * IPS = Sum(SKS * Bobot) / Sum(SKS)
 */
export const hitungIPS = (nilaiList: NilaiData[]): number => {
  if (nilaiList.length === 0) {
    return 0;
  }

  let totalBobot = 0;
  let totalSKS = 0;

  for (const nilai of nilaiList) {
    // Skip if nilai huruf not yet set
    if (!nilai.nilaiHuruf) continue;

    const sks = nilai.kelasMK.mataKuliah.sks;
    const bobot = nilaiHurufToBobot(nilai.nilaiHuruf);

    totalBobot += sks * bobot;
    totalSKS += sks;
  }

  if (totalSKS === 0) {
    return 0;
  }

  return totalBobot / totalSKS;
};

/**
 * Calculate IPK (Index Prestasi Kumulatif)
 * IPK = Sum(All SKS * Bobot) / Sum(All SKS)
 */
export const hitungIPK = (allNilaiList: NilaiData[]): number => {
  if (allNilaiList.length === 0) {
    return 0;
  }

  let totalBobot = 0;
  let totalSKS = 0;

  for (const nilai of allNilaiList) {
    // Skip if nilai huruf not yet set
    if (!nilai.nilaiHuruf) continue;

    const sks = nilai.kelasMK.mataKuliah.sks;
    const bobot = nilaiHurufToBobot(nilai.nilaiHuruf);

    totalBobot += sks * bobot;
    totalSKS += sks;
  }

  if (totalSKS === 0) {
    return 0;
  }

  return totalBobot / totalSKS;
};

/**
 * Get total SKS from nilai list
 */
export const getTotalSKS = (nilaiList: NilaiData[]): number => {
  return nilaiList.reduce((sum, nilai) => {
    return sum + nilai.kelasMK.mataKuliah.sks;
  }, 0);
};

/**
 * Get total SKS lulus (nilai passing)
 */
export const getTotalSKSLulus = (nilaiList: NilaiData[]): number => {
  const passingGrades = ['A', 'AB', 'B', 'BC', 'C'];
  
  return nilaiList.reduce((sum, nilai) => {
    if (nilai.nilaiHuruf && passingGrades.includes(nilai.nilaiHuruf)) {
      return sum + nilai.kelasMK.mataKuliah.sks;
    }
    return sum;
  }, 0);
};

/**
 * Calculate SKS semester
 */
export const getSKSSemester = (nilaiList: NilaiData[]): number => {
  return getTotalSKS(nilaiList);
};

/**
 * Get IPK category/predicate
 */
export const getPredikatIPK = (ipk: number): string => {
  if (ipk >= 3.51) return 'Cum Laude';
  if (ipk >= 3.00) return 'Sangat Memuaskan';
  if (ipk >= 2.76) return 'Memuaskan';
  if (ipk >= 2.00) return 'Cukup';
  return 'Kurang';
};

/**
 * Check if student can graduate (based on IPK)
 */
export const canGraduate = (ipk: number, totalSKS: number, requiredSKS: number = 144): boolean => {
  return ipk >= 2.0 && totalSKS >= requiredSKS;
};

/**
 * Calculate semester summary
 */
export const getSemesterSummary = (nilaiList: NilaiData[]) => {
  const totalSKS = getTotalSKS(nilaiList);
  const sksLulus = getTotalSKSLulus(nilaiList);
  const ips = hitungIPS(nilaiList);

  // Count grades
  const gradeCount: Record<string, number> = {
    A: 0,
    AB: 0,
    B: 0,
    BC: 0,
    C: 0,
    CD: 0,
    D: 0,
    E: 0,
  };

  nilaiList.forEach((nilai) => {
    if (nilai.nilaiHuruf && gradeCount[nilai.nilaiHuruf] !== undefined) {
      gradeCount[nilai.nilaiHuruf]++;
    }
  });

  return {
    totalSKS,
    sksLulus,
    ips,
    gradeCount,
    totalMataKuliah: nilaiList.length,
  };
};

/**
 * Calculate cumulative summary
 */
export const getCumulativeSummary = (allNilaiList: NilaiData[]) => {
  const totalSKS = getTotalSKS(allNilaiList);
  const sksLulus = getTotalSKSLulus(allNilaiList);
  const ipk = hitungIPK(allNilaiList);
  const predikat = getPredikatIPK(ipk);

  return {
    totalSKS,
    sksLulus,
    ipk,
    predikat,
    totalMataKuliah: allNilaiList.length,
  };
};

/**
 * Validate IPS/IPK value
 */
export const isValidIPK = (ipk: number): boolean => {
  return ipk >= 0 && ipk <= 4.0;
};
