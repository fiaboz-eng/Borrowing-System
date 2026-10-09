export type UserRole = 'user' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  studentId?: string;
  department?: string;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
}

export type EquipmentStatus = 'available' | 'maintenance' | 'out_of_stock';

export interface Equipment {
  id: string;
  equipmentCode: string; // e.g. CAM-01, MIC-02
  name: string;
  category: string;
  totalQuantity: number;
  availableQuantity: number;
  status: EquipmentStatus;
  imageUrl: string;
  description: string;
  location?: string;
  accessories?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type BorrowStatus = 'pending' | 'approved' | 'rejected' | 'returned';

export type ReturnedCondition = 'normal' | 'damaged' | 'lost' | 'needs_cleaning';

export interface BorrowRequest {
  id: string;
  equipmentId: string;
  equipmentName: string;
  equipmentCode: string;
  equipmentImage?: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  studentId?: string;
  department?: string;
  quantity: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  purpose: string;
  status: BorrowStatus;
  adminNote?: string;
  approvedBy?: string;
  approvedAt?: string;
  returnedAt?: string;
  returnedCondition?: ReturnedCondition;
  isEarlyReturnRequested?: boolean;
  earlyReturnRequestedAt?: string;
  earlyReturnNote?: string;
  isReturnedEarly?: boolean;
  daysReturnedEarly?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface AdminMember {
  id: string;
  email: string;
  role: 'admin';
  addedBy?: string;
  note?: string;
  createdAt?: string;
}

export const EQUIPMENT_CATEGORIES = [
  'กล้องและเลนส์',
  'ไมโครโฟนและระบบเสียง',
  'ขาตั้งกล้องและไม้กันสั่น',
  'โปรเจกเตอร์และจอภาพ',
  'ไฟสตูดิโอและจัดแสง',
  'อุปกรณ์ VR & นวัตกรรมการศึกษา',
  'อุปกรณ์คอมพิวเตอร์และตัดต่อ',
  'อื่นๆ'
] as const;
