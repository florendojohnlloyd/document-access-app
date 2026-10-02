import { LoginForm } from '@/components/LoginForm';
import { FileText } from 'lucide-react';

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-primary/10 via-gray-50 to-teal-light/10 dark:from-teal-dark/20 dark:via-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-teal-primary px-8 py-8 text-center">
            <div className="flex justify-center mb-3">
              <div className="bg-white/20 rounded-full p-3">
                <FileText className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wide">Document Access</h1>
            <p className="text-teal-light/80 text-sm mt-1">Secure Document Management</p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <LoginForm />
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-6">
          &copy; {new Date().getFullYear()} Document Access System
        </p>
      </div>
    </main>
  );
}
