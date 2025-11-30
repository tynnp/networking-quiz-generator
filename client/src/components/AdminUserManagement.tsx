import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';
import { getUsers, createUser, deleteUser, lockUser, unlockUser, CreateUserRequest } from '../services/api';
import { UserPlus, Trash2, Lock, Unlock, X } from 'lucide-react';

export default function AdminUserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isLocking, setIsLocking] = useState<string | null>(null);

  // Create user form state
  const [newUser, setNewUser] = useState<CreateUserRequest>({
    email: '',
    password: '',
    name: '',
    role: 'student',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email || !newUser.password || !newUser.name) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (newUser.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      await createUser(newUser);
      setShowCreateModal(false);
      setNewUser({ email: '', password: '', name: '', role: 'student' });
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tạo người dùng');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      return;
    }

    setIsDeleting(userId);
    setError(null);

    try {
      await deleteUser(userId);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể xóa người dùng');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleLockUser = async (userId: string) => {
    setIsLocking(userId);
    setError(null);

    try {
      await lockUser(userId);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể khóa người dùng');
    } finally {
      setIsLocking(null);
    }
  };

  const handleUnlockUser = async (userId: string) => {
    setIsLocking(userId);
    setError(null);

    try {
      await unlockUser(userId);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể mở khóa người dùng');
    } finally {
      setIsLocking(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-gray-500">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="block-title__title">QUẢN LÝ NGƯỜI DÙNG</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#124874] text-white rounded-lg hover:bg-[#0d3351] transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Thêm người dùng
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vai trò
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.name}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {user.email}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {user.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {user.isLocked ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Đã khóa
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Hoạt động
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      {user.id !== currentUser?.id && (
                        <>
                          {user.isLocked ? (
                            <button
                              onClick={() => handleUnlockUser(user.id)}
                              disabled={isLocking === user.id}
                              className="text-green-600 hover:text-green-800 disabled:opacity-50"
                              title="Mở khóa"
                            >
                              <Unlock className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleLockUser(user.id)}
                              disabled={isLocking === user.id}
                              className="text-yellow-600 hover:text-yellow-800 disabled:opacity-50"
                              title="Khóa"
                            >
                              <Lock className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={isDeleting === user.id}
                            className="text-red-600 hover:text-red-800 disabled:opacity-50"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Thêm người dùng mới</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewUser({ email: '', password: '', name: '', role: 'student' });
                  setError(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#124874]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#124874]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu * (tối thiểu 6 ký tự)
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#124874]"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vai trò *
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'student' | 'admin' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#124874]"
                >
                  <option value="student">Người dùng</option>
                  <option value="admin">Quản trị viên</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewUser({ email: '', password: '', name: '', role: 'student' });
                    setError(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 bg-[#124874] text-white rounded-lg hover:bg-[#0d3351] disabled:opacity-50"
                >
                  {isCreating ? 'Đang tạo...' : 'Tạo người dùng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

