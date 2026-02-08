/**
 * Nilai Conversion Utilities
 * Convert between nilai angka, huruf, and bobot
 */

/**
 * Convert nilai angka to huruf
 * Based on standard conversion table
 */

//
export const nilaiAngkaToHuruf = (angka: number): string => {
  if (angka >= 91 && angka <= 100) return 'A';
  if (angka >= 81 && angka < 91) return 'AB';
  if (angka >= 74 && angka < 81) return 'B';
  if (angka >= 68 && angka < 74) return 'BC';
  if (angka >= 60 && angka < 68) return 'C';
  if (angka >= 51 && angka < 60) return 'CD';
  if (angka >= 41 && angka < 51) return 'D';
  if (angka >= 0 && angka < 41) return 'E';
  
  throw new Error('Nilai angka tidak valid (harus 0-100)');
};

/**
 * Convert nilai huruf to bobot
 * Standard 4.0 scale
 */
export const nilaiHurufToBobot = (huruf: string): number => {
  const bobotMap: Record<string, number> = {
    'A': 4.0,
    'AB': 3.5,
    'B': 3.0,
    'BC': 2.5,
    'C': 2.0,
    'CD': 1.5,
    'D': 1.0,
    'E': 0.0,
  };

  const bobot = bobotMap[huruf.toUpperCase()];
  
  if (bobot === undefined) {
    throw new Error(`Nilai huruf tidak valid: ${huruf}`);
  }

  return bobot;
};

/**
 * Get keterangan/description for nilai huruf
 */
export const getKeterangan = (huruf: string): string => {
  const keteranganMap: Record<string, string> = {
    'A': 'Sangat Baik',
    'AB': 'Baik Sekali',
    'B': 'Baik',
    'BC': 'Cukup Baik',
    'C': 'Cukup',
    'CD': 'Kurang',
    'D': 'Sangat Kurang',
    'E': 'Gagal',
  };

  return keteranganMap[huruf.toUpperCase()] || 'Tidak Diketahui';
};

/**
 * Check if nilai is passing grade
 */
export const isPassing = (huruf: string): boolean => {
  const passingGrades = ['A', 'AB', 'B', 'BC', 'C'];
  return passingGrades.includes(huruf.toUpperCase());
};

/**
 * Validate nilai angka
 */
export const isValidNilaiAngka = (angka: number): boolean => {
  return angka >= 0 && angka <= 100;
};

/**
 * Validate nilai huruf
 */
export const isValidNilaiHuruf = (huruf: string): boolean => {
  const validGrades = ['A', 'AB', 'B', 'BC', 'C', 'CD', 'D', 'E'];
  return validGrades.includes(huruf.toUpperCase());
};

/**
 * Get grade level (for display)
 */
export const getGradeLevel = (huruf: string): 'excellent' | 'good' | 'average' | 'poor' | 'fail' => {
  const upperHuruf = huruf.toUpperCase();
  
  if (upperHuruf === 'A' || upperHuruf === 'AB') return 'excellent';
  if (upperHuruf === 'B' || upperHuruf === 'BC') return 'good';
  if (upperHuruf === 'C') return 'average';
  if (upperHuruf === 'CD' || upperHuruf === 'D') return 'poor';
  return 'fail';
};

/**
 * Format nilai for display
 */
export const formatNilai = (angka: number, huruf: string, bobot: number): string => {
  return `${angka} (${huruf}) - ${bobot.toFixed(2)}`;
};
