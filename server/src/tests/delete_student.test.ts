import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { studentsTable } from '../db/schema';
import { type DeleteStudentInput, type CreateStudentInput } from '../schema';
import { deleteStudent } from '../handlers/delete_student';
import { eq } from 'drizzle-orm';
import { writeFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';

// Test input for creating a student
const testStudentInput: CreateStudentInput = {
  nis: 'TEST001',
  nama: 'Test Student',
  kelas: 'X',
  jenis_kelamin: 'L',
  tanggal_lahir: new Date('2005-01-15'),
  alamat: 'Jl. Test No. 123',
  hp: '081234567890',
  foto: null
};

describe('deleteStudent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing student', async () => {
    // Create a test student first
    const insertResult = await db.insert(studentsTable)
      .values({
        nis: testStudentInput.nis,
        nama: testStudentInput.nama,
        kelas: testStudentInput.kelas,
        jenis_kelamin: testStudentInput.jenis_kelamin,
        tanggal_lahir: testStudentInput.tanggal_lahir.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        alamat: testStudentInput.alamat,
        hp: testStudentInput.hp,
        foto: testStudentInput.foto
      })
      .returning()
      .execute();

    const createdStudent = insertResult[0];

    const deleteInput: DeleteStudentInput = {
      id: createdStudent.id
    };

    // Delete the student
    const result = await deleteStudent(deleteInput);

    // Check response
    expect(result.success).toBe(true);
    expect(result.message).toEqual(`Student with ID ${createdStudent.id} deleted successfully`);

    // Verify student is deleted from database
    const remainingStudents = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, createdStudent.id))
      .execute();

    expect(remainingStudents).toHaveLength(0);
  });

  it('should return error for non-existent student', async () => {
    const deleteInput: DeleteStudentInput = {
      id: 99999 // Non-existent ID
    };

    const result = await deleteStudent(deleteInput);

    // Check response
    expect(result.success).toBe(false);
    expect(result.message).toEqual('Student with ID 99999 not found');
  });

  it('should delete student with photo file', async () => {
    // Create a temporary photo file
    const photoPath = '/tmp/test_student_photo.jpg';
    await writeFile(photoPath, 'fake image data');

    // Create a test student with photo
    const insertResult = await db.insert(studentsTable)
      .values({
        nis: testStudentInput.nis,
        nama: testStudentInput.nama,
        kelas: testStudentInput.kelas,
        jenis_kelamin: testStudentInput.jenis_kelamin,
        tanggal_lahir: testStudentInput.tanggal_lahir.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        alamat: testStudentInput.alamat,
        hp: testStudentInput.hp,
        foto: photoPath
      })
      .returning()
      .execute();

    const createdStudent = insertResult[0];

    // Verify photo file exists before deletion
    expect(existsSync(photoPath)).toBe(true);

    const deleteInput: DeleteStudentInput = {
      id: createdStudent.id
    };

    // Delete the student
    const result = await deleteStudent(deleteInput);

    // Check response
    expect(result.success).toBe(true);
    expect(result.message).toEqual(`Student with ID ${createdStudent.id} deleted successfully`);

    // Verify student is deleted from database
    const remainingStudents = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, createdStudent.id))
      .execute();

    expect(remainingStudents).toHaveLength(0);

    // Verify photo file is also deleted
    expect(existsSync(photoPath)).toBe(false);
  });

  it('should delete student with URL photo without file cleanup', async () => {
    // Create a test student with URL photo (not a local file)
    const insertResult = await db.insert(studentsTable)
      .values({
        nis: testStudentInput.nis,
        nama: testStudentInput.nama,
        kelas: testStudentInput.kelas,
        jenis_kelamin: testStudentInput.jenis_kelamin,
        tanggal_lahir: testStudentInput.tanggal_lahir.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        alamat: testStudentInput.alamat,
        hp: testStudentInput.hp,
        foto: 'https://example.com/photo.jpg' // URL photo
      })
      .returning()
      .execute();

    const createdStudent = insertResult[0];

    const deleteInput: DeleteStudentInput = {
      id: createdStudent.id
    };

    // Delete the student
    const result = await deleteStudent(deleteInput);

    // Check response
    expect(result.success).toBe(true);
    expect(result.message).toEqual(`Student with ID ${createdStudent.id} deleted successfully`);

    // Verify student is deleted from database
    const remainingStudents = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, createdStudent.id))
      .execute();

    expect(remainingStudents).toHaveLength(0);
  });

  it('should handle multiple students with different classes', async () => {
    // Create test students with different classes
    const student1 = await db.insert(studentsTable)
      .values({
        nis: 'TEST001',
        nama: 'Student Class X',
        kelas: 'X',
        jenis_kelamin: 'L',
        tanggal_lahir: '2005-01-15',
        alamat: 'Jl. Test No. 123',
        hp: '081234567890',
        foto: null
      })
      .returning()
      .execute();

    const student2 = await db.insert(studentsTable)
      .values({
        nis: 'TEST002',
        nama: 'Student Class XI',
        kelas: 'XI',
        jenis_kelamin: 'P',
        tanggal_lahir: '2004-06-20',
        alamat: 'Jl. Test No. 456',
        hp: '081234567891',
        foto: null
      })
      .returning()
      .execute();

    // Delete first student
    const result1 = await deleteStudent({ id: student1[0].id });
    expect(result1.success).toBe(true);

    // Verify first student is deleted
    const remaining1 = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, student1[0].id))
      .execute();
    expect(remaining1).toHaveLength(0);

    // Verify second student still exists
    const remaining2 = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, student2[0].id))
      .execute();
    expect(remaining2).toHaveLength(1);
    expect(remaining2[0].nama).toEqual('Student Class XI');
  });
});