export interface QuestionItem {
  code: string;
  text: string;
}

export interface Section {
  id: string;
  letter: string;
  title: string;
  titleEn: string;
  items: QuestionItem[];
}

export interface DemographicOption {
  label: string;
  options: string[];
}

export const SURVEY_TITLE =
  "Kuesioner Penelitian: Adopsi Big Data Analytics dan Artificial Intelligence di Rumah Sakit Indonesia";

export const RESEARCHER_INFO = {
  name: "Asmuliardi Muluk",
  studentId: "2330932010",
  program: "Program Doktoral Departemen Teknik Industri",
  university: "Universitas Andalas",
  year: "2026",
};

export const INTRO_TEXT = `Yth. Bapak/Ibu Responden,

Perkenalkan, saya ${RESEARCHER_INFO.name}, mahasiswa ${RESEARCHER_INFO.program}, ${RESEARCHER_INFO.university}. Saat ini saya sedang melakukan penelitian mengenai kesiapan dan penerimaan teknologi data canggih di rumah sakit Indonesia.

Saya memohon kesediaan Bapak/Ibu untuk meluangkan waktu sejenak (\u00b1 5-10 menit) untuk mengisi kuesioner ini.`;

export const CONFIDENTIALITY_TEXT =
  "Data yang Anda berikan akan dijaga kerahasiaannya secara ketat dan hanya akan digunakan untuk kepentingan analisis akademis secara agregat (kelompok), tidak secara individu.";

export const BDA_AI_DEFINITIONS = [
  {
    term: "Big Data Analytics (BDA)",
    definition:
      "Teknologi untuk mengolah data rumah sakit yang bervolume besar dan kompleks (seperti Rekam Medis Elektronik, data Radiologi/PACS, dan data Administrasi) guna menghasilkan wawasan (insight) yang mendalam.",
  },
  {
    term: "Artificial Intelligence (AI)",
    definition:
      'Sistem kecerdasan buatan yang mampu "belajar" dari data untuk membantu tugas manusia, seperti memprediksi tren penyakit, klasifikasi diagnosis, atau automasi layanan.',
  },
  {
    term: "Contoh Penerapan",
    definition:
      "Dashboard prediksi lonjakan pasien, Sistem Pendukung Keputusan Klinis (Clinical Decision Support System), deteksi dini wabah, atau sistem peringatan interaksi obat otomatis.",
  },
];

export const DEMOGRAPHICS: Record<string, DemographicOption> = {
  jenisRS: {
    label: "Jenis Rumah Sakit",
    options: ["RS Pemerintah (Publik)", "RS Swasta (Privat)"],
  },
  kelasRS: {
    label: "Kelas Rumah Sakit",
    options: ["Kelas A", "Kelas B", "Kelas C"],
  },
  wilayah: {
    label: "Wilayah / Pulau",
    options: [
      "Sumatera",
      "Jawa",
      "Kalimantan",
      "Sulawesi",
      "Bali & Nusa Tenggara",
      "Maluku & Papua",
    ],
  },
  profesi: {
    label: "Profesi / Jabatan",
    options: [
      "Medis (Dokter Spesialis/Umum)",
      "Keperawatan/Bidan",
      "Penunjang Medis (Farmasi, Lab, Radiologi)",
      "Manajemen/Administrasi",
      "Staf TI/Sistem Informasi",
    ],
  },
  pengalaman: {
    label: "Pengalaman Kerja di RS Ini",
    options: ["< 1 Tahun", "1 \u2013 5 Tahun", "> 5 Tahun"],
  },
};

export const SECTIONS: Section[] = [
  {
    id: "TI",
    letter: "A",
    title: "Infrastruktur Teknologi",
    titleEn: "Technological Infrastructure",
    items: [
      {
        code: "TI1",
        text: "Konektivitas jaringan internet dan intranet di rumah sakit saya stabil dan dapat diandalkan.",
      },
      {
        code: "TI2",
        text: "Kapasitas komputer/perangkat keras yang tersedia memadai untuk menjalankan aplikasi analisis data.",
      },
      {
        code: "TI3",
        text: "Sistem data klinis (seperti EMR/SIMRS) terintegrasi dengan baik antar-unit (tidak terpisah-pisah).",
      },
      {
        code: "TI4",
        text: "Infrastruktur keamanan data (privasi/sekuriti) sudah memadai untuk melindungi data pasien.",
      },
    ],
  },
  {
    id: "OS",
    letter: "B",
    title: "Dukungan Organisasi",
    titleEn: "Organizational Support",
    items: [
      {
        code: "OS1",
        text: "Manajemen puncak (Direksi/Pimpinan) memberikan komitmen nyata terhadap penggunaan data.",
      },
      {
        code: "OS2",
        text: "Tersedia pelatihan berkala mengenai penggunaan teknologi/analitik data bagi staf.",
      },
      {
        code: "OS3",
        text: "Terdapat kebijakan atau insentif yang mendorong staf untuk menggunakan data dalam bekerja.",
      },
      {
        code: "OS4",
        text: "Tersedia bantuan teknis (technical support) yang responsif jika terjadi masalah sistem.",
      },
    ],
  },
  {
    id: "DC",
    letter: "C",
    title: "Kapabilitas Data",
    titleEn: "Data Capability",
    items: [
      {
        code: "DC1",
        text: "Data yang tersedia di sistem kami akurat dan dapat dipercaya (veracity).",
      },
      {
        code: "DC2",
        text: "Saya dapat mengakses data yang saya butuhkan dengan mudah dan cepat (accessibility).",
      },
      {
        code: "DC3",
        text: "Format data sudah terstandarisasi sehingga mudah diolah (standardization).",
      },
      {
        code: "DC4",
        text: "Terdapat aturan tata kelola (governance) yang jelas mengenai siapa yang boleh mengakses data.",
      },
    ],
  },
  {
    id: "PEOU",
    letter: "D",
    title: "Persepsi Kemudahan Penggunaan",
    titleEn: "Perceived Ease of Use",
    items: [
      {
        code: "PEOU1",
        text: "Saya merasa sistem BDA-AI di rumah sakit ini mudah dipelajari (easy to learn).",
      },
      {
        code: "PEOU2",
        text: "Interaksi saya dengan sistem jelas dan mudah dimengerti (clear & understandable).",
      },
      {
        code: "PEOU3",
        text: "Saya tidak membutuhkan usaha mental yang besar untuk mengoperasikan sistem ini.",
      },
      {
        code: "PEOU4",
        text: "Secara keseluruhan, sistem ini mudah digunakan (user friendly).",
      },
    ],
  },
  {
    id: "PU",
    letter: "E",
    title: "Persepsi Kegunaan",
    titleEn: "Perceived Usefulness",
    items: [
      {
        code: "PU1",
        text: "Menggunakan sistem ini meningkatkan kinerja pekerjaan saya (job performance).",
      },
      {
        code: "PU2",
        text: "Menggunakan sistem ini meningkatkan produktivitas saya (pekerjaan lebih cepat selesai).",
      },
      {
        code: "PU3",
        text: "Sistem ini meningkatkan efektivitas saya dalam mengambil keputusan klinis/manajerial.",
      },
      {
        code: "PU4",
        text: "Secara keseluruhan, sistem ini bermanfaat bagi pekerjaan saya.",
      },
    ],
  },
  {
    id: "BI",
    letter: "F",
    title: "Niat Perilaku",
    titleEn: "Behavioral Intention",
    items: [
      {
        code: "BI1",
        text: "Saya berniat menggunakan sistem BDA-AI ini dalam rutinitas pekerjaan saya di masa depan.",
      },
      {
        code: "BI2",
        text: "Saya akan menggunakan sistem ini sesering mungkin jika memiliki akses.",
      },
      {
        code: "BI3",
        text: "Saya akan merekomendasikan rekan kerja lain untuk menggunakan sistem ini.",
      },
    ],
  },
  {
    id: "READ",
    letter: "G",
    title: "Kesiapan Organisasi",
    titleEn: "Organizational Readiness",
    items: [
      {
        code: "READ1",
        text: "Rumah sakit kami memiliki SOP/Prosedur yang jelas untuk integrasi analitik data.",
      },
      {
        code: "READ2",
        text: "Rumah sakit kami memiliki Tim/Komite khusus yang menangani data dan AI.",
      },
      {
        code: "READ3",
        text: "Rumah sakit kami mengalokasikan Anggaran khusus untuk pengembangan teknologi data.",
      },
      {
        code: "READ4",
        text: "Budaya kerja di unit kami sangat terbuka terhadap Inovasi digital.",
      },
      {
        code: "READ_G1",
        text: "Secara keseluruhan, saya menilai rumah sakit kami sudah siap untuk mengadopsi BDA-AI.",
      },
    ],
  },
];

export const LIKERT_LABELS: Record<number, string> = {
  1: "Sangat Tidak Setuju",
  2: "Tidak Setuju",
  3: "Agak Tidak Setuju",
  4: "Netral",
  5: "Agak Setuju",
  6: "Setuju",
  7: "Sangat Setuju",
};

export const STEP_LABELS = [
  "Mulai",
  "Profil",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "Review",
];

// All likert item codes in order
export const ALL_LIKERT_CODES = SECTIONS.flatMap((s) =>
  s.items.map((i) => i.code)
);
