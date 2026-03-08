import { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { Examination } from '../types';
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear, getDate, getMonth, getHours } from 'date-fns';
import { formatRupiah } from '../utils/format';
import toast from 'react-hot-toast';
import { id as localeId } from 'date-fns/locale';
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
type DataSource = 'examinations' | 'patients' | 'anc' | 'persalinan';
const ITEMS_PER_PAGE = 20;

function Reports() {
  const [reportType, setReportType] = useState<ReportType>('daily');
  const [dataSource, setDataSource] = useState<DataSource>('examinations');
  // Initialize with WIB date (UTC+7)
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
  });
  const [examinations, setExaminations] = useState<Examination[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { user } = useAuth();
  const isBidanClinic = (user?.clinicType || '').toLowerCase() === 'bidan';

  useEffect(() => {
    fetchReport();
  }, [reportType, selectedDate, dataSource, user]);

  useEffect(() => {
    // Non-bidan accounts are not allowed to open ANC/Persalinan reports
    if (!isBidanClinic && (dataSource === 'anc' || dataSource === 'persalinan')) {
      setDataSource('examinations');
    }
  }, [isBidanClinic, dataSource]);

  const fetchReport = async () => {
    setLoading(true);
    setCurrentPage(1); // Reset page on new fetch

    // Parse date as local time (WIB assumed for user)
    const dateObj = new Date(selectedDate + 'T00:00:00');

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

    if (!user) return;

    try {
      const startIso = start.toISOString();
      const endIso = end.toISOString();
      const endpoint = (dataSource === 'anc' || dataSource === 'persalinan') ? 'examinations' : dataSource;
      const response = await api.get(`/${endpoint}?startDate=${startIso}&endDate=${endIso}`);
      
      let rawData = response || [];

      if (dataSource === 'anc') {
        rawData = rawData.filter((d: any) => {
          if (!d.extendedData_json) return false;
          try {
            const ext = typeof d.extendedData_json === 'string' ? JSON.parse(d.extendedData_json) : d.extendedData_json;
            return ext.category === 'Bumil' || ext.hpht || ext.lila;
          } catch(e) { return false; }
        });
      } else if (dataSource === 'persalinan') {
        rawData = rawData.filter((d: any) => {
          if (!d.extendedData_json) return false;
          try {
            const ext = typeof d.extendedData_json === 'string' ? JSON.parse(d.extendedData_json) : d.extendedData_json;
            return ext.category === 'Persalinan' || ext.isPersalinan === true;
          } catch(e) { return false; }
        });
      }

      if (dataSource === 'examinations' || dataSource === 'anc' || dataSource === 'persalinan') {
        const data = rawData.map((d: any) => {
           let ext = {};
           try { ext = d.extendedData_json ? (typeof d.extendedData_json === 'string' ? JSON.parse(d.extendedData_json) : d.extendedData_json) : {}; } catch(e) {}
           return { 
               ...d,
               ...ext,
               // Normalize fields for report consistency
               diagnosa: d.diagnosa || d.diagnosis,
               cost: d.cost || d.biaya,
               medicines: d.medicines || [],
               therapy: d.therapy 
           } as any;
        });
        setExaminations(data);
        setPatients([]);
      } else {
        setPatients(rawData);
        setExaminations([]);
      }

    } catch (error) {
      console.error("Error fetching report:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus data ini?')) return;

    try {
      const deleteEndpoint = (dataSource === 'anc' || dataSource === 'persalinan') ? 'examinations' : dataSource;
      await api.delete(`/${deleteEndpoint}/${id}`);
      toast.success('Data berhasil dihapus');
      
      // Update local state
      if (dataSource === 'examinations' || dataSource === 'anc' || dataSource === 'persalinan') {
        setExaminations(prev => prev.filter(item => item.id !== id));
      } else {
        setPatients(prev => prev.filter(item => item.id !== id));
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error('Gagal menghapus data');
    }
  };

  const handleExportToExcel = () => {
    if (currentData.length === 0) return;

    let exportData: any[] = [];
    
    if (dataSource === 'anc') {
      exportData = currentData.map((d: any, index: number) => ({
        'NO': index + 1,
        'NAMA BUMIL': d.patientName || '-',
        'NAMA SUAMI': d.namaSuami || '-',
        'UMUR': d.ageDisplay || '-',
        'ALAMAT': d.address || '-',
        'HAMIL KE': d.hamilKe || '-',
        'UK': d.usiaKehamilan || '-',
        'ANAK TERKECIL': d.anakTerkecil || '-',
        'HPHT': d.hpht || '-',
        'HPL': d.hpl || '-',
        'TANGGAL KUNJUNGAN K1': d.kunjunganAnc === 'K1' ? (d.date ? format(new Date(d.date), 'dd/MM/yyyy') : '-') : '-',
        'TANGGAL KUNJUNGAN K4': d.kunjunganAnc === 'K4' ? (d.date ? format(new Date(d.date), 'dd/MM/yyyy') : '-') : '-',
        'TB': d.tb || '-',
        'BB': d.bb || '-',
        'TD': d.tensi || '-',
        'STATUS TT': d.statusTT || '-',
        'LILA': d.lila || '-',
        'SKOR': d.skor || '-',
        'USG': d.usg || '-'
      }));
    } else if (dataSource === 'persalinan') {
      exportData = currentData.map((d: any, index: number) => ({
         'NO': index + 1,
         'NAMA BULIN': d.patientName || '-',
         'NAMA SUAMI': d.namaSuami || '-',
         'UMUR': d.ageDisplay || '-',
         'ALAMAT': d.address || '-',
         'HAMIL KE': d.hamilKe || '-',
         'UK': d.usiaKehamilan || '-',
         'JENIS PERSALINAN': d.jenisPersalinan || '-',
         'PENOLONG': d.penolong || '-',
         'TEMPAT': d.tempat || '-',
         'JENIS KELAMIN': d.jenisKelamin || '-',
         'TGL PARTUS': d.tglPartus ? format(new Date(d.tglPartus), 'dd/MM/yyyy') : '-',
         'JAM PARTUS': d.jamPartus || '-',
         'AS': d.as || '-',
         'BBL': d.bbl || '-',
         'PB': d.pb || '-',
         'LIKA': d.lika || '-',
         'VIT K': d.vitK || '-',
         'HB 0': d.hb0 || '-'
      }));
    } else {
       // Regular Export for others
       exportData = currentData.map((d: any) => {
         const out: any = { 
            'ID': d.id || '-',
            'Waktu': d.createdAt ? format(new Date(d.createdAt), 'dd/MM/yyyy HH:mm') : '-',
         };
         if (d.patientRm || d.rm) out['No. RM'] = d.patientRm || d.rm;
         if (d.name || d.patientName) out['Nama'] = d.name || d.patientName;
         if (d.diagnosa || d.diagnosis) out['Diagnosa'] = d.diagnosa || d.diagnosis;
         
         return out;
       });
    }

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Laporan ${dataSource}`);
    XLSX.writeFile(wb, `Laporan_${dataSource}_${selectedDate}.xlsx`);
  };

  // --- CHART LOGIC ---
  const chartData = useMemo(() => {
    if (examinations.length === 0) return null;

    // 1. Diagnosa Distribution
    const diagnosisCounts: Record<string, number> = {};
    examinations.forEach(v => {
      const d = v.diagnosa || 'Tanpa Diagnosa';
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

      examinations.forEach(v => {
        const d = v.createdAt ? new Date(v.createdAt) : new Date();
        const day = getDate(d);
        dayCounts[day - 1]++;
      });
      trendValues = dayCounts;

    } else if (reportType === 'yearly') {
      // Group by Month (Jan..Dec)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      trendLabels = months;
      const monthCounts = new Array(12).fill(0);

      examinations.forEach(v => {
        const d = v.createdAt ? new Date(v.createdAt) : new Date();
        const m = getMonth(d);
        monthCounts[m]++;
      });
      trendValues = monthCounts;
    } else {
      // Daily: Group by Hour?
      trendLabels = ['00', '03', '06', '09', '12', '15', '18', '21']; // Simplified buckets
      const hourCounts = new Array(8).fill(0);
      examinations.forEach(v => {
        const d = v.createdAt ? new Date(v.createdAt) : new Date();
        const h = getHours(d);
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
  }, [examinations, reportType, selectedDate]);

  // --- PAGINATION LOGIC ---
  const currentData = (dataSource === 'examinations' || dataSource === 'anc' || dataSource === 'persalinan') ? examinations : patients;
  const totalPages = Math.ceil(currentData.length / ITEMS_PER_PAGE);
  const currentTableData = currentData.slice(
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
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Jenis Data</label>
            <div className="relative">
              <select
                value={dataSource}
                onChange={(e) => setDataSource(e.target.value as DataSource)}
                className="w-full md:w-56 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:text-white rounded-xl font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all appearance-none"
              >
                <option value="examinations">Laporan Pemeriksaan (Poli)</option>
                <option value="patients">Laporan Pendaftaran</option>
                {isBidanClinic && <option value="anc">Laporan Pelayanan ANC</option>}
                {isBidanClinic && <option value="persalinan">Laporan Persalinan</option>}
              </select>
            </div>
          </div>

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
              <p className="text-xs font-bold uppercase opacity-80">{dataSource === 'patients' ? 'Total Pendaftaran' : 'Total Pemeriksaan'}</p>
              <p className="text-3xl font-bold mt-1">{currentData.length}</p>
            </div>

            {(dataSource === 'examinations' || dataSource === 'anc' || dataSource === 'persalinan') && (
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-2xl text-white shadow-lg shadow-green-200 dark:shadow-none flex md:inline-flex flex-col md:items-end min-w-[150px] ml-4 mt-2 md:mt-0">
                <p className="text-xs font-bold uppercase opacity-80">Total Pendapatan</p>
                <p className="text-xl font-bold mt-1">{formatRupiah(currentData.reduce((acc: number, curr: any) => acc + (Number(curr.cost) || 0), 0))}</p>
              </div>
            )}
            
            <button
              onClick={handleExportToExcel}
              disabled={currentData.length === 0}
              className="mt-4 md:mt-0 ml-4 px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold transition-all disabled:opacity-50 flex md:inline-flex items-center justify-center gap-2 shadow-lg shadow-purple-200 dark:shadow-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Export Excel
            </button>
          </div>
        </div>

        {/* --- CHARTS SECTION --- */}
        {!loading && chartData && dataSource === 'examinations' && examinations.length > 0 && (
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
                  {dataSource === 'anc' ? (
                    <>
                      <tr>
                        <th rowSpan={2} className="px-4 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap border-b border-gray-100 dark:border-gray-800">NO</th>
                        <th rowSpan={2} className="px-4 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap border-b border-gray-100 dark:border-gray-800">NAMA BUMIL</th>
                        <th rowSpan={2} className="px-4 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap border-b border-gray-100 dark:border-gray-800">NAMA SUAMI</th>
                        <th rowSpan={2} className="px-4 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap border-b border-gray-100 dark:border-gray-800">UMUR</th>
                        <th rowSpan={2} className="px-4 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap border-b border-gray-100 dark:border-gray-800">ALAMAT</th>
                        <th rowSpan={2} className="px-4 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap border-b border-gray-100 dark:border-gray-800">HAMIL KE</th>
                        <th rowSpan={2} className="px-4 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap border-b border-gray-100 dark:border-gray-800">UK</th>
                        <th rowSpan={2} className="px-4 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap border-b border-gray-100 dark:border-gray-800">ANAK TERKECIL</th>
                        <th rowSpan={2} className="px-4 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap border-b border-gray-100 dark:border-gray-800">HPHT</th>
                        <th rowSpan={2} className="px-4 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap border-b border-gray-100 dark:border-gray-800">HPL</th>
                        <th colSpan={2} className="px-4 py-2 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap border-b border-gray-100 dark:border-gray-800">TANGGAL KUNJUNGAN</th>
                        <th rowSpan={2} className="px-4 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap border-b border-gray-100 dark:border-gray-800">TB</th>
                        <th rowSpan={2} className="px-4 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap border-b border-gray-100 dark:border-gray-800">BB</th>
                        <th rowSpan={2} className="px-4 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap border-b border-gray-100 dark:border-gray-800">TD</th>
                        <th rowSpan={2} className="px-4 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap border-b border-gray-100 dark:border-gray-800">STATUS TT</th>
                        <th rowSpan={2} className="px-4 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap border-b border-gray-100 dark:border-gray-800">LILA</th>
                        <th rowSpan={2} className="px-4 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap border-b border-gray-100 dark:border-gray-800">SKOR</th>
                        <th rowSpan={2} className="px-4 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap border-b border-gray-100 dark:border-gray-800">USG</th>
                        <th rowSpan={2} className="px-4 py-4 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap border-b border-gray-100 dark:border-gray-800 sticky right-0 bg-gray-50 dark:bg-gray-800/50">Aksi</th>
                      </tr>
                      <tr>
                        <th className="px-4 py-2 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap bg-gray-50/80 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-800">K1</th>
                        <th className="px-4 py-2 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap bg-gray-50/80 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-800">K4</th>
                      </tr>
                    </>
                  ) : dataSource === 'persalinan' ? (
                    <tr>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">NO</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">NAMA BULIN</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">NAMA SUAMI</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">UMUR</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">ALAMAT</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">HAMIL KE</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">UK</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">JENIS PERSALINAN</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">PENOLONG</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">TEMPAT</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">JENIS KELAMIN</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">TGL PARTUS</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">JAM PARTUS</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">AS</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">BBL</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">PB</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">LIKA</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">VIT K</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">HB 0</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap sticky right-0 bg-gray-50 dark:bg-gray-800/50">Aksi</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Waktu</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">No. RM</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pasien</th>
                      {dataSource === 'examinations' ? (
                        <>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Diagnosa</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Terapi</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Biaya</th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider sticky right-0 bg-gray-50 dark:bg-gray-800/50">Aksi</th>
                        </>
                      ) : (
                        <>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Umur</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Alamat</th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider sticky right-0 bg-gray-50 dark:bg-gray-800/50">Aksi</th>
                        </>
                      )}
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {currentData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-16 text-gray-500 dark:text-gray-400">
                        <div className="inline-block bg-gray-50 dark:bg-gray-800 p-3 rounded-full mb-2">
                          <svg className="w-6 h-6 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        </div>
                        <p>Tidak ada data pada periode ini.</p>
                      </td>
                    </tr>
                  ) : dataSource === 'examinations' ? (
                    currentTableData.map((examination: any) => (
                      <tr key={examination.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {examination.createdAt ? format(new Date(examination.createdAt), 'dd/MM/yyyy HH:mm', { locale: localeId }) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded font-mono text-xs border border-gray-200 dark:border-gray-600">{examination.patientRm}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary-700 dark:text-primary-400">{examination.patientName}</td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{examination.diagnosa || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                          {examination.medicines && examination.medicines.length > 0
                            ? examination.medicines.map((m: any) => m.medicineName).join(', ')
                            : (examination.therapy || '-')
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                          {examination.cost ? formatRupiah(Number(examination.cost)) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <button
                            onClick={() => handleDelete(examination.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                            title="Hapus"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : dataSource === 'anc' ? (
                    currentTableData.map((examination: any, index: number) => (
                      <tr key={examination.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{index + 1}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-primary-700 dark:text-primary-400">{examination.patientName || '-'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{examination.namaSuami || '-'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{examination.ageDisplay || '-'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{examination.address || '-'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-700 dark:text-gray-300">{examination.hamilKe || '-'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-700 dark:text-gray-300">{examination.usiaKehamilan || '-'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-700 dark:text-gray-300">{examination.anakTerkecil || '-'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{examination.hpht || '-'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{examination.hpl || '-'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-700 dark:text-gray-300">
                          {examination.kunjunganAnc === 'K1' ? (examination.createdAt ? format(new Date(examination.createdAt), 'dd/MM/yyyy') : '-') : '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-700 dark:text-gray-300">
                          {examination.kunjunganAnc === 'K4' ? (examination.createdAt ? format(new Date(examination.createdAt), 'dd/MM/yyyy') : '-') : '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-700 dark:text-gray-300">{examination.tb || '-'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-700 dark:text-gray-300">{examination.bb || '-'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-700 dark:text-gray-300">{examination.tensi || '-'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-700 dark:text-gray-300">{examination.statusTT || '-'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-700 dark:text-gray-300">{examination.lila || '-'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-700 dark:text-gray-300">{examination.skor || '-'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{examination.usg || '-'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 sticky right-0 bg-white dark:bg-dark-surface p-2 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.1)]">
                          <button
                            onClick={() => handleDelete(examination.id)}
                            className="bg-white border rounded text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors p-2 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : dataSource === 'persalinan' ? (
                    currentTableData.map((examination: any, index: number) => (
                      <tr key={examination.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{index + 1}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-primary-700 dark:text-primary-400">{examination.patientName || '-'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{examination.namaSuami || '-'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{examination.ageDisplay || '-'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{examination.address || '-'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-700 dark:text-gray-300">{examination.hamilKe || '-'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-700 dark:text-gray-300">{examination.usiaKehamilan || '-'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{examination.jenisPersalinan || '-'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{examination.penolong || '-'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{examination.tempat || '-'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-700 dark:text-gray-300">{examination.jenisKelamin || '-'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{examination.tglPartus ? format(new Date(examination.tglPartus), 'dd/MM/yyyy') : '-'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{examination.jamPartus || '-'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-700 dark:text-gray-300">{examination.as || '-'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-700 dark:text-gray-300">{examination.bbl || '-'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-700 dark:text-gray-300">{examination.pb || '-'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-700 dark:text-gray-300">{examination.lika || '-'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-700 dark:text-gray-300">{examination.vitK || '-'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-700 dark:text-gray-300">{examination.hb0 || '-'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <button
                            onClick={() => handleDelete(examination.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    currentTableData.map((patient: any) => (
                      <tr key={patient.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {patient.createdAt ? format(new Date(patient.createdAt), 'dd/MM/yyyy HH:mm', { locale: localeId }) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded font-mono text-xs border border-gray-200 dark:border-gray-600">{patient.rm}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary-700 dark:text-primary-400">{patient.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{patient.ageDisplay}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{patient.address}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <button
                            onClick={() => handleDelete(patient.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                            title="Hapus"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {examinations.length > ITEMS_PER_PAGE && (
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
                      Menampilkan <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> sampai <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, examinations.length)}</span> dari <span className="font-medium">{examinations.length}</span> hasil
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
