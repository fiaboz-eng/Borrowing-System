import React, { useState, useEffect } from 'react';
import { X, Upload, Image as ImageIcon, CheckCircle, Package, Trash2, AlertCircle } from 'lucide-react';
import { addDoc, updateDoc, doc, collection } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Equipment, EquipmentStatus, EQUIPMENT_CATEGORIES } from '../types';

interface EquipmentManagementModalProps {
  equipment: Equipment | null; // If null, mode is ADD, otherwise EDIT
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PRESET_SAMPLE_IMAGES = [
  { label: 'กล้อง Sony Mirrorless', url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80' },
  { label: 'กล้อง Canon EOS', url: 'https://images.unsplash.com/photo-1502982720700-bfff97f2da6d?auto=format&fit=crop&w=800&q=80' },
  { label: 'ไมค์ลอยไร้สาย Rode', url: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80' },
  { label: 'ไมค์สตูดิโอ Shure', url: 'https://images.unsplash.com/photo-1583795128727-6ec3642408f8?auto=format&fit=crop&w=800&q=80' },
  { label: 'ขาตั้งกล้อง Manfrotto', url: 'https://images.unsplash.com/photo-1495707902641-75cac588d2e9?auto=format&fit=crop&w=800&q=80' },
  { label: 'กิมบอล DJI RS3', url: 'https://images.unsplash.com/photo-1588702547923-7093a6c3ba33?auto=format&fit=crop&w=800&q=80' },
  { label: 'ไฟสตูดิโอ Amaran', url: 'https://images.unsplash.com/photo-1527011046414-4781f1f94f8c?auto=format&fit=crop&w=800&q=80' },
  { label: 'โปรเจกเตอร์ Epson', url: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80' },
  { label: 'แว่น VR Quest', url: 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?auto=format&fit=crop&w=800&q=80' },
];

export const EquipmentManagementModal: React.FC<EquipmentManagementModalProps> = ({
  equipment,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [equipmentCode, setEquipmentCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(EQUIPMENT_CATEGORIES[0]);
  const [totalQuantity, setTotalQuantity] = useState(1);
  const [availableQuantity, setAvailableQuantity] = useState(1);
  const [status, setStatus] = useState<EquipmentStatus>('available');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [accessories, setAccessories] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (equipment) {
      setEquipmentCode(equipment.equipmentCode);
      setName(equipment.name);
      setCategory(equipment.category as any);
      setTotalQuantity(equipment.totalQuantity);
      setAvailableQuantity(equipment.availableQuantity);
      setStatus(equipment.status);
      setImageUrl(equipment.imageUrl);
      setDescription(equipment.description);
      setLocation(equipment.location || '');
      setAccessories(equipment.accessories || '');
    } else {
      setEquipmentCode(`EQ-${Math.floor(100 + Math.random() * 900)}`);
      setName('');
      setCategory(EQUIPMENT_CATEGORIES[0]);
      setTotalQuantity(1);
      setAvailableQuantity(1);
      setStatus('available');
      setImageUrl(PRESET_SAMPLE_IMAGES[0].url);
      setDescription('');
      setLocation('ห้องสตูดิโอเทคโนโลยีการศึกษา');
      setAccessories('');
    }
    setErrorMsg('');
  }, [equipment, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('ขนาดไฟล์ภาพต้องไม่เกิน 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setImageUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!equipmentCode.trim() || !name.trim()) {
      setErrorMsg('กรุณากรอกรหัสอุปกรณ์และชื่ออุปกรณ์');
      return;
    }

    if (totalQuantity < 1) {
      setErrorMsg('จำนวนทั้งหมดต้องมีอย่างน้อย 1 ชิ้น');
      return;
    }

    if (availableQuantity > totalQuantity) {
      setErrorMsg('จำนวนคงเหลือต้องไม่มากกว่าจำนวนทั้งหมด');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        equipmentCode: equipmentCode.trim(),
        name: name.trim(),
        category,
        totalQuantity: Number(totalQuantity),
        availableQuantity: Number(availableQuantity),
        status,
        imageUrl: imageUrl.trim() || PRESET_SAMPLE_IMAGES[0].url,
        description: description.trim(),
        location: location.trim(),
        accessories: accessories.trim(),
        updatedAt: new Date().toISOString(),
      };

      if (equipment) {
        // Edit
        await updateDoc(doc(db, 'equipments', equipment.id), payload).catch((err) => {
          handleFirestoreError(err, OperationType.UPDATE, `equipments/${equipment.id}`);
        });
      } else {
        // Create
        await addDoc(collection(db, 'equipments'), {
          ...payload,
          createdAt: new Date().toISOString(),
        }).catch((err) => {
          handleFirestoreError(err, OperationType.CREATE, 'equipments');
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาตรวจสอบสิทธิ์ของผู้ดูแลระบบ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150 my-6">
        <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                {equipment ? 'แก้ไขข้อมูลอุปกรณ์' : 'เพิ่มอุปกรณ์ใหม่ในระบบ'}
              </h3>
              <p className="text-xs text-slate-400">คลังพัสดุภาควิชาเทคโนโลยีการศึกษา</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Code & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                รหัสอุปกรณ์ (Equipment Code) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={equipmentCode}
                onChange={(e) => setEquipmentCode(e.target.value)}
                placeholder="เช่น CAM-01, MIC-03"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl font-mono uppercase focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                หมวดหมู่อุปกรณ์ <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {EQUIPMENT_CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              ชื่ออุปกรณ์ / ยี่ห้อ / รุ่น <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น Sony Alpha 7 IV พร้อมเลนส์ 28-70mm"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Quantities & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                จำนวนทั้งหมด (ชิ้น) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                required
                value={totalQuantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setTotalQuantity(val);
                  if (availableQuantity > val) setAvailableQuantity(val);
                }}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-center font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                จำนวนคงเหลือพร้อมยืม <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                max={totalQuantity}
                required
                value={availableQuantity}
                onChange={(e) => setAvailableQuantity(parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-center font-bold text-emerald-600 dark:text-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                สถานะอุปกรณ์ <span className="text-rose-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as EquipmentStatus)}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
              >
                <option value="available" className="bg-white dark:bg-slate-800">พร้อมให้ยืม (Available)</option>
                <option value="maintenance" className="bg-white dark:bg-slate-800">ซ่อมบำรุง (Maintenance)</option>
                <option value="out_of_stock" className="bg-white dark:bg-slate-800">หมดคลัง (Out of Stock)</option>
              </select>
            </div>
          </div>

          {/* Image Upload / Presets / URL */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-3">
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
              รูปภาพอุปกรณ์ (Image Management)
            </label>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-24 h-24 rounded-xl object-cover border border-slate-300 dark:border-slate-700 shadow-xs shrink-0 bg-white dark:bg-slate-800"
                />
              ) : (
                <div className="w-24 h-24 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 flex items-center justify-center shrink-0">
                  <ImageIcon className="w-8 h-8" />
                </div>
              )}

              <div className="flex-1 w-full space-y-2">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="ใส่ Image URL หรือเลือกภาพด้านล่าง"
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />

                <div className="flex items-center space-x-2">
                  <label className="cursor-pointer bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition">
                    <Upload className="w-3.5 h-3.5" />
                    <span>อัปโหลดภาพจากเครื่อง</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">JPG, PNG ขนาดไม่เกิน 2MB</span>
                </div>
              </div>
            </div>

            {/* Presets */}
            <div>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1.5">
                เลือกรูปภาพตัวอย่างมาตรฐานที่พร้อมใช้งาน:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_SAMPLE_IMAGES.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setImageUrl(preset.url)}
                    className="text-[11px] bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-300 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-md transition cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Location & Accessories */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                สถานที่จัดเก็บ (Location)
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="เช่น ตู้ A-01 ห้องสตูดิโอเทคโนโลยีการศึกษา"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                อุปกรณ์ในชุด (Accessories ในเซ็ต)
              </label>
              <input
                type="text"
                value={accessories}
                onChange={(e) => setAccessories(e.target.value)}
                placeholder="เช่น บอดี้, เลนส์, แบตเตอรี่ 2 ก้อน, สายคล้อง, กระเป๋า"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              รายละเอียดสเปคและข้อกำหนดการใช้งาน
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="รายละเอียดคุณสมบัติเฉพาะ คำแนะนำการดูแลรักษา หรือสเปคเครื่อง"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Footer Actions */}
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
              disabled={isSubmitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-xs transition cursor-pointer"
            >
              {isSubmitting ? 'กำลังบันทึก...' : equipment ? 'บันทึกการแก้ไข' : 'เพิ่มอุปกรณ์'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
