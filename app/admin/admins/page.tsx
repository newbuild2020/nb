"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import OutlineButton from "../manager/OutlineButton";
import AdminForm from '@/app/components/AdminForm';

interface AdminInfo {
  username: string;
  password: string;
  type: 'company' | 'group' | 'person' | 'super';
  companyName?: string;
  registerTime?: string;
  lastLogin?: string;
  permissions?: string[];
  langs?: string[];
  contactPerson?: string;
  name?: string;
  constructionSite?: string;
}

const PERMISSION_LIST = [
  '名簿查看',
  '名簿上传',
  '名簿删除',
  '名簿下载',
  '名簿修改',
  '名簿分组管理',
  '更改密码',
  '更改公司信息',
];

const LANG_OPTIONS = [
  { label: '中文', value: 'zh' },
  { label: '日本語', value: 'ja' },
];

const DEFAULT_COMPANY_NAME = "株式会社ニュービルド";

export default function AdminAdmins() {
  const [admins, setAdmins] = useState<AdminInfo[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminInfo | null>(null);
  const [newAdmin, setNewAdmin] = useState<AdminInfo>({
    username: "",
    password: "",
    type: "company",
    companyName: "",
    permissions: []
  });
  const [error, setError] = useState("");
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 加载管理员列表
  useEffect(() => {
    const adminList = JSON.parse(localStorage.getItem("adminList") || "[]");
    if (adminList.length === 0) {
      // 如果没有管理员列表，添加默认管理员
      const now = new Date().toISOString();
      const defaultAdmin = {
        username: "admin",
        password: "admin",
        type: "company" as const,
        companyName: DEFAULT_COMPANY_NAME,
        registerTime: now,
        lastLogin: now,
        permissions: [...PERMISSION_LIST],
        langs: ['zh', 'ja']
      };
      localStorage.setItem("adminList", JSON.stringify([defaultAdmin]));
      setAdmins([defaultAdmin]);
    } else {
      // 兼容旧数据，补全字段
      const fixedList = adminList.map((a: any) => ({
        ...a,
        type: (a.type as 'company' | 'group' | 'person' | 'super') || ((a.role === 'superadmin' || a.role === 'admin') ? 'company' : 'person'),
        companyName: a.companyName || ((a.role === 'superadmin' || a.role === 'admin') ? DEFAULT_COMPANY_NAME : ''),
        registerTime: a.registerTime || a.lastLogin || new Date().toISOString(),
        permissions: a.permissions || (a.username === 'admin' ? [...PERMISSION_LIST] : []),
        langs: a.langs || ['zh', 'ja'],
        contactPerson: a.contactPerson || '',
        name: a.name || '',
        constructionSite: a.constructionSite || ''
      }));
      setAdmins(fixedList);
      localStorage.setItem("adminList", JSON.stringify(fixedList));
    }
  }, []);

  // 添加管理员
  const handleAddAdmin = () => {
    if (!newAdmin.username || !newAdmin.password) {
      setError("用户名和密码不能为空");
      return;
    }
    if (admins.some(a => a.username === newAdmin.username)) {
      setError("用户名已存在");
      return;
    }
    if (newAdmin.type === 'company' && !newAdmin.companyName) {
      setError("公司信息不能为空");
      return;
    }
    if (!newAdmin.permissions || newAdmin.permissions.length === 0) {
      setError("请至少选择一个限权");
      return;
    }
    if (!newAdmin.langs || newAdmin.langs.length === 0) {
      setError("请至少选择一种语言权限");
      return;
    }
    const now = new Date().toISOString();
    const updatedAdmins = [
      ...admins,
      {
        ...newAdmin,
        registerTime: now,
        lastLogin: now,
        langs: ['zh', 'ja']
      }
    ];
    setAdmins(updatedAdmins);
    localStorage.setItem("adminList", JSON.stringify(updatedAdmins));
    setShowAddModal(false);
    setNewAdmin({ username: "", password: "", type: "company", companyName: "", permissions: [] });
    setError("");
  };

  // 编辑管理员
  const handleEditAdmin = () => {
    if (!selectedAdmin) return;
    if (!selectedAdmin.username || !selectedAdmin.password) {
      setError("用户名和密码不能为空");
      return;
    }
    if (!selectedAdmin.langs || selectedAdmin.langs.length === 0) {
      setError("请至少选择一种语言权限");
      return;
    }
    const updatedAdmins = admins.map(a =>
      a.username === selectedAdmin.username
        ? {
            ...selectedAdmin,
            companyName: selectedAdmin.type === 'company' ? selectedAdmin.companyName : '',
            registerTime: selectedAdmin.registerTime || a.registerTime || new Date().toISOString(),
            permissions: selectedAdmin.username === 'admin' ? [...PERMISSION_LIST] : selectedAdmin.permissions,
            langs: ['zh', 'ja']
          }
        : a
    );
    setAdmins(updatedAdmins);
    localStorage.setItem("adminList", JSON.stringify(updatedAdmins));
    setShowEditModal(false);
    setSelectedAdmin(null);
    setError("");
  };

  // 删除管理员
  const handleDeleteAdmin = () => {
    if (!selectedAdmin) return;
    if (selectedAdmin.username === 'admin') {
      setError("不能删除超级管理员");
      return;
    }
    const updatedAdmins = admins.filter(a => a.username !== selectedAdmin.username);
    setAdmins(updatedAdmins);
    localStorage.setItem("adminList", JSON.stringify(updatedAdmins));
    setShowDeleteConfirm(false);
    setSelectedAdmin(null);
  };

  const handleSubmit = async (data: any) => {
    try {
      if (selectedAdmin) {
        // 更新现有管理员
        const updatedAdmins = admins.map(a =>
          a.username === selectedAdmin.username
            ? {
                ...selectedAdmin,
                companyName: selectedAdmin.type === 'company' ? selectedAdmin.companyName : '',
                registerTime: selectedAdmin.registerTime || a.registerTime || new Date().toISOString(),
                permissions: selectedAdmin.username === 'admin' ? [...PERMISSION_LIST] : selectedAdmin.permissions,
                langs: ['zh', 'ja']
              }
            : a
        );
        setAdmins(updatedAdmins);
        localStorage.setItem("adminList", JSON.stringify(updatedAdmins));
      } else {
        // 创建新管理员
        const now = new Date().toISOString();
        const updatedAdmins = [
          ...admins,
          {
            ...newAdmin,
            registerTime: now,
            lastLogin: now,
            langs: ['zh', 'ja']
          }
        ];
        setAdmins(updatedAdmins);
        localStorage.setItem("adminList", JSON.stringify(updatedAdmins));
      }
      setIsModalOpen(false);
      setSelectedAdmin(null);
      setNewAdmin({ username: "", password: "", type: "company", companyName: "", permissions: [] });
      setError("");
    } catch (error) {
      console.error('Error saving admin:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 p-8">
      <OutlineButton
        className="fixed top-6 left-6 z-50 px-4 py-2 rounded font-medium transition-all shadow-sm text-lg font-bold"
        onClick={() => router.back()}
      >
        返回
      </OutlineButton>
      <div className="bg-neutral-50 dark:bg-neutral-800 rounded-2xl p-10 w-full max-w-5xl shadow-lg flex flex-col gap-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold tracking-tight">管理员账号管理（株式会社ニュービルド）</h2>
          <OutlineButton
            className="px-4 py-2 rounded font-medium text-lg font-bold"
            onClick={() => router.push('/admin/admins/newadmin')}
          >
            添加管理员
          </OutlineButton>
        </div>
        <div>
          <table className="w-full text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-neutral-100 dark:bg-neutral-700">
                <th className="border px-4 py-2 font-medium text-left whitespace-nowrap">用户名</th>
                <th className="border px-4 py-2 font-medium text-left whitespace-nowrap">密码</th>
                <th className="border px-4 py-2 font-medium text-left whitespace-nowrap">类型</th>
                <th className="border px-4 py-2 font-medium text-left whitespace-nowrap">注册时间</th>
                <th className="border px-4 py-2 font-medium text-left max-w-[180px] truncate">公司信息</th>
                <th className="border px-4 py-2 font-medium text-left whitespace-nowrap">负责人/姓名</th>
                <th className="border px-4 py-2 font-medium text-left whitespace-nowrap">工地名称</th>
                <th className="border px-4 py-2 font-medium text-left whitespace-nowrap">最后登录时间</th>
                <th className="border px-4 py-2 font-medium text-left whitespace-nowrap">操作</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin, i) => (
                <tr key={i} className="even:bg-neutral-50 dark:even:bg-neutral-900">
                  <td className="border px-4 py-2 whitespace-nowrap">{admin.username}</td>
                  <td className="border px-4 py-2 whitespace-nowrap">{admin.password}</td>
                  <td className="border px-4 py-2 whitespace-nowrap">{
                    admin.type === 'company' ? '公司' : admin.type === 'group' ? 'グループ/職長' : admin.type === 'super' ? '超级管理员' : '个人'
                  }</td>
                  <td className="border px-4 py-2 whitespace-nowrap">{admin.registerTime ? new Date(admin.registerTime).toLocaleString() : "-"}</td>
                  <td className="border px-4 py-2 max-w-[180px] truncate">{admin.type === 'company' ? admin.companyName : '-'}</td>
                  <td className="border px-4 py-2 whitespace-nowrap">{admin.contactPerson || admin.name || '-'}</td>
                  <td className="border px-4 py-2 whitespace-nowrap">{admin.constructionSite || '-'}</td>
                  <td className="border px-4 py-2 whitespace-nowrap">{admin.lastLogin ? new Date(admin.lastLogin).toLocaleString() : "从未登录"}</td>
                  <td className="border px-4 py-2 whitespace-nowrap">
                    <div className="flex gap-2">
                      <OutlineButton
                        className="px-3 py-1 rounded text-base font-medium"
                        onClick={() => {
                          setSelectedAdmin(admin);
                          setShowEditModal(true);
                        }}
                      >
                        编辑
                      </OutlineButton>
                      {admin.username !== 'admin' && (
                        <OutlineButton
                          className="px-3 py-1 rounded text-base font-medium"
                          onClick={() => {
                            setSelectedAdmin(admin);
                            setShowDeleteConfirm(true);
                          }}
                        >
                          删除
                        </OutlineButton>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <></>
      )}

      {/* 删除确认弹窗 */}
      {showDeleteConfirm && selectedAdmin && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 w-full max-w-md shadow-lg flex flex-col gap-4">
            <h3 className="text-lg font-bold mb-2 text-neutral-700 dark:text-neutral-200">警告</h3>
            <div className="mb-4 text-neutral-600 dark:text-neutral-300">确定要删除管理员 <span className="font-mono text-lg text-neutral-700 dark:text-neutral-200">{selectedAdmin.username}</span> 吗？此操作不可恢复！</div>
            {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
            <div className="flex justify-end gap-2 mt-2">
              <OutlineButton
                className="px-4 py-2 rounded font-medium"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedAdmin(null);
                  setError("");
                }}
              >
                取消
              </OutlineButton>
              <OutlineButton
                className="px-4 py-2 rounded font-medium"
                onClick={handleDeleteAdmin}
              >
                确认删除
              </OutlineButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 