'use client';

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

const photoFields = [
  { key: "rouzaiPhoto", label: "劳灾保险" },
  { key: "zairyuFrontPhoto", label: "在留卡正面" },
  { key: "zairyuBackPhoto", label: "在留卡反面" },
  { key: "passportPhoto", label: "护照" },
  { key: "otherPhoto", label: "其他" },
];

interface Document {
  id: string;
  name: string;
  type: string;
  expiryDate?: string;
  uploadDate: string;
}

interface UserInfo {
  firstName: string;
  lastName: string;
  visaDate: string;      // 在留卡期限
  insuranceDate: string; // 劳灾保险到期
  healthDate: string;    // 健康诊断日
}

export default function UploadDetail() {
  const params = useParams();
  const code = params.code;
  const [user, setUser] = useState<UserInfo | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const list = JSON.parse(localStorage.getItem("registerList") || "[]");
    const found = list.find((item: any, idx: number) => 1000 + idx === Number(code));
    setUser(found);
  }, [code]);

  useEffect(() => {
    const fetchDocuments = () => {
      const storedDocs = localStorage.getItem(`documents_${code}`);
      if (storedDocs) {
        setDocuments(JSON.parse(storedDocs));
      }
      setLoading(false);
    };

    fetchDocuments();
  }, [code]);

  if (!user) return <div className="p-4 text-center">未找到员工信息</div>;
  const name = `${user.firstName} ${user.lastName}`;

  // 收集所有有图片的字段
  const photos = photoFields
    .map(f => ({
      key: f.key,
      label: f.label,
      url: (user as any)[f.key] // 类型断言，绕过类型检查
    }))
    .filter(f => !!f.url);

  // 下载单张
  const handleDownload = async (url: string, label: string) => {
    const res = await fetch(url);
    const blob = await res.blob();
    saveAs(blob, `${name}-${label}.jpg`);
  };
  // 多选下载
  const handleBatchDownload = async () => {
    const zip = new JSZip();
    const folder = zip.folder(name);
    for (const f of photos) {
      if (selected.includes(f.key)) {
        const res = await fetch(f.url);
        const blob = await res.blob();
        folder.file(`${f.label}.jpg`, blob);
      }
    }
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `${name}.zip`);
  };

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    return expiry < today;
  };

  const getStatusColor = (expiryDate?: string) => {
    if (!expiryDate) return 'text-gray-500';
    return isExpired(expiryDate) ? 'text-red-500' : 'text-green-500';
  };

  const getStatusText = (expiryDate?: string) => {
    if (!expiryDate) return '无有效期';
    return isExpired(expiryDate) ? '已过期' : '有效期内';
  };

  if (loading) {
    return <div className="p-4">加载中...</div>;
  }

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-6">{name} 的证件列表</h2>
      
      {/* 重要证件有效期 */}
      <div className="mb-6 space-y-3">
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <h3 className="font-medium text-lg mb-3">重要证件有效期</h3>
          <div className="space-y-2">
            <p className={`${getStatusColor(user.visaDate)}`}>
              在留卡期限: {user.visaDate ? format(new Date(user.visaDate), 'yyyy年MM月dd日', { locale: ja }) : '未设置'} 
              ({getStatusText(user.visaDate)})
            </p>
            <p className={`${getStatusColor(user.insuranceDate)}`}>
              劳灾保险到期: {user.insuranceDate ? format(new Date(user.insuranceDate), 'yyyy年MM月dd日', { locale: ja }) : '未设置'} 
              ({getStatusText(user.insuranceDate)})
            </p>
            <p className={`${getStatusColor(user.healthDate)}`}>
              健康诊断日: {user.healthDate ? format(new Date(user.healthDate), 'yyyy年MM月dd日', { locale: ja }) : '未设置'} 
              ({getStatusText(user.healthDate)})
            </p>
          </div>
        </div>
      </div>

      {/* 其他证件列表 */}
      <div className="space-y-4">
        <h3 className="font-medium text-lg">其他证件</h3>
        {documents.map((doc) => (
          <div key={doc.id} className="border rounded-lg p-4 bg-white shadow-sm">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <h3 className="font-medium text-lg">{doc.name}</h3>
                <p className="text-gray-600">类型: {doc.type}</p>
                <p className="text-gray-600">
                  上传日期: {format(new Date(doc.uploadDate), 'yyyy年MM月dd日', { locale: ja })}
                </p>
                {doc.expiryDate && (
                  <p className={`${getStatusColor(doc.expiryDate)}`}>
                    有效期至: {format(new Date(doc.expiryDate), 'yyyy年MM月dd日', { locale: ja })} 
                    ({getStatusText(doc.expiryDate)})
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
        {documents.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            暂无其他证件
          </div>
        )}
      </div>

      <a
        href={`/admin/accounts/upload/${selected.code}`}
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 py-2 rounded font-medium text-blue-600 hover:underline border border-blue-200 bg-blue-50 mr-2"
      >
        证件查看
      </a>
    </div>
  );
}