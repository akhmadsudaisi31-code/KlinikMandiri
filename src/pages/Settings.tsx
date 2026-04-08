import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { ClinicSettings } from '../types';
import toast from 'react-hot-toast';

const DEFAULT_TEMPLATE = `Dengan ini menerangkan bahwa:
Nama: {{name}}
Umur: {{ageIndo}}
Pekerjaan: {{occupation}}
Alamat: {{address}}

Berdasarkan hasil pemeriksaan yang telah dilakukan, pasien tersebut dalam kondisi SAKIT, sehingga memerlukan istirahat selama {{days}} hari, terhitung mulai tanggal {{startDate}} sampai dengan {{endDate}}.

Demikian surat keterangan ini dibuat untuk dapat dipergunakan sebagaimana mestinya.`;

const FeatureToggle: React.FC<{ label: string, enabled: boolean, onToggle: () => void }> = ({ label, enabled, onToggle }) => (
    <button
        onClick={onToggle}
        className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
            enabled 
                ? 'border-primary-500 bg-primary-50 text-primary-700' 
                : 'border-gray-100 dark:border-dark-border text-gray-400'
        }`}
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

    const toggleFeature = (feature: keyof ClinicSettings['enabledFeatures']) => {
        setSettings(prev => ({
            ...prev,
            enabledFeatures: {
                ...prev.enabledFeatures,
                [feature]: !prev.enabledFeatures[feature]
            }
        }));
    };

    if (loading) return <div className="p-10 text-center text-gray-500">Memuat pengaturan klinik...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div className="flex justify-between items-center bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-dark-border">
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
                <div className="space-y-6 bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-dark-border">
                    <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Profil Klinik & Dokter</h2>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 whitespace-nowrap">Nama Klinik</label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-white font-bold"
                                value={settings.clinicName}
                                onChange={e => setSettings({ ...settings, clinicName: e.target.value })}
                                placeholder="Contoh: Klinik Pratama Mandiri"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 whitespace-nowrap">Nama Dokter</label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-white font-bold"
                                value={settings.doctorName}
                                onChange={e => setSettings({ ...settings, doctorName: e.target.value })}
                                placeholder="Contoh: dr. Ahmad Sudaisi"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 whitespace-nowrap">NIP / SIP</label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-white font-bold"
                                value={settings.doctorNip}
                                onChange={e => setSettings({ ...settings, doctorNip: e.target.value })}
                                placeholder="Contoh: 19800101 200501 1 001"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 whitespace-nowrap">Alamat Klinik</label>
                            <textarea
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-white font-bold"
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
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-white font-bold"
                                value={settings.clinicPhone}
                                onChange={e => setSettings({ ...settings, clinicPhone: e.target.value })}
                                placeholder="Contoh: (021) 12345678"
                            />
                        </div>
                    </div>
                </div>

                {/* Fitur Aktif */}
                <div className="space-y-6 bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-dark-border">
                    <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Fitur Pelayanan</h2>
                    
                    <div className="grid grid-cols-1 gap-3">
                        <FeatureToggle 
                            label="Pelayanan Ibu Hamil (ANC)" 
                            enabled={settings.enabledFeatures.anc} 
                            onToggle={() => toggleFeature('anc')} 
                        />
                        <FeatureToggle 
                            label="Keluarga Berencana (KB)" 
                            enabled={settings.enabledFeatures.kb} 
                            onToggle={() => toggleFeature('kb')} 
                        />
                        <FeatureToggle 
                            label="Pemeriksaan Anak / Imunisasi" 
                            enabled={settings.enabledFeatures.immunization} 
                            onToggle={() => toggleFeature('immunization')} 
                        />
                        <FeatureToggle 
                            label="Kesehatan Gigi (Dental)" 
                            enabled={settings.enabledFeatures.dental} 
                            onToggle={() => toggleFeature('dental')} 
                        />
                    </div>
                </div>
            </div>

            {/* Template Surat Sakit */}
            <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-dark-border">
                <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Template Surat Keterangan Sakit</h2>
                
                <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                        <strong>Placeholder yang tersedia:</strong><br />
                        <code>{"{{name}}"}</code>, <code>{"{{ageIndo}}"}</code>, <code>{"{{address}}"}</code>, <code>{"{{occupation}}"}</code>, <code>{"{{days}}"}</code>, <code>{"{{startDate}}"}</code>, <code>{"{{endDate}}"}</code>, <code>{"{{diagnosis}}"}</code>
                    </div>
                    <textarea
                        rows={10}
                        className="w-full px-4 py-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 font-serif leading-relaxed dark:text-white"
                        value={settings.sickLeaveTemplate}
                        onChange={e => setSettings({ ...settings, sickLeaveTemplate: e.target.value })}
                    />
                </div>
            </div>

            {/* Penomoran Surat */}
            <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-dark-border">
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
        </div>
    );
};

export default Settings;
