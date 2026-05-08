import { useState, useEffect, useRef } from 'react';

interface GenericSearchableSelectProps {
    options: string[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export function GenericSearchableSelect({ 
    options, 
    value, 
    onChange, 
    placeholder = "Pilih...",
    className = ""
}: GenericSearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Filter options based on search term
    const filteredOptions = options.filter(option =>
        option.toLowerCase().includes(searchTerm.toLowerCase())
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

    const handleSelect = (val: string) => {
        onChange(val);
        setSearchTerm('');
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            <div 
                className="w-full px-2 py-2 bg-white dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-700 rounded-lg text-xs font-bold cursor-pointer flex justify-between items-center"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={value ? "text-gray-900 dark:text-white" : "text-gray-400"}>
                    {value || placeholder}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>

            {isOpen && (
                <div className="absolute z-[60] w-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-2 border-b border-gray-50 dark:border-gray-700">
                        <input
                            type="text"
                            className="w-full px-2 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary-500"
                            placeholder="Cari..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <ul className="max-h-48 overflow-y-auto py-1">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => (
                                <li
                                    key={opt}
                                    className={`px-3 py-2 text-xs cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors ${value === opt ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 font-black' : 'text-gray-700 dark:text-gray-300 font-bold'}`}
                                    onClick={() => handleSelect(opt)}
                                >
                                    {opt}
                                </li>
                            ))
                        ) : (
                            <li 
                                className="px-3 py-2 text-xs text-gray-400 italic cursor-pointer hover:bg-gray-50"
                                onClick={() => handleSelect("Lainnya")}
                            >
                                "{searchTerm}" tidak ada. Klik untuk pilih lainnya.
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
