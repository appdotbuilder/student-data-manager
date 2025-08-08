import { z } from 'zod';

// Enum definitions for student class and gender
export const kelasEnum = z.enum(['X', 'XI', 'XII']);
export const jenisKelaminEnum = z.enum(['L', 'P']); // L = Laki-laki, P = Perempuan

export type Kelas = z.infer<typeof kelasEnum>;
export type JenisKelamin = z.infer<typeof jenisKelaminEnum>;

// Student schema
export const studentSchema = z.object({
  id: z.number(),
  nis: z.string(),
  nama: z.string(),
  kelas: kelasEnum,
  jenis_kelamin: jenisKelaminEnum,
  tanggal_lahir: z.coerce.date(), // Converts string timestamps to Date objects
  alamat: z.string(),
  hp: z.string(),
  foto: z.string().nullable(), // Photo URL or file path, can be null
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Student = z.infer<typeof studentSchema>;

// Input schema for creating students
export const createStudentInputSchema = z.object({
  nis: z.string().min(1, 'NIS is required'),
  nama: z.string().min(1, 'Name is required'),
  kelas: kelasEnum,
  jenis_kelamin: jenisKelaminEnum,
  tanggal_lahir: z.coerce.date(),
  alamat: z.string().min(1, 'Address is required'),
  hp: z.string().min(1, 'Phone number is required'),
  foto: z.string().nullable().optional() // Optional during creation, can be null
});

export type CreateStudentInput = z.infer<typeof createStudentInputSchema>;

// Input schema for updating students
export const updateStudentInputSchema = z.object({
  id: z.number(),
  nis: z.string().min(1, 'NIS is required').optional(),
  nama: z.string().min(1, 'Name is required').optional(),
  kelas: kelasEnum.optional(),
  jenis_kelamin: jenisKelaminEnum.optional(),
  tanggal_lahir: z.coerce.date().optional(),
  alamat: z.string().min(1, 'Address is required').optional(),
  hp: z.string().min(1, 'Phone number is required').optional(),
  foto: z.string().nullable().optional() // Can be null or undefined
});

export type UpdateStudentInput = z.infer<typeof updateStudentInputSchema>;

// Schema for getting student by ID
export const getStudentByIdInputSchema = z.object({
  id: z.number()
});

export type GetStudentByIdInput = z.infer<typeof getStudentByIdInputSchema>;

// Schema for deleting student
export const deleteStudentInputSchema = z.object({
  id: z.number()
});

export type DeleteStudentInput = z.infer<typeof deleteStudentInputSchema>;