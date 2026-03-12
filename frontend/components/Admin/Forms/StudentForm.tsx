import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

interface StudentFormProps {
  student?: any;
  onClose: () => void;
  onSave: (studentData: any) => void;
  departments: any[];
  semesters: any[];
  divisions: any[];
}

const StudentForm: React.FC<StudentFormProps> = ({ 
  student, 
  onClose, 
  onSave, 
  departments, 
  semesters, 
  divisions 
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    email: student?.user?.email || '',
    password: '',
    name: student?.name || '',
    enrollmentNo: student?.enrollmentNo || '',
    departmentId: student?.departmentId || '',
    semesterId: student?.semesterId || '',
    divisionId: student?.divisionId || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (student) {
      setFormData({
        email: student.user.email,
        password: '',
        name: student.name,
        enrollmentNo: student.enrollmentNo,
        departmentId: student.departmentId,
        semesterId: student.semesterId,
        divisionId: student.divisionId,
      });
    }
  }, [student]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      
      const studentData: any = { ...formData };
      if (!student && !formData.password) {
        setError('Password is required for new students');
        setLoading(false);
        return;
      }
      if (student && !formData.password) {
        delete studentData.password; // Don't update password if not provided
      }

      const url = student 
        ? `${API_BASE}/admin/students/${student.id}`
        : `${API_BASE}/admin/students`;
      
      const method = student ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(studentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save student');
      }

      const savedStudent = await response.json();
      onSave(savedStudent);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDepartmentChange = (departmentId: string) => {
    setFormData({ ...formData, departmentId, semesterId: '', divisionId: '' });
  };

  const handleSemesterChange = (semesterId: string) => {
    setFormData({ ...formData, semesterId, divisionId: '' });
  };

  // Filter semesters based on selected department
  const filteredSemesters = semesters.filter(semester => 
    semester.departmentId === parseInt(formData.departmentId)
  );

  // Filter divisions based on selected semester
  const filteredDivisions = divisions.filter(division => 
    division.semesterId === parseInt(formData.semesterId)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {student ? 'Edit Student' : 'Add New Student'}
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <div className="text-red-800 text-sm">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password {!student && '*'}
              </label>
              <input
                type="password"
                required={!student}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={student ? 'Leave blank to keep current password' : ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Enrollment Number *
              </label>
              <input
                type="text"
                required
                value={formData.enrollmentNo}
                onChange={(e) => setFormData({ ...formData, enrollmentNo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department *
              </label>
              <select
                required
                value={formData.departmentId}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Semester *
              </label>
              <select
                required
                value={formData.semesterId}
                onChange={(e) => handleSemesterChange(e.target.value)}
                disabled={!formData.departmentId}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">Select Semester</option>
                {filteredSemesters.map((semester) => (
                  <option key={semester.id} value={semester.id}>
                    Semester {semester.number}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Division *
              </label>
              <select
                required
                value={formData.divisionId}
                onChange={(e) => setFormData({ ...formData, divisionId: e.target.value })}
                disabled={!formData.semesterId}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">Select Division</option>
                {filteredDivisions.map((division) => (
                  <option key={division.id} value={division.id}>
                    {division.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : (student ? 'Update Student' : 'Add Student')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentForm;
