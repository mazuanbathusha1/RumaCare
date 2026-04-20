/**
 * Federal public holidays in Malaysia. State-specific holidays are not included.
 * Dates are in ISO (YYYY-MM-DD) local to Malaysia (UTC+8); the date is treated
 * as the calendar date, not a UTC timestamp.
 *
 * Source: official gazetted federal public holidays published by JPA/MyGov.
 * Keep this list reviewed annually — admins can also add, edit, or remove
 * holidays from the Admin Portal at runtime.
 */
export interface PublicHolidaySeed {
  date: string; // YYYY-MM-DD
  name: string;
}

export const MY_PUBLIC_HOLIDAYS: PublicHolidaySeed[] = [
  // 2024
  { date: "2024-01-01", name: "New Year's Day" },
  { date: "2024-01-25", name: "Thaipusam" },
  { date: "2024-02-01", name: "Federal Territory Day" },
  { date: "2024-02-10", name: "Chinese New Year" },
  { date: "2024-02-11", name: "Chinese New Year (2nd day)" },
  { date: "2024-03-28", name: "Nuzul Al-Quran" },
  { date: "2024-04-10", name: "Hari Raya Aidilfitri" },
  { date: "2024-04-11", name: "Hari Raya Aidilfitri (2nd day)" },
  { date: "2024-05-01", name: "Labour Day" },
  { date: "2024-05-22", name: "Wesak Day" },
  { date: "2024-06-03", name: "Yang di-Pertuan Agong's Birthday" },
  { date: "2024-06-17", name: "Hari Raya Haji" },
  { date: "2024-07-07", name: "Awal Muharram" },
  { date: "2024-08-31", name: "National Day" },
  { date: "2024-09-16", name: "Malaysia Day" },
  { date: "2024-09-16", name: "Prophet Muhammad's Birthday (observed)" },
  { date: "2024-10-31", name: "Deepavali" },
  { date: "2024-12-25", name: "Christmas Day" },

  // 2025
  { date: "2025-01-01", name: "New Year's Day" },
  { date: "2025-01-29", name: "Chinese New Year" },
  { date: "2025-01-30", name: "Chinese New Year (2nd day)" },
  { date: "2025-02-01", name: "Federal Territory Day" },
  { date: "2025-02-11", name: "Thaipusam" },
  { date: "2025-03-18", name: "Nuzul Al-Quran" },
  { date: "2025-03-31", name: "Hari Raya Aidilfitri" },
  { date: "2025-04-01", name: "Hari Raya Aidilfitri (2nd day)" },
  { date: "2025-05-01", name: "Labour Day" },
  { date: "2025-05-12", name: "Wesak Day" },
  { date: "2025-06-02", name: "Yang di-Pertuan Agong's Birthday" },
  { date: "2025-06-07", name: "Hari Raya Haji" },
  { date: "2025-06-27", name: "Awal Muharram" },
  { date: "2025-08-31", name: "National Day" },
  { date: "2025-09-05", name: "Prophet Muhammad's Birthday" },
  { date: "2025-09-16", name: "Malaysia Day" },
  { date: "2025-10-20", name: "Deepavali" },
  { date: "2025-12-25", name: "Christmas Day" },

  // 2026
  { date: "2026-01-01", name: "New Year's Day" },
  { date: "2026-02-01", name: "Federal Territory Day" },
  { date: "2026-02-17", name: "Chinese New Year" },
  { date: "2026-02-18", name: "Chinese New Year (2nd day)" },
  { date: "2026-03-02", name: "Thaipusam" },
  { date: "2026-03-07", name: "Nuzul Al-Quran" },
  { date: "2026-03-20", name: "Hari Raya Aidilfitri" },
  { date: "2026-03-21", name: "Hari Raya Aidilfitri (2nd day)" },
  { date: "2026-05-01", name: "Labour Day" },
  { date: "2026-05-01", name: "Wesak Day" },
  { date: "2026-05-27", name: "Hari Raya Haji" },
  { date: "2026-06-06", name: "Yang di-Pertuan Agong's Birthday" },
  { date: "2026-06-16", name: "Awal Muharram" },
  { date: "2026-08-25", name: "Prophet Muhammad's Birthday" },
  { date: "2026-08-31", name: "National Day" },
  { date: "2026-09-16", name: "Malaysia Day" },
  { date: "2026-11-08", name: "Deepavali" },
  { date: "2026-12-25", name: "Christmas Day" },
];
