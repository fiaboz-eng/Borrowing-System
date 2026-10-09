import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  onSnapshot,
  serverTimestamp,
  addDoc,
  deleteDoc
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  SUPER_ADMIN_EMAIL,
  handleFirestoreError,
  OperationType,
  testConnection
} from '../firebase';
import { UserProfile, AdminMember } from '../types';

export interface AuthError {
  code?: string;
  message: string;
  details?: string;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  loading: boolean;
  isLoggingIn: boolean;
  authError: AuthError | null;
  adminMembers: AdminMember[];
  loginWithGoogle: () => Promise<void>;
  loginWithGoogleRedirect: () => Promise<void>;
  clearAuthError: () => void;
  logout: () => Promise<void>;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
  addAdminMember: (email: string, note?: string) => Promise<void>;
  removeAdminMember: (memberId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [adminMembers, setAdminMembers] = useState<AdminMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [authError, setAuthError] = useState<AuthError | null>(null);

  const adminMembersRef = useRef<AdminMember[]>([]);
  useEffect(() => {
    adminMembersRef.current = adminMembers;
  }, [adminMembers]);

  // Test connection on mount
  useEffect(() => {
    testConnection();
  }, []);

  // Listen for redirect sign-in result (in case signInWithRedirect is used)
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.info('Signed in successfully via redirect:', result.user.email);
        }
      })
      .catch((error: any) => {
        if (error?.code && error.code !== 'auth/popup-closed-by-user') {
          console.warn('Redirect auth result info:', error);
        }
      });
  }, []);

  // Listen to admin_members collection
  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, 'admin_members'), (snapshot) => {
        const members: AdminMember[] = [];
        snapshot.forEach((docSnap) => {
          members.push({ id: docSnap.id, ...docSnap.data() } as AdminMember);
        });
        setAdminMembers(members);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'admin_members');
      });
      return () => unsub();
    } catch {
      // not yet authenticated
    }
  }, []);

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      setCurrentUser(user);

      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          let userSnap;
          try {
            userSnap = await getDoc(userDocRef);
          } catch (err) {
            handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
          }

          const normalizedEmail = (user.email || '').toLowerCase().trim();
          const isSuper = normalizedEmail === SUPER_ADMIN_EMAIL.toLowerCase();

          // Check if registered as admin in admin_members
          const isRegistered = adminMembersRef.current.some(
            (m) => m.email.toLowerCase().trim() === normalizedEmail
          );

          const determinedRole = (isSuper || isRegistered) ? 'admin' : 'user';

          if (!userSnap || !userSnap.exists()) {
            // First time login - auto create profile
            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || 'ผู้ใช้งาน',
              photoURL: user.photoURL || '',
              phoneNumber: user.phoneNumber || '',
              studentId: '',
              department: 'ภาควิชาเทคโนโลยีการศึกษา',
              role: determinedRole,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            await setDoc(userDocRef, newProfile).catch((err) => {
              handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
            });
            setUserProfile(newProfile);
          } else {
            const existingData = userSnap.data() as UserProfile;
            // If user's role status changed to admin by email registration, update it
            if ((isSuper || isRegistered) && existingData.role !== 'admin') {
              existingData.role = 'admin';
              await updateDoc(userDocRef, { role: 'admin' }).catch(() => {});
            }
            setUserProfile(existingData);
          }
        } catch (err) {
          console.error('Error handling user profile:', err);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const clearAuthError = () => {
    setAuthError(null);
  };

  const loginWithGoogle = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      const code = error?.code || '';
      const msg = error?.message || '';
      console.error('Google Sign-In Popup Error:', error);

      if (code === 'auth/popup-closed-by-user') {
        setAuthError({
          code,
          message: 'หน้าต่างเข้าสู่ระบบปิดลงก่อนดำเนินการเสร็จสิ้น',
          details: 'หากแท็บเด้งปิดเองทันที มักเกิดจากเบราว์เซอร์บล็อก Third-Party Cookies หรือ ป๊อปอัป กรุณาลองเลือก "เข้าสู่ระบบด้วย Redirect" หรือ "เปิดเว็บในแท็บแยก"',
        });
      } else if (code === 'auth/unauthorized-domain') {
        setAuthError({
          code,
          message: 'โดเมนยังไม่ได้รับอนุญาตใน Firebase Authentication',
          details: `โดเมน ${window.location.hostname} ยังไม่ได้เพิ่มใน Authorized Domains ของโปรเจกต์ Firebase`,
        });
      } else if (code === 'auth/popup-blocked') {
        setAuthError({
          code,
          message: 'เบราว์เซอร์ของคุณบล็อกหน้าต่างป๊อปอัป',
          details: 'โปรดตั้งค่าอนุญาตป๊อปอัปสำหรับเว็บไซต์นี้ หรือคลิกปุ่ม "เข้าสู่ระบบด้วย Redirect"',
        });
      } else if (code === 'auth/cancelled-popup-request') {
        console.info('Cancelled previous popup request.');
      } else {
        setAuthError({
          code,
          message: 'ไม่สามารถเข้าสู่ระบบด้วย Google ได้',
          details: msg || 'เกิดข้อผิดพลาดในการเชื่อมต่อบริการยืนยันตัวตน',
        });
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const loginWithGoogleRedirect = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (error: any) {
      console.error('Google Sign-In Redirect Error:', error);
      setAuthError({
        code: error?.code,
        message: 'ไม่สามารถเปิดหน้าต่างเข้าสู่ระบบด้วย Redirect ได้',
        details: error?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
      });
      setIsLoggingIn(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const updateProfileData = async (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const updatePayload = {
        ...data,
        updatedAt: new Date().toISOString(),
      };
      await updateDoc(userDocRef, updatePayload).catch((err) => {
        handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
      });
      setUserProfile((prev) => (prev ? { ...prev, ...updatePayload } : null));
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  const addAdminMember = async (email: string, note?: string) => {
    if (!currentUser) return;
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail) return;

    try {
      await addDoc(collection(db, 'admin_members'), {
        email: cleanEmail,
        role: 'admin',
        addedBy: currentUser.email || 'Admin',
        note: note || 'ผู้ดูแลระบบภาควิชา',
        createdAt: new Date().toISOString(),
      }).catch((err) => {
        handleFirestoreError(err, OperationType.CREATE, 'admin_members');
      });
    } catch (error) {
      console.error('Add admin member error:', error);
      throw error;
    }
  };

  const removeAdminMember = async (memberId: string) => {
    try {
      await deleteDoc(doc(db, 'admin_members', memberId)).catch((err) => {
        handleFirestoreError(err, OperationType.DELETE, `admin_members/${memberId}`);
      });
    } catch (error) {
      console.error('Remove admin member error:', error);
      throw error;
    }
  };

  const isSuperAdmin = Boolean(
    currentUser?.email && currentUser.email.toLowerCase().trim() === SUPER_ADMIN_EMAIL.toLowerCase()
  );

  const isRegisteredAdmin = Boolean(
    currentUser?.email &&
      adminMembers.some((m) => m.email.toLowerCase().trim() === currentUser.email?.toLowerCase().trim())
  );

  const isAdmin = isSuperAdmin || isRegisteredAdmin || userProfile?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        isAdmin,
        isSuperAdmin,
        loading,
        isLoggingIn,
        authError,
        adminMembers,
        loginWithGoogle,
        loginWithGoogleRedirect,
        clearAuthError,
        logout,
        updateProfileData,
        addAdminMember,
        removeAdminMember,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
