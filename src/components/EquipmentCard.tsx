import React from 'react';
import { MapPin, Info, ArrowRight, Check, AlertCircle } from 'lucide-react';
import { Equipment } from '../types';

interface EquipmentCardProps {
  equipment: Equipment;
  onSelect: (equipment: Equipment) => void;
  onBorrow: (equipment: Equipment) => void;
}

export const EquipmentCard: React.FC<EquipmentCardProps> = ({
  equipment,
  onSelect,
  onBorrow,
}) => {
  const isAvailable = equipment.status === 'available' && equipment.availableQuantity > 0;
  const isOutOfStock = equipment.status === 'out_of_stock' || equipment.availableQuantity === 0;
  const isMaintenance = equipment.status === 'maintenance';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group hover:-translate-y-0.5">
      {/* Image container */}
      <div className="relative aspect-4/3 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <img
          src={equipment.imageUrl}
          alt={equipment.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Category & Code badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="font-mono text-xs font-bold bg-slate-900/80 text-white px-2 py-0.5 rounded-md backdrop-blur-xs shadow-xs">
            {equipment.equipmentCode}
          </span>
          <span className="text-[11px] font-medium bg-blue-600/90 text-white px-2 py-0.5 rounded-md backdrop-blur-xs">
            {equipment.category}
          </span>
        </div>

        {/* Real-time Status Badge */}
        <div className="absolute top-3 right-3">
          {isAvailable && (
            <span className="inline-flex items-center space-x-1.5 text-xs font-semibold bg-emerald-500/95 text-white px-2.5 py-1 rounded-full shadow-xs backdrop-blur-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
              <span>ว่าง ({equipment.availableQuantity})</span>
            </span>
          )}
          {isOutOfStock && (
            <span className="inline-flex items-center space-x-1 text-xs font-semibold bg-slate-800/90 text-slate-200 px-2.5 py-1 rounded-full shadow-xs backdrop-blur-xs">
              <span>ถูกยืมหมด</span>
            </span>
          )}
          {isMaintenance && (
            <span className="inline-flex items-center space-x-1 text-xs font-semibold bg-amber-500/95 text-white px-2.5 py-1 rounded-full shadow-xs backdrop-blur-xs">
              <span>ซ่อมบำรุง</span>
            </span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3
            onClick={() => onSelect(equipment)}
            className="font-bold text-slate-800 dark:text-white text-base leading-snug line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
            title={equipment.name}
          >
            {equipment.name}
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
            {equipment.description || 'ไม่มีข้อมูลรายละเอียด'}
          </p>

          {equipment.location && (
            <div className="flex items-center text-xs text-slate-400 dark:text-slate-500 mt-3 space-x-1">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
              <span className="truncate">{equipment.location}</span>
            </div>
          )}
        </div>

        {/* Card Footer Info & Buttons */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="text-slate-500 dark:text-slate-400">จำนวนทั้งหมดในคลัง:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {equipment.availableQuantity} / {equipment.totalQuantity} ชิ้น
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onSelect(equipment)}
              className="w-full py-2 px-3 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-medium transition flex items-center justify-center space-x-1 cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>ดูข้อมูล</span>
            </button>

            <button
              onClick={() => onBorrow(equipment)}
              disabled={!isAvailable}
              className={`w-full py-2 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-1 shadow-xs cursor-pointer ${
                isAvailable
                  ? 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 !cursor-not-allowed'
              }`}
            >
              <span>{isAvailable ? 'จองยืม' : 'ไม่ว่าง'}</span>
              {isAvailable && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
