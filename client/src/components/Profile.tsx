import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserCircle } from 'lucide-react';

export default function Profile() {
  const { user, updateUser } = useAuth();

  const [fullName, setFullName] = useState(user?.name ?? '');
  const [dob, setDob] = useState(user?.dob ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [isEditing, setIsEditing] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleStartEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setFullName(user?.name ?? '');
    setDob(user?.dob ?? '');
    setPhone(user?.phone ?? '');
    setIsEditing(false);
  };

  const handleSaveProfile = () => {
    if (!user) return;
    updateUser({ name: fullName, dob, phone });
    setIsEditing(false);
    alert('Đã lưu thông tin cá nhân (demo, chưa lưu lên server).');
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('Vui lòng nhập đầy đủ thông tin mật khẩu.');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('Mật khẩu mới và xác nhận mật khẩu không khớp.');
      return;
    }

    alert('Đổi mật khẩu chỉ là giao diện demo, chưa kết nối server.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  if (!user) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="mb-4">
          <UserCircle className="w-16 h-16 mx-auto text-gray-300" />
        </div>
        <p className="text-lg font-medium mb-2">Vui lòng đăng nhập</p>
        <p className="text-sm">Đăng nhập để xem thông tin cá nhân</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-2">
        <h2 className="block-title__title">THÔNG TIN CÁ NHÂN</h2>
      </div>

      <div className="bg-white rounded-xl shadow-md p-5">
        <div className="space-y-6">
          {/* Thông tin tài khoản */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gmail
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-sm text-gray-600 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">Email đăng nhập không thể thay đổi.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Họ và tên
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border rounded-lg text-sm ${
                  isEditing
                    ? 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#124874]'
                    : 'border-gray-200 bg-gray-50 text-gray-700'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày tháng năm sinh
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border rounded-lg text-sm ${
                  isEditing
                    ? 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#124874]'
                    : 'border-gray-200 bg-gray-50 text-gray-700'
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border rounded-lg text-sm ${
                  isEditing
                    ? 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#124874]'
                    : 'border-gray-200 bg-gray-50 text-gray-700'
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vai trò
              </label>
              <input
                type="text"
                value={user.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-sm text-gray-700 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Nút hành động chỉnh sửa thông tin */}
          <div className="flex justify-end gap-3">
            {!isEditing && (
              <button
                type="button"
                onClick={handleStartEdit}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Sửa thông tin
              </button>
            )}
            {isEditing && (
              <>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="px-4 py-2 bg-[#124874] text-white rounded-lg text-sm hover:bg-[#0d3351]"
                >
                  Lưu thông tin
                </button>
              </>
            )}
          </div>

          {/* Đổi mật khẩu */}
          <div className="pt-4 mt-2 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Đổi mật khẩu</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu hiện tại
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end mt-3">
              <button
                type="button"
                onClick={handleChangePassword}
                className="px-4 py-2 bg-[#124874] text-white rounded-lg text-sm hover:bg-[#0d3351]"
              >
                Đổi mật khẩu
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
