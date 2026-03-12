import api from './api';

export interface Department {
  id: number;
  name: string;
  code: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    semesters: number;
    faculty: number;
    students: number;
    notices: number;
  };
}

export interface Semester {
  id: number;
  number: number;
  departmentId: number;
  createdAt: string;
  updatedAt: string;
  department?: {
    id: number;
    name: string;
    code: string;
  };
  _count?: {
    subjects: number;
    divisions: number;
    students: number;
    assignments: number;
    notices: number;
  };
}

export interface Subject {
  id: number;
  name: string;
  code: string;
  type: 'CORE' | 'OPEN_ELECTIVE' | 'PROFESSIONAL_ELECTIVE' | 'MANDATORY';
  credits: number;
  semesterId: number;
  createdAt: string;
  updatedAt: string;
  semester?: {
    id: number;
    number: number;
    department?: {
      id: number;
      name: string;
      code: string;
    };
  };
  _count?: {
    assignments: number;
    attendanceSessions: number;
    marksUploads: number;
    facultySubjects: number;
  };
}

export interface Division {
  id: number;
  name: string;
  semesterId: number;
  createdAt: string;
  updatedAt: string;
  semester?: {
    id: number;
    number: number;
    department?: {
      id: number;
      name: string;
      code: string;
    };
  };
  _count?: {
    students: number;
    attendanceSessions: number;
    assignmentDivisions: number;
    marksUploads: number;
    notices: number;
  };
}

export const departmentService = {
  async getAllDepartments(): Promise<Department[]> {
    const response = await api.get('/departments');
    return response.data;
  },

  async getDepartmentById(id: number): Promise<Department> {
    const response = await api.get(`/departments/${id}`);
    return response.data;
  },

  async createDepartment(data: { name: string; code: string }): Promise<Department> {
    const response = await api.post('/departments', data);
    return response.data;
  },

  async updateDepartment(id: number, data: Partial<Department>): Promise<Department> {
    const response = await api.put(`/departments/${id}`, data);
    return response.data;
  },

  async deleteDepartment(id: number): Promise<Department> {
    const response = await api.delete(`/departments/${id}`);
    return response.data;
  },

  async getDepartmentByCode(code: string): Promise<Department> {
    const response = await api.get(`/departments/code/${code}`);
    return response.data;
  },

  async getDepartmentStats(id: number) {
    const response = await api.get(`/departments/${id}/stats`);
    return response.data;
  },

  async getDepartmentWithDetails(id: number): Promise<Department> {
    const response = await api.get(`/departments/${id}/details`);
    return response.data;
  }
};

export const semesterService = {
  async getAllSemesters(): Promise<Semester[]> {
    const response = await api.get('/semesters');
    return response.data;
  },

  async getSemesterById(id: number): Promise<Semester> {
    const response = await api.get(`/semesters/${id}`);
    return response.data;
  },

  async createSemester(data: { number: number; departmentId: number }): Promise<Semester> {
    const response = await api.post('/semesters', data);
    return response.data;
  },

  async updateSemester(id: number, data: Partial<Semester>): Promise<Semester> {
    const response = await api.put(`/semesters/${id}`, data);
    return response.data;
  },

  async deleteSemester(id: number): Promise<Semester> {
    const response = await api.delete(`/semesters/${id}`);
    return response.data;
  },

  async getSemestersByDepartment(departmentId: number): Promise<Semester[]> {
    const response = await api.get(`/semesters/department/${departmentId}`);
    return response.data;
  },

  async getSemesterByNumberAndDepartment(number: number, departmentId: number): Promise<Semester> {
    const response = await api.get(`/semesters/number/${number}/department/${departmentId}`);
    return response.data;
  },

  async getSemesterStats(id: number) {
    const response = await api.get(`/semesters/${id}/stats`);
    return response.data;
  },

  async getSemestersWithActiveData(): Promise<Semester[]> {
    const response = await api.get('/semesters/active');
    return response.data;
  }
};

export const subjectService = {
  async getAllSubjects(): Promise<Subject[]> {
    const response = await api.get('/subjects');
    return response.data;
  },

  async getSubjectById(id: number): Promise<Subject> {
    const response = await api.get(`/subjects/${id}`);
    return response.data;
  },

  async createSubject(data: {
    name: string;
    code: string;
    type: 'CORE' | 'OPEN_ELECTIVE' | 'PROFESSIONAL_ELECTIVE' | 'MANDATORY';
    credits?: number;
    semesterId: number;
  }): Promise<Subject> {
    const response = await api.post('/subjects', data);
    return response.data;
  },

  async updateSubject(id: number, data: Partial<Subject>): Promise<Subject> {
    const response = await api.put(`/subjects/${id}`, data);
    return response.data;
  },

  async deleteSubject(id: number): Promise<Subject> {
    const response = await api.delete(`/subjects/${id}`);
    return response.data;
  },

  async getSubjectsBySemester(semesterId: number): Promise<Subject[]> {
    const response = await api.get(`/subjects/semester/${semesterId}`);
    return response.data;
  },

  async getSubjectByCodeAndSemester(code: string, semesterId: number): Promise<Subject> {
    const response = await api.get(`/subjects/code/${code}/semester/${semesterId}`);
    return response.data;
  },

  async getSubjectStats(id: number) {
    const response = await api.get(`/subjects/${id}/stats`);
    return response.data;
  },

  async getSubjectsByType(type: string): Promise<Subject[]> {
    const response = await api.get(`/subjects/type/${type}`);
    return response.data;
  }
};

export const divisionService = {
  async getAllDivisions(): Promise<Division[]> {
    const response = await api.get('/divisions');
    return response.data;
  },

  async getDivisionById(id: number): Promise<Division> {
    const response = await api.get(`/divisions/${id}`);
    return response.data;
  },

  async createDivision(data: { name: string; semesterId: number }): Promise<Division> {
    const response = await api.post('/divisions', data);
    return response.data;
  },

  async updateDivision(id: number, data: Partial<Division>): Promise<Division> {
    const response = await api.put(`/divisions/${id}`, data);
    return response.data;
  },

  async deleteDivision(id: number): Promise<Division> {
    const response = await api.delete(`/divisions/${id}`);
    return response.data;
  },

  async getDivisionsBySemester(semesterId: number): Promise<Division[]> {
    const response = await api.get(`/divisions/semester/${semesterId}`);
    return response.data;
  }
};
