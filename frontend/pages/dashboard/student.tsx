import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ModernLayout from '../../components/Layout/ModernLayout';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Card, DataTable, StatCard, Modal, Input } from '../../components/UI';
import { useSemesters, useSubjects, useDivisions } from '../../hooks/useAcademicData';
import { studentService, Student } from '../../services/user.service';
import { subjectService } from '../../services/academic.service';
import api from '../../services/api';
import { AuthGuard } from '../../components/Auth/AuthGuard';
import { useStudentStats, useAssignments, useNotices, useAttendance } from '../../hooks/useDashboardData';
import { academicService, Subject } from '../../services/academicService';
import { ChatComponent } from '../../components/Chat/ChatComponent';

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
  dueDate: string;
  submitted: boolean;
  grade?: number;
}

interface AssignmentSubmissionDraft {
  assignmentId: number;
  title: string;
  file: File | null;
  remarks: string;
}

interface Notice {
  id: number;
  title: string;
  content: string;
  date: string;
  type: string;
}

const getNoticeDateValue = (notice: any): string | null => {
  const raw = notice?.date || notice?.createdAt || notice?.publishedAt || notice?.updatedAt;
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
};

const formatNoticeDate = (notice: any): string => {
  const iso = getNoticeDateValue(notice);
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString();
};

interface AttendanceRecord {
  id: number;
  date: string;
  subject: string;
  lectureNumber: number;
  status: boolean;
}

interface Mark {
  id: number;
  subject: string;
  assignment: string;
  marksObtained: number;
  maxMarks: number;
  grade: string;
  date: string;
}

interface StudentStats {
  totalAssignments: number;
  submittedAssignments: number;
  pendingAssignments: number;
  totalAttendanceSessions: number;
  presentSessions: number;
  attendancePercentage: number;
  totalMarksUploads: number;
  averageMarks: number;
  latestGPA: number;
}

const normalizeArray = (value: any): any[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (Array.isArray(value.data)) return value.data;
  if (Array.isArray(value.items)) return value.items;
  if (Array.isArray(value.assignments)) return value.assignments;
  if (Array.isArray(value.notices)) return value.notices;
  if (Array.isArray(value.attendance)) return value.attendance;
  if (Array.isArray(value.records)) return value.records;
  return [];
};

const getSubjectLabel = (subject: any): string => {
  if (!subject) return '';
  if (typeof subject === 'string') return subject;
  if (typeof subject === 'object') return subject.name || subject.code || '';
  return '';
};

const ModernStudentDashboard: React.FC = () => {
  return (
    <AuthGuard allowedRoles={['STUDENT']}>
      <StudentDashboardContent />
    </AuthGuard>
  );
};

const StudentDashboardContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [isInitialized, setIsInitialized] = useState(false);
  const [profileForm, setProfileForm] = useState<{ name?: string; email?: string }>({});
  const [passwordForm, setPasswordForm] = useState<{ currentPassword: string; newPassword: string }>({ currentPassword: '', newPassword: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectsError, setSubjectsError] = useState<string | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submitDraft, setSubmitDraft] = useState<AssignmentSubmissionDraft | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<any | null>(null);
  
  // Use new data fetching hooks with error handling
  const { data: stats, loading: statsLoading, error: statsError, refetch: refetchStats, clearError: clearStatsError } = useStudentStats(user?.student?.id);
  const { data: assignments, loading: assignmentsLoading, error: assignmentsError, refetch: refetchAssignments, clearError: clearAssignmentsError } = useAssignments();
  const { data: notices, loading: noticesLoading, error: noticesError, refetch: refetchNotices, clearError: clearNoticesError } = useNotices('student');
  const { data: attendance, loading: attendanceLoading, error: attendanceError, refetch: refetchAttendance, clearError: clearAttendanceError } = useAttendance(user?.student?.id);
  
  const [studentData, setStudentData] = useState<Student | null>(null);
  const [marks, setMarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!user?.student?.id) {
      setError('Student profile not found. Please contact administrator.');
      setIsInitialized(true);
      return;
    }
    setIsInitialized(true);
  }, [isLoading, user?.student?.id]);

  useEffect(() => {
    const tab = typeof router.query.tab === 'string' ? router.query.tab : undefined;
    if (!tab) {
      setActiveTab('overview');
      return;
    }

    const allowed = ['overview', 'subjects', 'assignments', 'attendance', 'marks', 'notices', 'chat', 'profile'];
    setActiveTab(allowed.includes(tab) ? tab : 'overview');
  }, [router.query.tab]);

  const fetchStudentSubjects = async () => {
    const semesterId = user?.student?.semesterId;
    if (!semesterId) {
      setSubjects([]);
      setSubjectsError('Semester information not found.');
      return;
    }

    setSubjectsLoading(true);
    setSubjectsError(null);
    try {
      const response = await api.get('/academic/subjects', {
        params: {
          semesterId,
        },
      });
      setSubjects(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      console.error('Failed to fetch subjects:', err);
      const status = err?.response?.status;
      const message = err?.response?.data?.message || err?.message;
      setSubjectsError(status ? `Failed to load subjects (HTTP ${status}). ${message || ''}`.trim() : (message || 'Failed to load subjects'));
    } finally {
      setSubjectsLoading(false);
    }
  };

  useEffect(() => {
    if (!isInitialized) return;
    if (activeTab !== 'subjects') return;
    fetchStudentSubjects();
  }, [activeTab, isInitialized]);

  // Academic data hooks
  const { semesters } = useSemesters();
  const [selectedSemester, setSelectedSemester] = useState<number | undefined>();
  const { subjects: hookSubjects } = useSubjects(selectedSemester);

  useEffect(() => {
    if (user?.student?.id) {
      fetchStudentData();
    }
  }, [user]);

  const computeGrade = (percentage: number): string => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
  };

  const normalizeMarks = (rawMarks: any[]): Mark[] => {
    return rawMarks.map((m: any) => {
      const obtained = Number(m?.marksObtained ?? 0);
      const max = Number(m?.upload?.maxMarks ?? 0);
      const percentage = max > 0 ? (obtained / max) * 100 : 0;
      return {
        id: m?.id ?? 0,
        subject: m?.upload?.subject?.name || m?.upload?.subject?.code || 'N/A',
        assignment: 'Assessment',
        marksObtained: obtained,
        maxMarks: max,
        grade: m?.grade || computeGrade(percentage),
        date: m?.upload?.uploadedAt || m?.createdAt || '',
      };
    });
  };

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user?.student?.id) {
        throw new Error('Student ID not found');
      }

      // Fetch student specific data
      const [studentDetails, studentMarks] = await Promise.all([
        api.get('/student/profile'),
        api.get('/student/marks')
      ]);

      setStudentData((studentDetails as any)?.data ?? studentDetails);
      const profile = (studentDetails as any)?.data ?? studentDetails;
      setProfileForm({
        name: profile?.name,
        email: profile?.email,
      });
      const rawMarks = normalizeArray((studentMarks as any)?.data ?? studentMarks);
      setMarks(normalizeMarks(rawMarks));
    } catch (err: any) {
      console.error('Failed to fetch student data:', err);
      setError(err.message || 'Failed to load student data');
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      setProfileSaving(true);
      await api.put('/student/profile', profileForm);
      await fetchStudentData();
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const changePassword = async () => {
    try {
      setPasswordSaving(true);
      await api.post('/auth/change-password', passwordForm);
      setPasswordForm({ currentPassword: '', newPassword: '' });
    } catch (err: any) {
      console.error('Failed to change password:', err);
      setError(err.response?.data?.message || err.message || 'Failed to change password');
    } finally {
      setPasswordSaving(false);
    }
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
      render: (value: any) => getSubjectLabel(value),
    },
    {
      key: 'dueDate' as keyof Assignment,
      label: 'Due Date',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'submitted' as keyof Assignment,
      label: 'Status',
      render: (value: boolean) => (
        <span className={`badge ${value ? 'badge-green' : 'badge-yellow'}`}>
          {value ? 'Submitted' : 'Pending'}
        </span>
      ),
    },
    {
      key: 'grade' as keyof Assignment,
      label: 'Grade',
      render: (value?: number) => value ? `${value}%` : '-',
    },
    {
      key: 'id' as keyof Assignment,
      label: 'Actions',
      render: (_: any, row: any) => {
        const isSubmitted = !!row?.submitted;
        const hasAttachment = !!row?.attachment;
        return (
          <div className="flex items-center gap-2">
            {hasAttachment && (
              <Button
                variant="secondary"
                onClick={async () => {
                  try {
                    const res = await api.get(`/assignments/${row.id}/attachment`, {
                      responseType: 'blob',
                    });

                    const filenameFromHeader = (() => {
                      const header = res.headers?.['content-disposition'] as string | undefined;
                      if (!header) return undefined;
                      const match = /filename="?([^";]+)"?/i.exec(header);
                      return match?.[1];
                    })();

                    const filename = filenameFromHeader || 'assignment-attachment';
                    const blobUrl = window.URL.createObjectURL(res.data);
                    const link = document.createElement('a');
                    link.href = blobUrl;
                    link.download = filename;
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    window.URL.revokeObjectURL(blobUrl);
                  } catch (e: any) {
                    console.error('Failed to download attachment:', e);
                    setError(e?.response?.data?.message || e?.message || 'Failed to download attachment');
                  }
                }}
              >
                Attachment
              </Button>
            )}
            <Button
              variant="primary"
              disabled={isSubmitted}
              onClick={() => {
                setSubmitError(null);
                setSubmitDraft({
                  assignmentId: row.id,
                  title: row.title,
                  file: null,
                  remarks: '',
                });
                setIsSubmitModalOpen(true);
              }}
            >
              {isSubmitted ? 'Submitted' : 'Submit'}
            </Button>
          </div>
        );
      },
    },
    {
      key: 'id' as keyof Notice,
      label: 'Actions',
      render: (_: any, row: any) => (
        <Button
          variant="secondary"
          onClick={() => {
            setSelectedNotice(row);
            setIsNoticeModalOpen(true);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  const submitAssignment = async () => {
    if (!submitDraft) return;
    if (!submitDraft.file) {
      setSubmitError('Please select a PDF file to upload.');
      return;
    }
    if (submitDraft.file.type !== 'application/pdf') {
      setSubmitError('Only PDF files are allowed.');
      return;
    }

    setSubmitLoading(true);
    setSubmitError(null);
    try {
      const form = new FormData();
      form.append('file', submitDraft.file);
      if (submitDraft.remarks) {
        form.append('remarks', submitDraft.remarks);
      }

      await api.post(`/assignments/${submitDraft.assignmentId}/submit`, form, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setIsSubmitModalOpen(false);
      setSubmitDraft(null);
      await refetchAssignments();
    } catch (err: any) {
      console.error('Failed to submit assignment:', err);
      setSubmitError(err?.response?.data?.message || err?.message || 'Failed to submit assignment');
    } finally {
      setSubmitLoading(false);
    }
  };

  const noticeColumns = [
    {
      key: 'title' as keyof Notice,
      label: 'Title',
      sortable: true,
    },
    {
      key: 'date' as keyof Notice,
      label: 'Date',
      sortable: true,
      render: (_: any, row: any) => formatNoticeDate(row),
    },
    {
      key: 'type' as keyof Notice,
      label: 'Type',
      render: (value: any) => {
        const safeValue = typeof value === 'string' ? value : '';
        const normalized = safeValue.toLowerCase();
        const badgeClass = normalized === 'exam'
          ? 'badge-red'
          : normalized === 'info'
            ? 'badge-blue'
            : 'badge-green';
        const label = safeValue ? safeValue.toUpperCase() : 'GENERAL';
        return (
          <span className={`badge ${badgeClass}`}>
            {label}
          </span>
        );
      },
    },
  ];

  const attendanceColumns = [
    {
      key: 'date' as keyof AttendanceRecord,
      label: 'Date',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'subject' as keyof AttendanceRecord,
      label: 'Subject',
      sortable: true,
    },
    {
      key: 'lectureNumber' as keyof AttendanceRecord,
      label: 'Lecture',
      sortable: true,
    },
    {
      key: 'status' as keyof AttendanceRecord,
      label: 'Status',
      render: (value: boolean) => (
        <span className={`badge ${value ? 'badge-green' : 'badge-red'}`}>
          {value ? 'Present' : 'Absent'}
        </span>
      ),
    },
  ];

  const marksColumns = [
    {
      key: 'subject' as keyof Mark,
      label: 'Subject',
      sortable: true,
    },
    {
      key: 'assignment' as keyof Mark,
      label: 'Assignment',
      sortable: true,
    },
    {
      key: 'marksObtained' as keyof Mark,
      label: 'Marks',
      sortable: true,
      render: (value: number, row: Mark) => `${value}/${row.maxMarks}`,
    },
    {
      key: 'grade' as keyof Mark,
      label: 'Grade',
      sortable: true,
      render: (value: string) => (
        <span className={`badge ${
          value === 'A+' || value === 'A' ? 'badge-green' :
          value === 'B+' || value === 'B' ? 'badge-blue' :
          'badge-yellow'
        }`}>
          {value}
        </span>
      ),
    },
    {
      key: 'date' as keyof Mark,
      label: 'Date',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
  ];

  const safeStats: StudentStats = {
    totalAssignments: 0,
    submittedAssignments: 0,
    pendingAssignments: 0,
    totalAttendanceSessions: 0,
    presentSessions: 0,
    attendancePercentage: 0,
    totalMarksUploads: 0,
    averageMarks: 0,
    latestGPA: 0,
    ...(stats as any),
  };

  const safeAssignments: any[] = normalizeArray(assignments);
  const safeNotices: any[] = normalizeArray(notices);
  const safeAttendance: any[] = normalizeArray(attendance);

  const dashboardLoading = loading || statsLoading || assignmentsLoading || noticesLoading || attendanceLoading;
  const dashboardError = error || statsError || assignmentsError || noticesError || attendanceError;

  // Show loading while initializing
  if (!isInitialized || dashboardLoading) {
    return (
      <ModernLayout title="Student Dashboard">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </ModernLayout>
    );
  }

  if (dashboardError) {
    return (
      <ModernLayout title="Student Dashboard">
        <div className="max-w-2xl mx-auto mt-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <span className="text-3xl mr-3">⚠️</span>
              <h3 className="text-lg font-semibold text-red-800">Error Loading Dashboard</h3>
            </div>
            <p className="text-red-700 mb-4">{dashboardError}</p>
            <div className="flex space-x-3">
              <Button
                onClick={() => {
                  setError(null);
                  clearStatsError();
                  clearAssignmentsError();
                  clearNoticesError();
                  clearAttendanceError();
                  fetchStudentData();
                  refetchStats();
                  refetchAssignments();
                  refetchNotices();
                  refetchAttendance();
                }}
                variant="danger"
              >
                Retry
              </Button>
              <Button
                onClick={() => window.location.href = '/dashboard'}
                variant="secondary"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </ModernLayout>
    );
  }

  // Main content without top navigation tabs
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Welcome back, {user?.student?.name || user?.email}! 👨‍🎓</h1>
              <p className="text-gray-600 mt-1">Track your academic progress and stay updated</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Assignments"
                value={safeStats.totalAssignments}
                subtitle="This Semester"
                icon={<span className="text-3xl">📝</span>}
                variant="primary"
              />
              <StatCard
                title="Submitted"
                value={safeStats.submittedAssignments}
                subtitle="Completed"
                icon={<span className="text-3xl">✅</span>}
                variant="success"
              />
              <StatCard
                title="Attendance"
                value={`${safeStats.attendancePercentage.toFixed(1)}%`}
                subtitle="This Month"
                icon={<span className="text-3xl">📊</span>}
                variant="warning"
              />
              <StatCard
                title="Current GPA"
                value={safeStats.latestGPA.toFixed(2)}
                subtitle="Out of 10.0"
                icon={<span className="text-3xl">🏆</span>}
                variant="purple"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <Card.Header>
                  <h3 className="text-lg font-medium text-gray-900">Recent Assignments</h3>
                </Card.Header>
                <Card.Body>
                  <div className="space-y-3">
                    {safeAssignments.slice(0, 3).map((assignment) => (
                      <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{assignment.title}</p>
                          <p className="text-sm text-gray-600">{getSubjectLabel(assignment.subject)}</p>
                        </div>
                        <div className="text-right">
                          <span className={`badge ${assignment.submitted ? 'badge-green' : 'badge-yellow'}`}>
                            {assignment.submitted ? 'Submitted' : 'Pending'}
                          </span>
                          {assignment.grade && (
                            <p className="text-xs text-gray-500 mt-1">{assignment.grade}%</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>

              <Card>
                <Card.Header>
                  <h3 className="text-lg font-medium text-gray-900">Latest Notices</h3>
                </Card.Header>
                <Card.Body>
                  <div className="space-y-3">
                    {safeNotices.slice(0, 3).map((notice) => (
                      <div key={notice.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{notice.title}</p>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notice.content}</p>
                          </div>
                          {(() => {
                            const typeValue = typeof notice.type === 'string' ? notice.type : '';
                            const normalizedType = typeValue.toLowerCase();
                            const badgeClass = normalizedType === 'exam'
                              ? 'badge-red'
                              : normalizedType === 'info'
                                ? 'badge-blue'
                                : 'badge-green';
                            const label = typeValue ? typeValue.toUpperCase() : 'GENERAL';
                            return (
                              <span className={`badge ml-2 ${badgeClass}`}>
                                {label}
                              </span>
                            );
                          })()}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {formatNoticeDate(notice)}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </div>
          </div>
        );

      case 'subjects':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">My Subjects</h1>
              <p className="text-gray-600 mt-1">Subjects for your current semester</p>
            </div>

            {subjectsLoading ? (
              <div className="flex items-center justify-center min-h-[40vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            ) : subjectsError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <p className="text-red-800 mb-4">{subjectsError}</p>
                <Button onClick={fetchStudentSubjects} variant="danger">Retry</Button>
              </div>
            ) : (
              <DataTable
                data={Array.isArray(subjects) ? (subjects as any) : []}
                columns={[
                  { key: 'code' as any, label: 'Code', sortable: true },
                  { key: 'name' as any, label: 'Name', sortable: true },
                  { key: 'type' as any, label: 'Type', sortable: true },
                  { key: 'credits' as any, label: 'Credits', sortable: true },
                  {
                    key: '_count' as any,
                    label: 'Assignments',
                    render: (value: any) => {
                      const count = value?.assignments;
                      return typeof count === 'number' ? count : '-';
                    },
                  },
                ]}
                searchable
                pagination
                pageSize={10}
                emptyMessage="No subjects found"
              />
            )}
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
              <p className="text-gray-600 mt-1">Update your details and password</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <Card.Header>
                  <h3 className="text-lg font-medium text-gray-900">Personal Details</h3>
                </Card.Header>
                <Card.Body>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Enrollment No</p>
                        <p className="text-sm text-gray-900">{studentData?.enrollmentNo || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Student ID</p>
                        <p className="text-sm text-gray-900">{studentData?.id ?? '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Department</p>
                        <p className="text-sm text-gray-900">{studentData?.department?.name || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Division</p>
                        <p className="text-sm text-gray-900">{studentData?.division?.name || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Semester</p>
                        <p className="text-sm text-gray-900">{studentData?.semester?.number ? `Semester ${studentData.semester.number}` : '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Email (Login)</p>
                        <p className="text-sm text-gray-900">{studentData?.email || user?.email || '-'}</p>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4" />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        value={profileForm.name || ''}
                        onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        value={profileForm.email || ''}
                        onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
                      />
                    </div>
                    <Button onClick={saveProfile} disabled={profileSaving}>
                      {profileSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </Card.Body>
              </Card>

              <Card>
                <Card.Header>
                  <h3 className="text-lg font-medium text-gray-900">Change Password</h3>
                </Card.Header>
                <Card.Body>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Old Password</label>
                      <input
                        type="password"
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                      <input
                        type="password"
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                      />
                    </div>
                    <Button onClick={changePassword} disabled={passwordSaving}>
                      {passwordSaving ? 'Updating...' : 'Update Password'}
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </div>
          </div>
        );

      case 'assignments':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">My Assignments</h1>
              <p className="text-gray-600 mt-1">View and manage your assignments</p>
            </div>
            
            <DataTable
              data={safeAssignments}
              columns={assignmentColumns}
              searchable
              pagination
              pageSize={10}
              emptyMessage="No assignments found"
            />

            <Modal
              isOpen={isSubmitModalOpen}
              onClose={() => {
                if (submitLoading) return;
                setIsSubmitModalOpen(false);
                setSubmitDraft(null);
                setSubmitError(null);
              }}
              title={submitDraft ? `Submit: ${submitDraft.title}` : 'Submit Assignment'}
            >
              <div className="space-y-4">
                {submitError && (
                  <div className="p-3 rounded bg-red-50 text-red-800 border border-red-200">
                    {submitError}
                  </div>
                )}

                <div>
                  <label className="form-label">PDF File</label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setSubmitDraft((prev) => prev ? ({ ...prev, file }) : prev);
                    }}
                    className="form-input"
                    disabled={submitLoading}
                  />
                  <p className="text-xs text-gray-500 mt-1">Only PDF. Max 10MB.</p>
                </div>

                <div>
                  <label className="form-label">Remarks (optional)</label>
                  <Input
                    value={submitDraft?.remarks || ''}
                    onChange={(e) => setSubmitDraft((prev) => prev ? ({ ...prev, remarks: e.target.value }) : prev)}
                    disabled={submitLoading}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="primary"
                    onClick={submitAssignment}
                    disabled={submitLoading}
                  >
                    {submitLoading ? 'Submitting...' : 'Submit'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      if (submitLoading) return;
                      setIsSubmitModalOpen(false);
                      setSubmitDraft(null);
                      setSubmitError(null);
                    }}
                    disabled={submitLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Modal>
          </div>
        );

      case 'attendance':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">My Attendance</h1>
              <p className="text-gray-600 mt-1">Track your attendance record</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <StatCard
                title="Total Lectures"
                value={safeAttendance.length}
                subtitle="This Month"
                icon={<span className="text-3xl">📊</span>}
                variant="primary"
              />
              <StatCard
                title="Present"
                value={safeAttendance.filter(a => a.status).length}
                subtitle="Lectures Attended"
                icon={<span className="text-3xl">✅</span>}
                variant="success"
              />
              <StatCard
                title="Absent"
                value={safeAttendance.filter(a => !a.status).length}
                subtitle="Lectures Missed"
                icon={<span className="text-3xl">❌</span>}
                variant="error"
              />
              <StatCard
                title="Percentage"
                value={`${safeAttendance.length ? Math.round((safeAttendance.filter(a => a.status).length / safeAttendance.length) * 100) : 0}%`}
                subtitle="Attendance Rate"
                icon={<span className="text-3xl">📈</span>}
                variant="warning"
              />
            </div>
            
            <DataTable
              data={safeAttendance}
              columns={attendanceColumns}
              searchable
              pagination
              pageSize={15}
              emptyMessage="No attendance records found"
            />
          </div>
        );

      case 'marks':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">My Marks</h1>
              <p className="text-gray-600 mt-1">View your academic performance</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <StatCard
                title="Average Score"
                value={`${marks.length ? Math.round(marks.reduce((acc, m) => acc + (m.maxMarks > 0 ? (m.marksObtained / m.maxMarks) * 100 : 0), 0) / marks.length) : 0}%`}
                subtitle="Overall Performance"
                icon={<span className="text-3xl">📈</span>}
                variant="primary"
              />
              <StatCard
                title="Highest Score"
                value={`${marks.length ? Math.round(Math.max(...marks.map(m => m.maxMarks > 0 ? (m.marksObtained / m.maxMarks) * 100 : 0))) : 0}%`}
                subtitle="Best Performance"
                icon={<span className="text-3xl">🏆</span>}
                variant="success"
              />
              <StatCard
                title="Total Evaluations"
                value={marks.length}
                subtitle="Assessments"
                icon={<span className="text-3xl">📝</span>}
                variant="purple"
              />
            </div>
            
            <DataTable
              data={marks}
              columns={marksColumns}
              searchable
              pagination
              pageSize={10}
              emptyMessage="No marks found"
            />
          </div>
        );

      case 'notices':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Notices</h1>
              <p className="text-gray-600 mt-1">Stay updated with latest announcements</p>
            </div>
            
            <DataTable
              data={safeNotices}
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
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Date</p>
                    <p className="text-sm text-gray-900">{formatNoticeDate(selectedNotice)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Type</p>
                    <p className="text-sm text-gray-900">{(typeof selectedNotice?.type === 'string' && selectedNotice.type) ? selectedNotice.type.toUpperCase() : 'GENERAL'}</p>
                  </div>
                </div>

                <div className="border-t border-gray-200" />

                <div>
                  <p className="text-xs text-gray-500 mb-1">Content</p>
                  <div className="text-sm text-gray-900 whitespace-pre-wrap">
                    {selectedNotice?.content || '-'}
                  </div>
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
        );

      case 'chat':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Department Chat</h1>
              <p className="text-gray-600 mt-1">Chat with students and faculty in your department</p>
            </div>
            {studentData && (
              <ChatComponent
                context="STUDENT"
                defaultDepartmentId={studentData.departmentId}
                defaultSemesterId={studentData.semesterId}
                defaultDivisionId={studentData.divisionId}
              />
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <ModernLayout title="Student Dashboard">
      {/* Side navigation (handled by ModernLayout) */}
      <div className="flex-1 p-6">
        {renderContent()}
      </div>
    </ModernLayout>
  );
};

export default ModernStudentDashboard;