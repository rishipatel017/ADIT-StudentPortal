import api from './api';

export interface Student {
  id: number;
  enrollmentNo: string;
  name: string;
  email: string;
  departmentId: number;
  divisionId: number;
  semesterId: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  user?: {
    id: number;
    email: string;
    role: string;
    lastLogin?: string;
  };
  department?: {
    id: number;
    name: string;
    code: string;
  };
  division?: {
    id: number;
    name: string;
  };
  semester?: {
    id: number;
    number: number;
  };
  _count?: {
    submissions: number;
    attendanceRecords: number;
    marks: number;
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
  departmentId: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  user?: {
    id: number;
    email: string;
    role: string;
    lastLogin?: string;
  };
  department?: {
    id: number;
    name: string;
    code: string;
  };
  _count?: {
    subjects: number;
    assignments: number;
    marksUploads: number;
    attendanceSessions: number;
  };
}

export const studentService = {
  async getAllStudents(includeDeleted: boolean = false): Promise<Student[]> {
    const response = await api.get(`/student?includeDeleted=${includeDeleted}`);
    return response.data;
  },

  async getStudentById(id: number): Promise<Student> {
    const response = await api.get(`/student/${id}`);
    return response.data;
  },

  async createStudent(data: {
    enrollmentNo: string;
    name: string;
    email: string;
    departmentId: number;
    divisionId: number;
    semesterId: number;
    userId: number;
  }): Promise<Student> {
    const response = await api.post('/student', data);
    return response.data;
  },

  async updateStudent(id: number, data: Partial<Student>): Promise<Student> {
    const response = await api.put(`/student/${id}`, data);
    return response.data;
  },

  async softDeleteStudent(id: number): Promise<Student> {
    const response = await api.delete(`/student/${id}/soft`);
    return response.data;
  },

  async restoreStudent(id: number): Promise<Student> {
    const response = await api.post(`/student/${id}/restore`);
    return response.data;
  },

  async deleteStudent(id: number): Promise<Student> {
    const response = await api.delete(`/student/${id}`);
    return response.data;
  },

  async getStudentByEnrollmentNo(enrollmentNo: string): Promise<Student> {
    const response = await api.get(`/student/enrollment/${enrollmentNo}`);
    return response.data;
  },

  async getStudentsByDepartment(departmentId: number): Promise<Student[]> {
    const response = await api.get(`/student/department/${departmentId}`);
    return response.data;
  },

  async getStudentsByDivision(divisionId: number): Promise<Student[]> {
    const response = await api.get(`/student/division/${divisionId}`);
    return response.data;
  },

  async getStudentsBySemester(semesterId: number): Promise<Student[]> {
    const response = await api.get(`/student/semester/${semesterId}`);
    return response.data;
  },

  async getStudentStats(id: number) {
    const response = await api.get(`/student/${id}/stats`);
    return response.data;
  },

  async getStudentsWithPerformanceData(divisionId?: number, semesterId?: number): Promise<Student[]> {
    const params = new URLSearchParams();
    if (divisionId) params.append('divisionId', divisionId.toString());
    if (semesterId) params.append('semesterId', semesterId.toString());
    
    const response = await api.get(`/student/performance?${params}`);
    return response.data;
  }
};

export const facultyService = {
  async getAllFaculty(includeDeleted: boolean = false): Promise<Faculty[]> {
    const response = await api.get(`/faculty?includeDeleted=${includeDeleted}`);
    return response.data;
  },

  async getFacultyById(id: number): Promise<Faculty> {
    const response = await api.get(`/faculty/${id}`);
    return response.data;
  },

  async createFaculty(data: {
    name: string;
    email: string;
    designation: string;
    qualification: string;
    phone?: string;
    joiningDate: string;
    pastExperienceYears?: number;
    departmentId: number;
    userId: number;
  }): Promise<Faculty> {
    const response = await api.post('/faculty', data);
    return response.data;
  },

  async updateFaculty(id: number, data: Partial<Faculty>): Promise<Faculty> {
    const response = await api.put(`/faculty/${id}`, data);
    return response.data;
  },

  async softDeleteFaculty(id: number): Promise<Faculty> {
    const response = await api.delete(`/faculty/${id}/soft`);
    return response.data;
  },

  async restoreFaculty(id: number): Promise<Faculty> {
    const response = await api.post(`/faculty/${id}/restore`);
    return response.data;
  },

  async deleteFaculty(id: number): Promise<Faculty> {
    const response = await api.delete(`/faculty/${id}`);
    return response.data;
  },

  async getFacultyByDepartment(departmentId: number): Promise<Faculty[]> {
    const response = await api.get(`/faculty/department/${departmentId}`);
    return response.data;
  },

  async getFacultyByEmail(email: string): Promise<Faculty> {
    const response = await api.get(`/faculty/email/${email}`);
    return response.data;
  },

  async getFacultyStats(id: number) {
    const response = await api.get(`/faculty/${id}/stats`);
    return response.data;
  },

  async getFacultyWithWorkload(id: number): Promise<Faculty> {
    const response = await api.get(`/faculty/${id}/workload`);
    return response.data;
  },

  async getFacultyByDesignation(designation: string): Promise<Faculty[]> {
    const response = await api.get(`/faculty/designation/${designation}`);
    return response.data;
  }
};
