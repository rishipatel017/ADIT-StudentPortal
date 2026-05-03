import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../UI/Icon';

import { NotificationBell } from './NotificationBell';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

const ModernLayout: React.FC<LayoutProps> = ({ children, title = 'ADIT Campus ERP' }) => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const displayName = user?.student?.name || user?.faculty?.name || user?.admin?.name || user?.email || '';

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/auth/login');
    }
  };

  const getNavigationItems = () => {
    if (!user) return [];

    const baseItems = [
      { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', href: '/dashboard' },
    ];

    if (user.role === 'ADMIN') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', href: '/dashboard/admin?tab=dashboard' },
        { id: 'students', label: 'Students', icon: 'students', href: '/dashboard/admin?tab=students' },
        { id: 'faculty', label: 'Faculty', icon: 'faculty', href: '/dashboard/admin?tab=faculty' },
        { id: 'subjects', label: 'Subjects', icon: 'subjects', href: '/dashboard/admin?tab=subjects' },
        { id: 'departments', label: 'Departments', icon: 'departments', href: '/dashboard/admin?tab=departments' },
        { id: 'divisions', label: 'Divisions', icon: 'departments', href: '/dashboard/admin?tab=divisions' },
        { id: 'notices', label: 'Notices', icon: 'notices', href: '/dashboard/admin?tab=notices' },
        { id: 'faculty-assignment', label: 'Faculty Assignment', icon: 'assignments', href: '/dashboard/admin?tab=faculty-assignment' },
        { id: 'promotion', label: 'Promote Students', icon: 'reports', href: '/dashboard/admin?tab=promotion' },
        { id: 'reports', label: 'Reports', icon: 'reports', href: '/dashboard/admin?tab=reports' },
        { id: 'chat', label: 'Chat', icon: 'chat', href: '/dashboard/admin?tab=chat' },
      ];
    }

    if (user.role === 'FACULTY') {
      return [
        { id: 'overview', label: 'Overview', icon: 'dashboard', href: '/dashboard/faculty?tab=overview' },
        { id: 'profile', label: 'Profile', icon: 'settings', href: '/dashboard/faculty?tab=profile' },
        { id: 'subjects', label: 'Subjects', icon: 'subjects', href: '/dashboard/faculty?tab=subjects' },
        { id: 'attendance', label: 'Attendance', icon: 'attendance', href: '/dashboard/faculty?tab=attendance' },
        { id: 'students', label: 'Students', icon: 'students', href: '/dashboard/faculty?tab=students' },
        { id: 'assignments', label: 'Assignments', icon: 'assignments', href: '/dashboard/faculty?tab=assignments' },
        { id: 'marks', label: 'Marks', icon: 'marks', href: '/dashboard/faculty?tab=marks' },
        { id: 'notices', label: 'Notices', icon: 'notices', href: '/dashboard/faculty?tab=notices' },
        { id: 'reports', label: 'Reports', icon: 'reports', href: '/dashboard/faculty?tab=reports' },
        { id: 'chat', label: 'Chat', icon: 'chat', href: '/dashboard/faculty?tab=chat' },
      ];
    }

    if (user.role === 'STUDENT') {
      return [
        ...baseItems,
        { id: 'subjects', label: 'Subjects', icon: 'subjects', href: '/dashboard/student?tab=subjects' },
        { id: 'attendance', label: 'My Attendance', icon: 'attendance', href: '/dashboard/student?tab=attendance' },
        { id: 'assignments', label: 'Assignments', icon: 'assignments', href: '/dashboard/student?tab=assignments' },
        { id: 'marks', label: 'My Marks', icon: 'marks', href: '/dashboard/student?tab=marks' },
        { id: 'notices', label: 'Notices', icon: 'notices', href: '/dashboard/student?tab=notices' },
        { id: 'chat', label: 'Chat', icon: 'chat', href: '/dashboard/student?tab=chat' },
        { id: 'profile', label: 'Profile', icon: 'settings', href: '/dashboard/student?tab=profile' },
      ];
    }

    return baseItems;
  };

  const navigationItems = getNavigationItems();
  const currentPath = router.asPath;
  const activeItem = navigationItems.find(item => currentPath === item.href) || navigationItems[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="mobile-menu-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div className={`mobile-sidebar ${sidebarOpen ? '' : 'mobile-sidebar-closed'}`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <img src="/assets/adit.jpg?v=1" alt="ADIT Logo" className="w-10 h-10 object-contain rounded" />
            <div className="flex flex-col">
              <span className="text-lg font-bold text-blue-700 leading-none">ADIT</span>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Campus ERP</span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navigationItems.map((item) => (
            <a
              key={item.id}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                router.push(item.href);
                setSidebarOpen(false);
              }}
              className={`sidebar-item w-full ${activeItem?.id === item.id
                ? 'sidebar-item-active'
                : 'sidebar-item-inactive'
                }`}
            >
              <span className="mr-3">
                <Icon name={item.icon} size={20} />
              </span>
              {item.label}
            </a>
          ))}
          {user?.role !== 'STUDENT' && (
            <div className="pt-4 mt-4 border-t border-gray-200">
              <a
                key="mobile-profile"
                href="/dashboard/profile"
                onClick={(e) => {
                  e.preventDefault();
                  router.push('/dashboard/profile');
                  setSidebarOpen(false);
                }}
                className={`sidebar-item w-full ${router.pathname.includes('profile')
                  ? 'sidebar-item-active'
                  : 'sidebar-item-inactive'
                  }`}
              >
                <span className="mr-3">
                  <Icon name="settings" size={20} />
                </span>
                Profile
              </a>
            </div>
          )}
        </nav>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:z-50 lg:block">
        <div className="sidebar">
          <div className="flex items-center space-x-3 p-6 border-b border-gray-200 bg-gray-50/50">
            <img src="/assets/adit.jpg?v=1" alt="ADIT Logo" className="w-12 h-12 object-contain rounded-lg shadow-sm bg-white p-1" />
            <div className="flex flex-col">
              <span className="text-xl font-bold text-blue-700 tracking-tight leading-none">ADIT</span>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mt-1">Campus ERP</span>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            {navigationItems.map((item) => (
              <a
                key={item.id}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  router.push(item.href);
                }}
                className={`sidebar-item w-full ${activeItem?.id === item.id
                  ? 'sidebar-item-active'
                  : 'sidebar-item-inactive'
                  }`}
              >
                <span className="mr-3">
                  <Icon name={item.icon} size={20} />
                </span>
                {item.label}
              </a>
            ))}
            {user?.role !== 'STUDENT' && (
              <div className="pt-4 mt-4 border-t border-gray-200">
                <a
                  key="desktop-profile"
                  href="/dashboard/profile"
                  onClick={(e) => {
                    e.preventDefault();
                    router.push('/dashboard/profile');
                  }}
                  className={`sidebar-item w-full ${router.pathname.includes('profile')
                    ? 'sidebar-item-active'
                    : 'sidebar-item-inactive'
                    }`}
                >
                  <span className="mr-3">
                    <Icon name="settings" size={20} />
                  </span>
                  Profile
                </a>
              </div>
            )}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top navigation bar */}
        <header className="bg-white border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Mobile menu button */}
              <div className="flex items-center lg:hidden">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>

              {/* Page title */}
              <div className="flex-1">
                <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
              </div>

              {/* User menu */}
              <div className="flex items-center space-x-4">
                <NotificationBell />
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{displayName}</p>
                    <p className="text-xs text-gray-500">{user?.role}</p>
                  </div>
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700">
                      {displayName?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="btn-danger btn-sm"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default ModernLayout;
