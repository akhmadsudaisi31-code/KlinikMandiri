import React, { useEffect } from 'react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Patient, ClinicSettings } from '../types';

interface SickLeaveCertificateProps {
    patient: Patient;
    settings: ClinicSettings;
    diagnosis: string;
    startDate: string;
    endDate: string;
    days: number;
    occupation?: string;
    printSize: 'A5' | 'A4' | 'F4';
    ticketNumber?: string;
}

const SickLeaveCertificate: React.FC<SickLeaveCertificateProps> = ({
    patient,
    settings,
    diagnosis,
    startDate,
    endDate,
    days,
    occupation = '-',
    printSize,
    ticketNumber
}) => {
    // Inject print styles dynamically to avoid React hydration/removeChild issues
    useEffect(() => {
        const styleId = 'sks-print-styles';
        let styleTag = document.getElementById(styleId);
        
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = styleId;
            document.head.appendChild(styleTag);
        }

        const styles = `
            @media print {
                @page {
                    size: ${printSize === 'A4' ? 'A4' : printSize === 'A5' ? 'A5' : '215mm 330mm'};
                    margin: 0;
                }
                html, body {
                    margin: 0 !important;
                    padding: 0 !important;
                    background: white !important;
                    width: 100% !important;
                    height: 100% !important;
                    overflow: visible !important;
                }
                /* Hide everything except our print target */
                body * {
                    visibility: hidden !important;
                }
                #sick-leave-certificate-print, #sick-leave-certificate-print * {
                    visibility: visible !important;
                }
                #sick-leave-certificate-print {
                    display: block !important;
                    position: fixed !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: ${printSize === 'A4' ? '210mm' : printSize === 'A5' ? '148mm' : '215mm'} !important;
                    height: ${printSize === 'A4' ? '296mm' : printSize === 'A5' ? '209mm' : '329mm'} !important;
                    margin: 0 !important;
                    padding: ${printSize === 'A5' ? '1cm' : '1.5cm'} !important;
                    z-index: 999999 !important;
                    background: white !important;
                    box-sizing: border-box !important;
                    transform: none !important;
                    box-shadow: none !important;
                    overflow: hidden !important;
                    break-inside: avoid !important;
                }
                /* Ensure no parents have transforms that mess up fixed positioning */
                .fixed, .absolute, .relative, div {
                    transform: none !important;
                    filter: none !important;
                }
            }
        `;
        styleTag.innerHTML = styles;

        return () => {
            const tag = document.getElementById(styleId);
            if (tag) tag.remove();
        };
    }, [printSize]);

    // Replace placeholders in template
    const content = settings.sickLeaveTemplate
        .replace('{{name}}', patient.name || '................................')
        .replace('{{ageIndo}}', patient.ageDisplay || '-')
        .replace('{{address}}', patient.address || 'Alamat tidak diinput')
        .replace('{{occupation}}', occupation || '-')
        .replace('{{days}}', days.toString())
        .replace('{{startDate}}', format(new Date(startDate), 'dd MMMM yyyy', { locale: localeId }))
        .replace('{{endDate}}', format(new Date(endDate), 'dd MMMM yyyy', { locale: localeId }))
        .replace('{{diagnosis}}', diagnosis || '-');

    const sizeStyles = printSize === 'A4' 
        ? { width: '210mm', height: '297mm' } 
        : printSize === 'A5' 
            ? { width: '148mm', height: '210mm' }
            : { width: '215mm', height: '330mm' };

    return (
        <div 
            id="sick-leave-certificate-print"
            className="bg-white text-black font-serif mx-auto shadow-lg print:shadow-none print:m-0 print:absolute print:left-0 print:top-0 print:z-[9999] overflow-hidden break-inside-avoid"
            style={{ 
                ...sizeStyles,
                padding: printSize === 'A5' ? '1cm' : '1.5cm',
                boxSizing: 'border-box'
            }}
        >
            {/* Header / Kop Surat (Minimalist - No Logo) */}
            <div className="text-center border-b-2 border-black pb-4 mb-6">
                <h1 className="text-2xl font-bold uppercase tracking-tight">{settings.clinicName || '................................'}</h1>
                <p className="text-sm font-medium mt-1">{settings.clinicAddress || '................................'}</p>
                <p className="text-xs uppercase tracking-widest mt-0.5 opacity-80">Telp: {settings.clinicPhone || '................'}</p>
            </div>

            <div className="text-center mb-8">
                <h2 className="text-xl font-bold underline uppercase tracking-widest">SURAT KETERANGAN SAKIT</h2>
                <p className="text-sm mt-1 uppercase font-mono">Nomor: {ticketNumber || '... / SKS / ' + format(new Date(), 'MM / yyyy')}</p>
            </div>

            <div className="text-justify leading-relaxed whitespace-pre-wrap mb-12">
                {content}
            </div>

            <div className="flex justify-end pr-12">
                <div className="text-center w-64 space-y-20">
                    <div>
                        <p>{format(new Date(), 'dd MMMM yyyy', { locale: localeId })}</p>
                        <p className="font-bold">Dokter Pemeriksa,</p>
                    </div>
                    
                    <div>
                        <p className="font-bold underline uppercase">{settings.doctorName || '................................'}</p>
                        {settings.doctorNip && (
                            <p className="text-sm">NIP/SIP: {settings.doctorNip}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SickLeaveCertificate;
