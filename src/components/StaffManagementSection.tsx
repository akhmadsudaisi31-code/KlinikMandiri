import React, { useState, useEffect } from 'react';
import { api } from '../api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export const StaffManagementSection: React.FC = () => {
    const { user } = useAuth();
    const [staffList, setStaffList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'DOKTER'
    });
    const [saving, setSaving] = useState(false);

    const fetchStaff = async () => {
        try {
            const data = await api.get('/settings/staff');
            setStaffList(data);
        } catch (e) {
            console.error("Failed to load staff", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.role === 'OWNER' || user?.role === 'SUPER_ADMIN') {
            fetchStaff();
        }
    }, [user]);

    const handleAddStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/settings/staff', formData);
            toast.success('Staf berhasil ditambahkan');
            setShowModal(false);
            setFormData({ name: '', email: '', password: '', role: 'DOKTER' });
            fetchStaff();
        } catch (e: any) {
            toast.error(e?.response?.data?.error || 'Gagal menambahkan staf');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteStaff = async (id: string, name: string) => {
        if (!window.confirm(`Hapus akses untuk staf ${name}?`)) return;
        try {
            await api.delete(`/settings/staff/${id}`);
            toast.success('Staf berhasil dihapus');
            fetchStaff();
        } catch (e: any) {
            toast.error(e?.response?.data?.error || 'Gagal menghapus staf');
        }
    };

    if (user?.role !== 'OWNER' && user?.role !== 'SUPER_ADMIN') {
        return null;
    }

    return (
        <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-soft border-2 border-gray-900 dark:border-gray-800">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Manajemen Akun Staf</h2>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2 bg-primary-100 text-primary-700 hover:bg-primary-200 font-bold rounded-xl text-xs transition-colors"
                >
                    + Tambah Staf
                </button>
            </div>
            
            <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 text-xs text-blue-700 dark:text-blue-300">
                    <strong>Penting:</strong> Akun staf berbagi data klinik yang SAMA dengan Anda. Mereka memiliki email dan sandi sendiri untuk Login tanpa mengganggu sesi Anda (Aman untuk Multidevice).
                </div>

                {loading ? (
                    <div className="text-center p-4 text-gray-500">Memuat data staf...</div>
                ) : staffList.length === 0 ? (
                    <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-xl text-gray-400 text-sm">
                        Belum ada staf yang ditambahkan.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {staffList.map((staff) => (
                            <div key={staff.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border-2 border-gray-900 dark:border-gray-700">
                                <div>
                                    <div className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                        {staff.name}
                                        <span className="text-[9px] px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded uppercase font-black tracking-wider">
                                            {staff.role}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">{staff.email}</div>
                                </div>
                                <button
                                    onClick={() => handleDeleteStaff(staff.id, staff.name)}
                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                    title="Hapus Staf"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Tambah Staf */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <form onSubmit={handleAddStaff} className="bg-white dark:bg-dark-surface w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-fade-in-up border border-gray-100 dark:border-dark-border">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                            <h3 className="text-lg font-black text-gray-900 dark:text-white">Tambah Akun Pegawai / Staf</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Lengkap</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-900 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white font-bold"
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    placeholder="Contoh: dr. Amanda"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Pegawai</label>
                                <input
                                    required
                                    type="email"
                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-900 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white font-bold"
                                    value={formData.email}
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                    placeholder="amanda@klinik.com"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label>
                                <input
                                    required
                                    type="password"
                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-900 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white font-bold"
                                    value={formData.password}
                                    onChange={e => setFormData({...formData, password: e.target.value})}
                                    placeholder="Minimal 6 karakter"
                                    minLength={6}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Peran Akses (Role)</label>
                                <select
                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-900 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white font-bold"
                                    value={formData.role}
                                    onChange={e => setFormData({...formData, role: e.target.value})}
                                >
                                    <option value="DOKTER">Dokter (Rekam Medis & Pendaftaran)</option>
                                    <option value="PENDAFTARAN">Admin Pendaftaran (Hanya Registrasi)</option>
                                    <option value="APOTEKER">Apoteker (Hanya Apotek & Daftar Obat)</option>
                                    <option value="SUPER_ADMIN">Super Admin (Akses Penuh)</option>
                                </select>
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-5 py-2.5 text-sm font-bold bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-md disabled:opacity-50"
                            >
                                {saving ? 'Menyimpan...' : 'Simpan Pegawai'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};
