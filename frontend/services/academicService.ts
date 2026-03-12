const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Semester {
  id: number;
  number: number;
  _count: {
    students: number;
    subjects: number;
    divisions: number;
  };
}

export interface Division {
  id: number;
  name: string;
  semesterId: number;
  _count: {
    students: number;
  };
}

export interface Subject {
  id: number;
  name: string;
  code: string;
  type: string;
  credits: number;
  semesterId: number;
  _count: {
    assignments: number;
    facultySubjects: number;
  };
}

export interface Student {
  id: number;
  enrollmentNo: string;
  name: string;
  email: string;
  divisionId: number;
  semesterId: number;
  user: {
    email: string;
  };
  division: {
    name: string;
  };
  semester: {
    number: number;
  };
}

export interface Faculty {
  id: number;
  name: string;
  email: string;
  designation: string;
  qualification: string;
  phone?: string;
  joiningDate: string;
  pastExperienceYears: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface FacultySubject {
  subject: Subject;
  division: Division;
}

export interface FacultySubjectsBySemester {
  semester: Semester;
  subjects: FacultySubject[];
}

export interface DashboardStats {
  totalStudents?: number;
  totalFaculty?: number;
  totalSubjects?: number;
  totalDivisions?: number;
  activeAssignments?: number;
  pendingNotices?: number;
  submittedAssignments?: number;
  attendancePercentage?: number;
  totalMarks?: number;
}

class AcademicService {
  private getCookieValue(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(
      new RegExp(`(?:^|; )${name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}=([^;]*)`)
    );
    return match ? decodeURIComponent(match[1]) : null;
  }

  private getAuthHeaders() {
    const token =
      (typeof localStorage !== 'undefined' ? localStorage.getItem('authToken') || localStorage.getItem('token') : null) ||
      this.getCookieValue('authToken');

    return {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json',
    };
  }

  async getSemesters(): Promise<Semester[]> {
    const response = await fetch(`${API_BASE_URL}/academic/semesters`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch semesters');
    }

    return response.json();
  }

  async getDivisions(semesterId: number): Promise<Division[]> {
    const response = await fetch(`${API_BASE_URL}/academic/divisions?semesterId=${semesterId}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch divisions');
    }

    return response.json();
  }

  async getSubjects(semesterId: number): Promise<Subject[]> {
    const response = await fetch(`${API_BASE_URL}/academic/subjects?semesterId=${semesterId}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch subjects');
    }

    return response.json();
  }

  async getFacultySubjects(): Promise<FacultySubjectsBySemester[]> {
    const response = await fetch(`${API_BASE_URL}/admin/faculty-subjects`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch faculty subjects');
    }

    return response.json();
  }

  async getStudents(semesterId: number, divisionId: number): Promise<Student[]> {
    const response = await fetch(`${API_BASE_URL}/admin/students`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch students');
    }

    const allStudents = await response.json();
    // Filter by semester and division if provided
    let filteredStudents = allStudents;
    if (semesterId) {
      filteredStudents = filteredStudents.filter((student: any) => student.semesterId === semesterId);
    }
    if (divisionId) {
      filteredStudents = filteredStudents.filter((student: any) => student.divisionId === divisionId);
    }
    return filteredStudents;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const response = await fetch(`${API_BASE_URL}/academic/dashboard/stats`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch dashboard stats');
    }

    return response.json();
  }

  async getAllStudents(): Promise<Student[]> {
    const response = await fetch(`${API_BASE_URL}/admin/students`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch students');
    }

    return response.json();
  }

  async getAllFaculty(): Promise<Faculty[]> {
    const response = await fetch(`${API_BASE_URL}/admin/faculty`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch faculty');
    }

    return response.json();
  }

  async getAllSubjects(): Promise<Subject[]> {
    const response = await fetch(`${API_BASE_URL}/admin/subjects`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch subjects');
    }

    return response.json();
  }

  async getAllDivisions(): Promise<Division[]> {
    const response = await fetch(`${API_BASE_URL}/admin/divisions`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch divisions');
    }

    return response.json();
  }

  async getFacultyAssignments(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/faculty/assignments`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch faculty assignments');
    }

    return response.json();
  }

  async getFacultyNotices(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/faculty/notices`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch faculty notices');
    }

    return response.json();
  }

  async getStudentAssignments(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/student/assignments`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch student assignments');
    }

    return response.json();
  }

  async getStudentNotices(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/student/notices`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch student notices');
    }

    return response.json();
  }

  async getStudentAttendance(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/student/attendance`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch student attendance');
    }

    return response.json();
  }

  async getStudentMarks(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/student/marks`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch student marks');
    }

    return response.json();
  }

  async searchAcademicData(
    type: 'students' | 'subjects' | 'faculty',
    query: string,
    semesterId?: number
  ): Promise<any[]> {
    const url = new URL(`${API_BASE_URL}/admin/search`);
    url.searchParams.append('type', type);
    url.searchParams.append('query', query);
    if (semesterId) {
      url.searchParams.append('semesterId', semesterId.toString());
    }

    const response = await fetch(url.toString(), {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to search data');
    }

    return response.json();
  }

  // Profile Management APIs
  async getAdminProfile() {
    const response = await fetch(`${API_BASE_URL}/admin/profile`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch admin profile');
    }

    return response.json();
  }

  async getFacultyProfile() {
    const response = await fetch(`${API_BASE_URL}/faculty/profile`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch faculty profile');
    }

    return response.json();
  }

  async getStudentProfile() {
    const response = await fetch(`${API_BASE_URL}/student/profile`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch student profile');
    }

    return response.json();
  }

  async updateAdminProfile(data: any) {
    const response = await fetch(`${API_BASE_URL}/admin/profile`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update admin profile');
    }

    return response.json();
  }

  async updateFacultyProfile(data: any) {
    const response = await fetch(`${API_BASE_URL}/faculty/profile`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update faculty profile');
    }

    return response.json();
  }

  async updateStudentProfile(data: any) {
    const response = await fetch(`${API_BASE_URL}/student/profile`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update student profile');
    }

    return response.json();
  }

  async changePassword(data: { currentPassword: string; newPassword: string }) {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to change password');
    }

    return response.json();
  }

  // Admin: Get any user profile for management
  async getUserProfile(userId: number, role: string) {
    const endpoint = role === 'ADMIN' ? 'admin' : role.toLowerCase();
    const response = await fetch(`${API_BASE_URL}/${endpoint}/profile/${userId}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }

    return response.json();
  }

  // Admin: Update any user password
  async updateUserPassword(userId: number, role: string, newPassword: string) {
    const endpoint = role === 'ADMIN' ? 'admin' : role.toLowerCase();
    const response = await fetch(`${API_BASE_URL}/${endpoint}/change-password/${userId}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ newPassword }),
    });

    if (!response.ok) {
      throw new Error('Failed to update user password');
    }

    return response.json();
  }

  // Helper method to create select options
  createSelectOptions<T extends { id: number; name: string; code?: string }>(
    items: T[],
    valueField: 'id' = 'id',
    labelField: 'name' = 'name'
  ) {
    return items.map((item) => ({
      value: item[valueField],
      label: item[labelField] + (item.code ? ` (${item.code})` : ''),
    }));
  }

  // Helper method to create semester options
  createSemesterOptions(semesters: Semester[]) {
    return semesters.map((semester) => ({
      value: semester.id,
      label: `Semester ${semester.number}`,
    }));
  }

  // Helper method to create division options
  createDivisionOptions(divisions: Division[]) {
    return divisions.map((division) => ({
      value: division.id,
      label: `${division.name} (${division?._count?.students ?? 0} students)`,
    }));
  }

  // Helper method to create subject options
  createSubjectOptions(subjects: Subject[]) {
    return subjects.map((subject) => ({
      value: subject.id,
      label: `${subject.name} (${subject.code})`,
    }));
  }
}

export const academicService = new AcademicService();
