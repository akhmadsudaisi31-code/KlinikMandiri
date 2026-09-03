export interface Icd10Item {
  code: string;
  title: string;
  keywords?: string[];
  source?: string;
  sourceLabel?: string;
}

export const GENERAL_ICD10_ITEMS: Icd10Item[] = [
  // --- INFEKSI & PARASIT ---
  { code: "A09", title: "Diarrhoea and gastro-enteritis of presumed infectious origin", keywords: ["diare mencret gastroenteritis muntaber buang air cair bab cair gea"] },
  { code: "A01.0", title: "Typhoid fever", keywords: ["tifus tipes thypoid demam tifoid salmonella"] },
  { code: "A06.0", title: "Acute amoebic dysentery", keywords: ["disentri amuba berak darah lendir"] },
  { code: "A15.0", title: "Tuberculosis of lung, confirmed by sputum microscopy", keywords: ["tb paru tbc bta positif batuk darah flek"] },
  { code: "A16.2", title: "Tuberculosis of lung, without mention of bacteriological or histological confirmation", keywords: ["tb paru klinis tbc batuk kronis"] },
  { code: "A90", title: "Dengue fever [classical dengue]", keywords: ["dbd dengue demam berdarah trombosit turun"] },
  { code: "A91", title: "Dengue haemorrhagic fever", keywords: ["dhf dbd pendarahan syok dengue"] },
  { code: "B01.9", title: "Varicella without complication", keywords: ["cacar air varicella chickenpox lenting"] },
  { code: "B02.9", title: "Zoster without complication", keywords: ["herpes zoster dompo cacar ular"] },
  { code: "B05.9", title: "Measles without complication", keywords: ["campak morbili gabag rubeola"] },
  { code: "B26.9", title: "Mumps without complication", keywords: ["gondongan parotitis pipi bengkak"] },
  { code: "B34.9", title: "Viral infection, unspecified", keywords: ["infeksi virus viral syndrome demam virus"] },
  { code: "B35.4", title: "Tinea corporis", keywords: ["kurap kadas jamur badan tinea"] },
  { code: "B35.6", title: "Tinea cruris", keywords: ["jamur selangkangan kurap lipat paha"] },
  { code: "B35.3", title: "Tinea pedis", keywords: ["kutu air jamur kaki tinea pedis"] },
  { code: "B36.0", title: "Pityriasis versicolor", keywords: ["panu tinea versicolor bercak putih gatal"] },
  { code: "B37.0", title: "Candidal stomatitis", keywords: ["sariawan jamur candida moniliasis mulut putih"] },
  { code: "B86", title: "Scabies", keywords: ["kudis skabies gatal malam budukan sela jari"] },
  { code: "B77.9", title: "Ascariasis, unspecified", keywords: ["cacingan cacing gelang askariasis"] },
  { code: "B80", title: "Enterobiasis", keywords: ["cacing kremi gatal anus oxyuris"] },

  // --- ENDOKRIN, NUTRISI & METABOLIK ---
  { code: "E11.9", title: "Type 2 diabetes mellitus without complications", keywords: ["dm diabetes melitus gula kencing manis t2dm"] },
  { code: "E10.9", title: "Type 1 diabetes mellitus without complications", keywords: ["dm tipe 1 diabetes anak insulin"] },
  { code: "E03.9", title: "Hypothyroidism, unspecified", keywords: ["hipotiroid gondok tiroid"] },
  { code: "E05.9", title: "Thyrotoxicosis, unspecified", keywords: ["hipertiroid hipertiroidisme tiroid tirotoksikosis"] },
  { code: "E66.9", title: "Obesity, unspecified", keywords: ["obesitas kegemukan overweight bb lebih"] },
  { code: "E78.0", title: "Pure hypercholesterolaemia", keywords: ["kolesterol tinggi hiperkolesterol lipid"] },
  { code: "E78.1", title: "Pure hyperglyceridaemia", keywords: ["trigliserida tinggi hipertrigliserida"] },
  { code: "E78.2", title: "Mixed hyperlipidaemia", keywords: ["dislipidemia kolesterol trigliserida lipid darah"] },
  { code: "E79.0", title: "Hyperuricaemia without signs of inflammatory arthritis and tophaceous disease", keywords: ["asam urat tinggi hiperurisemia gout pre"] },
  { code: "M10.9", title: "Gout, unspecified", keywords: ["gout artritis asam urat sendi bengkak pirai"] },
  { code: "E44.0", title: "Moderate protein-energy malnutrition", keywords: ["gizi kurang malnutrisi bbgizi anak kurus"] },
  { code: "E43", title: "Unspecified severe protein-energy malnutrition", keywords: ["gizi buruk marasmus kwashiorkor stunting berat"] },

  // --- DARAH & IMUNOLOGI ---
  { code: "D50.9", title: "Iron deficiency anaemia, unspecified", keywords: ["anemia defisiensi besi kurang darah pucat hb rendah"] },
  { code: "D64.9", title: "Anaemia, unspecified", keywords: ["anemia pucat hb turun lemas"] },

  // --- MATA & TELINGA ---
  { code: "H10.9", title: "Conjunctivitis, unspecified", keywords: ["konjungtivitis belekan mata merah belekan beleken"] },
  { code: "H11.0", title: "Pterygium", keywords: ["pterigium selaput mata daging tumbuh"] },
  { code: "H00.0", title: "Hordeolum and other deep inflammation of eyelid", keywords: ["bintitan timbilan hordeolum kelopak bengkak"] },
  { code: "H52.1", title: "Myopia", keywords: ["mata minus rabun jauh miopia"] },
  { code: "H52.4", title: "Presbyopia", keywords: ["mata tua rabun dekat presbiopia kacamata baca"] },
  { code: "H60.9", title: "Otitis externa, unspecified", keywords: ["otitis eksterna infeksi liang telinga sakit telinga"] },
  { code: "H65.9", title: "Nonsuppurative otitis media, unspecified", keywords: ["otitis media serosa congek katarak telinga"] },
  { code: "H66.9", title: "Otitis media, unspecified", keywords: ["oma otitis media akut telinga bernanah congek curek"] },
  { code: "H61.2", title: "Impacted cerumen", keywords: ["serumen prop kotoran telinga keras telinga tersumbat"] },

  // --- KARDIOVASKULAR ---
  { code: "I10", title: "Essential (primary) hypertension", keywords: ["hipertensi tekanan darah tinggi tensi tinggi hpt tensi"] },
  { code: "I11.9", title: "Hypertensive heart disease without heart failure", keywords: ["hhd jantung hipertensi"] },
  { code: "I20.9", title: "Angina pectoris, unspecified", keywords: ["angina pektoris nyeri dada jantung iskemia"] },
  { code: "I50.9", title: "Heart failure, unspecified", keywords: ["gagal jantung chf decomp cordis sesak bengkak kaki"] },
  { code: "I83.9", title: "Varicose veins of lower extremities without ulcer or inflammation", keywords: ["varises pembuluh darah kaki"] },
  { code: "I84.9", title: "Haemorrhoids without complication, unspecified", keywords: ["wasir ambeien hemoroid bab berdarah benjolan anus"] },
  { code: "I95.9", title: "Hypotension, unspecified", keywords: ["hipotensi tekanan darah rendah tensi drop"] },

  // --- RESPIRATORI / SALURAN NAPAS ---
  { code: "J00", title: "Acute nasopharyngitis [common cold]", keywords: ["flu pilek common cold batuk pilek masuk angin"] },
  { code: "J01.9", title: "Acute sinusitis, unspecified", keywords: ["sinusitis pilek bau nyeri dahi pipi"] },
  { code: "J02.9", title: "Acute pharyngitis, unspecified", keywords: ["faringitis radang tenggorokan sakit menelan panas tenggorokan"] },
  { code: "J03.9", title: "Acute tonsillitis, unspecified", keywords: ["tonsilitis amandel radang amandel tonsil bengkak"] },
  { code: "J04.0", title: "Acute laryngitis", keywords: ["laringitis suara serak hilang serak"] },
  { code: "J06.9", title: "Acute upper respiratory infection, unspecified", keywords: ["ispa infeksi saluran pernapasan atas batuk pilek demam uri"] },
  { code: "J18.9", title: "Pneumonia, unspecified", keywords: ["pneumonia paru basah radang paru sesak napas anak napas cepat"] },
  { code: "J20.9", title: "Acute bronchitis, unspecified", keywords: ["bronkitis bronkitis akut batuk berdahak ronkhi"] },
  { code: "J44.9", title: "Chronic obstructive pulmonary disease, unspecified", keywords: ["ppok copd batuk kronik sesak rokok"] },
  { code: "J45.9", title: "Asthma, unspecified", keywords: ["asma sesak mengi wheezing asma bronkial bengek"] },
  { code: "J30.4", title: "Allergic rhinitis, unspecified", keywords: ["rhinitis alergi bersin bersin pagi hidung gatal berair"] },

  // --- PENCERNAAN / GASTROINTESTINAL ---
  { code: "K21.9", title: "Gastro-oesophageal reflux disease without oesophagitis", keywords: ["gerd asam lambung naik dada panas heartburn sendawa"] },
  { code: "K29.7", title: "Gastritis, unspecified", keywords: ["maag gastritis radang lambung sakit ulu hati perih mual"] },
  { code: "K30", title: "Dyspepsia", keywords: ["dispepsia kembung begah mual cepat kenyang ulu hati"] },
  { code: "K52.9", title: "Noninfective gastro-enteritis and colitis, unspecified", keywords: ["gastroenteritis non infeksi radang usus diare"] },
  { code: "K58.9", title: "Irritable bowel syndrome without diarrhoea", keywords: ["ibs usus sensitif perut kram tidak nyaman"] },
  { code: "K59.0", title: "Constipation", keywords: ["konstipasi sembelit susah bab buang air besar keras"] },
  { code: "K12.0", title: "Recurrent aphthous stomatitis", keywords: ["sariawan stomatitis aftosa bibir sariawan lidah luka"] },
  { code: "K12.1", title: "Other forms of stomatitis", keywords: ["stomatitis radang mukosa mulut"] },

  // --- KULIT & JARINGAN SUBKUTAN ---
  { code: "L01.0", title: "Impetigo [any organism] [any type]", keywords: ["impetigo keropeng koreng luka bernanah madu"] },
  { code: "L02.9", title: "Cutaneous abscess, furuncle and carbuncle, unspecified", keywords: ["bisul abses furunkel karbunkel udun bengkak nanah"] },
  { code: "L03.9", title: "Cellulitis, unspecified", keywords: ["selulitis infeksi kulit merah bengkak panas nyeri"] },
  { code: "L08.0", title: "Pyoderma", keywords: ["pioderma infeksi kulit bernanah"] },
  { code: "L20.9", title: "Atopic dermatitis, unspecified", keywords: ["dermatitis atopik eksim susu eksim anak gatal lipatan"] },
  { code: "L23.9", title: "Allergic contact dermatitis, unspecified cause", keywords: ["dka dermatitis kontak alergi eksim alergi deterjen jam tangan"] },
  { code: "L24.9", title: "Irritant contact dermatitis, unspecified cause", keywords: ["dki dermatitis kontak iritan kena sabun cairan kimia"] },
  { code: "L29.9", title: "Pruritus, unspecified", keywords: ["gatal pruritus gatal seluruh badan tanpa ruam"] },
  { code: "L30.9", title: "Dermatitis, unspecified", keywords: ["eksim dermatitis gatal kemerahan ruam kulit"] },
  { code: "L50.9", title: "Urticaria, unspecified", keywords: ["biduran kalikata gatal bentol bentol alergi dingin makanan"] },
  { code: "L70.0", title: "Acne vulgaris", keywords: ["jerawat jerawat wajah komedo acne"] },
  { code: "L74.3", title: "Miliaria, unspecified", keywords: ["biang keringat keringat buntet bintik merah gatal"] },

  // --- MUSKULOSKELETAL & SENDI ---
  { code: "M25.5", title: "Pain in joint", keywords: ["artralgia nyeri sendi sakit lutut linu"] },
  { code: "M54.5", title: "Low back pain", keywords: ["lbp nyeri pinggang sakit pinggang pegal linu lumbago boyok"] },
  { code: "M54.2", title: "Cervicalgia", keywords: ["nyeri leher tengkuk kaku leher sakit salah bantal"] },
  { code: "M79.1", title: "Myalgia", keywords: ["mialgia nyeri otot pegal linu ngilu badan capek kram"] },
  { code: "M13.9", title: "Arthritis, unspecified", keywords: ["artritis radang sendi sendi kaku bengkak"] },
  { code: "M15.9", title: "Polyarthrosis, unspecified", keywords: ["osteoartritis oa sendi lutut degeneratif"] },

  // --- GINJAL & SALURAN KEMIH ---
  { code: "N20.9", title: "Urinary calculus, unspecified", keywords: ["batu ginjal kencing batu kencing berpasir kolik ginjal"] },
  { code: "N23", title: "Unspecified renal colic", keywords: ["kolik ginjal sakit pinggang melilit kencing sakit"] },
  { code: "N30.0", title: "Acute cystitis", keywords: ["sistitis anyang-anyangan radang kandung kemih kencing perih"] },
  { code: "N39.0", title: "Urinary tract infection, site not specified", keywords: ["isk infeksi saluran kemih kencing sakit anyang anyangan anyangan"] },
  { code: "N76.0", title: "Acute vaginitis", keywords: ["vaginitis keputihan gatal bau radang vagina flour albus"] },

  // --- OBSTETRI, GINEKOLOGI & KESEHATAN IBU HAMIL (KIA / BIDAN) ---
  { code: "O21.0", title: "Mild hyperemesis gravidarum", keywords: ["hiperemesis mual muntah hamil muda emesis gravidarum"] },
  { code: "O21.9", title: "Vomiting of pregnancy, unspecified", keywords: ["mual hamil muntah hamil morning sickness"] },
  { code: "O23.4", title: "Unspecified infection of urinary tract in pregnancy", keywords: ["isk hamil kencing perih bumil"] },
  { code: "O24.4", title: "Diabetes mellitus arising in pregnancy", keywords: ["dm gestasional diabetes kehamilan gula hamil"] },
  { code: "O13", title: "Gestational [pregnancy-induced] hypertension without significant proteinuria", keywords: ["hipertensi gestasional tensi tinggi hamil"] },
  { code: "O14.0", title: "Mild to moderate pre-eclampsia", keywords: ["preeklamsia ringan sedang proteinuria peb per"] },
  { code: "O14.1", title: "Severe pre-eclampsia", keywords: ["preeklamsia berat peb tensi tinggi bengkak pandangan kabur"] },
  { code: "O80", title: "Single spontaneous delivery", keywords: ["partus normal persalinan normal spontan pervaginam melahirkan"] },
  { code: "O82.9", title: "Delivery by caesarean section, unspecified", keywords: ["sc sesar operasi sesar caesar"] },
  { code: "O99.0", title: "Anaemia complicating pregnancy, childbirth and the puerperium", keywords: ["anemia hamil ibu hamil kurang darah hb rendah"] },
  { code: "O72.1", title: "Other immediate postpartum haemorrhage", keywords: ["hhp perdarahan pasca salin atonia uteri robekan jalan lahir"] },
  { code: "O91.2", title: "Nonpurulent mastitis associated with childbirth", keywords: ["mastitis radang payudara asi bengkak nyeri meriang"] },
  { code: "O92.5", title: "Suppressed lactation", keywords: ["asi seret asi kurang asi tidak keluar hipogalaktia"] },

  // --- KELUARGA BERENCANA & KONTROL (KB / KONTROL / SEHAT) ---
  { code: "Z30.0", title: "General counselling and advice on contraception", keywords: ["konseling kb pasang kb konsultasi kontrasepsi"] },
  { code: "Z30.1", title: "Insertion of (intrauterine) contraceptive device", keywords: ["pasang iud spiral susuk akdr"] },
  { code: "Z30.2", title: "Sterilization", keywords: ["steril mow mop tubektomi vasektomi"] },
  { code: "Z30.4", title: "Surveillance of contraceptive drugs", keywords: ["kb suntik kb 3 bulan kb 1 bulan kb pil suntik kb suntikan"] },
  { code: "Z30.5", title: "Surveillance of (intrauterine) contraceptive device", keywords: ["kontrol iud kontrol spiral lepas iud lepas spiral"] },
  { code: "Z34.0", title: "Supervision of normal first pregnancy", keywords: ["anc hamil pertama g1p0a0 kontrol hamil anak pertama"] },
  { code: "Z34.8", title: "Supervision of other normal pregnancy", keywords: ["anc kontrol hamil rutin periksa kandungan bumil"] },
  { code: "Z39.2", title: "Routine postpartum follow-up", keywords: ["pnc nifas kontrol nifas kunjungan nifas kf"] },

  // --- IMUNISASI & VAKSINASI ---
  { code: "Z23.2", title: "Need for immunization against tuberculosis [BCG]", keywords: ["imunisasi bcg vaksin bcg"] },
  { code: "Z24.0", title: "Need for immunization against poliomyelitis", keywords: ["imunisasi polio vaksin polio tetes suntik"] },
  { code: "Z27.1", title: "Need for immunization against diphtheria-tetanus-pertussis with poliomyelitis [DTP+polio]", keywords: ["imunisasi dpt vaksin dpt pentabio"] },
  { code: "Z24.4", title: "Need for immunization against measles", keywords: ["imunisasi campak vaksin campak mr mmr"] },
  { code: "Z24.6", title: "Need for immunization against viral hepatitis [Hepatitis B]", keywords: ["imunisasi hepatitis b vaksin hb0 hepa b"] },
  { code: "Z00.1", title: "Routine child health examination", keywords: ["tumbuh kembang anak posyandu sditk balita sehat ddtk"] },

  // --- GEJALA, TANDA & KELUHAN UMUM ---
  { code: "R50.9", title: "Fever, unspecified", keywords: ["demam febris panas badan hangat meriang"] },
  { code: "R51", title: "Headache", keywords: ["sakit kepala pusing cephalgia pening pusing kepala"] },
  { code: "R42", title: "Dizziness and giddiness", keywords: ["vertigo pusing berputar kliyengan melayang"] },
  { code: "R11", title: "Nausea and vomiting", keywords: ["mual muntah enek mutah"] },
  { code: "R10.4", title: "Other and unspecified abdominal pain", keywords: ["nyeri perut sakit perut kolik kram perut"] },
  { code: "R05", title: "Cough", keywords: ["batuk batuk kering batuk berdahak tusis"] },
  { code: "R06.0", title: "Dyspnoea", keywords: ["sesak napas sesak napas pendek susah napas"] },
  { code: "R53", title: "Malaise and fatigue", keywords: ["lemas fatigue capek letih lesu badan ngedrop"] },
  { code: "R52.9", title: "Pain, unspecified", keywords: ["nyeri badan ngilu sakit"] },
  { code: "R07.4", title: "Chest pain, unspecified", keywords: ["nyeri dada sakit dada"] },
  { code: "R55", title: "Syncope and collapse", keywords: ["pingsan pingsan syncope kolaps mata berkunang"] },

  // --- TRAUMA, LUKA & KECELAKAAN ---
  { code: "T14.0", title: "Superficial injury of unspecified body region", keywords: ["luka lecet lecet tergores lecet jatuh ekskoriasi"] },
  { code: "T14.1", title: "Open wound of unspecified body region", keywords: ["luka robek luka sobek luka iris vulnus laceratum jahitan hecting"] },
  { code: "T14.3", title: "Dislocation, sprain and strain of unspecified body region", keywords: ["keseleo terkilir sprain strain salah urat"] },
  { code: "T30.0", title: "Burn of unspecified body region, unspecified degree", keywords: ["luka bakar kena knalpot melepuh terbakar"] },
  { code: "T78.4", title: "Allergy, unspecified", keywords: ["alergi reaksi alergi alergi obat alergi makanan"] },

  // --- ADMINISTRATIF / CHECK UP ---
  { code: "Z00.0", title: "General medical examination", keywords: ["surat sehat uji kesehatan mcu medical check up kir dokter periksa sehat"] },
  { code: "Z02.7", title: "Issue of medical certificate", keywords: ["sks surat keterangan sakit surat istirahat izin sakit"] },
  { code: "Z01.2", title: "Dental examination", keywords: ["pemeriksaan gigi kontrol gigi periksa gigi rutin"] }
];

