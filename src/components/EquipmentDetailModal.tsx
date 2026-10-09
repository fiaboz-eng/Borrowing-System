import React from 'react';
import { X, CheckCircle2, AlertTriangle, MapPin, PackageCheck, Info, Calendar } from 'lucide-react';
import { Equipment } from '../types';

interface EquipmentDetailModalProps {
  equipment: Equipment | null;
  isOpen: boolean;
  onClose: () => void;
  onBorrow: (equipment: Equipment) => void;
}

export const EquipmentDetailModal: React.FC<EquipmentDetailModalProps> = ({
  equipment,
  isOpen,
  onClose,
  onBorrow,
}) => {
  if (!isOpen || !equipment) return null;

  const isAvailable = equipment.status === 'available' && equipment.availableQuantity > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header with image */}
        <div className="relative h-64 sm:h-72 bg-slate-900">
          <img
            src={equipment.imageUrl}
            alt={equipment.name}
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-sm transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-6 right-6 text-white">
            <div className="flex items-center space-x-2 mb-1.5">
              <span className="font-mono text-xs font-bold bg-blue-500/90 text-white px-2.5 py-0.5 rounded-md backdrop-blur-xs">
                {equipment.equipmentCode}
              </span>
              <span className="text-xs bg-white/20 text-white/90 px-2 py-0.5 rounded-md backdrop-blur-xs">
                {equipment.category}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-snug">
              {equipment.name}
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-700">
            <div className="flex items-center space-x-2">
              {isAvailable ? (
                <>
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                    พร้อมให้ยืม (ว่าง {equipment.availableQuantity} จากทั้งหมด {equipment.totalQuantity} ชิ้น)
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                    {equipment.status === 'maintenance'
                      ? 'อยู่ระหว่างการซ่อมบำรุง'
                      : 'ถูกยืมครบแล้ว (0 ชิ้นคงเหลือ)'}
                  </span>
                </>
              )}
            </div>

            {equipment.location && (
              <div className="flex items-center text-xs text-slate-600 dark:text-slate-300 space-x-1">
                <MapPin className="w-3.5 h-3.5 text-blue-500" />
                <span>{equipment.location}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <Info className="w-4 h-4 text-slate-400" />
              <span>รายละเอียดคุณลักษณะและสเปค</span>
            </h4>
            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 p-3.5 rounded-xl whitespace-pre-line">
              {equipment.description || 'ไม่มีข้อมูลรายละเอียดเพิ่มเติม'}
            </p>
          </div>

          {/* Accessories included */}
          {equipment.accessories && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <PackageCheck className="w-4 h-4 text-blue-500" />
                <span>อุปกรณ์ประกอบในเซ็ต (ต้องส่งคืนครบชุด)</span>
              </h4>
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed bg-blue-50/50 dark:bg-blue-950/40 border border-blue-100/70 dark:border-blue-900/60 p-3.5 rounded-xl whitespace-pre-line">
                {equipment.accessories}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
            <button
              onClick={() => {
                onClose();
                onBorrow(equipment);
              }}
              disabled={!isAvailable}
              className={`px-6 py-2.5 text-sm font-semibold rounded-xl shadow-xs transition flex items-center space-x-2 ${
                isAvailable
                  ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer hover:shadow-md'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 !cursor-not-allowed'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>{isAvailable ? 'ส่งคำขอจองอุปกรณ์' : 'ไม่สามารถยืมได้ในขณะนี้'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
