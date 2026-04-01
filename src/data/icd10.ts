export interface Icd10Item {
  code: string;
  title: string;
  keywords?: string[];
  source?: string;
  sourceLabel?: string;
}

export const GENERAL_ICD10_ITEMS: Icd10Item[] = [
  { code: "A09", title: "Diarrhoea and gastro-enteritis of presumed infectious origin", keywords: ["diare mencret gastroenteritis muntaber"] },
  { code: "A15.9", title: "Respiratory tuberculosis unspecified", keywords: ["tb tbc batuk lama"] },
  { code: "A90", title: "Dengue fever", keywords: ["dbd dengue demam berdarah"] },
  { code: "B34.9", title: "Viral infection, unspecified", keywords: ["infeksi virus viral"] },
  { code: "E11.9", title: "Type 2 diabetes mellitus without complications", keywords: ["dm diabetes gula"] },
  { code: "E66.9", title: "Obesity, unspecified", keywords: ["obesitas overweight"] },
  { code: "I10", title: "Essential primary hypertension", keywords: ["hipertensi tekanan darah tinggi"] },
  { code: "I20.9", title: "Angina pectoris, unspecified", keywords: ["nyeri dada angina"] },
  { code: "I83.9", title: "Varicose veins of lower extremities without ulcer or inflammation", keywords: ["varises"] },
  { code: "J00", title: "Acute nasopharyngitis common cold", keywords: ["flu pilek common cold"] },
  { code: "J02.9", title: "Acute pharyngitis, unspecified", keywords: ["faringitis radang tenggorokan"] },
  { code: "J03.9", title: "Acute tonsillitis, unspecified", keywords: ["tonsil amandel"] },
  { code: "J06.9", title: "Acute upper respiratory infection, unspecified", keywords: ["ispa batuk pilek uri"] },
  { code: "J18.9", title: "Pneumonia, unspecified organism", keywords: ["pneumonia paru"] },
  { code: "J45.9", title: "Asthma, unspecified", keywords: ["asma sesak mengi"] },
  { code: "K29.7", title: "Gastritis, unspecified", keywords: ["maag gastritis dispepsia"] },
  { code: "K30", title: "Functional dyspepsia", keywords: ["dispepsia perut kembung"] },
  { code: "K52.9", title: "Noninfective gastro-enteritis and colitis, unspecified", keywords: ["gastroenteritis kolitis"] },
  { code: "K59.0", title: "Constipation", keywords: ["konstipasi sembelit"] },
  { code: "L02.9", title: "Cutaneous abscess, furuncle and carbuncle, unspecified", keywords: ["abses bisul"] },
  { code: "L23.9", title: "Allergic contact dermatitis, unspecified cause", keywords: ["dermatitis alergi gatal"] },
  { code: "L29.9", title: "Pruritus, unspecified", keywords: ["gatal pruritus"] },
  { code: "M25.5", title: "Pain in joint", keywords: ["nyeri sendi pegal"] },
  { code: "M54.5", title: "Low back pain", keywords: ["nyeri punggung bawah lumbago"] },
  { code: "N30.0", title: "Acute cystitis", keywords: ["anyang anyangan sistitis uti"] },
  { code: "N39.0", title: "Urinary tract infection, site not specified", keywords: ["isk infeksi saluran kemih uti"] },
  { code: "O21.9", title: "Vomiting of pregnancy, unspecified", keywords: ["mual muntah hamil emesis"] },
  { code: "O23.4", title: "Infection of urinary tract in pregnancy", keywords: ["isk hamil"] },
  { code: "O80", title: "Single spontaneous delivery", keywords: ["persalinan normal spontan"] },
  { code: "O99.0", title: "Anaemia complicating pregnancy, childbirth and the puerperium", keywords: ["anemia hamil"] },
  { code: "R10.4", title: "Other and unspecified abdominal pain", keywords: ["nyeri perut abdominal pain"] },
  { code: "R11", title: "Nausea and vomiting", keywords: ["mual muntah"] },
  { code: "R42", title: "Dizziness and giddiness", keywords: ["pusing vertigo ringan"] },
  { code: "R50.9", title: "Fever, unspecified", keywords: ["demam panas"] },
  { code: "R51", title: "Headache", keywords: ["sakit kepala headache"] },
  { code: "R52.9", title: "Pain, unspecified", keywords: ["nyeri pain"] },
  { code: "R53", title: "Malaise and fatigue", keywords: ["lemas fatigue"] },
  { code: "Z00.0", title: "General medical examination", keywords: ["checkup medical check up MCU"] },
  { code: "Z01.2", title: "Dental examination", keywords: ["pemeriksaan gigi dental exam"] },
  { code: "Z34.8", title: "Supervision of other normal pregnancy", keywords: ["kontrol hamil anc"] },
  { code: "Z39.2", title: "Routine postpartum follow-up", keywords: ["kontrol nifas postpartum"] },
  { code: "Z30.4", title: "Surveillance of contraceptive drugs", keywords: ["kb pil suntik kontrasepsi"] },
];
