import React, { useState } from 'react';
import {
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  Calendar,
  AlertCircle,
  FileText,
  User,
  Package,
  ArrowRight,
  Trash2,
  Sparkles,
  Check,
  X
} from 'lucide-react';
import { updateDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { BorrowRequest, BorrowStatus } from '../types';

interface MyBookingsProps {
  bookings: BorrowRequest[];
  onBrowseCatalog: () => void;
}

export const MyBookings: React.FC<MyBookingsProps> = ({ bookings, onBrowseCatalog }) => {
  const [filter, setFilter] = useState<'all' | BorrowStatus>('all');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelConfirmBooking, setCancelConfirmBooking] = useState<BorrowRequest | null>(null);

  // Early return state
  const [earlyReturnTarget, setEarlyReturnTarget] = useState<BorrowRequest | null>(null);
  const [earlyReturnNote, setEarlyReturnNote] = useState('');
  const [isSubmittingEarlyReturn, setIsSubmittingEarlyReturn] = useState(false);
  const [earlyReturnSuccess, setEarlyReturnSuccess] = useState(false);
  const [earlyReturnError, setEarlyReturnError] = useState('');

  const filteredBookings = bookings.filter((b) => {
    if (filter === 'all') return true;
    return b.status === filter;
  });

  const handleCancelRequest = async (booking: BorrowRequest) => {
    setCancellingId(booking.id);
    try {
      await updateDoc(doc(db, 'borrow_requests', booking.id), {
        status: 'rejected',
        adminNote: 'ผู้ยืมยกเลิกคำขอด้วยตนเอง',
        updatedAt: new Date().toISOString(),
      }).catch((err) => {
        handleFirestoreError(err, OperationType.UPDATE, `borrow_requests/${booking.id}`);
      });
      setCancelConfirmBooking(null);
    } catch (err) {
      console.error('Cancel booking error:', err);
    } finally {
      setCancellingId(null);
    }
  };

  const handleConfirmEarlyReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!earlyReturnTarget) return;

    setIsSubmittingEarlyReturn(true);
    setEarlyReturnError('');
    try {
      await updateDoc(doc(db, 'borrow_requests', earlyReturnTarget.id), {
        isEarlyReturnRequested: true,
        earlyReturnRequestedAt: new Date().toISOString(),
        earlyReturnNote: earlyReturnNote.trim() || 'ผู้ยืมแจ้งส่งคืนก่อนกำหนด',
        updatedAt: new Date().toISOString(),
      }).catch((err) => {
        handleFirestoreError(err, OperationType.UPDATE, `borrow_requests/${earlyReturnTarget.id}`);
      });

      setEarlyReturnSuccess(true);
      setTimeout(() => {
        setEarlyReturnSuccess(false);
        setEarlyReturnTarget(null);
        setEarlyReturnNote('');
      }, 1500);
    } catch (err) {
      console.error('Early return request error:', err);
      setEarlyReturnError('เกิดข้อผิดพลาดในการแจ้งคืนก่อนกำหนด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmittingEarlyReturn(false);
    }
  };

  const getStatusBadge = (b: BorrowRequest) => {
    switch (b.status) {
      case 'pending':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>รอการอนุมัติ</span>
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Package className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>
              {b.isEarlyReturnRequested ? 'กำลังยืม (แจ้งคืนก่อนกำหนดแล้ว)' : 'กำลังยืมใช้งาน'}
            </span>
          </span>
        );
      case 'returned':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>
              {b.isReturnedEarly
                ? `ส่งคืนก่อนกำหนด (${b.daysReturnedEarly ? `เร็วขึ้น ${b.daysReturnedEarly} วัน` : 'เรียบร้อย'})`
                : 'ส่งคืนเรียบร้อยแล้ว'}
            </span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>ถูกปฏิเสธ / ยกเลิก</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Filter pills */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">ประวัติและการจองของฉัน</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            ติดตามสถานะคำขอยืมอุปกรณ์ ภาควิชาเทคโนโลยีการศึกษา
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer ${
              filter === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            ทั้งหมด ({bookings.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer ${
              filter === 'pending'
                ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            รออนุมัติ ({bookings.filter((b) => b.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer ${
              filter === 'approved'
                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            กำลังยืม ({bookings.filter((b) => b.status === 'approved').length})
          </button>
          <button
            onClick={() => setFilter('returned')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer ${
              filter === 'returned'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            คืนแล้ว ({bookings.filter((b) => b.status === 'returned').length})
          </button>
        </div>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/60 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="font-semibold text-slate-800 dark:text-white text-lg mb-1">ไม่พบรายการจอง</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
            คุณยังไม่มีรายการขอยืมอุปกรณ์ในสถานะนี้ สามารถเลือกดูรายการอุปกรณ์ที่พร้อมให้บริการได้เลย
          </p>
          <button
            onClick={onBrowseCatalog}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs inline-flex items-center space-x-2 transition cursor-pointer"
          >
            <span>ดูรายการอุปกรณ์ทั้งหมด</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => {
            const isPending = b.status === 'pending';
            const isApproved = b.status === 'approved';
            const todayMs = new Date().setHours(0, 0, 0, 0);
            const endMs = new Date(b.endDate).getTime();
            const isOverdue = isApproved && endMs < todayMs;
            const canReturnEarly = isApproved && !isOverdue;

            return (
              <div
                key={b.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="flex items-center space-x-3.5">
                    {b.equipmentImage ? (
                      <img
                        src={b.equipmentImage}
                        alt={b.equipmentName}
                        className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-50 dark:bg-slate-800"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Package className="w-7 h-7" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded">
                          {b.equipmentCode || 'ITEM'}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          ยื่นคำขอเมื่อ {new Date(b.createdAt).toLocaleDateString('th-TH')}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-800 dark:text-white text-base leading-snug mt-1">
                        {b.equipmentName}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-start sm:self-center">
                    {getStatusBadge(b)}
                    {isOverdue && (
                      <span className="text-xs bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded-full font-semibold border border-rose-200 dark:border-rose-800">
                        เกินกำหนดส่งคืน!
                      </span>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5">จำนวนที่ยืม</span>
                    <span className="font-bold text-slate-800 dark:text-white text-sm">{b.quantity} ชิ้น/ชุด</span>
                  </div>

                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5">ช่วงเวลาการยืม</span>
                    <div className="flex items-center space-x-1.5 text-slate-700 dark:text-slate-300 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      <span>{b.startDate}</span>
                      <span>ถึง</span>
                      <span className={isOverdue ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}>{b.endDate}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5">วัตถุประสงค์ในการใช้งาน</span>
                    <span className="text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {b.purpose}
                    </span>
                  </div>
                </div>

                {/* Early return notification banner if user already requested */}
                {isApproved && b.isEarlyReturnRequested && (
                  <div className="mt-4 p-3 bg-amber-50/80 dark:bg-amber-950/50 rounded-xl border border-amber-200/60 dark:border-amber-800 text-xs flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-amber-800 dark:text-amber-200">
                      <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>
                        <strong>คุณได้แจ้งคืนก่อนกำหนดแล้ว:</strong> กรุณานำอุปกรณ์มาส่งมอบที่ห้องพัสดุภาควิชาเทคโนโลยีการศึกษา
                      </span>
                    </div>
                    {b.earlyReturnNote && (
                      <span className="text-[11px] text-amber-700 dark:text-amber-300 italic hidden sm:inline">
                        "{b.earlyReturnNote}"
                      </span>
                    )}
                  </div>
                )}

                {/* Admin notes if returned or rejected */}
                {(b.adminNote || b.returnedCondition) && (
                  <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                    {b.adminNote && (
                      <div className="text-slate-600 dark:text-slate-300">
                        <span className="font-semibold text-slate-700 dark:text-slate-200">หมายเหตุจากเจ้าหน้าที่: </span>
                        {b.adminNote}
                      </div>
                    )}
                    {b.returnedCondition && (
                      <div className="text-slate-600 dark:text-slate-300 mt-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-200">สภาพอุปกรณ์ตอนคืน: </span>
                        {b.returnedCondition === 'normal' && 'สมบูรณ์ดี ครบถ้วน'}
                        {b.returnedCondition === 'damaged' && 'มีรอยชำรุด / เสียหาย'}
                        {b.returnedCondition === 'lost' && 'อุปกรณ์บางส่วนสูญหาย'}
                        {b.returnedCondition === 'needs_cleaning' && 'ต้องการทำความสะอาด'}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-400 dark:text-slate-500">
                    {isApproved && !isOverdue && (
                      <span>กำหนดส่งคืนภายในวันที่ {b.endDate}</span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Early Return Button for Borrower */}
                    {canReturnEarly && !b.isEarlyReturnRequested && (
                      <button
                        onClick={() => {
                          setEarlyReturnTarget(b);
                          setEarlyReturnNote('');
                          setEarlyReturnError('');
                        }}
                        className="text-xs bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold px-3.5 py-1.5 rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>แจ้งส่งคืนก่อนกำหนด</span>
                      </button>
                    )}

                    {/* Borrower cancel button if still pending */}
                    {isPending && (
                      <button
                        onClick={() => setCancelConfirmBooking(b)}
                        disabled={cancellingId === b.id}
                        className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-medium px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition flex items-center space-x-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{cancellingId === b.id ? 'กำลังยกเลิก...' : 'ยกเลิกคำขอจองนี้'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CANCEL CONFIRMATION MODAL */}
      {cancelConfirmBooking && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400">
              <div className="p-2 bg-rose-50 dark:bg-rose-950/60 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-white text-base">ยกเลิกคำขอจอง?</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">คำขอนี้จะถูกยกเลิกทันที</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              คุณต้องการยกเลิกคำขอจองอุปกรณ์ <strong>"{cancelConfirmBooking.equipmentName}"</strong> หรือไม่?
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setCancelConfirmBooking(null)}
                className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                ไม่ยกเลิก
              </button>
              <button
                onClick={() => handleCancelRequest(cancelConfirmBooking)}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                ยืนยันยกเลิกคำขอ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EARLY RETURN MODAL */}
      {earlyReturnTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-700 to-blue-600 text-white flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <RotateCcw className="w-5 h-5 text-blue-200" />
                <h3 className="font-semibold text-base">แจ้งส่งคืนอุปกรณ์ก่อนกำหนด</h3>
              </div>
              <button
                onClick={() => setEarlyReturnTarget(null)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmEarlyReturn} className="p-6 space-y-4">
              {earlyReturnError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{earlyReturnError}</span>
                </div>
              )}

              {earlyReturnSuccess ? (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-center space-y-2">
                  <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
                  <p className="font-bold text-sm">ส่งคำแจ้งคืนก่อนกำหนดเรียบร้อยแล้ว!</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                    กรุณานำอุปกรณ์มาส่งมอบที่ห้องพัสดุภาควิชา เพื่อให้เจ้าหน้าที่ตรวจรับอุปกรณ์
                  </p>
                </div>
              ) : (
                <>
                  <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900/60 text-xs space-y-1.5">
                    <p className="font-bold text-slate-800 dark:text-white text-sm">{earlyReturnTarget.equipmentName}</p>
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>รหัสอุปกรณ์:</span>
                      <span className="font-mono font-semibold">{earlyReturnTarget.equipmentCode}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>กำหนดส่งคืนเดิม:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{earlyReturnTarget.endDate}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>วันที่แจ้งส่งคืน:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {new Date().toISOString().split('T')[0]} (วันนี้)
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      หมายเหตุเพิ่มเติม (ถ้ามี)
                    </label>
                    <textarea
                      rows={2}
                      value={earlyReturnNote}
                      onChange={(e) => setEarlyReturnNote(e.target.value)}
                      placeholder="เช่น ถ่ายทำโครงงานเสร็จสิ้นก่อนกำหนด อุปกรณ์และสายสัญญาณครบถ้วน พร้อมส่งมอบ"
                      className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200/60 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 space-y-1">
                    <p className="font-semibold flex items-center space-x-1">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>ขั้นตอนการส่งคืนอุปกรณ์:</span>
                    </p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
                      เมื่อกดยืนยันแล้ว กรุณานำอุปกรณ์พร้อมอุปกรณ์ประกอบทั้งหมดมาส่งมอบและตรวจรับสภาพ ณ ห้องพัสดุภาควิชาเทคโนโลยีการศึกษา
                      เจ้าหน้าที่จะทำการบันทึกรับคืนและคืนสต็อกเข้าระบบทันที
                    </p>
                  </div>

                  <div className="pt-2 flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setEarlyReturnTarget(null)}
                      className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingEarlyReturn}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>{isSubmittingEarlyReturn ? 'กำลังส่งข้อมูล...' : 'ยืนยันแจ้งคืนก่อนกำหนด'}</span>
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
