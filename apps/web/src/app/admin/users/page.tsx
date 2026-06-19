'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { useApp } from '@/components/AppContext';

type UserEntry = {
  id: string;
  name: string;
  email: string;
  role: 'learner' | 'company' | 'admin';
  joinedDate: string;
  quizzesPassed: number;
  status: 'active' | 'suspended';
};

export default function AdminUsersPage() {
  const { locale } = useApp();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Hardcoded mockup users list representing database entities
  const [users, setUsers] = useState<UserEntry[]>([
    { id: '1', name: 'Mohamed Elsaied', email: 'mohamed.elsaied@gmail.com', role: 'learner', joinedDate: '2026-06-01', quizzesPassed: 14, status: 'active' },
    { id: '2', name: 'Ali Maher', email: 'ali.maher.design@outlook.com', role: 'learner', joinedDate: '2026-06-03', quizzesPassed: 9, status: 'active' },
    { id: '3', name: 'Marina George', email: 'marina.george@yahoo.com', role: 'learner', joinedDate: '2026-06-04', quizzesPassed: 12, status: 'active' },
    { id: '4', name: 'Nada Nasr', email: 'nada.nasr@gmail.com', role: 'learner', joinedDate: '2026-06-05', quizzesPassed: 6, status: 'active' },
    { id: '5', name: 'Stripe recruiter', email: 'recruiter@stripe.com', role: 'company', joinedDate: '2026-06-08', quizzesPassed: 0, status: 'active' },
    { id: '6', name: 'Lattice Admin Partner', email: 'hiring@lattice.com', role: 'company', joinedDate: '2026-06-10', quizzesPassed: 0, status: 'active' },
    { id: '7', name: 'Noha Salah', email: 'noha.salah@supervisor.edu', role: 'admin', joinedDate: '2026-05-15', quizzesPassed: 0, status: 'active' }
  ]);

  useEffect(() => {
    const storedUser = localStorage.getItem('smart_user');
    const storedToken = localStorage.getItem('smart_token');

    if (!storedUser || !storedToken) {
      setLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(storedUser);
      setAdminUser(parsed);
    } catch (e) {
      setAdminUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSimulateAdmin = () => {
    const adminSession = {
      id: 'demo-admin-id',
      name: 'SmartRoadmap SysAdmin',
      email: 'admin@smartroadmap.io',
      role: 'admin'
    };
    localStorage.setItem('smart_user', JSON.stringify(adminSession));
    localStorage.setItem('smart_token', 'demo-token');
    setAdminUser(adminSession);
    toast.success('Admin Session Simulator Enabled!');
  };

  const handleRoleChange = (userId: string, newRole: 'learner' | 'company' | 'admin') => {
    setUsers(prev => 
      prev.map(u => u.id === userId ? { ...u, role: newRole } : u)
    );
    toast.success(`Role updated successfully for user ID ${userId}!`);
  };

  const handleToggleStatus = (userId: string, currentStatus: 'active' | 'suspended') => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    setUsers(prev => 
      prev.map(u => u.id === userId ? { ...u, status: nextStatus } : u)
    );
    toast.info(nextStatus === 'suspended' ? `Account suspended for user ID ${userId}` : `Account reactivated for user ID ${userId}`);
  };

  const handleDeleteUser = (userId: string, name: string) => {
    if (confirm(`Are you sure you want to permanently delete user: ${name}?`)) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast.error(`Deleted account for candidate: ${name}`);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = 
      roleFilter === 'all' || 
      u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex min-h-screen bg-base-100 items-center justify-center">
        <span className="loading loading-spinner loading-lg text-[#10B981]"></span>
      </div>
    );
  }

  if (!adminUser || adminUser.role !== 'admin') {
    return (
      <div className="flex flex-col min-h-[85vh] items-center justify-center p-8 text-center bg-base-100">
        <div className="max-w-md bg-base-200 border border-base-300 p-8 rounded-2xl shadow-sm space-y-6">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">
            🛡️
          </div>
          <div className="space-y-2">
            <h2 className="text-display-md font-extrabold text-base-content leading-tight">Admin Gate Restriction</h2>
            <p className="text-xs text-base-content/50">
              Only master system operations and platform controllers are authorized to access the user index.
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={handleSimulateAdmin}
              className="btn bg-[#10B981] hover:bg-[#059669] text-white border-none rounded-xl font-semibold h-12 w-full"
            >
              Simulate Administrator Login (Demo)
            </button>
            <Link href="/auth/login" className="btn btn-outline border-base-300 text-base-content hover:bg-base-100 rounded-xl h-12 w-full">
              Sign In with Admin Credentials
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 text-base-content pb-8 px-4 sm:px-8 text-start font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Breadcrumb nav */}
        <div className="flex justify-between items-center">
          <Link href="/admin" className="text-caption text-primary hover:underline font-mono">
            ← BACK TO COMMAND
          </Link>
          <span className="text-xs font-mono font-bold text-gray-400">USERS_INDEX_V1.XLS</span>
        </div>

        {/* Title */}
        <div className="border-b border-base-300 pb-5">
          <h1 className="text-3xl font-black tracking-tight text-base-content">User Account Management</h1>
          <p className="text-xs text-base-content/50 mt-1">Audit credentials, modify system access scopes, and revoke user keys.</p>
        </div>

        {/* Searching & Filter toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
          <div className="flex-grow max-w-md">
            <input
              type="text"
              placeholder="Search user name or email address..."
              className="input input-bordered w-full rounded-xl bg-base-200 border-base-300 text-xs h-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <select
              className="select select-bordered rounded-xl bg-base-200 border-base-300 text-xs h-10 min-h-0 focus:border-[#10B981]"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="learner">Learners Only</option>
              <option value="company">Recruiters Only</option>
              <option value="admin">Administrators Only</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="border border-base-300 bg-base-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="table w-full text-xs text-start">
              <thead>
                <tr className="border-b border-base-300 bg-base-300">
                  <th className="font-bold text-base-content/50 py-3.5 px-4 font-mono">Name / Email</th>
                  <th className="font-bold text-base-content/50 py-3.5 px-4 font-mono text-center">System Role</th>
                  <th className="font-bold text-base-content/50 py-3.5 px-4 font-mono text-center">Badges</th>
                  <th className="font-bold text-base-content/50 py-3.5 px-4 font-mono text-center">Joined Date</th>
                  <th className="font-bold text-base-content/50 py-3.5 px-4 font-mono text-center">Status</th>
                  <th className="font-bold text-base-content/50 py-3.5 px-4 font-mono text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-base-content/40 italic">
                      No user records matched your active query.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-base-300/60 hover:bg-base-100/35 transition-colors">
                      
                      {/* Name/Email Column */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#10B981]/15 text-[#059669] flex items-center justify-center font-bold font-mono text-[10px]">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-bold text-base-content">{user.name}</p>
                            <span className="text-[10px] text-base-content/50 block font-mono mt-0.5">{user.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role selection dropdown */}
                      <td className="py-3 px-4 text-center">
                        <select
                          className="select select-bordered select-xs rounded bg-base-100 text-[10px] font-mono border-base-300 text-center font-semibold"
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as any)}
                        >
                          <option value="learner">LEARNER</option>
                          <option value="company">RECRUITER</option>
                          <option value="admin">ADMIN</option>
                        </select>
                      </td>

                      {/* Quizzes Passed */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-gray-500">
                        {user.quizzesPassed > 0 ? (
                          <span className="bg-[#10B981]/10 text-[#059669] px-2 py-0.5 rounded text-[10px]">
                            {user.quizzesPassed} Badges
                          </span>
                        ) : (
                          <span className="text-gray-300">–</span>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="py-3 px-4 text-center font-mono text-base-content/60">
                        {user.joinedDate}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span 
                          onClick={() => handleToggleStatus(user.id, user.status)}
                          className={`badge font-bold font-mono text-[9px] cursor-pointer py-2.5 px-2 ${
                            user.status === 'active' 
                              ? 'bg-green-100 text-[#059669] border border-green-200' 
                              : 'bg-red-100 text-red-500 border border-red-200'
                          }`}
                        >
                          {user.status.toUpperCase()}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-end">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleToggleStatus(user.id, user.status)}
                            className="btn btn-outline border-base-300 text-base-content btn-xs rounded"
                          >
                            {user.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            className="btn btn-error btn-outline btn-xs rounded"
                          >
                            Delete
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
