import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { Patient, Medicine, MedicineItem, EXAM_CATEGORIES } from "../types";
import { format, addDays, subMonths, addYears } from "date-fns";
import toast from "react-hot-toast";
import { MedicineSelectorModal } from "../components/MedicineSelectorModal";
import { ExaminationDetailModal } from "../components/ExaminationDetailModal";

const schema = z.object({
  // S
  keluhanUtama: z.string().min(1, "Keluhan utama wajib diisi"),
  riwayatPenyakitSekarang: z.string().optional(),

  // O
  tensi: z.string().optional(),
  nadi: z.string().optional(),
  suhu: z.string().optional(),
  respirasi: z.string().optional(),
  bb: z.string().optional(),
  tb: z.string().optional(),
  spo2: z.string().optional(),
  pemeriksaanFisik: z.string().optional(),

  // A
  diagnosa: z.string().min(1, "Diagnosa wajib diisi"),
  icd10: z.string().optional(),

  // P
  tindakan: z.string().optional(),
  edukasi: z.string().optional(),
  rencanaTindakLanjut: z.string().optional(),
  biaya: z.string().optional(),
  allergies: z.string().optional(),
  examCategory: z.enum(EXAM_CATEGORIES),

  // Extended Data (Optional based on category)
  hpht: z.string().optional(),
  gpa: z.string().optional(),
  tfu: z.string().optional(),
  djj: z.string().optional(),
  leopold: z.string().optional(),
  lingkarKepala: z.string().optional(),
  lingkarLengan: z.string().optional(),
  statusImunisasi: z.string().optional(),
  adlScore: z.string().optional(),
  statusFungsional: z.string().optional(),

  // ANC & Persalinan Data
  namaSuami: z.string().optional(),
  hamilKe: z.string().optional(),
  usiaKehamilan: z.string().optional(),
  anakTerkecil: z.string().optional(),
  hpl: z.string().optional(),
  statusTT: z.string().optional(),
  lila: z.string().optional(),
  skor: z.string().optional(),
  kunjunganAnc: z.string().optional(),
  usg: z.string().optional(),
  jenisPersalinan: z.string().optional(),
  penolong: z.string().optional(),
  tempat: z.string().optional(),
  jenisKelamin: z.string().optional(),
  tglPartus: z.string().optional(),
  jamPartus: z.string().optional(),
  as: z.string().optional(),
  bbl: z.string().optional(),
  pb: z.string().optional(),
  lika: z.string().optional(),
  vitK: z.string().optional(),
  hb0: z.string().optional(),
  isPersalinan: z.boolean().optional(),

  // KB Data
  isKb: z.boolean().optional(),
  akseptor: z.string().optional(),
  metodeKb: z.string().optional(),
  keluhanKb: z.string().optional(),
  tglKembaliKb: z.string().optional(),
});

type ExaminationFormData = z.infer<typeof schema>;

function ExaminationForm() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [selectedMedicines, setSelectedMedicines] = useState<MedicineItem[]>(
    [],
  );
  const [patientHistory, setPatientHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();

  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);

  // Dynamic Allergy State
  const [allergyList, setAllergyList] = useState<string[]>([]);
  const [newAllergy, setNewAllergy] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExaminationFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      keluhanUtama: "",
      riwayatPenyakitSekarang: "",
      tensi: "",
      nadi: "",
      suhu: "",
      respirasi: "",
      bb: "",
      tb: "",
      spo2: "",
      pemeriksaanFisik: "",
      diagnosa: "",
      icd10: "",
      tindakan: "",
      edukasi: "",
      rencanaTindakLanjut: "",
      biaya: "",
      allergies: "",
      examCategory: "Umum",
      hpht: "",
      gpa: "",
      tfu: "",
      djj: "",
      leopold: "",
      lingkarKepala: "",
      lingkarLengan: "",
      statusImunisasi: "",
      adlScore: "",
      statusFungsional: "",

      // ANC Data
      namaSuami: "",
      hamilKe: "",
      usiaKehamilan: "",
      anakTerkecil: "",
      hpl: "",
      statusTT: "",
      lila: "",
      skor: "",
      kunjunganAnc: "",
      usg: "",

      // Persalinan Data
      jenisPersalinan: "",
      penolong: "",
      tempat: "",
      jenisKelamin: "",
      tglPartus: "",
      jamPartus: "",
      as: "",
      bbl: "",
      pb: "",
      lika: "",
      vitK: "",
      hb0: "",

      // KB Data
      isKb: false,
      akseptor: "",
      metodeKb: "",
      keluhanKb: "",
      tglKembaliKb: "",

      // Persalinan Optional Toggle
      isPersalinan: false,
    },
  });

  const watchCategory = watch("examCategory");
  const watchHpht = watch("hpht");
  const watchIsKb = watch("isKb");
  const watchIsPersalinan = watch("isPersalinan");
  // const [htpPreview, setHtpPreview] = useState<string>("");

  // HTP Calculation for Bumil
  useEffect(() => {
    if (watchHpht && watchCategory === "Bumil") {
      try {
        const date = new Date(watchHpht);
        // Rumus Naegele: (Hari + 7), (Bulan - 3), (Tahun + 1)
        const htpDate = addYears(subMonths(addDays(date, 7), 3), 1);
        setValue("hpl", format(htpDate, "yyyy-MM-dd"));
      } catch (e) {
        setValue("hpl", "");
      }
    }
  }, [watchHpht, watchCategory, setValue]);

  useEffect(() => {
    if (!patientId || !user) return;
    const fetchPatient = async () => {
      try {
        const data = await api.get(`/patients/${patientId}`);
        if (data) {
          setPatient(data as Patient);
          setValue("namaSuami", (data as any).namaSuami || "");
          if ((data as any).allergies) {
            setAllergyList(
              (data as any).allergies
                .split(",")
                .map((s: string) => s.trim())
                .filter(Boolean),
            );
          }
        }
      } catch (error) {
        toast.error("Gagal mengambil data pasien.");
        navigate("/pemeriksaan");
      } finally {
        setIsFetchingData(false);
      }
    };
    fetchPatient();
  }, [patientId, navigate, user]);

  useEffect(() => {
    if (!patientId || !user) return;
    const fetchHistory = async () => {
      try {
        const history = await api.get(`/examinations?patientId=${patientId}`);
        setPatientHistory(history || []);
      } catch (e) {
        console.error(e);
      }
    };
    const fetchMedicines = async () => {
      try {
        const meds = await api.get("/medicines");
        setMedicines(meds || []);
      } catch (e) {
        console.error(e);
      }
    };
    fetchHistory();
    fetchMedicines();
  }, [patientId, user]);

  const handleAddMedicine = (medicineId: string) => {
    const medicine = medicines.find((m) => m.id === medicineId);
    if (!medicine) return;
    if (selectedMedicines.find((m) => m.medicineId === medicineId)) {
      toast.error("Obat sudah ditambahkan");
      return;
    }
    setSelectedMedicines([
      ...selectedMedicines,
      {
        medicineId: medicine.id,
        medicineName: medicine.name,
        quantity: 1,
        unit: medicine.unit,
      },
    ]);
  };

  const handleAddAllergy = () => {
    if (newAllergy.trim() && !allergyList.includes(newAllergy.trim())) {
      setAllergyList([...allergyList, newAllergy.trim()]);
      setNewAllergy("");
    }
  };

  const handleRemoveAllergy = (allergy: string) => {
    setAllergyList(allergyList.filter((a) => a !== allergy));
  };

  const handleEdit = (exam: any) => {
    setEditingExamId(exam.id);
    setValue("namaSuami", exam.namaSuami || "");
    setValue("keluhanUtama", exam.keluhanUtama || "");
    setValue("riwayatPenyakitSekarang", exam.riwayatPenyakitSekarang || "");
    setValue("tensi", exam.tensi || "");
    setValue("nadi", exam.nadi ? String(exam.nadi) : "");
    setValue("suhu", exam.suhu ? String(exam.suhu) : "");
    setValue("respirasi", exam.respirasi ? String(exam.respirasi) : "");
    setValue("bb", exam.bb ? String(exam.bb) : "");
    setValue("tb", exam.tb ? String(exam.tb) : "");
    setValue("spo2", exam.spo2 ? String(exam.spo2) : "");
    setValue("pemeriksaanFisik", exam.pemeriksaanFisik || "");
    setValue("diagnosa", exam.diagnosa || "");
    setValue("icd10", exam.icd10 || "");
    setValue("tindakan", exam.tindakan || "");
    setValue("edukasi", exam.edukasi || "");
    setValue("rencanaTindakLanjut", exam.rencanaTindakLanjut || "");
    setValue("biaya", exam.biaya ? String(exam.biaya) : "");
    setSelectedMedicines(exam.medicines || []);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingExamId(null);
    reset();
    setSelectedMedicines([]);
    setAllergyList(
      patient?.allergies
        ? patient.allergies
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    );
  };

  const onSubmit: SubmitHandler<ExaminationFormData> = async (data) => {
    setIsLoading(true);
    if (!user || !patient) return;
    const now = new Date().toISOString();
    try {
      const examinationData: any = {
        patientId: patient.id,
        patientName: patient.name,
        patientRm: patient.rm,
        ...data,
        nadi: data.nadi ? Number(data.nadi) : null,
        suhu: data.suhu ? Number(data.suhu) : null,
        respirasi: data.respirasi ? Number(data.respirasi) : null,
        bb: data.bb ? Number(data.bb) : null,
        tb: data.tb ? Number(data.tb) : null,
        spo2: data.spo2 ? Number(data.spo2) : null,
        biaya: data.biaya ? Number(data.biaya) : 0,
        medicines: selectedMedicines,
        extendedData_json: JSON.stringify({
          category: data.examCategory,
          hpht: data.hpht,
          hpl: data.hpl,
          gpa: data.gpa,
          tfu: data.tfu,
          djj: data.djj,
          leopold: data.leopold,
          lingkarKepala: data.lingkarKepala,
          lingkarLengan: data.lingkarLengan,
          statusImunisasi: data.statusImunisasi,
          adlScore: data.adlScore,
          statusFungsional: data.statusFungsional,

          // Anc & Persalinan Data
          namaSuami: data.namaSuami,
          hamilKe: data.hamilKe,
          usiaKehamilan: data.usiaKehamilan,
          anakTerkecil: data.anakTerkecil,
          statusTT: data.statusTT,
          lila: data.lila,
          skor: data.skor,
          kunjunganAnc: data.kunjunganAnc,
          usg: data.usg,
          jenisPersalinan: data.jenisPersalinan,
          penolong: data.penolong,
          tempat: data.tempat,
          jenisKelamin: data.jenisKelamin,
          tglPartus: data.tglPartus,
          jamPartus: data.jamPartus,
          as: data.as,
          bbl: data.bbl,
          pb: data.pb,
          lika: data.lika,
          vitK: data.vitK,
          hb0: data.hb0,
          isPersalinan: data.isPersalinan,

          // KB Data
          isKb: data.isKb,
          akseptor: data.akseptor,
          metodeKb: data.metodeKb,
          keluhanKb: data.keluhanKb,
          tglKembaliKb: data.tglKembaliKb,
        }),
        updatedAt: now,
        updatedBy: user.uid,
      };

      const finalAllergies =
        allergyList.length > 0 ? allergyList.join(", ") : "";

      // UPDATE PERMANENT ALLERGY & DEMOGRAPHIC DATA on Patient record
      if (finalAllergies !== patient.allergies || data.namaSuami !== patient.namaSuami) {
        try {
          await api.put(`/patients/${patient.id}`, {
            ...patient,
            allergies: finalAllergies || null,
            namaSuami: data.namaSuami || patient.namaSuami || null,
            updatedAt: now,
          });
        } catch (e) {
          console.error("Gagal update data permanen:", e);
        }
      }

      if (editingExamId) {
        await api.put(`/examinations/${editingExamId}`, examinationData);
        toast.success(`Berhasil diperbarui.`);
        handleCancelEdit();
      } else {
        examinationData.clinicId = user.uid;
        examinationData.date = now;
        examinationData.createdAt = now;
        examinationData.createdBy = user.uid;
        await api.post("/examinations", examinationData);
        toast.success(
          `Pemeriksaan berhasil disimpan. Dialihkan ke Riwayat Pasien.`,
        );
        navigate(`/pasien/${patient.id}`);
      }
    } catch (error) {
      toast.error("Gagal menyimpan data.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetchingData) return <p className="text-center p-10">Memuat data...</p>;
  if (!patient) return null;

  return (
    <div className="w-full mx-auto pb-20 space-y-6">
      {/* Patient Header Card */}
      <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-dark-border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
              {editingExamId
                ? "Edit Pemeriksaan SOAP"
                : "Pemeriksaan SOAP Baru"}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Standar Pelayanan Rekam Medis Nasional
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-bold ring-1 ring-primary-100 uppercase">
              {patient.rm}
            </span>
            <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold ring-1 ring-green-100 uppercase">
              {patient.gender}
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Nama Pasien
            </p>
            <p className="font-bold text-gray-900 dark:text-white">
              {patient.name}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Umur / Tgl Lahir
            </p>
            <p className="font-bold text-gray-900 dark:text-white">
              {patient.ageDisplay}
            </p>
          </div>
          <div className="md:col-span-1 border-l border-gray-200 dark:border-gray-700 md:pl-4">
            <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">
              Alergi Pasien
            </p>
            <p
              className={`font-black text-xs ${patient.allergies ? "text-red-600 animate-pulse" : "text-gray-400"}`}
            >
              {patient.allergies || "TIDAK ADA"}
            </p>
          </div>
          <div className="md:col-span-1 border-l border-gray-200 dark:border-gray-700 md:pl-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Alamat
            </p>
            <p className="font-medium text-gray-700 dark:text-gray-300 text-xs line-clamp-1">
              {patient.address}
            </p>
          </div>
        </div>
      </div>

      {/* Riwayat Kunjungan Singkat */}
      {patientHistory.length > 0 && !editingExamId && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
            <h2 className="font-black text-gray-900 dark:text-white uppercase text-sm tracking-widest">
              Riwayat Terakhir
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {patientHistory.map((h) => (
              <div
                key={h.id}
                onClick={() => {
                  setSelectedExam(h);
                  setIsDetailModalOpen(true);
                }}
                className="group relative p-4 bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-100 dark:border-dark-border cursor-pointer hover:border-primary-300 transition-all"
              >
                <div className="flex justify-between items-start mb-1">
                  <p className="text-[10px] font-bold text-blue-500 dark:text-blue-400">
                    {new Date(h.date).toLocaleDateString("id-ID")}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(h);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-primary-600 transition-all"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                </div>
                <p className="text-xs font-bold text-gray-800 dark:text-white line-clamp-1 uppercase">
                  {h.diagnosa}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  {h.tindakan || h.keluhanUtama || "Pemeriksaan rutin"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <input type="hidden" {...register("examCategory")} />

        {/* KATEGORI PEMERIKSAAN (STANDARD TABS) */}
        <div className="bg-white dark:bg-dark-surface p-2 rounded-2xl shadow-soft border border-gray-100 dark:border-dark-border flex flex-wrap gap-2">
          {EXAM_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setValue("examCategory", cat)}
              className={`flex-1 min-w-[100px] py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                watchCategory === cat
                  ? "bg-primary-600 text-white shadow-lg shadow-primary-200"
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* S - SUBJECTIVE */}
        <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-soft border border-gray-100 dark:border-dark-border overflow-hidden">
          <div className="bg-primary-500 px-6 py-3 flex justify-between items-center">
            <h3 className="text-white font-black text-xs tracking-[0.2em] uppercase">
              S - SUBJECTIVE (Anamnesis)
            </h3>
            <span className="px-3 py-1 bg-white/20 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">
              {watchCategory}
            </span>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                Keluhan Utama <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register("keluhanUtama")}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none text-gray-900 dark:text-white font-medium shadow-sm"
                rows={2}
                placeholder="Contoh: Panas sejak 3 hari yang lalu..."
              />
              {errors.keluhanUtama && (
                <p className="mt-1 text-xs text-red-500 font-bold">
                  {errors.keluhanUtama.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                Riwayat Penyakit Sekarang
              </label>
              <textarea
                {...register("riwayatPenyakitSekarang")}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none text-gray-900 dark:text-white font-medium shadow-sm"
                rows={3}
                placeholder="Detail perjalanan penyakit..."
              />
            </div>

            {/* ALLERGY INPUT */}
            <div className="pt-2">
              <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
                <label className="block text-[11px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                    />
                  </svg>
                  RIWAYAT ALERGI (Data Permanen)
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newAllergy}
                    onChange={(e) => setNewAllergy(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddAllergy();
                      }
                    }}
                    className="w-full sm:flex-1 px-4 py-3 bg-white dark:bg-gray-800 border-2 border-red-300 dark:border-red-800 rounded-lg focus:ring-4 focus:ring-red-500/20 focus:border-red-500 outline-none text-sm font-bold text-red-700 dark:text-red-400 shadow-sm"
                    placeholder="Ketik alergi (contoh: Amoxicillin)..."
                  />
                  <button
                    type="button"
                    onClick={handleAddAllergy}
                    disabled={!newAllergy.trim()}
                    className="w-full sm:w-auto px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex justify-center items-center gap-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-4 h-4"
                    >
                      <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                    </svg>
                    Tambah
                  </button>
                </div>
                {allergyList.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {allergyList.map((allergy, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm font-bold border border-red-200 dark:border-red-800"
                      >
                        {allergy}
                        <button
                          type="button"
                          onClick={() => handleRemoveAllergy(allergy)}
                          className="p-0.5 hover:bg-red-200 dark:hover:bg-red-800 rounded-md transition-colors"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-4 h-4"
                          >
                            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* CATEGORY SPECIFIC SUBJECTIVE */}
            {watchCategory === "Bumil" && (
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3">
                  Data Pelayanan ANC
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                      HPHT
                    </label>
                    <input
                      type="date"
                      {...register("hpht")}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border-2 border-blue-300 dark:border-blue-600 rounded-lg focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-gray-900 dark:text-white text-sm font-bold shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                      HPL (HARI PERKIRAAN LAHIR)
                    </label>
                    <input
                      type="date"
                      {...register("hpl")}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border-2 border-blue-300 dark:border-blue-600 rounded-lg focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-gray-900 dark:text-white text-sm font-bold shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                      Hamil Ke
                    </label>
                    <input
                      type="text"
                      {...register("hamilKe")}
                      placeholder="Contoh: 1"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border-2 border-blue-300 dark:border-blue-600 rounded-lg focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-gray-900 dark:text-white text-sm font-bold shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                      Usia Kehamilan (UK)
                    </label>
                    <input
                      type="text"
                      {...register("usiaKehamilan")}
                      placeholder="Contoh: 12 Minggu"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border-2 border-blue-300 dark:border-blue-600 rounded-lg focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-gray-900 dark:text-white text-sm font-bold shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                      LILA (cm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      {...register("lila")}
                      placeholder="Lingkar Lengan"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border-2 border-blue-300 dark:border-blue-600 rounded-lg focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-gray-900 dark:text-white text-sm font-bold shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                      Status TT
                    </label>
                    <select
                      {...register("statusTT")}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border-2 border-blue-300 dark:border-blue-600 rounded-lg focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-gray-900 dark:text-white text-sm font-bold shadow-sm"
                    >
                      <option value="">Pilih</option>
                      <option value="T1">T1</option>
                      <option value="T2">T2</option>
                      <option value="T3">T3</option>
                      <option value="T4">T4</option>
                      <option value="T5">T5</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                      Kunjungan K1 / K4
                    </label>
                    <select
                      {...register("kunjunganAnc")}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border-2 border-blue-300 dark:border-blue-600 rounded-lg focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-gray-900 dark:text-white text-sm font-bold shadow-sm"
                    >
                      <option value="">Tidak Keduanya</option>
                      <option value="K1">K1</option>
                      <option value="K4">K4</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                      Skor Puji Rochjati
                    </label>
                    <input
                      type="number"
                      {...register("skor")}
                      placeholder="Skor Risiko"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border-2 border-blue-300 dark:border-blue-600 rounded-lg focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-gray-900 dark:text-white text-sm font-bold shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                      Anak Terkecil
                    </label>
                    <input
                      type="text"
                      {...register("anakTerkecil")}
                      placeholder="Usia anak terkecil"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border-2 border-blue-300 dark:border-blue-600 rounded-lg focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-gray-900 dark:text-white text-sm font-bold shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                      USG
                    </label>
                    <input
                      type="text"
                      {...register("usg")}
                      placeholder="Hasil ringkas USG"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border-2 border-blue-300 dark:border-blue-600 rounded-lg focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-gray-900 dark:text-white text-sm font-bold shadow-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {watchCategory === "Bumil" && (
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="mb-4">
                   <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                     Nama Suami / Penanggung Jawab
                   </label>
                   <input
                     type="text"
                     {...register("namaSuami")}
                     placeholder="Nama suami"
                     className="w-full md:w-1/2 px-3 py-2 bg-white dark:bg-gray-800 border-2 border-purple-300 dark:border-purple-600 rounded-lg focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none text-gray-900 dark:text-white text-sm font-bold shadow-sm"
                   />
                </div>
                {/* Optional Persalinan Form Header */}
                <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-xl border border-purple-100 dark:border-purple-900/30">
                  <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <input
                      type="checkbox"
                      {...register("isPersalinan")}
                      className="w-4 h-4 text-purple-500 rounded focus:ring-purple-500 cursor-pointer"
                    />
                    <span className="text-[11px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Tambah Data Pelayanan Persalinan
                    </span>
                  </label>

                  {watchIsPersalinan && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 animate-in fade-in slide-in-from-top-2">
                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                          Tgl & Jam Partus
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="date"
                            {...register("tglPartus")}
                            className="w-1/2 px-3 py-2 bg-white dark:bg-gray-800 border-2 border-purple-300 dark:border-purple-600 rounded-lg focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none text-gray-900 dark:text-white text-sm font-bold shadow-sm"
                          />
                          <input
                            type="time"
                            {...register("jamPartus")}
                            className="w-1/2 px-3 py-2 bg-white dark:bg-gray-800 border-2 border-purple-300 dark:border-purple-600 rounded-lg focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none text-gray-900 dark:text-white text-sm font-bold shadow-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                          Hamil Ke
                        </label>
                        <input
                          type="text"
                          {...register("hamilKe")}
                          placeholder="Contoh: 1"
                          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border-2 border-purple-300 dark:border-purple-600 rounded-lg focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none text-gray-900 dark:text-white text-sm font-bold shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                          Usia Kehamilan (UK)
                        </label>
                        <input
                          type="text"
                          {...register("usiaKehamilan")}
                          placeholder="Contoh: 39 Minggu"
                          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border-2 border-purple-300 dark:border-purple-600 rounded-lg focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none text-gray-900 dark:text-white text-sm font-bold shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                          Jenis Persalinan
                        </label>
                        <input
                          type="text"
                          {...register("jenisPersalinan")}
                          placeholder="Spontan, SC"
                          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border-2 border-purple-300 dark:border-purple-600 rounded-lg focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none text-gray-900 dark:text-white text-sm font-bold shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                          Penolong
                        </label>
                        <input
                          type="text"
                          {...register("penolong")}
                          placeholder="Bidan, Dokter"
                          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border-2 border-purple-300 dark:border-purple-600 rounded-lg focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none text-gray-900 dark:text-white text-sm font-bold shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                          Tempat
                        </label>
                        <input
                          type="text"
                          {...register("tempat")}
                          placeholder="PMB, RS, Puskesmas"
                          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border-2 border-purple-300 dark:border-purple-600 rounded-lg focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none text-gray-900 dark:text-white text-sm font-bold shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                          Apgar Score (AS)
                        </label>
                        <input
                          type="text"
                          {...register("as")}
                          placeholder="7/8/9"
                          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border-2 border-purple-300 dark:border-purple-600 rounded-lg focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none text-gray-900 dark:text-white text-sm font-bold shadow-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {watchCategory === "Umum" && (
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">
                    Riwayat Imunisasi & Tumbuh Kembang (Opsional untuk
                    Anak/Balita)
                  </label>
                  <textarea
                    {...register("statusImunisasi")}
                    rows={2}
                    className="w-full px-4 py-2 bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800 rounded-lg text-sm"
                    placeholder="Contoh: Lengkap sesuai usia, KPSP sesuai..."
                  />
                </div>

                {/* Optional KB Form */}
                <div className="bg-primary-50 dark:bg-primary-900/10 p-4 rounded-xl border border-primary-100 dark:border-primary-900/30">
                  <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <input
                      type="checkbox"
                      {...register("isKb")}
                      className="w-4 h-4 text-primary-500 rounded focus:ring-primary-500 cursor-pointer"
                    />
                    <span className="text-[11px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                        />
                      </svg>
                      Tambah Form Keluarga Berencana (KB)
                    </span>
                  </label>

                  {watchIsKb && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 animate-in fade-in slide-in-from-top-2">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                          Akseptor
                        </label>
                        <select
                          {...register("akseptor")}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border-2 border-primary-300 dark:border-primary-600 rounded-lg focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none text-gray-900 dark:text-white text-sm font-bold shadow-sm"
                        >
                          <option value="">Pilih...</option>
                          <option value="Baru">Baru</option>
                          <option value="Lama">Lama</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                          Metode KB
                        </label>
                        <select
                          {...register("metodeKb")}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border-2 border-primary-300 dark:border-primary-600 rounded-lg focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none text-gray-900 dark:text-white text-sm font-bold shadow-sm"
                        >
                          <option value="">Pilih...</option>
                          <option value="Suntik 1 Bulan">Suntik 1 Bulan</option>
                          <option value="Suntik 3 Bulan">Suntik 3 Bulan</option>
                          <option value="Pil">Pil</option>
                          <option value="IUD">IUD</option>
                          <option value="Implant">Implant</option>
                          <option value="Kondom">Kondom</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                          Tanggal Kembali
                        </label>
                        <input
                          type="date"
                          {...register("tglKembaliKb")}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border-2 border-primary-300 dark:border-primary-600 rounded-lg focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none text-gray-900 dark:text-white text-sm font-bold shadow-sm"
                        />
                      </div>
                      <div className="md:col-span-2 lg:col-span-4">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                          Keluhan KB
                        </label>
                        <input
                          type="text"
                          {...register("keluhanKb")}
                          placeholder="Contoh: Spotting, Pusing..."
                          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border-2 border-primary-300 dark:border-primary-600 rounded-lg focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none text-gray-900 dark:text-white text-sm font-bold shadow-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* O - OBJECTIVE */}
        <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-soft border border-gray-100 dark:border-dark-border overflow-hidden">
          <div className="bg-green-500 px-6 py-3">
            <h3 className="text-white font-black text-xs tracking-[0.2em] uppercase">
              O - OBJECTIVE (Pemeriksaan Fisik)
            </h3>
          </div>
          <div className="p-6 space-y-6">
            {/* Vital Signs Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">
                  Tensi (mmHg)
                </label>
                <input
                  type="text"
                  {...register("tensi")}
                  placeholder="120/80"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-4 focus:ring-gray-500/20 focus:border-gray-500 transition-all outline-none text-gray-900 dark:text-white text-sm font-bold shadow-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">
                  Nadi (/mnt)
                </label>
                <input
                  type="number"
                  {...register("nadi")}
                  placeholder="80"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-4 focus:ring-gray-500/20 focus:border-gray-500 transition-all outline-none text-gray-900 dark:text-white text-sm font-bold shadow-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">
                  Suhu (°C)
                </label>
                <input
                  type="text"
                  {...register("suhu")}
                  placeholder="36.5"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-4 focus:ring-gray-500/20 focus:border-gray-500 transition-all outline-none text-gray-900 dark:text-white text-sm font-bold shadow-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">
                  Resp (/mnt)
                </label>
                <input
                  type="number"
                  {...register("respirasi")}
                  placeholder="20"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-4 focus:ring-gray-500/20 focus:border-gray-500 transition-all outline-none text-gray-900 dark:text-white text-sm font-bold shadow-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">
                  BB (kg)
                </label>
                <input
                  type="text"
                  {...register("bb")}
                  placeholder="60"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-4 focus:ring-gray-500/20 focus:border-gray-500 transition-all outline-none text-gray-900 dark:text-white text-sm font-bold shadow-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">
                  TB (cm)
                </label>
                <input
                  type="text"
                  {...register("tb")}
                  placeholder="165"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-4 focus:ring-gray-500/20 focus:border-gray-500 transition-all outline-none text-gray-900 dark:text-white text-sm font-bold shadow-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">
                  SPO2 (%)
                </label>
                <input
                  type="number"
                  {...register("spo2")}
                  placeholder="98"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-4 focus:ring-gray-500/20 focus:border-gray-500 transition-all outline-none text-gray-900 dark:text-white text-sm font-bold shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                Pemeriksaan Fisik
              </label>
              <textarea
                {...register("pemeriksaanFisik")}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white transition-all outline-none"
                rows={3}
                placeholder="Status generalis, kepala, leher, dada, perut, ekstremitas..."
              />
            </div>

            {/* CATEGORY SPECIFIC OBJECTIVE */}
            {watchCategory === "Bumil" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-green-100 dark:border-green-900/30">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                    Tinggi Fundus (cm)
                  </label>
                  <input
                    type="text"
                    {...register("tfu")}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border-2 border-green-300 dark:border-green-600 rounded-lg focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none text-gray-900 dark:text-white text-sm font-bold shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                    DJJ (/mnt)
                  </label>
                  <input
                    type="text"
                    {...register("djj")}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border-2 border-green-300 dark:border-green-600 rounded-lg focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none text-gray-900 dark:text-white text-sm font-bold shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                    Posisi/Leopold
                  </label>
                  <input
                    type="text"
                    {...register("leopold")}
                    placeholder="Kepala, Leopold I-IV"
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border-2 border-green-300 dark:border-green-600 rounded-lg focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none text-gray-900 dark:text-white text-sm font-bold shadow-sm"
                  />
                </div>
              </div>
            )}

            {watchCategory === "Umum" && (
              <div className="grid grid-cols-2 gap-6 pt-6 border-t border-green-100 dark:border-green-900/30">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                    Lingkar Kepala (cm)
                  </label>
                  <input
                    type="text"
                    {...register("lingkarKepala")}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border-2 border-green-300 dark:border-green-600 rounded-lg focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none text-gray-900 dark:text-white text-sm font-bold shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                    Lingkar Lengan (cm)
                  </label>
                  <input
                    type="text"
                    {...register("lingkarLengan")}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border-2 border-green-300 dark:border-green-600 rounded-lg focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none text-gray-900 dark:text-white text-sm font-bold shadow-sm"
                  />
                </div>
              </div>
            )}

            {watchCategory === "Lansia" && (
              <div className="grid grid-cols-2 gap-6 pt-6 border-t border-green-100 dark:border-green-900/30">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                    Skor ADL (Kemandirian)
                  </label>
                  <input
                    type="number"
                    {...register("adlScore")}
                    placeholder="0-20"
                    className="w-full px-4 py-2 bg-white dark:bg-gray-800 border-2 border-green-300 dark:border-green-600 rounded-lg focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none text-gray-900 dark:text-white text-sm font-bold shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                    Status Kognitif
                  </label>
                  <input
                    type="text"
                    {...register("statusFungsional")}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-800 border-2 border-green-300 dark:border-green-600 rounded-lg focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none text-gray-900 dark:text-white text-sm font-bold shadow-sm"
                  />
                </div>
              </div>
            )}

            {watchCategory === "Bumil" && watchIsPersalinan && (
              <div className="pt-6 border-t border-gray-100 dark:border-gray-800 animate-in fade-in slide-in-from-top-2">
                <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-3">
                  Data Fisik Bayi Baru Lahir
                </p>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                      Jenis Kelamin
                    </label>
                    <select
                      {...register("jenisKelamin")}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border-2 border-purple-300 dark:border-purple-600 rounded-lg focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none text-gray-900 dark:text-white text-sm font-bold shadow-sm"
                    >
                      <option value="">Pilih</option>
                      <option value="Lk">Lak-laki</option>
                      <option value="Pr">Perempuan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                      BBL (gram)
                    </label>
                    <input
                      type="number"
                      {...register("bbl")}
                      placeholder="3000"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border-2 border-purple-300 dark:border-purple-600 rounded-lg focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none text-gray-900 dark:text-white text-sm font-bold shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                      PB (cm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      {...register("pb")}
                      placeholder="50"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border-2 border-purple-300 dark:border-purple-600 rounded-lg focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none text-gray-900 dark:text-white text-sm font-bold shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                      LIKA (cm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      {...register("lika")}
                      placeholder="33"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border-2 border-purple-300 dark:border-purple-600 rounded-lg focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none text-gray-900 dark:text-white text-sm font-bold shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                      Vit K
                    </label>
                    <input
                      type="text"
                      {...register("vitK")}
                      placeholder="Diberikan"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border-2 border-purple-300 dark:border-purple-600 rounded-lg focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none text-gray-900 dark:text-white text-sm font-bold shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                      HB 0
                    </label>
                    <input
                      type="text"
                      {...register("hb0")}
                      placeholder="Diberikan"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border-2 border-purple-300 dark:border-purple-600 rounded-lg focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none text-gray-900 dark:text-white text-sm font-bold shadow-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* A - ASSESSMENT */}
        <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-soft border border-gray-100 dark:border-dark-border overflow-hidden">
          <div className="bg-yellow-500 px-6 py-3">
            <h3 className="text-white font-black text-xs tracking-[0.2em] uppercase">
              A - ASSESSMENT (Diagnosa)
            </h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="block text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                Diagnosa Medis <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("diagnosa")}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:bg-white transition-all outline-none font-bold"
                placeholder="Nama penyakit / diagnosa..."
              />
              {errors.diagnosa && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.diagnosa.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                Kode ICD-10
              </label>
              <input
                type="text"
                {...register("icd10")}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:bg-white transition-all outline-none font-mono uppercase"
                placeholder="Contoh: A00.0"
              />
            </div>
          </div>
        </div>

        {/* P - PLAN */}
        <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-soft border border-gray-100 dark:border-dark-border overflow-hidden">
          <div className="bg-blue-500 px-6 py-3">
            <h3 className="text-white font-black text-xs tracking-[0.2em] uppercase">
              P - PLAN (Terapi & Rencana Tindak Lanjut)
            </h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                  Tindakan Medis
                </label>
                <textarea
                  {...register("tindakan")}
                  rows={2}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Heacting, Injeksi, dll..."
                />
              </div>
              <div>
                <label className="block text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                  Edukasi / Saran
                </label>
                <textarea
                  {...register("edukasi")}
                  rows={2}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Istirahat, kurangi gula, dll..."
                />
              </div>
            </div>

            {/* Prescriptions (Medicines) */}
            <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-800">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-black text-purple-700 dark:text-purple-400 uppercase tracking-widest">
                  Resep Obat
                </h4>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-1.5 bg-purple-600 text-white text-[10px] font-black rounded-full hover:bg-purple-700 transition-all uppercase"
                >
                  Tambah Obat
                </button>
              </div>

              {selectedMedicines.length === 0 ? (
                <p className="text-[10px] text-gray-400 text-center py-4 uppercase font-bold tracking-widest italic">
                  Belum ada resep ditambahkan
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedMedicines.map((item) => (
                    <div
                      key={item.medicineId}
                      className="flex items-center gap-3 bg-white dark:bg-gray-800 p-3 rounded-xl border border-purple-200 dark:border-gray-700"
                    >
                      <div className="flex-1">
                        <p className="text-xs font-black text-gray-900 dark:text-white uppercase">
                          {item.medicineName}
                        </p>
                        <p className="text-[10px] text-gray-500 font-bold">
                          {item.quantity} {item.unit}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedMedicines((prev) =>
                            prev.filter(
                              (p) => p.medicineId !== item.medicineId,
                            ),
                          )
                        }
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <label className="block text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                  Rencana Tindak Lanjut
                </label>
                <input
                  type="text"
                  {...register("rencanaTindakLanjut")}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Kontrol 3 hari lagi, Rujuk RS, dll..."
                />
              </div>
              <div>
                <label className="block text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                  Total Biaya Layanan (IDR)
                </label>
                <input
                  type="number"
                  {...register("biaya")}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Logic */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-dark-border">
          <button
            type="button"
            onClick={() => navigate("/pemeriksaan")}
            className="text-sm font-black text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors uppercase tracking-[0.2em]"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="px-10 py-4 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-500/30 hover:bg-primary-700 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-[0.2em] disabled:opacity-50"
          >
            {isSubmitting || isLoading ? "Mengirim..." : "Simpan SOAP"}
          </button>
        </div>
      </form>

      <MedicineSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        medicines={medicines}
        onSelect={handleAddMedicine}
      />
      <ExaminationDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        data={selectedExam}
      />
    </div>
  );
}

export default ExaminationForm;
