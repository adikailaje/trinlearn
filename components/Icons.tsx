

import React from 'react';

interface IconProps {
  className?: string;
  title?: string; 
  onClick?: (event: React.MouseEvent<SVGElement>) => void; // Added onClick
}

export const CameraIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
  </svg>
);

export const StopIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9.563C9 9.252 9.252 9 9.563 9h4.874c.311 0 .563.252.563.563v4.874c0 .311-.252.563-.563.563H9.564A.562.562 0 0 1 9 14.437V9.564Z" />
  </svg>
);

export const ExclamationTriangleIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
  </svg>
);

export const InformationCircleIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
  </svg>
);

export const UserCircleIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

export const LogoutIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
  </svg>
);

export const BrainIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
      {title && <title>{title}</title>}
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" /> {/* Simplified representation of neural connections or AI */}
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5V12A9.75 9.75 0 0 1 12 2.25v1.5A8.25 8.25 0 0 0 3.75 12v1.5m18 0V12A9.75 9.75 0 0 0 12 2.25v1.5A8.25 8.25 0 0 1 20.25 12v1.5m-8.25 4.5V18A8.25 8.25 0 0 1 3.75 9.75v-1.5A9.75 9.75 0 0 0 12 18v-1.5m0-15V2.25A9.75 9.75 0 0 1 21.75 12v-1.5A8.25 8.25 0 0 0 12 3.75V3Z" />
    </svg>
);

export const EyeIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
      {title && <title>{title}</title>}
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
);
export const EyeSlashIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243l-4.243-4.243" />
  </svg>
);

export const SparklesIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
      {title && <title>{title}</title>}
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L1.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.25 12L17 13.75M17 13.75L15.75 12M17 13.75L18.25 15M15.75 12L17 10.25m-7.5 0L9.75 7.5M9.75 7.5L12 5.25M9.75 7.5L7.5 5.25M12 5.25L14.25 7.5" />
    </svg>
);
export const ExclamationCircleIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
      {title && <title>{title}</title>}
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
    </svg>
);

export const DocumentTextIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
      {title && <title>{title}</title>}
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
);

export const BookmarkIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
      {title && <title>{title}</title>}
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
    </svg>
);

export const MagnifyingGlassIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
      {title && <title>{title}</title>}
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
);

export const ChevronLeftIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
  </svg>
);
export const ChevronRightIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
  </svg>
);
export const ChevronDownIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
);

export const TrashIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c1.153 0 2.24.032 3.22.096M15 3.75V2.25A2.25 2.25 0 0 0 12.75 0h-1.5A2.25 2.25 0 0 0 9 2.25v1.5" />
  </svg>
);

export const PencilIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
  </svg>
);

export const CheckCircleIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

export const PlusCircleIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

export const WrenchScrewdriverIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.83-5.83M11.42 15.17l2.496-3.03c.52.176 1.063.329 1.618.44-.362.783-.798 1.513-1.286 2.158a9 9 0 0 0-1.822 2.443M7.5 12h9M7.5 12l2.25-2.25M7.5 12l-2.25 2.25m2.25-2.25L5.25 9.75M12 7.5A2.25 2.25 0 0 0 9.75 5.25a2.25 2.25 0 0 0-4.5 0A2.25 2.25 0 0 0 3 7.5a2.25 2.25 0 0 0 2.25 2.25m13.5-3A2.25 2.25 0 0 0 18.75 5.25a2.25 2.25 0 0 0-4.5 0A2.25 2.25 0 0 0 12 7.5a2.25 2.25 0 0 0 2.25 2.25" />
  </svg>
);

export const CalendarDaysIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-3.75h.008v.008H12v-.008Z" />
  </svg>
);

export const CloudArrowUpIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
  </svg>
);

export const ArrowDownTrayIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);


export const ArrowPathIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

// --- Bottom Nav Bar Icons ---
export const HomeIconFilled: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={`w-6 h-6 ${className}`} onClick={onClick} fill="currentColor">
    {title && <title>{title}</title>}
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
  </svg>
);

export const DocumentListIconFilled: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={`w-6 h-6 ${className}`} onClick={onClick} fill="currentColor">
    {title && <title>{title}</title>}
    <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm4 12h-8v-2h8v2zm2-4h-10v-2h10v2z"/>
  </svg>
);

export const CameraIconFilled: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={`w-6 h-6 ${className}`} onClick={onClick} fill="currentColor">
    {title && <title>{title}</title>}
    <path d="M4 5h3l2-2h6l2 2h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm8 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0-2a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
  </svg>
);

export const ShieldIconFilled: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={`w-6 h-6 ${className}`} onClick={onClick} fill="currentColor">
    {title && <title>{title}</title>}
    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
  </svg>
);

// This is the Outline ShieldCheckIcon, used in Dashboard and Safety page headers/alerts
export const ShieldCheckIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
    {title && <title>{title}</title>}
    {/* This combination renders a checkmark circle AND a shield outline separately, overlapping.
        A "true" ShieldCheckIcon would typically have the check inside the shield path.
        However, this is what was provided and presumably intended for the non-nav-bar contexts.
    */}
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25c.966 0 1.897.193 2.77.544l.23.09.263.105A13.44 13.44 0 0 1 21 12a13.44 13.44 0 0 1-5.737 9.21l-.263.106-.23.09A13.555 13.555 0 0 1 12 21.75c-.966 0-1.897-.193-2.77-.544l-.23-.09-.263-.105A13.44 13.44 0 0 1 3 12a13.44 13.44 0 0 1 5.737-9.21l.263-.106.23-.09A13.555 13.555 0 0 1 12 2.25Z" />
  </svg>
);

// --- Work Order Detail Icons ---
export const PlayIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
  </svg>
);

export const PauseIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
  </svg>
);

export const ListBulletIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h7.5M8.25 12h7.5m-7.5 5.25h7.5M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
  </svg>
);
export const LockClosedIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
  </svg>
);

export const MapPinIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
      {title && <title>{title}</title>}
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
);

export const TagIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
      {title && <title>{title}</title>}
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
    </svg>
);

// --- Asset Details Icons ---
export const BookOpenIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
  </svg>
);

export const QrCodeIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.5A.75.75 0 0 1 4.5 3.75h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75v-4.5Zm0 9A.75.75 0 0 1 4.5 12.75h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75v-4.5Zm9-9A.75.75 0 0 1 13.5 3.75h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75v-4.5ZM13.5 12.75h1.5V15h-1.5v2.25h-1.5V15h-1.5v1.5H9v-1.5H7.5V18H9v1.5h1.5V18h1.5v-1.5H15V18h1.5v-1.5H18v-2.25h-1.5v-1.5H15v-1.5h1.5V9h-1.5V7.5H18V6H6v1.5h1.5V9H6v1.5h1.5V12H6v1.5h1.5v1.5H9V12h1.5v2.25H12v-1.5h1.5v-1.5Z" />
  </svg>
);

export const ToolsIcon: React.FC<IconProps> = ({ className, title, onClick }) => ( // Simple tools icon
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
  </svg>
);

export const ClipboardDocumentCheckIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75M9.75 17.25h6.75M9.75 17.25H4.5m6 0v-3.75m3.75l-3.75-3.75m3.75 3.75L11.25 15m1.5-7.5v-3a1.125 1.125 0 0 0-1.125-1.125H7.5A1.125 1.125 0 0 0 6.375 4.5v3H4.5m11.25 0h-6.75" />
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
 </svg>
);

// --- Parts Tab Icons ---
export const ArchiveBoxArrowDownIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
    {title && <title>{title}</title>}
    {/* Corrected Path for ArchiveBoxArrowDownIcon */}
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25v10.5A2.25 2.25 0 0 1 18.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25m0 0V5.25A2.25 2.25 0 0 1 5.25 3h13.5A2.25 2.25 0 0 1 21 5.25v3M12 18v-6M12 12l3-3m-3 3L9 9m3 3h0" />
    {/* The above path might be slightly different based on exact Heroicons version, this is a common representation.
        The key part is that it's a box with an arrow pointing down *into* it or onto it.
        The user's orphaned path was:
        M21 8.25v10.5A2.25 2.25 0 0 1 18.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25M21 8.25V5.25A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25v3M12 18L12 12m0 0 2.25 2.25M12 12l-2.25-2.25
        This also represents an archive box with a down arrow. Let's use the user's provided one for consistency with what they might expect visually.
    */}
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25v10.5A2.25 2.25 0 0 1 18.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25M21 8.25V5.25A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25v3M12 18L12 12m0 0 2.25 2.25M12 12l-2.25-2.25" />
  </svg>
);

export const PaperAirplaneIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
  </svg>
);

// --- Chat Icon ---
export const ChatBubbleFilledIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={`w-6 h-6 ${className}`} onClick={onClick} fill="currentColor">
    {title && <title>{title}</title>}
    <path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z"/>
  </svg>
);

export const ChatBubbleLeftIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.5A2.25 2.25 0 0 1 5.25 21h8.25c1.242 0 2.25-1.008 2.25-2.25v-8.25a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 8.25v8.25Z" />
  </svg>
);

// Report Issue Photo Upload Icon
export const UploadIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </svg>
);

// Inspection Checklist Icons
export const CheckIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);
export const XMarkIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
export const ListChecksIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375m9.375 9.375h.375M10.125 2.25V6.75m0 0a2.25 2.25 0 0 1 2.25 2.25m0 0H21m-8.625-2.25h.375m-.375 0a2.25 2.25 0 0 0-2.25 2.25M15 21h3.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

// --- Floor Plan Icons ---
export const MapIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m0 0v2.25m0-2.25h1.5m1.5 0V6.75m0 0v2.25m0 2.25h1.5m1.5 0V6.75m0 0v2.25m0 2.25h1.5M6.75 15h10.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);
export const LayersIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h10.5v10.5h-10.5z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75 2.25 6.75m0 0 9.75 6L21.75 6.75m-19.5 0L12 17.25l9.75-10.5" />
  </svg>
);
export const ArrowLeftCircleIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 9l-3 3m0 0l3 3m-3-3h7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);
export const ArrowRightCircleIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 15l3-3m0 0l-3-3m3 3h-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);
export const PencilSquareIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
  </svg>
);
export const HandRaisedIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
        {title && <title>{title}</title>}
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M10.5 20.25H12M4.166 13.834L5.757 12.243M4.5 12H2.25m3.834-5.834L5.757 7.757M7.757 5.757L6.166 4.166"/>
    </svg>
);

export const ArrowsPointingOutIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
        {title && <title>{title}</title>}
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
    </svg>
);


// --- AR Overlay Icons ---
export const CogIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0 0 15 0m-15 0a7.5 7.5 0 1 1 15 0m-15 0H3m18 0h-1.5m-15.065-7.025L3 4.5m1.5.975L4.5 3M5.975 19.5l.975-1.5m0 0L5.975 18M19.5 5.975l-1.5-.975M18 3l.975 1.5m-1.95.025L18 4.5m1.5.975L19.5 3m-1.5 15.025L18 19.5m.975-1.5L19.5 18m-1.5-.025L18.025 18M12 9.75a2.25 2.25 0 0 1 2.25 2.25c0 1.021-.714 2.34-2.25 2.34S9.75 13.021 9.75 12a2.25 2.25 0 0 1 2.25-2.25Z" />
  </svg>
);
export const WrenchIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.83-5.83M11.42 15.17A2.25 2.25 0 0 1 9.17 17.25a2.25 2.25 0 0 1-4.95-4.95L12.75 3.75a2.25 2.25 0 0 1 4.95 4.95l-2.828 2.828" />
  </svg>
);

// --- Voice Command Icons ---
export const MicrophoneIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5h0v-6.375m0 6.375a6 6 0 0 1-6-6v-1.5m6 7.5v-6.375m0 0A2.25 2.25 0 0 1 14.25 12V7.5A2.25 2.25 0 0 0 12 5.25A2.25 2.25 0 0 0 9.75 7.5v4.5A2.25 2.25 0 0 0 12 14.25m0 0A2.25 2.25 0 0 1 14.25 12V7.5a2.25 2.25 0 0 0-4.5 0v4.5A2.25 2.25 0 0 0 12 14.25Z" />
  </svg>
);
export const MicrophoneSlashIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.72-4.72a.75.75 0 0 1 1.28.531V4.5A4.5 4.5 0 0 1 12 9Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5a5.23 5.23 0 0 0 .098.914l1.838-1.837L4.5 9.75A2.25 2.25 0 0 1 6.75 7.5h1.5a2.25 2.25 0 0 1 2.25 2.25v4.5A2.25 2.25 0 0 1 8.25 16.5H6.75a2.25 2.25 0 0 1-2.25-2.25V10.5Z" />
  </svg>
);

export const SpeakerWaveIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
  </svg>
);


// --- Dashboard Icons ---
export const UserGroupIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a4.5 4.5 0 00-1.172-3.22c-3.293-3.293-2.386-7.44-7.73-7.44s-4.437 4.146-7.73 7.44A4.5 4.5 0 006 18.719m0 0A2.25 2.25 0 018.25 21h7.5A2.25 2.25 0 0118 18.72m-12 0v-1.038c0-1.034.836-1.872 1.872-1.872h10.256c1.036 0 1.872.838 1.872 1.872v1.038M12 12.75a3 3 0 100-6 3 3 0 000 6z" />
  </svg>
);

export const ChartBarIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
  </svg>
);

// New Filled ChartBarIcon for Bottom Nav
export const ChartBarIconFilled: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
    {title && <title>{title}</title>}
    <path d="M2.25 13.5a.75.75 0 0 1 .75-.75H6a.75.75 0 0 1 .75.75v6a.75.75 0 0 1-.75.75H3a.75.75 0 0 1-.75-.75v-6Zm7.5-3.75A.75.75 0 0 1 10.5 9H13.5a.75.75 0 0 1 .75.75v9.75a.75.75 0 0 1-.75.75H10.5a.75.75 0 0 1-.75-.75V9.75Zm7.5 5.25a.75.75 0 0 1 .75-.75H21a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-.75.75H18a.75.75 0 0 1-.75-.75v-4.5Z" />
  </svg>
);

// Outline icons that might have been replaced for nav bar, but could be used elsewhere.
// Kept for completeness if they are indeed used. The user's file contains these at the end.
export const BriefcaseIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.073c0 .621-.504 1.125-1.125 1.125H4.875A1.125 1.125 0 0 1 3.75 18.223V14.15M21 9.75v4.073c0 .621-.504 1.125-1.125 1.125h-1.5a1.125 1.125 0 0 1-1.125-1.125V9.75M5.25 9.75v4.073c0 .621.504 1.125 1.125 1.125h1.5c.621 0 1.125-.504 1.125-1.125V9.75m0-4.5h10.5a2.25 2.25 0 0 0-2.25-2.25H7.5a2.25 2.25 0 0 0-2.25 2.25H21V9.75M3 9.75H2.25A2.25 2.25 0 0 0 0 12v6.75c0 1.24 1.01 2.25 2.25 2.25h19.5A2.25 2.25 0 0 0 24 18.75V12a2.25 2.25 0 0 0-2.25-2.25H21M16.5 7.5V5.25a2.25 2.25 0 0 0-2.25-2.25H9.75A2.25 2.25 0 0 0 7.5 5.25V7.5" />
  </svg>
);

export const MegaphoneIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.931l.813.342a1.125 1.125 0 0 1 .447 1.443l-.495 1.093a1.125 1.125 0 0 1-1.443.495l-.813-.342a1.125 1.125 0 0 0-.931.78l-.894.149c-.542.09-.94.56-.94 1.11h-.093c-.55 0-.998-.42-.94-1.11l.149-.894a1.125 1.125 0 0 0-.931-.78l-.813.342a1.125 1.125 0 0 1-1.443-.495l-.495-1.093a1.125 1.125 0 0 1 .447-1.443l.813-.342a1.125 1.125 0 0 0 .78-.931l.894-.149Zm0 0A1.125 1.125 0 0 1 11.25 2.25h1.5A1.125 1.125 0 0 1 13.875 3.375l.375.625a1.125 1.125 0 0 1 0 1.5l-.375.625a1.125 1.125 0 0 1-1.125-.125h-1.5a1.125 1.125 0 0 1-1.125-.125l-.375-.625a1.125 1.125 0 0 1 0-1.5l.375-.625ZM12 10.5h.008v.008H12V10.5Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.562 15.125L12 16.5l1.438-1.375M12 16.5v4.5c0 .621.504 1.125 1.125 1.125h1.5c1.125 0 2.063-.786 2.25-1.875a11.198 11.198 0 0 0 .41-4.533c0-2.945-1.16-5.662-3.099-7.691C13.374 5.22 10.72 4.5 7.875 4.5c-2.846 0-5.5.72-7.734 2.159C1.16 7.458 0 9.533 0 11.75c0 1.898.624 3.686 1.736 5.039a11.184 11.184 0 0 1 2.861 3.339c.133.25.318.473.531.666C5.91 21.73 7.12 22.5 8.625 22.5h1.5c.621 0 1.125-.504 1.125-1.125v-4.5Z" />
  </svg>
);

export const ChatBubbleOvalLeftEllipsisIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-3.861 8.25-8.625 8.25S3.75 16.556 3.75 12 7.611 3.75 12.375 3.75 21 7.444 21 12Z" />
  </svg>
);

// --- User Hierarchy Icon ---
export const SitemapIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21v-4.5a3.75 3.75 0 0 1 3.75-3.75h1.5m-1.5 0h-1.5m1.5 0h1.5m-1.5 0h1.5M9 6.75v-1.5a3.75 3.75 0 0 1 3.75-3.75h1.5a3.75 3.75 0 0 1 3.75 3.75v1.5m-6 0h6m-6 0h-1.5m0 0h-1.5m-1.5 0H3.75m15 10.5v-4.5a3.75 3.75 0 0 0-3.75-3.75h-1.5m1.5 0h1.5m-1.5 0h-1.5m1.5 0H9" />
  </svg>
);

export const UserPlusIcon: React.FC<IconProps> = ({ className, title, onClick }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`} onClick={onClick}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
  </svg>
);
