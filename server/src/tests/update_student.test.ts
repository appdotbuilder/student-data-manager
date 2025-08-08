import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { studentsTable } from '../db/schema';
import { type UpdateStudentInput, type CreateStudentInput } from '../schema';
import { updateStudent } from '../handlers/update_student';
import { eq } from 'drizzle-orm';

// Helper function to create a test student
const createTestStudent = async (overrides: Partial<CreateStudentInput & { tanggal_lahir: Date }> = {}) => {
  const defaultStudent = {
    nis: '12345',
    nama: 'John Doe',
    kelas: 'X' as const,
    jenis_kelamin: 'L' as const,
    tanggal_lahir: new Date('2000-01-01'),
    alamat: 'Test Address',
    hp: '081234567890',
    foto: null
  };

  const studentData = { 
    ...defaultStudent, 
    ...overrides,
    // Convert Date to string for database insertion
    tanggal_lahir: (overrides.tanggal_lahir || defaultStudent.tanggal_lahir).toISOString().split('T')[0]
  };

  const result = await db.insert(studentsTable)
    .values(studentData)
    .returning()
    .execute();

  // Convert string dates back to Date objects for consistency
  const student = result[0];
  return {
    ...student,
    tanggal_lahir: new Date(student.tanggal_lahir),
    created_at: new Date(student.created_at),
    updated_at: new Date(student.updated_at)
  };
};

// Test input for updating
const testUpdateInput: UpdateStudentInput = {
  id: 1,
  nama: 'Jane Smith',
  kelas: 'XI',
  alamat: 'Updated Address'
};

describe('updateStudent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a student with partial data', async () => {
    // Create a test student first
    const createdStudent = await createTestStudent();
    
    const updateInput: UpdateStudentInput = {
      id: createdStudent.id,
      nama: 'Jane Smith',
      kelas: 'XI',
      alamat: 'Updated Address'
    };

    const result = await updateStudent(updateInput);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(createdStudent.id);
    expect(result!.nama).toEqual('Jane Smith');
    expect(result!.kelas).toEqual('XI');
    expect(result!.alamat).toEqual('Updated Address');
    
    // Fields not updated should remain the same
    expect(result!.nis).toEqual(createdStudent.nis);
    expect(result!.jenis_kelamin).toEqual(createdStudent.jenis_kelamin);
    expect(result!.tanggal_lahir).toEqual(createdStudent.tanggal_lahir);
    expect(result!.hp).toEqual(createdStudent.hp);
    
    // updated_at should be different from created_at
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(result!.created_at.getTime());
  });

  it('should update all fields when provided', async () => {
    const createdStudent = await createTestStudent();
    
    const updateInput: UpdateStudentInput = {
      id: createdStudent.id,
      nis: '54321',
      nama: 'Updated Name',
      kelas: 'XII',
      jenis_kelamin: 'P',
      tanggal_lahir: new Date('1999-12-31'),
      alamat: 'New Address',
      hp: '087654321098',
      foto: 'updated-photo.jpg'
    };

    const result = await updateStudent(updateInput);

    expect(result).toBeDefined();
    expect(result!.nis).toEqual('54321');
    expect(result!.nama).toEqual('Updated Name');
    expect(result!.kelas).toEqual('XII');
    expect(result!.jenis_kelamin).toEqual('P');
    expect(result!.tanggal_lahir).toEqual(new Date('1999-12-31'));
    expect(result!.alamat).toEqual('New Address');
    expect(result!.hp).toEqual('087654321098');
    expect(result!.foto).toEqual('updated-photo.jpg');
  });

  it('should handle photo field correctly when set to null', async () => {
    const createdStudent = await createTestStudent({ foto: 'original-photo.jpg' });
    
    const updateInput: UpdateStudentInput = {
      id: createdStudent.id,
      foto: null
    };

    const result = await updateStudent(updateInput);

    expect(result).toBeDefined();
    expect(result!.foto).toBeNull();
  });

  it('should save updated student to database', async () => {
    const createdStudent = await createTestStudent();
    
    const updateInput: UpdateStudentInput = {
      id: createdStudent.id,
      nama: 'Database Test',
      kelas: 'XI'
    };

    await updateStudent(updateInput);

    // Verify in database
    const students = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, createdStudent.id))
      .execute();

    expect(students).toHaveLength(1);
    expect(students[0].nama).toEqual('Database Test');
    expect(students[0].kelas).toEqual('XI');
    // Database returns string, so we need to check the string representation
    expect(new Date(students[0].updated_at)).toBeInstanceOf(Date);
  });

  it('should return null when student does not exist', async () => {
    const updateInput: UpdateStudentInput = {
      id: 999, // Non-existent ID
      nama: 'Non-existent Student'
    };

    const result = await updateStudent(updateInput);

    expect(result).toBeNull();
  });

  it('should throw error when NIS conflicts with another student', async () => {
    // Create two test students with unique NIS
    const student1 = await createTestStudent({ nis: '11111' });
    
    // Add a small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const student2 = await createTestStudent({ nis: '22222' });
    
    // Try to update student2 with student1's NIS
    const updateInput: UpdateStudentInput = {
      id: student2.id,
      nis: '11111' // This should conflict
    };

    expect(updateStudent(updateInput)).rejects.toThrow(/NIS already exists/i);
  });

  it('should allow updating NIS to the same value', async () => {
    const createdStudent = await createTestStudent({ nis: '12345' });
    
    const updateInput: UpdateStudentInput = {
      id: createdStudent.id,
      nis: '12345', // Same NIS should be allowed
      nama: 'Updated Name'
    };

    const result = await updateStudent(updateInput);

    expect(result).toBeDefined();
    expect(result!.nis).toEqual('12345');
    expect(result!.nama).toEqual('Updated Name');
  });

  it('should preserve original created_at timestamp', async () => {
    const createdStudent = await createTestStudent();
    const originalCreatedAt = createdStudent.created_at;
    
    // Wait a moment to ensure timestamps are different
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const updateInput: UpdateStudentInput = {
      id: createdStudent.id,
      nama: 'Timestamp Test'
    };

    const result = await updateStudent(updateInput);

    expect(result).toBeDefined();
    expect(result!.created_at).toEqual(originalCreatedAt);
    expect(result!.updated_at.getTime()).toBeGreaterThan(originalCreatedAt.getTime());
  });

  it('should handle date field updates correctly', async () => {
    const createdStudent = await createTestStudent();
    const newBirthDate = new Date('1998-06-15');
    
    const updateInput: UpdateStudentInput = {
      id: createdStudent.id,
      tanggal_lahir: newBirthDate
    };

    const result = await updateStudent(updateInput);

    expect(result).toBeDefined();
    expect(result!.tanggal_lahir).toEqual(newBirthDate);
  });
});