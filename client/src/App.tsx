import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Student, CreateStudentInput, UpdateStudentInput, Kelas, JenisKelamin } from '../../server/src/schema';
import { PlusIcon, PencilIcon, TrashIcon, UserIcon, PhoneIcon, MapPinIcon, CalendarIcon } from 'lucide-react';

function App() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Form state for creating new student
  const [createFormData, setCreateFormData] = useState<CreateStudentInput>({
    nis: '',
    nama: '',
    kelas: 'X',
    jenis_kelamin: 'L',
    tanggal_lahir: new Date(),
    alamat: '',
    hp: '',
    foto: null
  });

  // Form state for editing student
  const [editFormData, setEditFormData] = useState<Partial<CreateStudentInput>>({});

  const loadStudents = useCallback(async () => {
    try {
      const result = await trpc.getStudents.query();
      setStudents(result);
    } catch (error) {
      console.error('Failed to load students:', error);
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createStudent.mutate(createFormData);
      setStudents((prev: Student[]) => [...prev, response]);
      setCreateFormData({
        nis: '',
        nama: '',
        kelas: 'X',
        jenis_kelamin: 'L',
        tanggal_lahir: new Date(),
        alamat: '',
        hp: '',
        foto: null
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create student:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    
    setIsLoading(true);
    try {
      const updateData: UpdateStudentInput = {
        id: editingStudent.id,
        ...editFormData
      };
      const response = await trpc.updateStudent.mutate(updateData);
      if (response) {
        setStudents((prev: Student[]) => 
          prev.map((student: Student) => 
            student.id === response.id ? response : student
          )
        );
        setEditingStudent(null);
        setEditFormData({});
        setIsEditDialogOpen(false);
      } else {
        console.error('Student not found for update');
      }
    } catch (error) {
      console.error('Failed to update student:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (studentId: number) => {
    setIsLoading(true);
    try {
      await trpc.deleteStudent.mutate({ id: studentId });
      setStudents((prev: Student[]) => prev.filter((student: Student) => student.id !== studentId));
    } catch (error) {
      console.error('Failed to delete student:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (student: Student) => {
    setEditingStudent(student);
    setEditFormData({
      nis: student.nis,
      nama: student.nama,
      kelas: student.kelas,
      jenis_kelamin: student.jenis_kelamin,
      tanggal_lahir: student.tanggal_lahir,
      alamat: student.alamat,
      hp: student.hp,
      foto: student.foto
    });
    setIsEditDialogOpen(true);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getGenderLabel = (gender: JenisKelamin) => {
    return gender === 'L' ? 'Laki-laki' : 'Perempuan';
  };

  const getClassLabel = (kelas: Kelas) => {
    return `Kelas ${kelas}`;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">📚 Sistem Manajemen Siswa</h1>
          <p className="text-gray-600">Kelola data siswa dengan mudah dan efisien</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Siswa</p>
                  <p className="text-2xl font-bold">{students.length}</p>
                </div>
                <UserIcon className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Kelas X</p>
                  <p className="text-2xl font-bold">{students.filter((s: Student) => s.kelas === 'X').length}</p>
                </div>
                <Badge variant="secondary" className="bg-green-200 text-green-800">X</Badge>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm">Kelas XI</p>
                  <p className="text-2xl font-bold">{students.filter((s: Student) => s.kelas === 'XI').length}</p>
                </div>
                <Badge variant="secondary" className="bg-yellow-200 text-yellow-800">XI</Badge>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Kelas XII</p>
                  <p className="text-2xl font-bold">{students.filter((s: Student) => s.kelas === 'XII').length}</p>
                </div>
                <Badge variant="secondary" className="bg-purple-200 text-purple-800">XII</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Bar */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Daftar Siswa</h2>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                <PlusIcon className="mr-2 h-4 w-4" />
                Tambah Siswa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <form onSubmit={handleCreateSubmit}>
                <DialogHeader>
                  <DialogTitle>Tambah Siswa Baru</DialogTitle>
                  <DialogDescription>
                    Lengkapi form berikut untuk menambahkan siswa baru.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="nis">NIS</Label>
                    <Input
                      id="nis"
                      value={createFormData.nis}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCreateFormData((prev: CreateStudentInput) => ({ ...prev, nis: e.target.value }))
                      }
                      placeholder="Nomor Induk Siswa"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nama">Nama Lengkap</Label>
                    <Input
                      id="nama"
                      value={createFormData.nama}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCreateFormData((prev: CreateStudentInput) => ({ ...prev, nama: e.target.value }))
                      }
                      placeholder="Nama lengkap siswa"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="kelas">Kelas</Label>
                      <Select
                        value={createFormData.kelas}
                        onValueChange={(value: Kelas) =>
                          setCreateFormData((prev: CreateStudentInput) => ({ ...prev, kelas: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="X">Kelas X</SelectItem>
                          <SelectItem value="XI">Kelas XI</SelectItem>
                          <SelectItem value="XII">Kelas XII</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Jenis Kelamin</Label>
                      <Select
                        value={createFormData.jenis_kelamin}
                        onValueChange={(value: JenisKelamin) =>
                          setCreateFormData((prev: CreateStudentInput) => ({ ...prev, jenis_kelamin: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="L">Laki-laki</SelectItem>
                          <SelectItem value="P">Perempuan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tanggal_lahir">Tanggal Lahir</Label>
                    <Input
                      id="tanggal_lahir"
                      type="date"
                      value={createFormData.tanggal_lahir instanceof Date 
                        ? createFormData.tanggal_lahir.toISOString().split('T')[0] 
                        : ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCreateFormData((prev: CreateStudentInput) => ({ 
                          ...prev, 
                          tanggal_lahir: new Date(e.target.value) 
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="alamat">Alamat</Label>
                    <Input
                      id="alamat"
                      value={createFormData.alamat}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCreateFormData((prev: CreateStudentInput) => ({ ...prev, alamat: e.target.value }))
                      }
                      placeholder="Alamat lengkap"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hp">Nomor HP</Label>
                    <Input
                      id="hp"
                      value={createFormData.hp}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCreateFormData((prev: CreateStudentInput) => ({ ...prev, hp: e.target.value }))
                      }
                      placeholder="08xxxxxxxxxx"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="foto">URL Foto (Opsional)</Label>
                    <Input
                      id="foto"
                      value={createFormData.foto || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCreateFormData((prev: CreateStudentInput) => ({ 
                          ...prev, 
                          foto: e.target.value || null 
                        }))
                      }
                      placeholder="https://example.com/photo.jpg"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Batal
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Menyimpan...' : 'Simpan'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Student Grid */}
        {students.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <UserIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Belum ada data siswa</h3>
              <p className="text-gray-500 mb-6">Mulai dengan menambahkan siswa baru.</p>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Tambah Siswa Pertama
                  </Button>
                </DialogTrigger>
              </Dialog>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {students.map((student: Student) => (
              <Card key={student.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={student.foto || undefined} alt={student.nama} />
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                          {getInitials(student.nama)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{student.nama}</CardTitle>
                        <CardDescription>NIS: {student.nis}</CardDescription>
                      </div>
                    </div>
                    <Badge variant={student.kelas === 'X' ? 'default' : student.kelas === 'XI' ? 'secondary' : 'outline'}>
                      {getClassLabel(student.kelas)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <UserIcon className="mr-2 h-4 w-4" />
                    {getGenderLabel(student.jenis_kelamin)}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatDate(student.tanggal_lahir)}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPinIcon className="mr-2 h-4 w-4" />
                    <span className="truncate">{student.alamat}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <PhoneIcon className="mr-2 h-4 w-4" />
                    {student.hp}
                  </div>
                </CardContent>
                <Separator />
                <CardFooter className="pt-3">
                  <div className="flex space-x-2 w-full">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEditDialog(student)}
                    >
                      <PencilIcon className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus Siswa</AlertDialogTitle>
                          <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus data siswa <strong>{student.nama}</strong>? 
                            Tindakan ini tidak dapat dibatalkan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(student.id)}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={isLoading}
                          >
                            {isLoading ? 'Menghapus...' : 'Hapus'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <form onSubmit={handleEditSubmit}>
              <DialogHeader>
                <DialogTitle>Edit Data Siswa</DialogTitle>
                <DialogDescription>
                  Perbarui informasi siswa {editingStudent?.nama}.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-nis">NIS</Label>
                  <Input
                    id="edit-nis"
                    value={editFormData.nis || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: Partial<CreateStudentInput>) => ({ ...prev, nis: e.target.value }))
                    }
                    placeholder="Nomor Induk Siswa"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-nama">Nama Lengkap</Label>
                  <Input
                    id="edit-nama"
                    value={editFormData.nama || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: Partial<CreateStudentInput>) => ({ ...prev, nama: e.target.value }))
                    }
                    placeholder="Nama lengkap siswa"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-kelas">Kelas</Label>
                    <Select
                      value={editFormData.kelas || ''}
                      onValueChange={(value: Kelas) =>
                        setEditFormData((prev: Partial<CreateStudentInput>) => ({ ...prev, kelas: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="X">Kelas X</SelectItem>
                        <SelectItem value="XI">Kelas XI</SelectItem>
                        <SelectItem value="XII">Kelas XII</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-gender">Jenis Kelamin</Label>
                    <Select
                      value={editFormData.jenis_kelamin || ''}
                      onValueChange={(value: JenisKelamin) =>
                        setEditFormData((prev: Partial<CreateStudentInput>) => ({ ...prev, jenis_kelamin: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="L">Laki-laki</SelectItem>
                        <SelectItem value="P">Perempuan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-tanggal-lahir">Tanggal Lahir</Label>
                  <Input
                    id="edit-tanggal-lahir"
                    type="date"
                    value={editFormData.tanggal_lahir instanceof Date 
                      ? editFormData.tanggal_lahir.toISOString().split('T')[0] 
                      : ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: Partial<CreateStudentInput>) => ({ 
                        ...prev, 
                        tanggal_lahir: new Date(e.target.value) 
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-alamat">Alamat</Label>
                  <Input
                    id="edit-alamat"
                    value={editFormData.alamat || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: Partial<CreateStudentInput>) => ({ ...prev, alamat: e.target.value }))
                    }
                    placeholder="Alamat lengkap"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-hp">Nomor HP</Label>
                  <Input
                    id="edit-hp"
                    value={editFormData.hp || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: Partial<CreateStudentInput>) => ({ ...prev, hp: e.target.value }))
                    }
                    placeholder="08xxxxxxxxxx"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-foto">URL Foto</Label>
                  <Input
                    id="edit-foto"
                    value={editFormData.foto || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: Partial<CreateStudentInput>) => ({ 
                        ...prev, 
                        foto: e.target.value || null 
                      }))
                    }
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <Separator className="mb-4" />
          <p>© 2024 Sistem Manajemen Siswa. Dibuat dengan ❤️ untuk pendidikan.</p>
        </div>
      </div>
    </div>
  );
}

export default App;