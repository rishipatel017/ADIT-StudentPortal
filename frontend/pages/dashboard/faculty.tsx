import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ModernLayout from '../../components/Layout/ModernLayout';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Card, DataTable, StatCard, Input, Select, Modal } from '../../components/UI';
import { useSemesters, useDivisions, useSubjects } from '../../hooks/useAcademicData';
import { academicService, DashboardStats, Student } from '../../services/academicService';
import { AuthGuard } from '../../components/Auth/AuthGuard';
import api from '../../services/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const getAttachmentUrl = (attachment: any): string | null => {
  if (!attachment || typeof attachment !== 'string') return null;
  if (/^https?:\/\//i.test(attachment)) return attachment;
  const path = attachment.startsWith('/') ? attachment : `/${attachment}`;
  return `${API_BASE_URL}${path}`;
};

interface Assignment {
  id: number;
  title: string;
  subject: string;
  division: string;
  dueDate: string;
  submissions: number;
  totalStudents: number;
  attachment?: string | null;
}

interface Notice {
  id: number;
  title: string;
  content?: string;
  semester?: number | null;
  divisionId?: number | null;
  isForFaculty?: boolean;
  isForStudents?: boolean;
  attachment?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface MarksUploadRow {
  id: number;
  semester: number;
  subjectId: number;
  divisionId: number;
  createdAt?: string;
  updatedAt?: string;
  _count?: { marks?: number };
  subject?: { id: number; name: string; code?: string };
  division?: { id: number; name: string };
}

interface FacultySubjectItem {
  subject: { id: number; name: string; code?: string; semesterId?: number; semester?: { id: number; number: number } };
  division: { id: number; name: string; semesterId?: number };
}

interface FacultySubjectsBySemester {
  semester: { id: number; number: number };
  subjects: FacultySubjectItem[];
}

const safeDate = (value: any): string => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString();
};

const ModernFacultyDashboard: React.FC = () => {
  return (
    <AuthGuard allowedRoles={['FACULTY']}>
      <FacultyDashboardContent />
    </AuthGuard>
  );
};

const FacultyDashboardContent: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalSubjects: 0,
    activeAssignments: 0,
    pendingNotices: 0,
  });
  
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [facultySubjects, setFacultySubjects] = useState<FacultySubjectsBySemester[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedNotice, setSelectedNotice] = useState<any | null>(null);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [facultyProfile, setFacultyProfile] = useState<any>(null);
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    designation: '',
    qualification: '',
    joiningDate: '',
    pastExperienceYears: '',
  });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const [marksFile, setMarksFile] = useState<File | null>(null);
  const [marksUploads, setMarksUploads] = useState<MarksUploadRow[]>([]);
  const [marksLoading, setMarksLoading] = useState(false);
  const [marksError, setMarksError] = useState<string | null>(null);

  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState<string | null>(null);

  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [attendanceHistoryLoading, setAttendanceHistoryLoading] = useState(false);
  const [attendanceHistoryError, setAttendanceHistoryError] = useState<string | null>(null);

  // Academic data hooks
  const { semesters, options: semesterOptions } = useSemesters();
  const [selectedSemester, setSelectedSemester] = useState<number | undefined>();
  const { divisions, options: divisionOptions } = useDivisions(selectedSemester);
  const [selectedDivision, setSelectedDivision] = useState<number | undefined>();
  const { subjects, options: subjectOptions } = useSubjects(selectedSemester);
  const [selectedSubject, setSelectedSubject] = useState<number | undefined>();

  // Attendance form states
  const [topicCovered, setTopicCovered] = useState('');
  const [lectureNumber, setLectureNumber] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState<Record<number, boolean>>({});

  // Assignment form states
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null);
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    subjectId: '',
    divisionId: '',
    dueDate: ''
  });

  // Notice form states
  const [showNoticeForm, setShowNoticeForm] = useState(false);
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    content: '',
    isForStudents: true,
    isForFaculty: false,
    semester: '' as any,
    divisionId: '' as any,
  });
  const [noticeFile, setNoticeFile] = useState<File | null>(null);

  const displayName =
    facultyProfile?.name ||
    user?.faculty?.name ||
    user?.admin?.name ||
    user?.student?.name ||
    user?.email ||
    'Faculty';

  const assignedClassesCount = facultySubjects.reduce((total, group) => {
    const count = Array.isArray(group?.subjects) ? group.subjects.length : 0;
    return total + count;
  }, 0);

  useEffect(() => {
    fetchFacultyData();
  }, [user]);

  useEffect(() => {
    const tab = typeof router.query.tab === 'string' ? router.query.tab : undefined;
    if (!tab) {
      setActiveTab('overview');
      return;
    }
    const allowed = ['overview', 'profile', 'subjects', 'attendance', 'students', 'assignments', 'marks', 'notices', 'reports'];
    setActiveTab(allowed.includes(tab) ? tab : 'overview');
  }, [router.query.tab]);

  const fetchFacultyData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const statsData = await academicService.getDashboardStats();
      setStats(statsData);

      const facultySubjectsData = await api.get('/academic/faculty-subjects').then(r => r.data).catch(() => []);
      setFacultySubjects(Array.isArray(facultySubjectsData) ? facultySubjectsData : []);

      const profile = await api.get('/faculty/profile').then(r => r.data).catch(() => null);
      setFacultyProfile(profile);
      setProfileForm({
        name: profile?.name || '',
        email: profile?.email || profile?.user?.email || '',
        phone: profile?.phone || '',
        designation: profile?.designation || '',
        qualification: profile?.qualification || '',
        joiningDate: profile?.joiningDate ? new Date(profile.joiningDate).toISOString().slice(0, 10) : '',
        pastExperienceYears: typeof profile?.pastExperienceYears === 'number' ? String(profile.pastExperienceYears) : '',
      });

      // Fetch real assignments and notices for faculty
      const [assignmentsData, noticesData] = await Promise.all([
        academicService.getFacultyAssignments().catch(() => []),
        academicService.getFacultyNotices().catch(() => [])
      ]);

      setAssignments(assignmentsData || []);
      setNotices(noticesData || []);

    } catch (error) {
      console.error('Faculty dashboard data fetch error:', error);
      setError('Failed to load faculty data. Please try again.');
      // Set empty data to prevent crashes
      setAssignments([]);
      setNotices([]);
      setFacultyProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const resetSelections = () => {
    setSelectedSemester(undefined);
    setSelectedDivision(undefined);
    setSelectedSubject(undefined);
  };

  const fetchStudentsForAttendance = async () => {
    if (!selectedSemester || !selectedSubject || !selectedDivision) {
      setStudents([]);
      return;
    }

    try {
      const res = await api.get('/attendance/students', {
        params: {
          semester: selectedSemester,
          subjectId: selectedSubject,
          divisionId: selectedDivision,
        },
      });
      setStudents(Array.isArray(res.data) ? res.data : []);
    } catch (e: any) {
      console.error('Failed to load students for attendance:', e);
      setStudents([]);
      setError(e?.response?.data?.message || e?.message || 'Failed to load students');
    }
  };

  const fetchStudentsList = async () => {
    if (!selectedSemester || !selectedSubject || !selectedDivision) {
      setStudents([]);
      return;
    }

    try {
      setStudentsLoading(true);
      setStudentsError(null);
      const res = await api.get('/attendance/students', {
        params: {
          semester: selectedSemester,
          subjectId: selectedSubject,
          divisionId: selectedDivision,
        },
      });
      setStudents(Array.isArray(res.data) ? res.data : []);
    } catch (e: any) {
      console.error('Failed to load students list:', e);
      setStudents([]);
      setStudentsError(e?.response?.data?.message || e?.message || 'Failed to load students');
    } finally {
      setStudentsLoading(false);
    }
  };

  const fetchAttendanceHistory = async () => {
    if (!selectedSemester || !selectedSubject || !selectedDivision) {
      setAttendanceHistory([]);
      return;
    }
    try {
      setAttendanceHistoryLoading(true);
      setAttendanceHistoryError(null);
      const res = await api.get('/attendance/history', {
        params: {
          semester: selectedSemester,
          subjectId: selectedSubject,
          divisionId: selectedDivision,
        },
      });
      setAttendanceHistory(Array.isArray(res.data) ? res.data : []);
    } catch (e: any) {
      console.error('Failed to load attendance history:', e);
      setAttendanceHistory([]);
      setAttendanceHistoryError(e?.response?.data?.message || e?.message || 'Failed to load history');
    } finally {
      setAttendanceHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'attendance') return;
    fetchStudentsForAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedSemester, selectedSubject, selectedDivision]);

  const handleAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const attendanceData = {
        semesterId: selectedSemester,
        subjectId: selectedSubject,
        divisionId: selectedDivision,
        topicCovered,
        lectureNumber: parseInt(lectureNumber),
        attendance: Object.entries(attendanceRecords).map(([studentId, isPresent]) => ({
          studentId: parseInt(studentId),
          status: isPresent
        }))
      };

      await api.post('/attendance/create', attendanceData);
      
      // Reset form
      resetSelections();
      setTopicCovered('');
      setLectureNumber('');
      setAttendanceRecords({});
      setStudents([]);
      
      alert('Attendance submitted successfully!');
    } catch (error) {
      console.error('Error submitting attendance:', error);
      alert('Failed to submit attendance');
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        name: profileForm.name || undefined,
        email: profileForm.email || undefined,
        phone: profileForm.phone || undefined,
        designation: profileForm.designation || undefined,
        qualification: profileForm.qualification || undefined,
        pastExperienceYears: profileForm.pastExperienceYears ? Number(profileForm.pastExperienceYears) : undefined,
      };

      if (profileForm.joiningDate) {
        const d = new Date(profileForm.joiningDate);
        if (!Number.isNaN(d.getTime())) {
          payload.joiningDate = d.toISOString();
        }
      }

      const updated = await api.put('/faculty/profile', payload).then(r => r.data);
      setFacultyProfile(updated);
      alert('Profile updated successfully');
    } catch (e: any) {
      console.error('Failed to update profile:', e);
      alert(e?.response?.data?.message || e?.message || 'Failed to update profile');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        alert('New password and confirm password do not match');
        return;
      }
      await api.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      alert('Password updated successfully');
    } catch (e: any) {
      console.error('Failed to change password:', e);
      alert(e?.response?.data?.message || e?.message || 'Failed to change password');
    }
  };

  const fetchMarksUploads = async () => {
    if (!selectedSemester || !selectedSubject || !selectedDivision) {
      setMarksUploads([]);
      return;
    }
    try {
      setMarksLoading(true);
      setMarksError(null);
      const res = await api.get('/marks/faculty', {
        params: {
          semester: selectedSemester,
          subjectId: selectedSubject,
          divisionId: selectedDivision,
        },
      });
      setMarksUploads(Array.isArray(res.data) ? res.data : []);
    } catch (e: any) {
      console.error('Failed to load marks uploads:', e);
      setMarksUploads([]);
      setMarksError(e?.response?.data?.message || e?.message || 'Failed to load marks');
    } finally {
      setMarksLoading(false);
    }
  };

  const handleMarksUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!selectedSemester || !selectedSubject || !selectedDivision) {
        alert('Please select semester, subject and division');
        return;
      }
      if (!marksFile) {
        alert('Please choose a CSV file');
        return;
      }
      const form = new FormData();
      form.append('file', marksFile);
      await api.post('/marks/upload', form, {
        params: {
          semester: selectedSemester,
          subjectId: selectedSubject,
          divisionId: selectedDivision,
        },
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMarksFile(null);
      await fetchMarksUploads();
      alert('Marks uploaded successfully');
    } catch (e: any) {
      console.error('Failed to upload marks:', e);
      alert(e?.response?.data?.message || e?.message || 'Failed to upload marks');
    }
  };

  const downloadMarksTemplate = async () => {
    try {
      if (!selectedDivision) {
        alert('Please select division');
        return;
      }
      const res = await api.get('/marks/template', {
        params: { divisionId: selectedDivision },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'marks_template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error('Failed to download template:', e);
      alert(e?.response?.data?.message || e?.message || 'Failed to download template');
    }
  };

  const exportAttendanceCSV = async () => {
    try {
      if (!selectedSemester || !selectedSubject || !selectedDivision) {
        alert('Please select semester, subject and division');
        return;
      }
      const res = await api.get('/attendance/export/csv', {
        params: {
          semester: selectedSemester,
          subjectId: selectedSubject,
          divisionId: selectedDivision,
        },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'attendance_report.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error('Failed to export attendance:', e);
      alert(e?.response?.data?.message || e?.message || 'Failed to export attendance');
    }
  };

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const form = new FormData();
      form.append('title', noticeForm.title);
      form.append('content', noticeForm.content);
      if (noticeForm.semester) form.append('semester', String(noticeForm.semester));
      if (noticeForm.divisionId) form.append('divisionId', String(noticeForm.divisionId));
      form.append('isForStudents', String(noticeForm.isForStudents));
      form.append('isForFaculty', String(noticeForm.isForFaculty));
      if (noticeFile) form.append('file', noticeFile);
      await api.post('/notices', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      const refreshed = await academicService.getFacultyNotices().catch(() => []);
      setNotices(refreshed || []);
      setShowNoticeForm(false);
      setNoticeForm({ title: '', content: '', isForStudents: true, isForFaculty: false, semester: '' as any, divisionId: '' as any });
      setNoticeFile(null);
      alert('Notice created successfully');
    } catch (e: any) {
      console.error('Failed to create notice:', e);
      alert(e?.response?.data?.message || e?.message || 'Failed to create notice');
    }
  };

  const handleAssignmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!selectedSemester) {
        alert('Please select semester');
        return;
      }
      const subjectId = parseInt(assignmentForm.subjectId);
      const divisionId = parseInt(assignmentForm.divisionId);

      const form = new FormData();
      form.append('title', assignmentForm.title);
      form.append('description', assignmentForm.description);
      form.append('semester', String(selectedSemester));
      form.append('subjectId', String(subjectId));
      form.append('divisionIds', JSON.stringify([divisionId]));
      form.append('dueDate', assignmentForm.dueDate);
      if (assignmentFile) {
        form.append('file', assignmentFile);
      }

      await api.post('/assignments/create', form, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const refreshed = await academicService.getFacultyAssignments().catch(() => []);
      setAssignments(refreshed || []);
      
      setShowAssignmentForm(false);
      setAssignmentForm({
        title: '',
        description: '',
        subjectId: '',
        divisionId: '',
        dueDate: ''
      });
      setAssignmentFile(null);
      
      alert('Assignment created successfully!');
    } catch (error) {
      console.error('Error creating assignment:', error);
      alert('Failed to create assignment');
    }
  };

  const toggleAttendance = (studentId: number) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const markAllPresent = () => {
    const allPresent: Record<number, boolean> = {};
    students.forEach(student => {
      allPresent[student.id] = true;
    });
    setAttendanceRecords(allPresent);
  };

  const markAllAbsent = () => {
    const allAbsent: Record<number, boolean> = {};
    students.forEach(student => {
      allAbsent[student.id] = false;
    });
    setAttendanceRecords(allAbsent);
  };

  const assignmentColumns = [
    {
      key: 'title' as keyof Assignment,
      label: 'Title',
      sortable: true,
    },
    {
      key: 'subject' as keyof Assignment,
      label: 'Subject',
      sortable: true,
    },
    {
      key: 'division' as keyof Assignment,
      label: 'Division',
      sortable: true,
    },
    {
      key: 'dueDate' as keyof Assignment,
      label: 'Due Date',
      sortable: true,
      render: (value: string) => safeDate(value),
    },
    {
      key: 'submissions' as keyof Assignment,
      label: 'Submissions',
      render: (value: number, row: Assignment) => `${value}/${row.totalStudents}`,
    },
  ];

  const noticeColumns = [
    {
      key: 'title' as keyof Notice,
      label: 'Title',
      sortable: true,
    },
    {
      key: 'createdAt' as keyof Notice,
      label: 'Date',
      sortable: true,
      render: (value: any) => safeDate(value),
    },
    {
      key: 'isForStudents' as keyof Notice,
      label: 'Audience',
      render: (_: any, row: any) => {
        const isForStudents = !!row?.isForStudents;
        const isForFaculty = !!row?.isForFaculty;
        const label = isForStudents && isForFaculty ? 'Students + Faculty' : isForStudents ? 'Students' : isForFaculty ? 'Faculty' : '-';
        return <span className="badge badge-blue">{label}</span>;
      },
    },
    {
      key: 'actions' as any,
      label: 'Actions',
      render: (_: any, row: any) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setSelectedNotice(row);
            setIsNoticeModalOpen(true);
          }}
        >
          View Details
        </Button>
      ),
    },
  ];

  const studentColumns = [
    {
      key: 'enrollmentNo' as keyof Student,
      label: 'Enrollment No',
      sortable: true,
    },
    {
      key: 'name' as keyof Student,
      label: 'Name',
      sortable: true,
    },
    {
      key: 'email' as keyof Student,
      label: 'Email',
      sortable: true,
    },
    {
      key: 'attendance' as keyof Student,
      label: 'Attendance',
      render: (value: any, row: Student) => (
        <button
          onClick={() => toggleAttendance(row.id)}
          className={`btn-sm ${
            attendanceRecords[row.id]
              ? 'bg-green-100 text-green-800 hover:bg-green-200'
              : 'bg-red-100 text-red-800 hover:bg-red-200'
          }`}
        >
          {attendanceRecords[row.id] ? 'Present' : 'Absent'}
        </button>
      ),
    },
  ];

  if (loading) {
    return (
      <ModernLayout title="Faculty Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </ModernLayout>
    );
  }

  if (error) {
    return (
      <ModernLayout title="Faculty Dashboard">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">Error: {error}</div>
          <Button
            onClick={fetchFacultyData}
            className="mt-2"
            variant="danger"
          >
            Retry
          </Button>
        </div>
      </ModernLayout>
    );
  }

  return (
    <ModernLayout title="Faculty Dashboard">
      {/* Content Area */}
      <div>
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-page-title">My Profile</h1>
              <p className="text-body text-gray-600 mt-2">View and update your profile</p>
            </div>

            <Card>
              <Card.Header>
                <h3 className="text-section-title">Profile Summary</h3>
              </Card.Header>
              <Card.Body>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Name</div>
                    <div className="font-medium">{displayName || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Email</div>
                    <div className="font-medium">{facultyProfile?.email || user?.email || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Designation</div>
                    <div className="font-medium">{facultyProfile?.designation || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Qualification</div>
                    <div className="font-medium">{facultyProfile?.qualification || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Joining Date</div>
                    <div className="font-medium">{safeDate(facultyProfile?.joiningDate)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Past Experience</div>
                    <div className="font-medium">{typeof facultyProfile?.pastExperienceYears === 'number' ? `${facultyProfile.pastExperienceYears} years` : '-'}</div>
                  </div>
                </div>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                <h3 className="text-section-title">Update Phone</h3>
              </Card.Header>
              <Card.Body>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <Input
                    label="Name"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    placeholder="Enter your name"
                  />
                  <Input
                    label="Email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    placeholder="Enter your email"
                  />
                  <Input
                    label="Phone"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="Enter phone number"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Designation"
                      value={profileForm.designation}
                      onChange={(e) => setProfileForm({ ...profileForm, designation: e.target.value })}
                      placeholder="Enter designation"
                    />
                    <Input
                      label="Qualification"
                      value={profileForm.qualification}
                      onChange={(e) => setProfileForm({ ...profileForm, qualification: e.target.value })}
                      placeholder="Enter qualification"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Joining Date"
                      type="date"
                      value={profileForm.joiningDate}
                      onChange={(e) => setProfileForm({ ...profileForm, joiningDate: e.target.value })}
                    />
                    <Input
                      label="Past Experience (Years)"
                      type="number"
                      value={profileForm.pastExperienceYears}
                      onChange={(e) => setProfileForm({ ...profileForm, pastExperienceYears: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" variant="primary">Save</Button>
                  </div>
                </form>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                <h3 className="text-section-title">Change Password</h3>
              </Card.Header>
              <Card.Body>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <Input
                    label="Current Password"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    required
                  />
                  <Input
                    label="New Password"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    required
                  />
                  <Input
                    label="Confirm New Password"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    required
                  />
                  <div className="flex justify-end">
                    <Button type="submit" variant="primary">Update Password</Button>
                  </div>
                </form>
              </Card.Body>
            </Card>
          </div>
        )}

        {activeTab === 'subjects' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-page-title">My Subjects</h1>
              <p className="text-body text-gray-600 mt-2">Subjects and divisions assigned to you</p>
            </div>

            <Card>
              <Card.Header>
                <h3 className="text-section-title">Assigned Subjects</h3>
              </Card.Header>
              <Card.Body>
                {facultySubjects.length === 0 ? (
                  <p className="text-gray-500">No subjects assigned yet.</p>
                ) : (
                  <div className="space-y-4">
                    {facultySubjects.map((semesterGroup) => (
                      <div key={semesterGroup.semester.id} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Semester {semesterGroup.semester.number}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {semesterGroup.subjects.map((item, index) => (
                            <div key={index} className="text-sm text-gray-600">
                              {item.subject.code ? `${item.subject.code} - ` : ''}{item.subject.name} - Division {item.division.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-page-title">Welcome back, {displayName}! 👨‍🏫</h1>
              <p className="text-body text-gray-600 mt-2">Ready to inspire and educate today</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                title="Today's Classes"
                value={assignedClassesCount}
                subtitle="Scheduled Sessions"
                icon={<span className="text-3xl">📊</span>}
                variant="primary"
              />
              <StatCard
                title="Pending Tasks"
                value={stats.activeAssignments || 0}
                subtitle="Assignments to Grade"
                icon={<span className="text-3xl">📝</span>}
                variant="warning"
              />
              <StatCard
                title="Total Students"
                value={stats.totalStudents || 0}
                subtitle="Across All Classes"
                icon={<span className="text-3xl">👨‍🎓</span>}
                variant="success"
              />
            </div>

            {/* Faculty Subjects */}
            <Card>
              <Card.Header>
                <h3 className="text-section-title">Your Assigned Subjects</h3>
              </Card.Header>
              <Card.Body>
                {facultySubjects.length === 0 ? (
                  <p className="text-gray-500">No subjects assigned yet.</p>
                ) : (
                  <div className="space-y-4">
                    {facultySubjects.map((semesterGroup) => (
                      <div key={semesterGroup.semester.id} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">
                          Semester {semesterGroup.semester.number}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {semesterGroup.subjects.map((item, index) => (
                            <div key={index} className="text-sm text-gray-600">
                              {item.subject.name} - {item.division.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-page-title">Take Attendance</h1>
              <p className="text-body text-gray-600 mt-2">Mark student attendance for your classes</p>
            </div>
            
            <form onSubmit={handleAttendanceSubmit} className="space-y-6">
              <Card>
                <Card.Header>
                  <h3 className="text-section-title">Class Information</h3>
                </Card.Header>
                <Card.Body>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Semester"
                      value={selectedSemester || ''}
                      onChange={(e) => setSelectedSemester(Number(e.target.value))}
                      options={semesterOptions}
                      placeholder="Select Semester"
                      required
                    />
                    
                    <Select
                      label="Subject"
                      value={selectedSubject || ''}
                      onChange={(e) => setSelectedSubject(Number(e.target.value))}
                      options={subjectOptions}
                      placeholder="Select Subject"
                      required
                      disabled={!selectedSemester}
                    />
                    
                    <Select
                      label="Division"
                      value={selectedDivision || ''}
                      onChange={(e) => setSelectedDivision(Number(e.target.value))}
                      options={divisionOptions}
                      placeholder="Select Division"
                      required
                      disabled={!selectedSemester}
                    />
                    
                    <Input
                      label="Lecture Number"
                      value={lectureNumber}
                      onChange={(e) => setLectureNumber(e.target.value)}
                      placeholder="Enter lecture number"
                      required
                    />
                  </div>
                  
                  <div className="mt-4">
                    <Input
                      label="Topic Covered in this Lecture"
                      value={topicCovered}
                      onChange={(e) => setTopicCovered(e.target.value)}
                      placeholder="Enter topic covered"
                      required
                    />
                  </div>
                </Card.Body>
              </Card>
              
              {selectedDivision && students.length > 0 && (
                <Card>
                  <Card.Header>
                    <div className="flex justify-between items-center">
                      <h3 className="text-section-title">Students List</h3>
                      <div className="space-x-2">
                        <Button
                          type="button"
                          onClick={markAllPresent}
                          variant="success"
                          size="sm"
                        >
                          Mark All Present
                        </Button>
                        <Button
                          type="button"
                          onClick={markAllAbsent}
                          variant="danger"
                          size="sm"
                        >
                          Mark All Absent
                        </Button>
                      </div>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    <DataTable
                      data={students}
                      columns={studentColumns}
                      pagination={false}
                      searchable
                      emptyMessage="No students found"
                    />
                  </Card.Body>
                </Card>
              )}
              
              <div className="flex justify-end">
                <Button type="button" variant="secondary" className="mr-2" onClick={exportAttendanceCSV} disabled={!selectedDivision || students.length === 0}>
                  Export CSV
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!selectedDivision || students.length === 0}
                >
                  Submit Attendance
                </Button>
              </div>
            </form>

            <Card>
              <Card.Header>
                <div className="flex justify-between items-center">
                  <h3 className="text-section-title">Past Sessions</h3>
                  <Button type="button" variant="secondary" onClick={fetchAttendanceHistory} disabled={!selectedSemester || !selectedSubject || !selectedDivision || attendanceHistoryLoading}>
                    Refresh
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                {attendanceHistoryError && <div className="text-red-700 mb-2">{attendanceHistoryError}</div>}
                <DataTable
                  data={attendanceHistory || []}
                  columns={[
                    { key: 'lectureDate', label: 'Date', render: (value: any) => safeDate(value) },
                    { key: 'lectureNo', label: 'Lecture', sortable: true },
                    { key: 'topicCovered', label: 'Topic' },
                  ]}
                  searchable
                  pagination
                  pageSize={10}
                  emptyMessage={attendanceHistoryLoading ? 'Loading...' : 'No sessions found'}
                />
              </Card.Body>
            </Card>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-page-title">Students</h1>
              <p className="text-body text-gray-600 mt-2">View students for selected semester, subject and division</p>
            </div>

            <Card>
              <Card.Header>
                <h3 className="text-section-title">Filters</h3>
              </Card.Header>
              <Card.Body>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select
                    label="Semester"
                    value={selectedSemester || ''}
                    onChange={(e) => setSelectedSemester(Number(e.target.value))}
                    options={semesterOptions}
                    placeholder="Select Semester"
                  />
                  <Select
                    label="Subject"
                    value={selectedSubject || ''}
                    onChange={(e) => setSelectedSubject(Number(e.target.value))}
                    options={subjectOptions}
                    placeholder="Select Subject"
                    disabled={!selectedSemester}
                  />
                  <Select
                    label="Division"
                    value={selectedDivision || ''}
                    onChange={(e) => setSelectedDivision(Number(e.target.value))}
                    options={divisionOptions}
                    placeholder="Select Division"
                    disabled={!selectedSemester}
                  />
                </div>
                <div className="flex justify-end mt-4">
                  <Button variant="primary" onClick={fetchStudentsList} disabled={!selectedSemester || !selectedSubject || !selectedDivision || studentsLoading}>
                    Load Students
                  </Button>
                </div>
              </Card.Body>
            </Card>

            {studentsError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="text-red-800">Error: {studentsError}</div>
              </div>
            )}

            <DataTable
              data={students || []}
              columns={[
                { key: 'enrollmentNo', label: 'Enrollment No', sortable: true },
                { key: 'name', label: 'Name', sortable: true },
                { key: 'email', label: 'Email', sortable: true, render: (_: any, row: any) => row?.email || row?.user?.email || '-' },
                { key: 'division', label: 'Division', render: (_: any, row: any) => row?.division?.name || '-' },
                { key: 'semester', label: 'Semester', render: (_: any, row: any) => row?.semester?.number ?? '-' },
              ]}
              searchable
              pagination
              pageSize={10}
              emptyMessage={studentsLoading ? 'Loading...' : 'No students found'}
            />
          </div>
        )}

        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-page-title">Assignments</h1>
                <p className="text-body text-gray-600 mt-2">Manage and track student assignments</p>
              </div>
              <Button
                onClick={() => setShowAssignmentForm(true)}
                variant="primary"
              >
                + New Assignment
              </Button>
            </div>
            
            {showAssignmentForm && (
              <Card>
                <Card.Header>
                  <h3 className="text-section-title">Create New Assignment</h3>
                </Card.Header>
                <Card.Body>
                  <form onSubmit={handleAssignmentSubmit} className="space-y-4">
                    <Input
                      label="Title"
                      value={assignmentForm.title}
                      onChange={(e) => setAssignmentForm({...assignmentForm, title: e.target.value})}
                      required
                    />
                    
                    <Input
                      label="Description"
                      value={assignmentForm.description}
                      onChange={(e) => setAssignmentForm({...assignmentForm, description: e.target.value})}
                      required
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Select
                        label="Subject"
                        value={assignmentForm.subjectId}
                        onChange={(e) => setAssignmentForm({...assignmentForm, subjectId: e.target.value})}
                        options={subjectOptions}
                        placeholder="Select Subject"
                        required
                      />
                      
                      <Select
                        label="Division"
                        value={assignmentForm.divisionId}
                        onChange={(e) => setAssignmentForm({...assignmentForm, divisionId: e.target.value})}
                        options={divisionOptions}
                        placeholder="Select Division"
                        required
                      />
                      
                      <Input
                        label="Due Date"
                        type="date"
                        value={assignmentForm.dueDate}
                        onChange={(e) => setAssignmentForm({...assignmentForm, dueDate: e.target.value})}
                        required
                      />
                    </div>

                    <div>
                      <label className="form-label">Attachment (optional)</label>
                      <input
                        type="file"
                        onChange={(e) => setAssignmentFile(e.target.files?.[0] || null)}
                        className="form-input"
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-4">
                      <Button
                        type="button"
                        onClick={() => setShowAssignmentForm(false)}
                        variant="secondary"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                      >
                        Create Assignment
                      </Button>
                    </div>
                  </form>
                </Card.Body>
              </Card>
            )}
            
            <DataTable
              data={assignments || []}
              columns={assignmentColumns}
              searchable
              pagination
              pageSize={10}
              emptyMessage="No assignments found"
            />
          </div>
        )}

        {/* Notices Tab */}
        {activeTab === 'notices' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-page-title">Notices</h1>
                <p className="text-body text-gray-600 mt-2">Manage and view important notices</p>
              </div>
              <Button variant="primary" onClick={() => setShowNoticeForm(true)}>
                + New Notice
              </Button>
            </div>

            {showNoticeForm && (
              <Card>
                <Card.Header>
                  <h3 className="text-section-title">Create Notice</h3>
                </Card.Header>
                <Card.Body>
                  <form onSubmit={handleCreateNotice} className="space-y-4">
                    <Input
                      label="Title"
                      value={noticeForm.title}
                      onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                      required
                    />
                    <Input
                      label="Content"
                      value={noticeForm.content}
                      onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
                      required
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Select
                        label="Semester (optional)"
                        value={noticeForm.semester || ''}
                        onChange={(e) => setNoticeForm({ ...noticeForm, semester: e.target.value ? Number(e.target.value) : '' })}
                        options={semesterOptions}
                        placeholder="All semesters"
                      />
                      <Select
                        label="Division (optional)"
                        value={noticeForm.divisionId || ''}
                        onChange={(e) => setNoticeForm({ ...noticeForm, divisionId: e.target.value ? Number(e.target.value) : '' })}
                        options={divisionOptions}
                        placeholder="All divisions"
                        disabled={!selectedSemester}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Select
                        label="For Students"
                        value={noticeForm.isForStudents ? 'true' : 'false'}
                        onChange={(e) => setNoticeForm({ ...noticeForm, isForStudents: e.target.value === 'true' })}
                        options={[
                          { value: 'true', label: 'Yes' },
                          { value: 'false', label: 'No' },
                        ]}
                      />
                      <Select
                        label="For Faculty"
                        value={noticeForm.isForFaculty ? 'true' : 'false'}
                        onChange={(e) => setNoticeForm({ ...noticeForm, isForFaculty: e.target.value === 'true' })}
                        options={[
                          { value: 'true', label: 'Yes' },
                          { value: 'false', label: 'No' },
                        ]}
                      />
                    </div>

                    <div>
                      <label className="form-label">Attachment (optional)</label>
                      <input
                        type="file"
                        onChange={(e) => setNoticeFile(e.target.files?.[0] || null)}
                        className="form-input"
                      />
                    </div>

                    <div className="flex justify-end space-x-4">
                      <Button type="button" variant="secondary" onClick={() => setShowNoticeForm(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" variant="primary">
                        Create Notice
                      </Button>
                    </div>
                  </form>
                </Card.Body>
              </Card>
            )}
            
            <DataTable
              data={notices || []}
              columns={noticeColumns}
              searchable
              pagination
              pageSize={10}
              emptyMessage="No notices found"
            />

            <Modal
              isOpen={isNoticeModalOpen}
              onClose={() => {
                setIsNoticeModalOpen(false);
                setSelectedNotice(null);
              }}
              title={selectedNotice?.title ? `Notice: ${selectedNotice.title}` : 'Notice'}
            >
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Date</p>
                  <div className="text-sm text-gray-900">{safeDate(selectedNotice?.createdAt)}</div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Content</p>
                  <div className="text-sm text-gray-900 whitespace-pre-wrap">{selectedNotice?.content || '-'}</div>
                </div>
                {getAttachmentUrl(selectedNotice?.attachment) ? (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Attachment</p>
                    <a
                      className="text-sm text-blue-600 underline"
                      href={getAttachmentUrl(selectedNotice?.attachment) as string}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open / Download
                    </a>
                  </div>
                ) : null}
              </div>
            </Modal>
          </div>
        )}

        {activeTab === 'marks' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-page-title">Marks Upload</h1>
              <p className="text-body text-gray-600 mt-2">Upload marks via CSV and view uploaded records</p>
            </div>

            <Card>
              <Card.Header>
                <h3 className="text-section-title">Filters</h3>
              </Card.Header>
              <Card.Body>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select
                    label="Semester"
                    value={selectedSemester || ''}
                    onChange={(e) => setSelectedSemester(Number(e.target.value))}
                    options={semesterOptions}
                    placeholder="Select Semester"
                  />
                  <Select
                    label="Subject"
                    value={selectedSubject || ''}
                    onChange={(e) => setSelectedSubject(Number(e.target.value))}
                    options={subjectOptions}
                    placeholder="Select Subject"
                    disabled={!selectedSemester}
                  />
                  <Select
                    label="Division"
                    value={selectedDivision || ''}
                    onChange={(e) => setSelectedDivision(Number(e.target.value))}
                    options={divisionOptions}
                    placeholder="Select Division"
                    disabled={!selectedSemester}
                  />
                </div>

                <div className="flex justify-end mt-4 space-x-2">
                  <Button variant="secondary" onClick={downloadMarksTemplate} disabled={!selectedDivision}>
                    Download Template
                  </Button>
                  <Button variant="secondary" onClick={fetchMarksUploads} disabled={!selectedSemester || !selectedSubject || !selectedDivision || marksLoading}>
                    Refresh
                  </Button>
                </div>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                <h3 className="text-section-title">Upload CSV</h3>
              </Card.Header>
              <Card.Body>
                <form onSubmit={handleMarksUpload} className="space-y-4">
                  <div>
                    <label className="form-label">CSV File</label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setMarksFile(e.target.files?.[0] || null)}
                      className="form-input"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" variant="primary" disabled={marksLoading}>
                      Upload Marks
                    </Button>
                  </div>
                </form>
                {marksError && <div className="text-red-700 mt-2">{marksError}</div>}
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                <h3 className="text-section-title">Uploaded Marks</h3>
              </Card.Header>
              <Card.Body>
                <DataTable
                  data={marksUploads || []}
                  columns={[
                    { key: 'id', label: 'Upload ID', sortable: true },
                    { key: 'semester', label: 'Semester', sortable: true },
                    { key: 'division', label: 'Division', render: (_: any, row: any) => row?.division?.name || '-' },
                    { key: 'subject', label: 'Subject', render: (_: any, row: any) => row?.subject?.name || '-' },
                    { key: 'createdAt', label: 'Uploaded On', render: (value: any) => safeDate(value) },
                  ]}
                  searchable
                  pagination
                  pageSize={10}
                  emptyMessage={marksLoading ? 'Loading...' : 'No uploads found'}
                />
              </Card.Body>
            </Card>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-page-title">Reports</h1>
              <p className="text-body text-gray-600 mt-2">Generate and export reports</p>
            </div>

            <Card>
              <Card.Header>
                <h3 className="text-section-title">Attendance Report Export</h3>
              </Card.Header>
              <Card.Body>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select
                    label="Semester"
                    value={selectedSemester || ''}
                    onChange={(e) => setSelectedSemester(Number(e.target.value))}
                    options={semesterOptions}
                    placeholder="Select Semester"
                  />
                  <Select
                    label="Subject"
                    value={selectedSubject || ''}
                    onChange={(e) => setSelectedSubject(Number(e.target.value))}
                    options={subjectOptions}
                    placeholder="Select Subject"
                    disabled={!selectedSemester}
                  />
                  <Select
                    label="Division"
                    value={selectedDivision || ''}
                    onChange={(e) => setSelectedDivision(Number(e.target.value))}
                    options={divisionOptions}
                    placeholder="Select Division"
                    disabled={!selectedSemester}
                  />
                </div>

                <div className="flex justify-end mt-4">
                  <Button variant="primary" onClick={exportAttendanceCSV}>
                    Export Attendance CSV
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </div>
        )}
      </div>
    </ModernLayout>
  );
};

export default ModernFacultyDashboard;
