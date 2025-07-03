
import React from 'react';
import { WorkRequest } from '../types';
import { ExclamationTriangleIcon } from './Icons';
import HazardReportCard from './HazardReportCard';

interface HazardReportFeedProps {
  title: string;
  reports: WorkRequest[];
  highlightOverdue?: boolean;
}

const HazardReportFeed: React.FC<HazardReportFeedProps> = ({ title, reports, highlightOverdue = false }) => {
  if (!reports || reports.length === 0) {
    return null; // Don't render the feed if there are no reports
  }

  return (
    <section className="bg-[#1A1A1A] p-4 sm:p-6 rounded-lg shadow-xl border border-[#2C2C2C]">
      <div className="flex items-center text-orange-400 mb-4">
        <ExclamationTriangleIcon className="w-7 h-7 mr-3" />
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {reports.map(report => (
          <HazardReportCard 
            key={report.id} 
            report={report} 
            highlightOverdue={highlightOverdue} 
          />
        ))}
      </div>
    </section>
  );
};

export default HazardReportFeed;
