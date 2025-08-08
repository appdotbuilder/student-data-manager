import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { studentsTable } from '../db/schema';
import { type GetStudentByIdInput, type Student } from '../schema';
import { getStudentById } from '../handlers/get_student_by_id';
import { eq } from 'drizzle-orm';

// Test student data
const testStudentData = {
  nis: '202401001',
  nama: 'Ahmad Rizki',
  kelas: 'XI' as const,
  jenis_kelamin: 'L' as const,
  tanggal_lahir: '2007-05-15',
  alamat: 'Jl. Merdeka No. 123, Jakarta',
  hp: '081234567890',
  foto: 'https://example.com/photo.jpg'
};

describe('getStudentById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return student when found by ID', async () => {
    // First, create a student record
    const insertResult = await db.insert(studentsTable)
      .values(testStudentData)
      .returning()
      .execute();
    
    const insertedStudent = insertResult[0];
    
    // Test input
    const input: GetStudentByIdInput = {
      id: insertedStudent.id
    };

    // Get student by ID
    const result = await getStudentById(input);

    // Verify result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(insertedStudent.id);
    expect(result!.nis).toEqual('202401001');
    expect(result!.nama).toEqual('Ahmad Rizki');
    expect(result!.kelas).toEqual('XI');
    expect(result!.jenis_kelamin).toEqual('L');
    expect(result!.tanggal_lahir).toBeInstanceOf(Date);
    expect(result!.tanggal_lahir.getFullYear()).toEqual(2007);
    expect(result!.alamat).toEqual('Jl. Merdeka No. 123, Jakarta');
    expect(result!.hp).toEqual('081234567890');
    expect(result!.foto).toEqual('https://example.com/photo.jpg');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when student not found', async () => {
    // Test with non-existent ID
    const input: GetStudentByIdInput = {
      id: 99999
    };

    const result = await getStudentById(input);

    expect(result).toBeNull();
  });

  it('should return student with null foto when foto is null', async () => {
    // Create student without foto
    const studentWithoutPhoto = {
      ...testStudentData,
      foto: null
    };

    const insertResult = await db.insert(studentsTable)
      .values(studentWithoutPhoto)
      .returning()
      .execute();
    
    const insertedStudent = insertResult[0];
    
    const input: GetStudentByIdInput = {
      id: insertedStudent.id
    };

    const result = await getStudentById(input);

    expect(result).not.toBeNull();
    expect(result!.foto).toBeNull();
    expect(result!.nama).toEqual('Ahmad Rizki');
  });

  it('should verify student exists in database after retrieval', async () => {
    // Create a student record
    const insertResult = await db.insert(studentsTable)
      .values(testStudentData)
      .returning()
      .execute();
    
    const insertedStudent = insertResult[0];
    
    // Get student using handler
    const result = await getStudentById({ id: insertedStudent.id });

    // Verify in database directly
    const dbStudents = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, insertedStudent.id))
      .execute();

    expect(dbStudents).toHaveLength(1);
    expect(dbStudents[0].id).toEqual(result!.id);
    expect(dbStudents[0].nama).toEqual(result!.nama);
    expect(dbStudents[0].nis).toEqual(result!.nis);
  });

  it('should handle different student classes correctly', async () => {
    // Test with different class values
    const testCases = [
      { ...testStudentData, kelas: 'X' as const, nama: 'Student Kelas X' },
      { ...testStudentData, kelas: 'XI' as const, nama: 'Student Kelas XI' },
      { ...testStudentData, kelas: 'XII' as const, nama: 'Student Kelas XII' }
    ];

    for (const testCase of testCases) {
      // Create student
      const insertResult = await db.insert(studentsTable)
        .values({
          ...testCase,
          nis: `${testCase.kelas}001`, // Unique NIS for each class
          tanggal_lahir: '2007-05-15' // Use string for date column
        })
        .returning()
        .execute();
      
      const insertedStudent = insertResult[0];
      
      // Get student by ID
      const result = await getStudentById({ id: insertedStudent.id });

      expect(result).not.toBeNull();
      expect(result!.kelas).toEqual(testCase.kelas);
      expect(result!.nama).toEqual(testCase.nama);
    }
  });

  it('should handle different genders correctly', async () => {
    // Test with different gender values
    const maleStudent = {
      ...testStudentData,
      nis: '202401002',
      nama: 'Ahmad (Male)',
      jenis_kelamin: 'L' as const,
      tanggal_lahir: '2007-05-15'
    };

    const femaleStudent = {
      ...testStudentData,
      nis: '202401003',
      nama: 'Siti (Female)',
      jenis_kelamin: 'P' as const,
      tanggal_lahir: '2007-05-15'
    };

    // Create male student
    const maleResult = await db.insert(studentsTable)
      .values(maleStudent)
      .returning()
      .execute();
    
    // Create female student
    const femaleResult = await db.insert(studentsTable)
      .values(femaleStudent)
      .returning()
      .execute();

    // Test male student
    const maleRetrieved = await getStudentById({ id: maleResult[0].id });
    expect(maleRetrieved).not.toBeNull();
    expect(maleRetrieved!.jenis_kelamin).toEqual('L');
    expect(maleRetrieved!.nama).toEqual('Ahmad (Male)');

    // Test female student
    const femaleRetrieved = await getStudentById({ id: femaleResult[0].id });
    expect(femaleRetrieved).not.toBeNull();
    expect(femaleRetrieved!.jenis_kelamin).toEqual('P');
    expect(femaleRetrieved!.nama).toEqual('Siti (Female)');
  });
});