import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext.jsx';
import { listPendingUsers } from '../../api/users.js';
import logo from '/logo.png'

const NEW_REQUEST_SUBLINKS = [
  { to: '/requests/create-driver', label: 'Create New Driver' },
  { to: '/requests/modify-driver', label: 'Modify Existing Driver' },
  { to: '/requests/disable-driver', label: 'Disable Existing Driver' },
];

const processorLinks = [
  { to: '/', label: 'Dashboard' },
  { to: '/queue', label: 'Request Queue'},
  { to: '/reports', label: 'Reports'},
];

// Operations gets its own navigation - they are the first review stage.
const operationsLinks = [
  { to: '/', label: 'Dashboard' },
  { to: '/ops/queue', label: 'Request Queue' },
];

// Operations Manager gets everything Operations does, plus reviewing
// transporter company registrations - plain Operations employees don't see
// this link.
const operationsManagerLinks = [
  ...operationsLinks,
  { to: '/ops/approvals', label: 'Pending Approvals' },
];

// AD Team - the second review stage, owning requests once Operations has
// completed the driver profiles.
const adTeamLinks = [
  { to: '/', label: 'Dashboard' },
  { to: '/ad/queue', label: 'Request Queue' },
];

const navLinkClass = ({ isActive }) =>
  `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
    isActive ? 'bg-primary-600 text-white' : 'text-stone-300 hover:bg-sidebar-hover hover:text-white'
  }`;

export default function Sidebar({ open = false, onClose = () => {} }) {
  const { isProcessor, isOperations, isOperationsManager, isAdTeam } = useAuth();
  const location = useLocation();
  const onNewRequestPage = NEW_REQUEST_SUBLINKS.some((l) => location.pathname === l.to);
  const [newRequestOpen, setNewRequestOpen] = useState(onNewRequestPage);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!isOperationsManager) return;
    listPendingUsers().then((res) => setPendingCount(res.data.length)).catch(() => {});
  }, [isOperationsManager, location.pathname]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 bg-sidebar text-stone-100 flex flex-col shrink-0 transform transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
      <NavLink
        to="/"
        onClick={onClose}
        className="h-16 flex items-center justify-center px-4 border-b border-sidebar-border"
        >
        <img
          src={logo}
          alt="ASMO Logo"
          className="h-12 w-auto object-contain cursor-pointer"
        />
      </NavLink>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {isOperations || isOperationsManager ? (
          (isOperationsManager ? operationsManagerLinks : operationsLinks).map((link) => (
            <NavLink key={link.to} to={link.to} end={link.to === '/'} onClick={onClose} className={navLinkClass}>
              <span className="flex-1">{link.label}</span>
              {link.to === '/ops/approvals' && pendingCount > 0 && (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {pendingCount}
                </span>
              )}
            </NavLink>
          ))
        ) : isAdTeam ? (
          adTeamLinks.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.to === '/'} onClick={onClose} className={navLinkClass}>
              {link.label}
            </NavLink>
          ))
        ) : isProcessor ? (
          processorLinks.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.to === '/'} onClick={onClose} className={navLinkClass}>
              {link.label}
            </NavLink>
          ))
        ) : (
          <>
            <NavLink to="/" end onClick={onClose} className={navLinkClass}>
              Dashboard
            </NavLink>

            <button
              type="button"
              onClick={() => setNewRequestOpen((prev) => !prev)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                onNewRequestPage ? 'bg-sidebar-hover text-white' : 'text-stone-300 hover:bg-sidebar-hover hover:text-white'
              }`}
            >
              New Request
              <span className={`transition-transform ${newRequestOpen ? 'rotate-90' : ''}`}>›</span>
            </button>
            {newRequestOpen && (
              <div className="pl-3 space-y-1">
                {NEW_REQUEST_SUBLINKS.map((link) => (
                  <NavLink key={link.to} to={link.to} onClick={onClose} className={navLinkClass}>
                    {link.label}
                  </NavLink>
                ))}
              </div>
            )}

            <NavLink to="/requests" end onClick={onClose} className={navLinkClass}>
              My Requests
            </NavLink>
          </>
        )}
      </nav>
    </aside>
    </>
  );
}