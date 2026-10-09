import React, { useState, useEffect } from 'react';
import {
  Package,
  Layers,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Plus,
  Edit,
  Trash2,
  UserCheck,
  ShieldAlert,
  Search,
  Filter,
  AlertTriangle,
  Mail,
  UserPlus,
  Sparkles,
  Phone,
  Calendar,
  Check,
  X,
  Users,
  Eye,
  BookOpen,
  ChevronRight,
  ExternalLink,
  Hash,
  Building2,
  Shield
} from 'lucide-react';
import {
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  collection,
  onSnapshot,
  runTransaction
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Equipment, BorrowRequest, ReturnedCondition, EQUIPMENT_CATEGORIES, UserProfile } from '../types';
import { useAuth } from '../context/AuthContext';
import { EquipmentManagementModal } from './EquipmentManagementModal';
import { INITIAL_EQUIPMENT_DATA } from '../data/initialEquipments';

interface AdminDashboardProps {
  equipments: Equipment[];
  borrowRequests: BorrowRequest[];
  onRefreshData: () => void;
  onSwitchToUserView?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  equipments,
  borrowRequests,
  onRefreshData,
  onSwitchToUserView,
}) => {
  const { currentUser, userProfile, isSuperAdmin, adminMembers, addAdminMember, removeAdminMember } = useAuth();

  const [activeAdminTab, setActiveAdminTab] = useState<'requests' | 'equipments' | 'users' | 'admins'>('requests');
  
  // Registered users state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'borrowing' | 'user' | 'admin'>('all');
  const [selectedUserForHistory, setSelectedUserForHistory] = useState<UserProfile | null>(null);

  // Listen to registered users
  useEffect(() => {
    try {
      const unsub = onSnapshot(
        collection(db, 'users'),
        (snapshot) => {
          const list: UserProfile[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ uid: docSnap.id, ...docSnap.data() } as UserProfile);
          });
          setUsers(list);
        },
        (error) => {
          console.warn('Users snapshot warning:', error);
        }
      );
      return () => unsub();
    } catch {
      // ignore
    }
  }, []);

  // Equipment modal state
  const [isEquipModalOpen, setIsEquipModalOpen] = useState(false);
  const [selectedEquipmentForEdit, setSelectedEquipmentForEdit] = useState<Equipment | null>(null);

  // Return inspection modal
  const [returnModalRequest, setReturnModalRequest] = useState<BorrowRequest | null>(null);
  const [returnCondition, setReturnCondition] = useState<ReturnedCondition>('normal');
  const [returnAdminNote, setReturnAdminNote] = useState('');
  const [isProcessingReturn, setIsProcessingReturn] = useState(false);

  // Reject modal
  const [rejectModalRequest, setRejectModalRequest] = useState<BorrowRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessingReject, setIsProcessingReject] = useState(false);

  // Request approval in progress
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Filters for requests
  const [requestFilter, setRequestFilter] = useState<'all' | 'pending' | 'approved' | 'returned' | 'rejected'>('pending');
  const [requestSearch, setRequestSearch] = useState('');

  // Admin members management
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminNote, setNewAdminNote] = useState('');
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [adminAddSuccess, setAdminAddSuccess] = useState(false);

  // Seed data state
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedConfirmOpen, setSeedConfirmOpen] = useState(false);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{ id: string; name: string } | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<{ id: string; email: string } | null>(null);
  const [dashboardNotice, setDashboardNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showNotice = (type: 'success' | 'error', text: string) => {
    setDashboardNotice({ type, text });
    setTimeout(() => setDashboardNotice(null), 4000);
  };

  // Stats calculation
  const totalEquipmentsCount = equipments.reduce((acc, eq) => acc + (eq.totalQuantity || 0), 0);
  const totalAvailableCount = equipments.reduce((acc, eq) => acc + (eq.availableQuantity || 0), 0);
  const totalCurrentlyBorrowed = totalEquipmentsCount - totalAvailableCount;
  const pendingRequestsCount = borrowRequests.filter((r) => r.status === 'pending').length;
  const approvedRequestsCount = borrowRequests.filter((r) => r.status === 'approved').length;
  const returnedRequestsCount = borrowRequests.filter((r) => r.status === 'returned').length;

  // Filtered requests
  const filteredRequests = borrowRequests.filter((req) => {
    const matchesFilter = requestFilter === 'all' || req.status === requestFilter;
    const matchesSearch =
      req.equipmentName.toLowerCase().includes(requestSearch.toLowerCase()) ||
      req.userName.toLowerCase().includes(requestSearch.toLowerCase()) ||
      req.studentId?.toLowerCase().includes(requestSearch.toLowerCase()) ||
      req.equipmentCode.toLowerCase().includes(requestSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Seed sample equipment data
  const handleSeedData = async () => {
    setSeedConfirmOpen(false);
    setIsSeeding(true);
    try {
      for (const item of INITIAL_EQUIPMENT_DATA) {
        await addDoc(collection(db, 'equipments'), {
          ...item,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }).catch((err) => {
          handleFirestoreError(err, OperationType.CREATE, 'equipments');
        });
      }
      showNotice('success', 'นำเข้าข้อมูลอุปกรณ์ตัวอย่างเรียบร้อยแล้ว!');
      onRefreshData();
    } catch (err) {
      console.error(err);
      showNotice('error', 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล');
    } finally {
      setIsSeeding(false);
    }
  };

  // Delete equipment
  const handleDeleteEquipment = async (id: string, name: string) => {
    try {
      await deleteDoc(doc(db, 'equipments', id)).catch((err) => {
        handleFirestoreError(err, OperationType.DELETE, `equipments/${id}`);
      });
      setDeleteConfirmTarget(null);
      showNotice('success', `ลบอุปกรณ์ "${name}" ออกจากระบบเรียบร้อย`);
      onRefreshData();
    } catch (err) {
      console.error(err);
      showNotice('error', 'ไม่สามารถลบอุปกรณ์ได้ กรุณาตรวจสอบสิทธิ์');
    }
  };

  // Approve borrow request (User collects equipment)
  const handleApproveRequest = async (request: BorrowRequest) => {
    const equip = equipments.find((e) => e.id === request.equipmentId);
    if (!equip) {
      showNotice('error', 'ไม่พบข้อมูลอุปกรณ์นี้ในคลังพัสดุ');
      return;
    }

    if (equip.availableQuantity < request.quantity) {
      showNotice('error', `อุปกรณ์ในคลังไม่เพียงพอ (คงเหลือ ${equip.availableQuantity} ชิ้น, ต้องการ ${request.quantity} ชิ้น)`);
      return;
    }

    setApprovingId(request.id);
    try {
      // Run atomic transaction: decrement equipment available quantity and set request status to approved
      await runTransaction(db, async (transaction) => {
        const equipRef = doc(db, 'equipments', request.equipmentId);
        const requestRef = doc(db, 'borrow_requests', request.id);

        const equipDoc = await transaction.get(equipRef);
        if (!equipDoc.exists()) {
          throw new Error('Equipment doc does not exist');
        }

        const currentAvailable = equipDoc.data().availableQuantity || 0;
        const newAvailable = Math.max(0, currentAvailable - request.quantity);
        const newStatus = newAvailable === 0 ? 'out_of_stock' : equipDoc.data().status;

        transaction.update(equipRef, {
          availableQuantity: newAvailable,
          status: newStatus,
          updatedAt: new Date().toISOString(),
        });

        transaction.update(requestRef, {
          status: 'approved',
          approvedBy: currentUser?.email || 'Admin',
          approvedAt: new Date().toISOString(),
          adminNote: 'อนุมัติการยืมเรียบร้อย ผู้ยืมมารับอุปกรณ์แล้ว',
          updatedAt: new Date().toISOString(),
        });
      });

      showNotice('success', `อนุมัติคำขอยืมของ ${request.userName} เรียบร้อยแล้ว`);
      onRefreshData();
    } catch (err) {
      console.error('Approve error:', err);
      showNotice('error', 'เกิดข้อผิดพลาดในการอนุมัติคำขอ');
    } finally {
      setApprovingId(null);
    }
  };

  // Submit Return inspection
  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnModalRequest) return;

    setIsProcessingReturn(true);
    try {
      const todayMs = new Date().setHours(0, 0, 0, 0);
      const endMs = new Date(returnModalRequest.endDate).getTime();
      const diffDays = Math.round((endMs - todayMs) / (1000 * 60 * 60 * 24));
      const isEarly = diffDays > 0;

      // Run transaction: increment equipment available quantity and set request status to returned
      await runTransaction(db, async (transaction) => {
        const equipRef = doc(db, 'equipments', returnModalRequest.equipmentId);
        const requestRef = doc(db, 'borrow_requests', returnModalRequest.id);

        const equipDoc = await transaction.get(equipRef);
        if (equipDoc.exists()) {
          const currentAvailable = equipDoc.data().availableQuantity || 0;
          const totalQty = equipDoc.data().totalQuantity || 1;
          const newAvailable = Math.min(totalQty, currentAvailable + returnModalRequest.quantity);
          const newEquipStatus =
            returnCondition === 'damaged'
              ? 'maintenance'
              : equipDoc.data().status === 'out_of_stock'
              ? 'available'
              : equipDoc.data().status;

          transaction.update(equipRef, {
            availableQuantity: newAvailable,
            status: newEquipStatus,
            updatedAt: new Date().toISOString(),
          });
        }

        const defaultNote = isEarly
          ? `ตรวจรับส่งคืนก่อนกำหนด ${diffDays} วัน เรียบร้อย`
          : 'ตรวจรับการส่งคืนเรียบร้อยแล้ว';

        transaction.update(requestRef, {
          status: 'returned',
          returnedAt: new Date().toISOString(),
          returnedCondition: returnCondition,
          isReturnedEarly: isEarly,
          daysReturnedEarly: isEarly ? diffDays : 0,
          adminNote: returnAdminNote.trim() || defaultNote,
          updatedAt: new Date().toISOString(),
        });
      });

      showNotice(
        'success',
        isEarly
          ? `บันทึกรับคืนก่อนกำหนด ${diffDays} วัน เรียบร้อย คืนสต็อกอุปกรณ์แล้ว`
          : 'บันทึกการส่งคืนอุปกรณ์เรียบร้อยแล้ว'
      );
      setReturnModalRequest(null);
      setReturnAdminNote('');
      onRefreshData();
    } catch (err) {
      console.error('Return processing error:', err);
      showNotice('error', 'เกิดข้อผิดพลาดในการบันทึกการส่งคืน');
    } finally {
      setIsProcessingReturn(false);
    }
  };

  // Submit Reject
  const handleSubmitReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalRequest) return;

    setIsProcessingReject(true);
    try {
      await updateDoc(doc(db, 'borrow_requests', rejectModalRequest.id), {
        status: 'rejected',
        adminNote: rejectReason.trim() || 'ปฏิเสธคำขอโดยเจ้าหน้าที่ดูแลระบบ',
        updatedAt: new Date().toISOString(),
      }).catch((err) => {
        handleFirestoreError(err, OperationType.UPDATE, `borrow_requests/${rejectModalRequest.id}`);
      });

      showNotice('success', 'บันทึกการปฏิเสธคำขอยืมอุปกรณ์เรียบร้อย');
      setRejectModalRequest(null);
      setRejectReason('');
      onRefreshData();
    } catch (err) {
      console.error('Reject error:', err);
      showNotice('error', 'เกิดข้อผิดพลาดในการปฏิเสธคำขอ');
    } finally {
      setIsProcessingReject(false);
    }
  };

  // Add new admin email
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;

    setIsAddingAdmin(true);
    try {
      await addAdminMember(newAdminEmail.trim(), newAdminNote.trim());
      setNewAdminEmail('');
      setNewAdminNote('');
      setAdminAddSuccess(true);
      showNotice('success', 'เพิ่มอีเมลผู้ดูแลระบบเรียบร้อยแล้ว');
      setTimeout(() => setAdminAddSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      showNotice('error', 'เกิดข้อผิดพลาดในการเพิ่มผู้ดูแลระบบ');
    } finally {
      setIsAddingAdmin(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats Overview */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3 border border-blue-500/30">
              <UserCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Admin Management Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              ระบบจัดการสำหรับผู้ดูแลระบบ
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              ควบคุมการยืม-คืน ตรวจรับอุปกรณ์ และจัดการคลังอุปกรณ์ ภาควิชาเทคโนโลยีการศึกษา
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onSwitchToUserView && (
              <button
                onClick={onSwitchToUserView}
                className="px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm border border-sky-400/30 cursor-pointer"
                title="สลับไปหน้าเว็บในมุมมองผู้ใช้ทั่วไป (นักศึกษา/อาจารย์)"
              >
                <Eye className="w-4 h-4 text-white" />
                <span>มุมมองผู้ใช้ทั่วไป (User View)</span>
              </button>
            )}

            {equipments.length === 0 && (
              <button
                onClick={() => setSeedConfirmOpen(true)}
                disabled={isSeeding}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{isSeeding ? 'กำลังนำเข้า...' : 'นำเข้าข้อมูลอุปกรณ์ตัวอย่าง'}</span>
              </button>
            )}

            <button
              onClick={() => {
                setSelectedEquipmentForEdit(null);
                setIsEquipModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มอุปกรณ์ใหม่</span>
            </button>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
          <div className="bg-slate-800/80 backdrop-blur-xs p-4 rounded-2xl border border-slate-700/60">
            <span className="text-xs text-slate-400 block mb-1">อุปกรณ์ทั้งหมดในระบบ</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl sm:text-3xl font-bold text-white">{totalEquipmentsCount}</span>
              <span className="text-xs text-slate-400">ชิ้น ({equipments.length} รายการ)</span>
            </div>
          </div>

          <div className="bg-slate-800/80 backdrop-blur-xs p-4 rounded-2xl border border-slate-700/60">
            <span className="text-xs text-slate-400 block mb-1">กำลังถูกยืมใช้งาน</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl sm:text-3xl font-bold text-sky-400">{totalCurrentlyBorrowed}</span>
              <span className="text-xs text-slate-400">ชิ้น</span>
            </div>
          </div>

          <div className="bg-slate-800/80 backdrop-blur-xs p-4 rounded-2xl border border-amber-500/30">
            <span className="text-xs text-amber-300 block mb-1 font-medium">คำขอรออนุมัติ</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl sm:text-3xl font-bold text-amber-400">{pendingRequestsCount}</span>
              <span className="text-xs text-amber-300/80">รายการ</span>
            </div>
          </div>

          <div className="bg-slate-800/80 backdrop-blur-xs p-4 rounded-2xl border border-slate-700/60">
            <span className="text-xs text-slate-400 block mb-1">ผู้ใช้ที่ลงทะเบียน</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl sm:text-3xl font-bold text-indigo-400">{users.length}</span>
              <span className="text-xs text-slate-400">คน</span>
            </div>
          </div>
        </div>
      </div>

      {/* In-app Notice Banner */}
      {dashboardNotice && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2 duration-150 ${
            dashboardNotice.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <span>{dashboardNotice.text}</span>
          <button
            onClick={() => setDashboardNotice(null)}
            className="text-xs opacity-75 hover:opacity-100 cursor-pointer ml-3"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2 overflow-x-auto">
        <button
          onClick={() => setActiveAdminTab('requests')}
          className={`pb-3 px-4 text-sm font-semibold transition border-b-2 flex items-center space-x-2 shrink-0 cursor-pointer ${
            activeAdminTab === 'requests'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>จัดการคำขอยืม-คืน</span>
          {pendingRequestsCount > 0 && (
            <span className="bg-amber-500 text-white text-[11px] px-1.5 py-0.2 rounded-full font-bold">
              {pendingRequestsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveAdminTab('equipments')}
          className={`pb-3 px-4 text-sm font-semibold transition border-b-2 flex items-center space-x-2 shrink-0 cursor-pointer ${
            activeAdminTab === 'equipments'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>จัดการอุปกรณ์ในคลัง ({equipments.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('users')}
          className={`pb-3 px-4 text-sm font-semibold transition border-b-2 flex items-center space-x-2 shrink-0 cursor-pointer ${
            activeAdminTab === 'users'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>มุมมองข้อมูลผู้ใช้งาน ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('admins')}
          className={`pb-3 px-4 text-sm font-semibold transition border-b-2 flex items-center space-x-2 shrink-0 cursor-pointer ${
            activeAdminTab === 'admins'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>สิทธิ์ผู้ดูแลระบบ (Admin Team)</span>
        </button>
      </div>

      {/* TAB 1: REQUESTS MANAGEMENT */}
      {activeAdminTab === 'requests' && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="ค้นหาตามชื่อผู้ยืม, รหัสนักศึกษา, อุปกรณ์..."
                value={requestSearch}
                onChange={(e) => setRequestSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl overflow-x-auto">
              <button
                onClick={() => setRequestFilter('pending')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  requestFilter === 'pending'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                รออนุมัติ ({borrowRequests.filter((r) => r.status === 'pending').length})
              </button>
              <button
                onClick={() => setRequestFilter('approved')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  requestFilter === 'approved'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                กำลังยืม ({borrowRequests.filter((r) => r.status === 'approved').length})
              </button>
              <button
                onClick={() => setRequestFilter('returned')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  requestFilter === 'returned'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                คืนแล้ว ({borrowRequests.filter((r) => r.status === 'returned').length})
              </button>
              <button
                onClick={() => setRequestFilter('rejected')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  requestFilter === 'rejected'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                ปฏิเสธ ({borrowRequests.filter((r) => r.status === 'rejected').length})
              </button>
              <button
                onClick={() => setRequestFilter('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  requestFilter === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                ทั้งหมด ({borrowRequests.length})
              </button>
            </div>
          </div>

          {/* Request Items */}
          {filteredRequests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-500">
              ไม่พบรายการคำขอยืม-คืนในตัวกรองนี้
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredRequests.map((req) => {
                const isPending = req.status === 'pending';
                const isApproved = req.status === 'approved';
                const isReturned = req.status === 'returned';
                const isRejected = req.status === 'rejected';

                return (
                  <div
                    key={req.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Borrower & Equipment */}
                      <div className="flex items-start space-x-4">
                        {req.equipmentImage ? (
                          <img
                            src={req.equipmentImage}
                            alt={req.equipmentName}
                            className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-50 dark:bg-slate-800"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                            <Package className="w-8 h-8 text-slate-400" />
                          </div>
                        )}

                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded border border-blue-200/60 dark:border-blue-800">
                              {req.equipmentCode}
                            </span>
                            <span className="font-bold text-slate-800 dark:text-white text-base">
                              {req.equipmentName}
                            </span>
                            <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold px-2 py-0.5 rounded">
                              จำนวน {req.quantity} ชิ้น
                            </span>
                          </div>

                          {/* Borrower Info */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-400 mt-2">
                            <span className="font-medium text-slate-800 dark:text-slate-200">ผู้ยืม: {req.userName}</span>
                            {req.studentId && (
                              <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">
                                รหัส: {req.studentId}
                              </span>
                            )}
                            {req.userPhone && (
                              <a
                                href={`tel:${req.userPhone}`}
                                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
                              >
                                <Phone className="w-3 h-3" />
                                <span>{req.userPhone}</span>
                              </a>
                            )}
                            <span className="text-slate-400 dark:text-slate-500">({req.userEmail})</span>
                          </div>

                          {/* Purpose & Dates */}
                          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 space-y-1">
                            <div>
                              <span className="font-medium text-slate-700 dark:text-slate-300">กำหนดเวลา: </span>
                              <span className="text-slate-800 dark:text-slate-200 font-medium">
                                {req.startDate} ถึง {req.endDate}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-slate-700 dark:text-slate-300">วัตถุประสงค์: </span>
                              <span className="text-slate-600 dark:text-slate-400">{req.purpose}</span>
                            </div>
                            {req.adminNote && (
                              <div className="text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-1.5 rounded-lg border border-amber-200/50 dark:border-amber-800 mt-1">
                                <span className="font-semibold">บันทึกของเจ้าหน้าที่: </span>
                                {req.adminNote}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-wrap items-center gap-2 self-start lg:self-center border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 dark:border-slate-800">
                        {isPending && (
                          <>
                            <button
                              onClick={() => handleApproveRequest(req)}
                              disabled={approvingId === req.id}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition"
                              title="อนุมัติเมื่อผู้ยืมมารับอุปกรณ์จริง"
                            >
                              <Check className="w-4 h-4" />
                              <span>{approvingId === req.id ? 'กำลังบันทึก...' : 'อนุมัติการยืม (รับอุปกรณ์แล้ว)'}</span>
                            </button>

                            <button
                              onClick={() => setRejectModalRequest(req)}
                              className="px-3.5 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition flex items-center space-x-1"
                            >
                              <X className="w-4 h-4" />
                              <span>ปฏิเสธคำขอ</span>
                            </button>
                          </>
                        )}

                        {isApproved && (
                          <div className="flex flex-col items-end space-y-1">
                            {req.isEarlyReturnRequested && (
                              <span className="text-[11px] bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full border border-amber-300 animate-pulse flex items-center space-x-1">
                                <Sparkles className="w-3 h-3 text-amber-600" />
                                <span>ผู้ใช้แจ้งคืนก่อนกำหนด!</span>
                              </span>
                            )}
                            <button
                              onClick={() => {
                                setReturnModalRequest(req);
                                setReturnCondition('normal');
                                setReturnAdminNote('');
                              }}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition"
                            >
                              <RotateCcw className="w-4 h-4" />
                              <span>บันทึกการคืนอุปกรณ์</span>
                            </button>
                          </div>
                        )}

                        {isReturned && (
                          <div className="text-right space-y-1">
                            <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                              {req.isReturnedEarly
                                ? `ส่งคืนก่อนกำหนด (${req.daysReturnedEarly ? `เร็วขึ้น ${req.daysReturnedEarly} วัน` : 'เรียบร้อย'})`
                                : 'ส่งคืนแล้ว'}
                            </span>
                            {req.returnedCondition && (
                              <p className="text-[11px] text-slate-500">
                                สภาพ: {req.returnedCondition === 'normal' ? 'สมบูรณ์ดี' : req.returnedCondition}
                              </p>
                            )}
                          </div>
                        )}

                        {isRejected && (
                          <span className="inline-flex items-center text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
                            <XCircle className="w-3.5 h-3.5 mr-1 text-rose-600" />
                            ปฏิเสธแล้ว
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EQUIPMENT INVENTORY CRUD */}
      {activeAdminTab === 'equipments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-base">รายการอุปกรณ์ในระบบคลังพัสดุ</h3>
            <button
              onClick={() => {
                setSelectedEquipmentForEdit(null);
                setIsEquipModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มอุปกรณ์ใหม่</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200/80">
                  <tr>
                    <th className="py-3.5 px-4">รูปภาพ & รหัส</th>
                    <th className="py-3.5 px-4">ชื่ออุปกรณ์</th>
                    <th className="py-3.5 px-4">หมวดหมู่</th>
                    <th className="py-3.5 px-4 text-center">คงเหลือ / ทั้งหมด</th>
                    <th className="py-3.5 px-4">สถานะ</th>
                    <th className="py-3.5 px-4">สถานที่จัดเก็บ</th>
                    <th className="py-3.5 px-4 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {equipments.map((eq) => (
                    <tr key={eq.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2.5">
                          <img
                            src={eq.imageUrl}
                            alt={eq.name}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 bg-white shrink-0"
                          />
                          <span className="font-mono font-bold text-slate-700">{eq.equipmentCode}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800 max-w-xs truncate">
                        {eq.name}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{eq.category}</td>
                      <td className="py-3 px-4 text-center font-bold">
                        <span className="text-emerald-600">{eq.availableQuantity}</span>
                        <span className="text-slate-400"> / {eq.totalQuantity}</span>
                      </td>
                      <td className="py-3 px-4">
                        {eq.status === 'available' && (
                          <span className="bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200/60">
                            พร้อมใช้งาน
                          </span>
                        )}
                        {eq.status === 'maintenance' && (
                          <span className="bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded-full border border-amber-200/60">
                            ซ่อมบำรุง
                          </span>
                        )}
                        {eq.status === 'out_of_stock' && (
                          <span className="bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full">
                            ถูกยืมหมด
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-[150px] truncate">
                        {eq.location || '-'}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => {
                            setSelectedEquipmentForEdit(eq);
                            setIsEquipModalOpen(true);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="แก้ไข"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmTarget({ id: eq.id, name: eq.name })}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="ลบ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REGISTERED USERS DIRECTORY (มุมมองผู้ใช้งาน) */}
      {activeAdminTab === 'users' && (
        <div className="space-y-4">
          {/* Header & Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-800 text-base">มุมมองข้อมูลและประวัติผู้ใช้งาน</h3>
              <p className="text-xs text-slate-500">
                รายชื่อนักศึกษาและอาจารย์ที่ลงทะเบียนเข้าใช้งานระบบ ติดตามอุปกรณ์ที่กำลังยืมและประวัติการยืม-คืน
              </p>
            </div>

            <div className="flex items-center space-x-2 text-xs">
              <span className="bg-blue-50 text-blue-700 font-semibold px-3 py-1 rounded-xl border border-blue-200/60">
                ลงทะเบียนแล้ว {users.length} คน
              </span>
              <span className="bg-amber-50 text-amber-700 font-semibold px-3 py-1 rounded-xl border border-amber-200/60">
                กำลังยืมของอยู่ {users.filter(u => borrowRequests.some(r => r.userId === u.uid && r.status === 'approved')).length} คน
              </span>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="ค้นหาชื่อ, รหัสนักศึกษา, เบอร์โทร, ภาควิชา..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl overflow-x-auto text-xs">
              <button
                onClick={() => setUserFilter('all')}
                className={`px-3 py-1.5 font-semibold rounded-lg transition ${
                  userFilter === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ทั้งหมด ({users.length})
              </button>
              <button
                onClick={() => setUserFilter('borrowing')}
                className={`px-3 py-1.5 font-semibold rounded-lg transition ${
                  userFilter === 'borrowing' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                กำลังยืมอุปกรณ์ ({users.filter(u => borrowRequests.some(r => r.userId === u.uid && r.status === 'approved')).length})
              </button>
              <button
                onClick={() => setUserFilter('user')}
                className={`px-3 py-1.5 font-semibold rounded-lg transition ${
                  userFilter === 'user' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                นักศึกษา / ผู้ใช้ ({users.filter(u => u.role !== 'admin').length})
              </button>
              <button
                onClick={() => setUserFilter('admin')}
                className={`px-3 py-1.5 font-semibold rounded-lg transition ${
                  userFilter === 'admin' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ผู้ดูแลระบบ ({users.filter(u => u.role === 'admin').length})
              </button>
            </div>
          </div>

          {/* User Cards Grid */}
          {users.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-500">
              ยังไม่มีข้อมูลผู้ใช้งานที่ลงทะเบียนในระบบ
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users
                .filter((user) => {
                  const s = userSearch.toLowerCase();
                  const matchesSearch =
                    (user.displayName && user.displayName.toLowerCase().includes(s)) ||
                    (user.studentId && user.studentId.toLowerCase().includes(s)) ||
                    (user.email && user.email.toLowerCase().includes(s)) ||
                    (user.phoneNumber && user.phoneNumber.toLowerCase().includes(s)) ||
                    (user.department && user.department.toLowerCase().includes(s));

                  const userActiveBorrowings = borrowRequests.filter(
                    (r) => r.userId === user.uid && r.status === 'approved'
                  ).length;

                  if (userFilter === 'borrowing') return matchesSearch && userActiveBorrowings > 0;
                  if (userFilter === 'user') return matchesSearch && user.role !== 'admin';
                  if (userFilter === 'admin') return matchesSearch && user.role === 'admin';
                  return matchesSearch;
                })
                .map((u) => {
                  const userRequests = borrowRequests.filter((r) => r.userId === u.uid);
                  const activeBorrowed = userRequests.filter((r) => r.status === 'approved').length;
                  const pendingReqs = userRequests.filter((r) => r.status === 'pending').length;
                  const returnedReqs = userRequests.filter((r) => r.status === 'returned').length;

                  return (
                    <div
                      key={u.uid}
                      className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                    >
                      <div>
                        {/* Avatar & Basic Info */}
                        <div className="flex items-start space-x-3.5 pb-3 border-b border-slate-100">
                          {u.photoURL ? (
                            <img
                              src={u.photoURL}
                              alt={u.displayName}
                              className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-500/20 shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 font-bold text-lg flex items-center justify-center shrink-0">
                              {u.displayName ? u.displayName.charAt(0) : 'U'}
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-1.5 flex-wrap">
                              <h4 className="font-bold text-slate-800 text-sm truncate" title={u.displayName}>
                                {u.displayName || 'ผู้ใช้งาน'}
                              </h4>
                              {u.role === 'admin' ? (
                                <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.2 rounded-full">
                                  ผู้ดูแล
                                </span>
                              ) : (
                                <span className="text-[10px] bg-slate-100 text-slate-600 font-medium px-2 py-0.2 rounded-full">
                                  ผู้ใช้ทั่วไป
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-500 truncate mt-0.5">{u.email}</p>
                          </div>
                        </div>

                        {/* ID, Phone, Department */}
                        <div className="py-3 space-y-1.5 text-xs">
                          {u.studentId ? (
                            <div className="flex items-center space-x-2 text-slate-700">
                              <Hash className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="font-semibold">รหัส: {u.studentId}</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2 text-slate-400">
                              <Hash className="w-3.5 h-3.5 shrink-0" />
                              <span>ยังไม่ระบุรหัส</span>
                            </div>
                          )}

                          {u.phoneNumber ? (
                            <div className="flex items-center space-x-2 text-slate-700">
                              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <a href={`tel:${u.phoneNumber}`} className="text-blue-600 hover:underline">
                                {u.phoneNumber}
                              </a>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2 text-slate-400">
                              <Phone className="w-3.5 h-3.5 shrink-0" />
                              <span>ยังไม่ระบุเบอร์โทร</span>
                            </div>
                          )}

                          <div className="flex items-center space-x-2 text-slate-600">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{u.department || 'ภาควิชาเทคโนโลยีการศึกษา'}</span>
                          </div>
                        </div>

                        {/* Borrowing stats pills */}
                        <div className="grid grid-cols-3 gap-1.5 py-2.5 bg-slate-50 rounded-xl px-2 text-center text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block">กำลังยืม</span>
                            <span className={`font-bold ${activeBorrowed > 0 ? 'text-amber-600' : 'text-slate-600'}`}>
                              {activeBorrowed}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">รออนุมัติ</span>
                            <span className={`font-bold ${pendingReqs > 0 ? 'text-blue-600' : 'text-slate-600'}`}>
                              {pendingReqs}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">คืนแล้ว</span>
                            <span className="font-bold text-emerald-600">
                              {returnedReqs}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action */}
                      <button
                        onClick={() => setSelectedUserForHistory(u)}
                        className="mt-3 w-full py-2 px-3 border border-slate-200 hover:bg-blue-50 hover:border-blue-200 text-slate-700 hover:text-blue-700 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>ดูประวัติการยืม ({userRequests.length} รายการ)</span>
                      </button>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ADMIN MEMBERS MANAGEMENT */}
      {activeAdminTab === 'admins' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">เพิ่มผู้ดูแลระบบใหม่ (Add Admin Member)</h3>
              <p className="text-xs text-slate-500">
                ตามข้อกำหนดระบบ: ผู้ดูแลระบบเริ่มต้นคืออีเมลเจ้าของระบบ และสามารถเพิ่มอีเมลของอาจารย์หรือเจ้าหน้าที่ท่านอื่นเพื่อเป็น Admin ร่วมได้
              </p>
            </div>

            {adminAddSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>เพิ่มอีเมลผู้ดูแลระบบเรียบร้อยแล้ว บัญชีนี้จะมีสิทธิ์ Admin ทันทีเมื่อเข้าสู่ระบบ</span>
              </div>
            )}

            <form onSubmit={handleAddAdmin} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Google Email ของผู้ดูแล <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="เช่น professor@gmail.com"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ตำแหน่ง / หมายเหตุ
                </label>
                <input
                  type="text"
                  placeholder="เช่น เจ้าหน้าที่ห้องแล็บ หรือ อาจารย์ผู้สอน"
                  value={newAdminNote}
                  onChange={(e) => setNewAdminNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isAddingAdmin}
                  className="w-full sm:w-auto px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center space-x-2 transition"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isAddingAdmin ? 'กำลังเพิ่ม...' : 'เพิ่มสิทธิ์ผู้ดูแลระบบ'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Current Admin List */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <h4 className="font-bold text-slate-800 text-sm mb-3">รายชื่อผู้ดูแลระบบในปัจจุบัน</h4>
            
            <div className="divide-y divide-slate-100">
              {/* Primary Super Admin */}
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                    SA
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-slate-800 text-xs">fluke12345638@gmail.com</span>
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                        เจ้าของระบบ (System Owner)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">สิทธิ์ผู้ดูแลระบบหลัก</p>
                  </div>
                </div>
              </div>

              {/* Added Admins */}
              {adminMembers.map((member) => (
                <div key={member.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                      AD
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-800 text-xs">{member.email}</span>
                        <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">
                          ผู้ดูแลระบบ
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {member.note || 'ผู้ดูแลระบบร่วม'} • เพิ่มโดย {member.addedBy || 'Admin'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setMemberToDelete({ id: member.id, email: member.email });
                    }}
                    className="text-xs text-rose-600 hover:text-rose-700 p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                    title="ลบสิทธิ์"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: RETURN INSPECTION MODAL */}
      {returnModalRequest && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-blue-600 text-white flex justify-between items-center">
              <h3 className="font-semibold text-base">ตรวจรับการคืนอุปกรณ์</h3>
              <button
                onClick={() => setReturnModalRequest(null)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReturn} className="p-6 space-y-4">
              {(() => {
                const todayMs = new Date().setHours(0, 0, 0, 0);
                const endMs = new Date(returnModalRequest.endDate).getTime();
                const daysDiff = Math.round((endMs - todayMs) / (1000 * 60 * 60 * 24));
                const isEarly = daysDiff > 0;

                return (
                  <>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                      <p className="font-bold text-slate-800">{returnModalRequest.equipmentName}</p>
                      <p className="text-slate-500">
                        ผู้ยืม: {returnModalRequest.userName} ({returnModalRequest.studentId || '-'})
                      </p>
                      <div className="flex justify-between text-slate-600 pt-1">
                        <span>จำนวน: {returnModalRequest.quantity} ชิ้น</span>
                        <span>กำหนดส่งคืนเดิม: {returnModalRequest.endDate}</span>
                      </div>
                    </div>

                    {isEarly && (
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 space-y-1">
                        <div className="flex items-center space-x-1.5 font-bold text-emerald-700">
                          <Sparkles className="w-4 h-4 text-emerald-600" />
                          <span>ส่งคืนก่อนกำหนด {daysDiff} วัน!</span>
                        </div>
                        <p className="text-[11px] text-emerald-600">
                          ผู้ยืมนำอุปกรณ์มาส่งคืนเร็วกว่ากำหนด ระบบจะบันทึกสถานะคืนก่อนกำหนดและเพิ่มจำนวนคงเหลือในคลังทันที
                        </p>
                        {returnModalRequest.isEarlyReturnRequested && returnModalRequest.earlyReturnNote && (
                          <p className="text-[11px] text-emerald-700 italic">
                            หมายเหตุจากผู้ยืม: "{returnModalRequest.earlyReturnNote}"
                          </p>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  ตรวจสอบสภาพอุปกรณ์ตอนคืน <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2.5 p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="radio"
                      name="condition"
                      checked={returnCondition === 'normal'}
                      onChange={() => setReturnCondition('normal')}
                      className="text-blue-600"
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-800 block">
                        สภาพสมบูรณ์ดี ครบถ้วน (Normal)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        อุปกรณ์และอุปกรณ์เสริมครบตามชุด พร้อมเปิดให้ยืมต่อ
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-2.5 p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="radio"
                      name="condition"
                      checked={returnCondition === 'damaged'}
                      onChange={() => setReturnCondition('damaged')}
                      className="text-amber-600"
                    />
                    <div>
                      <span className="text-xs font-semibold text-amber-700 block">
                        ชำรุด / ต้องส่งซ่อมบำรุง (Damaged / Maintenance)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        ระบบจะเปลี่ยนสถานะอุปกรณ์เป็น "ซ่อมบำรุง" ชั่วคราว
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-2.5 p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="radio"
                      name="condition"
                      checked={returnCondition === 'lost'}
                      onChange={() => setReturnCondition('lost')}
                      className="text-rose-600"
                    />
                    <div>
                      <span className="text-xs font-semibold text-rose-700 block">
                        สูญหาย / อุปกรณ์ไม่ครบ (Lost / Incomplete)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        ต้องส่งเรื่องชดใช้ค่าเสียหายตามระเบียบ
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  บันทึกการตรวจรับ / หมายเหตุจากเจ้าหน้าที่
                </label>
                <textarea
                  rows={2}
                  value={returnAdminNote}
                  onChange={(e) => setReturnAdminNote(e.target.value)}
                  placeholder="เช่น ตรวจสอบเลนส์และอุปกรณ์ครบถ้วน แบตเตอรี่ชาร์จเรียบร้อย"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setReturnModalRequest(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-xs rounded-xl hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isProcessingReturn}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs"
                >
                  {isProcessingReturn ? 'กำลังบันทึก...' : 'ยืนยันการรับคืนอุปกรณ์'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REJECT REQUEST MODAL */}
      {rejectModalRequest && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-rose-600 text-white flex justify-between items-center">
              <h3 className="font-semibold text-base">ปฏิเสธคำขอยืมอุปกรณ์</h3>
              <button
                onClick={() => setRejectModalRequest(null)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReject} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  เหตุผลในการปฏิเสธคำขอ <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="เช่น อุปกรณ์ติดคิวการใช้งานในชั้นเรียนภาคปกติ หรือ ผู้ยืมยังไม่ส่งคืนอุปกรณ์ชุดเดิม"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setRejectModalRequest(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-xs rounded-xl hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isProcessingReject}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs"
                >
                  {isProcessingReject ? 'กำลังบันทึก...' : 'ยืนยันปฏิเสธคำขอ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EQUIPMENT MANAGEMENT MODAL */}
      <EquipmentManagementModal
        equipment={selectedEquipmentForEdit}
        isOpen={isEquipModalOpen}
        onClose={() => setIsEquipModalOpen(false)}
        onSuccess={() => {
          onRefreshData();
        }}
      />

      {/* MODAL 4: USER BORROWING HISTORY MODAL */}
      {selectedUserForHistory && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-base sm:text-lg">
                    ประวัติการยืม-คืนของ {selectedUserForHistory.displayName}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedUserForHistory.studentId ? `รหัส ${selectedUserForHistory.studentId}` : selectedUserForHistory.email}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedUserForHistory(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Profile Summary */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-3">
                {selectedUserForHistory.photoURL ? (
                  <img
                    src={selectedUserForHistory.photoURL}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/30"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center">
                    {selectedUserForHistory.displayName?.charAt(0) || 'U'}
                  </div>
                )}
                <div>
                  <span className="font-bold text-slate-800 text-sm block">
                    {selectedUserForHistory.displayName}
                  </span>
                  <span className="text-slate-500">{selectedUserForHistory.email}</span>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-slate-600">
                {selectedUserForHistory.phoneNumber && (
                  <div>
                    <span className="text-slate-400 block text-[10px]">เบอร์โทร</span>
                    <a href={`tel:${selectedUserForHistory.phoneNumber}`} className="text-blue-600 font-medium">
                      {selectedUserForHistory.phoneNumber}
                    </a>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 block text-[10px]">สังกัด / สาขา</span>
                  <span className="font-medium text-slate-700">
                    {selectedUserForHistory.department || 'ภาควิชาเทคโนโลยีการศึกษา'}
                  </span>
                </div>
              </div>
            </div>

            {/* List of Requests for this user */}
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
              {borrowRequests.filter((r) => r.userId === selectedUserForHistory.uid).length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  ผู้ใช้งานรายนี้ยังไม่มีประวัติการส่งคำขอยืมอุปกรณ์
                </div>
              ) : (
                borrowRequests
                  .filter((r) => r.userId === selectedUserForHistory.uid)
                  .map((req) => (
                    <div
                      key={req.id}
                      className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-xs space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-3">
                          {req.equipmentImage ? (
                            <img
                              src={req.equipmentImage}
                              alt=""
                              className="w-11 h-11 rounded-lg object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                              <Package className="w-5 h-5 text-slate-400" />
                            </div>
                          )}

                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-mono font-bold text-slate-700">{req.equipmentCode}</span>
                              <span className="font-semibold text-slate-800">{req.equipmentName}</span>
                            </div>
                            <span className="text-slate-500">จำนวน: {req.quantity} ชิ้น</span>
                          </div>
                        </div>

                        <div>
                          {req.status === 'pending' && (
                            <span className="bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded-full border border-amber-200/60">
                              รออนุมัติ
                            </span>
                          )}
                          {req.status === 'approved' && (
                            <span className="bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-200/60">
                              กำลังยืม
                            </span>
                          )}
                          {req.status === 'returned' && (
                            <span className="bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200/60">
                              คืนแล้ว
                            </span>
                          )}
                          {req.status === 'rejected' && (
                            <span className="bg-rose-50 text-rose-700 font-semibold px-2 py-0.5 rounded-full border border-rose-200/60">
                              ปฏิเสธ
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-lg p-2 text-slate-600 space-y-0.5">
                        <p>
                          <span className="font-semibold text-slate-700">วันที่ยืม-คืน: </span>
                          {req.startDate} ถึง {req.endDate}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-700">วัตถุประสงค์: </span>
                          {req.purpose}
                        </p>
                        {req.adminNote && (
                          <p className="text-amber-700">
                            <span className="font-semibold">หมายเหตุเจ้าหน้าที่: </span>
                            {req.adminNote}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>

            <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex justify-end">
              <button
                onClick={() => setSelectedUserForHistory(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 font-medium transition cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SEED CONFIRM MODAL */}
      {seedConfirmOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-blue-600 dark:text-blue-400">
              <div className="p-2 bg-blue-50 dark:bg-blue-950/60 rounded-xl">
                <Sparkles className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-white text-base">นำเข้าข้อมูลตัวอย่าง?</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">อุปกรณ์ภาควิชาเทคโนโลยีการศึกษา</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              คุณต้องการนำเข้าข้อมูลอุปกรณ์ตัวอย่างมาตรฐาน เช่น กล้อง ไมโครโฟน ไฟสตูดิโอ เข้าสู่ระบบหรือไม่?
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setSeedConfirmOpen(false)}
                className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSeedData}
                disabled={isSeeding}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                {isSeeding ? 'กำลังนำเข้า...' : 'ยืนยันนำเข้าข้อมูล'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE EQUIPMENT CONFIRM MODAL */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400">
              <div className="p-2 bg-rose-50 dark:bg-rose-950/60 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-white text-base">ลบอุปกรณ์?</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">การกระทำนี้ไม่สามารถย้อนกลับได้</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              คุณแน่ใจหรือไม่ว่าต้องการลบ <strong>"{deleteConfirmTarget.name}"</strong> ออกจากระบบคลังอุปกรณ์?
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setDeleteConfirmTarget(null)}
                className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => handleDeleteEquipment(deleteConfirmTarget.id, deleteConfirmTarget.name)}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE ADMIN MEMBER CONFIRM MODAL */}
      {memberToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400">
              <div className="p-2 bg-rose-50 dark:bg-rose-950/60 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-white text-base">ยกเลิกสิทธิ์ Admin?</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">ลบสิทธิ์ผู้ดูแลระบบร่วม</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              คุณแน่ใจหรือไม่ว่าต้องการยกเลิกสิทธิ์ Admin ของ <strong>"{memberToDelete.email}"</strong>?
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setMemberToDelete(null)}
                className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  const id = memberToDelete.id;
                  setMemberToDelete(null);
                  removeAdminMember(id);
                }}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                ยืนยันการยกเลิกสิทธิ์
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
