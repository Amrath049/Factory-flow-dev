import { createBrowserRouter, Navigate } from "react-router";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Customers } from "./pages/Customers";
import { CustomerProfile } from "./pages/CustomerProfile";
import { Products } from "./pages/Products";
import { Orders } from "./pages/Orders";
import { OrderDetails } from "./pages/OrderDetails";
import { CreateOrder } from "./pages/CreateOrder";
import { Inventory } from "./pages/Inventory";
import { StockHistoryPage } from "./pages/StockHistoryPage";
import { InvoiceGenerator } from "./pages/invoiceGenerator";
import { InvoicePreview } from "./pages/invoicePreview";
import { isLoggedIn } from "./utils/api";

function AuthGuard({ children }: { children: React.ReactNode }) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function ProtectedLayout(props: { title: string }) {
  return (
    <AuthGuard>
      <Layout {...props} />
    </AuthGuard>
  );
}


export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/",
    element: <ProtectedLayout title="Dashboard" />,
    children: [
      {
        index: true,
        Component: Dashboard,
      },
    ],
  },
  {
    path: "/customers",
    element: <ProtectedLayout title="Customers" />,
    children: [
      {
        index: true,
        Component: Customers,
      },
    ],
  },
  {
    path: "/customers/:id",
    element: <ProtectedLayout title="Customer Profile" />,
    children: [
      {
        index: true,
        Component: CustomerProfile,
      },
    ],
  },
  {
    path: "/products",
    element: <ProtectedLayout title="Products" />,
    children: [
      {
        index: true,
        Component: Products,
      },
    ],
  },
  {
    path: "/orders",
    element: <ProtectedLayout title="Orders" />,
    children: [
      {
        index: true,
        Component: Orders,
      },
    ],
  },
  {
    path: "/orders/create",
    element: <ProtectedLayout title="Create Order" />,
    children: [
      {
        index: true,
        Component: CreateOrder,
      },
    ],
  },
  {
    path: "/orders/:id",
    element: <ProtectedLayout title="Order Details" />,
    children: [
      {
        index: true,
        Component: OrderDetails,
      },
    ],
  },
  {
    path: "/inventory",
    element: <ProtectedLayout title="Inventory" />,
    children: [
      {
        index: true,
        Component: Inventory,
      },
    ],
  },
  {
    path: "/inventory/:productId/history",
    element: <ProtectedLayout title="Stock History" />,
    children: [
      {
        index: true,
        Component: StockHistoryPage,
      },
    ],
  },
  {
    path: "/invoice",
    element: <ProtectedLayout title="Invoice" />,
    children: [
      {
        index: true,
        Component: InvoiceGenerator,
      },
    ],
  },
  {
    path: "/invoice/preview",
    element: <ProtectedLayout title="Invoice Preview" />,
    children: [
      {
        index: true,
        Component: InvoicePreview,
      },
    ],
  },
]);
