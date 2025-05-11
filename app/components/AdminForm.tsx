"use client";
'use client';

import { useState } from 'react';

type AdminType = 'personal' | 'group' | 'company' | 'super';

interface AdminFormProps {
  onSubmit: (data: any) => void;
  initialData?: any;
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

export default function AdminForm({ onSubmit, initialData }: AdminFormProps) {
  const [type, setType] = useState<AdminType>(initialData?.type || 'personal');
  const [formData, setFormData] = useState({
    type: initialData?.type || 'personal',
    username: initialData?.username || '',
    password: initialData?.password || '',
    name: initialData?.name || '',
    phone: initialData?.phone || '',
    contactPerson: initialData?.contactPerson || '',
    constructionSite: initialData?.constructionSite || '',
    permissions: initialData?.permissions || [],
    langs: initialData?.langs || ['zh', 'ja'],
  });

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as AdminType;
    setType(newType);
    setFormData(prev => ({ ...prev, type: newType }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form className="admin-admins-form" onSubmit={handleSubmit}>
      {/* 基础信息 */}
      <div className="admin-admins-form-group">
        <label className="admin-admins-label">账号</label>
        <input
          type="text"
          className="admin-admins-input input"
          value={formData.username}
          onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
          required
        />
      </div>
      <div className="admin-admins-form-group">
        <label className="admin-admins-label">密码</label>
        <input
          type="password"
          className="admin-admins-input input"
          value={formData.password}
          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
          required
        />
      </div>

      {/* 类型选择 */}
      <div className="admin-admins-form-group">
        <label className="admin-admins-label">类型</label>
        <select 
          className="admin-admins-select"
          value={type}
          onChange={handleTypeChange}
        >
          <option value="personal">个人</option>
          <option value="group">グループ/職長</option>
          <option value="company">公司</option>
          <option value="super">超级管理员</option>
        </select>
      </div>

      {/* 个人类型字段 */}
      <div className={`admin-admins-type-group ${type === 'personal' ? 'active' : ''}`}>
        <div className="admin-admins-form-group">
          <label className="admin-admins-label">姓名</label>
          <input
            type="text"
            className="admin-admins-input input"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        <div className="admin-admins-form-group">
          <label className="admin-admins-label">电话号码</label>
          <input
            type="tel"
            className="admin-admins-input input"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            required
          />
        </div>
      </div>

      {/* グループ/職長类型字段 */}
      <div className={`admin-admins-type-group ${type === 'group' ? 'active' : ''}`}>
        <div className="admin-admins-form-group">
          <label className="admin-admins-label">姓名</label>
          <input
            type="text"
            className="admin-admins-input input"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        <div className="admin-admins-form-group">
          <label className="admin-admins-label">电话号码</label>
          <input
            type="tel"
            className="admin-admins-input input"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            required
          />
        </div>
        <div className="admin-admins-form-group">
          <label className="admin-admins-label">工地名称</label>
          <input
            type="text"
            className="admin-admins-input input"
            value={formData.constructionSite}
            onChange={(e) => setFormData(prev => ({ ...prev, constructionSite: e.target.value }))}
            required
          />
        </div>
      </div>

      {/* 会社类型字段 */}
      <div className={`admin-admins-type-group ${type === 'company' ? 'active' : ''}`}>
        <div className="admin-admins-form-group">
          <label className="admin-admins-label">负责人</label>
          <input
            type="text"
            className="admin-admins-input input"
            value={formData.contactPerson}
            onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
            required
          />
        </div>
      </div>

      {/* 权限设置 */}
      <div className="admin-admins-form-group">
        <label className="admin-admins-label">权限</label>
        <div className="flex flex-wrap gap-2">
          {PERMISSION_LIST.map((perm) => (
            <label key={perm} className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={formData.permissions?.includes(perm) || false}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData(prev => ({
                      ...prev,
                      permissions: [...(prev.permissions || []), perm]
                    }));
                  } else {
                    setFormData(prev => ({
                      ...prev,
                      permissions: (prev.permissions || []).filter(p => p !== perm)
                    }));
                  }
                }}
              />
              {perm}
            </label>
          ))}
        </div>
      </div>

      {/* 语言权限 */}
      <div className="admin-admins-form-group">
        <label className="admin-admins-label">语言权限</label>
        <div className="flex gap-4">
          {LANG_OPTIONS.map(opt => (
            <label key={opt.value} className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={formData.langs?.includes(opt.value) || false}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData(prev => ({
                      ...prev,
                      langs: [...(prev.langs || []), opt.value]
                    }));
                  } else {
                    setFormData(prev => ({
                      ...prev,
                      langs: (prev.langs || []).filter(l => l !== opt.value)
                    }));
                  }
                }}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <button type="submit" className="admin-admins-button btn btn-primary">
        {initialData ? '更新' : '添加'}
      </button>
    </form>
  );
} 