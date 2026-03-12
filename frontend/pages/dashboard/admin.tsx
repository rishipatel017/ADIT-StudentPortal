import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ModernLayout from '../../components/Layout/ModernLayout';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Card, DataTable, StatCard, Input, Select, Modal } from '../../components/UI';
import { useSemesters, useDivisions, useSubjects, useStudents } from '../../hooks/useAcademicData';
import { userService } from '../../services/auth.service';
import { departmentService, subjectService, divisionService } from '../../services/academic.service';
import { studentService } from '../../services/user.service';
import { facultyService } from '../../services/user.service';
import { AuthGuard } from '../../components/Auth/AuthGuard';
import api from '../../services/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const getAttachmentUrl = (attachment: any): string | null => {
  if (!attachment || typeof attachment !== 'string') return null;
  if (/^https?:\/\//i.test(attachment)) return attachment;
  const path = attachment.startsWith('/') ? attachment : `/${attachment}`;
  return `${API_BASE_URL}${path}`;
};

type AdminStudentRow = {
  id: number;
  enrollmentNo: string;
  name: string;
  email?: string;
  user?: { email?: string };
  semester?: { number?: number };
  division?: { name?: string };
};

type AdminFacultyRow = {
  id: number;
  name: string;
  email: string;
  designation?: string;
  qualification?: string;
  joiningDate?: string;
};

interface SystemStats {
  total: number;
  admins: number;
  faculty: number;
  students: number;
  activeToday: number;
  lockedAccounts: number;
}

type AdminDashboardStats = {
  totalStudents: number;
  totalFaculty: number;
  totalSubjects: number;
  totalDivisions: number;
  activeAssignments: number;
  pendingNotices: number;
  recentActivities: any[];
};

interface DepartmentStats {
  id: number;
  name: string;
  code: string;
  totalSemesters: number;
  totalFaculty: number;
  totalStudents: number;
  totalSubjects: number;
  totalDivisions: number;
  activeAssignments: number;
  recentNotices: number;
}

const ModernAdminDashboard: React.FC = () => {
  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <AdminDashboardContent />
    </AuthGuard>
  );
};

const AdminDashboardContent: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [currentSemesterSetting, setCurrentSemesterSetting] = useState('3');
  const [stats, setStats] = useState<SystemStats>({
    total: 0,
    admins: 0,
    faculty: 0,
    students: 0,
    activeToday: 0,
    lockedAccounts: 0,
  });

  const [adminDashboardStats, setAdminDashboardStats] = useState<AdminDashboardStats>({
    totalStudents: 0,
    totalFaculty: 0,
    totalSubjects: 0,
    totalDivisions: 0,
    activeAssignments: 0,
    pendingNotices: 0,
    recentActivities: [],
  });
  
  const [students, setStudents] = useState<any[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [departments, setDepartments] = useState<DepartmentStats[]>([]);
  const [allDepartments, setAllDepartments] = useState<any[]>([]);
  const [allSubjects, setAllSubjects] = useState<any[]>([]);
  const [allDivisions, setAllDivisions] = useState<any[]>([]);
  const [allNotices, setAllNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNotice, setSelectedNotice] = useState<any | null>(null);

  const [facultySubjectAssignments, setFacultySubjectAssignments] = useState<any[]>([]);
  const [facultySubjectLoading, setFacultySubjectLoading] = useState(false);
  const [facultySubjectError, setFacultySubjectError] = useState<string | null>(null);
  const [assignFacultyId, setAssignFacultyId] = useState<number | undefined>();
  const [assignSubjectId, setAssignSubjectId] = useState<number | undefined>();
  const [assignDivisionId, setAssignDivisionId] = useState<number | undefined>();

  const [promotionPreview, setPromotionPreview] = useState<any | null>(null);
  const [promotionLoading, setPromotionLoading] = useState(false);
  const [promotionError, setPromotionError] = useState<string | null>(null);

  // CRUD Modal States
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showFacultyModal, setShowFacultyModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showDivisionModal, setShowDivisionModal] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form States
  const [studentForm, setStudentForm] = useState({
    name: '',
    email: '',
    password: '',
    enrollmentNo: '',
    divisionId: '',
    semesterId: ''
  });

  const [facultyForm, setFacultyForm] = useState({
    name: '',
    email: '',
    password: '',
    designation: '',
    qualification: '',
    phone: '',
    pastExperienceYears: ''
  });

  const [subjectForm, setSubjectForm] = useState({
    name: '',
    code: '',
    type: '',
    credits: '',
    semesterId: ''
  });

  const [divisionForm, setDivisionForm] = useState({
    name: '',
    semesterId: ''
  });

  const [departmentForm, setDepartmentForm] = useState({
    name: '',
    code: '',
  });

  const [noticeForm, setNoticeForm] = useState({
    title: '',
    content: '',
    isForStudents: true,
    isForFaculty: false,
    semesterId: '',
    divisionId: '',
  });

  const [noticeSemesterSelection, setNoticeSemesterSelection] = useState<number | undefined>();
  const { options: noticeDivisionOptions } = useDivisions(noticeSemesterSelection);

  // Handle URL-based navigation
  useEffect(() => {
    const tab = typeof router.query.tab === 'string' ? router.query.tab : undefined;
    if (!tab) {
      setActiveTab('dashboard');
      return;
    }
    const allowed = ['dashboard', 'students', 'faculty', 'departments', 'divisions', 'subjects', 'notices', 'faculty-assignment', 'promotion', 'reports'];
    setActiveTab(allowed.includes(tab) ? tab : 'dashboard');
  }, [router.query.tab]);

  // Academic data hooks
  const { semesters, options: semesterOptions } = useSemesters();
  const [selectedSemester, setSelectedSemester] = useState<number | undefined>();
  const { divisions, options: divisionOptions } = useDivisions(selectedSemester);
  const [selectedDivision, setSelectedDivision] = useState<number | undefined>();
  const { subjects, options: subjectOptions } = useSubjects(selectedSemester);
  const { students: academicStudents, loading: studentsLoading } = useStudents(selectedSemester, selectedDivision);

  const facultyOptions = (Array.isArray(faculty) ? faculty : []).map((f: any) => ({
    value: f.id,
    label: `${f.name}${f.email ? ` (${f.email})` : ''}`,
  }));

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch system stats, departments, students, and faculty in parallel
      const [statsData, adminStatsData, departmentsData, studentsData, facultyData, subjectsData, divisionsData] = await Promise.all([
        userService.getUserStats(),
        api.get('/admin/dashboard/stats').then((r) => r.data).catch(() => null),
        departmentService.getAllDepartments(),
        api.get('/admin/students').then(r => r.data),
        api.get('/admin/faculty').then(r => r.data),
        api.get('/admin/subjects').then((r) => r.data).catch(() => ({ data: [] })),
        api.get('/admin/divisions').then((r) => r.data).catch(() => ({ data: [] }))
      ]);

      const noticesData = await api.get('/notices/all').then((r) => r.data).catch(() => []);

      setStats(statsData);
      if (adminStatsData) {
        setAdminDashboardStats({
          totalStudents: adminStatsData?.totalStudents ?? 0,
          totalFaculty: adminStatsData?.totalFaculty ?? 0,
          totalSubjects: adminStatsData?.totalSubjects ?? 0,
          totalDivisions: adminStatsData?.totalDivisions ?? 0,
          activeAssignments: adminStatsData?.activeAssignments ?? 0,
          pendingNotices: adminStatsData?.pendingNotices ?? 0,
          recentActivities: Array.isArray(adminStatsData?.recentActivities) ? adminStatsData.recentActivities : [],
        });
      }
      const mappedDepartments: DepartmentStats[] = (Array.isArray(departmentsData) ? departmentsData : []).map((dept: any) => {
        const counts = dept?._count || {};
        return {
          id: dept.id,
          name: dept.name,
          code: dept.code,
          totalSemesters: counts.semesters ?? 0,
          totalFaculty: counts.faculty ?? 0,
          totalStudents: counts.students ?? 0,
          totalSubjects: 0,
          totalDivisions: 0,
          activeAssignments: 0,
          recentNotices: counts.notices ?? 0,
        };
      });
      setDepartments(mappedDepartments);
      setAllDepartments(Array.isArray(departmentsData) ? departmentsData : []);
      const studentsArr = Array.isArray(studentsData) ? studentsData : (Array.isArray(studentsData?.data) ? studentsData.data : []);
      const facultyArr = Array.isArray(facultyData) ? facultyData : (Array.isArray(facultyData?.data) ? facultyData.data : []);
      const subjectsArr = Array.isArray(subjectsData) ? subjectsData : (Array.isArray(subjectsData?.data) ? subjectsData.data : []);
      const divisionsArr = Array.isArray(divisionsData) ? divisionsData : (Array.isArray(divisionsData?.data) ? divisionsData.data : []);

      setStudents(studentsArr);
      setFaculty(facultyArr);

      const filteredSubjects = subjectsArr.filter((s: any) => {
        const n = s?.semester?.number;
        if (typeof n !== 'number') return true;
        return n >= 1 && n <= 8;
      });
      const filteredDivisions = divisionsArr.filter((d: any) => {
        const n = d?.semester?.number;
        if (typeof n !== 'number') return true;
        return n >= 1 && n <= 8;
      });
      setAllSubjects(filteredSubjects);
      setAllDivisions(filteredDivisions);
      setAllNotices(Array.isArray(noticesData) ? noticesData : []);

    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchFacultySubjectAssignments = async () => {
    try {
      setFacultySubjectLoading(true);
      setFacultySubjectError(null);
      const res = await api.get('/admin/faculty-subjects', {
        params: {
          semesterId: selectedSemester || undefined,
        },
      });
      setFacultySubjectAssignments(Array.isArray(res.data) ? res.data : []);
    } catch (e: any) {
      console.error('Failed to load faculty-subject assignments:', e);
      setFacultySubjectAssignments([]);
      setFacultySubjectError(e?.response?.data?.message || e?.message || 'Failed to load assignments');
    } finally {
      setFacultySubjectLoading(false);
    }
  };

  const handleCreateFacultySubjectAssignment = async () => {
    if (!assignFacultyId || !assignSubjectId || !assignDivisionId) {
      setFacultySubjectError('Please select Faculty, Subject and Division');
      return;
    }
    try {
      setFacultySubjectLoading(true);
      setFacultySubjectError(null);
      await api.post('/admin/faculty-subjects', {
        facultyId: assignFacultyId,
        subjectId: assignSubjectId,
        divisionId: assignDivisionId,
      });
      await fetchFacultySubjectAssignments();
    } catch (e: any) {
      console.error('Failed to create assignment:', e);
      setFacultySubjectError(e?.response?.data?.message || e?.message || 'Failed to create assignment');
    } finally {
      setFacultySubjectLoading(false);
    }
  };

  const handleRemoveFacultySubjectAssignment = async (row: any) => {
    try {
      setFacultySubjectLoading(true);
      setFacultySubjectError(null);
      await api.delete('/admin/faculty-subjects', {
        params: {
          facultyId: row?.facultyId || row?.faculty?.id,
          subjectId: row?.subjectId || row?.subject?.id,
          divisionId: row?.divisionId || row?.division?.id,
        },
      });
      await fetchFacultySubjectAssignments();
    } catch (e: any) {
      console.error('Failed to remove assignment:', e);
      setFacultySubjectError(e?.response?.data?.message || e?.message || 'Failed to remove assignment');
    } finally {
      setFacultySubjectLoading(false);
    }
  };

  const fetchPromotionPreview = async () => {
    if (!selectedSemester) {
      setPromotionError('Please select semester');
      return;
    }
    try {
      setPromotionLoading(true);
      setPromotionError(null);
      const res = await api.get('/admin/promotion/preview', {
        params: {
          fromSemesterId: selectedSemester,
        },
      });
      setPromotionPreview(res.data);
    } catch (e: any) {
      console.error('Failed to preview promotion:', e);
      setPromotionPreview(null);
      setPromotionError(e?.response?.data?.message || e?.message || 'Failed to preview promotion');
    } finally {
      setPromotionLoading(false);
    }
  };

  const executePromotion = async () => {
    if (!selectedSemester) {
      setPromotionError('Please select semester');
      return;
    }
    try {
      setPromotionLoading(true);
      setPromotionError(null);
      const res = await api.post('/admin/promotion/execute', {
        fromSemesterId: selectedSemester,
      });
      alert(res?.data?.message || 'Promotion executed');
      await fetchPromotionPreview();
    } catch (e: any) {
      console.error('Failed to execute promotion:', e);
      setPromotionError(e?.response?.data?.message || e?.message || 'Failed to execute promotion');
    } finally {
      setPromotionLoading(false);
    }
  };

  // CRUD Handlers
  const handleAddStudent = () => {
    setEditingItem(null);
    setStudentForm({
      name: '',
      email: '',
      password: '',
      enrollmentNo: '',
      divisionId: '',
      semesterId: ''
    });
    setShowStudentModal(true);
  };

  const handleEditStudent = (row: any) => {
    setEditingItem(row);
    setStudentForm({
      name: row?.name || '',
      email: row?.email || row?.user?.email || '',
      password: '',
      enrollmentNo: row?.enrollmentNo || '',
      divisionId: row?.divisionId ? String(row.divisionId) : (row?.division?.id ? String(row.division.id) : ''),
      semesterId: row?.semesterId ? String(row.semesterId) : (row?.semester?.id ? String(row.semester.id) : ''),
    });
    setShowStudentModal(true);
  };

  const handleDeleteStudent = async (row: any) => {
    try {
      setFormLoading(true);
      await api.delete(`/admin/students/${row.id}`);
      await fetchDashboardData();
    } catch (e) {
      console.error('Error deleting student:', e);
      alert('Failed to delete student');
    } finally {
      setFormLoading(false);
    }
  };

  const handleViewNotice = (row: any) => {
    setEditingItem(null);
    setSelectedNotice(row);
    setNoticeForm({
      title: row?.title || '',
      content: row?.content || '',
      isForStudents: row?.isForStudents !== false,
      isForFaculty: !!row?.isForFaculty,
      semesterId: row?.semesterId != null ? String(row.semesterId) : '',
      divisionId: row?.divisionId != null ? String(row.divisionId) : '',
    });
    setNoticeSemesterSelection(row?.semesterId != null ? Number(row.semesterId) : undefined);
    setShowNoticeModal(true);
  };

  const handleEditNotice = (row: any) => {
    setEditingItem(row);
    setSelectedNotice(row);
    setNoticeForm({
      title: row?.title || '',
      content: row?.content || '',
      isForStudents: row?.isForStudents !== false,
      isForFaculty: !!row?.isForFaculty,
      semesterId: row?.semesterId != null ? String(row.semesterId) : '',
      divisionId: row?.divisionId != null ? String(row.divisionId) : '',
    });
    setNoticeSemesterSelection(row?.semesterId != null ? Number(row.semesterId) : undefined);
    setShowNoticeModal(true);
  };

  const handleDeleteNotice = async (row: any) => {
    try {
      setFormLoading(true);
      await api.delete(`/notices/${row.id}`);
      await fetchDashboardData();
    } catch (e: any) {
      console.error('Error deleting notice:', e);
      alert(e?.response?.data?.message || 'Failed to delete notice');
    } finally {
      setFormLoading(false);
    }
  };

  const handleNoticeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setFormLoading(true);
    try {
      const payload: any = {
        title: noticeForm.title,
        content: noticeForm.content,
        isForStudents: !!noticeForm.isForStudents,
        isForFaculty: !!noticeForm.isForFaculty,
        semester: noticeForm.semesterId ? Number(noticeForm.semesterId) : null,
        divisionId: noticeForm.divisionId ? Number(noticeForm.divisionId) : null,
      };

      await api.put(`/notices/${editingItem.id}`, payload);
      setShowNoticeModal(false);
      setEditingItem(null);
      await fetchDashboardData();
    } catch (e: any) {
      console.error('Error updating notice:', e);
      alert(e?.response?.data?.message || 'Failed to update notice');
    } finally {
      setFormLoading(false);
    }
  };

  const renderNotices = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-page-title">Notices Management</h1>
        <p className="text-body text-gray-600 mt-2">View, update, and delete notices</p>
      </div>

      <DataTable
        data={allNotices || []}
        columns={[
          { key: 'title', label: 'Title', sortable: true },
          { key: 'createdByRole', label: 'Author', sortable: true },
          { key: 'isForStudents', label: 'For Students', sortable: true, render: (v: any) => (v ? 'Yes' : 'No') },
          { key: 'isForFaculty', label: 'For Faculty', sortable: true, render: (v: any) => (v ? 'Yes' : 'No') },
          { key: 'createdAt', label: 'Created', sortable: true, render: (v: any) => (v ? new Date(v).toLocaleString() : '-') },
          {
            key: 'actions' as any,
            label: 'Actions',
            render: (_: any, row: any) => (
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => handleViewNotice(row)}>
                  View
                </Button>
                <Button size="sm" variant="secondary" onClick={() => handleEditNotice(row)}>
                  Update
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleDeleteNotice(row)} disabled={formLoading}>
                  Delete
                </Button>
              </div>
            ),
          },
        ]}
        searchable
        pagination
        pageSize={10}
        emptyMessage="No notices found"
      />

      <Modal
        isOpen={showNoticeModal}
        onClose={() => {
          setShowNoticeModal(false);
          setEditingItem(null);
          setSelectedNotice(null);
        }}
        title={editingItem ? 'Update Notice' : 'View Notice'}
      >
        <form onSubmit={handleNoticeSubmit} className="space-y-4">
          <div>
            <label className="form-label">Title</label>
            <Input
              value={noticeForm.title}
              onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
              required
              disabled={!editingItem}
            />
          </div>
          <div>
            <label className="form-label">Content</label>
            <textarea
              className="form-input"
              value={noticeForm.content}
              onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
              required
              disabled={!editingItem}
              rows={6}
            />
          </div>

          {getAttachmentUrl(selectedNotice?.attachment) ? (
            <div>
              <label className="form-label">Attachment</label>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">For Students</label>
              <select
                className="form-select"
                value={noticeForm.isForStudents ? 'true' : 'false'}
                onChange={(e) => setNoticeForm({ ...noticeForm, isForStudents: e.target.value === 'true' })}
                disabled={!editingItem}
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div>
              <label className="form-label">For Faculty</label>
              <select
                className="form-select"
                value={noticeForm.isForFaculty ? 'true' : 'false'}
                onChange={(e) => setNoticeForm({ ...noticeForm, isForFaculty: e.target.value === 'true' })}
                disabled={!editingItem}
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Semester"
              value={noticeForm.semesterId}
              onChange={(e) => {
                const sem = e.target.value;
                setNoticeForm({ ...noticeForm, semesterId: sem, divisionId: '' });
                setNoticeSemesterSelection(sem ? Number(sem) : undefined);
              }}
              options={semesterOptions}
              placeholder="All Semesters"
              disabled={!editingItem}
            />
            <Select
              label="Division"
              value={noticeForm.divisionId}
              onChange={(e) => setNoticeForm({ ...noticeForm, divisionId: e.target.value })}
              options={noticeDivisionOptions}
              placeholder="All Divisions"
              disabled={!editingItem || !noticeForm.semesterId}
            />
          </div>

          <div className="flex space-x-3">
            {editingItem ? (
              <Button type="submit" variant="primary" disabled={formLoading}>
                {formLoading ? 'Saving...' : 'Update Notice'}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowNoticeModal(false);
                setEditingItem(null);
              }}
            >
              Close
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );

  const handleAddFaculty = () => {
    setEditingItem(null);
    setFacultyForm({
      name: '',
      email: '',
      password: '',
      designation: '',
      qualification: '',
      phone: '',
      pastExperienceYears: ''
    });
    setShowFacultyModal(true);
  };

  const handleEditFaculty = (row: any) => {
    setEditingItem(row);
    setFacultyForm({
      name: row?.name || '',
      email: row?.email || row?.user?.email || '',
      password: '',
      designation: row?.designation || '',
      qualification: row?.qualification || '',
      phone: row?.phone || '',
      pastExperienceYears: row?.pastExperienceYears != null ? String(row.pastExperienceYears) : '',
    });
    setShowFacultyModal(true);
  };

  const handleDeleteFaculty = async (row: any) => {
    try {
      setFormLoading(true);
      await api.delete(`/admin/faculty/${row.id}`);
      await fetchDashboardData();
    } catch (e) {
      console.error('Error deleting faculty:', e);
      alert('Failed to delete faculty');
    } finally {
      setFormLoading(false);
    }
  };

  const handleAddSubject = () => {
    setEditingItem(null);
    setSubjectForm({
      name: '',
      code: '',
      type: '',
      credits: '',
      semesterId: ''
    });
    setShowSubjectModal(true);
  };

  const handleEditSubject = (row: any) => {
    setEditingItem(row);
    setSubjectForm({
      name: row?.name || '',
      code: row?.code || '',
      type: row?.type || '',
      credits: row?.credits != null ? String(row.credits) : '',
      semesterId: row?.semesterId != null ? String(row.semesterId) : '',
    });
    setShowSubjectModal(true);
  };

  const handleDeleteSubject = async (row: any) => {
    try {
      setFormLoading(true);
      await api.delete(`/admin/subjects/${row.id}`);
      await fetchDashboardData();
    } catch (e: any) {
      console.error('Error deleting subject:', e);
      alert(e?.response?.data?.message || 'Failed to delete subject');
    } finally {
      setFormLoading(false);
    }
  };

  const handleAddDivision = () => {
    setEditingItem(null);
    setDivisionForm({
      name: '',
      semesterId: ''
    });
    setShowDivisionModal(true);
  };

  const handleEditDivision = (row: any) => {
    setEditingItem(row);
    setDivisionForm({
      name: row?.name || '',
      semesterId: row?.semesterId != null ? String(row.semesterId) : '',
    });
    setShowDivisionModal(true);
  };

  const handleDeleteDivision = async (row: any) => {
    try {
      setFormLoading(true);
      await api.delete(`/admin/divisions/${row.id}`);
      await fetchDashboardData();
    } catch (e: any) {
      console.error('Error deleting division:', e);
      alert(e?.response?.data?.message || 'Failed to delete division');
    } finally {
      setFormLoading(false);
    }
  };

  const handleAddDepartment = () => {
    setEditingItem(null);
    setDepartmentForm({ name: '', code: '' });
    setShowDepartmentModal(true);
  };

  const handleEditDepartment = (row: any) => {
    setEditingItem(row);
    setDepartmentForm({
      name: row?.name || '',
      code: row?.code || '',
    });
    setShowDepartmentModal(true);
  };

  const handleDeleteDepartment = async (row: any) => {
    try {
      setFormLoading(true);
      await departmentService.deleteDepartment(row.id);
      await fetchDashboardData();
    } catch (e: any) {
      console.error('Error deleting department:', e);
      alert(e?.response?.data?.message || 'Failed to delete department');
    } finally {
      setFormLoading(false);
    }
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const payload: any = {
        name: studentForm.name,
        email: studentForm.email,
        enrollmentNo: studentForm.enrollmentNo,
        divisionId: studentForm.divisionId ? Number(studentForm.divisionId) : undefined,
        semesterId: studentForm.semesterId ? Number(studentForm.semesterId) : undefined,
      };

      if (!editingItem) {
        payload.password = studentForm.password;
        await api.post('/admin/students', payload);
      } else {
        if (studentForm.password) payload.password = studentForm.password;
        await api.put(`/admin/students/${editingItem.id}`, payload);
      }

      setShowStudentModal(false);
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error saving student:', error);
      alert('Failed to save student');
    } finally {
      setFormLoading(false);
    }
  };

  const handleFacultySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const payload: any = {
        name: facultyForm.name,
        email: facultyForm.email,
        designation: facultyForm.designation,
        qualification: facultyForm.qualification,
        phone: facultyForm.phone || undefined,
        pastExperienceYears: facultyForm.pastExperienceYears ? Number(facultyForm.pastExperienceYears) : undefined,
      };

      if (!editingItem) {
        payload.password = facultyForm.password;
        await api.post('/admin/faculty', payload);
      } else {
        if (facultyForm.password) payload.password = facultyForm.password;
        await api.put(`/admin/faculty/${editingItem.id}`, payload);
      }

      setShowFacultyModal(false);
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error saving faculty:', error);
      alert('Failed to save faculty');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const payload: any = {
        name: subjectForm.name,
        code: subjectForm.code,
        type: subjectForm.type,
        credits: subjectForm.credits ? Number(subjectForm.credits) : undefined,
        semesterId: subjectForm.semesterId ? Number(subjectForm.semesterId) : undefined,
      };

      if (!editingItem) {
        await api.post('/admin/subjects', payload);
      } else {
        await api.put(`/admin/subjects/${editingItem.id}`, payload);
      }

      setShowSubjectModal(false);
      await fetchDashboardData();
    } catch (error) {
      console.error('Error saving subject:', error);
      alert('Failed to save subject');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDivisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const payload: any = {
        name: divisionForm.name,
        semesterId: divisionForm.semesterId ? Number(divisionForm.semesterId) : undefined,
      };

      if (!editingItem) {
        await api.post('/admin/divisions', payload);
      } else {
        await api.put(`/admin/divisions/${editingItem.id}`, payload);
      }

      setShowDivisionModal(false);
      await fetchDashboardData();
    } catch (error) {
      console.error('Error saving division:', error);
      alert('Failed to save division');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDepartmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const payload: any = {
        name: departmentForm.name,
        code: departmentForm.code,
      };

      if (!editingItem) {
        await departmentService.createDepartment(payload);
      } else {
        await departmentService.updateDepartment(editingItem.id, payload);
      }

      setShowDepartmentModal(false);
      await fetchDashboardData();
    } catch (error) {
      console.error('Error saving department:', error);
      alert('Failed to save department');
    } finally {
      setFormLoading(false);
    }
  };

  const studentColumns = [
    {
      key: 'enrollmentNo' as keyof AdminStudentRow,
      label: 'Enrollment No',
      sortable: true,
    },
    {
      key: 'name' as keyof AdminStudentRow,
      label: 'Name',
      sortable: true,
    },
    {
      key: 'email' as keyof AdminStudentRow,
      label: 'Email',
      sortable: true,
      render: (_: any, row: any) => row?.email || row?.user?.email || '-',
    },
    {
      key: 'semester' as keyof AdminStudentRow,
      label: 'Semester',
      render: (_: any, row: any) => `Semester ${row?.semester?.number ?? '-'}`,
    },
    {
      key: 'division' as keyof AdminStudentRow,
      label: 'Division',
      render: (_: any, row: any) => row?.division?.name || '-',
    },
    {
      key: 'actions' as any,
      label: 'Actions',
      render: (_: any, row: any) => (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => handleEditStudent(row)}>
            Edit
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDeleteStudent(row)} disabled={formLoading}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const facultyColumns = [
    {
      key: 'name' as keyof AdminFacultyRow,
      label: 'Name',
      sortable: true,
    },
    {
      key: 'email' as keyof AdminFacultyRow,
      label: 'Email',
      sortable: true,
    },
    {
      key: 'designation' as keyof AdminFacultyRow,
      label: 'Designation',
      sortable: true,
    },
    {
      key: 'qualification' as keyof AdminFacultyRow,
      label: 'Qualification',
      sortable: true,
    },
    {
      key: 'joiningDate' as keyof AdminFacultyRow,
      label: 'Joining Date',
      sortable: true,
      render: (value: any) => (value ? new Date(value).toLocaleDateString() : '-'),
    },
    {
      key: 'actions' as any,
      label: 'Actions',
      render: (_: any, row: any) => (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => handleEditFaculty(row)}>
            Edit
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDeleteFaculty(row)} disabled={formLoading}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-page-title">Admin Dashboard</h1>
        <p className="text-body text-gray-600 mt-2">Manage your academic institution efficiently</p>
      </div>
      
      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.total || 0}
          subtitle="All System Users"
          icon={<span className="text-3xl">👥</span>}
          variant="primary"
        />
        <StatCard
          title="Students"
          value={adminDashboardStats.totalStudents || stats.students || 0}
          subtitle="Enrolled Students"
          icon={<span className="text-3xl">👨‍🎓</span>}
          variant="success"
        />
        <StatCard
          title="Faculty"
          value={adminDashboardStats.totalFaculty || stats.faculty || 0}
          subtitle="Teaching Staff"
          icon={<span className="text-3xl">👨‍🏫</span>}
          variant="purple"
        />
        <StatCard
          title="Active Today"
          value={stats.activeToday || 0}
          subtitle="Last 24 Hours"
          icon={<span className="text-3xl">📈</span>}
          variant="warning"
        />
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatCard
          title="Admin Accounts"
          value={stats.admins || 0}
          subtitle="System Administrators"
          icon={<span className="text-3xl">🛡️</span>}
          variant="primary"
        />
        <StatCard
          title="Locked Accounts"
          value={stats.lockedAccounts || 0}
          subtitle="Security Locks"
          icon={<span className="text-3xl">🔒</span>}
          variant="error"
        />
      </div>

      {/* Dynamic Academic Data Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <Card.Header>
            <h3 className="text-section-title">Departments Overview</h3>
          </Card.Header>
          <Card.Body>
            <div className="space-y-4">
              {departments.map((dept) => (
                <div key={dept.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-md font-medium text-gray-900">{dept.name}</h4>
                      <p className="text-sm text-gray-500">{dept.code}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Semesters</p>
                      <p className="font-medium">{dept.totalSemesters}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Faculty</p>
                      <p className="font-medium">{dept.totalFaculty}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Students</p>
                      <p className="font-medium">{dept.totalStudents}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Subjects</p>
                      <p className="font-medium">{dept.totalSubjects}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <h3 className="text-section-title">Recent Activity</h3>
          </Card.Header>
          <Card.Body>
            <div className="space-y-3">
              {(adminDashboardStats.recentActivities || []).length === 0 ? (
                <div className="text-sm text-gray-600">No recent activity available</div>
              ) : (
                (adminDashboardStats.recentActivities || []).map((a: any, idx: number) => (
                  <div key={idx} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{a?.title || a?.action || 'Activity'}</p>
                      <p className="text-xs text-gray-500">{a?.description || a?.message || '-'}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card.Body>
        </Card>
      </div>
    </div>
  );

  const renderStudents = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-page-title">Student Management</h1>
          <p className="text-body text-gray-600 mt-2">Manage student records and information</p>
        </div>
        <Button variant="primary" onClick={handleAddStudent}>
          + Add Student
        </Button>
      </div>

      <DataTable
        data={students || []}
        columns={studentColumns}
        searchable
        pagination
        pageSize={10}
        emptyMessage="No students found"
      />

      {/* Student Modal */}
      <Modal
        isOpen={showStudentModal}
        onClose={() => setShowStudentModal(false)}
        title={editingItem ? 'Edit Student' : 'Add New Student'}
      >
        <form onSubmit={handleStudentSubmit} className="space-y-4">
          <div>
            <label className="form-label">Name</label>
            <Input
              value={studentForm.name}
              onChange={(e) => setStudentForm({...studentForm, name: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="form-label">Email</label>
            <Input
              type="email"
              value={studentForm.email}
              onChange={(e) => setStudentForm({...studentForm, email: e.target.value})}
              required
            />
          </div>
          {!editingItem && (
            <div>
              <label className="form-label">Password</label>
              <Input
                type="password"
                value={studentForm.password}
                onChange={(e) => setStudentForm({...studentForm, password: e.target.value})}
                required
              />
            </div>
          )}
          <div>
            <label className="form-label">Enrollment Number</label>
            <Input
              value={studentForm.enrollmentNo}
              onChange={(e) => setStudentForm({...studentForm, enrollmentNo: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="form-label">Semester</label>
            <Select
              value={studentForm.semesterId}
              onChange={(e) => {
                const sem = e.target.value;
                setStudentForm({ ...studentForm, semesterId: sem, divisionId: '' });
                setSelectedSemester(sem ? Number(sem) : undefined);
              }}
              options={semesterOptions}
              placeholder="Select Semester"
              required
            />
          </div>
          <div>
            <label className="form-label">Division</label>
            <Select
              value={studentForm.divisionId}
              onChange={(e) => setStudentForm({ ...studentForm, divisionId: e.target.value })}
              options={divisionOptions}
              placeholder="Select Division"
              required
              disabled={!studentForm.semesterId}
            />
          </div>
          <div className="flex space-x-3">
            <Button type="submit" variant="primary" disabled={formLoading}>
              {formLoading ? 'Saving...' : (editingItem ? 'Update' : 'Add') + ' Student'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowStudentModal(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );

  const renderFaculty = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-page-title">Faculty Management</h1>
          <p className="text-body text-gray-600 mt-2">Manage faculty and staff information</p>
        </div>
        <Button variant="primary" onClick={handleAddFaculty}>
          + Add Faculty
        </Button>
      </div>

      <DataTable
        data={faculty || []}
        columns={facultyColumns}
        searchable
        pagination
        pageSize={10}
        emptyMessage="No faculty found"
      />

      <Modal
        isOpen={showFacultyModal}
        onClose={() => setShowFacultyModal(false)}
        title={editingItem ? 'Edit Faculty' : 'Add New Faculty'}
      >
        <form onSubmit={handleFacultySubmit} className="space-y-4">
          <div>
            <label className="form-label">Name</label>
            <Input value={facultyForm.name} onChange={(e) => setFacultyForm({ ...facultyForm, name: e.target.value })} required />
          </div>
          <div>
            <label className="form-label">Email</label>
            <Input type="email" value={facultyForm.email} onChange={(e) => setFacultyForm({ ...facultyForm, email: e.target.value })} required />
          </div>
          {!editingItem && (
            <div>
              <label className="form-label">Password</label>
              <Input type="password" value={facultyForm.password} onChange={(e) => setFacultyForm({ ...facultyForm, password: e.target.value })} required />
            </div>
          )}
          <div>
            <label className="form-label">Designation</label>
            <Input value={facultyForm.designation} onChange={(e) => setFacultyForm({ ...facultyForm, designation: e.target.value })} required />
          </div>
          <div>
            <label className="form-label">Qualification</label>
            <Input value={facultyForm.qualification} onChange={(e) => setFacultyForm({ ...facultyForm, qualification: e.target.value })} required />
          </div>
          <div>
            <label className="form-label">Phone</label>
            <Input value={facultyForm.phone} onChange={(e) => setFacultyForm({ ...facultyForm, phone: e.target.value })} />
          </div>
          <div>
            <label className="form-label">Past Experience Years</label>
            <Input type="number" value={facultyForm.pastExperienceYears} onChange={(e) => setFacultyForm({ ...facultyForm, pastExperienceYears: e.target.value })} />
          </div>
          <div className="flex space-x-3">
            <Button type="submit" variant="primary" disabled={formLoading}>
              {formLoading ? 'Saving...' : (editingItem ? 'Update' : 'Add') + ' Faculty'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowFacultyModal(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );

  const renderSubjects = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-page-title">Subjects Management</h1>
          <p className="text-body text-gray-600 mt-2">Manage subjects and courses</p>
        </div>
        <Button variant="primary" onClick={handleAddSubject}>
          + Add Subject
        </Button>
      </div>

      <DataTable
        data={allSubjects || []}
        columns={[
          { key: 'name', label: 'Subject Name', sortable: true },
          { key: 'code', label: 'Code', sortable: true },
          { key: 'type', label: 'Type', sortable: true },
          { key: 'credits', label: 'Credits', sortable: true },
          { key: 'semester' as any, label: 'Semester', sortable: true, render: (_: any, row: any) => `Semester ${row?.semester?.number ?? row?.semesterId ?? '-'}` },
          {
            key: 'actions' as any,
            label: 'Actions',
            render: (_: any, row: any) => (
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => handleEditSubject(row)}>
                  Edit
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleDeleteSubject(row)} disabled={formLoading}>
                  Delete
                </Button>
              </div>
            ),
          },
        ]}
        searchable
        pagination
        pageSize={10}
        emptyMessage="No subjects found"
      />

      <Modal
        isOpen={showSubjectModal}
        onClose={() => setShowSubjectModal(false)}
        title={editingItem ? 'Edit Subject' : 'Add New Subject'}
      >
        <form onSubmit={handleSubjectSubmit} className="space-y-4">
          <div>
            <label className="form-label">Name</label>
            <Input value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} required />
          </div>
          <div>
            <label className="form-label">Code</label>
            <Input value={subjectForm.code} onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })} required />
          </div>
          <div>
            <label className="form-label">Type</label>
            <Input value={subjectForm.type} onChange={(e) => setSubjectForm({ ...subjectForm, type: e.target.value })} required />
          </div>
          <div>
            <label className="form-label">Credits</label>
            <Input type="number" value={subjectForm.credits} onChange={(e) => setSubjectForm({ ...subjectForm, credits: e.target.value })} />
          </div>
          <div>
            <label className="form-label">Semester</label>
            <Select value={subjectForm.semesterId} onChange={(e) => setSubjectForm({ ...subjectForm, semesterId: e.target.value })} options={semesterOptions} placeholder="Select Semester" required />
          </div>
          <div className="flex space-x-3">
            <Button type="submit" variant="primary" disabled={formLoading}>
              {formLoading ? 'Saving...' : (editingItem ? 'Update' : 'Add') + ' Subject'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowSubjectModal(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );

  const renderDepartments = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-page-title">Departments Management</h1>
          <p className="text-body text-gray-600 mt-2">Manage departments</p>
        </div>
        <Button variant="primary" onClick={handleAddDepartment}>
          + Add Department
        </Button>
      </div>

      <DataTable
        data={allDepartments || []}
        columns={[
          { key: 'name', label: 'Name', sortable: true },
          { key: 'code', label: 'Code', sortable: true },
          {
            key: 'actions' as any,
            label: 'Actions',
            render: (_: any, row: any) => (
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => handleEditDepartment(row)}>
                  Edit
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleDeleteDepartment(row)} disabled={formLoading}>
                  Delete
                </Button>
              </div>
            ),
          },
        ]}
        searchable
        pagination
        pageSize={10}
        emptyMessage="No departments found"
      />

      <Modal
        isOpen={showDepartmentModal}
        onClose={() => setShowDepartmentModal(false)}
        title={editingItem ? 'Edit Department' : 'Add New Department'}
      >
        <form onSubmit={handleDepartmentSubmit} className="space-y-4">
          <div>
            <label className="form-label">Name</label>
            <Input value={departmentForm.name} onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })} required />
          </div>
          <div>
            <label className="form-label">Code</label>
            <Input value={departmentForm.code} onChange={(e) => setDepartmentForm({ ...departmentForm, code: e.target.value })} required />
          </div>
          <div className="flex space-x-3">
            <Button type="submit" variant="primary" disabled={formLoading}>
              {formLoading ? 'Saving...' : (editingItem ? 'Update' : 'Add') + ' Department'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowDepartmentModal(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );

  const renderDivisions = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-page-title">Divisions Management</h1>
          <p className="text-body text-gray-600 mt-2">Manage divisions</p>
        </div>
        <Button variant="primary" onClick={handleAddDivision}>
          + Add Division
        </Button>
      </div>

      <DataTable
        data={allDivisions || []}
        columns={[
          { key: 'name', label: 'Division Name', sortable: true },
          { key: 'semester' as any, label: 'Semester', sortable: true, render: (_: any, row: any) => `Semester ${row?.semester?.number ?? row?.semesterId ?? '-'}` },
          { key: 'createdAt', label: 'Created Date', sortable: true, render: (val) => new Date(val).toLocaleDateString() },
          {
            key: 'actions' as any,
            label: 'Actions',
            render: (_: any, row: any) => (
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => handleEditDivision(row)}>
                  Edit
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleDeleteDivision(row)} disabled={formLoading}>
                  Delete
                </Button>
              </div>
            ),
          },
        ]}
        searchable
        pagination
        pageSize={10}
        emptyMessage="No divisions found"
      />

      <Modal
        isOpen={showDivisionModal}
        onClose={() => setShowDivisionModal(false)}
        title={editingItem ? 'Edit Division' : 'Add New Division'}
      >
        <form onSubmit={handleDivisionSubmit} className="space-y-4">
          <div>
            <label className="form-label">Name</label>
            <Input value={divisionForm.name} onChange={(e) => setDivisionForm({ ...divisionForm, name: e.target.value })} required />
          </div>
          <div>
            <label className="form-label">Semester</label>
            <Select value={divisionForm.semesterId} onChange={(e) => setDivisionForm({ ...divisionForm, semesterId: e.target.value })} options={semesterOptions} placeholder="Select Semester" required />
          </div>
          <div className="flex space-x-3">
            <Button type="submit" variant="primary" disabled={formLoading}>
              {formLoading ? 'Saving...' : (editingItem ? 'Update' : 'Add') + ' Division'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowDivisionModal(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );

  const renderFacultyAssignment = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-page-title">Faculty Subject Assignment</h1>
        <p className="text-body text-gray-600 mt-2">Assign faculty to subjects and divisions</p>
      </div>

      <Card>
        <Card.Header>
          <div className="flex justify-between items-center">
            <h3 className="text-section-title">Filters</h3>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={fetchFacultySubjectAssignments} disabled={facultySubjectLoading}>
                Refresh
              </Button>
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Semester"
              value={selectedSemester || ''}
              onChange={(e) => {
                const sem = e.target.value ? Number(e.target.value) : undefined;
                setSelectedSemester(sem);
                setAssignFacultyId(undefined);
                setAssignSubjectId(undefined);
                setAssignDivisionId(undefined);
              }}
              options={semesterOptions}
              placeholder="Select Semester"
            />
            <Select
              label="Subject"
              value={assignSubjectId || ''}
              onChange={(e) => setAssignSubjectId(e.target.value ? Number(e.target.value) : undefined)}
              options={subjectOptions}
              placeholder="Select Subject"
              disabled={!selectedSemester}
            />
            <Select
              label="Division"
              value={assignDivisionId || ''}
              onChange={(e) => setAssignDivisionId(e.target.value ? Number(e.target.value) : undefined)}
              options={divisionOptions}
              placeholder="Select Division"
              disabled={!selectedSemester}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Select
              label="Faculty"
              value={assignFacultyId || ''}
              onChange={(e) => setAssignFacultyId(e.target.value ? Number(e.target.value) : undefined)}
              options={facultyOptions}
              placeholder="Select Faculty"
            />
            <div className="flex items-end justify-end">
              <Button variant="primary" onClick={handleCreateFacultySubjectAssignment} disabled={facultySubjectLoading}>
                Assign
              </Button>
            </div>
          </div>

          {facultySubjectError && (
            <div className="mt-4 p-3 rounded bg-red-50 text-red-800 border border-red-200">
              {facultySubjectError}
            </div>
          )}
        </Card.Body>
      </Card>

      <DataTable
        data={facultySubjectAssignments || []}
        columns={[
          { key: 'faculty' as any, label: 'Faculty', render: (_: any, row: any) => row?.faculty?.name || '-' },
          { key: 'subject' as any, label: 'Subject', render: (_: any, row: any) => row?.subject?.name ? `${row.subject.name}${row.subject.code ? ` (${row.subject.code})` : ''}` : '-' },
          { key: 'division' as any, label: 'Division', render: (_: any, row: any) => row?.division?.name || '-' },
          { key: 'semester' as any, label: 'Semester', render: (_: any, row: any) => row?.subject?.semester?.number ? `Semester ${row.subject.semester.number}` : '-' },
          {
            key: 'actions' as any,
            label: 'Actions',
            render: (_: any, row: any) => (
              <Button variant="danger" size="sm" onClick={() => handleRemoveFacultySubjectAssignment(row)} disabled={facultySubjectLoading}>
                Remove
              </Button>
            ),
          },
        ]}
        searchable
        pagination
        pageSize={10}
        emptyMessage={facultySubjectLoading ? 'Loading...' : 'No assignments found'}
      />
    </div>
  );

  const renderPromotion = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-page-title">Promote Students</h1>
        <p className="text-body text-gray-600 mt-2">Preview and promote students to the next semester</p>
      </div>

      <Card>
        <Card.Header>
          <h3 className="text-section-title">Promotion Controls</h3>
        </Card.Header>
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="From Semester"
              value={selectedSemester || ''}
              onChange={(e) => {
                const sem = e.target.value ? Number(e.target.value) : undefined;
                setSelectedSemester(sem);
                setPromotionPreview(null);
                setPromotionError(null);
              }}
              options={semesterOptions}
              placeholder="Select Semester"
            />
            <div className="flex items-end justify-end gap-2">
              <Button variant="secondary" onClick={fetchPromotionPreview} disabled={promotionLoading}>
                Preview
              </Button>
              <Button variant="primary" onClick={executePromotion} disabled={promotionLoading || !promotionPreview}>
                Execute
              </Button>
            </div>
          </div>

          {promotionError && (
            <div className="mt-4 p-3 rounded bg-red-50 text-red-800 border border-red-200">
              {promotionError}
            </div>
          )}

          {promotionPreview && (
            <div className="mt-6 space-y-4">
              <div className="p-4 rounded border border-gray-200 bg-gray-50">
                <div className="text-sm text-gray-700">
                  From: <span className="font-medium">Semester {promotionPreview?.from?.number}</span>
                </div>
                <div className="text-sm text-gray-700">
                  To: <span className="font-medium">{promotionPreview?.willPassOut ? 'PASSED OUT' : `Semester ${promotionPreview?.to?.number ?? '-'}`}</span>
                </div>
                <div className="text-sm text-gray-700">
                  Total Students Affected: <span className="font-medium">{promotionPreview?.totalStudents ?? 0}</span>
                </div>
              </div>

              <DataTable
                data={Array.isArray(promotionPreview?.preview) ? promotionPreview.preview : []}
                columns={[
                  { key: 'enrollmentNo' as any, label: 'Enrollment No', sortable: true },
                  { key: 'name' as any, label: 'Name', sortable: true },
                  { key: 'id' as any, label: 'Student ID', sortable: true },
                ]}
                searchable
                pagination
                pageSize={10}
                emptyMessage="No students found"
              />
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-page-title">Reports & Analytics</h1>
        <p className="text-body text-gray-600 mt-2">System reports and statistical analysis</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <Card.Header>
            <h3 className="text-lg font-semibold text-gray-900">Student Statistics</h3>
          </Card.Header>
          <Card.Body>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Students:</span>
                <span className="font-semibold">{stats?.students || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active This Semester:</span>
                <span className="font-semibold">{Math.floor((stats?.students || 0) * 0.8)}</span>
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <h3 className="text-lg font-semibold text-gray-900">Faculty Statistics</h3>
          </Card.Header>
          <Card.Body>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Faculty:</span>
                <span className="font-semibold">{stats?.faculty || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active Faculty:</span>
                <span className="font-semibold">{Math.floor((stats?.faculty || 0) * 0.9)}</span>
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <h3 className="text-lg font-semibold text-gray-900">Academic Statistics</h3>
          </Card.Header>
          <Card.Body>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Subjects:</span>
                <span className="font-semibold">{allSubjects.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Divisions:</span>
                <span className="font-semibold">{allDivisions.length || 0}</span>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>
    </div>
  );

  if (loading) {
    return (
      <ModernLayout title="Admin Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </ModernLayout>
    );
  }

  if (error) {
    return (
      <ModernLayout title="Admin Dashboard">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">Error: {error}</div>
          <Button
            onClick={fetchDashboardData}
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
    <ModernLayout title="Admin Dashboard">
      {/* Main Content */}
      <div>
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'students' && renderStudents()}
        {activeTab === 'faculty' && renderFaculty()}
        {activeTab === 'departments' && renderDepartments()}
        {activeTab === 'divisions' && renderDivisions()}
        {activeTab === 'subjects' && renderSubjects()}
        {activeTab === 'notices' && renderNotices()}
        {activeTab === 'faculty-assignment' && renderFacultyAssignment()}
        {activeTab === 'promotion' && renderPromotion()}
        {activeTab === 'reports' && renderReports()}
      </div>
    </ModernLayout>
  );
};

export default ModernAdminDashboard;
