import React, { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  query, 
  onSnapshot,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Patient } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

const ITEMS_PER_PAGE = 10;

function PatientList() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "patients"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const patientsData: Patient[] = [];
      querySnapshot.forEach((doc) => {
        patientsData.push({ id: doc.id, ...doc.data() } as Patient);
      });
      setPatients(patientsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredPatients = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    if (!lowerSearch) return patients;
    return patients.filter(p =>
      p.name.toLowerCase().includes(lowerSearch) ||
      p.address.toLowerCase().includes(lowerSearch) ||
      p.rm.includes(lowerSearch)
    );
  }, [patients, searchTerm]);

  const paginatedPatients = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPatients.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredPatients, currentPage]);

  const totalPages = Math.ceil(filteredPatients.length / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 pb-20">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-primary-50 to-white dark:from-dark-surface dark:to-dark-bg p-6 rounded-2xl border border-primary-100 dark:border-dark-border transition-colors">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Dashboard Pasien</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Kelola data pasien dan riwayat kunjungan klinik.</p>
        </div>
        <Link
          to="/pasien/baru"
          className="w-full sm:w-auto inline-flex justify-center items-center px-5 py-3 border border-transparent rounded-xl shadow-lg shadow-primary-200 dark:shadow-none text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 hover:-translate-y-0.5 transition-all"
        >
          <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Pasien Baru
        </Link>
      </div>

      {/* Search Section */}
      <div className="bg-white dark:bg-dark-surface p-2 rounded-2xl shadow-soft dark:shadow-none border border-gray-100 dark:border-dark-border transition-colors">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-3.5 border-transparent rounded-xl leading-5 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm transition-all dark:text-white"
            placeholder="Cari Nama, Nomor RM, atau Alamat..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-soft dark:shadow-none border border-gray-100 dark:border-dark-border overflow-hidden transition-colors">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm font-medium">Sedang memuat data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50">
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pasien</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">No. RM</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Detail</th>
                  <th scope="col" className="hidden md:table-cell px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Alamat</th>
                  <th scope="col" className="relative px-6 py-4">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-surface divide-y divide-gray-50 dark:divide-gray-800">
                {paginatedPatients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col items-center">
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-full mb-3">
                          <svg className="h-8 w-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        <p className="font-medium">Tidak ada data pasien ditemukan.</p>
                        <p className="text-sm mt-1">Coba kata kunci lain atau tambahkan pasien baru.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedPatients.map((patient) => (
                    <tr 
                      key={patient.id} 
                      onClick={() => navigate(`/pasien/${patient.id}`)}
                      className="hover:bg-blue-50/50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-11 w-11 flex-shrink-0 rounded-full bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-sm shadow-sm group-hover:scale-110 transition-transform">
                            {patient.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors">
                              {patient.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              Terdaftar: {patient.createdAt ? format(patient.createdAt.toDate(), 'dd MMM yyyy') : '-'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                         <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 font-mono">
                          {patient.rm}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-200 font-medium">{patient.ageDisplay}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{patient.gender}</div>
                      </td>
                      <td className="hidden md:table-cell px-6 py-4">
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs" title={patient.address}>
                          {patient.address}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          className="p-2 rounded-full text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-gray-800 transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/pasien/${patient.id}`);
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                 onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                 disabled={currentPage === 1}
                 className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-400">
                  Halaman <span className="font-bold">{currentPage}</span> dari <span className="font-bold">{totalPages}</span>
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  Sebelumnya
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PatientList;