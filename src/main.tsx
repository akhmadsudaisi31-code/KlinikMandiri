import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import './index.css'
import App from './App'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import PatientList from './pages/PatientList'


import PatientForm from './pages/PatientForm'
import PatientDetail from './pages/PatientDetail'
import Reports from './pages/Reports'
import ProtectedRoute from './components/ProtectedRoute'
import NotFound from './pages/NotFound'
// IMPORT PENTING: Memanggil ThemeProvider
import { ThemeProvider } from './context/ThemeContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* PEMBUNGKUS PENTING: ThemeProvider harus membungkus seluruh aplikasi */}
    <ThemeProvider>
      <BrowserRouter>
        <App>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/lupa-password" element={<ForgotPassword />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <PatientList />
                </ProtectedRoute>
              }
            />

            <Route
              path="/pasien/baru"
              element={
                <ProtectedRoute>
                  <PatientForm />
                </ProtectedRoute>
              }
            />

            <Route
              path="/pasien/edit/:id"
              element={
                <ProtectedRoute>
                  <PatientForm />
                </ProtectedRoute>
              }
            />

            <Route
              path="/pasien/:id"
              element={
                <ProtectedRoute>
                  <PatientDetail />
                </ProtectedRoute>
              }
            />

            <Route
              path="/laporan"
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>

          <Toaster position="bottom-center" />
        </App>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
)