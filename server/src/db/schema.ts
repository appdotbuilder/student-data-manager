import { serial, text, pgTable, timestamp, pgEnum, date } from 'drizzle-orm/pg-core';

// Define enums for PostgreSQL
export const kelasEnum = pgEnum('kelas', ['X', 'XI', 'XII']);
export const jenisKelaminEnum = pgEnum('jenis_kelamin', ['L', 'P']);

export const studentsTable = pgTable('students', {
  id: serial('id').primaryKey(),
  nis: text('nis').notNull().unique(), // Student ID Number, must be unique
  nama: text('nama').notNull(), // Name
  kelas: kelasEnum('kelas').notNull(), // Class (X, XI, XII)
  jenis_kelamin: jenisKelaminEnum('jenis_kelamin').notNull(), // Gender (L, P)
  tanggal_lahir: date('tanggal_lahir').notNull(), // Date of Birth
  alamat: text('alamat').notNull(), // Address
  hp: text('hp').notNull(), // Phone Number
  foto: text('foto'), // Photo URL/path, nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type Student = typeof studentsTable.$inferSelect; // For SELECT operations
export type NewStudent = typeof studentsTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { students: studentsTable };