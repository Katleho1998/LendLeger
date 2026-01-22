import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock, RefreshCw } from 'lucide-react';

export const AutoLogoutWarning = () => {
  const { showLogoutWarning, timeUntilLogout, extendSession, logout } = useAuth();

  if (!showLogoutWarning) return null;

  const minutesLeft = Math.ceil(timeUntilLogout / (60 * 1000));

  const handleExtendSession = () => {
    extendSession();
  };

  const handleLogoutNow = async () => {
    await logout();
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-amber-50 border border-amber-200 rounded-xl shadow-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <Clock className="h-6 w-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-amber-800">
              Session Expiring Soon
            </h3>
            <p className="text-sm text-amber-700 mt-1">
              You will be automatically logged out in {minutesLeft} minute{minutesLeft !== 1 ? 's' : ''} due to inactivity.
            </p>
            <div className="flex space-x-2 mt-3">
              <button
                onClick={handleExtendSession}
                className="flex items-center px-3 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Extend Session
              </button>
              <button
                onClick={handleLogoutNow}
                className="px-3 py-2 bg-white text-amber-700 text-sm font-medium rounded-lg border border-amber-300 hover:bg-amber-50 transition-colors"
              >
                Logout Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};