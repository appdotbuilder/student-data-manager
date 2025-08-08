import { db } from '../db';
import { studentsTable } from '../db/schema';
import { type DeleteStudentInput } from '../schema';
import { eq } from 'drizzle-orm';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';

export const deleteStudent = async (input: DeleteStudentInput): Promise<{ success: boolean; message: string }> => {
  try {
    // First, check if student exists and get photo path for cleanup
    const existingStudents = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, input.id))
      .execute();

    if (existingStudents.length === 0) {
      return {
        success: false,
        message: `Student with ID ${input.id} not found`
      };
    }

    const student = existingStudents[0];

    // Delete the student record from database
    const deleteResult = await db.delete(studentsTable)
      .where(eq(studentsTable.id, input.id))
      .execute();

    // Clean up photo file if it exists and is a local file path
    if (student.foto && !student.foto.startsWith('http')) {
      try {
        if (existsSync(student.foto)) {
          await unlink(student.foto);
        }
      } catch (photoError) {
        // Log the error but don't fail the deletion
        console.error('Failed to delete photo file:', photoError);
      }
    }

    return {
      success: true,
      message: `Student with ID ${input.id} deleted successfully`
    };
  } catch (error) {
    console.error('Student deletion failed:', error);
    throw error;
  }
};