"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useApp } from "@/components/AppContext";
import { apiJson, apiFetch, fetchMe } from "@/lib/api";

interface User {
  _id: string;
  name: string;
  email: string;
  role: "learner" | "company" | "admin" | "mentor";
  createdAt: string;
}

interface AuditLog {
  _id: string;
  userId?: {
    name: string;
    email: string;
  };
  action: string;
  details: string;
  severity: "info" | "warning" | "critical";
  ip?: string;
  userAgent?: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const { locale } = useApp();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // States
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState("");

  // CRUD Form states
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addRole, setAddRole] = useState("learner");
  const [addPassword, setAddPassword] = useState("");

  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<"learner" | "company" | "admin" | "mentor">("learner");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const handleOpenAddModal = () => {
    setAddName("");
    setAddEmail("");
    setAddPassword("");
    setAddRole("learner");
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setIsEditModalOpen(true);
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiJson("/admin/users", {
        method: "POST",
        body: JSON.stringify({
          name: addName,
          email: addEmail,
          password: addPassword,
          role: addRole,
        }),
      });
      toast.success(locale === "en" ? "User created successfully!" : "تم إنشاء العضو بنجاح!");
      setIsAddModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to create user.");
    }
  };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await apiJson(`/admin/users/${editingUser._id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          role: editRole,
        }),
      });
      toast.success(locale === "en" ? "User updated successfully!" : "تم تحديث بيانات العضو بنجاح!");
      setIsEditModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update user.");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm(locale === "en" ? "Are you sure you want to permanently delete this user?" : "هل أنت متأكد من حذف هذا العضو نهائياً؟")) return;
    try {
      await apiJson(`/admin/users/${userId}`, {
        method: "DELETE",
      });
      toast.success(locale === "en" ? "User deleted successfully!" : "تم حذف العضو بنجاح!");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user.");
    }
  };

  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const handleSelectUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedUserIds(users.map((u) => u._id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUserIds.length === 0) return;
    if (!confirm(locale === "en" ? `Are you sure you want to permanently delete the ${selectedUserIds.length} selected users?` : `هل أنت متأكد من حذف ${selectedUserIds.length} أعضاء محددين نهائياً؟`)) return;
    try {
      setLoading(true);
      await Promise.all(
        selectedUserIds.map((userId) =>
          apiJson(`/admin/users/${userId}`, { method: "DELETE" })
        )
      );
      toast.success(locale === "en" ? "Selected users deleted successfully!" : "تم حذف الأعضاء المحددين بنجاح!");
      setSelectedUserIds([]);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete selected users.");
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const me = await fetchMe();
      if (!me || me.role !== "admin") {
        window.location.href = "/admin";
        return;
      }
      setCurrentUser(me);
      fetchData();
    })();
  }, []);

  const fetchData = async () => {
    try {
      const allUsers = await apiJson<User[]>("/admin/users");
      setUsers(allUsers);

      const logs = await apiJson<AuditLog[]>("/admin/audit-logs");
      setAuditLogs(logs);

      setLoading(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to load administration data.");
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const allUsers = await apiJson<User[]>(`/admin/users?search=${search}`);
      setUsers(allUsers);
    } catch (e) {}
  };

  const handleChangeRole = async (userId: string, role: string) => {
    try {
      await apiJson(`/admin/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
      toast.success(locale === "en" ? "User role modified successfully!" : "تم تعديل صلاحيات المستخدم بنجاح!");
      fetchData();
    } catch (e: any) {
      toast.error(e.message || "Failed to update role.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base-100">
        <span className="loading loading-spinner loading-lg text-[#10B981]"></span>
      </div>
    );
  }

  const isRtl = locale === "ar";

  return (
    <div className={`sr-console min-h-screen text-base-content pb-16 px-4 sm:px-6 lg:px-8 font-sans ${isRtl ? "text-right" : "text-left"}`}>
      <div className="sr-shell max-w-6xl mx-auto space-y-8">
        
        {/* Navigation Admin Header Banner */}
        <div className="sr-stage sr-signal flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 rounded-3xl p-6 sm:p-8">
          <div>
            <span className="sr-kicker">
              {isRtl ? "بوابة الأمان والعمليات" : "PLATFORM OPERATIONS & SECURITY"}
            </span>
            <h1 className="text-2xl font-black tracking-tight mt-1">
              {isRtl ? "إدارة الأعضاء وسجلات الأمان" : "User Operations & Audit Trails"}
            </h1>
            <p className="text-xs text-base-content/50 mt-0.5">
              {isRtl ? "تحكم في أدوار الأعضاء، وراقب محاولات الدخول غير الاعتيادية وسجلات الأمان." : "Modify database scopes, audit user role permissions, and view authentication trails."}
            </p>
          </div>
          <a
            href="/admin"
            className="sr-button-secondary btn btn-xs sm:btn-sm"
          >
            {isRtl ? "لوحة التحليلات" : "Back to analytics"}
          </a>
        </div>

        {/* User Management and Search */}
        <div className="grid md:grid-cols-3 gap-6">
          
          {/* Users List Column */}
          <div className="sr-panel md:col-span-2 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-3">
              <h3 className="font-extrabold text-xs uppercase tracking-wider font-mono text-base-content/40">
                {isRtl ? "إدارة أدوار الأعضاء" : "Manage User Roles"}
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                {selectedUserIds.length > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    className="btn btn-xs btn-error text-white rounded-xl h-8 px-3 font-bold animate-pulse"
                  >
                    🗑️ {isRtl ? `حذف المحدد (${selectedUserIds.length})` : `Remove Selected (${selectedUserIds.length})`}
                  </button>
                )}
                <button
                  onClick={handleOpenAddModal}
                  className="btn btn-xs btn-primary text-white rounded-xl h-8 px-3 font-bold"
                >
                  ➕ {isRtl ? "إضافة عضو" : "Add User"}
                </button>
                <form onSubmit={handleSearch} className="flex gap-1.5 max-w-xs">
                  <input
                    type="text"
                    placeholder={isRtl ? "ابحث بالاسم أو البريد..." : "Search user..."}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input input-bordered rounded-xl bg-base-100 text-xs w-32 sm:w-40 h-8"
                  />
                  <button type="submit" className="btn btn-xs bg-[#10B981] hover:bg-[#059669] text-white border-none rounded-xl h-8 px-2.5 font-bold">
                    {isRtl ? "بحث" : "Go"}
                  </button>
                </form>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="table w-full text-xs">
                <thead>
                  <tr className="border-b border-base-300 font-mono text-[9px] uppercase">
                    <th className="w-10">
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={selectedUserIds.length === users.length && users.length > 0}
                        className="checkbox checkbox-xs checkbox-primary"
                      />
                    </th>
                    <th>{isRtl ? "الاسم" : "User Name"}</th>
                    <th>{isRtl ? "البريد الإلكتروني" : "Email Address"}</th>
                    <th>{isRtl ? "الدور الحالي" : "Assigned Role"}</th>
                    <th>{isRtl ? "الإجراءات" : "Operations"}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id} className="border-b border-base-300">
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(u._id)}
                          onChange={() => handleSelectUser(u._id)}
                          disabled={u._id === currentUser?._id}
                          className="checkbox checkbox-xs checkbox-primary"
                        />
                      </td>
                      <td className="font-bold">{u.name}</td>
                      <td className="font-mono text-[10px] text-base-content/65">{u.email}</td>
                      <td>
                        <span className="badge badge-sm badge-outline uppercase tracking-wider font-mono text-[9px] font-bold">
                          {u.role}
                        </span>
                      </td>
                      <td className="flex gap-1.5 flex-wrap">
                        <button
                          onClick={() => handleOpenEditModal(u)}
                          className="btn btn-xs btn-outline btn-info rounded-lg font-bold"
                        >
                          ✏️ {isRtl ? "تعديل" : "Edit"}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u._id)}
                          disabled={u._id === currentUser?._id}
                          title={u._id === currentUser?._id ? (isRtl ? "لا يمكنك حذف حسابك الخاص" : "You cannot delete your own account") : undefined}
                          className="btn btn-xs btn-outline btn-error rounded-lg font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          🗑️ {isRtl ? "حذف" : "Remove"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Severity Breakdown */}
          <div className="sr-panel md:col-span-1 rounded-2xl p-5 space-y-4">
            <h3 className="font-extrabold text-xs uppercase tracking-wider font-mono text-base-content/40">
              {isRtl ? "تحليل مخاطر الأمان" : "Security Risk Index"}
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center p-2.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl">
                <span className="font-bold">CRITICAL ALERTS</span>
                <span className="font-mono font-black">{auditLogs.filter((l) => l.severity === "critical").length}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-xl">
                <span className="font-bold">WARNINGS IN LOG</span>
                <span className="font-mono font-black">{auditLogs.filter((l) => l.severity === "warning").length}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded-xl">
                <span className="font-bold">INFO TRAFFIC logs</span>
                <span className="font-mono font-black">{auditLogs.filter((l) => l.severity === "info").length}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Audit Log list */}
        <div className="sr-panel rounded-2xl p-5 space-y-4">
          <h3 className="font-extrabold text-xs uppercase tracking-wider font-mono text-base-content/40">
            {isRtl ? "سجل مراقبة العمليات الكامل" : "Audit Trail Index"}
          </h3>

          <div className="overflow-x-auto max-h-96">
            <table className="table w-full text-xs">
              <thead>
                <tr className="border-b border-base-300 font-mono text-[9px] uppercase">
                  <th>{isRtl ? "الوقت" : "Timestamp"}</th>
                  <th>{isRtl ? "المسؤول" : "Actor"}</th>
                  <th>{isRtl ? "العملية" : "Action"}</th>
                  <th>{isRtl ? "التفاصيل" : "Details"}</th>
                  <th>{isRtl ? "الخطورة" : "Severity"}</th>
                  <th>{isRtl ? "العنوان/المتصفح" : "IP & Client"}</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log._id} className="border-b border-base-300">
                    <td className="font-mono text-[10px] text-base-content/45">
                      {new Date(log.createdAt).toLocaleString(locale === "en" ? "en-US" : "ar-EG", {
                        month: "short",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="font-semibold text-[10px]">{log.userId?.name || (isRtl ? "النظام" : "System")}</td>
                    <td className="font-bold">{log.action}</td>
                    <td className="max-w-[300px] truncate">{log.details}</td>
                    <td>
                      <span className={`badge border-none font-bold text-[8px] uppercase px-1.5 py-0.5 rounded font-mono ${
                        log.severity === "critical" ? "bg-red-500/10 text-red-500 animate-pulse" :
                        log.severity === "warning" ? "bg-yellow-500/10 text-yellow-500" : "bg-blue-500/10 text-blue-500"
                      }`}>
                        {log.severity}
                      </span>
                    </td>
                    <td className="font-mono text-[9px] text-base-content/45 max-w-[150px] truncate" title={log.userAgent}>
                      {log.ip || "unknown"} • {log.userAgent || "client"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="modal modal-open">
          <div className="sr-panel modal-box rounded-2xl shadow-xl">
            <h3 className="font-bold text-lg mb-4 text-[#10B981]">
              {isRtl ? "إضافة مستخدم جديد" : "Add New User"}
            </h3>
            <form onSubmit={handleCreateUserSubmit} className="space-y-4 text-xs">
              <div className="form-control">
                <label className="label font-bold text-[11px]">{isRtl ? "الاسم الكامل" : "Full Name"}</label>
                <input
                  type="text"
                  required
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className="input input-bordered w-full bg-base-100 text-xs rounded-xl h-10 px-3"
                />
              </div>
              <div className="form-control">
                <label className="label font-bold text-[11px]">{isRtl ? "البريد الإلكتروني" : "Email Address"}</label>
                <input
                  type="email"
                  required
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  className="input input-bordered w-full bg-base-100 text-xs rounded-xl h-10 px-3"
                />
              </div>
              <div className="form-control">
                <label className="label font-bold text-[11px]">{isRtl ? "كلمة المرور" : "Password"}</label>
                <input
                  type="password"
                  required
                  value={addPassword}
                  onChange={(e) => setAddPassword(e.target.value)}
                  className="input input-bordered w-full bg-base-100 text-xs rounded-xl h-10 px-3"
                />
              </div>
              <div className="form-control">
                <label className="label font-bold text-[11px]">{isRtl ? "الدور الوظيفي" : "Role"}</label>
                <select
                  value={addRole}
                  onChange={(e) => setAddRole(e.target.value)}
                  className="select select-bordered w-full bg-base-100 text-xs rounded-xl h-10 px-2"
                >
                  <option value="learner">Learner</option>
                  <option value="company">Company</option>
                  <option value="mentor">Mentor</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div className="modal-action flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn btn-sm btn-ghost text-xs rounded-xl"
                >
                  {isRtl ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="btn btn-sm bg-[#10B981] hover:bg-[#059669] text-white border-none text-xs rounded-xl font-bold px-6"
                >
                  {isRtl ? "إضافة" : "Add User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && editingUser && (
        <div className="modal modal-open">
          <div className="sr-panel modal-box rounded-2xl shadow-xl">
            <h3 className="font-bold text-lg mb-4 text-[#10B981]">
              {isRtl ? "تعديل تفاصيل العضو" : "Edit User Details"}
            </h3>
            <form onSubmit={handleEditUserSubmit} className="space-y-4 text-xs">
              <div className="form-control">
                <label className="label font-bold text-[11px]">{isRtl ? "الاسم الكامل" : "Full Name"}</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="input input-bordered w-full bg-base-100 text-xs rounded-xl h-10 px-3"
                />
              </div>
              <div className="form-control">
                <label className="label font-bold text-[11px]">{isRtl ? "البريد الإلكتروني" : "Email Address"}</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="input input-bordered w-full bg-base-100 text-xs rounded-xl h-10 px-3"
                />
              </div>
              <div className="form-control">
                <label className="label font-bold text-[11px]">{isRtl ? "الدور الوظيفي" : "Role"}</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as any)}
                  className="select select-bordered w-full bg-base-100 text-xs rounded-xl h-10 px-2"
                >
                  <option value="learner">Learner</option>
                  <option value="company">Company</option>
                  <option value="mentor">Mentor</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div className="modal-action flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="btn btn-sm btn-ghost text-xs rounded-xl"
                >
                  {isRtl ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="btn btn-sm bg-[#10B981] hover:bg-[#059669] text-white border-none text-xs rounded-xl font-bold px-6"
                >
                  {isRtl ? "حفظ التغييرات" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
