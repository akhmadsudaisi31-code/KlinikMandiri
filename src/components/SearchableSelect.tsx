
import { useState, useEffect, useRef } from 'react';
import { Medicine } from '../types';

interface SearchableSelectProps {
    options: Medicine[];
    onSelect: (medicineId: string) => void;
    placeholder?: string;
}

export function SearchableSelect({ options, onSelect, placeholder = "Cari obat..." }: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Filter options based on search term
    const filteredOptions = options.filter(option =>
        option.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    const handleSelect = (medicineId: string) => {
        onSelect(medicineId);
        setSearchTerm('');
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <div className="relative">
                <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all pl-10"
                    placeholder={placeholder}
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                </div>
                {searchTerm && (
                    <button
                        type="button"
                        onClick={() => setSearchTerm('')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                    </button>
                )}
            </div>

            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-auto">
                    {filteredOptions.length > 0 ? (
                        <ul className="py-1">
                            {filteredOptions.map((medicine) => (
                                <li
                                    key={medicine.id}
                                    className="px-4 py-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer flex justify-between items-center group transition-colors"
                                    onClick={() => handleSelect(medicine.id)}
                                >
                                    <span className="font-medium text-gray-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300">
                                        {medicine.name}
                                    </span>
                                    <span className="text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-1 rounded group-hover:bg-purple-100 dark:group-hover:bg-purple-800 group-hover:text-purple-600 dark:group-hover:text-purple-200 transition-colors">
                                        {medicine.unit}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                            Tidak ada obat yang cocok dengan "{searchTerm}"
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
