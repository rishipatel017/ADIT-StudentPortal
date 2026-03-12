import { useState, useEffect, useCallback } from 'react';
import { academicService, Semester, Division, Subject, Student, FacultySubjectsBySemester } from '../services/academicService';

interface UseAcademicDataOptions {
  immediate?: boolean;
}

export function useSemesters(options: UseAcademicDataOptions = {}) {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSemesters = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await academicService.getSemesters();
      setSemesters(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch semesters');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (options.immediate !== false) {
      fetchSemesters();
    }
  }, [fetchSemesters, options.immediate]);

  return {
    semesters,
    loading,
    error,
    refetch: fetchSemesters,
    options: academicService.createSemesterOptions(semesters),
  };
}

export function useDivisions(semesterId?: number, options: UseAcademicDataOptions = {}) {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDivisions = useCallback(async () => {
    if (!semesterId) {
      setDivisions([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await academicService.getDivisions(semesterId);
      setDivisions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch divisions');
    } finally {
      setLoading(false);
    }
  }, [semesterId]);

  useEffect(() => {
    if (options.immediate !== false) {
      fetchDivisions();
    }
  }, [fetchDivisions, options.immediate]);

  return {
    divisions,
    loading,
    error,
    refetch: fetchDivisions,
    options: academicService.createDivisionOptions(divisions),
  };
}

export function useSubjects(semesterId?: number, options: UseAcademicDataOptions = {}) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubjects = useCallback(async () => {
    if (!semesterId) {
      setSubjects([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await academicService.getSubjects(semesterId);
      setSubjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch subjects');
    } finally {
      setLoading(false);
    }
  }, [semesterId]);

  useEffect(() => {
    if (options.immediate !== false) {
      fetchSubjects();
    }
  }, [fetchSubjects, options.immediate]);

  return {
    subjects,
    loading,
    error,
    refetch: fetchSubjects,
    options: academicService.createSubjectOptions(subjects),
  };
}

export function useStudents(semesterId?: number, divisionId?: number, options: UseAcademicDataOptions = {}) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = useCallback(async () => {
    if (!semesterId || !divisionId) {
      setStudents([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await academicService.getStudents(semesterId, divisionId);
      setStudents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  }, [semesterId, divisionId]);

  useEffect(() => {
    if (options.immediate !== false) {
      fetchStudents();
    }
  }, [fetchStudents, options.immediate]);

  return {
    students,
    loading,
    error,
    refetch: fetchStudents,
  };
}

export function useFacultySubjects(options: UseAcademicDataOptions = {}) {
  const [facultySubjects, setFacultySubjects] = useState<FacultySubjectsBySemester[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFacultySubjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await academicService.getFacultySubjects();
      setFacultySubjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch faculty subjects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (options.immediate !== false) {
      fetchFacultySubjects();
    }
  }, [fetchFacultySubjects, options.immediate]);

  return {
    facultySubjects,
    loading,
    error,
    refetch: fetchFacultySubjects,
  };
}

// Combined hook for cascading dropdowns
export function useAcademicDropdowns() {
  const { semesters, loading: semestersLoading, options: semesterOptions } = useSemesters();
  const [selectedSemester, setSelectedSemester] = useState<number | undefined>();
  const [selectedDivision, setSelectedDivision] = useState<number | undefined>();
  const [selectedSubject, setSelectedSubject] = useState<number | undefined>();

  const { divisions, loading: divisionsLoading, options: divisionOptions } = useDivisions(selectedSemester);
  const { subjects, loading: subjectsLoading, options: subjectOptions } = useSubjects(selectedSemester);
  const { students, loading: studentsLoading } = useStudents(selectedSemester, selectedDivision);

  const resetSelections = useCallback(() => {
    setSelectedDivision(undefined);
    setSelectedSubject(undefined);
  }, []);

  const handleSemesterChange = useCallback((semesterId: number) => {
    setSelectedSemester(semesterId);
    resetSelections();
  }, [resetSelections]);

  const handleDivisionChange = useCallback((divisionId: number) => {
    setSelectedDivision(divisionId);
    setSelectedSubject(undefined);
  }, []);

  const handleSubjectChange = useCallback((subjectId: number) => {
    setSelectedSubject(subjectId);
  }, []);

  return {
    // Data
    semesters,
    divisions,
    subjects,
    students,
    
    // Selections
    selectedSemester,
    selectedDivision,
    selectedSubject,
    
    // Options for dropdowns
    semesterOptions,
    divisionOptions,
    subjectOptions,
    
    // Loading states
    loading: semestersLoading || divisionsLoading || subjectsLoading || studentsLoading,
    
    // Actions
    setSelectedSemester: handleSemesterChange,
    setSelectedDivision: handleDivisionChange,
    setSelectedSubject: handleSubjectChange,
    resetSelections,
  };
}
