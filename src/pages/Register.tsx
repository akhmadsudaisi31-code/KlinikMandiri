import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { api } from '../api';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SUBSCRIPTION_PLANS } from '../types';
import toast from 'react-hot-toast';

type RegisterFormInputs = {
  clinicName: string;
  email: string;
  password: string;
  phone: string;
  subscriptionPlan: string;
};

function Register() {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<RegisterFormInputs>({
    defaultValues: {
      subscriptionPlan: 'YEARLY'
    }
  });
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, loading, login: authLogin } = useAuth();
  const selectedPlan = watch('subscriptionPlan');

  const onSubmit: SubmitHandler<RegisterFormInputs> = async (data) => {
    setError(null);
    try {
      const response: any = await api.post('/auth/register', data);
      
      // Auto-login after registration
      const userData = {
        uid: response.user.id,
        email: response.user.email,
        displayName: response.user.name,
        status: response.user.status,
        isAdmin: response.user.isAdmin,
        subscriptionPlan: response.user.subscriptionPlan
      };
      
      authLogin(response.token, userData);
      
      toast.success('Pendaftaran Berhasil! Silakan lakukan konfirmasi pembayaran.');
      navigate('/activation-pending');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Gagal mendaftar.');
      toast.error('Gagal mendaftar.');
    }
  };

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="text-center">
            <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Register <span className="text-primary-600">SatSet RM</span></h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 font-bold uppercase tracking-widest">Sistem Rekam Medis Digital & Terjangkau</p>
        </div>

        <div className="mt-8 glass-card p-8 rounded-3xl shadow-2xl border border-gray-100 dark:border-dark-border">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Nama Klinik / Praktek</label>
                  <input
                    type="text"
                    {...register('clinicName', { required: 'Wajib diisi' })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white font-bold"
                    placeholder="Contoh: Klinik Sehat"
                  />
                  {errors.clinicName && <p className="mt-1 text-[10px] text-red-600 font-bold">{errors.clinicName.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Nomor WhatsApp</label>
                  <input
                    type="text"
                    {...register('phone', { required: 'Nomor WhatsApp wajib' })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white font-bold"
                    placeholder="081xxx"
                  />
                  {errors.phone && <p className="mt-1 text-[10px] text-red-600 font-bold">{errors.phone.message}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Email</label>
                  <input
                    type="email"
                    {...register('email', { required: 'Email wajib' })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Password</label>
                  <input
                    type="password"
                    {...register('password', { required: 'Password wajib', minLength: 6 })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white font-bold"
                  />
                </div>
            </div>

            <div className="pt-4">
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Pilih Paket Berlangganan (Harga Terjangkau)</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {SUBSCRIPTION_PLANS.map((plan) => (
                  <label 
                    key={plan.id} 
                    className={`relative cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col items-center text-center ${
                      selectedPlan === plan.id 
                        ? 'border-primary-500 bg-primary-50/30 dark:bg-primary-900/10' 
                        : 'border-gray-100 dark:border-gray-800 hover:border-gray-200'
                    }`}
                  >
                    <input type="radio" value={plan.id} {...register('subscriptionPlan')} className="sr-only" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{plan.name}</span>
                    <span className="text-sm font-black text-gray-900 dark:text-white tracking-tighter">Rp {plan.price.toLocaleString('id-ID')}</span>
                    <span className="text-[10px] text-gray-400 font-bold">{(plan as any).duration}</span>
                    {selectedPlan === plan.id && (
                        <div className="absolute top-2 right-2 text-primary-600">
                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                             </svg>
                        </div>
                    )}
                  </label>
                ))}
              </div>
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                 <p className="text-[10px] font-black text-primary-600 uppercase mb-2 italic text-center">Fitur Lengkap Semua Paket:</p>
                 <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {SUBSCRIPTION_PLANS[0].features.map((f, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[9px] font-bold text-gray-500 uppercase">
                           <span className="w-1 h-1 bg-primary-400 rounded-full"></span> {f}
                        </div>
                    ))}
                 </div>
              </div>
            </div>

            {error && <p className="text-center text-xs font-bold text-red-500 uppercase">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-500/20 hover:bg-primary-700 hover:scale-[1.01] active:scale-95 transition-all text-sm uppercase tracking-widest"
            >
              {isSubmitting ? 'Memproses...' : 'Daftar & Pilih Paket'}
            </button>
          </form>
          
          <div className="mt-8 text-center">
             <Link to="/login" className="text-xs font-black text-gray-400 hover:text-primary-600 transition-all uppercase tracking-widest">
                Sudah punya akun? <span className="text-primary-500">Masuk Sekarang</span>
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
