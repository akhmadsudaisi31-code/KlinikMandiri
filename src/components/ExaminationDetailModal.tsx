import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface ExaminationDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: any; // Can be Examination or Visit
}

export function ExaminationDetailModal({ isOpen, onClose, data }: ExaminationDetailModalProps) {
    if (!data) return null;

    const isExamination = 'pemeriksaan' in data; // Check if it's an examination record
    const date = data.date?.toDate ? data.date.toDate() : (data.createdAt?.toDate ? data.createdAt.toDate() : new Date());

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all border border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between items-start mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
                                    <div>
                                        <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-gray-900 dark:text-white">
                                            Detail {isExamination ? 'Pemeriksaan' : 'Kunjungan'}
                                        </Dialog.Title>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            {format(date, 'EEEE, dd MMMM yyyy - HH:mm', { locale: localeId })}
                                        </p>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {/* Pasien Info (Short) */}
                                    <div className="flex gap-4 text-sm bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                                        <div>
                                            <span className="text-gray-500 dark:text-gray-400 block text-xs">Pasien</span>
                                            <span className="font-semibold text-gray-900 dark:text-gray-200">{data.patientName}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 dark:text-gray-400 block text-xs">No. RM</span>
                                            <span className="font-mono font-semibold text-gray-900 dark:text-gray-200">{data.patientRm || '-'}</span>
                                        </div>
                                    </div>

                                    {/* Content Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div>
                                                <h4 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wide mb-1">Diagnosa</h4>
                                                <p className="text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                                                    {(isExamination ? data.diagnosa : data.diagnosis) || '-'}
                                                </p>
                                            </div>

                                            {isExamination && data.keluhan && (
                                                <div>
                                                    <h4 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wide mb-1">Keluhan</h4>
                                                    <p className="text-gray-700 dark:text-gray-300 italic">"{data.keluhan}"</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            {isExamination ? (
                                                <>
                                                    {data.pemeriksaan && (
                                                        <div>
                                                            <h4 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wide mb-1">Hasil Pemeriksaan</h4>
                                                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{data.pemeriksaan}</p>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <div>
                                                    <h4 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wide mb-1">Terapi / Tindakan</h4>
                                                    <p className="text-gray-700 dark:text-gray-300">{data.therapy || '-'}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Medicines Section */}
                                    {isExamination && data.medicines && data.medicines.length > 0 && (
                                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-800">
                                            <h4 className="font-bold text-purple-900 dark:text-purple-300 text-sm uppercase tracking-wide mb-3 flex items-center gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                                </svg>
                                                Obat / Resep
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {data.medicines.map((med: any, idx: number) => (
                                                    <span key={idx} className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-3 py-1.5 rounded-lg text-sm border border-purple-200 dark:border-purple-700 shadow-sm">
                                                        <span className="font-semibold">{med.medicineName}</span>
                                                        <span className="text-gray-500 dark:text-gray-400 ml-1">({med.quantity} {med.unit})</span>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Footer / Cost */}
                                    {(data.biaya || data.cost) && (
                                        <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
                                            <div className="text-right">
                                                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest block">Biaya / Tarif</span>
                                                <span className="text-xl font-bold text-green-600 dark:text-green-400">
                                                    Rp {Number(data.biaya || data.cost).toLocaleString('id-ID')}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {data.notes && (
                                        <div className="bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-lg text-sm text-yellow-800 dark:text-yellow-200 border border-yellow-100 dark:border-yellow-900/30">
                                            <span className="font-bold mr-1">Catatan Tambahan:</span> {data.notes}
                                        </div>
                                    )}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
