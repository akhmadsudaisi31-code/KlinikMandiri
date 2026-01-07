import React, { useState, useEffect, useMemo } from 'react';
import {
    collection,
    query,
    onSnapshot,
    orderBy,
    deleteDoc,
    doc
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Medicine } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import toast from 'react-hot-toast';

const ITEMS_PER_PAGE = 10;

function MedicineList() {
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const navigate = useNavigate();

    useEffect(() => {
        setLoading(true);
        const q = query(collection(db, "medicines"), orderBy("name", "asc"));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const medicinesData: Medicine[] = [];
            querySnapshot.forEach((doc) => {
                medicinesData.push({ id: doc.id, ...doc.data() } as Medicine);
            });
            setMedicines(medicinesData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching medicines: ", error);
            setLoading(false);
            toast.error("Gagal memuat data obat");
        });

        return () => unsubscribe();
    }, []);

    const handleDelete = async (medicineId: string, medicineName: string) => {
        if (window.confirm(`Apakah Anda yakin ingin menghapus obat ${medicineName}?`)) {
            try {
                await deleteDoc(doc(db, "medicines", medicineId));
                toast.success(`Obat ${medicineName} berhasil dihapus.`);
            } catch (error) {
                console.error("Error deleting medicine: ", error);
                toast.error("Gagal menghapus obat.");
            }
        }
    };

    const filteredMedicines = useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase();
        if (!lowerSearch) return medicines;
        return medicines.filter(m =>
            m.name.toLowerCase().includes(lowerSearch) ||
            m.unit.toLowerCase().includes(lowerSearch)
        );
    }, [medicines, searchTerm]);

    const paginatedMedicines = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredMedicines.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredMedicines, currentPage]);

    const totalPages = Math.ceil(filteredMedicines.length / ITEMS_PER_PAGE);



    return (
        <div className="space-y-6 pb-20">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-purple-50 to-white dark:from-dark-surface dark:to-dark-bg p-6 rounded-2xl border border-purple-100 dark:border-dark-border transition-colors">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Manajemen Obat</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Kelola database obat untuk pemeriksaan pasien.</p>
                </div>
                <Link
                    to="/obat/baru"
                    className="w-full sm:w-auto inline-flex justify-center items-center px-5 py-3 border border-transparent rounded-xl shadow-lg shadow-purple-200 dark:shadow-none text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 hover:-translate-y-0.5 transition-all"
                >
                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Tambah Obat
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
                        className="block w-full pl-11 pr-4 py-3.5 border-transparent rounded-xl leading-5 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent sm:text-sm transition-all dark:text-white"
                        placeholder="Cari Nama Obat atau Satuan..."
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
                        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-purple-500 border-t-transparent"></div>
                        <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm font-medium">Sedang memuat data...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-800/50">
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nama Obat</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Satuan</th>
                                    <th scope="col" className="relative px-6 py-4">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-dark-surface divide-y divide-gray-50 dark:divide-gray-800">
                                {paginatedMedicines.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-16 text-center text-gray-500 dark:text-gray-400">
                                            <div className="flex flex-col items-center">
                                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-full mb-3">
                                                    <svg className="h-8 w-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                    </svg>
                                                </div>
                                                <p className="font-medium">Tidak ada data obat ditemukan.</p>
                                                <p className="text-sm mt-1">Coba kata kunci lain atau tambahkan obat baru.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedMedicines.map((medicine) => (
                                        <tr
                                            key={medicine.id}
                                            className="hover:bg-purple-50/50 dark:hover:bg-gray-800/50 transition-colors group"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="h-11 w-11 flex-shrink-0 rounded-full bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900 dark:to-purple-800 flex items-center justify-center text-purple-700 dark:text-purple-300 font-bold text-sm shadow-sm group-hover:scale-110 transition-transform">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                                                        </svg>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                                                            {medicine.name}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                            Ditambahkan: {medicine.createdAt ? format(medicine.createdAt.toDate(), 'dd MMM yyyy', { locale: localeId }) : '-'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                                                    {medicine.unit}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    className="p-2 rounded-full text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-800 transition-all mr-2"
                                                    onClick={() => navigate(`/obat/edit/${medicine.id}`)}
                                                    title="Edit Obat"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                    </svg>
                                                </button>
                                                <button
                                                    className="p-2 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                                    onClick={() => handleDelete(medicine.id, medicine.name)}
                                                    title="Hapus Obat"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
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

export default MedicineList;
