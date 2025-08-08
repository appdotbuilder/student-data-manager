import { db } from '../db';
import { studentsTable } from '../db/schema';
import { type Student } from '../schema';
import { asc } from 'drizzle-orm';

export const getStudents = async (): Promise<Student[]> => {
  try {
    // Fetch all students ordered by name for better UX
    const results = await db.select()
      .from(studentsTable)
      .orderBy(asc(studentsTable.nama))
      .execute();

    // Convert date strings to Date objects to match schema expectations
    return results.map(student => ({
      ...student,
      tanggal_lahir: new Date(student.tanggal_lahir), // Convert string to Date
      created_at: student.created_at, // Already Date from timestamp
      updated_at: student.updated_at  // Already Date from timestamp
    }));
  } catch (error) {
    console.error('Failed to fetch students:', error);
    throw error;
  }
};