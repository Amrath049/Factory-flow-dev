import { Link, useLocation } from "react-router";
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ShoppingCart, 
  Warehouse,
  Menu,
  X,
  FileText,
  ChevronDown,
  ChevronRight,
  Settings,
  PlusCircle,
  ShieldAlert
} from "lucide-react";
import { useState, useEffect } from "react";

export function Sidebar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  useEffect(() => {
    if (location.pathname.startsWith("/invoice")) {
      setIsInvoiceOpen(true);
    }
  }, [location.pathname]);

  const menuItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/customers", label: "Customers", icon: Users },
    { path: "/products", label: "Products", icon: Package },
    { path: "/orders", label: "Orders", icon: ShoppingCart },
    { path: "/inventory", label: "Inventory", icon: Warehouse },
    { path: "/logs", label: "Activity Logs", icon: ShieldAlert },
  ];

  const isInvoiceActive = location.pathname.startsWith("/invoice");

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-md"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen bg-white border-r border-gray-200 
          w-64 flex flex-col z-40 transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="px-5 py-4 border-b border-gray-200">
          <Link to="/" className="flex items-center gap-2.5">
            <img
              src="/factory-flow-logo.png"
              alt="FactoryFlow"
              className="h-25 w-auto object-contain"
            />
          </Link>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto space-y-1">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium
                      ${
                        isActive
                          ? "bg-blue-50 text-blue-600 font-semibold"
                          : "text-gray-700 hover:bg-gray-50"
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}

            {/* Collapsible Invoice Menu */}
            <li>
              <button
                onClick={() => setIsInvoiceOpen(!isInvoiceOpen)}
                className={`
                  w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors text-sm font-medium
                  ${
                    isInvoiceActive
                      ? "bg-blue-50/70 text-blue-600 font-semibold"
                      : "text-gray-700 hover:bg-gray-50"
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5" />
                  <span>Invoice</span>
                </div>
                {isInvoiceOpen ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {/* Sub-menu options */}
              {isInvoiceOpen && (
                <ul className="mt-1 ml-4 pl-4 border-l-2 border-gray-100 space-y-1">
                  <li>
                    <Link
                      to="/invoice"
                      onClick={() => setIsOpen(false)}
                      className={`
                        flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors
                        ${
                          location.pathname === "/invoice"
                            ? "bg-blue-50 text-blue-600 font-bold"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }
                      `}
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Generate Invoice</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/invoice/settings"
                      onClick={() => setIsOpen(false)}
                      className={`
                        flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors
                        ${
                          location.pathname === "/invoice/settings"
                            ? "bg-blue-50 text-blue-600 font-bold"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }
                      `}
                    >
                      <Settings className="w-4 h-4" />
                      <span>Invoice Settings</span>
                    </Link>
                  </li>
                </ul>
              )}
            </li>
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 font-medium">
            FactoryFlow SaaS v2.0
          </div>
        </div>
      </aside>
    </>
  );
}
