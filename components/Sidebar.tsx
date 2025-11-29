

import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, Building2, CalendarRange, MessageSquare, FileBarChart, X, Database, ListTodo, Wallet, Banknote, LifeBuoy } from 'lucide-react';
import { clsx } from 'clsx';
import { UserRole } from '../types';

interface SidebarProps {
  isOpen: boolean;
  closeSidebar: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, closeSidebar }) => {
  const { user } = useAuth();

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    clsx(
      "flex items-center p-3 text-base font-medium rounded-lg transition-colors group",
      isActive
        ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
        : "text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
    );

  const isAdmin = user?.role === UserRole.ADMIN;
  
  return (
    <aside
      className={clsx(
        "fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-transform bg-white border-r border-gray-200 dark:bg-gray-800 dark:border-gray-700",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
    >
      <div className="h-full px-3 pb-4 overflow-y-auto">
        <div className="flex justify-end lg:hidden mb-4">
            <button onClick={closeSidebar} className="p-2 text-gray-500">
                <X size={24} />
            </button>
        </div>
        <ul className="space-y-2">
          
          {/* USER MENU */}
          {!isAdmin && (
             <>
                 <li>
                    <NavLink to="/user/dashboard" className={navItemClass} onClick={closeSidebar}>
                      <ListTodo className="w-5 h-5 mr-3" />
                      Görevlerim & Panelim
                    </NavLink>
                 </li>
                 <li>
                    <NavLink to="/user/wallet" className={navItemClass} onClick={closeSidebar}>
                      <Wallet className="w-5 h-5 mr-3" />
                      Cüzdanım & Ödeme
                    </NavLink>
                 </li>
                 <li>
                    <NavLink to="/user/support" className={navItemClass} onClick={closeSidebar}>
                      <LifeBuoy className="w-5 h-5 mr-3" />
                      Destek Talepleri
                    </NavLink>
                 </li>
             </>
          )}

          {/* ADMIN MENU */}
          {isAdmin && (
            <>
              <li>
                <NavLink to="/admin/dashboard" className={navItemClass} onClick={closeSidebar}>
                  <LayoutDashboard className="w-5 h-5 mr-3" />
                  Dashboard
                </NavLink>
              </li>
              <li>
                <NavLink to="/admin/users" className={navItemClass} onClick={closeSidebar}>
                  <Users className="w-5 h-5 mr-3" />
                  Kullanıcı Yönetimi
                </NavLink>
              </li>
              <li>
                <NavLink to="/admin/businesses" className={navItemClass} onClick={closeSidebar}>
                  <Building2 className="w-5 h-5 mr-3" />
                  İşletmeler
                </NavLink>
              </li>
              <li>
                <NavLink to="/admin/assignments" className={navItemClass} onClick={closeSidebar}>
                  <CalendarRange className="w-5 h-5 mr-3" />
                  Görev Atama
                </NavLink>
              </li>
              <li>
                <NavLink to="/admin/reviews" className={navItemClass} onClick={closeSidebar}>
                  <MessageSquare className="w-5 h-5 mr-3" />
                  Yorum Kontrol
                </NavLink>
              </li>
              <li>
                <NavLink to="/admin/reports" className={navItemClass} onClick={closeSidebar}>
                  <FileBarChart className="w-5 h-5 mr-3" />
                  Raporlar & Takvim
                </NavLink>
              </li>
               <li>
                <NavLink to="/admin/pool" className={navItemClass} onClick={closeSidebar}>
                  <Database className="w-5 h-5 mr-3" />
                  Yorum Havuzu & AI
                </NavLink>
              </li>
              <li>
                <NavLink to="/admin/payments" className={navItemClass} onClick={closeSidebar}>
                  <Banknote className="w-5 h-5 mr-3" />
                  Ödeme Talepleri
                </NavLink>
              </li>
              <li>
                <NavLink to="/admin/support" className={navItemClass} onClick={closeSidebar}>
                  <LifeBuoy className="w-5 h-5 mr-3" />
                  Destek Merkezi
                </NavLink>
              </li>
            </>
          )}
        </ul>
      </div>
    </aside>
  );
};