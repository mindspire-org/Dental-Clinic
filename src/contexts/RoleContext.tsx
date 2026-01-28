import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'admin' | 'dentist' | 'receptionist';

interface RoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  userName: string;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<UserRole>('admin');

  const userNames: Record<UserRole, string> = {
    admin: 'Dr. Sarah Mitchell',
    dentist: 'Dr. James Wilson',
    receptionist: 'Emily Rodriguez'
  };

  return (
    <RoleContext.Provider value={{ role, setRole, userName: userNames[role] }}>
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
