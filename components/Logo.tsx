import React from 'react';
import { TRIN_LOGO_BASE64 } from '../constants';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <img 
      src={TRIN_LOGO_BASE64}
      alt="Trin Logo"
      className={className}
    />
  );
};