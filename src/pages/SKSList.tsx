import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { ClinicSettings } from '../types';
import SickLeaveCertificate from '../components/SickLeaveCertificate';
import toast from 'react-hot-toast';

interface SKSRecord {
    id: string;
    patientId: string;
    patientName: string;
    patientRm: string;
    diagnosis: string;
    occupation: string;
    address: string;
    startDate: string;
    endDate: string;
    days: number | string;
    ticketNumber: string;
    createdAt: string;
}

const SKSList: React.FC = () => {
    const [records, setRecords] = useState<SKSRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [settings, setSettings] = useState<ClinicSettings | null>(null);
    const [selectedRecord, setSelectedRecord] = useState<SKSRecord | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

    useEffect(() => {
        // EFISIENSI: 2 request paralel dalam 1 batch
        const loadAll = async () => {
            try {
                const [sksData, settingsData] = await Promise.all([
                    api.get('/sks'),
                    api.get('/settings').catch(() => null)
                ]);
                setRecords(Array.isArray(sksData) ? sksData : []);
                if (settingsData) setSettings(settingsData);
            } catch (e) {
                toast.error("Gagal memuat riwayat SKS");
            } finally {
                setLoading(false);
            }
        };
        loadAll();
    }, []);

    const fetchRecords = async () => {
        try {
            const data = await api.get('/sks');
            setRecords(Array.isArray(data) ? data : []);
        } catch (e) {
            toast.error("Gagal memuat riwayat SKS");
        } finally {
            setLoading(false);
        }
    };


    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRecord) return;

        try {
            await api.put(`/sks/${selectedRecord.id}`, {
                ...selectedRecord,
                diagnosis: '-' // Force diagnosis to '-' per user request
            });
            toast.success("Catatan SKS berhasil diperbarui");
            setIsEditModalOpen(false);
            fetchRecords();
        } catch (e) {
            toast.error("Gagal memperbarui catatan");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Hapus riwayat SKS ini?")) return;
        try {
            await api.delete(`/sks/${id}`);
            toast.success("Berhasil dihapus");
            fetchRecords();
        } catch (e) {
            toast.error("Gagal menghapus");
        }
    };

    const filteredRecords = records.filter(r => 
        r.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-dark-border">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight text-center md:text-left transition-all">Riwayat SKS</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 text-center md:text-left">Kelola dan cetak ulang Surat Keterangan Sakit.</p>
                </div>
                <div className="relative flex-1 max-w-md">
                    <input 
                        type="text" 
                        placeholder="Cari nama pasien atau nomor surat..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 transition-all font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <svg className="w-5 h-5 absolute left-3 top-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
            </div>

            <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-soft border border-gray-100 dark:border-dark-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-800/50 text-gray-500 font-black tracking-widest border-b border-gray-100 dark:border-dark-border">
                            <tr>
                                <th className="px-6 py-4">Nomor Surat</th>
                                <th className="px-6 py-4">Pasien</th>
                                <th className="px-6 py-4">Tgl Mulai</th>
                                <th className="px-6 py-4">Durasi</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400">Memuat riwayat...</td></tr>
                            ) : filteredRecords.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400">Tidak ada riwayat ditemukan.</td></tr>
                            ) : filteredRecords.map(record => (
                                <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                    <td className="px-6 py-4 font-mono font-bold text-primary-600 dark:text-primary-400">{record.ticketNumber}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-black text-gray-900 dark:text-white uppercase">{record.patientName}</div>
                                        <div className="text-xs text-gray-400">RM: {record.patientRm}</div>
                                    </td>
                                    <td className="px-6 py-4 font-medium">{format(new Date(record.startDate), 'dd MMM yyyy', { locale: localeId })}</td>
                                    <td className="px-6 py-4 font-medium">{record.days} Hari</td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => { setSelectedRecord(record); setIsPrintModalOpen(true); }}
                                                className="p-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600 rounded-lg transition-colors border border-primary-100 dark:border-primary-900/30"
                                                title="Cetak Ulang"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                            </button>
                                            <button 
                                                onClick={() => { setSelectedRecord(record); setIsEditModalOpen(true); }}
                                                className="p-2 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-600 rounded-lg transition-colors border border-amber-100 dark:border-amber-900/30"
                                                title="Edit"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(record.id)}
                                                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded-lg transition-colors border border-red-100 dark:border-red-900/30"
                                                title="Hapus"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v2m3 4H5" /></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && selectedRecord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-dark-surface rounded-3xl w-full max-w-lg shadow-2xl border-2 border-gray-900 dark:border-dark-border overflow-hidden">
                        <div className="px-8 py-6 border-b border-gray-100 dark:border-dark-border flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Edit Riwayat SKS</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                        </div>
                        <form onSubmit={handleUpdate} className="p-8 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tanggal Mulai</label>
                                    <input 
                                        type="date" 
                                        className="w-full px-4 py-2 rounded-xl border-2 border-gray-900 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 font-black"
                                        value={selectedRecord.startDate}
                                        onChange={e => setSelectedRecord({...selectedRecord, startDate: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Durasi (Hari)</label>
                                    <input 
                                        type="number" 
                                        className="w-full px-4 py-2 rounded-xl border-2 border-gray-900 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 font-black"
                                        value={selectedRecord.days}
                                        onChange={e => {
                                            const val = e.target.value;
                                            if (val === '') {
                                                setSelectedRecord({...selectedRecord, days: ''});
                                                return;
                                            }
                                            const days = parseInt(val) || 1;
                                            const start = new Date(selectedRecord.startDate);
                                            const end = new Date(start);
                                            end.setDate(start.getDate() + days - 1);
                                            setSelectedRecord({...selectedRecord, days, endDate: format(end, 'yyyy-MM-dd')});
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pekerjaan</label>
                                <input 
                                    type="text" 
                                    className="w-full px-4 py-2 rounded-xl border-2 border-gray-900 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 font-black"
                                    value={selectedRecord.occupation}
                                    onChange={e => setSelectedRecord({...selectedRecord, occupation: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Alamat</label>
                                <textarea 
                                    rows={2}
                                    className="w-full px-4 py-2 rounded-xl border-2 border-gray-900 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 font-black"
                                    value={selectedRecord.address}
                                    onChange={e => setSelectedRecord({...selectedRecord, address: e.target.value})}
                                />
                            </div>
                            <button type="submit" className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg transition-all uppercase tracking-widest text-sm">Simpan Perubahan</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Print Preview Modal */}
            {isPrintModalOpen && selectedRecord && settings && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-dark-surface rounded-3xl w-full max-w-5xl shadow-2xl border border-white/20 dark:border-dark-border overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-8 py-6 border-b border-gray-100 dark:border-dark-border flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Cetak Ulang SKS</h3>
                            <button onClick={() => setIsPrintModalOpen(false)} className="text-gray-400 hover:text-gray-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                        </div>
                        <div className="flex-1 overflow-auto p-8 flex justify-center bg-gray-100 dark:bg-gray-900">
                             <div className="origin-top scale-[0.6] sm:scale-[0.8] transition-transform">
                                <SickLeaveCertificate
                                    patient={{ 
                                        id: selectedRecord.patientId, 
                                        name: selectedRecord.patientName, 
                                        rm: selectedRecord.patientRm,
                                        address: selectedRecord.address,
                                        ageDisplay: '15 thn', // This would ideally be saved in the record, but for now we fallback
                                    } as any}
                                    settings={settings}
                                    diagnosis={selectedRecord.diagnosis}
                                    startDate={selectedRecord.startDate}
                                    endDate={selectedRecord.endDate}
                                    days={parseInt(String(selectedRecord.days)) || 0}
                                    printSize="A4"
                                    occupation={selectedRecord.occupation}
                                    ticketNumber={selectedRecord.ticketNumber}
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 dark:border-dark-border flex justify-end gap-3 bg-gray-50/50 dark:bg-gray-800/50">
                            <button onClick={() => setIsPrintModalOpen(false)} className="px-6 py-2 rounded-xl text-gray-500 font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">Batal</button>
                            <button onClick={() => window.print()} className="px-8 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                CETAK SEKARANG
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SKSList;
