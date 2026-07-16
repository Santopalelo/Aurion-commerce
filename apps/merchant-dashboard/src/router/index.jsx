import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import CreateStore from "../pages/onboarding/CreateStore";
import Overview from "../pages/dashboard/Overview";
import DashboardLayout from "../components/layout/DashboardLayout";
import ProtectedRoute from "./ProtectedRoute";
import CategoryList from "../pages/categories/CategoryList";
import ProductList from "../pages/products/ProductList";
import ProductForm from "../pages/products/ProductForm";
import NotFound from "../pages/NotFound";
import OrderList from "../pages/orders/OrderList";
import OrderDetail from "../pages/orders/OrderDetail";
import CustomerList from "../pages/customers/CustomerList";
import DiscountList from "../pages/discounts/DiscountList";
import GeneralSettings from "../pages/settings/GeneralSettings";

const AppRouter = () => {
  return (
    <Routes>
      {/* PUBLIC ROUTES */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* ONBOARDING (requires auth but no store) */}
      <Route
        path="/onboarding/create-store"
        element={
          <ProtectedRoute>
            <CreateStore />
          </ProtectedRoute>
        }
      />

      {/* DASHBOARD ROUTES (requires auth + store) */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Overview />} />
        {/* Future routes will go here */}
        <Route path="/categories" element={<CategoryList />} />
        <Route path="/products" element={<ProductList />} />
        <Route path="/products/new" element={<ProductForm />} />
        <Route path="/products/:id/edit" element={<ProductForm />} />
        <Route path="/orders" element={<OrderList />} />
        <Route path="/orders/:id" element={<OrderDetail />} />
        <Route path="/customers" element={<CustomerList />} />
        <Route path="/discounts" element={<DiscountList />} />
        <Route path="/settings" element={<GeneralSettings />} />
        <Route
          path="/analytics"
          element={
            <div className="card">
              <h1 className="text-2xl font-bold">Analytics</h1>
              <p className="text-gray-600 mt-2">Coming soon!</p>
            </div>
          }
        />
        <Route
          path="/aurion-store"
          element={
            <div className="card">
              <h1 className="text-2xl font-bold">Aurion Store</h1>
              <p className="text-gray-600 mt-2">
                Browse themes and plugins. Coming soon!
              </p>
            </div>
          }
        />
      </Route>

      {/* DEFAULT REDIRECTS */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRouter;
