import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { studentsTable } from '../db/schema';
import { type CreateStudentInput } from '../schema';
import { createStudent } from '../handlers/create_student';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateStudentInput = {
  nis: '12345',
  nama: 'Ahmad Doe',
  kelas: 'XI',
  jenis_kelamin: 'L',
  tanggal_lahir: new Date('2005-06-15'),
  alamat: 'Jl. Sudirman No. 123, Jakarta',
  hp: '081234567890',
  foto: 'https://example.com/photo.jpg'
};

describe('createStudent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a student with all fields', async () => {
    const result = await createStudent(testInput);

    // Validate all fields
    expect(result.nis).toEqual('12345');
    expect(result.nama).toEqual('Ahmad Doe');
    expect(result.kelas).toEqual('XI');
    expect(result.jenis_kelamin).toEqual('L');
    expect(result.tanggal_lahir).toBeInstanceOf(Date);
    expect(result.tanggal_lahir.getFullYear()).toEqual(2005);
    expect(result.tanggal_lahir.getMonth()).toEqual(5); // June = month 5 (0-indexed)
    expect(result.tanggal_lahir.getDate()).toEqual(15);
    expect(result.alamat).toEqual('Jl. Sudirman No. 123, Jakarta');
    expect(result.hp).toEqual('081234567890');
    expect(result.foto).toEqual('https://example.com/photo.jpg');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save student to database correctly', async () => {
    const result = await createStudent(testInput);

    // Query database to verify data was saved
    const students = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, result.id))
      .execute();

    expect(students).toHaveLength(1);
    const savedStudent = students[0];
    
    expect(savedStudent.nis).toEqual('12345');
    expect(savedStudent.nama).toEqual('Ahmad Doe');
    expect(savedStudent.kelas).toEqual('XI');
    expect(savedStudent.jenis_kelamin).toEqual('L');
    expect(savedStudent.alamat).toEqual('Jl. Sudirman No. 123, Jakarta');
    expect(savedStudent.hp).toEqual('081234567890');
    expect(savedStudent.foto).toEqual('https://example.com/photo.jpg');
    expect(savedStudent.created_at).toBeInstanceOf(Date);
    expect(savedStudent.updated_at).toBeInstanceOf(Date);
  });

  it('should handle student without photo (null foto)', async () => {
    const inputWithoutPhoto: CreateStudentInput = {
      ...testInput,
      foto: null
    };

    const result = await createStudent(inputWithoutPhoto);

    expect(result.foto).toBeNull();
    expect(result.nama).toEqual('Ahmad Doe');
    expect(result.id).toBeDefined();
  });

  it('should handle student with undefined foto', async () => {
    const inputWithUndefinedPhoto: CreateStudentInput = {
      nis: '54321',
      nama: 'Siti Rahman',
      kelas: 'XII',
      jenis_kelamin: 'P',
      tanggal_lahir: new Date('2004-12-25'),
      alamat: 'Jl. Gatot Subroto No. 456, Bandung',
      hp: '087654321098'
      // foto is undefined (not provided)
    };

    const result = await createStudent(inputWithUndefinedPhoto);

    expect(result.foto).toBeNull();
    expect(result.nama).toEqual('Siti Rahman');
    expect(result.jenis_kelamin).toEqual('P');
    expect(result.kelas).toEqual('XII');
  });

  it('should create students with different class levels', async () => {
    const studentX: CreateStudentInput = {
      ...testInput,
      nis: '10001',
      nama: 'Student X',
      kelas: 'X'
    };

    const studentXII: CreateStudentInput = {
      ...testInput,
      nis: '10002',
      nama: 'Student XII',
      kelas: 'XII'
    };

    const resultX = await createStudent(studentX);
    const resultXII = await createStudent(studentXII);

    expect(resultX.kelas).toEqual('X');
    expect(resultXII.kelas).toEqual('XII');
    expect(resultX.id).not.toEqual(resultXII.id);
  });

  it('should create students with different genders', async () => {
    const malStudent: CreateStudentInput = {
      ...testInput,
      nis: '20001',
      nama: 'Ahmad Male',
      jenis_kelamin: 'L'
    };

    const femaleStudent: CreateStudentInput = {
      ...testInput,
      nis: '20002',
      nama: 'Siti Female', 
      jenis_kelamin: 'P'
    };

    const maleResult = await createStudent(malStudent);
    const femaleResult = await createStudent(femaleStudent);

    expect(maleResult.jenis_kelamin).toEqual('L');
    expect(femaleResult.jenis_kelamin).toEqual('P');
  });

  it('should throw error when NIS already exists', async () => {
    // Create first student
    await createStudent(testInput);

    // Try to create another student with same NIS
    const duplicateInput: CreateStudentInput = {
      ...testInput,
      nama: 'Different Name' // Different name but same NIS
    };

    await expect(createStudent(duplicateInput))
      .rejects
      .toThrow(/Student with NIS 12345 already exists/i);
  });

  it('should handle date conversion correctly', async () => {
    const specificDate = new Date('1990-01-31'); // January 31, 1990
    const inputWithSpecificDate: CreateStudentInput = {
      ...testInput,
      nis: '30001',
      tanggal_lahir: specificDate
    };

    const result = await createStudent(inputWithSpecificDate);

    expect(result.tanggal_lahir).toBeInstanceOf(Date);
    expect(result.tanggal_lahir.getFullYear()).toEqual(1990);
    expect(result.tanggal_lahir.getMonth()).toEqual(0); // January = month 0
    expect(result.tanggal_lahir.getDate()).toEqual(31);
  });

  it('should maintain timestamp consistency', async () => {
    const beforeCreation = new Date();
    
    const result = await createStudent(testInput);
    
    const afterCreation = new Date();

    // Verify timestamps are within expected range
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    
    // Initially, created_at and updated_at should be very close or equal
    const timeDiff = Math.abs(result.updated_at.getTime() - result.created_at.getTime());
    expect(timeDiff).toBeLessThan(1000); // Less than 1 second difference
  });
});