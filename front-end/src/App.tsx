import { Toaster } from 'react-hot-toast';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Tasks } from './pages/Tasks';
import { AuthProvider } from './providers/AuthProvider';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/tasks" replace />} />
            <Route path="tasks" element={<Tasks />} />
          </Route>
          <Route path="*" element={<Navigate to="/tasks" replace />} />
        </Routes>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
