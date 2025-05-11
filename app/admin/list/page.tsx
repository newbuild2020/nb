"use client";
"use client";
import { useEffect as useNextEffect, useState as useNextState } from 'react';
import jsPDF from 'jspdf';
import { registerFont } from '../../../utils/NotoSansSC.js';
import { useRouter } from 'next/navigation';
import OutlineButton from "../manager/OutlineButton";

interface RegisterForm {
  firstName: string;
  lastName: string;
  firstNameKana: string;
  lastNameKana: string;
  firstNameRomaji: string;
  lastNameRomaji: string;
  birth: string;
  nationality: string;
  nationalityOther?: string;
  phone: string;
  email: string;
  postalCode: string;
  address: string;
  addressDetail: string;
  selectedChome?: string;
  emergencyContact: string;
  emergencyContactKana?: string;
  emergencyPhone: string;
  emergencyAddress: string;
  emergencyAddressDetail: string;
  emergencySelectedChome?: string;
  jobType: string;
  jobs?: string[];
  visaType: string;
  visaOther?: string;
  visaExpiry: string;
  insuranceType: string;
  insuranceExpiry: string;
  healthCheckDate: string;
  bloodPressure: string;
  bpLow?: string;
  blood?: string;
  height: string;
  weight: string;
  photos: string[];
  gender?: string;
  age?: string;
  relationship?: string;
  relationshipOther?: string;
  expYear?: string;
  expMonth?: string;
  exp?: string;
  visaDate?: string;
  insuranceDate?: string;
  healthDate?: string;
  emgZip?: string;
  emgAddress?: string;
  emgDetailAddress?: string;
  emgSelectedChome?: string;
}

// 文案对象
const texts = {
  zh: {
    title: "名簿管理",
    customize: "信息表示カスタマイズ",
    batchDelete: "一括删除",
    batchPDF: "一括PDF出力",
    number: "编号",
    name: "氏名",
    kana: "ふりがな",
    romaji: "ローマ字",
    birth: "生年月日",
    action: "操作",
    edit: "编辑",
    delete: "删除",
    detail: "详情",
    pdf: "PDF出力",
    close: "关闭",
    save: "保存",
    cancel: "取消",
    noData: "暂无数据 / データがありません",
    download: "下载",
    customizeClose: "閉じる",
    selectAll: "全选",
    unselectAll: "取消全选",
    jobType: "职种",
  },
  ja: {
    title: "名簿管理",
    customize: "情報表示カスタマイズ",
    batchDelete: "一括削除",
    batchPDF: "一括PDF出力",
    number: "番号",
    name: "氏名",
    kana: "ふりがな",
    romaji: "ローマ字",
    birth: "生年月日",
    action: "操作",
    edit: "編集",
    delete: "削除",
    detail: "詳細",
    pdf: "PDF出力",
    close: "閉じる",
    save: "保存",
    cancel: "取消",
    noData: "データがありません",
    download: "ダウンロード",
    customizeClose: "閉じる",
    selectAll: "全選択",
    unselectAll: "全選択解除",
    jobType: "職種",
  }
};

export default function AdminList() {
  const router = useRouter();
  const [forceJa, setForceJa] = useNextState(false);
  const [isAdmin00111, setIsAdmin00111] = useNextState(false);
  const [lang, setLang] = useNextState<'zh' | 'ja'>(typeof window !== 'undefined' ? (localStorage.getItem('lang') as 'zh' | 'ja') || 'zh' : 'zh');
  
  useNextEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const isJa = params.get('lang') === 'ja';
      setForceJa(isJa);
      
      // 检查是否是 00111 管理员
      const adminId = params.get('adminId');
      setIsAdmin00111(adminId === '00111');
    }
  }, []);
  const [list, setList] = useNextState<RegisterForm[]>([]);
  const [selected, setSelected] = useNextState<number[]>([]);
  const [editModal, setEditModal] = useNextState<{ show: boolean; item: RegisterForm | null; idx: number | null }>({ show: false, item: null, idx: null });
  const [viewModal, setViewModal] = useNextState<{ show: boolean; item: RegisterForm | null }>({ show: false, item: null });
  const [dateErrors, setDateErrors] = useNextState<{visaDate?: string, insuranceDate?: string, healthDate?: string}>({});
  const [customFields, setCustomFields] = useNextState<string[]>([]);
  const [showFieldSelector, setShowFieldSelector] = useNextState(false);
  const [showDetail, setShowDetail] = useNextState(false);
  const [selectedItem, setSelectedItem] = useNextState<RegisterForm | null>(null);
  const [previewImg, setPreviewImg] = useNextState<string | null>(null);

  useNextEffect(() => {
    const data = JSON.parse(localStorage.getItem('registerList') || '[]');
    setList(data);
  }, []);

  // 删除单条
  const handleDelete = (idx: number) => {
    const newList = list.filter((_, i) => i !== idx);
    setList(newList);
    localStorage.setItem('registerList', JSON.stringify(newList));
  };

  // 批量删除
  const handleBatchDelete = () => {
    if (selected.length === 0) return;
    if (!confirm('選択した項目を削除しますか？')) return;
    const newList = list.filter((_, i) => !selected.includes(i));
    setList(newList);
    localStorage.setItem('registerList', JSON.stringify(newList));
    setSelected([]);
  };

  // 编辑（弹窗/跳转，先留占位）
  const handleEdit = (idx: number) => {
    setEditModal({ show: true, item: list[idx], idx });
  };

  // 查看详情
  const handleView = (item: RegisterForm) => {
    setSelectedItem(item);
    setShowDetail(true);
  };

  // 日期校验函数
  function isValidDate(str: string) {
    if (!str) return false;
    // 支持 yyyy-mm-dd 或 yyyy/MM/dd
    const d = str.replace(/\//g, '-');
    const m = d.match(/^\d{4}-\d{2}-\d{2}$/);
    if (!m) return false;
    const date = new Date(d);
    return !isNaN(date.getTime());
  }

  function isDateInRange(str: string, min: string, max: string) {
    if (!isValidDate(str)) return false;
    const d = new Date(str.replace(/\//g, '-'));
    return d >= new Date(min) && d <= new Date(max);
  }

  // 保存编辑
  const handleSaveEdit = () => {
    const errors: {visaDate?: string, insuranceDate?: string, healthDate?: string} = {};
    const { visaDate, insuranceDate, healthDate } = editModal.item || {};
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    // healthDate区间
    const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate() + 1);
    const oneYearAgoStr = oneYearAgo.toISOString().slice(0, 10);

    // visaDate/insuranceDate 必须是有效日期且不早于今天
    if (visaDate) {
      if (!isValidDate(visaDate)) {
        errors.visaDate = forceJa ? '日付形式エラー' : '日期格式错误';
      } else {
        const d = new Date(visaDate.replace(/\//g, '-'));
        if (d < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
          errors.visaDate = forceJa ? '本日以前の日付は選択できません' : '日期不能早于今天';
        }
      }
    }
    if (insuranceDate) {
      if (!isValidDate(insuranceDate)) {
        errors.insuranceDate = forceJa ? '日付形式エラー' : '日期格式错误';
      } else {
        const d = new Date(insuranceDate.replace(/\//g, '-'));
        if (d < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
          errors.insuranceDate = forceJa ? '本日以前の日付は選択できません' : '日期不能早于今天';
        }
      }
    }
    // healthDate 必须在一年内
    if (healthDate) {
      if (!isValidDate(healthDate)) {
        errors.healthDate = forceJa ? '日付形式エラー' : '日期格式错误';
      } else {
        const d = new Date(healthDate.replace(/\//g, '-'));
        if (d < oneYearAgo || d > today) {
          errors.healthDate = forceJa ? '本日から1年以内の日付のみ選択可能' : '日期只能选当天起1年以内';
        }
      }
    }
    setDateErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (editModal.item && editModal.idx !== null) {
      const newList = [...list];
      newList[editModal.idx] = editModal.item;
      setList(newList);
      localStorage.setItem('registerList', JSON.stringify(newList));
      setEditModal({ show: false, item: null, idx: null });
    }
  };

  // 选择/取消选择
  const handleSelect = (idx: number) => {
    setSelected(sel => sel.includes(idx) ? sel.filter(i => i !== idx) : [...sel, idx]);
  };

  const handleSelectAll = () => {
    if (selected.length === list.length) setSelected([]);
    else setSelected(list.map((_, i) => i));
  };

  // 批量导出 PDF
  const handleBatchExportPDF = () => {
    if (selected.length === 0) return;
    const items = list.filter((_, i) => selected.includes(i));
    try {
      const doc = new jsPDF({
        unit: 'pt',
        hotfixes: ['px_scaling'],
        putOnlyUsedFonts: true,
        orientation: 'portrait'
      });

      // 注册字体
      try { registerFont(doc); } catch (e) { doc.setFont('helvetica'); }

      const margin = 40;
      const pageWidth = 595.28; // A4 宽度（pt）
      const maxWidth = pageWidth - (margin * 2);

      items.forEach((item, idx) => {
        if (idx > 0) doc.addPage();
        
        let y = 40;
        
        // 添加标题
        doc.setFontSize(16);
        const title = '個人情報';
        doc.text(title, pageWidth / 2, y, { align: 'center' });
        y += 30;

        // 设置正文字体大小
        doc.setFontSize(12);
        
        const fields = [
          { label: '氏名', value: (item.firstName || '') + ' ' + (item.lastName || '') },
          { label: 'ふりがな', value: (item.firstNameKana || '') + ' ' + (item.lastNameKana || '') },
          { label: 'ローマ字', value: (item.firstNameRomaji || '') + ' ' + (item.lastNameRomaji || '') },
          { label: '職種', value: item.jobType },
        ];

        fields.forEach(f => {
          if (f.value) {
            const text = `${f.label}: ${f.value}`;
            const lines = doc.splitTextToSize(text, maxWidth);
            
            lines.forEach((line: string) => {
              if (y > 800) { // A4 高度（pt）
                doc.addPage();
                y = 40;
              }
              doc.text(line, margin, y);
              y += 20;
            });
          }
        });
      });

      if (items.length === 1) {
        const name = `${items[0].firstName}${items[0].lastName}`;
        doc.save(`${name}.pdf`);
      } else {
        doc.save('名簿导出.pdf');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('PDFの生成中にエラーが発生しました');
    }
  };

  // 添加选项常量
  const nationalityOptions = [
    { value: "中国", label: "中国" },
    { value: "日本", label: "日本" },
    { value: "其他", label: "その他" },
  ];

  const visaOptions = [
    { value: "技术", label: "技術" },
    { value: "人文知识", label: "人文知識" },
    { value: "技能实习", label: "技能実習" },
    { value: "永住", label: "永住" },
    { value: "定住", label: "定住" },
    { value: "家族滞在", label: "家族滞在" },
    { value: "其他", label: "その他" },
  ];

  const jobOptions = [
    { value: "LGS", label: "LGS" },
    { value: "PB", label: "PB" },
    { value: "造作", label: "造作" },
    { value: "其他", label: "その他" },
  ];

  const relationshipOptions = [
    { value: "配偶", label: "配偶" },
    { value: "父母", label: "父母" },
    { value: "子女", label: "子" },
    { value: "兄弟姐妹", label: "兄弟姉妹" },
    { value: "其他亲属", label: "その他の親族" },
    { value: "朋友", label: "友人" },
    { value: "同事", label: "同僚" },
    { value: "其他", label: "その他" },
  ];

  // 可选字段
  const optionalFields = [
    { key: 'jobType', label: '職種' },
    { key: 'nationality', label: '国籍' },
    { key: 'phone', label: '電話' },
    { key: 'address', label: '住所' },
    { key: 'bloodPressure', label: '血圧' },
    { key: 'height', label: '身長' },
    { key: 'weight', label: '体重' },
    // ...可扩展
  ];

  // 语言切换按钮
  const langSwitch = (
    <div className="absolute top-4 right-4 flex gap-2 z-50">
      <OutlineButton
        className={`px-3 py-1.5 rounded-full text-sm font-bold ${lang === 'zh' ? 'border-2' : ''}`}
        onClick={() => { setLang('zh'); if (typeof window !== 'undefined') { localStorage.setItem('lang', 'zh'); location.reload(); } }}
      >
        中文
      </OutlineButton>
      <OutlineButton
        className={`px-3 py-1.5 rounded-full text-sm font-bold ${lang === 'ja' ? 'border-2' : ''}`}
        onClick={() => { setLang('ja'); if (typeof window !== 'undefined') { localStorage.setItem('lang', 'ja'); location.reload(); } }}
      >
        日本語
      </OutlineButton>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 p-8 relative">
      {langSwitch}
      <OutlineButton
        className="mb-6 px-4 py-2 rounded font-medium transition-all self-start shadow-sm text-lg font-bold"
        onClick={() => router.back()}
      >
        返回
      </OutlineButton>
      <div className="p-8 max-w-4xl mx-auto mt-16 bg-white dark:bg-neutral-900 rounded-xl shadow-md flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-4">{texts[lang].title}</h1>
        <button
          className="mb-4 px-3 py-1 border rounded"
          onClick={() => setShowFieldSelector(true)}
        >
          {texts[lang].customize}
        </button>
        {showFieldSelector && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow-lg">
              <h3 className="font-bold mb-2">{texts[lang].customizeClose}</h3>
              <div className="flex flex-col gap-2 mb-4">
                {optionalFields.map(f => (
                  <label key={f.key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={customFields.includes(f.key)}
                      onChange={e => {
                        if (e.target.checked) setCustomFields(fields => [...fields, f.key]);
                        else setCustomFields(fields => fields.filter(k => k !== f.key));
                      }}
                    />
                    {f.label}
                  </label>
                ))}
              </div>
              <div className="flex gap-4 justify-end">
                <button className="px-4 py-2 border rounded" onClick={() => setShowFieldSelector(false)}>{texts[lang].close}</button>
              </div>
            </div>
          </div>
        )}
        {/* 批量操作按钮 */}
        {!isAdmin00111 && (
          <div className="mb-4 flex gap-2">
            <button className="bg-red-600 text-white px-4 py-2 rounded" onClick={handleBatchDelete} disabled={selected.length === 0}>{texts[lang].batchDelete}</button>
            <button className="bg-blue-700 text-white px-4 py-2 rounded" onClick={handleBatchExportPDF} disabled={selected.length === 0}>{texts[lang].batchPDF}</button>
          </div>
        )}
        <div className="overflow-auto" style={{ maxHeight: '60vh' }}>
          <table className="min-w-full border">
            <thead>
              <tr>
                {/* 复选框列 */}
                {!isAdmin00111 && (
                  <th className="border px-2 py-2">
                    <input type="checkbox" checked={selected.length > 0} onChange={handleSelectAll} />
                  </th>
                )}
                <th className="border px-4 py-2">{texts[lang].number}</th>
                <th className="border px-4 py-2">{texts[lang].name}</th>
                <th className="border px-4 py-2">{texts[lang].kana}</th>
                <th className="border px-4 py-2">{texts[lang].romaji}</th>
                <th className="border px-4 py-2">{texts[lang].birth}</th>
                {optionalFields.filter(f => customFields.includes(f.key)).map(f => (
                  <th key={f.key} className="border px-4 py-2">{f.label}</th>
                ))}
                <th className="border px-4 py-2">{texts[lang].action}</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin00111 ? 6 : 7 + customFields.length} className="border px-4 py-8 text-center text-gray-400">{texts[lang].noData}</td>
                </tr>
              ) : (
                list.map((item, idx) => (
                  <tr key={idx}>
                    {/* 复选框列 */}
                    {!isAdmin00111 && (
                      <td className="border px-2 py-2">
                        <input type="checkbox" checked={selected.includes(idx)} onChange={() => handleSelect(idx)} />
                      </td>
                    )}
                    <td className="border px-4 py-2 font-mono">{String(1000 + idx).padStart(4, '0')}</td>
                    <td className="border px-4 py-2 cursor-pointer hover:underline" onClick={() => handleView(item)}>{item.firstName} {item.lastName}</td>
                    <td className="border px-4 py-2">{item.firstNameKana} {item.lastNameKana}</td>
                    <td className="border px-4 py-2">{item.firstNameRomaji} {item.lastNameRomaji}</td>
                    <td className="border px-4 py-2">{item.birth || ''}</td>
                    {optionalFields.filter(f => customFields.includes(f.key)).map(f => (
                      <td key={f.key} className="border px-4 py-2">{
                        f.key === 'jobType' ? item.jobType :
                        (item as any)[f.key] || ''
                      }</td>
                    ))}
                    <td className="border px-4 py-2 flex gap-2 min-w-[180px] whitespace-nowrap">
                      {item && typeof item === 'object' && 'firstName' in item ? (
                        <>
                          {/* 只要不是00111才显示编辑和删除 */}
                          {!isAdmin00111 && (
                            <>
                              <button
                                className="bg-yellow-500 text-white px-2 py-1 rounded whitespace-nowrap"
                                onClick={e => { e.stopPropagation(); handleEdit(idx); }}
                                aria-label={texts[lang].edit}
                              >{texts[lang].edit}</button>
                              <button
                                className="bg-red-500 text-white px-2 py-1 rounded whitespace-nowrap"
                                onClick={e => { e.stopPropagation(); handleDelete(idx); }}
                                aria-label={texts[lang].delete}
                              >{texts[lang].delete}</button>
                            </>
                          )}
                          {/* PDF导出按钮所有人都可见 */}
                          <button
                            className="bg-blue-500 text-white px-2 py-1 rounded whitespace-nowrap"
                            onClick={e => {
                              e.stopPropagation();
                              handleView(item);
                            }}
                            aria-label={texts[lang].detail}
                          >{texts[lang].detail}</button>
                          <button
                            className="bg-blue-500 text-white px-2 py-1 rounded whitespace-nowrap"
                            onClick={e => {
                              e.stopPropagation();
                              // PDF导出逻辑可复用
                              const doc = new jsPDF({
                                unit: 'pt',
                                hotfixes: ['px_scaling'],
                                putOnlyUsedFonts: true,
                                orientation: 'portrait'
                              });
                              try { registerFont(doc); } catch (e) { doc.setFont('helvetica'); }
                              doc.setFontSize(12);
                              doc.text(`${texts[lang].name}: ${item.firstName} ${item.lastName}`, 10, 20);
                              doc.text(`${texts[lang].kana}: ${item.firstNameKana} ${item.lastNameKana}`, 10, 30);
                              doc.text(`${texts[lang].romaji}: ${item.firstNameRomaji} ${item.lastNameRomaji}`, 10, 40);
                              doc.text(`${texts[lang].jobType}: ${item.jobType}`, 10, 50);
                              doc.save(`${item.firstName}${item.lastName}.pdf`);
                            }}
                            aria-label={texts[lang].pdf}
                          >{texts[lang].pdf}</button>
                        </>
                      ) : (
                        <span className="text-gray-400">{texts[lang].noData}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {editModal.show && editModal.item && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 w-[95vw] max-w-2xl shadow-lg flex flex-col gap-4 overflow-y-auto" style={{maxHeight:'90vh'}}>
              <h3 className="text-lg font-semibold mb-2">{texts[lang].edit}</h3>
              <div className="flex flex-col gap-2 text-sm">
                {/* 基本信息 */}
                <div className="flex gap-2 items-center">
                  <label className="w-24">姓</label>
                  <input className="border rounded px-3 py-2 flex-1" value={editModal.item?.firstName || ''} onChange={e => setEditModal({ ...editModal, item: { ...editModal.item!, firstName: e.target.value } })} />
                </div>
                <div className="flex gap-2 items-center">
                  <label className="w-24">名</label>
                  <input className="border rounded px-3 py-2 flex-1" value={editModal.item?.lastName || ''} onChange={e => setEditModal({ ...editModal, item: { ...editModal.item!, lastName: e.target.value } })} />
                </div>
                <div className="flex gap-2 items-center">
                  <label className="w-24">姓(ふりがな)</label>
                  <input className="border rounded px-3 py-2 flex-1" value={editModal.item?.firstNameKana || ''} onChange={e => setEditModal({ ...editModal, item: { ...editModal.item!, firstNameKana: e.target.value } })} />
                </div>
                <div className="flex gap-2 items-center">
                  <label className="w-24">名(ふりがな)</label>
                  <input className="border rounded px-3 py-2 flex-1" value={editModal.item?.lastNameKana || ''} onChange={e => setEditModal({ ...editModal, item: { ...editModal.item!, lastNameKana: e.target.value } })} />
                </div>
                <div className="flex gap-2 items-center">
                  <label className="w-24">姓(ローマ字)</label>
                  <input className="border rounded px-3 py-2 flex-1" value={editModal.item?.firstNameRomaji || ''} onChange={e => setEditModal({ ...editModal, item: { ...editModal.item!, firstNameRomaji: e.target.value } })} />
                </div>
                <div className="flex gap-2 items-center">
                  <label className="w-24">名(ローマ字)</label>
                  <input className="border rounded px-3 py-2 flex-1" value={editModal.item?.lastNameRomaji || ''} onChange={e => setEditModal({ ...editModal, item: { ...editModal.item!, lastNameRomaji: e.target.value } })} />
                </div>
                <div className="flex gap-2 items-center">
                  <label className="w-24">性別</label>
                  <input className="border rounded px-3 py-2 flex-1" value={editModal.item?.gender || ''} onChange={e => setEditModal({ ...editModal, item: { ...editModal.item!, gender: e.target.value } })} />
                </div>
                <div className="flex gap-2 items-center">
                  <label className="w-24">生年月日</label>
                  <input className="border rounded px-3 py-2 flex-1" value={editModal.item?.birth || ''} onChange={e => setEditModal({ ...editModal, item: { ...editModal.item!, birth: e.target.value } })} />
                </div>
                <div className="flex gap-2 items-center">
                  <label className="w-24">年齢</label>
                  <input className="border rounded px-3 py-2 flex-1" value={editModal.item?.age || ''} onChange={e => setEditModal({ ...editModal, item: { ...editModal.item!, age: e.target.value } })} />
                </div>
                {/* 国籍与签证 */}
                <div className="flex gap-2 items-center">
                  <label className="w-24">国籍</label>
                  <select 
                    className="border rounded px-3 py-2 flex-1"
                    value={editModal.item?.nationality || ''}
                    onChange={e => setEditModal({ ...editModal, item: { ...editModal.item!, nationality: e.target.value } })}
                  >
                    <option value="">選択してください</option>
                    {nationalityOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                {editModal.item?.nationality === "其他" && (
                  <div className="flex gap-2 items-center">
                    <label className="w-24">その他の国籍</label>
                    <input 
                      className="border rounded px-3 py-2 flex-1"
                      value={editModal.item?.nationalityOther || ''}
                      onChange={e => setEditModal({ ...editModal, item: { ...editModal.item!, nationalityOther: e.target.value } })}
                      placeholder="その他の国籍を入力"
                    />
                  </div>
                )}
                {editModal.item?.nationality !== "日本" && (
                  <>
                    <div className="flex gap-2 items-center">
                      <label className="w-24">在留資格</label>
                      <select 
                        className="border rounded px-3 py-2 flex-1"
                        value={editModal.item?.visaType || ''}
                        onChange={e => setEditModal({ ...editModal, item: { ...editModal.item!, visaType: e.target.value } })}
                      >
                        <option value="">選択してください</option>
                        {visaOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {editModal.item?.visaType === "其他" && (
                      <div className="flex gap-2 items-center">
                        <label className="w-24">その他の在留資格</label>
                        <input 
                          className="border rounded px-3 py-2 flex-1"
                          value={editModal.item?.visaOther || ''}
                          onChange={e => setEditModal({ ...editModal, item: { ...editModal.item!, visaOther: e.target.value } })}
                          placeholder="その他の在留資格を入力"
                        />
                      </div>
                    )}
                  </>
                )}
                <div className="flex gap-2 items-center">
                  <label className="w-24">在留カード期限</label>
                  <input className="border rounded px-3 py-2 flex-1" value={editModal.item?.visaExpiry || ''} onChange={e => setEditModal({ ...editModal, item: { ...editModal.item!, visaExpiry: e.target.value } })} />
                </div>
                {dateErrors.visaDate && <div className="text-red-500 text-xs ml-24">{dateErrors.visaDate}</div>}
                <div className="flex gap-2 items-center">
                  <label className="w-24">労災保険満了日</label>
                  <input className="border rounded px-3 py-2 flex-1" value={editModal.item?.insuranceExpiry || ''} onChange={e => setEditModal({ ...editModal, item: { ...editModal.item!, insuranceExpiry: e.target.value } })} />
                </div>
                {dateErrors.insuranceDate && <div className="text-red-500 text-xs ml-24">{dateErrors.insuranceDate}</div>}
                {/* 工作信息 */}
                <div className="flex gap-2 items-center">
                  <label className="w-24">職種</label>
                  <div className="flex-1 flex flex-wrap gap-2">
                    {jobOptions.map(option => (
                      <label key={option.value} className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={editModal.item?.jobs?.includes(option.value) || false}
                          onChange={e => {
                            const jobs = editModal.item?.jobs || [];
                            const newJobs = e.target.checked
                              ? [...jobs, option.value]
                              : jobs.filter(j => j !== option.value);
                            setEditModal({ ...editModal, item: { ...editModal.item!, jobs: newJobs } });
                          }}
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <label className="w-24">経験年数(年)</label>
                  <input className="border rounded px-3 py-2 flex-1" value={editModal.item?.expYear || ''} onChange={e => setEditModal({ ...editModal, item: { ...editModal.item!, expYear: e.target.value } })} />
                </div>
                <div className="flex gap-2 items-center">
                  <label className="w-24">経験年数(月)</label>
                  <input className="border rounded px-3 py-2 flex-1" value={editModal.item?.expMonth || ''} onChange={e => setEditModal({ ...editModal, item: { ...editModal.item!, expMonth: e.target.value } })} />
                </div>
                {/* 住址信息 */}
                <div className="flex gap-2 items-center">
                  <label className="w-24">郵便番号</label>
                  <input 
                    className="border rounded px-3 py-2 flex-1"
                    value={editModal.item?.postalCode || ''}
                    onChange={e => {
                      let v = e.target.value.replace(/[^0-9]/g, "");
                      if (v.length > 3) v = v.slice(0, 3) + "-" + v.slice(3, 7);
                      setEditModal({ ...editModal, item: { ...editModal.item!, postalCode: v.slice(0, 8) } });
                    }}
                    maxLength={8}
                    placeholder="郵便番号を入力（例：1234567）"
                  />
                </div>
                <div className="flex gap-2 items-center">
                  <label className="w-24">住所</label>
                  <input className="border rounded px-3 py-2 flex-1" value={editModal.item?.address || ''} onChange={e => setEditModal({ ...editModal, item: { ...editModal.item!, address: e.target.value } })} />
                </div>
                <div className="flex gap-2 items-center">
                  <label className="w-24">詳細住所</label>
                  <input className="border rounded px-3 py-2 flex-1" value={editModal.item?.addressDetail || ''} onChange={e => setEditModal({ ...editModal, item: { ...editModal.item!, addressDetail: e.target.value } })} />
                </div>
                <div className="flex gap-2 items-center">
                  <label className="w-24">電話番号</label>
                  <input className="border rounded px-3 py-2 flex-1" value={editModal.item?.phone || ''} onChange={e => setEditModal({ ...editModal, item: { ...editModal.item!, phone: e.target.value } })} />
                </div>
                {/* 健康信息 */}
                <div className="flex gap-2 items-center">
                  <label className="w-24">健康診断日</label>
                  <input className="border rounded px-3 py-2 flex-1" value={editModal.item?.healthCheckDate || ''} onChange={e => setEditModal({ ...editModal, item: { ...editModal.item!, healthCheckDate: e.target.value } })} />
                </div>
                {dateErrors.healthDate && <div className="text-red-500 text-xs ml-24">{dateErrors.healthDate}</div>}
                <div className="flex gap-2 items-center">
                  <label className="w-24">血圧(高)</label>
                  <input className="border rounded px-3 py-2 flex-1" value={editModal.item?.bloodPressure || ''} onChange={e => setEditModal({ ...editModal, item: { ...editModal.item!, bloodPressure: e.target.value } })} />
                </div>
                <div className="flex gap-2 items-center">
                  <label className="w-24">血圧(低)</label>
                  <input className="border rounded px-3 py-2 flex-1" value={editModal.item?.bpLow || ''} onChange={e => setEditModal({ ...editModal, item: { ...editModal.item!, bpLow: e.target.value } })} />
                </div>
                <div className="flex gap-2 items-center">
                  <label className="w-24">血液型</label>
                  <input className="border rounded px-3 py-2 flex-1" value={editModal.item?.blood || ''} onChange={e => setEditModal({ ...editModal, item: { ...editModal.item!, blood: e.target.value } })} />
                </div>
                {/* 紧急联系人信息 */}
                <div className="flex gap-2 items-center">
                  <label className="w-32">緊急連絡先氏名</label>
                  <input className="border rounded px-3 py-2 flex-1" value={editModal.item?.emergencyContact || ''} onChange={e => setEditModal({ ...editModal, item: { ...editModal.item!, emergencyContact: e.target.value } })} />
                </div>
                <div className="flex gap-2 items-center">
                  <label className="w-32">緊急連絡先ふりがな</label>
                  <input className="border rounded px-3 py-2 flex-1" value={editModal.item?.emergencyContactKana || ''} onChange={e => setEditModal({ ...editModal, item: { ...editModal.item!, emergencyContactKana: e.target.value } })} />
                </div>
                <div className="flex gap-2 items-center">
                  <label className="w-32">関係</label>
                  <select 
                    className="border rounded px-3 py-2 flex-1"
                    value={editModal.item?.relationship || ''}
                    onChange={e => {
                      const value = e.target.value;
                      setEditModal({ 
                        ...editModal, 
                        item: { 
                          ...editModal.item!, 
                          relationship: value,
                          relationshipOther: value !== "其他" ? "" : editModal.item?.relationshipOther
                        } 
                      });
                    }}
                  >
                    <option value="">選択してください</option>
                    {relationshipOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                {editModal.item?.relationship === "其他" && (
                  <div className="flex gap-2 items-center">
                    <label className="w-32">関係(その他)</label>
                    <input 
                      className="border rounded px-3 py-2 flex-1"
                      value={editModal.item?.relationshipOther || ''}
                      onChange={e => setEditModal({ ...editModal, item: { ...editModal.item!, relationshipOther: e.target.value } })}
                      placeholder="その他の関係を入力"
                    />
                  </div>
                )}
                <div className="flex gap-2 items-center">
                  <label className="w-32">緊急連絡先電話番号</label>
                  <input className="border rounded px-3 py-2 flex-1" value={editModal.item?.emergencyPhone || ''} onChange={e => setEditModal({ ...editModal, item: { ...editModal.item!, emergencyPhone: e.target.value } })} />
                </div>
                <div className="flex gap-2 items-center">
                  <label className="w-32">郵便番号</label>
                  <div className="flex-1 flex gap-2">
                    <input 
                      className="border rounded px-3 py-2 flex-1"
                      value={editModal.item?.emgZip || ''}
                      onChange={e => {
                        let v = e.target.value.replace(/[^0-9]/g, "");
                        if (v.length > 3) v = v.slice(0, 3) + "-" + v.slice(3, 7);
                        setEditModal({ ...editModal, item: { ...editModal.item!, emgZip: v.slice(0, 8) } });
                      }}
                      maxLength={8}
                      placeholder="郵便番号を入力（例：1234567）"
                    />
                    <button
                      className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 whitespace-nowrap"
                      onClick={() => {
                        if (editModal.item) {
                          setEditModal({
                            ...editModal,
                            item: {
                              ...editModal.item,
                              emgZip: editModal.item.postalCode || '',
                              emgAddress: editModal.item.address || '',
                              emgSelectedChome: editModal.item.selectedChome || '',
                              emgDetailAddress: editModal.item.addressDetail || ''
                            }
                          });
                        }
                      }}
                    >
                      同上
                    </button>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <label className="w-32">住所</label>
                  <input className="border rounded px-3 py-2 flex-1" value={editModal.item?.emgAddress || ''} onChange={e => setEditModal({ ...editModal, item: { ...editModal.item!, emgAddress: e.target.value } })} />
                </div>
                <div className="flex gap-2 items-center">
                  <label className="w-32">詳細住所</label>
                  <input className="border rounded px-3 py-2 flex-1" value={editModal.item?.emgDetailAddress || ''} onChange={e => setEditModal({ ...editModal, item: { ...editModal.item!, emgDetailAddress: e.target.value } })} />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button className="flex-1 bg-neutral-800 text-white py-2 rounded hover:bg-neutral-700" onClick={handleSaveEdit}>{texts[lang].save}</button>
                <button className="flex-1 border py-2 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700" onClick={() => setEditModal({ show: false, item: null, idx: null })}>{texts[lang].cancel}</button>
              </div>
            </div>
          </div>
        )}
        {viewModal.show && viewModal.item && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 w-96 max-w-[95vw] shadow-lg flex flex-col gap-4">
              <h3 className="text-lg font-semibold mb-2">{texts[lang].detail}</h3>
              <div className="flex flex-col gap-2 text-sm overflow-y-auto" style={{ maxHeight: '60vh' }}>
                {/* 基本信息 */}
                <div><strong>{texts[lang].name}:</strong> {viewModal.item.firstName} {viewModal.item.lastName}</div>
                <div><strong>{texts[lang].kana}:</strong> {viewModal.item.firstNameKana} {viewModal.item.lastNameKana}</div>
                <div><strong>{texts[lang].romaji}:</strong> {viewModal.item.firstNameRomaji} {viewModal.item.lastNameRomaji}</div>
                <div><strong>性別:</strong> {viewModal.item.gender}</div>
                <div><strong>{texts[lang].birth}:</strong> {viewModal.item.birth}</div>
                <div><strong>年齢:</strong> {viewModal.item.age}</div>
                {/* 国籍与签证 */}
                <div><strong>国籍:</strong> {viewModal.item.nationality}</div>
                {viewModal.item.nationalityOther && <div><strong>その他の国籍:</strong> {viewModal.item.nationalityOther}</div>}
                <div><strong>在留資格:</strong> {viewModal.item.visaType}</div>
                {viewModal.item.visaOther && <div><strong>その他の在留資格:</strong> {viewModal.item.visaOther}</div>}
                <div><strong>在留カード期限:</strong> {viewModal.item.visaExpiry}</div>
                <div><strong>労災保険満了日:</strong> {viewModal.item.insuranceExpiry}</div>
                {/* 工作信息 */}
                <div><strong>職種:</strong> {viewModal.item.jobType}</div>
                <div><strong>経験年数:</strong> {viewModal.item.expYear || ''}{(viewModal.item.expYear || viewModal.item.expMonth) ? '年' : ''}{viewModal.item.expMonth ? `${viewModal.item.expMonth}月` : ''}</div>
                {/* 住址信息 */}
                <div><strong>郵便番号:</strong> {viewModal.item.postalCode}</div>
                <div><strong>住所:</strong> {[viewModal.item.address, viewModal.item.selectedChome, viewModal.item.addressDetail].filter(Boolean).join(' ')}</div>
                <div><strong>電話番号:</strong> {viewModal.item.phone}</div>
                {/* 健康信息 */}
                <div><strong>健康診断日:</strong> {viewModal.item.healthCheckDate}</div>
                <div><strong>血圧(高):</strong> {viewModal.item.bloodPressure}</div>
                <div><strong>血圧(低):</strong> {viewModal.item.bpLow}</div>
                <div><strong>血液型:</strong> {viewModal.item.blood}</div>
                {/* 紧急联系人信息 */}
                <div><strong>氏名:</strong> {viewModal.item.emergencyContact}</div>
                <div><strong>ふりがな:</strong> {viewModal.item.emergencyContactKana}</div>
                <div><strong>関係:</strong> {viewModal.item.relationship}{viewModal.item.relationshipOther ? `（${viewModal.item.relationshipOther}）` : ''}</div>
                <div><strong>電話番号:</strong> {viewModal.item.emergencyPhone}</div>
                <div><strong>郵便番号:</strong> {viewModal.item.emgZip}</div>
                <div><strong>住所:</strong> {[viewModal.item.emgAddress, viewModal.item.emgSelectedChome, viewModal.item.emgDetailAddress].filter(Boolean).join(' ')}</div>
                {/* 上传照片信息 */}
                {viewModal.item.photos && (
                  <div>
                    <strong>証明書写真:</strong>
                    <ul className="ml-2 list-disc">
                      {viewModal.item.photos.map((img: string, idx: number) => (
                        <li key={idx}>{img}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="flex flex-row flex-wrap gap-2 mt-4 justify-end min-w-[320px]">
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  onClick={async () => {
                    try {
                      const item = viewModal.item;
                      if (!item) return;

                      const doc = new jsPDF({
                        unit: 'pt',
                        hotfixes: ['px_scaling'],
                        putOnlyUsedFonts: true,
                        orientation: 'portrait'
                      });

                      // 注册字体
                      try { registerFont(doc); } catch (e) { doc.setFont('helvetica'); }

                      // 设置初始位置
                      let y = 40;
                      const margin = 40;
                      const pageWidth = 595.28; // A4 宽度（pt）
                      const maxWidth = pageWidth - (margin * 2);

                      // 添加标题
                      doc.setFontSize(16);
                      const title = '個人情報';
                      doc.text(title, pageWidth / 2, y, { align: 'center' });
                      y += 30;

                      // 设置正文字体大小
                      doc.setFontSize(12);

                      // 准备字段数据
                      const fields = [
                        { label: '氏名', value: (item.firstName || '') + ' ' + (item.lastName || '') },
                        { label: 'ふりがな', value: (item.firstNameKana || '') + ' ' + (item.lastNameKana || '') },
                        { label: 'ローマ字', value: (item.firstNameRomaji || '') + ' ' + (item.lastNameRomaji || '') },
                        { label: '性別', value: item.gender },
                        { label: '生年月日', value: item.birth },
                        { label: '年齢', value: item.age },
                        { label: '国籍', value: item.nationality },
                        { label: 'その他の国籍', value: item.nationalityOther },
                        { label: '在留資格', value: item.visaType },
                        { label: 'その他の在留資格', value: item.visaOther },
                        { label: '在留カード期限', value: item.visaExpiry },
                        { label: '労災保険満了日', value: item.insuranceExpiry },
                        { label: '職種', value: item.jobType },
                        { label: '経験', value: item.exp },
                        { label: '郵便番号', value: item.postalCode },
                        { label: '住所', value: [item.address, item.addressDetail, item.selectedChome].filter(Boolean).join(' ') },
                        { label: '電話番号', value: item.phone },
                        { label: '健康診断日', value: item.healthCheckDate },
                        { label: '血圧(高)', value: item.bloodPressure },
                        { label: '血圧(低)', value: item.bpLow },
                        { label: '血液型', value: item.blood },
                        { label: '緊急連絡先氏名', value: item.emergencyContact },
                        { label: '緊急連絡先ふりがな', value: item.emergencyContactKana },
                        { label: '緊急連絡先電話番号', value: item.emergencyPhone },
                        { label: '緊急連絡先住所', value: [item.emgAddress, item.emgDetailAddress, item.emgSelectedChome].filter(Boolean).join(' ') },
                      ];

                      // 添加内容
                      fields.forEach(f => {
                        if (f.value && String(f.value).trim() !== '') {
                          const text = `${f.label}: ${f.value}`;
                          const lines = doc.splitTextToSize(text, maxWidth);
                          
                          lines.forEach((line: string) => {
                            if (y > 800) { doc.addPage(); y = 40; }
                            doc.text(line, margin, y);
                            y += 20;
                          });
                        }
                      });

                      // 保存文件
                      doc.save(`${item.firstName}${item.lastName}.pdf`);
                    } catch (error) {
                      console.error('Error generating PDF:', error);
                      alert('PDFの生成中にエラーが発生しました');
                    }
                  }}
                >{texts[lang].download}</button>
                <button
                  className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                  onClick={() => {
                    if (!viewModal.item) return;
                    const idx = list.findIndex(i => i === viewModal.item);
                    setEditModal({ show: true, item: viewModal.item, idx });
                    setViewModal({ show: false, item: null });
                  }}
                >{texts[lang].edit}</button>
                <button
                  className="px-4 py-2 border rounded hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  onClick={() => setViewModal({ show: false, item: null })}
                >
                  {texts[lang].close}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* 详情弹窗 */}
        {showDetail && selectedItem && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-lg">
              <h3 className="text-lg font-bold mb-4">{texts[lang].detail}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  {/* 基本信息 */}
                  <div className="mb-2">氏名：{selectedItem.firstName} {selectedItem.lastName}</div>
                  <div className="mb-2">フリガナ：{selectedItem.firstNameKana} {selectedItem.lastNameKana}</div>
                  <div className="mb-2">ローマ字：{selectedItem.firstNameRomaji} {selectedItem.lastNameRomaji}</div>
                  <div className="mb-2">性別：{selectedItem.gender}</div>
                  <div className="mb-2">生年月日：{selectedItem.birth}</div>
                  <div className="mb-2">年齢：{selectedItem.age}歳</div>

                  {/* 国籍信息 */}
                  <div className="mb-2">国籍：{selectedItem.nationality}{selectedItem.nationality === '其他' && selectedItem.nationalityOther ? `（${selectedItem.nationalityOther}）` : ''}</div>
                  {selectedItem.nationality !== '日本' && (
                    <>
                      <div className="mb-2">在留資格：{selectedItem.visaType}{selectedItem.visaType === '其他' && selectedItem.visaOther ? `（${selectedItem.visaOther}）` : ''}</div>
                      <div className="mb-2">在留カード期限：{selectedItem.visaDate}</div>
                    </>
                  )}

                  {/* 工作信息 */}
                  <div className="mb-2">職種：{selectedItem.jobType}</div>
                  <div className="mb-2">経験年数：{selectedItem.expYear}年{selectedItem.expMonth}月</div>
                  <div className="mb-2">労災保険満了日：{selectedItem.insuranceDate}</div>

                  {/* 联系信息 */}
                  <div className="mb-2">郵便番号：{selectedItem.postalCode}</div>
                  <div className="mb-2">住所：{selectedItem.address}</div>
                  <div className="mb-2">電話番号：{selectedItem.phone}</div>

                  {/* 健康信息 */}
                  <div className="mb-2">健康診断日：{selectedItem.healthDate}</div>
                  <div className="mb-2">血圧：{selectedItem.bloodPressure}{selectedItem.bloodPressure && selectedItem.bpLow ? '/' : ''}{selectedItem.bpLow}</div>
                  <div className="mb-2">血液型：{selectedItem.blood}</div>

                  {/* 紧急联系人信息 */}
                  <div className="mb-2">緊急連絡先氏名：{selectedItem.emergencyContact}</div>
                  <div className="mb-2">緊急連絡先ふりがな：{selectedItem.emergencyContactKana}</div>
                  <div className="mb-2">本人との関係：{selectedItem.relationship}{selectedItem.relationship === '其他' && selectedItem.relationshipOther ? `（${selectedItem.relationshipOther}）` : ''}</div>
                  <div className="mb-2">緊急連絡先電話番号：{selectedItem.emergencyPhone}</div>
                  <div className="mb-2">緊急連絡先郵便番号：{selectedItem.emgZip}</div>
                  <div className="mb-2">緊急連絡先住所：{selectedItem.emergencyAddress}</div>
                </div>
                {/* 照片展示区域 */}
                <div className="border-l pl-4">
                  <div className="space-y-4">
                    {selectedItem.photos && selectedItem.photos.length > 0 && (
                      <div>
                        <span className="font-medium block mb-2">アップロード写真：</span>
                        <div className="flex flex-wrap gap-2">
                          {selectedItem.photos.map((img: string, idx: number) => (
                            <img 
                              key={idx} 
                              src={img} 
                              alt={`Photo ${idx + 1}`} 
                              className="w-32 h-32 object-cover rounded-lg border border-gray-200 cursor-pointer"
                              onClick={() => setPreviewImg(img)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {Object.entries(selectedItem).map(([key, value]) => {
                      if (typeof value === 'string' && value.startsWith('data:image/')) {
                        return (
                          <div key={key}>
                            <span className="font-medium block mb-2">{key}：</span>
                            <img 
                              src={value} 
                              alt={key} 
                              className="w-32 h-32 object-cover rounded-lg border border-gray-200 cursor-pointer"
                              onClick={() => setPreviewImg(value)}
                            />
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <OutlineButton
                  className="px-4 py-2 rounded font-medium"
                  onClick={() => setShowDetail(false)}
                >{texts[lang].close}</OutlineButton>
              </div>
            </div>
            {/* 图片放大预览弹窗 */}
            {previewImg && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setPreviewImg(null)}>
                <img src={previewImg} alt="预览" className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-2xl border-4 border-white" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 