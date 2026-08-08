import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { registerTransporter } from '../api/auth.js';
import Alert from '../components/common/Alert.jsx';

const EMPTY_FORM = {
  firstName: '', lastName: '', phone: '', companyName: '', companyEmail: '',
  contractNumber: '', password: '', confirmPassword: '',
};

// Split-screen shell shared by the form and success states - illustration
// panel is hidden below lg so the form alone fills the screen on mobile.
function SplitScreen({ children }) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className="min-h-screen lg:flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gray-900 relative items-center justify-center p-12 overflow-hidden">
        <div className="absolute top-8 left-8 text-white font-semibold text-lg">
          TMS Driver Portal
        </div>
        {imageFailed ? (
          <p className="text-gray-400 text-center max-w-xs">
            Manage your fleet, drivers, and deliveries in one place.
          </p>
        ) : (
          <img
            src="/register-illustration.png"
            alt=""
            className="max-w-md w-full h-auto object-contain"
            onError={() => setImageFailed(true)}
          />
        )}
      </div>
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-4 py-8">
        {children}
      </div>
    </div>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { confirmPassword, ...payload } = form;
      await registerTransporter(payload);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <SplitScreen>
        <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <h1 className="text-xl font-bold text-gray-800 mb-2">Registration submitted</h1>
          <p className="text-sm text-gray-600 mb-6">
            Thanks - your company registration is pending approval by Operations. You'll
            receive an email once it's been reviewed.
          </p>
          <Link to="/login" className="text-primary-600 hover:underline text-sm font-medium">
            Back to Sign In
          </Link>
        </div>
      </SplitScreen>
    );
  }

  return (
    <SplitScreen>
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-xl font-bold text-gray-800 mb-1">Register Your Company</h1>
        <p className="text-sm text-gray-500 mb-6">
          For transporter companies requesting access to the TMS Driver Portal.
        </p>

        <Alert type="error">{error}</Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                name="firstName" required value={form.firstName} onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                name="lastName" required value={form.lastName} onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
            <input
              name="phone" required value={form.phone} onChange={handleChange}
              placeholder="05XXXXXXXX" inputMode="numeric"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
            <input
              name="companyName" required value={form.companyName} onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Email</label>
            <input
              type="email" name="companyEmail" required value={form.companyEmail} onChange={handleChange}
              placeholder="you@yourcompany.com"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contract Number</label>
            <input
              name="contractNumber" required value={form.contractNumber} onChange={handleChange}
              placeholder="Evidence of an active contract with us"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password" name="password" required minLength={8} value={form.password} onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password" name="confirmPassword" required minLength={8} value={form.confirmPassword} onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white rounded-md py-2 text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Registration'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 hover:underline font-medium">
            Sign In
          </Link>
        </p>
      </div>
    </SplitScreen>
  );
}
