import { Search, User, LogOut, Building2 } from "lucide-react";
import { useState, useEffect } from "react";
import { getUser, authApi, AuthUser } from "../utils/api";

interface NavbarProps {
  title: string;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
}

export function Navbar({ title, searchQuery = "", setSearchQuery }: NavbarProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [user, setUserState] = useState<AuthUser | null>(getUser());

  useEffect(() => {
    authApi.getMe().then(setUserState).catch(() => {});
  }, []);

  const handleLogout = () => {
    authApi.logout();
  };

  // Determine if search bar should be hidden for Dashboard, Invoice pages, and Activity Logs
  const isSearchHidden = (() => {
    const t = title.toLowerCase();
    return t.includes("dashboard") || t.includes("invoice") || t.includes("activity log") || t.includes("logs");
  })();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
      <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
        <div className="flex-1 flex items-center gap-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 ml-12 lg:ml-0">
            {title}
          </h2>
          {user?.businessName && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
              <Building2 className="w-3.5 h-3.5" />
              {user.businessName}
            </span>
          )}
        </div>

        {!isSearchHidden && (
          <div className="hidden md:flex flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${title.toLowerCase()}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery?.(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm shadow-xs"
              />
            </div>
          </div>
        )}

        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 border border-gray-100 transition-colors"
          >
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-gray-800">
                {user?.name || 'User'}
              </span>
              <span className="text-[10px] text-gray-500 font-medium">
                {user?.role || 'BUSINESS_ADMIN'}
              </span>
            </div>
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-30">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-[10px] uppercase font-semibold text-gray-400">Signed in as</p>
                <p className="text-xs font-bold text-gray-800 truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile search */}
      {!isSearchHidden && (
        <div className="md:hidden px-4 pb-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${title.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery?.(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
        </div>
      )}
    </header>
  );
}
