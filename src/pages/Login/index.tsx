import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { mockUsers } from '@/mock/data';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [selectedUserId, setSelectedUserId] = useState(mockUsers[0].id);

  const roleLabels: Record<string, string> = {
    dept_head: '部门主管',
    admin: '管理员',
    finance: '财务',
    executive: '高管',
  };

  const handleLogin = () => {
    const user = mockUsers.find((u) => u.id === selectedUserId);
    if (user) {
      login(user);
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-secondary-500 mb-4">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">资产处置系统</h1>
          <p className="text-primary-200">企业资产全生命周期管理平台</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">选择登录身份</h2>

          <div className="space-y-3 mb-6">
            {mockUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => setSelectedUserId(user.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                  selectedUserId === user.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-secondary-500 flex items-center justify-center text-white font-semibold text-lg overflow-hidden">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user.name.charAt(0)
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-slate-900">{user.name}</p>
                  <p className="text-sm text-slate-500">
                    {roleLabels[user.role] || user.role} · {user.department}
                  </p>
                </div>
                {selectedUserId === user.id && (
                  <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={handleLogin}
            className="w-full py-3 px-6 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-primary-500/30"
          >
            登录系统
          </button>
        </div>
      </div>
    </div>
  );
}
