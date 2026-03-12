import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

interface FacultyFormProps {
  faculty?: any;
  onClose: () => void;
  onSave: (facultyData: any) => void;
}

const FacultyForm: React.FC<FacultyFormProps> = ({ 
  faculty, 
  onClose, 
  onSave
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    email: faculty?.user?.email || '',
    password: '',
    name: faculty?.name || '',
    designation: faculty?.designation || '',
    qualification: faculty?.qualification || '',
    joiningDate: faculty?.joiningDate ? new Date(faculty.joiningDate).toISOString().split('T')[0] : '',
    pastExperienceYears: faculty?.pastExperienceYears || 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (faculty) {
      setFormData({
        email: faculty.user.email,
        password: '',
        name: faculty.name,
        designation: faculty.designation,
        qualification: faculty.qualification,
        joiningDate: new Date(faculty.joiningDate).toISOString().split('T')[0],
        pastExperienceYears: faculty.pastExperienceYears,
      });
    }
  }, [faculty]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      
      const facultyData: any = { ...formData };
      if (!faculty && !formData.password) {
        setError('Password is required for new faculty');
        setLoading(false);
        return;
      }
      if (faculty && !formData.password) {
        delete facultyData.password; // Don't update password if not provided
      }

      const url = faculty 
        ? `${API_BASE}/admin/faculty/${faculty.id}`
        : `${API_BASE}/admin/faculty`;
      
      const method = faculty ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(facultyData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save faculty');
      }

      const savedFaculty = await response.json();
      onSave(savedFaculty);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {faculty ? 'Edit Faculty' : 'Add New Faculty'}
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
                Password {!faculty && '*'}
              </label>
              <input
                type="password"
                required={!faculty}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={faculty ? 'Leave blank to keep current password' : ''}
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
                Designation *
              </label>
              <input
                type="text"
                required
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                placeholder="e.g., Assistant Professor"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Qualification *
              </label>
              <input
                type="text"
                required
                value={formData.qualification}
                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                placeholder="e.g., Ph.D, M.Tech"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Joining Date *
              </label>
              <input
                type="date"
                required
                value={formData.joiningDate}
                onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Past Experience (Years)
              </label>
              <input
                type="number"
                min="0"
                value={formData.pastExperienceYears}
                onChange={(e) => setFormData({ ...formData, pastExperienceYears: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
              {loading ? 'Saving...' : (faculty ? 'Update Faculty' : 'Add Faculty')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FacultyForm;
