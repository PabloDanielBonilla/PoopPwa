export interface CountryOption {
  code: string;
  name: string;
  nameEs: string;
  flag: string;
}

export const COUNTRIES: CountryOption[] = [
  { code: 'US', name: 'United States', nameEs: 'Estados Unidos', flag: '' },
  { code: 'CR', name: 'Costa Rica', nameEs: 'Costa Rica', flag: '' },
  { code: 'MX', name: 'Mexico', nameEs: 'México', flag: '' },
  { code: 'ES', name: 'Spain', nameEs: 'España', flag: '' },
  { code: 'CO', name: 'Colombia', nameEs: 'Colombia', flag: '' },
  { code: 'AR', name: 'Argentina', nameEs: 'Argentina', flag: '' },
  { code: 'CL', name: 'Chile', nameEs: 'Chile', flag: '' },
  { code: 'PE', name: 'Peru', nameEs: 'Perú', flag: '' },
  { code: 'EC', name: 'Ecuador', nameEs: 'Ecuador', flag: '' },
  { code: 'GT', name: 'Guatemala', nameEs: 'Guatemala', flag: '' },
  { code: 'PA', name: 'Panama', nameEs: 'Panamá', flag: '' },
  { code: 'DO', name: 'Dominican Republic', nameEs: 'República Dominicana', flag: '' },
  { code: 'UY', name: 'Uruguay', nameEs: 'Uruguay', flag: '' },
  { code: 'CA', name: 'Canada', nameEs: 'Canadá', flag: '' },
  { code: 'GB', name: 'United Kingdom', nameEs: 'Reino Unido', flag: '' },
  { code: 'DE', name: 'Germany', nameEs: 'Alemania', flag: '' },
  { code: 'FR', name: 'France', nameEs: 'Francia', flag: '' },
  { code: 'IT', name: 'Italy', nameEs: 'Italia', flag: '' },
  { code: 'BR', name: 'Brazil', nameEs: 'Brasil', flag: '' },
  { code: 'JP', name: 'Japan', nameEs: 'Japón', flag: '' },
  { code: 'AU', name: 'Australia', nameEs: 'Australia', flag: '' },
  { code: 'NL', name: 'Netherlands', nameEs: 'Países Bajos', flag: '' },
  { code: 'SE', name: 'Sweden', nameEs: 'Suecia', flag: '' },
  { code: 'CH', name: 'Switzerland', nameEs: 'Suiza', flag: '' },
  { code: 'NO', name: 'Norway', nameEs: 'Noruega', flag: '' },
  { code: 'PT', name: 'Portugal', nameEs: 'Portugal', flag: '' },
];

export function getCountryByCode(code: string): CountryOption | undefined {
  return COUNTRIES.find(c => c.code.toUpperCase() === code.toUpperCase());
}

export function getCountryName(code: string, lang: 'en' | 'es' = 'en'): string {
  const match = getCountryByCode(code);
  if (!match) return code;
  return lang === 'es' ? match.nameEs : match.name;
}

export function normalizeCountryCode(code?: string, countryName?: string): string {
  if (code && code.trim()) {
    const clean = code.trim().toUpperCase();
    if (COUNTRIES.some(c => c.code === clean)) return clean;
  }
  if (countryName && countryName.trim()) {
    const cleanName = countryName.trim().toLowerCase();
    const match = COUNTRIES.find(
      c => c.name.toLowerCase() === cleanName || c.nameEs.toLowerCase() === cleanName || c.code.toLowerCase() === cleanName
    );
    if (match) return match.code;
  }
  return 'US';
}
