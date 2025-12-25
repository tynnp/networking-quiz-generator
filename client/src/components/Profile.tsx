/*
 * Copyright 2025 Nguyễn Ngọc Phú Tỷ
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { UserCircle, Eye, EyeOff } from 'lucide-react';
import { updateProfile, changePassword } from '../services/api';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState(user?.name ?? '');
  const [dob, setDob] = useState(user?.dob ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ dob?: string; phone?: string }>({});

  useEffect(() => {
    if (user) {
      setFullName(user.name ?? '');
      setDob(user.dob ?? '');
      setPhone(user.phone ?? '');
    }
  }, [user]);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleStartEdit = () => {
    setIsEditing(true);
    setProfileError(null);
    setFieldErrors({});
  };

  const handleCancelEdit = () => {
    setFullName(user?.name ?? '');
    setDob(user?.dob ?? '');
    setPhone(user?.phone ?? '');
    setIsEditing(false);
    setProfileError(null);
    setFieldErrors({});
  };

  const validateProfile = (): boolean => {
    const errors: { dob?: string; phone?: string } = {};

    if (dob) {
      const dobDate = new Date(dob);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dobDate > today) {
        errors.dob = 'Ngày sinh không thể là ngày trong tương lai';
      }

      const minDate = new Date();
      minDate.setFullYear(today.getFullYear() - 150);
      if (dobDate < minDate) {
        errors.dob = 'Ngày sinh không hợp lệ';
      }
    }

    if (phone) {
      const phoneDigits = phone.replace(/\D/g, '');

      if (phoneDigits.length > 10) {
        errors.phone = 'Số điện thoại tối đa 10 số';
      } else if (phoneDigits.length > 0 && phoneDigits.length < 10) {
        errors.phone = 'Số điện thoại phải có đủ 10 số';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    if (!validateProfile()) {
      setProfileError('Vui lòng kiểm tra lại thông tin đã nhập');
      return;
    }

    setIsSaving(true);
    setProfileError(null);

    try {
      const cleanPhone = phone ? phone.replace(/\D/g, '') : '';

      const updates: { name?: string; dob?: string; phone?: string } = {};
      if (fullName !== user.name) updates.name = fullName;
      if (dob !== user.dob) updates.dob = dob || undefined;
      if (cleanPhone !== (user.phone?.replace(/\D/g, '') || '')) {
        updates.phone = cleanPhone || undefined;
      }

      if (Object.keys(updates).length > 0) {
        await updateProfile(updates);
        await refreshUser(); // Refresh user data from server
        showToast('Cập nhật thông tin thành công!', 'success');
      }

      setIsEditing(false);
      setFieldErrors({});
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Có lỗi xảy ra khi cập nhật thông tin');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Vui lòng nhập đầy đủ thông tin mật khẩu.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu mới và xác nhận mật khẩu không khớp.');
      return;
    }

    setIsChangingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    try {
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });

      setPasswordSuccess('Đổi mật khẩu thành công!');
      showToast('Đổi mật khẩu thành công!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Có lỗi xảy ra khi đổi mật khẩu');
    } finally {
      setIsChangingPassword(false);
    }
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

      <div className="bg-white rounded-xl shadow-md p-3 md:p-5">
        <div className="space-y-4 md:space-y-6">
          {/* Error message for profile update */}
          {profileError && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {profileError}
            </div>
          )}

          {/* Thông tin tài khoản */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                Gmail
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-xs md:text-sm text-gray-600 cursor-not-allowed"
              />
              <p className="text-[10px] md:text-xs text-gray-400 mt-1">Email đăng nhập không thể thay đổi.</p>
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                Họ và tên
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={!isEditing}
                maxLength={100}
                className={`w-full px-3 py-2 border rounded-lg text-xs md:text-sm ${isEditing
                  ? 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#124874]'
                  : 'border-gray-200 bg-gray-50 text-gray-700'
                  }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                Ngày tháng năm sinh
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => {
                  setDob(e.target.value);
                  if (fieldErrors.dob) {
                    setFieldErrors({ ...fieldErrors, dob: undefined });
                  }
                }}
                disabled={!isEditing}
                max={new Date().toISOString().split('T')[0]}
                className={`w-full px-3 py-2 border rounded-lg text-xs md:text-sm ${isEditing
                  ? fieldErrors.dob
                    ? 'border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500'
                    : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#124874]'
                  : 'border-gray-200 bg-gray-50 text-gray-700'
                  }`}
              />
              {fieldErrors.dob && (
                <p className="text-[10px] md:text-xs text-red-600 mt-1">{fieldErrors.dob}</p>
              )}
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                Số điện thoại
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  const value = e.target.value;
                  const digitsOnly = value.replace(/\D/g, '');
                  if (digitsOnly.length <= 10) {
                    setPhone(digitsOnly);
                    if (fieldErrors.phone) {
                      setFieldErrors({ ...fieldErrors, phone: undefined });
                    }
                  }
                }}
                disabled={!isEditing}
                maxLength={10}
                placeholder="0123456789"
                className={`w-full px-3 py-2 border rounded-lg text-xs md:text-sm ${isEditing
                  ? fieldErrors.phone
                    ? 'border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500'
                    : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#124874]'
                  : 'border-gray-200 bg-gray-50 text-gray-700'
                  }`}
              />
              {fieldErrors.phone && (
                <p className="text-[10px] md:text-xs text-red-600 mt-1">{fieldErrors.phone}</p>
              )}
              {!fieldErrors.phone && isEditing && (
                <p className="text-[10px] md:text-xs text-gray-400 mt-1">Tối đa 10 số</p>
              )}
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                Vai trò
              </label>
              <input
                type="text"
                value={user.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-xs md:text-sm text-gray-700 cursor-not-allowed"
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
                  disabled={isSaving}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="px-4 py-2 bg-[#124874] text-white rounded-lg text-sm hover:bg-[#0d3351] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Đang lưu...' : 'Lưu thông tin'}
                </button>
              </>
            )}
          </div>

          {/* Đổi mật khẩu */}
          <div className="pt-4 mt-2 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Đổi mật khẩu</h3>

            {/* Success message */}
            {passwordSuccess && (
              <div className="mb-3 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm">
                {passwordSuccess}
              </div>
            )}

            {/* Error message */}
            {passwordError && (
              <div className="mb-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                {passwordError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu hiện tại
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={isChangingPassword}
                    maxLength={128}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    disabled={isChangingPassword}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                    tabIndex={-1}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isChangingPassword}
                    maxLength={128}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    disabled={isChangingPassword}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                    tabIndex={-1}
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Xác nhận mật khẩu mới
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isChangingPassword}
                    maxLength={128}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isChangingPassword}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-3">
              <button
                type="button"
                onClick={handleChangePassword}
                disabled={isChangingPassword}
                className="px-4 py-2 bg-[#124874] text-white rounded-lg text-sm hover:bg-[#0d3351] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isChangingPassword ? 'Đang xử lý...' : 'Đổi mật khẩu'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
