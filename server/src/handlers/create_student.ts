import { db } from '../db';
import { studentsTable } from '../db/schema';
import { type CreateStudentInput, type Student } from '../schema';
import { eq } from 'drizzle-orm';

export const createStudent = async (input: CreateStudentInput): Promise<Student> => {
  try {
    // Check if NIS already exists to ensure uniqueness
    const existingStudent = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.nis, input.nis))
      .execute();

    if (existingStudent.length > 0) {
      throw new Error(`Student with NIS ${input.nis} already exists`);
    }

    // Insert new student record
    const result = await db.insert(studentsTable)
      .values({
        nis: input.nis,
        nama: input.nama,
        kelas: input.kelas,
        jenis_kelamin: input.jenis_kelamin,
        tanggal_lahir: input.tanggal_lahir.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string format
        alamat: input.alamat,
        hp: input.hp,
        foto: input.foto || null // Handle optional/nullable photo field
      })
      .returning()
      .execute();

    // Return the created student with proper Date object conversion
    const student = result[0];
    return {
      ...student,
      tanggal_lahir: new Date(student.tanggal_lahir), // Convert date string back to Date object
      created_at: student.created_at, // These are already Date objects from timestamp columns
      updated_at: student.updated_at
    };
  } catch (error) {
    console.error('Student creation failed:', error);
    throw error;
  }
};