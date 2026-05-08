import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { api } from '../api';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CLINIC_TYPES, ClinicType, SUBSCRIPTION_PLANS, getPlanPrice, TIERS, TierId } from '../types';
import toast from 'react-hot-toast';
import { getClinicThemeClass } from '../utils/clinic';

type RegisterFormInputs = {
  clinicName: string;
  email: string;
  password: string;
  phone: string;
  subscriptionPlan: string;
  clinicType: ClinicType;
};



function Register() {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<RegisterFormInputs & { tier: TierId }>({
    defaultValues: {
      subscriptionPlan: 'YEARLY',
      clinicType: 'Bidan',
      tier: 'STANDARD'
    }
  });
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const { user, loading, login: authLogin } = useAuth();
  const selectedPlan = watch('subscriptionPlan');
  const selectedType = watch('clinicType');
  const selectedTier = watch('tier');
  const themeClass = getClinicThemeClass(selectedType);

  const onSubmit: SubmitHandler<RegisterFormInputs & { tier: TierId }> = async (data) => {
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
        subscriptionPlan: response.user.subscriptionPlan,
        clinicType: response.user.clinicType,
        tier: response.user.tier,
      };
      
      authLogin(response.token, userData);
      
      toast.success('Pendaftaran Berhasil! Silakan lakukan konfirmasi pembayaran.', { id: 'reg-toast' });
      navigate('/activation-pending');
    } catch (err: any) {
      const errorMessage = err?.message || err?.response?.data?.error || 'Gagal mendaftar.';
      setError(errorMessage);
      toast.error(errorMessage, { id: 'reg-toast' });
    }
  };

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-dark-bg transition-colors duration-500 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 ${themeClass}`}>
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="text-center space-y-3">
            <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
              DAFTARKAN <span className="transition-colors duration-300 text-primary-600">KLINIKMANDIRI</span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-[0.2em] max-w-md mx-auto leading-relaxed">
              Mulai kelola pasien dan pelayanan klinik dengan lebih rapi dan profesional
            </p>
        </div>

        <div className="mt-10 bg-white dark:bg-dark-surface p-8 rounded-[2.5rem] shadow-2xl border-2 border-gray-900 dark:border-dark-border relative overflow-hidden">
          {/* Subtle Background Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>

          <form className="space-y-8 relative z-10" onSubmit={handleSubmit(onSubmit)}>
            
            <div className="space-y-4">
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] text-center">Jenis Praktek</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {CLINIC_TYPES.map((type) => (
                  <label 
                    key={type}
                    className={`relative cursor-pointer p-3 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center min-h-[60px] ${
                      selectedType === type
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 shadow-lg shadow-primary-500/10'
                        : 'border-gray-900 dark:border-slate-800 hover:border-primary-200 dark:hover:border-primary-900/50 bg-slate-50/50 dark:bg-slate-900/50'
                    }`}
                  >
                    <input type="radio" value={type} {...register('clinicType')} className="sr-only" />
                    <span className={`text-[9px] font-black uppercase tracking-wider leading-tight transition-all duration-300 ${selectedType === type ? 'text-primary-700 dark:text-primary-400' : 'text-slate-500 dark:text-slate-400'}`}>
                        {type}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Nama Klinik / Praktek <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    {...register('clinicName', { required: 'Wajib diisi' })}
                    className="w-full px-5 py-3.5 bg-white dark:bg-slate-900 border-2 border-gray-900 dark:border-slate-800 rounded-2xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all dark:text-white font-bold text-sm"
                    placeholder="Contoh: Klinik Sehat"
                  />
                  {errors.clinicName && <p className="mt-1 text-[10px] text-red-600 font-bold pl-1">{errors.clinicName.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Nomor WhatsApp <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    {...register('phone', { required: 'Nomor WhatsApp wajib' })}
                    className="w-full px-5 py-3.5 bg-white dark:bg-slate-900 border-2 border-gray-900 dark:border-slate-800 rounded-2xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all dark:text-white font-bold text-sm"
                    placeholder="081xxx"
                  />
                  {errors.phone && <p className="mt-1 text-[10px] text-red-600 font-bold pl-1">{errors.phone.message}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Email <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    {...register('email', { required: 'Email wajib' })}
                    className="w-full px-5 py-3.5 bg-white dark:bg-slate-900 border-2 border-gray-900 dark:border-slate-800 rounded-2xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all dark:text-white font-bold text-sm"
                    placeholder="nama@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Password <span className="text-red-500">*</span></label>
                  <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        {...register('password', { required: 'Password wajib', minLength: 6 })}
                        className="w-full px-5 py-3.5 bg-white dark:bg-slate-900 border-2 border-gray-900 dark:border-slate-800 rounded-2xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all dark:text-white font-bold text-sm pr-12"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-primary-500 focus:outline-none"
                      >
                          {showPassword ? (
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                               <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                             </svg>
                          ) : (
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                               <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                               <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                             </svg>
                          )}
                      </button>
                  </div>
                </div>
            </div>

            {/* TIER SELECTION */}
            <div className="space-y-6">
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] text-center">Pilih Tier Fitur</label>
              <div className="grid grid-cols-3 gap-3">
                {TIERS.map((tier) => (
                  <label 
                    key={tier.id}
                    className={`relative cursor-pointer p-4 rounded-3xl border-2 transition-all flex flex-col items-center text-center ${
                      selectedTier === tier.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 shadow-lg shadow-primary-500/10'
                        : 'border-gray-900 dark:border-slate-800 hover:border-primary-200 dark:hover:border-primary-900/50 bg-slate-50/50 dark:bg-slate-900/50'
                    }`}
                  >
                    <input type="radio" value={tier.id} {...register('tier')} className="sr-only" />
                    <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${selectedTier === tier.id ? 'text-primary-700 dark:text-primary-300' : 'text-slate-500 dark:text-slate-400'}`}>
                      {tier.name}
                    </span>
                    <p className="text-[8px] font-bold text-slate-400 leading-tight uppercase">{tier.description}</p>
                  </label>
                ))}
              </div>

              {/* TIER FEATURES PREVIEW */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] p-6 border-2 border-gray-900 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                   <span className="w-4 h-[2px] bg-primary-500"></span>
                   Fitur yang didapat
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6">
                   {TIERS.find(t => t.id === selectedTier)?.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-emerald-500">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{feature}</span>
                      </div>
                   ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] text-center">Pilih Durasi Langganan</label>
              <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                {SUBSCRIPTION_PLANS.map((plan) => (
                  <label 
                    key={plan.id} 
                    className={`relative cursor-pointer p-5 rounded-3xl border-2 transition-all flex flex-col items-center text-center ${
                      selectedPlan === plan.id 
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 shadow-lg shadow-primary-500/10'
                        : 'border-gray-900 dark:border-slate-800 hover:border-primary-200 dark:hover:border-primary-900/50 bg-slate-50/50 dark:bg-slate-900/50'
                    }`}
                  >
                    <input type="radio" value={plan.id} {...register('subscriptionPlan')} className="sr-only" />
                    <span className={`text-[9px] font-black uppercase tracking-widest mb-1 ${selectedPlan === plan.id ? 'text-primary-600' : 'text-slate-400 dark:text-slate-500'}`}>{plan.name}</span>
                    <span className={`text-lg font-black tracking-tighter ${selectedPlan === plan.id ? 'text-primary-700 dark:text-white' : 'text-slate-900 dark:text-slate-300'}`}>
                      Rp {getPlanPrice(plan.id, selectedTier).toLocaleString('id-ID')}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">{plan.duration}</span>
                    {selectedPlan === plan.id && (
                        <div className="absolute top-3 right-3 text-primary-600">
                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                             </svg>
                        </div>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {error && <p className="text-center text-xs font-black text-red-500 uppercase tracking-widest bg-red-50 dark:bg-red-900/20 py-3 rounded-xl">{error}</p>}


            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-5 text-white font-black rounded-3xl shadow-2xl hover:scale-[1.02] active:scale-95 transition-all duration-300 text-sm uppercase tracking-[0.2em] bg-primary-600 hover:bg-primary-700 shadow-primary-500/30 disabled:opacity-50"
            >
              {isSubmitting ? 'Mempersiapkan Aplikasi...' : 'DAFTAR SEKARANG 🚀'}
            </button>
          </form>
          
          <div className="mt-10 text-center">
             <Link to="/login" className="text-xs font-black text-slate-400 dark:text-slate-500 transition-colors uppercase tracking-widest hover:text-primary-600">
                Sudah punya akun? <span className="text-primary-600 underline underline-offset-4 decoration-2">Masuk Sekarang</span>
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
