import { ReactNode, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  LogOut,
  PlusCircle,
  FileText,
  BarChart3,
  User,
  UserCircle,
  Sparkles
} from 'lucide-react';
import Snowfall from './Snowfall';

interface LayoutProps {
  children: ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
  isSnowEnabled: boolean;
  onToggleSnow: () => void;
}

export default function Layout({ children, currentView, onNavigate, isSnowEnabled, onToggleSnow }: LayoutProps) {
  const { user, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuItems = [
    { id: 'quiz-list', label: 'Danh sách đề', icon: FileText },
    { id: 'create-quiz', label: 'Tạo đề mới', icon: PlusCircle },
    { id: 'analytics', label: 'Phân tích kiến thức', icon: BarChart3 },
    { id: 'my-results', label: 'Kết quả của tôi', icon: BarChart3 },
    { id: 'profile', label: 'Thông tin cá nhân', icon: UserCircle }
  ];

  return (
    <div className="relative h-screen bg-gray-50 pt-16 overflow-hidden">
      <header className="fixed top-0 left-0 right-0 bg-[#124874] text-white shadow-md z-20">
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo-hcmue.png"
              alt="Logo hệ thống trắc nghiệm"
              className="w-24 h-12 object-contain"
            />
            <h1 className="text-2xl font-extrabold tracking-wide">
              HỆ THỐNG TRẮC NGHIỆM MẠNG MÁY TÍNH
            </h1>
          </div>

          <div className="relative flex items-center">
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(prev => !prev)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded hover:bg-white/20 transition-colors text-sm"
            >
              <User className="w-4 h-4" />
              <div className="text-sm">
                <p className="font-medium">{user?.name}</p>
              </div>
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white text-gray-800 rounded shadow-lg border border-gray-200 py-1 z-30">
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('profile');
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100"
                >
                  <UserCircle className="w-4 h-4 text-[#124874]" />
                  <span>Thông tin cá nhân</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onToggleSnow();
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100"
                >
                  <Sparkles className="w-4 h-4 text-[#124874]" />
                  <span>{isSnowEnabled ? 'Tắt tuyết rơi' : 'Bật tuyết rơi'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="relative flex h-[calc(100vh-4rem)] z-10">
        <aside className="fixed top-16 left-0 w-64 bg-[#124874] shadow-md h-[calc(100vh-4rem)] overflow-y-auto border-r border-black/40">
          <nav className="p-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded mb-1 transition-colors text-sm ${
                    isActive
                      ? 'bg-white text-[#124874]'
                      : 'text-white hover:bg-[#0d3351]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 ml-64 p-4 h-full overflow-y-auto">
          {children}
        </main>
      </div>
      {isSnowEnabled && <Snowfall />}
    </div>
  );
}
