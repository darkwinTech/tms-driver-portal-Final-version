import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import logo from '/logo.png';

const TABS = [
  { key: 'signin', to: '/login', label: 'Sign In' },
  { key: 'create', to: '/register', label: 'Create Account' },
];

// Shared shell for the Sign In and Create Account pages - one rounded card
// with an illustrated brand panel on the left and a tab bar + form on the
// right. The tabs are plain route links (not real tab state): Login.jsx and
// Register.jsx stay separate components with their own form logic, only the
// surrounding chrome is shared.
export default function AuthLayout({ activeTab, children }) {
  const location = useLocation();
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden lg:flex">
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-500 to-primary-700 relative flex-col items-center justify-center p-10 text-center overflow-hidden">
          <div className="absolute top-6 left-6 flex items-center gap-2">
            <img src={logo} alt="" className="h-8 w-auto object-contain" />
            <span className="text-white font-semibold">TMS Driver Management Portal</span>
          </div>

          {imageFailed ? (
            <div className="h-40" />
          ) : (
            <img
              src="/transportation-management-system.png"
              alt=""
              className="max-w-xs w-full h-auto object-contain mb-6"
              onError={() => setImageFailed(true)}
            />
          )}

          {/* <h2 className="text-white text-xl font-bold uppercase tracking-wide mb-2">
            Streamline Your Fleet Operations
          </h2> */}
        </div>

        <div className="w-full lg:w-1/2 p-8 sm:p-10">
          <div className="flex border-b border-gray-200 mb-6">
            {TABS.map((tab) => {
              const isActive = tab.key === activeTab;
              return (
                <Link
                  key={tab.key}
                  to={tab.to}
                  state={location.state}
                  className={`flex-1 text-center pb-3 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-stone-400 hover:text-stone-600'
                  }`}
                >
                  {tab.label.toUpperCase()}
                </Link>
              );
            })}
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
