import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  runTransaction, 
  Timestamp 
} from "firebase/firestore";

// --- TAMBAHAN DEBUGGING TERAKHIR ---
// Kita akan cetak SEMUA variabel.
console.log("--- MEMBACA FILE .env ---");
console.log("API Key:    ", import.meta.env.VITE_FIREBASE_API_KEY);
console.log("Auth Domain:", import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);
console.log("Project ID: ", import.meta.env.VITE_FIREBASE_PROJECT_ID);
console.log("App ID:     ", import.meta.env.VITE_FIREBASE_APP_ID);
console.log("---------------------------");

// Konfigurasi Firebase Anda dari .env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// --- PERBAIKAN UNTUK ERROR ANDA ---
// Pengecekan 'if' HARUS diletakkan SETELAH 'firebaseConfig' dibuat.
if (!firebaseConfig.apiKey) {
  console.error("!!! ERROR FATAL: VITE_FIREBASE_API_KEY terdeteksi KOSONG (undefined) !!!");
  console.error("PASTIKAN NAMA FILE ADALAH '.env' (bukan .env.txt atau .env.example)");
  console.error("PASTIKAN LOKASI FILE .env ADA DI FOLDER UTAMA (di samping package.json)");
  console.error("PASTIKAN ANDA SUDAH RESTART SERVER (Ctrl+C, lalu npm run dev)");
  
  // Melempar error agar aplikasi berhenti dan Anda melihat pesan ini.
  throw new Error("Koneksi Firebase gagal: VITE_FIREBASE_API_KEY tidak ditemukan. Cek console untuk detail.");
}

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/**
 * Menghasilkan nomor Rekam Medis (RM) baru secara transaksional.
 * Menggunakan counter di dokumen 'metadata/patientCounter'.
 * @returns {Promise<string>} Nomor RM baru sebagai string.
 */
const getNextRmNumber = async (): Promise<string> => {
  const counterRef = doc(db, "metadata", "patientCounter");

  try {
    const newRmNumber = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      
      // Nomor awal jika dokumen belum ada
      const startNumber = 18073; 
      
      let nextNumber: number;
      if (!counterDoc.exists()) {
        nextNumber = startNumber;
      } else {
        const currentNumber = counterDoc.data()?.currentNumber || (startNumber - 1);
        nextNumber = currentNumber + 1;
      }

      // Set nomor baru di dokumen counter
      transaction.set(counterRef, { 
        currentNumber: nextNumber,
        updatedAt: Timestamp.now()
      }, { merge: true });

      return nextNumber;
    });

    return String(newRmNumber);
  } catch (error) {
    console.error("Gagal menghasilkan nomor RM:", error);
    throw new Error("Tidak dapat membuat nomor rekam medis. Coba lagi.");
  }
};

export { app, auth, db, getNextRmNumber, Timestamp };