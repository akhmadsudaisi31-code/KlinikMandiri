import { useEffect, useState, useMemo } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api, DuplicateExaminationError } from "../api";
import { useAuth } from "../context/AuthContext";
import { Patient, Medicine, MedicineItem, EXAM_CATEGORIES } from "../types";
import { format, addDays, subMonths, addYears } from "date-fns";
import toast from "react-hot-toast";
import { MedicineSelectorModal } from "../components/MedicineSelectorModal";
import { ExaminationDetailModal } from "../components/ExaminationDetailModal";
import { GENERAL_ICD10_ITEMS, Icd10Item } from "../data/icd10";
import { DENTAL_ICD10_ITEMS } from "../data/dentalIcd10";
import { createDefaultOdontogram, normalizeOdontogram, OdontogramTooth } from "../utils/dental";
import { getExamPageTitle, isDentalClinicType } from "../utils/clinic";
import { SoapSection } from "../components/ExaminationForm/SoapSection";
import { SpecialtySection } from "../components/ExaminationForm/SpecialtySection";
import { MedicineSection } from "../components/ExaminationForm/MedicineSection";
import { broadcastPatientQueueUpdate } from "../utils/patientQueueSync";
import { useFeatures } from "../hooks/useFeatures";

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

  // Dental Data
  dentalVisitType: z.string().optional(),
  dentalPainScale: z.string().optional(),
  dentalMedicalHistory: z.string().optional(),
  dentalHabits: z.string().optional(),
  dentalTreatmentHistory: z.string().optional(),
  dentalExtraOral: z.string().optional(),
  dentalIntraOral: z.string().optional(),
  dentalOcclusion: z.string().optional(),
  dentalOralHygiene: z.string().optional(),
  dentalGingiva: z.string().optional(),
  dentalPlaqueIndex: z.string().optional(),
  dentalCalculus: z.string().optional(),
  dentalBleedingOnProbing: z.string().optional(),
  showEyeExam: z.boolean().optional(),
  
  // Physical Exam Systems Toggles
  showPhysicHead: z.boolean().optional(),
  showPhysicThorax: z.boolean().optional(),
  showPhysicAbdomen: z.boolean().optional(),
  showPhysicExtremities: z.boolean().optional(),
  showPhysicSkin: z.boolean().optional(),
  showPhysicNeurology: z.boolean().optional(),
  
  // Physical Exam Systems Content
  physicHead: z.string().optional(),
  physicThorax: z.string().optional(),
  physicAbdomen: z.string().optional(),
  physicExtremities: z.string().optional(),
  physicSkin: z.string().optional(),
  physicNeurology: z.string().optional(),

  // Lab Data
  gds: z.string().optional(),
  asamUrat: z.string().optional(),
  kolesterol: z.string().optional(),
  hb: z.string().optional(),
  labResultImages: z.array(z.string()).optional(),

  // Eye Data
  tod: z.string().optional(),
  tos: z.string().optional(),
  visusVOD: z.string().optional(),
  visusVOS: z.string().optional(),
  pemeriksaanMataInternal: z.string().optional(),
  eyePalpebra: z.string().optional(),
  eyeConjunctiva: z.string().optional(),
  eyeSclera: z.string().optional(),
  eyeCornea: z.string().optional(),
  eyeBMD: z.string().optional(),
  eyeIrisPupil: z.string().optional(),
  eyeLens: z.string().optional(),
  eyeFundus: z.string().optional(),
}).superRefine((data, ctx) => {
  const systems = [
    { toggle: 'showPhysicHead', content: 'physicHead', label: 'Kepala & Leher' },
    { toggle: 'showPhysicThorax', content: 'physicThorax', label: 'Thorax' },
    { toggle: 'showPhysicAbdomen', content: 'physicAbdomen', label: 'Abdomen' },
    { toggle: 'showPhysicExtremities', content: 'physicExtremities', label: 'Ekstremitas' },
    { toggle: 'showPhysicSkin', content: 'physicSkin', label: 'Kulit' },
    { toggle: 'showPhysicNeurology', content: 'physicNeurology', label: 'Neurologi' },
  ];

  systems.forEach(sys => {
    if (data[sys.toggle as keyof typeof data] && !data[sys.content as keyof typeof data]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${sys.label} wajib diisi jika dicentang`,
        path: [sys.content],
      });
    }
  });
});

type ExaminationFormData = z.infer<typeof schema>;

function ExaminationForm() {
  const { patientId } = useParams<{ patientId: string }>();
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get('tanggal');
  const examIdParam = searchParams.get('examId');
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
  const [biayaDisplay, setBiayaDisplay] = useState("");
  const [odontogram, setOdontogram] = useState<OdontogramTooth[]>(createDefaultOdontogram());
  const [icd10Items, setIcd10Items] = useState<Icd10Item[]>([]);
  const isDentalClinic = isDentalClinicType(user?.clinicType);
  const examPageTitle = getExamPageTitle(user?.clinicType);
  const { isFeatureEnabled } = useFeatures();

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

      // Dental Data
      dentalVisitType: "Baru",
      dentalPainScale: "",
      dentalMedicalHistory: "",
      dentalHabits: "",
      dentalTreatmentHistory: "",
      dentalExtraOral: "",
      dentalIntraOral: "",
      dentalOcclusion: "",
      dentalOralHygiene: "",
      dentalGingiva: "",
      dentalPlaqueIndex: "",
      dentalCalculus: "",
      dentalBleedingOnProbing: "",
      showEyeExam: false,

      // Physical Exam Toggles
      showPhysicHead: false,
      showPhysicThorax: false,
      showPhysicAbdomen: false,
      showPhysicExtremities: false,
      showPhysicSkin: false,
      showPhysicNeurology: false,

      // Physical Exam Content
      physicHead: "",
      physicThorax: "",
      physicAbdomen: "",
      physicExtremities: "",
      physicSkin: "",
      physicNeurology: "",

      // Persalinan Optional Toggle
      isPersalinan: false,

      // Lab Data
      gds: "",
      asamUrat: "",
      kolesterol: "",
      hb: "",
      labResultImages: [],

      // Eye Data
      tod: "",
      tos: "",
      visusVOD: "",
      visusVOS: "",
      pemeriksaanMataInternal: "",
    },
});

  const availableCategories = useMemo(() => {
    return EXAM_CATEGORIES.filter(cat => {
      if (cat === 'Bumil' && !isFeatureEnabled('anc')) return false;
      if (cat === 'Odontologi' && !isFeatureEnabled('dental')) return false;
      if (cat === 'KB' && !isFeatureEnabled('kb')) return false;
      if (cat === 'Anak' && !isFeatureEnabled('immunization')) return false;
      return true;
    });
  }, [isFeatureEnabled]);

  const watchCategory = watch("examCategory");
  const watchHpht = watch("hpht");
  const watchIcd10 = watch("icd10");
  const icd10Placeholder = isDentalClinic
    ? "Cari kode atau nama ICD-10 gigi..."
    : "Cari kode atau nama ICD-10...";
  // const [htpPreview, setHtpPreview] = useState<string>("");

  const formatBiayaDisplay = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "");
    if (!digitsOnly) return "";
    return Number(digitsOnly).toLocaleString("id-ID");
  };

  const handleBiayaChange = (value: string) => {
    const rawValue = value.replace(/\D/g, "");
    setBiayaDisplay(formatBiayaDisplay(rawValue));
    setValue("biaya", rawValue, { shouldDirty: true, shouldValidate: true });
  };


  useEffect(() => {
    // 0-D1 ROW READ ARCHITECTURE:
    // Gunakan kamus lokal lengkap (GENERAL_ICD10_ITEMS + DENTAL_ICD10_ITEMS) di memori JavaScript browser.
    // Pencarian instan (0ms delay), mendukung sinonim bahasa Indonesia, dan 100% TIDAK menyentuh D1 database.
    const allSourceItems: Icd10Item[] = isDentalClinic
      ? [
          ...DENTAL_ICD10_ITEMS.map((item) => ({ ...item, source: "who_icd10_2019", sourceLabel: "Dental" })),
          ...GENERAL_ICD10_ITEMS.map((item) => ({ ...item, source: "who_icd10_2019", sourceLabel: "Umum" })),
        ]
      : GENERAL_ICD10_ITEMS.map((item) => ({ ...item, source: "who_icd10_2019", sourceLabel: "WHO" }));

    const rawQuery = (watchIcd10 || "").trim().toLowerCase();

    if (!rawQuery) {
      setIcd10Items(allSourceItems.slice(0, 25));
      return;
    }

    // Smart in-memory search: match code prefix, title words, or Indonesian keywords
    const matched = allSourceItems.filter((item) => {
      const codeMatch = item.code.toLowerCase().includes(rawQuery);
      const titleMatch = item.title.toLowerCase().includes(rawQuery);
      const keywordMatch = (item.keywords || []).some((kw) => kw.toLowerCase().includes(rawQuery));
      return codeMatch || titleMatch || keywordMatch;
    });

    setIcd10Items(matched.slice(0, 30));
  }, [isDentalClinic, watchIcd10]);

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
    if (isDentalClinic) {
      setValue("examCategory", "Odontologi");
    }
  }, [isDentalClinic, setValue]);

  useEffect(() => {
    if (!patientId || !user) return;
    const fetchPatient = async () => {
      try {
        const data = await api.get(`/patients/${patientId}`);
        if (data) {
          setPatient(data as Patient);
          setValue("namaSuami", (data as any).namaSuami || "");
          
          if (!examIdParam && !dateParam && (data as any).keluhan) {
             setValue("keluhanUtama", (data as any).keluhan);
          }

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
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Gagal memuat data pasien/obat");
      }
    };

    fetchHistory();
    fetchMedicines();
  }, [patientId, user]);

  useEffect(() => {
    const triggerEdit = async () => {
      if (examIdParam && !editingExamId) {
        try {
          const exam = await api.get(`/examinations/${examIdParam}`);
          if (exam) {
            handleEdit(exam);
          }
        } catch (e) {
          console.error("Gagal memuat pemeriksaan spesifik:", e);
        }
      } else if (dateParam && patientHistory.length > 0 && !editingExamId) {
        const exam = patientHistory.find(e => {
          const d = e.createdAt || e.date;
          return d && format(new Date(d), 'yyyy-MM-dd') === dateParam;
        });
        if (exam) {
          handleEdit(exam);
        }
      }
    };
    
    triggerEdit();
  }, [examIdParam, dateParam, patientHistory, editingExamId]);

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
        aturanMinum: "",
        signa: "3 x 1",
        aturanPakai: "Sesudah makan (p.c)",
      },
    ]);
  };

  const handleMedicineRuleChange = (medicineId: string, value: string, field: 'signa' | 'aturanPakai' | 'aturanMinum' = 'aturanMinum') => {
    setSelectedMedicines((prev) =>
      prev.map((item) =>
        item.medicineId === medicineId
          ? { ...item, [field]: value }
          : item,
      ),
    );
  };

  const handleMedicineQuantityChange = (medicineId: string, quantity: number) => {
    setSelectedMedicines((prev) =>
      prev.map((item) =>
        item.medicineId === medicineId
          ? { ...item, quantity: quantity }
          : item,
      ),
    );
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

  const parseExtendedData = (value: any) => {
    if (!value?.extendedData_json) return {};
    if (typeof value.extendedData_json === "object") return value.extendedData_json;
    try {
      return JSON.parse(value.extendedData_json);
    } catch {
      return {};
    }
  };

  const handleEdit = (exam: any) => {
    const ext = parseExtendedData(exam);
    setEditingExamId(exam.id);
    setValue("examCategory", ext.category || (isDentalClinic ? "Odontologi" : "Umum"));
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
    setValue("hpht", ext.hpht || "");
    setValue("hpl", ext.hpl || "");
    setValue("gpa", ext.gpa || "");
    setValue("tfu", ext.tfu || "");
    setValue("djj", ext.djj || "");
    setValue("leopold", ext.leopold || "");
    setValue("lingkarKepala", ext.lingkarKepala || "");
    setValue("lingkarLengan", ext.lingkarLengan || "");
    setValue("statusImunisasi", ext.statusImunisasi || "");
    setValue("adlScore", ext.adlScore || "");
    setValue("statusFungsional", ext.statusFungsional || "");
    setValue("hamilKe", ext.hamilKe || "");
    setValue("usiaKehamilan", ext.usiaKehamilan || "");
    setValue("anakTerkecil", ext.anakTerkecil || "");
    setValue("statusTT", ext.statusTT || "");
    setValue("lila", ext.lila || "");
    setValue("skor", ext.skor || "");
    setValue("kunjunganAnc", ext.kunjunganAnc || "");
    setValue("usg", ext.usg || "");
    setValue("jenisPersalinan", ext.jenisPersalinan || "");
    setValue("penolong", ext.penolong || "");
    setValue("tempat", ext.tempat || "");
    setValue("jenisKelamin", ext.jenisKelamin || "");
    setValue("tglPartus", ext.tglPartus || "");
    setValue("jamPartus", ext.jamPartus || "");
    setValue("as", ext.as || "");
    setValue("bbl", ext.bbl || "");
    setValue("pb", ext.pb || "");
    setValue("lika", ext.lika || "");
    setValue("vitK", ext.vitK || "");
    setValue("hb0", ext.hb0 || "");
    setValue("isPersalinan", Boolean(ext.isPersalinan));
    setValue("isKb", Boolean(ext.isKb));
    setValue("akseptor", ext.akseptor || "");
    setValue("metodeKb", ext.metodeKb || "");
    setValue("keluhanKb", ext.keluhanKb || "");
    setValue("tglKembaliKb", ext.tglKembaliKb || "");
    setValue("dentalVisitType", ext.dentalVisitType || "Baru");
    setValue("dentalPainScale", ext.dentalPainScale || "");
    setValue("dentalMedicalHistory", ext.dentalMedicalHistory || "");
    setValue("dentalHabits", ext.dentalHabits || "");
    setValue("dentalTreatmentHistory", ext.dentalTreatmentHistory || "");
    setValue("dentalExtraOral", ext.dentalExtraOral || "");
    setValue("dentalIntraOral", ext.dentalIntraOral || "");
    setValue("dentalOcclusion", ext.dentalOcclusion || "");
    setValue("dentalOralHygiene", ext.dentalOralHygiene || "");
    setValue("dentalGingiva", ext.dentalGingiva || "");
    setValue("dentalPlaqueIndex", ext.dentalPlaqueIndex || "");
    setValue("dentalCalculus", ext.dentalCalculus || "");
    setValue("dentalBleedingOnProbing", ext.dentalBleedingOnProbing || "");

    // Lab Data
    setValue("gds", ext.gds || "");
    setValue("asamUrat", ext.asamUrat || "");
    setValue("kolesterol", ext.kolesterol || "");
    setValue("hb", ext.hb || "");
    setValue("labResultImages", Array.isArray(ext.labResultImages) ? ext.labResultImages : (ext.labResultImage ? [ext.labResultImage] : []));

    // Eye Data
    setValue("tod", ext.tod || "");
    setValue("tos", ext.tos || "");
    setValue("visusVOD", ext.visusVOD || "");
    setValue("visusVOS", ext.visusVOS || "");
    setValue("pemeriksaanMataInternal", ext.pemeriksaanMataInternal || "");
    setValue("eyePalpebra", ext.eyePalpebra || "");
    setValue("eyeConjunctiva", ext.eyeConjunctiva || "");
    setValue("eyeSclera", ext.eyeSclera || "");
    setValue("eyeCornea", ext.eyeCornea || "");
    setValue("eyeBMD", ext.eyeBMD || "");
    setValue("eyeIrisPupil", ext.eyeIrisPupil || "");
    setValue("eyeLens", ext.eyeLens || "");
    setValue("eyeFundus", ext.eyeFundus || "");
    setValue("showEyeExam", !!(ext.showEyeExam || ext.tod || ext.tos || ext.visusVOD || ext.visusVOS || ext.pemeriksaanMataInternal));

    // Physical Exam Systems
    setValue("showPhysicHead", Boolean(ext.showPhysicHead));
    setValue("showPhysicThorax", Boolean(ext.showPhysicThorax));
    setValue("showPhysicAbdomen", Boolean(ext.showPhysicAbdomen));
    setValue("showPhysicExtremities", Boolean(ext.showPhysicExtremities));
    setValue("showPhysicSkin", Boolean(ext.showPhysicSkin));
    setValue("showPhysicNeurology", Boolean(ext.showPhysicNeurology));
    setValue("physicHead", ext.physicHead || "");
    setValue("physicThorax", ext.physicThorax || "");
    setValue("physicAbdomen", ext.physicAbdomen || "");
    setValue("physicExtremities", ext.physicExtremities || "");
    setValue("physicSkin", ext.physicSkin || "");
    setValue("physicNeurology", ext.physicNeurology || "");

    setOdontogram(normalizeOdontogram(ext.odontogram));
    const biayaRaw = exam.biaya ? String(exam.biaya) : "";
    setValue("biaya", biayaRaw);
    setBiayaDisplay(formatBiayaDisplay(biayaRaw));
    setSelectedMedicines(exam.medicines || []);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingExamId(null);
    reset();
    setValue("examCategory", isDentalClinic ? "Odontologi" : "Umum");
    setBiayaDisplay("");
    setSelectedMedicines([]);
    setOdontogram(createDefaultOdontogram());
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
    // Declared outside try so it's accessible in the catch block (for forceSave retry)
    let examinationData: any = null;
    try {
      examinationData = {
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
        biaya: data.biaya ? Number(data.biaya.replace(/\D/g, "")) : 0,
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

          // Dental Data
          dentalVisitType: data.dentalVisitType,
          dentalPainScale: data.dentalPainScale,
          dentalMedicalHistory: data.dentalMedicalHistory,
          dentalHabits: data.dentalHabits,
          dentalTreatmentHistory: data.dentalTreatmentHistory,
          dentalExtraOral: data.dentalExtraOral,
          dentalIntraOral: data.dentalIntraOral,
          dentalOcclusion: data.dentalOcclusion,
          dentalOralHygiene: data.dentalOralHygiene,
          dentalGingiva: data.dentalGingiva,
          dentalPlaqueIndex: data.dentalPlaqueIndex,
          dentalCalculus: data.dentalCalculus,
          dentalBleedingOnProbing: data.dentalBleedingOnProbing,
          odontogram,

          // Lab Data
          gds: data.gds,
          asamUrat: data.asamUrat,
          kolesterol: data.kolesterol,
          hb: data.hb,
          labResultImages: data.labResultImages || [],

          // Eye Data
          tod: data.tod,
          tos: data.tos,
          visusVOD: data.visusVOD,
          visusVOS: data.visusVOS,
          pemeriksaanMataInternal: data.pemeriksaanMataInternal,
          // Physical Exam Systems
          showPhysicHead: data.showPhysicHead,
          showPhysicThorax: data.showPhysicThorax,
          showPhysicAbdomen: data.showPhysicAbdomen,
          showPhysicExtremities: data.showPhysicExtremities,
          showPhysicSkin: data.showPhysicSkin,
          showPhysicNeurology: data.showPhysicNeurology,
          physicHead: data.physicHead,
          physicThorax: data.physicThorax,
          physicAbdomen: data.physicAbdomen,
          physicExtremities: data.physicExtremities,
          physicSkin: data.physicSkin,
          physicNeurology: data.physicNeurology,

          // Eye Expanded Data
          eyePalpebra: data.eyePalpebra,
          eyeConjunctiva: data.eyeConjunctiva,
          eyeSclera: data.eyeSclera,
          eyeCornea: data.eyeCornea,
          eyeBMD: data.eyeBMD,
          eyeIrisPupil: data.eyeIrisPupil,
          eyeLens: data.eyeLens,
          eyeFundus: data.eyeFundus,
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
        toast.success(`Berhasil diperbarui.`, { id: 'exam-success' });
        handleCancelEdit();
      } else {
        examinationData.clinicId = user.uid;
        examinationData.date = now;
        examinationData.createdAt = now;
        examinationData.createdBy = user.uid;
        await api.post("/examinations", examinationData);
        
        // Update Status to 'Selesai' (Sudah Diperiksa)
        try {
          await api.put(`/patients/${patient.id}`, {
            poli: "Selesai",
            updatedAt: now
          });
          
          broadcastPatientQueueUpdate({
            action: 'dequeue',
            patientId: patient.id,
            source: 'examination-form-complete',
          });
        } catch (queueError) {
          console.error("Gagal update status antrian:", queueError);
        }

        toast.success(
          `${isDentalClinic ? "Pelayanan gigi" : "Pemeriksaan"} berhasil disimpan.`,
          { id: 'exam-success' }
        );
        // Delay kecil agar D1 commit selesai sebelum PatientDetail mount dan fetch riwayat
        await new Promise(resolve => setTimeout(resolve, 300));
        navigate(`/pasien/${patient.id}`);
      }
    } catch (error) {
      if (error instanceof DuplicateExaminationError) {
        // This is a recoverable situation — ask the doctor to confirm
        const confirmed = window.confirm(
          `⚠️ Peringatan Duplikasi\n\nPasien ini sudah diperiksa dalam beberapa menit terakhir.\n\nApakah Anda yakin ingin menyimpan pemeriksaan baru ini?`
        );
        if (confirmed) {
          try {
            setIsLoading(true);
            examinationData.forceSave = true;
            await api.post("/examinations", examinationData);
            try {
              await api.put(`/patients/${patient.id}`, { poli: "Selesai", updatedAt: new Date().toISOString() });
              broadcastPatientQueueUpdate({ action: 'dequeue', patientId: patient.id, source: 'examination-form-complete' });
            } catch (e) { /* ignore queue update errors */ }
            toast.success(`Pemeriksaan berhasil disimpan (dikonfirmasi).`, { id: 'exam-success' });
            navigate(`/pasien/${patient.id}`);
          } catch (retryErr) {
            toast.error("Gagal menyimpan data setelah konfirmasi.");
          } finally {
            setIsLoading(false);
          }
        }
      } else {
        toast.error("Gagal menyimpan data.");
      }
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
                ? `Edit ${examPageTitle}`
                : `${examPageTitle} Baru`}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {isDentalClinic
                ? "Standar pelayanan kedokteran gigi dengan odontogram dewasa."
                : "Standar Pelayanan Rekam Medis Nasional"}
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

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-900 dark:border-gray-500">
          <div>
            <p className="text-[10px] font-black text-gray-900 dark:text-gray-300 uppercase tracking-widest">
              Nama Pasien
            </p>
            <p className="font-black text-gray-900 dark:text-white uppercase">
              {patient.name}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-900 dark:text-gray-300 uppercase tracking-widest">
              Umur / Tgl Lahir
            </p>
            <p className="font-black text-gray-900 dark:text-white uppercase">
              {patient.ageDisplay}
            </p>
          </div>
          <div className="md:col-span-1 border-l-2 border-gray-900 dark:border-gray-500 md:pl-4">
            <p className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest">
              Alergi Pasien
            </p>
            <p
              className={`font-black text-xs ${patient.allergies ? "text-red-700 animate-pulse" : "text-gray-900 dark:text-gray-400"}`}
            >
              {patient.allergies || "TIDAK ADA"}
            </p>
          </div>
          <div className="md:col-span-1 border-l-2 border-gray-900 dark:border-gray-500 md:pl-4">
            <p className="text-[10px] font-black text-gray-900 dark:text-gray-300 uppercase tracking-widest">
              Alamat
            </p>
            <p className="font-black text-gray-900 dark:text-gray-200 text-xs line-clamp-1 uppercase">
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
                  {h.tindakan || h.keluhanUtama || (isDentalClinic ? "Kontrol dental" : "Pemeriksaan rutin")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <input type="hidden" {...register("examCategory")} />

        {!isDentalClinic && availableCategories.length > 1 && (
          <div className="bg-white dark:bg-dark-surface p-2 rounded-2xl shadow-soft border border-gray-100 dark:border-dark-border flex flex-wrap gap-2">
            {availableCategories.filter((cat) => cat !== "Odontologi").map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setValue("examCategory", cat)}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  watchCategory === cat
                    ? "bg-primary-600 text-white shadow-lg shadow-primary-200"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Odontogram has been moved to SoapSection for better integration */}

        {/* --- ALLERGY SECTION --- */}
        <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-2xl shadow-soft border border-red-100 dark:border-red-900/30">
          <label className="block text-xs font-black text-red-600 dark:text-red-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            RIWAYAT ALERGI (Data Permanen)
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newAllergy}
              onChange={(e) => setNewAllergy(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); handleAddAllergy(); }
              }}
              className="w-full sm:flex-1 px-4 py-3 bg-white dark:bg-gray-800 border-2 border-red-600 dark:border-red-500 rounded-xl focus:ring-4 focus:ring-red-100 outline-none text-sm font-black text-red-700 dark:text-red-400 uppercase"
              placeholder="Ketik alergi (contoh: Amoxicillin)..."
            />
            <button
              type="button"
              onClick={handleAddAllergy}
              disabled={!newAllergy.trim()}
              className="px-8 py-3 bg-red-600 text-white font-black rounded-xl hover:bg-red-700 disabled:opacity-50 transition-all uppercase tracking-widest text-xs"
            >
              Tambah
            </button>
          </div>
          {allergyList.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {allergyList.map((allergy, index) => (
                <span key={index} className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-red-900/50 text-red-700 dark:text-red-400 rounded-lg text-xs font-black border border-red-100 dark:border-red-900/30 shadow-sm uppercase">
                  {allergy}
                  <button type="button" onClick={() => handleRemoveAllergy(allergy)} className="text-red-400 hover:text-red-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* --- MODULAR SECTIONS --- */}
        <SoapSection
          register={register}
          errors={errors}
          setValue={setValue}
          watch={watch}
          icd10Items={icd10Items}
          icd10Placeholder={icd10Placeholder}
          isDentalClinic={isDentalClinic}
          odontogram={odontogram}
          setOdontogram={setOdontogram}
          canUpload={user?.features?.lab_upload}
          history={patientHistory}
        />

        <SpecialtySection
          register={register}
          errors={errors}
          watch={watch}
          category={watchCategory}
        />

        {user?.features?.medicines !== false && (
          <MedicineSection
            selectedMedicines={selectedMedicines}
            onRemove={(id) => setSelectedMedicines(prev => prev.filter(m => m.medicineId !== id))}
            onRuleChange={handleMedicineRuleChange}
            onQuantityChange={handleMedicineQuantityChange}
            onOpenSelector={() => setIsModalOpen(true)}
            biayaDisplay={biayaDisplay}
            onBiayaChange={handleBiayaChange}
            onBlurBiaya={() => setBiayaDisplay(formatBiayaDisplay(biayaDisplay))}
            isDentalClinic={isDentalClinic}
          />
        )}

        {/* --- FORM FOOTER / SUBMIT --- */}
        <div className="flex items-center justify-end gap-4 pt-8 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={() => navigate("/pemeriksaan")}
            className="px-8 py-4 text-sm font-black text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors border-2 border-gray-900 dark:border-gray-500 rounded-2xl uppercase tracking-[0.2em]"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="px-10 py-4 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-500/30 hover:bg-primary-700 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-[0.2em] disabled:opacity-50"
          >
            {isSubmitting || isLoading ? "Mengirim..." : isDentalClinic ? "Simpan Pelayanan Gigi" : "Simpan SOAP"}
          </button>
        </div>
      </form>

      {/* --- MODALS --- */}
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
