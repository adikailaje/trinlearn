
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { safetyService } from '../services/safetyService';
import { SafetyPermit, SafetyProcedureDocument } from '../types';
import { Loader } from '../components/Loader';
import { ShieldCheckIcon, MagnifyingGlassIcon, BookOpenIcon, ExclamationTriangleIcon, ClipboardDocumentCheckIcon } from '../components/Icons';
import PermitListItem from '../components/PermitListItem';
import SafetyProcedureListItem from '../components/SafetyProcedureListItem';
import SafetyProcedureDetailModal from '../components/SafetyProcedureDetailModal';

interface SafetyPageProps {
  onNavigateToPermitDetail: (permitId: string) => void;
}

const SafetyPage: React.FC<SafetyPageProps> = ({ onNavigateToPermitDetail }) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  
  const [activePermits, setActivePermits] = useState<SafetyPermit[]>([]);
  const [pastPermits, setPastPermits] = useState<SafetyPermit[]>([]);
  
  const [allProcedures, setAllProcedures] = useState<SafetyProcedureDocument[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isLoadingPermits, setIsLoadingPermits] = useState(true);
  const [isLoadingPastPermits, setIsLoadingPastPermits] = useState(true);
  const [isLoadingProcedures, setIsLoadingProcedures] = useState(true);

  const [errorPermits, setErrorPermits] = useState<string | null>(null);
  const [errorPastPermits, setErrorPastPermits] = useState<string | null>(null);
  const [errorProcedures, setErrorProcedures] = useState<string | null>(null);

  const [selectedProcedure, setSelectedProcedure] = useState<SafetyProcedureDocument | null>(null);
  const [isProcedureModalOpen, setIsProcedureModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!currentUser) {
      setIsLoadingPermits(false);
      setErrorPermits("User not logged in.");
      setIsLoadingPastPermits(false);
      setErrorPastPermits("User not logged in.");
      setIsLoadingProcedures(false);
      setErrorProcedures("User not logged in.");
      return;
    }
    
    setIsLoadingPermits(true);
    setErrorPermits(null);
    safetyService.getActivePermitsForUser(currentUser.id)
      .then(setActivePermits)
      .catch(e => setErrorPermits(e.message || "Could not load active permits."))
      .finally(() => setIsLoadingPermits(false));

    setIsLoadingPastPermits(true);
    setErrorPastPermits(null);
    safetyService.getPastPermitsForUser(currentUser.id)
      .then(setPastPermits)
      .catch(e => setErrorPastPermits(e.message || "Could not load permit history."))
      .finally(() => setIsLoadingPastPermits(false));

    setIsLoadingProcedures(true);
    setErrorProcedures(null);
    safetyService.getAllSafetyProcedures()
      .then(setAllProcedures)
      .catch(e => setErrorProcedures(e.message || "Could not load safety procedures."))
      .finally(() => setIsLoadingProcedures(false));
  }, [currentUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredProcedures = useMemo(() => {
    return safetyService.searchSafetyProcedures(searchTerm, allProcedures);
  }, [searchTerm, allProcedures]);

  const handleProcedureClick = (procedure: SafetyProcedureDocument) => {
    if (procedure.contentUrl) {
      window.open(procedure.contentUrl, '_blank', 'noopener,noreferrer');
    } else if (procedure.content || procedure.summary) {
      setSelectedProcedure(procedure);
      setIsProcedureModalOpen(true);
    } else {
      alert("No viewable content for this procedure.");
    }
  };


  return (
    <div className="flex-grow p-4 md:p-6 space-y-6 bg-[#0D0D0D] text-neutral-200 pb-24">
      
      {/* Permits to Work Section with Tabs */}
      <section className="bg-[#1A1A1A] p-4 sm:p-6 rounded-lg shadow-xl border border-[#2C2C2C]">
        <div className="flex items-center text-sky-400 mb-4">
          <ClipboardDocumentCheckIcon className="w-7 h-7 mr-3" />
          <h2 className="text-xl font-semibold">Permits to Work</h2>
        </div>
        
        <div className="border-b border-neutral-700 mb-4">
          <nav className="-mb-px flex space-x-4" aria-label="Permit Tabs">
            <button
              onClick={() => setActiveTab('active')}
              className={`whitespace-nowrap flex items-center py-3 px-3 border-b-2 font-medium text-sm transition-colors ${activeTab === 'active' ? 'border-red-500 text-red-400' : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:border-neutral-500'}`}
            >
              Active Permits ({isLoadingPermits ? '...' : activePermits.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`whitespace-nowrap flex items-center py-3 px-3 border-b-2 font-medium text-sm transition-colors ${activeTab === 'history' ? 'border-red-500 text-red-400' : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:border-neutral-500'}`}
            >
              History ({isLoadingPastPermits ? '...' : pastPermits.length})
            </button>
          </nav>
        </div>

        <div className="min-h-[150px]">
          {activeTab === 'active' && (
            <>
              {isLoadingPermits && (
                <div className="flex justify-center items-center py-6">
                  <Loader size="md" />
                  <p className="ml-3 text-neutral-400">Loading active permits...</p>
                </div>
              )}
              {errorPermits && <div className="text-center py-6 text-red-400"><ExclamationTriangleIcon className="w-8 h-8 mx-auto mb-2" /><p>{errorPermits}</p></div>}
              {!isLoadingPermits && !errorPermits && activePermits.length === 0 && (
                <p className="text-neutral-500 italic text-center py-4">You have no active safety permits assigned.</p>
              )}
              {!isLoadingPermits && !errorPermits && activePermits.length > 0 && (
                <div className="space-y-3">
                  {activePermits.map(permit => (
                    <PermitListItem key={permit.id} permit={permit} onClick={() => onNavigateToPermitDetail(permit.id)} />
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'history' && (
            <>
              {isLoadingPastPermits && (
                <div className="flex justify-center items-center py-6">
                  <Loader size="md" />
                  <p className="ml-3 text-neutral-400">Loading permit history...</p>
                </div>
              )}
              {errorPastPermits && <div className="text-center py-6 text-red-400"><ExclamationTriangleIcon className="w-8 h-8 mx-auto mb-2" /><p>{errorPastPermits}</p></div>}
              {!isLoadingPastPermits && !errorPastPermits && pastPermits.length === 0 && (
                <p className="text-neutral-500 italic text-center py-4">No historical permits found.</p>
              )}
              {!isLoadingPastPermits && !errorPastPermits && pastPermits.length > 0 && (
                <div className="space-y-3">
                  {pastPermits.map(permit => (
                    <PermitListItem key={permit.id} permit={permit} onClick={() => onNavigateToPermitDetail(permit.id)} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Safety Procedure Library Section */}
      <section className="bg-[#1A1A1A] p-4 sm:p-6 rounded-lg shadow-xl border border-[#2C2C2C]">
        <div className="flex items-center text-teal-400 mb-4">
          <BookOpenIcon className="w-7 h-7 mr-3" />
          <h2 className="text-xl font-semibold">Safety Procedure Library</h2>
        </div>
        <div className="mb-4 relative">
          <input
            type="text"
            placeholder="Search procedures (e.g., LOTO, electrical, pump)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 rounded-md bg-[#222222] border border-[#333333] text-neutral-100 placeholder-neutral-500 focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none transition-colors"
          />
          <MagnifyingGlassIcon className="w-5 h-5 text-neutral-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
        </div>

        {isLoadingProcedures && (
          <div className="flex justify-center items-center py-6">
            <Loader size="md" />
            <p className="ml-3 text-neutral-400">Loading procedures...</p>
          </div>
        )}
        {errorProcedures && (
          <div className="text-center py-6 text-red-400">
            <ExclamationTriangleIcon className="w-8 h-8 mx-auto mb-2" />
            <p>{errorProcedures}</p>
          </div>
        )}
        {!isLoadingProcedures && !errorProcedures && filteredProcedures.length === 0 && (
          <p className="text-neutral-500 italic text-center py-4">
            {searchTerm ? "No procedures match your search." : "No safety procedures found."}
          </p>
        )}
        {!isLoadingProcedures && !errorProcedures && filteredProcedures.length > 0 && (
          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
            {filteredProcedures.map(procedure => (
              <SafetyProcedureListItem key={procedure.id} procedure={procedure} onClick={() => handleProcedureClick(procedure)} />
            ))}
          </div>
        )}
      </section>
      
      {selectedProcedure && (
        <SafetyProcedureDetailModal
          isOpen={isProcedureModalOpen}
          onClose={() => setIsProcedureModalOpen(false)}
          procedure={selectedProcedure}
        />
      )}
    </div>
  );
};

export default SafetyPage;
