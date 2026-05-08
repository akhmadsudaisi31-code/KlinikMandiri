import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { ClinicSettings } from '../types';
import toast from 'react-hot-toast';
import { getDoctorLabel } from '../utils/clinic';
import { StaffManagementSection } from '../components/StaffManagementSection';

const DEFAULT_TEMPLATE = `Dengan ini menerangkan bahwa:
Nama: {{name}}
Umur: {{ageIndo}}
Pekerjaan: {{occupation}}
Alamat: {{address}}

Berdasarkan hasil pemeriksaan yang telah dilakukan, pasien tersebut dalam kondisi SAKIT, sehingga memerlukan istirahat selama {{days}} hari, terhitung mulai tanggal {{startDate}} sampai dengan {{endDate}}.

Demikian surat keterangan ini dibuat untuk dapat dipergunakan sebagaimana mestinya.`;

const FeatureToggle: React.FC<{ label: string, enabled: boolean, onToggle?: () => void, readOnly?: boolean }> = ({ label, enabled, onToggle, readOnly }) => (
    <button
        onClick={readOnly ? undefined : onToggle}
        className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
            enabled 
                ? 'border-primary-500 bg-primary-50 text-primary-700' 
                : 'border-gray-900 dark:border-dark-border text-gray-400'
        } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
    >
        <span className="font-bold uppercase text-xs tracking-widest">{label}</span>
        <div className={`w-10 h-5 rounded-full relative transition-all ${enabled ? 'bg-primary-600 shadow-inner' : 'bg-gray-300 dark:bg-gray-700'}`}>
            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 transform ${enabled ? 'translate-x-5' : 'translate-x-1'}`} />
        </div>
    </button>
);

const Settings: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<ClinicSettings>({
        clinicId: user?.uid || '',
        clinicName: '',
        doctorName: '',
        doctorNip: '',
        enabledFeatures: {
            anc: true,
            kb: true,
            immunization: true,
            dental: true
        },
        sickLeaveTemplate: DEFAULT_TEMPLATE,
        clinicAddress: '',
        clinicPhone: '',
        lastSickLeaveNumber: 0,
        updatedAt: new Date().toISOString()
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await api.get('/settings');
                if (data) {
                    setSettings({
                        ...data,
                        clinicName: data.clinicName || '',
                        doctorName: data.doctorName || '',
                        doctorNip: data.doctorNip || '',
                        clinicAddress: data.clinicAddress || '',
                        clinicPhone: data.clinicPhone || '',
                        sickLeaveTemplate: data.sickLeaveTemplate || DEFAULT_TEMPLATE,
                        lastSickLeaveNumber: data.lastSickLeaveNumber || 0
                    });
                }
            } catch (e) {
                console.error("Gagal memuat pengaturan:", e);
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchSettings();
    }, [user]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put('/settings', settings);
            toast.success("Pengaturan berhasil disimpan");
        } catch (e) {
            toast.error("Gagal menyimpan pengaturan");
        } finally {
            setSaving(false);
        }
    };
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDownloadBackup = async () => {
        try {
            toast.loading('Mempersiapkan backup...', { id: 'backup' });
            const data = await api.get('/settings/backup');
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup_klinik_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success('Backup berhasil diunduh', { id: 'backup' });
        } catch (e) {
            toast.error('Gagal mengunduh backup', { id: 'backup' });
        }
    };

    const handleUploadBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const confirmRestore = window.confirm(
            'PERINGATAN: Memulihkan backup akan menggabungkan/menimpa data (Aman berkat UPSERT). Lanjut?'
        );

        if (!confirmRestore) {
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        try {
            toast.loading('Memulihkan data. Jangan tutup halaman ini...', { id: 'restore' });
            const fileContent = await file.text();
            const jsonData = JSON.parse(fileContent);

            await api.post('/settings/restore', jsonData);
            toast.success('Restore data berhasil!', { id: 'restore' });
        } catch (e: any) {
            toast.error(e?.response?.data?.error || 'Gagal restore data atau format file tidak valid', { id: 'restore' });
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    if (loading) return <div className="p-10 text-center text-gray-500">Memuat pengaturan klinik...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div className="flex justify-between items-center bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-soft border-2 border-gray-900 dark:border-gray-800">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Pengaturan Klinik</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Kelola informasi dokter, fitur, dan template dokumen.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-black rounded-xl shadow-lg transition-all uppercase tracking-widest text-xs disabled:opacity-50"
                >
                    {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Dokter & Klinik */}
                <div className="space-y-6 bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-soft border-2 border-gray-900 dark:border-gray-800">
                    <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Profil Klinik & Dokter</h2>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 whitespace-nowrap">Nama Klinik</label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-900 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white font-bold"
                                value={settings.clinicName}
                                onChange={e => setSettings({ ...settings, clinicName: e.target.value })}
                                placeholder="Contoh: Klinik Pratama Mandiri"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 whitespace-nowrap">Nama {getDoctorLabel(user?.clinicType)}</label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-900 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white font-bold"
                                value={settings.doctorName}
                                onChange={e => setSettings({ ...settings, doctorName: e.target.value })}
                                placeholder={`Contoh: ${user?.clinicType === 'Bidan' ? 'Bdn. [Nama]' : user?.clinicType === 'Perawat' ? 'Ns. [Nama]' : 'dr. [Nama]'}`}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 whitespace-nowrap">NIP / SIP</label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-900 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white font-bold"
                                value={settings.doctorNip}
                                onChange={e => setSettings({ ...settings, doctorNip: e.target.value })}
                                placeholder="Contoh: 19800101 200501 1 001"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 whitespace-nowrap">Alamat Klinik</label>
                            <textarea
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-900 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white font-bold"
                                value={settings.clinicAddress}
                                onChange={e => setSettings({ ...settings, clinicAddress: e.target.value })}
                                placeholder="Contoh: Jl. Merdeka No. 123, Jakarta"
                                rows={2}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 whitespace-nowrap">Telepon Klinik</label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-900 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white font-bold"
                                value={settings.clinicPhone}
                                onChange={e => setSettings({ ...settings, clinicPhone: e.target.value })}
                                placeholder="Contoh: (021) 12345678"
                            />
                        </div>
                    </div>
                </div>

                {/* Fitur Aktif */}
                <div className="space-y-6 bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-soft border-2 border-gray-900 dark:border-gray-800">
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Fitur Pelayanan</h2>
                        <span className="text-[10px] font-black bg-blue-100 text-blue-600 px-2 py-1 rounded uppercase tracking-tighter">Managed by SaaS Admin</span>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                        <FeatureToggle 
                            label="Pelayanan Ibu Hamil (ANC)" 
                            enabled={settings.enabledFeatures.anc} 
                            readOnly
                        />
                        <FeatureToggle 
                            label="Keluarga Berencana (KB)" 
                            enabled={settings.enabledFeatures.kb} 
                            readOnly
                        />
                        <FeatureToggle 
                            label="Pemeriksaan Anak / Imunisasi" 
                            enabled={settings.enabledFeatures.immunization} 
                            readOnly
                        />
                        <FeatureToggle 
                            label="Kesehatan Gigi (Dental)" 
                            enabled={settings.enabledFeatures.dental} 
                            readOnly
                        />
                    </div>
                    <p className="text-[10px] text-gray-400 italic font-medium mt-4">
                        * Fitur di atas diatur secara otomatis berdasarkan paket langganan Anda. Hubungi Customer Service jika ingin mengaktifkan fitur tambahan (Add-ons).
                    </p>
                </div>
            </div>

            {/* Template Surat Sakit */}
            <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-soft border-2 border-gray-900 dark:border-gray-800">
                <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Template Surat Keterangan Sakit</h2>
                
                <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                        <strong>Placeholder yang tersedia:</strong><br />
                        <code>{"{{name}}"}</code>, <code>{"{{ageIndo}}"}</code>, <code>{"{{address}}"}</code>, <code>{"{{occupation}}"}</code>, <code>{"{{days}}"}</code>, <code>{"{{startDate}}"}</code>, <code>{"{{endDate}}"}</code>, <code>{"{{diagnosis}}"}</code>
                    </div>
                    <textarea
                        rows={10}
                        className="w-full px-4 py-4 rounded-xl border-2 border-gray-900 dark:border-gray-700 bg-white dark:bg-gray-800 font-serif leading-relaxed dark:text-white"
                        value={settings.sickLeaveTemplate}
                        onChange={e => setSettings({ ...settings, sickLeaveTemplate: e.target.value })}
                    />
                </div>
            </div>

            {/* Penomoran Surat */}
            <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-soft border-2 border-gray-900 dark:border-gray-800">
                <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Penomoran Dokumen</h2>
                
                <div className="space-y-4">
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30 text-xs text-amber-700 dark:text-amber-300">
                        <strong>Penting:</strong> Nomor surat keterangan sakit akan bertambah secara otomatis setiap kali pratinjau dibuka/dicetak.
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1 whitespace-nowrap">Nomor Terakhir SKS</label>
                        <input
                            type="number"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-white font-bold"
                            value={settings.lastSickLeaveNumber}
                            onChange={e => setSettings({ ...settings, lastSickLeaveNumber: parseInt(e.target.value) || 0 })}
                        />
                        <p className="text-[10px] text-gray-400 mt-1">Ubah jika ingin mereset atau memulai dari nomor tertentu.</p>
                    </div>
                </div>
            </div>

            {/* Manajemen Pegawai (RBAC) */}
            <StaffManagementSection />

            {/* Pencadangan Data (SaaS Feature) */}
            <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-soft border-2 border-gray-900 dark:border-gray-800">
                <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Pencadangan & Pemulihan Data</h2>
                
                <div className="space-y-4">
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-900/30 text-xs text-green-700 dark:text-green-300">
                        <strong>Aman 100%:</strong> Modul Restore di sistem ini memprioritaskan keamanan (tidak ada metode hapus cascade, dan sinkronisasi menggunakan ID Anda).
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button 
                            type="button" 
                            onClick={handleDownloadBackup}
                            className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 border-2 border-primary-500 text-primary-600 dark:text-primary-400 font-bold rounded-xl shadow-sm hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-all text-sm flex items-center justify-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            Unduh Database (.JSON)
                        </button>
                        
                        <div className="flex-1 relative">
                            <input 
                                type="file" 
                                accept=".json" 
                                className="hidden" 
                                id="restore-file-input"
                                ref={fileInputRef}
                                onChange={handleUploadBackup}
                            />
                            <label 
                                htmlFor="restore-file-input"
                                className="w-full h-full px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-2 border-red-200 dark:border-red-900/40 font-bold rounded-xl cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/40 transition-all text-sm flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                Pulihkan dari File...
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
