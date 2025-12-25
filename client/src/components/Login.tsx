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

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  onSwitchToRegister: () => void;
  onSwitchToForgotPassword: () => void;
}

export default function Login({ onSwitchToRegister, onSwitchToForgotPassword }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 relative">
      {/* Left: large image (3/5 on desktop) */}
      <div className="hidden md:block md:w-2/3">
        <img
          src="/login.png"
          alt="Hình trường Đại học Sư phạm Thành phố Hồ Chí Minh"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Right: login area (2/5 on desktop) */}
      <div className="flex-1 md:w-1/3 flex items-center justify-center py-6 md:py-8 px-4 md:px-6 bg-[#dddddd]">
        <div className="w-full max-w-md">
          {/* Logo + system title */}
          <div className="flex flex-col items-center mb-6">
            <img
              src="/logo-hcmue.png"
              alt="Logo trường Đại học Sư phạm Thành phố Hồ Chí Minh"
              className="w-44 h-22 object-contain mb-2"
            />
            <h1 className="text-center text-xl md:text-2xl font-extrabold text-[#124874] tracking-wide uppercase">
              HỆ THỐNG TRẮC NGHIỆM
              <br />
              MẠNG MÁY TÍNH
            </h1>
          </div>

          {/* Login card */}
          <div className="bg-white rounded-2xl shadow-md w-full px-5 pt-4 pb-6 md:px-6 md:pt-5 md:pb-7">
            <h2 className="text-2xl font-extrabold text-[#CF373D] text-center mb-4 uppercase">
              Đăng nhập
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#124874]"
                  placeholder="Email đăng nhập"
                  required
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#124874]"
                    placeholder="Mật khẩu đăng nhập"
                    required
                    maxLength={128}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <div className="flex justify-end mt-1">
                  <button
                    type="button"
                    onClick={onSwitchToForgotPassword}
                    className="text-xs text-[#124874] hover:underline"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#124874] text-white py-2 rounded-xl hover:bg-[#0d3351] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm"
              >
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
            </form>

            {/* Switch to register */}
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Chưa có tài khoản?{' '}
                <button
                  type="button"
                  onClick={onSwitchToRegister}
                  className="text-[#124874] font-semibold hover:underline"
                >
                  Đăng ký ngay
                </button>
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-4 text-xs text-gray-500 text-center">
            © 2025 Nhóm đồ án Trí tuệ nhân tạo của Nguyễn Ngọc Phú Tỷ
          </p>
        </div>
      </div>
    </div>
  );
}
