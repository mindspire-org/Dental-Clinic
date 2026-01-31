import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'superadmin' | 'admin' | 'dentist' | 'receptionist';

export type LicenseState = {
  isActive: boolean;
  enabledModules: string[];
  licenseKey?: string;
};

interface RoleContextType {
  role: UserRole;
  authRole: UserRole;
  canSwitchRole: boolean;
  setRole: (role: UserRole) => void;
  userName: string;
  setUserName: (name: string) => void;
  permissions: string[];
  license?: LicenseState;
  setAuth: (next: Partial<{ role: UserRole; userName: string; permissions: string[]; license?: LicenseState }>) => void;
  resetAuth: () => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const [authRole, setAuthRole] = useState<UserRole>(() => {
    const stored = localStorage.getItem('role') as UserRole | null;
    return stored || 'admin';
  });

  const [role, setViewRoleState] = useState<UserRole>(() => {
    const storedView = localStorage.getItem('viewRole') as UserRole | null;
    const storedAuth = localStorage.getItem('role') as UserRole | null;
    const base = storedAuth || 'admin';
    if (base !== 'admin') return base;
    return storedView || base;
  });

  const userNames: Record<UserRole, string> = {
    superadmin: 'Software Owner',
    admin: 'Dr. Sarah Mitchell',
    dentist: 'Dr. James Wilson',
    receptionist: 'Emily Rodriguez'
  };

  const [userName, setUserName] = useState<string>(() => {
    const stored = localStorage.getItem('userName');
    return stored || userNames[authRole];
  });

  const [permissions, setPermissions] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('permissions');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [license, setLicense] = useState<LicenseState | undefined>(() => {
    try {
      const raw = localStorage.getItem('license');
      return raw ? JSON.parse(raw) : undefined;
    } catch {
      return undefined;
    }
  });

  const setRole = (nextRole: UserRole) => {
    if (authRole !== 'admin') {
      setViewRoleState(authRole);
      localStorage.removeItem('viewRole');
      return;
    }

    const allowed: UserRole[] = ['admin', 'dentist', 'receptionist'];
    const safeRole = allowed.includes(nextRole) ? nextRole : 'admin';
    setViewRoleState(safeRole);
    localStorage.setItem('viewRole', safeRole);
  };

  const setAuth: RoleContextType['setAuth'] = (next) => {
    if (next.role !== undefined) {
      localStorage.setItem('role', next.role);
      setAuthRole(next.role);

      if (next.role === 'admin') {
        const storedView = localStorage.getItem('viewRole') as UserRole | null;
        const view = storedView || 'admin';
        setViewRoleState(view);
        localStorage.setItem('viewRole', view);
      } else {
        setViewRoleState(next.role);
        localStorage.removeItem('viewRole');
      }
    }
    if (next.userName !== undefined) {
      setUserName(next.userName);
      localStorage.setItem('userName', next.userName);
    }
    if (next.permissions !== undefined) {
      setPermissions(next.permissions);
      localStorage.setItem('permissions', JSON.stringify(next.permissions));
    }
    if (next.license !== undefined) {
      setLicense(next.license);
      localStorage.setItem('license', JSON.stringify(next.license));
    }
  };

  const resetAuth = () => {
    setAuthRole('admin');
    setViewRoleState('admin');
    setPermissions([]);
    setLicense(undefined);
    const nextName = userNames.admin;
    setUserName(nextName);
    localStorage.removeItem('role');
    localStorage.removeItem('viewRole');
    localStorage.removeItem('permissions');
    localStorage.removeItem('license');
    localStorage.removeItem('userName');
  };

  return (
    <RoleContext.Provider value={{ role, authRole, canSwitchRole: authRole === 'admin', setRole, userName, setUserName, permissions, license, setAuth, resetAuth }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};
