import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home       from './pages/Home';
import AdminLogin from './pages/AdminLogin';
import AdminPanel from './pages/AdminPanel';

function Guard({ children }) {
  const { isAdmin } = useAuth();
  return isAdmin ? children : <Navigate to="/admin/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/*"            element={<Home />} />
          <Route path="/admin/login"  element={<AdminLogin />} />
          <Route path="/admin/*"      element={<Guard><AdminPanel /></Guard>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
