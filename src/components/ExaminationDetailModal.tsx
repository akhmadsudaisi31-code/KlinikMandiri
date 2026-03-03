import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface ExaminationDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: any; 
}

export function ExaminationDetailModal({ isOpen, onClose, data }: ExaminationDetailModalProps) {
    if (!data) return null;

    const isSOAP = 'keluhanUtama' in data; 
    const date = data.date ? new Date(data.date) : (data.createdAt ? new Date(data.createdAt) : new Date());

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-3xl bg-white dark:bg-gray-900 text-left align-middle shadow-2xl transition-all border border-gray-100 dark:border-gray-800">
                                
                                {/* Header */}
                                <div className="px-8 pt-8 pb-6 flex justify-between items-start border-b border-gray-50 dark:border-gray-800">
                                    <div>
                                        <Dialog.Title as="h3" className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                                            Rincian {isSOAP ? 'Pemeriksaan SOAP' : 'Kunjungan'}
                                        </Dialog.Title>
                                        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-widest">
                                            {format(date, 'EEEE, dd MMMM yyyy - HH:mm', { locale: localeId })}
                                        </p>
                                    </div>
                                    <button onClick={onClose} className="p-2 bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl transition-all">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                                    {/* Pasien Info */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                                        <div>
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Pasien</span>
                                            <span className="font-bold text-gray-900 dark:text-white">{data.patientName}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">No. RM</span>
                                            <span className="font-mono font-bold text-primary-600 dark:text-primary-400">{data.patientRm || '-'}</span>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Dokter / Pemeriksa</span>
                                            <span className="font-bold text-gray-700 dark:text-gray-300">Sistem SatSet RM</span>
                                        </div>
                                    </div>

                                    {isSOAP ? (
                                        <div className="space-y-8">
                                            {/* S Section */}
                                            <section>
                                                <h4 className="text-[10px] font-black text-primary-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                                    <span className="w-1.5 h-4 bg-primary-500 rounded-full"></span>
                                                    S - Subjective
                                                </h4>
                                                <div className="space-y-4 px-3">
                                                    <div>
                                                        <p className="text-[11px] font-bold text-gray-400 uppercase mb-1">Keluhan Utama</p>
                                                        <p className="text-gray-800 dark:text-gray-200 font-medium leading-relaxed">{data.keluhanUtama || '-'}</p>
                                                    </div>
                                                    {data.riwayatPenyakitSekarang && (
                                                        <div>
                                                            <p className="text-[11px] font-bold text-gray-400 uppercase mb-1">Riwayat Penyakit Sekarang</p>
                                                            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{data.riwayatPenyakitSekarang}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </section>

                                            {/* O Section */}
                                            <section>
                                                <h4 className="text-[10px] font-black text-green-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                                    <span className="w-1.5 h-4 bg-green-500 rounded-full"></span>
                                                    O - Objective
                                                </h4>
                                                <div className="space-y-6 px-3">
                                                    {/* Vital Signs Grid */}
                                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                                        {[
                                                            { label: 'Tensi', val: data.tensi, unit: 'mmHg' },
                                                            { label: 'Nadi', val: data.nadi, unit: 'x/mnt' },
                                                            { label: 'Suhu', val: data.suhu, unit: '°C' },
                                                            { label: 'Resp', val: data.respirasi, unit: 'x/mnt' },
                                                            { label: 'BB', val: data.bb, unit: 'kg' },
                                                            { label: 'SPO2', val: data.spo2, unit: '%' },
                                                        ].map((v, i) => (
                                                            v.val && (
                                                                <div key={i} className="p-3 bg-green-50/50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/30">
                                                                    <p className="text-[9px] font-black text-green-600 dark:text-green-400 uppercase mb-1">{v.label}</p>
                                                                    <p className="font-black text-gray-900 dark:text-white text-sm">{v.val} <span className="text-[10px] opacity-40 font-bold">{v.unit}</span></p>
                                                                </div>
                                                            )
                                                        ))}
                                                    </div>
                                                    {data.pemeriksaanFisik && (
                                                        <div>
                                                            <p className="text-[11px] font-bold text-gray-400 uppercase mb-1">Pemeriksaan Fisik</p>
                                                            <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap leading-relaxed bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl">{data.pemeriksaanFisik}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </section>

                                            {/* A Section */}
                                            <section>
                                                <h4 className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                                    <span className="w-1.5 h-4 bg-yellow-500 rounded-full"></span>
                                                    A - Assessment
                                                </h4>
                                                <div className="px-3">
                                                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-2xl border border-yellow-100 dark:border-yellow-900/30">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <p className="text-[11px] font-bold text-yellow-600 dark:text-yellow-400 uppercase">Diagnosa Medis</p>
                                                            {data.icd10 && <span className="px-2 py-0.5 bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100 text-[10px] font-black rounded uppercase font-mono">{data.icd10}</span>}
                                                        </div>
                                                        <p className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">{data.diagnosa || '-'}</p>
                                                    </div>
                                                </div>
                                            </section>

                                            {/* P Section */}
                                            <section>
                                                <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                                    <span className="w-1.5 h-4 bg-blue-500 rounded-full"></span>
                                                    P - Plan
                                                </h4>
                                                <div className="space-y-4 px-3">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {data.tindakan && (
                                                            <div>
                                                                <p className="text-[11px] font-bold text-gray-400 uppercase mb-1">Tindakan</p>
                                                                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{data.tindakan}</p>
                                                            </div>
                                                        )}
                                                        {data.edukasi && (
                                                            <div>
                                                                <p className="text-[11px] font-bold text-gray-400 uppercase mb-1">Edukasi</p>
                                                                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{data.edukasi}</p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {data.medicines && data.medicines.length > 0 && (
                                                        <div className="p-4 bg-purple-50/50 dark:bg-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-900/30">
                                                            <p className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase mb-3">Resep Obat</p>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                                {data.medicines.map((med: any, i: number) => (
                                                                    <div key={i} className="flex justify-between items-center p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-purple-100 dark:border-gray-700 shadow-sm">
                                                                        <span className="text-xs font-black text-gray-900 dark:text-white uppercase">{med.medicineName}</span>
                                                                        <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 px-2 py-0.5 bg-purple-50 dark:bg-purple-900/30 rounded-lg">{med.quantity} {med.unit}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {data.rencanaTindakLanjut && (
                                                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                                                            <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 tracking-widest">Rencana Tindak Lanjut</p>
                                                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{data.rencanaTindakLanjut}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </section>
                                        </div>
                                    ) : (
                                        <div className="p-6 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                                            <p className="text-[11px] font-bold text-blue-500 uppercase mb-2">Terapi / Tindakan Kunjungan Umum</p>
                                            <p className="text-gray-800 dark:text-gray-200 leading-relaxed font-medium">{data.therapy || data.notes || '-'}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Footer / Total Cost */}
                                <div className="px-8 pb-8 pt-4 flex justify-between items-center border-t border-gray-50 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/20">
                                    <div className="text-right ml-auto">
                                        <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-0.5">Total Biaya Layanan</span>
                                        <span className="text-2xl font-black text-primary-600 dark:text-primary-400">
                                            IDR {Number(data.biaya || data.cost || 0).toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
