import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

function Dashboard() {
    const [totalPatients, setTotalPatients] = useState<number>(0);
    const [todayExaminations, setTodayExaminations] = useState<number>(0);
    const [medicineStock, setMedicineStock] = useState<number>(0);

    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;

        const fetchStats = async () => {
            try {
                // Dalam skenario sebenarnya, ini mungkin 1 endpoint: api.get('/dashboard/stats')
                const patients = await api.get('/patients');
                setTotalPatients(patients.length || 0);

                const exams = await api.get('/examinations/today');
                setTodayExaminations(exams.length || 0);

                const medicines = await api.get('/medicines');
                setMedicineStock(medicines.length || 0);
            } catch (e) {
                console.error("Gagal mengambil data dashboard", e);
            }
        };

        fetchStats();
    }, [user]);

    return (
        <div className="space-y-6 pb-20">
            {/* Navigation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card Pendaftaran */}
                <Link
                    to="/pendaftaran"
                    className="group glass-card p-8 rounded-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg className="w-24 h-24 text-primary-500 transform rotate-12" fill="currentColor" viewBox="0 0 24 24"><path d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" /></svg>
                    </div>
                    <div className="flex items-start gap-4 relative z-10">
                        <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center text-white shadow-glow group-hover:scale-110 transition-transform duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                Pendaftaran Pasien
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                Daftarkan pasien baru atau lihat daftar pasien yang sudah terdaftar
                            </p>
                            <div className="mt-4 inline-flex items-center text-sm font-medium text-primary-600 dark:text-primary-400 group-hover:gap-2 transition-all">
                                Buka Pendaftaran
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Card Pemeriksaan */}
                <Link
                    to="/pemeriksaan"
                    className="group glass-card p-8 rounded-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg className="w-24 h-24 text-secondary-500 transform rotate-12" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>
                    </div>
                    <div className="flex items-start gap-4 relative z-10">
                        <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-2xl flex items-center justify-center text-white shadow-glow group-hover:scale-110 transition-transform duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-secondary-600 dark:group-hover:text-secondary-400 transition-colors">
                                Pemeriksaan
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                Lihat daftar pasien di poli pemeriksaan dan lakukan pemeriksaan
                            </p>
                            <div className="mt-4 inline-flex items-center text-sm font-medium text-secondary-600 dark:text-secondary-400 group-hover:gap-2 transition-all">
                                Buka Pemeriksaan
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Card Obat */}
                <Link
                    to="/obat"
                    className="group glass-card p-8 rounded-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg className="w-24 h-24 text-accent-500 transform rotate-12" fill="currentColor" viewBox="0 0 24 24"><path d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" /></svg>
                    </div>
                    <div className="flex items-start gap-4 relative z-10">
                        <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-accent-500 to-accent-700 rounded-2xl flex items-center justify-center text-white shadow-glow group-hover:scale-110 transition-transform duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors">
                                Manajemen Obat
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                Kelola database obat untuk pemeriksaan pasien
                            </p>
                            <div className="mt-4 inline-flex items-center text-sm font-medium text-accent-600 dark:text-accent-400 group-hover:gap-2 transition-all">
                                Buka Obat
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Quick Stats (Optional) */}
            <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-soft dark:shadow-none border border-gray-100 dark:border-dark-border transition-colors">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Informasi</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Total Pasien</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">{totalPatients}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-800">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Pemeriksaan Hari Ini</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">{todayExaminations}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-800">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center text-white">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Jenis Obat</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">{medicineStock}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
