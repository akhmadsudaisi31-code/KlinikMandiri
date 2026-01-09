import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import './index.css'
import App from './App'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import Dashboard from './pages/Dashboard'
import PatientList from './pages/PatientList'
import PatientForm from './pages/PatientForm'
import PatientDetail from './pages/PatientDetail'
import MedicineList from './pages/MedicineList'
import MedicineForm from './pages/MedicineForm'
import ExaminationList from './pages/ExaminationList'
import ExaminationForm from './pages/ExaminationForm'
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
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/pendaftaran"
              element={
                <ProtectedRoute>
                  <PatientList />
                </ProtectedRoute>
              }
            />

            <Route
              path="/pendaftaran/baru"
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
              path="/obat"
              element={
                <ProtectedRoute>
                  <MedicineList />
                </ProtectedRoute>
              }
            />

            <Route
              path="/obat/baru"
              element={
                <ProtectedRoute>
                  <MedicineForm />
                </ProtectedRoute>
              }
            />

            <Route
              path="/obat/edit/:id"
              element={
                <ProtectedRoute>
                  <MedicineForm />
                </ProtectedRoute>
              }
            />

            <Route
              path="/pemeriksaan"
              element={
                <ProtectedRoute>
                  <ExaminationList />
                </ProtectedRoute>
              }
            />

            <Route
              path="/pemeriksaan/:patientId"
              element={
                <ProtectedRoute>
                  <ExaminationForm />
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

          <Toaster 
            position="top-center" // Fallback
            containerStyle={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none', // Allow clicking behind
              zIndex: 99999, // Ensure on top
            }}
            toastOptions={{
              className: '',
              style: {
                background: 'transparent',
                boxShadow: 'none',
                border: 'none',
                padding: 0,
                color: 'inherit',
                maxWidth: '100%',
                width: 'auto',
                pointerEvents: 'auto',
              },
              duration: Infinity,
            }}
          />
        </App>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
)