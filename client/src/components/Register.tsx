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
import { sendOTP } from '../services/api';
import { Check } from 'lucide-react';

interface RegisterProps {
  onSwitchToLogin: () => void;
}

export default function Register({ onSwitchToLogin }: RegisterProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'info' | 'otp'>('info');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const { register } = useAuth();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const validateStep1 = (): boolean => {
    if (!name.trim()) {
      setError('Vui lòng nhập họ và tên.');
      return false;
    }
    if (!email.trim()) {
      setError('Vui lòng nhập email.');
      return false;
    }
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return false;
    }
    return true;
  };

  const handleSendOTP = async () => {
    setError(null);
    setSuccess(null);

    if (!validateStep1()) return;

    setLoading(true);
    try {
      await sendOTP({ email, name });
      setStep('otp');
      setCountdown(60);
      setSuccess('Mã xác nhận đã được gửi đến email của bạn.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể gửi mã xác nhận.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await sendOTP({ email, name });
      setCountdown(60);
      setSuccess('Mã xác nhận mới đã được gửi.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể gửi lại mã.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (otp.length !== 6) {
      setError('Vui lòng nhập đủ 6 chữ số của mã OTP.');
      return;
    }

    setLoading(true);
    try {
      await register(email, password, name, otp);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('info');
    setOtp('');
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Left: large image (3/5 on desktop) */}
      <div className="hidden md:block md:w-2/3">
        <img
          src="/login.png"
          alt="Hình trường Đại học Sư phạm Thành phố Hồ Chí Minh"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Right: register area (2/5 on desktop) */}
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

          {/* Register card */}
          <div className="bg-white rounded-2xl shadow-md w-full px-5 pt-4 pb-6 md:px-6 md:pt-5 md:pb-7">
            <h2 className="text-2xl font-extrabold text-[#CF373D] text-center mb-4 uppercase">
              {step === 'info' ? 'Đăng ký' : 'Xác nhận OTP'}
            </h2>

            {/* Step indicator */}
            <div className="flex items-center justify-center mb-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 'info' ? 'bg-[#124874] text-white' : 'bg-green-500 text-white'}`}>
                {step === 'info' ? '1' : <Check size={16} strokeWidth={3} />}
              </div>
              <div className={`w-12 h-1 ${step === 'otp' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 'otp' ? 'bg-[#124874] text-white' : 'bg-gray-300 text-gray-500'}`}>
                2
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm">
                {success}
              </div>
            )}

            {step === 'info' ? (
              /* Step 1: User information */
              <form onSubmit={(e) => { e.preventDefault(); handleSendOTP(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#124874]"
                    placeholder="Nguyễn Văn A"
                    required
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#124874]"
                    placeholder="student@example.com"
                    required
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mật khẩu
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#124874]"
                    placeholder="••••••••"
                    required
                    minLength={6}
                    maxLength={128}
                  />
                  <p className="text-xs text-gray-400 mt-1">Mật khẩu phải có ít nhất 6 ký tự.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Xác nhận mật khẩu
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#124874]"
                    placeholder="••••••••"
                    required
                    minLength={6}
                    maxLength={128}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#124874] text-white py-2 rounded-xl hover:bg-[#0d3351] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm"
                >
                  {loading ? 'Đang gửi mã...' : 'Gửi mã xác nhận'}
                </button>
              </form>
            ) : (
              /* Step 2: OTP verification */
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div className="text-center text-sm text-gray-600 mb-2">
                  Vui lòng nhập mã 6 chữ số đã được gửi đến
                  <br />
                  <span className="font-semibold text-[#124874]">{email}</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-center">
                    Mã xác nhận (OTP)
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtp(value);
                    }}
                    className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#124874] text-center text-2xl font-bold tracking-[0.5em]"
                    placeholder="000000"
                    required
                    maxLength={6}
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full bg-[#124874] text-white py-2 rounded-xl hover:bg-[#0d3351] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm"
                >
                  {loading ? 'Đang xác nhận...' : 'Xác nhận đăng ký'}
                </button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    ← Quay lại
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={countdown > 0 || loading}
                    className="text-[#124874] hover:underline disabled:text-gray-400 disabled:no-underline"
                  >
                    {countdown > 0 ? `Gửi lại mã (${countdown}s)` : 'Gửi lại mã'}
                  </button>
                </div>
              </form>
            )}

            {/* Switch to login */}
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Đã có tài khoản?{' '}
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-[#124874] font-semibold hover:underline"
                >
                  Đăng nhập ngay
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
