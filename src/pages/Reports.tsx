import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Visit } from '../types';
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear, getDate, getMonth, getHours } from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

type ReportType = 'daily' | 'monthly' | 'yearly';
const ITEMS_PER_PAGE = 20;

function Reports() {
  const [reportType, setReportType] = useState<ReportType>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchReport();
  }, [reportType, selectedDate]);

  const fetchReport = async () => {
    setLoading(true);
    setCurrentPage(1); // Reset page on new fetch
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

    } catch (error) {
      console.error("Error fetching report:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- CHART LOGIC ---
  const chartData = useMemo(() => {
    if (visits.length === 0) return null;

    // 1. Diagnosa Distribution
    const diagnosisCounts: Record<string, number> = {};
    visits.forEach(v => {
      const d = v.diagnosis || 'Tanpa Diagnosa';
      diagnosisCounts[d] = (diagnosisCounts[d] || 0) + 1;
    });

    const sortedDiagnoses = Object.entries(diagnosisCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5); // Top 5

    // Calculate others if need be, but for simplicity let's just show top 5
    const diagLabels = sortedDiagnoses.map(([k]) => k);
    const diagValues = sortedDiagnoses.map(([, v]) => v);

    const diagnosisChart = {
      labels: diagLabels,
      datasets: [
        {
          label: 'Jumlah Kasus',
          data: diagValues,
          backgroundColor: [
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };

    // 2. Trend Chart
    let trendLabels: string[] = [];
    let trendValues: number[] = [];

    if (reportType === 'monthly') {
      // Group by Date (1..31)
      const daysInMonth = new Date(new Date(selectedDate).getFullYear(), new Date(selectedDate).getMonth() + 1, 0).getDate();
      trendLabels = Array.from({ length: daysInMonth }, (_, i) => String(i + 1));
      const dayCounts = new Array(daysInMonth).fill(0);

      visits.forEach(v => {
        const day = getDate(v.date.toDate());
        dayCounts[day - 1]++;
      });
      trendValues = dayCounts;

    } else if (reportType === 'yearly') {
      // Group by Month (Jan..Dec)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      trendLabels = months;
      const monthCounts = new Array(12).fill(0);

      visits.forEach(v => {
        const m = getMonth(v.date.toDate());
        monthCounts[m]++;
      });
      trendValues = monthCounts;
    } else {
      // Daily: Group by Hour?
      trendLabels = ['00', '03', '06', '09', '12', '15', '18', '21']; // Simplified buckets
      const hourCounts = new Array(8).fill(0);
      visits.forEach(v => {
        const h = getHours(v.date.toDate());
        const bucket = Math.floor(h / 3);
        if (bucket < 8) hourCounts[bucket]++;
      });
      trendValues = hourCounts;
      trendLabels = trendLabels.map(h => `${h}:00`);
    }

    const trendChart = {
      labels: trendLabels,
      datasets: [
        {
          label: 'Kunjungan',
          data: trendValues,
          borderColor: 'rgb(53, 162, 235)',
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
          tension: 0.3,
        },
      ],
    };

    return { diagnosisChart, trendChart };
  }, [visits, reportType, selectedDate]);

  // --- PAGINATION LOGIC ---
  const totalPages = Math.ceil(visits.length / ITEMS_PER_PAGE);
  const currentTableData = visits.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-gradient-to-r from-primary-50 to-white dark:from-dark-surface dark:to-dark-bg p-6 rounded-2xl border border-primary-100 dark:border-dark-border">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Laporan Kunjungan</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Rekapitulasi data kunjungan pasien dengan visualisasi grafik.</p>
      </div>

      <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-soft dark:shadow-none border border-gray-100 dark:border-dark-border transition-colors">
        {/* Filter Controls */}
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
            </div>
          </div>

          <div className="w-full md:w-auto">
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Pilih Periode</label>
            <input
              type={reportType === 'yearly' ? 'number' : (reportType === 'monthly' ? 'month' : 'date')}
              value={reportType === 'yearly' ? selectedDate.slice(0, 4) : (reportType === 'monthly' ? selectedDate.slice(0, 7) : selectedDate)}
              onChange={(e) => {
                if (reportType === 'yearly') setSelectedDate(`${e.target.value}-01-01`);
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

        {/* --- CHARTS SECTION --- */}
        {!loading && chartData && visits.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 text-center">Tren Kunjungan</h3>
              <div className="h-64 flex items-center justify-center">
                <Line
                  data={chartData.trendChart}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: { beginAtZero: true, ticks: { precision: 0 } }
                    }
                  }}
                />
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 text-center">Top 5 Diagnosa</h3>
              <div className="h-64 flex items-center justify-center relative">
                <Doughnut
                  data={chartData.diagnosisChart}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'right', labels: { boxWidth: 10 } } }
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent"></div>
          </div>
        ) : (
          <>
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
                    currentTableData.map((visit) => (
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

            {/* Pagination Controls */}
            {visits.length > ITEMS_PER_PAGE && (
              <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 px-4 py-3 sm:px-6 mt-4">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Menampilkan <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> sampai <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, visits.length)}</span> dari <span className="font-medium">{visits.length}</span> hasil
                    </p>
                  </div>
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                        </svg>
                      </button>

                      {/* Page Numbers (Simplified 1 of N) */}
                      <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 focus:outline-offset-0 bg-white dark:bg-gray-800 dark:text-white border-0">
                        Halaman {currentPage} dari {totalPages}
                      </span>

                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                      >
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Reports;