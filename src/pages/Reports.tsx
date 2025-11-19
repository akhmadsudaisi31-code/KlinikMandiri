import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Visit } from '../types';
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

type ReportType = 'daily' | 'monthly' | 'yearly';

function Reports() {
  const [reportType, setReportType] = useState<ReportType>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => {
    fetchReport();
  }, [reportType, selectedDate]);

  const fetchReport = async () => {
    setLoading(true);
    const dateObj = new Date(selectedDate);
    
    let start: Date, end: Date;

    if (reportType === 'daily') {
      start = startOfDay(dateObj);
      end = endOfDay(dateObj);
    } else if (reportType === 'monthly') {
      start = startOfMonth(dateObj);
      end = endOfMonth(dateObj);
    } else {
      start = startOfYear(dateObj);
      end = endOfYear(dateObj);
    }

    try {
      const q = query(
        collection(db, 'visits'),
        where('date', '>=', Timestamp.fromDate(start)),
        where('date', '<=', Timestamp.fromDate(end)),
        orderBy('date', 'desc')
      );

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Visit));
      
      setVisits(data);
      const total = data.reduce((sum, visit) => sum + (visit.cost || 0), 0);
      setTotalCost(total);
      
    } catch (error) {
      console.error("Error fetching report:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-gradient-to-r from-primary-50 to-white dark:from-dark-surface dark:to-dark-bg p-6 rounded-2xl border border-primary-100 dark:border-dark-border">
         <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Laporan Kunjungan</h1>
         <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Rekapitulasi data kunjungan pasien berdasarkan periode.</p>
      </div>

      <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-soft dark:shadow-none border border-gray-100 dark:border-dark-border transition-colors">
        {/* Filter Controls - Flex Col on Mobile */}
        <div className="flex flex-col md:flex-row gap-5 mb-8 items-start md:items-end border-b border-gray-50 dark:border-gray-700 pb-6">
          <div className="w-full md:w-auto">
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Jenis Laporan</label>
            <div className="relative">
              <select 
                value={reportType} 
                onChange={(e) => setReportType(e.target.value as ReportType)}
                className="w-full md:w-48 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:text-white rounded-xl font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all appearance-none"
              >
                <option value="daily">Harian</option>
                <option value="monthly">Bulanan</option>
                <option value="yearly">Tahunan</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          <div className="w-full md:w-auto">
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Pilih Periode</label>
            <input 
              type={reportType === 'yearly' ? 'number' : (reportType === 'monthly' ? 'month' : 'date')}
              value={reportType === 'yearly' ? selectedDate.slice(0, 4) : (reportType === 'monthly' ? selectedDate.slice(0, 7) : selectedDate)}
              onChange={(e) => {
                if(reportType === 'yearly') setSelectedDate(`${e.target.value}-01-01`);
                else setSelectedDate(e.target.value);
              }}
              className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:text-white rounded-xl font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              placeholder={reportType === 'yearly' ? 'YYYY' : ''}
            />
          </div>
          
          <div className="flex-grow w-full md:w-auto md:text-right mt-2 md:mt-0">
             <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-4 rounded-2xl text-white shadow-lg shadow-primary-200 dark:shadow-none flex md:inline-flex flex-col md:items-end min-w-[150px]">
               <p className="text-xs font-bold uppercase opacity-80">Total Kunjungan</p>
               <p className="text-3xl font-bold mt-1">{visits.length}</p>
             </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-16">
             <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Waktu</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">No. RM</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pasien</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Diagnosa</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Terapi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {visits.length === 0 ? (
                   <tr>
                    <td colSpan={5} className="text-center py-16 text-gray-500 dark:text-gray-400">
                      <div className="inline-block bg-gray-50 dark:bg-gray-800 p-3 rounded-full mb-2">
                         <svg className="w-6 h-6 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      </div>
                      <p>Tidak ada data kunjungan pada periode ini.</p>
                    </td>
                  </tr>
                ) : (
                  visits.map((visit) => (
                    <tr key={visit.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {format(visit.date.toDate(), 'dd/MM/yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                         <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded font-mono text-xs border border-gray-200 dark:border-gray-600">{visit.patientRm}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary-700 dark:text-primary-400">{visit.patientName}</td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{visit.diagnosis}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{visit.therapy}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Reports;