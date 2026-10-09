import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Equipment, BorrowRequest, EQUIPMENT_CATEGORIES } from './types';

import { Navbar } from './components/Navbar';
import { EquipmentCard } from './components/EquipmentCard';
import { EquipmentDetailModal } from './components/EquipmentDetailModal';
import { BorrowModal } from './components/BorrowModal';
import { MyBookings } from './components/MyBookings';
import { AdminDashboard } from './components/AdminDashboard';
import { ProfileModal } from './components/ProfileModal';
import { AuthErrorModal } from './components/AuthErrorModal';
import { CameraFlashLogo } from './components/CameraFlashLogo';

import {
  Search,
  Filter,
  Layers,
  Sparkles,
  Camera,
  CheckCircle2,
  Calendar,
  Shield,
  HelpCircle,
  Clock,
  LogIn,
  Plus,
  Eye
} from 'lucide-react';

function MainApp() {
  const { currentUser, userProfile, isAdmin, loginWithGoogle, loginWithGoogleRedirect, isLoggingIn } = useAuth();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'catalog' | 'my-bookings' | 'admin'>('catalog');
  const [isUserPreviewMode, setIsUserPreviewMode] = useState<boolean>(false);

  // Firestore real-time data
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [borrowRequests, setBorrowRequests] = useState<BorrowRequest[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  // Filters for catalog
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [availableOnly, setAvailableOnly] = useState<boolean>(false);

  // Modals state
  const [selectedDetailEquipment, setSelectedDetailEquipment] = useState<Equipment | null>(null);
  const [borrowTargetEquipment, setBorrowTargetEquipment] = useState<Equipment | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [borrowSuccessNotice, setBorrowSuccessNotice] = useState<boolean>(false);

  // 1. Listen to equipments collection in real-time
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'equipments'),
      (snapshot) => {
        const items: Equipment[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...docSnap.data() } as Equipment);
        });
        // Sort by equipment code
        items.sort((a, b) => a.equipmentCode.localeCompare(b.equipmentCode));
        setEquipments(items);
        setLoadingData(false);
      },
      (error) => {
        setLoadingData(false);
        handleFirestoreError(error, OperationType.LIST, 'equipments');
      }
    );

    return () => unsub();
  }, []);

  // 2. Listen to borrow_requests collection
  useEffect(() => {
    if (!currentUser) {
      setBorrowRequests([]);
      return;
    }

    try {
      const q = isAdmin
        ? collection(db, 'borrow_requests')
        : query(collection(db, 'borrow_requests'), where('userId', '==', currentUser.uid));

      const unsub = onSnapshot(
        q,
        (snapshot) => {
          const reqs: BorrowRequest[] = [];
          snapshot.forEach((docSnap) => {
            reqs.push({ id: docSnap.id, ...docSnap.data() } as BorrowRequest);
          });
          // Sort by creation date descending
          reqs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setBorrowRequests(reqs);
        },
        (error) => {
          console.warn('Borrow requests snapshot warning:', error);
          handleFirestoreError(error, OperationType.LIST, 'borrow_requests');
        }
      );

      return () => unsub();
    } catch (err) {
      console.error(err);
    }
  }, [currentUser, isAdmin]);

  // Filter catalog items
  const filteredEquipments = equipments.filter((eq) => {
    const matchesSearch =
      eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eq.equipmentCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eq.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (eq.description && eq.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || eq.category === selectedCategory;
    const matchesAvailability = !availableOnly || (eq.status === 'available' && eq.availableQuantity > 0);

    return matchesSearch && matchesCategory && matchesAvailability;
  });

  // Calculate my active bookings
  const myBookings = borrowRequests.filter((r) => r.userId === currentUser?.uid);
  const myActiveBookingsCount = myBookings.filter(
    (r) => r.status === 'pending' || r.status === 'approved'
  ).length;

  // Pending count for admin
  const pendingCount = borrowRequests.filter((r) => r.status === 'pending').length;

  const handleOpenBorrowModal = (eq: Equipment) => {
    if (!currentUser) {
      loginWithGoogle();
      return;
    }
    setBorrowTargetEquipment(eq);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-['Prompt',sans-serif] text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        pendingCount={pendingCount}
        myActiveBookingsCount={myActiveBookingsCount}
      />

      {/* Persistent User Preview Mode Banner for Admins */}
      {isUserPreviewMode && isAdmin && (
        <div className="bg-slate-900 text-white px-4 py-2.5 text-xs sm:text-sm font-medium border-b border-slate-800 shadow-sm sticky top-16 sm:top-20 z-30">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 bg-amber-400 text-slate-950 rounded font-bold text-[10px] uppercase tracking-wider">
                Preview Mode
              </span>
              <span className="text-slate-300">
                คุณกำลังดูระบบใน <strong className="text-white">"มุมมองผู้ใช้ทั่วไป"</strong> เพื่อตรวจสอบประสบการณ์ของนักศึกษาและอาจารย์
              </span>
            </div>
            <button
              onClick={() => {
                setIsUserPreviewMode(false);
                setActiveTab('admin');
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-3.5 py-1 rounded-lg text-xs shadow-xs transition flex items-center space-x-1 shrink-0 cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>กลับสู่ระบบผู้ดูแล (Exit Preview)</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Success toast after booking */}
        {borrowSuccessNotice && (
          <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-2xl flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="font-semibold text-sm">ส่งคำขอจองอุปกรณ์เรียบร้อยแล้ว!</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  ระบบส่งคำขอไปยังเจ้าหน้าที่แล้ว คุณสามารถติดตามสถานะได้ในแท็บ "การจองของฉัน"
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('my-bookings')}
              className="text-xs font-semibold bg-emerald-600 text-white px-3.5 py-1.5 rounded-xl hover:bg-emerald-700 transition cursor-pointer"
            >
              ดูการจองของฉัน
            </button>
          </div>
        )}

        {/* TAB 1: EQUIPMENT CATALOG */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            {/* Hero Banner */}
            <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-sky-600 rounded-3xl p-6 sm:p-10 text-white shadow-md relative overflow-hidden">
              <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-white/10 to-transparent pointer-events-none" />

              <div className="relative z-10 max-w-2xl">
                <span className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-medium backdrop-blur-xs mb-3">
                  <CameraFlashLogo className="w-4 h-4 text-white" />
                  <span>Educational Technology Department</span>
                </span>

                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                  ระบบยืม-คืนอุปกรณ์การศึกษา
                </h1>
                <p className="text-blue-100 text-sm sm:text-base mt-2 leading-relaxed">
                  บริการยืมกล้อง ไมโครโฟน อุปกรณ์สตูดิโอ ไฟถ่ายทำ และเทคโนโลยีเพื่อการศึกษา
                  สำหรับนักศึกษาและอาจารย์ เพื่อใช้ในการเรียนการสอนและผลิตผลงานสร้างสรรค์
                </p>

                {/* Quick stats on banner */}
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-6 pt-6 border-t border-white/20 text-xs sm:text-sm">
                  <div>
                    <span className="text-blue-200 block text-xs">รายการอุปกรณ์ทั้งหมด</span>
                    <span className="font-bold text-lg text-white">
                      {equipments.reduce((acc, eq) => acc + (eq.totalQuantity || 0), 0)} ชิ้น
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-200 block text-xs">พร้อมให้ยืมทันที</span>
                    <span className="font-bold text-lg text-emerald-300">
                      {equipments.reduce((acc, eq) => acc + (eq.availableQuantity || 0), 0)} ชิ้น
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-200 block text-xs">หมวดหมู่อุปกรณ์</span>
                    <span className="font-bold text-lg text-white">{EQUIPMENT_CATEGORIES.length} หมวด</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Search & Filter Toolbar */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                {/* Search Box */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหาชื่ออุปกรณ์, รหัส, สเปค หรือยี่ห้อ..."
                    className="w-full pl-9 pr-3.5 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute right-3 top-2.5 cursor-pointer"
                    >
                      ล้าง
                    </button>
                  )}
                </div>

                {/* Availability Toggle */}
                <div className="flex items-center space-x-3 self-end sm:self-center">
                  <label className="flex items-center space-x-2 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={availableOnly}
                      onChange={(e) => setAvailableOnly(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 dark:border-slate-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span>แสดงเฉพาะที่ว่างพร้อมยืม</span>
                  </label>
                </div>
              </div>

              {/* Category Pills */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3.5 py-1.5 rounded-xl font-medium shrink-0 transition cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-blue-600 text-white shadow-xs font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  ทั้งหมด ({equipments.length})
                </button>

                {EQUIPMENT_CATEGORIES.map((cat) => {
                  const count = equipments.filter((e) => e.category === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-xl font-medium shrink-0 transition cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-blue-600 text-white shadow-xs font-semibold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {cat} {count > 0 && `(${count})`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Equipment Grid or Empty State */}
            {loadingData ? (
              <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-500 dark:text-slate-400">กำลังตรวจสอบข้อมูลอุปกรณ์ในระบบ...</p>
              </div>
            ) : equipments.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8 max-w-lg mx-auto shadow-xs">
                <div className="w-16 h-16 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 p-3 shadow-md shadow-slate-900/10">
                  <CameraFlashLogo className="w-full h-full" />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-1.5">ยังไม่มีรายการอุปกรณ์ในระบบ</h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                  ขณะนี้ยังไม่มีอุปกรณ์ที่เปิดให้บริการยืมในระบบ กรุณารอเจ้าหน้าที่ภาควิชาเทคโนโลยีการศึกษาเพิ่มรายการอุปกรณ์
                </p>
                {isAdmin && (
                  <button
                    onClick={() => setActiveTab('admin')}
                    className="px-5 py-2.5 bg-slate-800 dark:bg-blue-600 hover:bg-slate-900 dark:hover:bg-blue-700 text-white font-medium text-xs rounded-xl shadow-xs inline-flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>ไปยังระบบผู้ดูแลเพื่อเพิ่มอุปกรณ์</span>
                  </button>
                )}
              </div>
            ) : filteredEquipments.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8">
                <p className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-2">ไม่พบอุปกรณ์ที่ตรงกับเงื่อนไขการค้นหา</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">ลองปรับคำค้นหาหรือเปลี่ยนตัวกรองหมวดหมู่</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setAvailableOnly(false);
                  }}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  ล้างตัวกรองทั้งหมด
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">
                {filteredEquipments.map((equipment) => (
                  <EquipmentCard
                    key={equipment.id}
                    equipment={equipment}
                    onSelect={(eq) => setSelectedDetailEquipment(eq)}
                    onBorrow={(eq) => handleOpenBorrowModal(eq)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MY BOOKINGS */}
        {activeTab === 'my-bookings' && (
          <div>
            {!currentUser ? (
              <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8 max-w-md mx-auto my-12 shadow-sm">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <LogIn className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-1">กรุณาเข้าสู่ระบบก่อน</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                  เข้าสู่ระบบด้วย Google Account เพื่อดูและติดตามประวัติการยืม-คืนอุปกรณ์ของคุณ
                </p>
                <div className="space-y-2.5">
                  <button
                    onClick={() => loginWithGoogle()}
                    disabled={isLoggingIn}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-75 text-white py-2.5 rounded-xl text-sm font-semibold shadow-xs transition flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    {isLoggingIn ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>กำลังเชื่อมต่อ Google...</span>
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

                  <button
                    onClick={() => loginWithGoogleRedirect()}
                    disabled={isLoggingIn}
                    className="w-full text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 py-1 transition cursor-pointer"
                  >
                    หากป๊อปอัปมีปัญหา: คลิกที่นี่เพื่อเข้าสู่ระบบแบบ Redirect
                  </button>
                </div>
              </div>
            ) : (
              <MyBookings
                bookings={myBookings}
                onBrowseCatalog={() => setActiveTab('catalog')}
              />
            )}
          </div>
        )}

        {/* TAB 3: ADMIN PANEL */}
        {activeTab === 'admin' && (
          <div>
            {isAdmin ? (
              <AdminDashboard
                equipments={equipments}
                borrowRequests={borrowRequests}
                onRefreshData={() => {}}
                onSwitchToUserView={() => {
                  setActiveTab('catalog');
                  setIsUserPreviewMode(true);
                }}
              />
            ) : (
              <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-rose-200/80 dark:border-rose-900/60 p-8 max-w-md mx-auto my-12">
                <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-1">ไม่มีสิทธิ์เข้าถึงระบบผู้ดูแล</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                  หน้านี้สงวนไว้เฉพาะอาจารย์หรือเจ้าหน้าที่ผู้ดูแลระบบภาควิชาเทคโนโลยีการศึกษาเท่านั้น
                </p>
                <button
                  onClick={() => setActiveTab('catalog')}
                  className="px-5 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-xl text-xs font-semibold hover:bg-slate-900 dark:hover:bg-slate-600 transition cursor-pointer"
                >
                  กลับสู่หน้ารายการอุปกรณ์
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Equipment Detail Modal */}
      <EquipmentDetailModal
        equipment={selectedDetailEquipment}
        isOpen={Boolean(selectedDetailEquipment)}
        onClose={() => setSelectedDetailEquipment(null)}
        onBorrow={(eq) => handleOpenBorrowModal(eq)}
      />

      {/* Borrow Request Modal */}
      <BorrowModal
        equipment={borrowTargetEquipment}
        isOpen={Boolean(borrowTargetEquipment)}
        onClose={() => setBorrowTargetEquipment(null)}
        onSuccess={() => {
          setBorrowSuccessNotice(true);
          setTimeout(() => setBorrowSuccessNotice(false), 5000);
        }}
      />

      {/* User Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {/* Authentication Notice/Error Modal */}
      <AuthErrorModal />

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 mt-12 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-1">
          <p className="font-semibold text-slate-700 dark:text-slate-300">
            ภาควิชาเทคโนโลยีการศึกษา • Educational Technology Equipment Borrowing System
          </p>
          <p className="text-slate-400 dark:text-slate-500">
            ระบบบริหารจัดการยืม-คืนอุปกรณ์โสตทัศนูปกรณ์และนวัตกรรมการศึกษา
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
