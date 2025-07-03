import React from 'react';
import { User } from '../types';
import { ArchiveBoxArrowDownIcon, UserCircleIcon, LogoutIcon, MapIcon, ChatBubbleLeftIcon, ChartBarIcon } from './Icons';
import { useTranslation } from '../hooks/useTranslation';

interface PageHeaderProps {
  title: string;
  onNavigateToProfile: () => void;
  onNavigateToSavedMachinesView: () => void;
  onNavigateToFloorPlan: () => void;
  onNavigateToChat: () => void;
  onNavigateToReportIssue: () => void;
  userRememberedMachinesCount: number;
  currentUser: User | null;
  logout: () => void;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  onNavigateToProfile,
  onNavigateToSavedMachinesView,
  onNavigateToFloorPlan,
  onNavigateToChat,
  onNavigateToReportIssue,
  userRememberedMachinesCount,
  currentUser,
  logout
}) => {
  const { t } = useTranslation();

  return (
    <header className="p-3 bg-[#0D0D0D] shadow-md border-b border-[#2C2C2C] sticky top-0 z-30 h-[65px] flex items-center"> {/* Fixed height */}
      <div className="container mx-auto flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-semibold text-neutral-100 tracking-tight truncate pr-2" title={title}>
          {title}
        </h1>
        <div className="flex items-center space-x-2 sm:space-x-3">
          {currentUser && (
            <>
              <button
                onClick={onNavigateToFloorPlan}
                className="p-1.5 rounded-md text-neutral-400 hover:text-red-400 hover:bg-neutral-700/50 transition-colors"
                title={t('nav.floor')}
                aria-label={t('nav.floor')}
              >
                <MapIcon className="w-6 h-6" />
              </button>
              <button
                onClick={onNavigateToChat}
                className="p-1.5 rounded-md text-neutral-400 hover:text-red-400 hover:bg-neutral-700/50 transition-colors"
                title={t('nav.chat')}
                aria-label={t('nav.chat')}
              >
                <ChatBubbleLeftIcon className="w-6 h-6" />
              </button>
              <button
                onClick={onNavigateToReportIssue}
                className="p-1.5 rounded-md text-neutral-400 hover:text-red-400 hover:bg-neutral-700/50 transition-colors"
                title={t('nav.report')}
                aria-label={t('nav.report')}
              >
                <ChartBarIcon className="w-6 h-6" />
              </button>
              <button
                onClick={onNavigateToSavedMachinesView}
                className="p-1.5 rounded-md text-neutral-400 hover:text-red-400 hover:bg-neutral-700/50 transition-colors"
                title={t('common.pageHeader.mySavedMachines', { count: userRememberedMachinesCount })}
                aria-label={t('common.pageHeader.mySavedMachines', { count: userRememberedMachinesCount })}
              >
                <div className="relative">
                  <ArchiveBoxArrowDownIcon className="w-6 h-6" />
                  {userRememberedMachinesCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 px-1.5 py-0.5 text-[10px] font-bold bg-red-600 text-white rounded-full">
                      {userRememberedMachinesCount > 99 ? '99+' : userRememberedMachinesCount}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={onNavigateToProfile}
                className="p-1.5 rounded-md text-neutral-400 hover:text-red-400 hover:bg-neutral-700/50 transition-colors"
                title={t('common.pageHeader.profile')}
                aria-label={t('common.pageHeader.profile')}
              >
                <UserCircleIcon
                  className="w-7 h-7"
                />
              </button>
              <button
                onClick={logout}
                className="p-1.5 rounded-md text-neutral-400 hover:text-red-400 hover:bg-neutral-700/50 transition-colors"
                title={t('common.pageHeader.logout')}
                aria-label={t('common.pageHeader.logout')}
              >
                <LogoutIcon
                  className="w-6 h-6"
                />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default PageHeader;
