import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, title }) => {
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '#', icon: '🏠' },
    { name: 'Students', href: '#students', icon: '👨‍🎓' },
    { name: 'Faculty', href: '#faculty', icon: '👨‍🏫' },
    { name: 'Subjects', href: '#subjects', icon: '📚' },
    { name: 'Departments', href: '#departments', icon: '🏢' },
    { name: 'Reports', href: '#reports', icon: '📊' },
    { name: 'Settings', href: '#settings', icon: '⚙️' },
  ];

  const getNavigationByRole = () => {
    switch (user?.role) {
      case 'ADMIN':
        return navigation;
      case 'FACULTY':
        return [
          { name: 'Dashboard', href: '#', icon: '🏠' },
          { name: 'Attendance', href: '#attendance', icon: '📊' },
          { name: 'Assignments', href: '#assignments', icon: '📝' },
          { name: 'Notices', href: '#notices', icon: '📢' },
          { name: 'Reports', href: '#reports', icon: '📈' },
        ];
      case 'STUDENT':
        return [
          { name: 'Dashboard', href: '#', icon: '🏠' },
          { name: 'Attendance', href: '#attendance', icon: '📊' },
          { name: 'Assignments', href: '#assignments', icon: '📝' },
          { name: 'Notices', href: '#notices', icon: '📢' },
          { name: 'Profile', href: '#profile', icon: '👤' },
        ];
      default:
        return navigation;
    }
  };

  const getRoleColor = () => {
    switch (user?.role) {
      case 'ADMIN':
        return 'purple';
      case 'FACULTY':
        return 'green';
      case 'STUDENT':
        return 'blue';
      default:
        return 'gray';
    }
  };

  const roleColor = getRoleColor();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">ADIT</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{title}</h1>
                <p className="text-xs text-gray-600">ADIT Campus ERP</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${roleColor}-100 text-${roleColor}-800`}>
                  {user?.role}
                </span>
                <span className="text-sm text-gray-600">{user?.email}</span>
              </div>
              <button
                onClick={logout}
                className="bg-red-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <aside className="lg:w-64 flex-shrink-0">
            <nav className="space-y-1">
              {getNavigationByRole().map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {item.name}
                </a>
              ))}
            </nav>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1">
            <div className="bg-white rounded-lg shadow p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
