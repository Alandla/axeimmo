/**
 * Formate un nombre d'octets en une chaîne lisible (Ko, Mo, Go, etc.)
 * @param bytes - Nombre d'octets à formater
 * @param decimals - Nombre de décimales à afficher (par défaut 2)
 * @returns Chaîne formatée avec l'unité appropriée
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 octets';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['octets', 'Ko', 'Mo', 'Go', 'To', 'Po', 'Eo', 'Zo', 'Yo'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
} 