import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { studentsTable } from '../db/schema';
import { type CreateStudentInput } from '../schema';
import { getStudents } from '../handlers/get_students';

// Test data for creating students
const testStudent1: CreateStudentInput = {
  nis: '12345678',
  nama: 'Ahmad Rizki',
  kelas: 'XI',
  jenis_kelamin: 'L',
  tanggal_lahir: new Date('2005-03-15'),
  alamat: 'Jl. Merdeka No. 123, Jakarta',
  hp: '081234567890',
  foto: 'https://example.com/photos/ahmad.jpg'
};

const testStudent2: CreateStudentInput = {
  nis: '87654321',
  nama: 'Siti Aminah',
  kelas: 'X',
  jenis_kelamin: 'P',
  tanggal_lahir: new Date('2006-07-22'),
  alamat: 'Jl. Sudirman No. 456, Bandung',
  hp: '089876543210',
  foto: null
};

const testStudent3: CreateStudentInput = {
  nis: '11223344',
  nama: 'Budi Santoso',
  kelas: 'XII',
  jenis_kelamin: 'L',
  tanggal_lahir: new Date('2004-12-10'),
  alamat: 'Jl. Gatot Subroto No. 789, Surabaya',
  hp: '085567891234',
  foto: 'https://example.com/photos/budi.jpg'
};

describe('getStudents', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no students exist', async () => {
    const result = await getStudents();

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all students', async () => {
    // Insert test students - convert Date objects to strings for database
    await db.insert(studentsTable)
      .values([
        {
          nis: testStudent1.nis,
          nama: testStudent1.nama,
          kelas: testStudent1.kelas,
          jenis_kelamin: testStudent1.jenis_kelamin,
          tanggal_lahir: testStudent1.tanggal_lahir.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
          alamat: testStudent1.alamat,
          hp: testStudent1.hp,
          foto: testStudent1.foto
        },
        {
          nis: testStudent2.nis,
          nama: testStudent2.nama,
          kelas: testStudent2.kelas,
          jenis_kelamin: testStudent2.jenis_kelamin,
          tanggal_lahir: testStudent2.tanggal_lahir.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
          alamat: testStudent2.alamat,
          hp: testStudent2.hp,
          foto: testStudent2.foto
        },
        {
          nis: testStudent3.nis,
          nama: testStudent3.nama,
          kelas: testStudent3.kelas,
          jenis_kelamin: testStudent3.jenis_kelamin,
          tanggal_lahir: testStudent3.tanggal_lahir.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
          alamat: testStudent3.alamat,
          hp: testStudent3.hp,
          foto: testStudent3.foto
        }
      ])
      .execute();

    const result = await getStudents();

    expect(result).toHaveLength(3);
    
    // Verify all students are returned
    const studentNames = result.map(student => student.nama);
    expect(studentNames).toContain('Ahmad Rizki');
    expect(studentNames).toContain('Siti Aminah');
    expect(studentNames).toContain('Budi Santoso');
  });

  it('should return students with all required fields', async () => {
    // Insert a single test student
    await db.insert(studentsTable)
      .values({
        nis: testStudent1.nis,
        nama: testStudent1.nama,
        kelas: testStudent1.kelas,
        jenis_kelamin: testStudent1.jenis_kelamin,
        tanggal_lahir: testStudent1.tanggal_lahir.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        alamat: testStudent1.alamat,
        hp: testStudent1.hp,
        foto: testStudent1.foto
      })
      .execute();

    const result = await getStudents();

    expect(result).toHaveLength(1);
    const student = result[0];

    // Verify all fields are present and correct
    expect(student.id).toBeDefined();
    expect(student.nis).toEqual('12345678');
    expect(student.nama).toEqual('Ahmad Rizki');
    expect(student.kelas).toEqual('XI');
    expect(student.jenis_kelamin).toEqual('L');
    expect(student.tanggal_lahir).toEqual(new Date('2005-03-15')); // Date converted back to Date object
    expect(student.alamat).toEqual('Jl. Merdeka No. 123, Jakarta');
    expect(student.hp).toEqual('081234567890');
    expect(student.foto).toEqual('https://example.com/photos/ahmad.jpg');
    expect(student.created_at).toBeInstanceOf(Date);
    expect(student.updated_at).toBeInstanceOf(Date);
  });

  it('should handle students with null foto field', async () => {
    // Insert student with null foto
    await db.insert(studentsTable)
      .values({
        nis: testStudent2.nis,
        nama: testStudent2.nama,
        kelas: testStudent2.kelas,
        jenis_kelamin: testStudent2.jenis_kelamin,
        tanggal_lahir: testStudent2.tanggal_lahir.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        alamat: testStudent2.alamat,
        hp: testStudent2.hp,
        foto: testStudent2.foto
      })
      .execute();

    const result = await getStudents();

    expect(result).toHaveLength(1);
    const student = result[0];

    expect(student.nama).toEqual('Siti Aminah');
    expect(student.foto).toBeNull();
  });

  it('should return students ordered by name', async () => {
    // Insert students in random order
    await db.insert(studentsTable)
      .values([
        {
          nis: testStudent3.nis, // Budi Santoso
          nama: testStudent3.nama,
          kelas: testStudent3.kelas,
          jenis_kelamin: testStudent3.jenis_kelamin,
          tanggal_lahir: testStudent3.tanggal_lahir.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
          alamat: testStudent3.alamat,
          hp: testStudent3.hp,
          foto: testStudent3.foto
        },
        {
          nis: testStudent1.nis, // Ahmad Rizki
          nama: testStudent1.nama,
          kelas: testStudent1.kelas,
          jenis_kelamin: testStudent1.jenis_kelamin,
          tanggal_lahir: testStudent1.tanggal_lahir.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
          alamat: testStudent1.alamat,
          hp: testStudent1.hp,
          foto: testStudent1.foto
        },
        {
          nis: testStudent2.nis, // Siti Aminah
          nama: testStudent2.nama,
          kelas: testStudent2.kelas,
          jenis_kelamin: testStudent2.jenis_kelamin,
          tanggal_lahir: testStudent2.tanggal_lahir.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
          alamat: testStudent2.alamat,
          hp: testStudent2.hp,
          foto: testStudent2.foto
        }
      ])
      .execute();

    const result = await getStudents();

    expect(result).toHaveLength(3);
    
    // Verify students are ordered alphabetically by name
    expect(result[0].nama).toEqual('Ahmad Rizki');
    expect(result[1].nama).toEqual('Budi Santoso');
    expect(result[2].nama).toEqual('Siti Aminah');
  });

  it('should handle different student classes and genders', async () => {
    // Insert students with various classes and genders
    await db.insert(studentsTable)
      .values([
        {
          nis: '10001000',
          nama: 'Andi',
          kelas: 'X',
          jenis_kelamin: 'L',
          tanggal_lahir: '2006-01-01', // Use string format for database
          alamat: 'Test Address 1',
          hp: '081111111111',
          foto: null
        },
        {
          nis: '10002000',
          nama: 'Bela',
          kelas: 'XI',
          jenis_kelamin: 'P',
          tanggal_lahir: '2005-06-15', // Use string format for database
          alamat: 'Test Address 2',
          hp: '082222222222',
          foto: null
        },
        {
          nis: '10003000',
          nama: 'Citra',
          kelas: 'XII',
          jenis_kelamin: 'P',
          tanggal_lahir: '2004-09-30', // Use string format for database
          alamat: 'Test Address 3',
          hp: '083333333333',
          foto: null
        }
      ])
      .execute();

    const result = await getStudents();

    expect(result).toHaveLength(3);
    
    // Verify different classes are handled
    const classes = result.map(student => student.kelas);
    expect(classes).toContain('X');
    expect(classes).toContain('XI');
    expect(classes).toContain('XII');

    // Verify different genders are handled
    const genders = result.map(student => student.jenis_kelamin);
    expect(genders).toContain('L');
    expect(genders).toContain('P');
  });
});