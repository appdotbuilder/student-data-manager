import { db } from '../db';
import { studentsTable } from '../db/schema';
import { type GetStudentByIdInput, type Student } from '../schema';
import { eq } from 'drizzle-orm';

export const getStudentById = async (input: GetStudentByIdInput): Promise<Student | null> => {
  try {
    // Query student by ID
    const results = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, input.id))
      .execute();

    // Return null if student not found
    if (results.length === 0) {
      return null;
    }

    // Return the first (and only) result
    const student = results[0];
    return {
      ...student,
      // Convert date string to Date object
      tanggal_lahir: new Date(student.tanggal_lahir),
      created_at: student.created_at,
      updated_at: student.updated_at
    };
  } catch (error) {
    console.error('Get student by ID failed:', error);
    throw error;
  }
};