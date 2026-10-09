import React, { useState } from 'react';
import {
  Camera,
  Layers,
  ClipboardList,
  ShieldCheck,
  User as UserIcon,
  LogOut,
  LogIn,
  Menu,
  X,
  Sparkles,
  ChevronDown,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { CameraFlashLogo } from './CameraFlashLogo';

interface NavbarProps {
  activeTab: 'catalog' | 'my-bookings' | 'admin';
  setActiveTab: (tab: 'catalog' | 'my-bookings' | 'admin') => void;
  onOpenProfile: () => void;
  pendingCount: number;
  myActiveBookingsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenProfile,
  pendingCount,
  myActiveBookingsCount,
}) => {
  const { currentUser, userProfile, isAdmin, loginWithGoogle, logout, isLoggingIn } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo & Department Brand */}
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setActiveTab('catalog')}>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center p-2 shadow-md shadow-slate-900/20 group-hover:bg-blue-600 transition-colors border border-transparent dark:border-slate-700">
              <CameraFlashLogo className="w-full h-full" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base sm:text-lg text-slate-800 dark:text-white tracking-tight">
                  ระบบยืม-คืนอุปกรณ์
                </span>
                <span className="text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800 px-2 py-0.5 rounded-full hidden sm:inline-block">
                  EDTECH
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                ภาควิชาเทคโนโลยีการศึกษา
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                activeTab === 'catalog'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>รายการอุปกรณ์</span>
            </button>

            {currentUser && (
              <button
                onClick={() => setActiveTab('my-bookings')}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 relative ${
                  activeTab === 'my-bookings'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                <span>การจองของฉัน</span>
                {myActiveBookingsCount > 0 && (
                  <span className="bg-sky-500 text-white text-xs px-1.5 py-0.2 rounded-full font-bold ml-1">
                    {myActiveBookingsCount}
                  </span>
                )}
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 relative ${
                  activeTab === 'admin'
                    ? 'bg-slate-800 dark:bg-slate-700 text-white font-semibold shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <span>ระบบผู้ดูแล (Admin)</span>
                {pendingCount > 0 && (
                  <span className="bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                    {pendingCount}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* User Auth Info & Controls + Day/Night Toggle Button */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-3">
            {/* Day / Night Mode Toggle Button (Prominent, right next to user) */}
            <button
              onClick={toggleDarkMode}
              className={`px-3 py-2 rounded-xl border transition-all duration-200 flex items-center space-x-2 cursor-pointer shadow-xs ${
                isDarkMode
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700 shadow-slate-900/50'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
              title={isDarkMode ? 'คลิกเพื่อสลับเป็นโหมดกลางวัน (Light Mode)' : 'คลิกเพื่อสลับเป็นโหมดกลางคืน (Dark Mode)'}
              aria-label="Toggle Day and Night Mode"
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400 fill-amber-400/20 animate-spin-slow" />
                  <span className="text-xs font-semibold text-amber-300">โหมดกลางคืน</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-blue-600 fill-blue-500/20" />
                  <span className="text-xs font-semibold text-slate-700">โหมดกลางวัน</span>
                </>
              )}
            </button>

            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-3 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                >
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'User'}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-500/30"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-semibold text-sm">
                      {currentUser.displayName ? currentUser.displayName.charAt(0) : 'U'}
                    </div>
                  )}
                  <div className="text-left hidden lg:block">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-snug line-clamp-1 max-w-[130px]">
                      {userProfile?.displayName || currentUser.displayName}
                    </p>
                    <div className="flex items-center space-x-1">
                      {isAdmin ? (
                        <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200/50 dark:border-amber-800/60">
                          ผู้ดูแลระบบ
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {userProfile?.studentId ? `รหัส ${userProfile.studentId}` : 'นักศึกษา / อาจารย์'}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-100 dark:border-slate-800 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {userProfile?.displayName || currentUser.displayName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{currentUser.email}</p>
                    </div>

                    <button
                      onClick={onOpenProfile}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center space-x-2.5 transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      <span>ข้อมูลโปรไฟล์ของฉัน</span>
                    </button>

                    <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>

                    <button
                      onClick={logout}
                      className="w-full text-left px-4 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center space-x-2.5 transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>ออกจากระบบ</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => loginWithGoogle()}
                disabled={isLoggingIn}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-75 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center space-x-2 shadow-sm transition-all hover:shadow hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                {isLoggingIn ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                    <span>กำลังเข้าสู่ระบบ...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                    </svg>
                    <span>เข้าสู่ระบบด้วย Google</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Mobile Right Controls (Day/Night toggle + Hamburger) */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg border transition-colors ${
                isDarkMode
                  ? 'bg-slate-800 text-amber-300 border-slate-700'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title="สลับโหมดกลางวัน/กลางคืน"
              aria-label="Toggle Theme"
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-amber-400 fill-amber-400/20" />
              ) : (
                <Moon className="w-5 h-5 text-blue-600 fill-blue-500/20" />
              )}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-3 pb-5 space-y-3">
          <button
            onClick={() => {
              setActiveTab('catalog');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-medium flex items-center space-x-3 ${
              activeTab === 'catalog'
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="w-5 h-5 text-blue-600" />
            <span>รายการอุปกรณ์</span>
          </button>

          {currentUser && (
            <button
              onClick={() => {
                setActiveTab('my-bookings');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-medium flex items-center justify-between ${
                activeTab === 'my-bookings'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center space-x-3">
                <ClipboardList className="w-5 h-5 text-blue-600" />
                <span>การจองของฉัน</span>
              </div>
              {myActiveBookingsCount > 0 && (
                <span className="bg-sky-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  {myActiveBookingsCount}
                </span>
              )}
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => {
                setActiveTab('admin');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-medium flex items-center justify-between ${
                activeTab === 'admin'
                  ? 'bg-slate-800 dark:bg-slate-700 text-white font-semibold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center space-x-3">
                <ShieldCheck className="w-5 h-5 text-amber-500" />
                <span>ระบบผู้ดูแล (Admin)</span>
              </div>
              {pendingCount > 0 && (
                <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  {pendingCount} รออนุมัติ
                </span>
              )}
            </button>
          )}

          {/* Quick theme toggle in mobile menu */}
          <button
            onClick={toggleDarkMode}
            className="w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-medium flex items-center justify-between text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <div className="flex items-center space-x-3">
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-blue-600" />
              )}
              <span>{isDarkMode ? 'เปลี่ยนเป็นโหมดกลางวัน' : 'เปลี่ยนเป็นโหมดกลางคืน'}</span>
            </div>
            <span className="text-xs text-slate-400">{isDarkMode ? 'Dark' : 'Light'}</span>
          </button>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            {currentUser ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-3 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || ''}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold">
                      {currentUser.displayName?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {userProfile?.displayName || currentUser.displayName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{currentUser.email}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onOpenProfile();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center space-x-2"
                >
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  <span>แก้ไขข้อมูลส่วนตัว</span>
                </button>

                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>ออกจากระบบ</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  loginWithGoogle();
                  setMobileMenuOpen(false);
                }}
                disabled={isLoggingIn}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-75 text-white py-2.5 rounded-xl text-sm font-medium flex items-center justify-center space-x-2 cursor-pointer"
              >
                {isLoggingIn ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                    <span>กำลังเข้าสู่ระบบ...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 shrink-0" />
                    <span>เข้าสู่ระบบด้วย Google Account</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
