import { useEffect, useState } from 'react';
import { api } from '../api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export function AdvancedStatsSection() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/stats/advanced')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse h-64 bg-gray-100 dark:bg-gray-800 rounded-3xl" />;
  if (!data) return null;

  const revenueData = {
    labels: data.revenue.map((r: any) => r.month),
    datasets: [{
      label: 'Pendapatan (IDR)',
      data: data.revenue.map((r: any) => r.total),
      backgroundColor: 'rgba(59, 130, 246, 0.5)',
      borderColor: 'rgb(59, 130, 246)',
      borderWidth: 2,
      borderRadius: 8,
    }]
  };

  const diagnosisData = {
    labels: data.diagnoses.map((d: any) => `${d.icd10} - ${d.diagnosa.substring(0, 15)}...`),
    datasets: [{
      label: 'Jumlah Kasus',
      data: data.diagnoses.map((d: any) => d.count),
      backgroundColor: [
        'rgba(255, 99, 132, 0.6)',
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 206, 86, 0.6)',
        'rgba(75, 192, 192, 0.6)',
        'rgba(153, 102, 255, 0.6)',
      ],
    }]
  };

  const genderData = {
    labels: data.gender.map((g: any) => g.gender),
    datasets: [{
      data: data.gender.map((g: any) => g.count),
      backgroundColor: ['rgba(54, 162, 235, 0.6)', 'rgba(255, 99, 132, 0.6)'],
    }]
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
         <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
            <span className="w-2 h-6 bg-primary-600 rounded-full"></span>
            Statistik Bisnis Lanjutan
         </h3>
         <span className="text-[10px] font-black bg-primary-600 text-white px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-primary-500/20">PRO FEATURE</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white dark:bg-dark-surface p-6 rounded-[2rem] border border-gray-100 dark:border-dark-border shadow-soft">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Tren Pendapatan (6 Bulan)</p>
          <div className="h-64">
            <Line 
              data={revenueData} 
              options={{ 
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, grid: { display: false } }, x: { grid: { display: false } } }
              }} 
            />
          </div>
        </div>

        {/* Top Diagnoses */}
        <div className="bg-white dark:bg-dark-surface p-6 rounded-[2rem] border border-gray-100 dark:border-dark-border shadow-soft">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Top 5 Diagnosa (ICD-10)</p>
          <div className="h-64">
            <Bar 
              data={diagnosisData} 
              options={{ 
                indexAxis: 'y',
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { beginAtZero: true, grid: { display: false } }, y: { grid: { display: false } } }
              }} 
            />
          </div>
        </div>

        {/* Gender Distribution */}
        <div className="bg-white dark:bg-dark-surface p-6 rounded-[2rem] border border-gray-100 dark:border-dark-border shadow-soft lg:col-span-2">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Distribusi Pasien (Gender)</p>
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="h-48 w-48 shrink-0">
              <Pie 
                data={genderData} 
                options={{ maintainAspectRatio: false }}
              />
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4 w-full">
              {data.gender.map((g: any, i: number) => (
                <div key={i} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{g.gender}</p>
                  <p className="text-2xl font-black text-gray-900 dark:text-white">{g.count} <span className="text-sm font-medium opacity-40">Orang</span></p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
