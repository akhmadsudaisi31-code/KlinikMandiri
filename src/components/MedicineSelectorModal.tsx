
import { useState, useEffect } from 'react';
import { Medicine } from '../types';

interface MedicineSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    medicines: Medicine[];
    onSelect: (medicineId: string) => void;
}

export function MedicineSelectorModal({ isOpen, onClose, medicines, onSelect }: MedicineSelectorModalProps) {
    const [searchTerm, setSearchTerm] = useState('');

    // Reset search when opening
    useEffect(() => {
        if (isOpen) setSearchTerm('');
    }, [isOpen]);

    if (!isOpen) return null;

    const filteredMedicines = medicines.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative w-full sm:w-full sm:max-w-lg bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-xl transform transition-transform duration-300 max-h-[85vh] flex flex-col">

                {/* Header */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Pilih Obat</h3>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50">
                    <div className="relative">
                        <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Cari nama obat..."
                            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                {/* List */}
                <div className="overflow-y-auto p-2 space-y-1 flex-1 min-h-[50vh] sm:min-h-[40vh]">
                    {filteredMedicines.length > 0 ? (
                        filteredMedicines.map((medicine) => (
                            <button
                                key={medicine.id}
                                onClick={() => {
                                    onSelect(medicine.id);
                                    onClose();
                                }}
                                className="w-full flex items-center justify-between p-4 hover:bg-purple-50 dark:hover:bg-purple-900/10 rounded-xl transition-colors group text-left"
                            >
                                <div className="flex flex-col">
                                    <span className="font-bold text-gray-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300">
                                        {medicine.name}
                                    </span>
                                </div>
                                <span className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300 group-hover:bg-purple-100 dark:group-hover:bg-purple-800 group-hover:text-purple-600 dark:group-hover:text-purple-200">
                                    {medicine.unit}
                                </span>
                            </button>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                            <p>Obat tidak ditemukan</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
