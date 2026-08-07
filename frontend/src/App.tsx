import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout/Layout";
import DashboardPage from "./pages/DashboardPage";
import ProductListPage from "./pages/products/ProductListPage";
import ProductFormPage from "./pages/products/ProductFormPage";
import StockPage from "./pages/stock/StockPage";
import ReceivePage from "./pages/stock/ReceivePage";
import SalesListPage from "./pages/sales/SalesListPage";
import SaleFormPage from "./pages/sales/SaleFormPage";
import PricesPage from "./pages/PricesPage";
import ReportsPage from "./pages/ReportsPage";
import QuotesListPage from "./pages/quotes/QuotesListPage";
import QuoteFormPage from "./pages/quotes/QuoteFormPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/products" element={<ProductListPage />} />
        <Route path="/products/new" element={<ProductFormPage />} />
        <Route path="/products/:id/edit" element={<ProductFormPage />} />
        <Route path="/stock" element={<StockPage />} />
        <Route path="/stock/receive" element={<ReceivePage />} />
        <Route path="/sales" element={<SalesListPage />} />
        <Route path="/sales/new" element={<SaleFormPage />} />
        <Route path="/prices" element={<PricesPage />} />
        <Route path="/quotes" element={<QuotesListPage />} />
        <Route path="/quotes/new" element={<QuoteFormPage />} />
        <Route path="/reports" element={<ReportsPage />} />
      </Route>
    </Routes>
  );
}
