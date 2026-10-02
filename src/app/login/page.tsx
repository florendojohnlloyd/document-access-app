import { LoginForm } from '@/components/LoginForm';
import { BarChart3, FileCheck, TrendingUp, Shield } from 'lucide-react';

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Left panel */}
      <div className="relative hidden md:flex md:w-1/2 flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900">
        <div className="absolute inset-0 opacity-10" style={{backgroundImage:'linear-gradient(rgba(255,255,255,0.15) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.15) 1px,transparent 1px)',backgroundSize:'40px 40px'}} />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg">DocuVault</p>
            <p className="text-blue-200/70 text-xs">Document Management System</p>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <div>
            <p className="text-blue-300 text-xs font-semibold uppercase tracking-widest mb-3">Enterprise Solution</p>
            <h1 className="text-4xl font-bold text-white leading-tight">
              Manage Your<br /><span className="text-blue-300">Documents</span><br />Efficiently
            </h1>
            <p className="text-blue-100/70 mt-4 text-sm leading-relaxed max-w-xs">
              Centralize your documents with role-based access, audit trails, and secure storage.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {([
              { icon: FileCheck, label: 'Documents', value: 'Secured' },
              { icon: TrendingUp, label: 'Access', value: 'Tracked' },
              { icon: Shield, label: 'Roles', value: 'Managed' },
            ] as const).map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-white/10 border border-white/15 rounded-xl p-3 text-center">
                <Icon className="w-4 h-4 text-blue-200 mx-auto mb-1" />
                <p className="text-white text-xs font-bold">{value}</p>
                <p className="text-blue-300/70 text-xs">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-blue-300/40 text-xs">
          &copy; {new Date().getFullYear()} DocuVault. All rights reserved.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 md:hidden">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <span className="text-slate-900 font-bold text-lg">DocuVault</span>
          </div>

          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-3 py-1 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-blue-600 text-xs font-medium">Secure Portal</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Sign In</h2>
            <p className="text-slate-500 text-sm mt-1">Enter your credentials to access the system</p>
          </div>

          <LoginForm />
        </div>
      </div>
    </main>
  );
}
