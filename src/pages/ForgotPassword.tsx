import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { api } from '../api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

type ForgotPasswordInputs = {
    email: string;
};

function ForgotPassword() {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordInputs>();
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const onSubmit: SubmitHandler<ForgotPasswordInputs> = async (data) => {
        setError(null);
        setSuccessMessage(null);
        try {
            await api.post('/auth/reset-password', { email: data.email });
            setSuccessMessage(`Email reset password telah dikirim ke ${data.email}. Silakan cek kotak masuk atau folder spam Anda.`);
            toast.success('Email reset terkirim!');
        } catch (err: any) {
            console.error("Forgot Password Error:", err);
            setError('Gagal mengirim email reset. Coba lagi nanti.');
            toast.error('Gagal memproses permintaan.');
        }
    };

    return (
        <div className="min-h-screen bg-surface dark:bg-dark-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                    Lupa Password
                </h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-dark-muted">
                    Masukkan email Anda untuk menerima instruksi reset password.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white dark:bg-dark-surface py-8 px-4 shadow-soft dark:shadow-none sm:rounded-lg sm:px-10 border border-gray-100 dark:border-dark-border transition-colors duration-300">

                    <div key={successMessage ? 'success' : 'form'} className="animate-fade-in-up">
                        {successMessage ? (
                            <div className="rounded-md bg-green-50 dark:bg-green-900/30 p-4 text-center">
                                <div className="flex justify-center mb-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-sm font-medium text-green-800 dark:text-green-300 mb-4">{successMessage}</h3>
                                <Link to="/login" className="text-primary-600 hover:text-primary-500 font-medium text-sm">Kembali ke Login</Link>
                            </div>
                        ) : (
                            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Alamat Email
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            id="email"
                                            type="email"
                                            autoComplete="email"
                                            {...register('email', {
                                                required: 'Email wajib diisi',
                                                pattern: {
                                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                    message: "Format email tidak valid"
                                                }
                                            })}
                                            className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all"
                                            placeholder="contoh@email.com"
                                        />
                                        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
                                    </div>
                                </div>

                                {error && (
                                    <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-3">
                                        <div className="flex">
                                            <div className="ml-3">
                                                <h3 className="text-sm font-medium text-red-800 dark:text-red-300">{error}</h3>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        {isSubmitting ? 'Mengirim...' : 'Kirim Link Reset'}
                                    </button>
                                </div>

                                <div className="flex items-center justify-center">
                                    <div className="text-sm">
                                        <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400">
                                            Kembali ke halaman login
                                        </Link>
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}

export default ForgotPassword;
