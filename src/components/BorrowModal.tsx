import React, { useState } from 'react';
import { X, Calendar, AlertCircle, CheckCircle, Package, FileText, UserCheck, Phone } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Equipment, BorrowRequest } from '../types';
import { useAuth } from '../context/AuthContext';

interface BorrowModalProps {
  equipment: Equipment | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const BorrowModal: React.FC<BorrowModalProps> = ({
  equipment,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser, userProfile, updateProfileData } = useAuth();

  const todayStr = new Date().toISOString().split('T')[0];
  const next3Days = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [quantity, setQuantity] = useState<number>(1);
  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(next3Days);
  const [purpose, setPurpose] = useState<string>('');
  const [studentId, setStudentId] = useState<string>(userProfile?.studentId || '');
  const [phoneNumber, setPhoneNumber] = useState<string>(userProfile?.phoneNumber || '');
  const [department, setDepartment] = useState<string>(userProfile?.department || 'ภาควิชาเทคโนโลยีการศึกษา');
  const [termsAccepted, setTermsAccepted] = useState<boolean>(true);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!isOpen || !equipment) return null;

  const maxAllowed = equipment.availableQuantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!currentUser) {
      setErrorMessage('กรุณาเข้าสู่ระบบก่อนส่งคำขอยืมอุปกรณ์');
      return;
    }

    if (quantity < 1 || quantity > maxAllowed) {
      setErrorMessage(`จำนวนที่ยืมต้องอยู่ระหว่าง 1 ถึง ${maxAllowed} รายการ`);
      return;
    }

    if (!startDate || !endDate) {
      setErrorMessage('กรุณาเลือกวันที่ต้องการยืมและวันที่กำหนดคืน');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setErrorMessage('วันที่กำหนดคืนต้องไม่ก่อนวันที่ต้องการยืม');
      return;
    }

    if (!purpose.trim()) {
      setErrorMessage('กรุณาระบุวัตถุประสงค์ในการยืมใช้งาน');
      return;
    }

    if (!studentId.trim() || !phoneNumber.trim()) {
      setErrorMessage('กรุณาระบุรหัสนักศึกษาและเบอร์โทรศัพท์สำหรับติดต่อ');
      return;
    }

    setIsSubmitting(true);
    try {
      // Auto-save contact info back to profile if missing
      if (!userProfile?.studentId || !userProfile?.phoneNumber) {
        await updateProfileData({
          studentId: studentId.trim(),
          phoneNumber: phoneNumber.trim(),
          department: department.trim(),
        }).catch(() => {});
      }

      const requestPayload: Omit<BorrowRequest, 'id'> = {
        equipmentId: equipment.id,
        equipmentName: equipment.name,
        equipmentCode: equipment.equipmentCode,
        equipmentImage: equipment.imageUrl || '',
        userId: currentUser.uid,
        userName: userProfile?.displayName || currentUser.displayName || 'ผู้ยืม',
        userEmail: currentUser.email || '',
        userPhone: phoneNumber.trim(),
        studentId: studentId.trim(),
        department: department.trim(),
        quantity: Number(quantity),
        startDate,
        endDate,
        purpose: purpose.trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'borrow_requests'), requestPayload).catch((err) => {
        handleFirestoreError(err, OperationType.CREATE, 'borrow_requests');
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMessage('เกิดข้อผิดพลาดในการส่งคำขอ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 to-blue-600 text-white flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">แบบฟอร์มขอจองยืมอุปกรณ์</h3>
              <p className="text-xs text-blue-100">ภาควิชาเทคโนโลยีการศึกษา</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Equipment Card */}
        <div className="px-6 pt-5 pb-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700 flex items-center space-x-4">
          <img
            src={equipment.imageUrl}
            alt={equipment.name}
            className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 bg-white dark:bg-slate-800"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-semibold bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-md">
                {equipment.equipmentCode}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{equipment.category}</span>
            </div>
            <h4 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base truncate mt-1">
              {equipment.name}
            </h4>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
              พร้อมให้ยืมในคลัง: <span className="font-bold">{equipment.availableQuantity}</span> / {equipment.totalQuantity} ชิ้น
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Quantity Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              จำนวนที่ต้องการยืม (สูงสุด {maxAllowed} ชิ้น) <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                min={1}
                max={maxAllowed}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(maxAllowed, parseInt(e.target.value) || 1)))}
                className="w-28 px-3.5 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition font-semibold text-center"
              />
              <span className="text-xs text-slate-500 dark:text-slate-400">ชิ้น/ชุด</span>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                วันที่ต้องการรับอุปกรณ์ <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="date"
                  required
                  min={todayStr}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                วันที่กำหนดส่งคืน <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="date"
                  required
                  min={startDate || todayStr}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Borrower Identification Contact */}
          <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/40 rounded-xl border border-blue-100/80 dark:border-blue-900/60 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-semibold text-blue-900 dark:text-blue-200">
              <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>ข้อมูลผู้ยืมและช่องทางติดต่อ</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  รหัสนักศึกษา / รหัสอาจารย์ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น 64010123"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  เบอร์โทรศัพท์มือถือ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="เช่น 089-123-4567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                สังกัด / สาขาวิชา / รายวิชา
              </label>
              <input
                type="text"
                placeholder="เช่น ภาควิชาเทคโนโลยีการศึกษา หรือ วิชา ET302 สื่อดิจิทัล"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              วัตถุประสงค์ในการยืมใช้งาน <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <textarea
                required
                rows={3}
                maxLength={800}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="ระบุรายละเอียด เช่น ใช้สำหรับบันทึกเทปรายการสัมภาษณ์วิชาการ หรือ ถ่ายทำคลิปวิดีโอโครงงานปริญญานิพนธ์"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 block text-right">
              {purpose.length}/800 ตัวอักษร
            </span>
          </div>

          {/* Terms checkbox */}
          <div className="flex items-start space-x-2 pt-1">
            <input
              type="checkbox"
              id="terms"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 dark:border-slate-600 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="terms" className="text-xs text-slate-600 dark:text-slate-400 leading-snug cursor-pointer select-none">
              ข้าพเจ้ายินยอมปฏิบัติตามระเบียบการยืม-คืนอุปกรณ์ของภาควิชาเทคโนโลยีการศึกษา
              และจะดูแลรักษาอุปกรณ์ให้อยู่ในสภาพสมบูรณ์ หากชำรุดหรือสูญหายยินดีรับผิดชอบตามระเบียบ
            </label>
          </div>

          {/* Actions */}
          <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !termsAccepted}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-xs transition flex items-center space-x-2 cursor-pointer"
            >
              {isSubmitting ? (
                <span>กำลังส่งคำขอ...</span>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>ยืนยันการส่งคำขอจอง</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
