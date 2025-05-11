"use client";
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterUpload() {
  const router = useRouter();
  const [form, setForm] = useState<any>({});
  const [uploadFiles, setUploadFiles] = useState<Record<string, File | null>>({});
  const [extraFiles, setExtraFiles] = useState<Record<string, File | null>>({});
  const [extraTypes, setExtraTypes] = useState<string[]>([]);
  const [lang, setLang] = useState<'zh' | 'ja'>("zh");
  useEffect(() => {
    try {
      const list = JSON.parse(localStorage.getItem("registerList") || "[]");
      if (list.length > 0) {
        setForm(list[list.length - 1]);
        setLang(list[list.length - 1].lang || "zh");
      }
    } catch {}
  }, []);
  const extraOptions = [
    { value: 'passport', label: lang === 'zh' ? '护照' : 'パスポート' },
    { value: 'health', label: lang === 'zh' ? '健康诊断' : '健康診断書' },
    { value: 'nenkin', label: lang === 'zh' ? '年金手账' : '年金手帳' },
    { value: 'kenpo', label: lang === 'zh' ? '健康保险' : '健康保険証' },
    { value: 'other', label: lang === 'zh' ? '其他' : 'その他' },
  ];

  // 展示用户基本信息
  const userInfo = (
    <div className="mb-6 p-4 rounded bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 w-full">
      <div className="flex flex-wrap text-sm">
        <div className="w-1/2 min-w-[180px] mb-1">
          <span className="font-semibold">{lang === 'zh' ? '姓名' : '氏名'}:</span> {form.firstName} {form.lastName}
        </div>
        <div className="w-1/2 min-w-[180px] mb-1">
          <span className="font-semibold">{lang === 'zh' ? 'ふりがな' : 'ふりがな'}:</span> {form.firstNameFurigana} {form.lastNameFurigana}
        </div>
        <div className="w-1/2 min-w-[180px] mb-1">
          <span className="font-semibold">{lang === 'zh' ? '罗马字' : 'ローマ字'}:</span> {form.firstNameRomaji} {form.lastNameRomaji}
        </div>
        <div className="w-1/2 min-w-[180px] mb-1">
          <span className="font-semibold">{lang === 'zh' ? '国籍' : '国籍'}:</span> {form.nationality}{form.nationalityOther ? `（${form.nationalityOther}）` : ''}
        </div>
      </div>
    </div>
  );

  // 校验必传项
  const missingRequired = !uploadFiles.rouzai || (form.nationality !== '日本' && (!uploadFiles.zairyuFront || !uploadFiles.zairyuBack));

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 py-8">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setLang(lang === 'zh' ? 'ja' : 'zh')}
            className="text-blue-600 hover:underline"
          >
            {lang === 'zh' ? '日本語' : '中文'}
          </button>
        </div>
        <h2 className="text-xl font-bold mb-4">{lang === 'zh' ? '上传证件照片' : '証明書写真のアップロード'}</h2>
        {userInfo}
        {/* 说明文案已去除 */}
        {/* 必传项 */}
        <div className="mb-2 font-semibold">{lang === 'zh' ? '必传证件' : '必須書類'}</div>
        <div className="space-y-2 mb-4">
          {/* 在留卡正反面，仅非日本国籍，顺序提前 */}
          {form.nationality && form.nationality !== '日本' && (
            <>
              <div>
                <label className="block mb-1">{lang === 'zh' ? '在留卡正面' : '在留カード表面'}<span className="text-red-500">*</span></label>
                <input type="file" accept="image/*" onChange={e => setUploadFiles(f => ({ ...f, zairyuFront: e.target.files?.[0] || null }))} />
                {uploadFiles.zairyuFront && <span className="ml-2 text-green-600">{uploadFiles.zairyuFront.name}</span>}
                {!uploadFiles.zairyuFront && missingRequired && <span className="ml-2 text-red-500">{lang === 'zh' ? '必传' : '必須'}</span>}
              </div>
              <div>
                <label className="block mb-1">{lang === 'zh' ? '在留卡反面' : '在留カード裏面'}<span className="text-red-500">*</span></label>
                <input type="file" accept="image/*" onChange={e => setUploadFiles(f => ({ ...f, zairyuBack: e.target.files?.[0] || null }))} />
                {uploadFiles.zairyuBack && <span className="ml-2 text-green-600">{uploadFiles.zairyuBack.name}</span>}
                {!uploadFiles.zairyuBack && missingRequired && <span className="ml-2 text-red-500">{lang === 'zh' ? '必传' : '必須'}</span>}
              </div>
            </>
          )}
          {/* 労災保険 */}
          <div>
            <label className="block mb-1">{lang === 'zh' ? '劳灾保险照片' : '労災保険証写真'}<span className="text-red-500">*</span></label>
            <input type="file" accept="image/*" onChange={e => setUploadFiles(f => ({ ...f, rouzai: e.target.files?.[0] || null }))} />
            {uploadFiles.rouzai && <span className="ml-2 text-green-600">{uploadFiles.rouzai.name}</span>}
            {!uploadFiles.rouzai && missingRequired && <span className="ml-2 text-red-500">{lang === 'zh' ? '必传' : '必須'}</span>}
          </div>
        </div>
        {/* 可选项 */}
        <div className="mb-2 font-semibold">{lang === 'zh' ? '可选证件（可多选）' : '追加書類（複数選択可）'}</div>
        <div className="flex flex-wrap gap-2 mb-4">
          {extraOptions.map(opt => (
            <label key={opt.value} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={extraTypes.includes(opt.value)}
                onChange={e => {
                  if (e.target.checked) setExtraTypes(t => [...t, opt.value]);
                  else setExtraTypes(t => t.filter(v => v !== opt.value));
                }}
              />
              {opt.label}
            </label>
          ))}
        </div>
        <div className="space-y-2 mb-4">
          {extraTypes.map(type => (
            <div key={type}>
              <label className="block mb-1">{extraOptions.find(o => o.value === type)?.label}</label>
              <input type="file" accept="image/*" onChange={e => setExtraFiles(f => ({ ...f, [type]: e.target.files?.[0] || null }))} />
              {extraFiles[type] && <span className="ml-2 text-green-600">{extraFiles[type]?.name}</span>}
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-4">
          <button
            className="px-4 py-2 border rounded hover:bg-neutral-100 dark:hover:bg-neutral-700"
            onClick={() => router.back()}
          >
            {lang === 'zh' ? '返回' : '戻る'}
          </button>
          <button
            className="px-4 py-2 rounded shadow-md font-bold text-white bg-gradient-to-b from-[#bfc9d1] via-[#e6e8ea] to-[#7a7e83] border border-[#bfc9d1] hover:from-[#e6e8ea] hover:to-[#bfc9d1] active:from-[#7a7e83] active:to-[#bfc9d1] transition-all"
            onClick={async e => {
              e.preventDefault();
              // 校验必传项
              if (!uploadFiles.rouzai || (form.nationality !== '日本' && (!uploadFiles.zairyuFront || !uploadFiles.zairyuBack))) {
                alert(lang === 'zh' ? '请上传所有必传证件照片' : '必須書類の写真をすべてアップロードしてください');
                return;
              }
              // 1. 将所有图片转为Base64
              function fileToBase64(file: File): Promise<string> {
                return new Promise(resolve => {
                  const reader = new FileReader();
                  reader.onload = () => resolve(reader.result as string);
                  reader.readAsDataURL(file);
                });
              }
              const photoData: Record<string, string> = {};
              if (uploadFiles.rouzai) photoData.rouzaiPhoto = await fileToBase64(uploadFiles.rouzai);
              if (uploadFiles.zairyuFront) photoData.zairyuFrontPhoto = await fileToBase64(uploadFiles.zairyuFront);
              if (uploadFiles.zairyuBack) photoData.zairyuBackPhoto = await fileToBase64(uploadFiles.zairyuBack);
              for (const type of extraTypes) {
                if (extraFiles[type]) {
                  photoData[`${type}Photo`] = await fileToBase64(extraFiles[type] as File);
                }
              }
              // 2. 合并到registerList最后一条
              const list = JSON.parse(localStorage.getItem('registerList') || '[]');
              if (list.length > 0) {
                list[list.length - 1] = { ...list[list.length - 1], ...photoData };
                localStorage.setItem('registerList', JSON.stringify(list));
              }
              // 3. 跳转
              router.push("/namebook/register/upload/ok");
            }}
          >
            {lang === 'zh' ? '提交' : '登録する'}
          </button>
        </div>
      </div>
    </div>
  );
} 