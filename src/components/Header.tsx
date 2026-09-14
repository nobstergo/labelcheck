import React, { useState, useRef, useEffect } from 'react';
import { RotateCcw, FileText, CheckSquare, Camera, Clock, Info, LogOut, ChevronDown } from 'lucide-react';
import { NavigationTab, UserProfile } from '../types';
import { LogoPlaceholder } from './LogoPlaceholder';

interface HeaderProps {
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  currentUser: UserProfile | null;
  onLogout: () => void;
  onReset?: () => void;
  onOpenReport?: () => void;
  hasResult?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  currentUser,
  onLogout,
  onReset,
  onOpenReport,
  hasResult
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  const handleSelectTabFromMenu = (tab: NavigationTab) => {
    onTabChange(tab);
    setIsProfileMenuOpen(false);
  };

  const handleLogoutClick = () => {
    setIsProfileMenuOpen(false);
    onLogout();
  };

  return (
    <header id="main-header" className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Logo placeholder & Primary Navigation (Scan & Inspect only) */}
        <div className="flex items-center gap-2.5 sm:gap-6 min-w-0">
          <div className="flex items-center cursor-pointer shrink-0" onClick={() => onTabChange('scan')}>
            <LogoPlaceholder size="md" />
          </div>

          {/* Primary Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0">
            <button
              type="button"
              id="nav-tab-scan"
              onClick={() => onTabChange('scan')}
              className={`inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'scan'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Scan</span>
            </button>

            <button
              type="button"
              id="nav-tab-inspect"
              onClick={() => onTabChange('inspect')}
              className={`inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'inspect'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Inspect</span>
            </button>
          </nav>
        </div>

        {/* Right: Actions and User Account Profile */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {currentTab === 'scan' && hasResult && onOpenReport && (
            <button
              type="button"
              id="header-btn-report"
              onClick={onOpenReport}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Report</span>
            </button>
          )}

          {currentTab === 'scan' && hasResult && onReset && (
            <button
              type="button"
              id="header-btn-reset"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
              title="Reset inspection and inspect another package"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">New Scan</span>
            </button>
          )}

          {/* User Profile Dropdown Menu */}
          {currentUser && (
            <div className="relative pl-1.5 sm:pl-2 border-l border-slate-200 shrink-0" ref={profileMenuRef}>
              <button
                type="button"
                id="header-profile-menu-button"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-1 sm:gap-2 p-1 rounded-xl hover:bg-slate-100 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                aria-expanded={isProfileMenuOpen}
                aria-haspopup="true"
              >
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {currentUser.name.charAt(0)}
                  </div>
                )}
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-slate-900 leading-tight truncate max-w-[120px]">
                    {currentUser.name}
                  </p>
                  <p className="text-[10px] text-slate-500 leading-tight truncate max-w-[120px]">
                    {currentUser.email}
                  </p>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Popover Menu containing History, About, and Logout */}
              {isProfileMenuOpen && (
                <div
                  id="header-profile-dropdown"
                  className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-24px)] bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                >
                  {/* Account Header */}
                  <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/70 rounded-t-lg">
                    <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span className="text-[10px] font-medium text-slate-600">Google Verified Account</span>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <button
                      type="button"
                      id="profile-menu-history"
                      onClick={() => handleSelectTabFromMenu('history')}
                      className={`w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium transition cursor-pointer text-left ${
                        currentTab === 'history'
                          ? 'bg-slate-100 text-slate-900 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <Clock className="w-4 h-4 text-slate-500" />
                      <div className="flex-1">
                        <p className="leading-tight">Inspection History</p>
                        <p className="text-[10px] text-slate-400 font-normal">Past scans & session logs</p>
                      </div>
                      {currentTab === 'history' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-900"></span>
                      )}
                    </button>

                    <button
                      type="button"
                      id="profile-menu-about"
                      onClick={() => handleSelectTabFromMenu('about')}
                      className={`w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium transition cursor-pointer text-left ${
                        currentTab === 'about'
                          ? 'bg-slate-100 text-slate-900 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <Info className="w-4 h-4 text-slate-500" />
                      <div className="flex-1">
                        <p className="leading-tight">About & Standards</p>
                        <p className="text-[10px] text-slate-400 font-normal">Legal Metrology Rule 6 rules</p>
                      </div>
                      {currentTab === 'about' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-900"></span>
                      )}
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-slate-100 my-1"></div>

                  {/* Sign Out Option */}
                  <div className="py-0.5">
                    <button
                      type="button"
                      id="profile-menu-logout"
                      onClick={handleLogoutClick}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition cursor-pointer text-left"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Sign out of account</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

