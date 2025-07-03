
import React from 'react';
import { QRCodeCanvas } from 'qrcode.react'; // Changed from 'QRCode'
import { QrCodeIcon } from './Icons'; 

interface QrDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrData: string; 
  title?: string;
}

export const QrDisplayModal: React.FC<QrDisplayModalProps> = ({
  isOpen,
  onClose,
  qrData,
  title = "Machine QR Code"
}) => {
  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm"
        onClick={onClose} 
        role="dialog"
        aria-modal="true"
        aria-labelledby="qrModalTitle"
    >
      <div 
        className="bg-[#1A1A1A] p-6 rounded-lg shadow-xl border border-[#2C2C2C] w-full max-w-sm text-center flex flex-col items-center"
        onClick={(e) => e.stopPropagation()} 
      >
        <div className="flex items-center text-neutral-100 mb-5">
            <QrCodeIcon className="w-6 h-6 mr-2 text-red-400" />
            <h3 id="qrModalTitle" className="text-xl font-semibold ">
            {title}
            </h3>
        </div>
        
        {qrData ? (
          <div className="bg-white p-3 sm:p-4 rounded-md inline-block shadow-md">
            <QRCodeCanvas 
              value={qrData}
              size={256} 
              level="H" 
              bgColor="#FFFFFF"
              fgColor="#0D0D0D"
            />
          </div>
        ) : (
          <p className="text-neutral-400 my-10">QR Data not available.</p>
        )}
        
        <p className="text-xs text-neutral-500 mt-4 px-2">
            Scan this QR code with another device using the Lens app to quickly load this machine's information.
        </p>

        <button
          onClick={onClose}
          className="mt-6 px-6 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-[#1A1A1A]"
        >
          Close
        </button>
      </div>
    </div>
  );
};
