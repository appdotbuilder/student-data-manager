import { db } from '../db';
import { studentsTable } from '../db/schema';
import { type UpdateStudentInput, type Student } from '../schema';
import { eq, and, ne } from 'drizzle-orm';

export const updateStudent = async (input: UpdateStudentInput): Promise<Student | null> => {
  try {
    const { id, ...updateFields } = input;

    // First, check if the student exists
    const existingStudent = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, id))
      .execute();

    if (existingStudent.length === 0) {
      return null; // Student not found
    }

    // If NIS is being updated, check for uniqueness
    if (input.nis) {
      const nisConflict = await db.select()
        .from(studentsTable)
        .where(and(
          eq(studentsTable.nis, input.nis),
          ne(studentsTable.id, id) // Exclude current student
        ))
        .execute();

      if (nisConflict.length > 0) {
        throw new Error('NIS already exists for another student');
      }
    }

    // Build update object with only provided fields
    const updateData: any = {};
    
    if (input.nis !== undefined) updateData.nis = input.nis;
    if (input.nama !== undefined) updateData.nama = input.nama;
    if (input.kelas !== undefined) updateData.kelas = input.kelas;
    if (input.jenis_kelamin !== undefined) updateData.jenis_kelamin = input.jenis_kelamin;
    if (input.tanggal_lahir !== undefined) updateData.tanggal_lahir = input.tanggal_lahir.toISOString().split('T')[0]; // Convert Date to YYYY-MM-DD string
    if (input.alamat !== undefined) updateData.alamat = input.alamat;
    if (input.hp !== undefined) updateData.hp = input.hp;
    if (input.foto !== undefined) updateData.foto = input.foto;

    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    // Perform the update
    const result = await db.update(studentsTable)
      .set(updateData)
      .where(eq(studentsTable.id, id))
      .returning()
      .execute();

    // Return the updated student with date conversion
    const updatedStudent = result[0];
    return {
      ...updatedStudent,
      tanggal_lahir: new Date(updatedStudent.tanggal_lahir), // Convert string back to Date
      created_at: new Date(updatedStudent.created_at), // Ensure proper Date conversion
      updated_at: new Date(updatedStudent.updated_at) // Ensure proper Date conversion
    };
  } catch (error) {
    console.error('Student update failed:', error);
    throw error;
  }
};