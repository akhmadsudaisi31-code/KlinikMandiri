const rawData = [
  {
    "id": "8322a670-26d3-4f6f-87c2-3e7ce029738d",
    "clinicId": "acd5b613-153c-4b10-ae0c-f020d866f3f7",
    "patientId": "ce26efbd-0ed3-40b2-b185-b51e3f701f44",
    "patientName": "luna",
    "patientRm": "RM-0004",
    "diagnosa": "febris",
    "date": "2026-03-04 02:02:04",
    "createdAt": "2026-03-04 02:02:04",
    "createdBy": "acd5b613-153c-4b10-ae0c-f020d866f3f7",
    "extendedData_json": "{\"category\":\"Bumil\",\"hpht\":\"2026-01-01\",\"hpl\":\"2026-10-08\",\"gpa\":\"\",\"tfu\":\"\",\"djj\":\"\",\"leopold\":\"\",\"lingkarKepala\":\"\",\"lingkarLengan\":\"\",\"statusImunisasi\":\"\",\"adlScore\":\"\",\"statusFungsional\":\"\",\"hamilKe\":\"1\",\"usiaKehamilan\":\"25\",\"anakTerkecil\":\"0\",\"statusTT\":\"T1\",\"lila\":\"35\",\"skor\":\"100\",\"kunjunganAnc\":\"K1\",\"usg\":\"normal\",\"jenisPersalinan\":\"\",\"penolong\":\"\",\"tempat\":\"\",\"jenisKelamin\":\"\",\"tglPartus\":\"\",\"jamPartus\":\"\",\"as\":\"\",\"bbl\":\"\",\"pb\":\"\",\"lika\":\"\",\"vitK\":\"\",\"hb0\":\"\",\"isPersalinan\":false,\"isKb\":false,\"akseptor\":\"\",\"metodeKb\":\"\",\"keluhanKb\":\"\",\"tglKembaliKb\":\"\"}"
  }
];

let filteredData = rawData.filter((d) => {
  if (!d.extendedData_json) return false;
  try {
    const ext = typeof d.extendedData_json === 'string' ? JSON.parse(d.extendedData_json) : d.extendedData_json;
    return ext.category === 'Bumil' || ext.hpht || ext.lila;
  } catch(e) { return false; }
});

console.log("Filtered Length:", filteredData.length);

const data = filteredData.map((d) => {
   let ext = {};
   try { ext = d.extendedData_json ? (typeof d.extendedData_json === 'string' ? JSON.parse(d.extendedData_json) : d.extendedData_json) : {}; } catch(e) {}
   return { 
       ...d,
       ...ext,
       diagnosa: d.diagnosa || d.diagnosis,
       cost: d.cost || d.biaya,
       medicines: d.medicines || [],
       therapy: d.therapy 
   };
});

console.log("Mapped Item HamilKe:", data[0].hamilKe);

import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

try {
  console.log("Formatted Date:", format(new Date(data[0].createdAt), 'dd/MM/yyyy HH:mm', { locale: localeId }));
} catch (e) {
  console.error("FORMAT ERROR:", e.message);
}
