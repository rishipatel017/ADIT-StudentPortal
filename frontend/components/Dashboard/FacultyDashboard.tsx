import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { facultyService, Faculty } from '../../services/user.service';
import { departmentService, Department } from '../../services/academic.service';

interface FacultyStats {
  totalSubjects: number;
  totalAssignments: number;
  totalMarksUploads: number;
  totalAttendanceSessions: number;
  activeAssignments: number;
  recentActivity: number;
  averageSubmissionRate: number;
  totalStudentsTaught: number;
}

interface FacultyWorkload {
  id: number;
  name: string;
  subjects: Array<{
    subject: {
      id: number;
      name: string;
      code: string;
      type: string;
      credits: number;
      semester: {
        number: number;
        department: {
          name: string;
        };
      };
      assignments: Array<{
        id: number;
        title: string;
        dueDate: string;
        _count: {
          submissions: number;
        };
      }>;
      attendanceSessions: Array<{
        id: number;
        lectureDate: string;
        _count: {
          records: number;
        };
      }>;
      marksUploads: Array<{
        id: number;
        uploadedAt: string;
        _count: {
          marks: number;
        };
      }>;
    };
    division: {
      id: number;
      name: string;
      semester: {
        number: number;
      };
      _count: {
        students: number;
      };
    };
  }>;
}

const FacultyDashboard: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [facultyData, setFacultyData] = useState<Faculty | null>(null);
  const [facultyStats, setFacultyStats] = useState<FacultyStats | null>(null);
  const [workload, setWorkload] = useState<FacultyWorkload | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFacultyData = async () => {
      if (!user?.faculty?.id) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch faculty details, stats, workload, and department in parallel
        const [facultyDetails, stats, facultyWorkload, departmentDetails] = await Promise.all([
          facultyService.getFacultyById(user.faculty.id),
          facultyService.getFacultyStats(user.faculty.id),
          facultyService.getFacultyWithWorkload(user.faculty.id),
          departmentService.getDepartmentById(user.faculty.departmentId)
        ]);

        setFacultyData(facultyDetails);
        setFacultyStats(stats);
        setWorkload(facultyWorkload as any); // Type assertion to handle interface mismatch
        setDepartment(departmentDetails);
      } catch (err) {
        console.error('Failed to fetch faculty data:', err);
        setError('Failed to load faculty data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (!isLoading && user?.faculty) {
      fetchFacultyData();
    }
  }, [user, isLoading]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!user?.faculty) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Faculty data not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {facultyData?.name || user.faculty.name}!
          </h1>
          <p className="text-gray-600 mt-2">
            {facultyData?.designation || user.faculty.designation} • {department?.name || 'Department'}
          </p>
          <p className="text-sm text-gray-500">
            {facultyData?.email || user.faculty.email}
          </p>
        </div>

        {/* Stats Grid */}
        {facultyStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Subjects</dt>
                    <dd className="text-lg font-medium text-gray-900">{facultyStats.totalSubjects}</dd>
                    <dd className="text-xs text-gray-500">{facultyStats.totalStudentsTaught} students</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Assignments</dt>
                    <dd className="text-lg font-medium text-gray-900">{facultyStats.totalAssignments}</dd>
                    <dd className="text-xs text-gray-500">{facultyStats.activeAssignments} active</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Submission Rate</dt>
                    <dd className="text-lg font-medium text-gray-900">{facultyStats.averageSubmissionRate.toFixed(1)}%</dd>
                    <dd className="text-xs text-gray-500">Average across all</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Recent Activity</dt>
                    <dd className="text-lg font-medium text-gray-900">{facultyStats.recentActivity}</dd>
                    <dd className="text-xs text-gray-500">Actions this week</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Subjects and Workload */}
        {workload && (
          <div className="bg-white shadow rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Your Teaching Schedule</h3>
              <div className="space-y-6">
                {workload.subjects.map((assignment, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-md font-medium text-gray-900">{assignment.subject.name}</h4>
                        <p className="text-sm text-gray-500">{assignment.subject.code}</p>
                        <p className="text-xs text-gray-400">
                          {assignment.subject.semester.department.name} - Semester {assignment.subject.semester.number} • {assignment.division.name}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {assignment.subject.credits} credits
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {assignment.subject.type}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {assignment.division._count.students} students
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Assignments */}
                      <div className="bg-gray-50 rounded p-3">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Recent Assignments</h5>
                        <div className="space-y-1">
                          {assignment.subject.assignments.slice(0, 3).map((assignmentItem) => (
                            <div key={assignmentItem.id} className="text-xs">
                              <p className="font-medium text-gray-900">{assignmentItem.title}</p>
                              <p className="text-gray-500">
                                Due: {new Date(assignmentItem.dueDate).toLocaleDateString()} • 
                                {assignmentItem._count.submissions} submissions
                              </p>
                            </div>
                          ))}
                          {assignment.subject.assignments.length === 0 && (
                            <p className="text-xs text-gray-500">No assignments yet</p>
                          )}
                        </div>
                      </div>

                      {/* Attendance Sessions */}
                      <div className="bg-gray-50 rounded p-3">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Recent Lectures</h5>
                        <div className="space-y-1">
                          {assignment.subject.attendanceSessions.slice(0, 3).map((session) => (
                            <div key={session.id} className="text-xs">
                              <p className="font-medium text-gray-900">Lecture {session.id}</p>
                              <p className="text-gray-500">
                                {new Date(session.lectureDate).toLocaleDateString()} • 
                                {session._count.records} present
                              </p>
                            </div>
                          ))}
                          {assignment.subject.attendanceSessions.length === 0 && (
                            <p className="text-xs text-gray-500">No lectures yet</p>
                          )}
                        </div>
                      </div>

                      {/* Marks Uploads */}
                      <div className="bg-gray-50 rounded p-3">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Recent Evaluations</h5>
                        <div className="space-y-1">
                          {assignment.subject.marksUploads.slice(0, 3).map((marksUpload) => (
                            <div key={marksUpload.id} className="text-xs">
                              <p className="font-medium text-gray-900">Evaluation {marksUpload.id}</p>
                              <p className="text-gray-500">
                                {new Date(marksUpload.uploadedAt).toLocaleDateString()} • 
                                {marksUpload._count.marks} students evaluated
                              </p>
                            </div>
                          ))}
                          {assignment.subject.marksUploads.length === 0 && (
                            <p className="text-xs text-gray-500">No evaluations yet</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="ml-3 text-lg font-medium text-gray-900">Create Assignment</h3>
            </div>
            <p className="text-sm text-gray-500">Create new assignments for your subjects</p>
          </div>

          <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="ml-3 text-lg font-medium text-gray-900">Mark Attendance</h3>
            </div>
            <p className="text-sm text-gray-500">Record attendance for your classes</p>
          </div>

          <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="ml-3 text-lg font-medium text-gray-900">Upload Marks</h3>
            </div>
            <p className="text-sm text-gray-500">Upload and manage student marks</p>
          </div>

          <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="ml-3 text-lg font-medium text-gray-900">View Students</h3>
            </div>
            <p className="text-sm text-gray-500">Manage your student lists</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;
