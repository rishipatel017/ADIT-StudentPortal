import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ModernLayout from '../../components/Layout/ModernLayout';
import { Button, Card, Input, Modal } from '../../components/UI';
import { academicService } from '../../services/academicService';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  // Faculty specific
  designation?: string;
  qualification?: string;
  phone?: string;
  joiningDate?: string;
  pastExperienceYears?: number;
  // Student specific
  enrollmentNo?: string;
  division?: { name: string };
  semester?: { number: number };
}

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  
  // Form states
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    designation: '',
    qualification: ''
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch profile based on user role
      let profileData;
      if (user?.role === 'ADMIN') {
        profileData = await academicService.getAdminProfile();
      } else if (user?.role === 'FACULTY') {
        profileData = await academicService.getFacultyProfile();
      } else if (user?.role === 'STUDENT') {
        profileData = await academicService.getStudentProfile();
      }
      
      setProfile(profileData);
      setEditForm({
        name: profileData.name || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
        designation: profileData.designation || '',
        qualification: profileData.qualification || ''
      });
    } catch (error) {
      console.error('Profile fetch error:', error);
      setError('Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      // Update profile based on role
      if (user?.role === 'ADMIN') {
        await academicService.updateAdminProfile(editForm);
      } else if (user?.role === 'FACULTY') {
        await academicService.updateFacultyProfile(editForm);
      } else if (user?.role === 'STUDENT') {
        await academicService.updateStudentProfile(editForm);
      }
      
      setShowEditModal(false);
      fetchProfile(); // Refresh data
    } catch (error) {
      console.error('Profile update error:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    
    setFormLoading(true);
    try {
      await academicService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      setShowPasswordModal(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setError('Password changed successfully!');
    } catch (error) {
      console.error('Password change error:', error);
      setError('Failed to change password. Please check your current password.');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <ModernLayout title="Profile">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </ModernLayout>
    );
  }

  if (error && !profile) {
    return (
      <ModernLayout title="Profile">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchProfile}>Retry</Button>
        </div>
      </ModernLayout>
    );
  }

  return (
    <ModernLayout title="Profile">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            <Button variant="primary" onClick={() => setShowEditModal(true)}>
              Edit Profile
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="text-gray-900">{profile?.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900">{profile?.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Role</label>
                  <p className="text-gray-900 capitalize">{profile?.role}</p>
                </div>
                {profile?.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="text-gray-900">{profile.phone}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {profile?.role === 'FACULTY' ? 'Professional Information' : 'Academic Information'}
              </h3>
              <div className="space-y-3">
                {profile?.role === 'FACULTY' && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Designation</label>
                      <p className="text-gray-900">{profile.designation}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Qualification</label>
                      <p className="text-gray-900">{profile.qualification}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Experience</label>
                      <p className="text-gray-900">{profile.pastExperienceYears} years</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Joining Date</label>
                      <p className="text-gray-900">
                        {profile.joiningDate ? new Date(profile.joiningDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </>
                )}
                {profile?.role === 'STUDENT' && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Enrollment Number</label>
                      <p className="text-gray-900">{profile.enrollmentNo}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Division</label>
                      <p className="text-gray-900">{profile.division?.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Semester</label>
                      <p className="text-gray-900">Semester {profile.semester?.number}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Password Change */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Security</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Change your password to keep your account secure</p>
              <p className="text-sm text-gray-500 mt-1">Last changed: Unknown</p>
            </div>
            <Button variant="secondary" onClick={() => setShowPasswordModal(true)}>
              Change Password
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className={`p-4 rounded-lg ${error.includes('success') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {error}
          </div>
        )}

        {/* Edit Profile Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit Profile"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="form-label">Name</label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="form-label">Email</label>
              <Input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                required
              />
            </div>
            {profile?.role === 'FACULTY' && (
              <>
                <div>
                  <label className="form-label">Designation</label>
                  <Input
                    value={editForm.designation}
                    onChange={(e) => setEditForm({...editForm, designation: e.target.value})}
                  />
                </div>
                <div>
                  <label className="form-label">Qualification</label>
                  <Input
                    value={editForm.qualification}
                    onChange={(e) => setEditForm({...editForm, qualification: e.target.value})}
                  />
                </div>
                <div>
                  <label className="form-label">Phone</label>
                  <Input
                    value={editForm.phone}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                  />
                </div>
              </>
            )}
            {profile?.role === 'STUDENT' && (
              <div>
                <label className="form-label">Phone</label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                />
              </div>
            )}
            <div className="flex space-x-3">
              <Button type="submit" variant="primary" disabled={formLoading}>
                {formLoading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Modal>

        {/* Change Password Modal */}
        <Modal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          title="Change Password"
        >
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="form-label">Current Password</label>
              <Input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="form-label">New Password</label>
              <Input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="form-label">Confirm New Password</label>
              <Input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                required
                minLength={6}
              />
            </div>
            <div className="flex space-x-3">
              <Button type="submit" variant="primary" disabled={formLoading}>
                {formLoading ? 'Changing...' : 'Change Password'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowPasswordModal(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </ModernLayout>
  );
};

export default ProfilePage;
