import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

const DEMO_CATEGORIES = [
  {
    title: "Demo Bidan",
    description: "Masuk ke akun demo bidan untuk mencoba alur ANC, KB, dan persalinan.",
    accent: "from-sky-500 to-cyan-500",
    email: "demo.bidan@klinikmandiri.app",
    password: "demo12345",
  },
  {
    title: "Demo Perawat",
    description: "Masuk ke akun demo perawat untuk mencoba pelayanan umum dan observasi pasien.",
    accent: "from-emerald-500 to-teal-500",
    email: "demo.perawat@klinikmandiri.app",
    password: "demo12345",
  },
  {
    title: "Demo Dokter",
    description: "Masuk ke akun demo dokter untuk mencoba alur SOAP, diagnosa, tindakan, dan resep.",
    accent: "from-cyan-500 to-blue-500",
    email: "demo.dokter@klinikmandiri.app",
    password: "demo12345",
  },
  {
    title: "Demo Dokter Gigi",
    description: "Masuk ke akun demo dokter gigi untuk mencoba pelayanan odontologi dan odontogram.",
    accent: "from-violet-500 to-fuchsia-500",
    email: "demo.drg@klinikmandiri.app",
    password: "demo12345",
  },
] as const;

function DemoCatalog() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleDemoLogin = async (email: string, password: string, title: string) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      login(res.token, res.user);
      toast.success(`Berhasil masuk ke ${title}.`);
      navigate("/");
    } catch (error: any) {
      toast.error(error?.message || `Gagal masuk ke ${title}.`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50 px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-xl shadow-cyan-100/40 backdrop-blur">
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-cyan-600">
            KlinikMandiri Demo
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-gray-900 md:text-4xl">
            Coba alur kerja aplikasi sebelum berlangganan
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-600 md:text-base">
            Pilih kategori akun demo yang ingin dicoba. Saat tombol demo ditekan,
            Anda akan langsung masuk ke akun demo kategori tersebut dengan data
            contoh yang sudah disiapkan sesuai jenis praktik.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/register"
              className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700"
            >
              Daftar Setelah Coba
            </Link>
            <Link
              to="/login"
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Kembali ke Login
            </Link>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {DEMO_CATEGORIES.map((item) => (
            <div
              key={item.email}
              className="rounded-[1.75rem] border border-white/70 bg-white p-6 shadow-lg shadow-slate-100"
            >
              <div
                className={`mb-5 h-14 w-14 rounded-2xl bg-gradient-to-br ${item.accent} shadow-lg opacity-95`}
              />
              <h2 className="text-xl font-black text-gray-900">{item.title}</h2>
              <p className="mt-3 min-h-[84px] text-sm leading-relaxed text-gray-600">
                {item.description}
              </p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
                Akun demo aktif
              </p>
              <button
                type="button"
                onClick={() => handleDemoLogin(item.email, item.password, item.title)}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700"
              >
                Masuk Demo
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
              </button>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

export default DemoCatalog;
