import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import JSZip from "jszip";
import { saveAs } from "file-saver";

const photoFields = [
  { key: "rouzaiPhoto", label: "劳灾保险" },
  { key: "zairyuFrontPhoto", label: "在留卡正面" },
  { key: "zairyuBackPhoto", label: "在留卡反面" },
  { key: "passportPhoto", label: "护照" },
  { key: "otherPhoto", label: "其他" },
];

export default function UploadDetail() {
  const params = useParams();
  const code = params.code;
  const [user, setUser] = useState<any>(null);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    const list = JSON.parse(localStorage.getItem("registerList") || "[]");
    const found = list.find((item: any) => item.code === Number(code));
    setUser(found);
  }, [code]);

  if (!user) return <div className="p-8 text-center">未找到员工信息</div>;
  const name = `${user.firstName} ${user.lastName}`;

  // 收集所有有图片的字段
  const photos = photoFields
    .map(f => ({ key: f.key, label: f.label, url: user[f.key] }))
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

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-6">{name} 的证件照片</h2>
      <div className="mb-4 flex gap-4 flex-wrap">
        {photos.map(f => (
          <div key={f.key} className="flex flex-col items-center m-2">
            <div className="relative group">
              <img
                src={f.url}
                alt={f.label}
                className="w-40 h-32 object-cover rounded shadow border cursor-pointer transition-transform group-hover:scale-150"
                style={{ transition: 'transform 0.2s' }}
              />
            </div>
            <label className="mt-2 flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.includes(f.key)}
                onChange={e => {
                  setSelected(sel =>
                    e.target.checked
                      ? [...sel, f.key]
                      : sel.filter(k => k !== f.key)
                  );
                }}
              />
              <span
                className="text-blue-600 underline hover:text-blue-800"
                onClick={() => handleDownload(f.url, f.label)}
              >{f.label}</span>
            </label>
          </div>
        ))}
      </div>
      {selected.length > 1 && (
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded mt-4"
          onClick={handleBatchDownload}
        >批量下载</button>
      )}
      <a
        href={selected.length === 1 ? `/admin/accounts/upload/${selected[0]}` : '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 py-2 rounded font-medium text-blue-600 hover:underline border border-blue-200 bg-blue-50 mr-2"
      >
        证件查看
      </a>
    </div>
  );
} 