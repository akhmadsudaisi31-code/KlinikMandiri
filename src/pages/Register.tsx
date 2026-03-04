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
  clinicType: 'Bidan' | 'Perawat' | 'Dokter';
};



function Register() {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<RegisterFormInputs>({
    defaultValues: {
      subscriptionPlan: 'YEARLY',
      clinicType: 'Bidan'
    }
  });
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const { user, loading, login: authLogin } = useAuth();
  const selectedPlan = watch('subscriptionPlan');
  const selectedType = watch('clinicType');
  const themeClass = `theme-${selectedType.toLowerCase()}`;

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
    <div className={`min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 transition-colors duration-500 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 ${themeClass}`}>
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="text-center">
            <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Register <span className="transition-colors duration-300 text-primary-600">SatSet RM</span></h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 font-bold uppercase tracking-widest">Sistem Rekam Medis Digital & Terjangkau</p>
        </div>

        <div className="mt-8 glass-card p-8 rounded-3xl shadow-2xl border border-white/60 dark:border-dark-border">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            
            <div className="mb-6">
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3 text-center">Jenis Praktek</label>
              <div className="grid grid-cols-3 gap-3">
                {(['Bidan', 'Perawat', 'Dokter'] as const).map((type) => (
                  <label 
                    key={type}
                    className={`relative cursor-pointer p-3 rounded-xl border-2 transition-all flex flex-col items-center text-center ${
                      selectedType === type
                        ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/20'
                        : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 bg-white/50'
                    }`}
                  >
                    <input type="radio" value={type} {...register('clinicType')} className="sr-only" />
                    <span className={`text-xs font-black uppercase tracking-widest transition-colors ${selectedType === type ? 'text-primary-600' : 'text-gray-400'}`}>
                        {type}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Nama Klinik / Praktek</label>
                  <input
                    type="text"
                    {...register('clinicName', { required: 'Wajib diisi' })}
                    className={`w-full px-4 py-3 bg-white/70 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white font-bold backdrop-blur-sm`}
                    placeholder="Contoh: Klinik Sehat"
                  />
                  {errors.clinicName && <p className="mt-1 text-[10px] text-red-600 font-bold">{errors.clinicName.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Nomor WhatsApp</label>
                  <input
                    type="text"
                    {...register('phone', { required: 'Nomor WhatsApp wajib' })}
                    className={`w-full px-4 py-3 bg-white/70 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white font-bold backdrop-blur-sm`}
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
                    className={`w-full px-4 py-3 bg-white/70 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white font-bold backdrop-blur-sm`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Password</label>
                  <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        {...register('password', { required: 'Password wajib', minLength: 6 })}
                        className={`w-full px-4 py-3 bg-white/70 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white font-bold backdrop-blur-sm pr-12`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
                      >
                          {showPassword ? (
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                               <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                             </svg>
                          ) : (
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                               <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                               <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                             </svg>
                          )}
                      </button>
                  </div>
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
                        ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/20'
                        : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 bg-white/40'
                    }`}
                  >
                    <input type="radio" value={plan.id} {...register('subscriptionPlan')} className="sr-only" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{plan.name}</span>
                    <span className="text-sm font-black text-gray-900 dark:text-white tracking-tighter">Rp {plan.price.toLocaleString('id-ID')}</span>
                    <span className="text-[10px] text-gray-400 font-bold">{(plan as any).duration}</span>
                    {selectedPlan === plan.id && (
                        <div className="absolute top-2 right-2 transition-colors duration-300 text-primary-600">
                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                             </svg>
                        </div>
                    )}
                  </label>
                ))}
              </div>
              <div className="mt-4 p-4 bg-white/50 dark:bg-gray-800/50 rounded-2xl">
                 <p className="text-[10px] font-black uppercase mb-2 italic text-center transition-colors duration-300 text-primary-600">Fitur Lengkap Semua Paket:</p>
                 <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {SUBSCRIPTION_PLANS[0].features.map((f, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[9px] font-bold text-gray-500 uppercase">
                           <span className="w-1 h-1 rounded-full transition-colors duration-300 bg-primary-400"></span> {f}
                        </div>
                    ))}
                 </div>
              </div>
            </div>

            {error && <p className="text-center text-xs font-bold text-red-500 uppercase">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 text-white font-black rounded-2xl shadow-xl hover:scale-[1.01] active:scale-95 transition-all duration-300 text-sm uppercase tracking-widest bg-primary-600 hover:bg-primary-700 shadow-primary-500/20"
            >
              {isSubmitting ? 'Memproses...' : 'Daftar & Pilih Paket'}
            </button>
          </form>
          
          <div className="mt-8 text-center">
             <Link to="/login" className="text-xs font-black text-gray-400 transition-colors uppercase tracking-widest group">
                Sudah punya akun? <span className="transition-colors duration-300 text-primary-600">Masuk Sekarang</span>
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
