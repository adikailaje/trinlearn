

import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { ReportIssuePageProps, WorkRequest, WorkRequestStatus, WorkItemPriority } from '../types';
import { UploadIcon, CameraIcon } from '../components/Icons'; 
import { Loader } from '../components/Loader';
import { useAuth } from '../hooks/useAuth';
import { rememberedMachinesService } from '../services/rememberedMachinesService';

type IssueType = 'Equipment Malfunction' | 'Safety Concern' | 'Operational Issue' | 'Other';
type SeverityType = 'Low' | 'Medium' | 'High' | 'Critical';

interface ReportFormData {
  title: string;
  type: IssueType | '';
  assetId: string;
  assetName: string;
  location: string;
  severity: SeverityType | '';
  description: string;
  photo?: File | null;
  photoPreview?: string | null;
}

const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
};

const ReportIssuePage: React.FC<ReportIssuePageProps> = ({ prefillData }) => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState<ReportFormData>({
    title: '',
    type: 'Equipment Malfunction',
    assetId: prefillData?.assetId || '',
    assetName: prefillData?.assetName || '',
    location: '',
    severity: 'Medium',
    description: prefillData?.issueDescription || '',
    photo: null,
    photoPreview: null,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      assetId: prefillData?.assetId || prev.assetId,
      assetName: prefillData?.assetName || prev.assetName,
      description: prefillData?.issueDescription || prev.description,
    }));
  }, [prefillData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null); 
    setSuccessMessage(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError("Photo size should not exceed 5MB.");
        setFormData(prev => ({ ...prev, photo: null, photoPreview: null }));
        if (fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
        return;
      }
      fileToDataUrl(file).then(dataUrl => {
         setFormData(prev => ({ ...prev, photo: file, photoPreview: dataUrl }));
      });
    } else {
      setFormData(prev => ({ ...prev, photo: null, photoPreview: null }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!currentUser) {
        setError("You must be logged in to report an issue.");
        return;
    }
    if (!prefillData?.make || !prefillData?.modelName) {
        setError("Cannot report an issue without a specific machine selected. Please navigate from a machine's detail page.");
        return;
    }
    if (!formData.title.trim() || !formData.type || !formData.severity || !formData.description.trim()) {
      setError("Please fill in all required fields: Title, Type, Severity, and Description.");
      return;
    }

    setIsSubmitting(true);
    
    try {
        const newWorkRequest: WorkRequest = {
            id: `wr-${Date.now()}`,
            title: formData.title.trim(),
            description: formData.description.trim(),
            status: WorkRequestStatus.Open,
            priority: formData.severity as WorkItemPriority, // Assuming SeverityType matches WorkItemPriority
            createdDate: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            createdByUserId: currentUser.id,
            photoDataUrl: formData.photoPreview || undefined,
            // Add self-contained context for dashboard feeds
            reportedByUsername: currentUser.username,
            machine: {
              make: prefillData.make,
              modelName: prefillData.modelName,
              machineNumber: prefillData.assetId || null
            }
        };

        await rememberedMachinesService.addWorkRequest(currentUser.id, prefillData.make, prefillData.modelName, newWorkRequest);

        // Reset form on success
        setFormData({
          title: '', type: 'Equipment Malfunction', assetId: '', assetName: '', location: '', severity: 'Medium', description: '',
          photo: null, photoPreview: null
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
        
        setSuccessMessage("Issue reported successfully! It has been added to the machine's work requests.");

    } catch(err: any) {
        setError(err.message || "An unknown error occurred while submitting the report.");
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const inputBaseClasses = "block w-full px-3 py-2 rounded-md bg-[#222222] border border-[#333333] text-neutral-100 placeholder-neutral-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors";
  const labelBaseClasses = "block text-sm font-medium text-neutral-300 mb-1";

  return (
    <div className="flex-grow p-4 md:p-6 space-y-6 bg-[#0D0D0D] text-neutral-200 pb-24">
      {/* Title is now handled by PageHeader via MainWrapper */}
      
      <form onSubmit={handleSubmit} className="bg-[#1A1A1A] p-4 sm:p-6 rounded-lg shadow-xl border border-[#2C2C2C] space-y-5">
        <div>
          <label htmlFor="title" className={`${labelBaseClasses}`}>Issue Title <span className="text-red-400">*</span></label>
          <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} className={inputBaseClasses} required />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="type" className={`${labelBaseClasses}`}>Issue Type <span className="text-red-400">*</span></label>
            <select name="type" id="type" value={formData.type} onChange={handleChange} className={inputBaseClasses} required>
              <option value="" disabled>Select type...</option>
              <option value="Equipment Malfunction">Equipment Malfunction</option>
              <option value="Safety Concern">Safety Concern</option>
              <option value="Operational Issue">Operational Issue</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label htmlFor="severity" className={`${labelBaseClasses}`}>Severity <span className="text-red-400">*</span></label>
            <select name="severity" id="severity" value={formData.severity} onChange={handleChange} className={inputBaseClasses} required>
              <option value="" disabled>Select severity...</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="assetName" className={labelBaseClasses}>Asset Name</label>
            <input type="text" name="assetName" id="assetName" value={formData.assetName} disabled className={`${inputBaseClasses} disabled:opacity-60`}/>
          </div>
          <div>
            <label htmlFor="location" className={labelBaseClasses}>Location (Optional)</label>
            <input type="text" name="location" id="location" value={formData.location} onChange={handleChange} className={inputBaseClasses} placeholder="e.g., Sector B, Line 3"/>
          </div>
        </div>
        
        <div>
          <label htmlFor="description" className={`${labelBaseClasses}`}>Description <span className="text-red-400">*</span></label>
          <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={5} className={inputBaseClasses} required placeholder="Provide a detailed description of the issue..."/>
        </div>

        <div>
          <label htmlFor="photo" className={labelBaseClasses}>Attach Photo (Optional, max 5MB)</label>
          <input 
            type="file" 
            name="photo" 
            id="photo" 
            ref={fileInputRef}
            onChange={handleFileChange} 
            accept="image/png, image/jpeg, image/webp"
            className={`${inputBaseClasses} file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-red-500 file:text-white hover:file:bg-red-600`}
          />
          {formData.photoPreview && (
            <div className="mt-3 p-2 border border-neutral-600 rounded-md inline-block bg-[#252525]">
              <img src={formData.photoPreview} alt="Photo preview" className="max-h-40 max-w-full rounded"/>
            </div>
          )}
           {!formData.photoPreview && formData.photo === null && ( // Initial placeholder
              <div className="mt-2 text-sm text-neutral-500 flex items-center">
                <CameraIcon className="w-5 h-5 mr-2"/> No photo selected.
              </div>
           )}
        </div>

        {error && <p className="text-sm text-red-400 bg-red-700/20 border border-red-600/50 p-3 rounded-md">{error}</p>}
        {successMessage && <p className="text-sm text-green-400 bg-green-700/20 border border-green-600/50 p-3 rounded-md">{successMessage}</p>}

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full flex items-center justify-center px-6 py-3 rounded-md font-semibold text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-[#1A1A1A] transition-colors disabled:opacity-60"
        >
          {isSubmitting ? <Loader size="sm" className="mr-2"/> : <UploadIcon className="w-5 h-5 mr-2" />}
          {isSubmitting ? 'Submitting Report...' : 'Submit Report'}
        </button>
      </form>
    </div>
  );
};

export default ReportIssuePage;