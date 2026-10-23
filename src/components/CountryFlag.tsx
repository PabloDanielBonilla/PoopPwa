import React from 'react';
import { Globe } from 'lucide-react';
import { getCountryByCode } from '../utils/countries';

interface CountryFlagProps {
  countryCode?: string;
  className?: string;
}

export const CountryFlag: React.FC<CountryFlagProps> = ({ countryCode, className = "w-5 sm:w-6" }) => {
  if (!countryCode || countryCode === 'ALL') {
    return <Globe className={`inline-block ${className} text-neutral-400`} />;
  }
  
  const code = countryCode.toLowerCase();
  const countryName = getCountryByCode(countryCode)?.name || countryCode;
  
  return (
    <img 
      src={`https://flagcdn.com/w40/${code}.png`}
      srcSet={`https://flagcdn.com/w80/${code}.png 2x`}
      alt={countryName}
      className={`inline-block object-cover shadow-xs border border-black/10 rounded-[2px] ${className}`}
      style={{ display: 'inline-block' }}
    />
  );
};
