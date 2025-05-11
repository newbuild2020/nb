"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';
import OutlineButton from "../manager/OutlineButton";
import { fieldsConfig } from "../../config/fieldsConfig";

interface AccountInfo {
  account: string;
  password: string;
  name: string;
  birth: string;
  nationality: string;
  phone: string;
  code: number;
  lastName: string;
  firstName: string;
}

const fieldLabels: { [key: string]: string } = {
  firstName: "姓",
  lastName: "名",
  firstNameFurigana: "姓(ふりがな)",
  lastNameFurigana: "名(ふりがな)",
  firstNameRomaji: "姓(ローマ字)",
  lastNameRomaji: "名(ローマ字)",
  gender: "性别",
  birth: "出生年月日",
  age: "年龄",
  nationality: "国籍",
  nationalityOther: "其他国籍",
  visa: "在留资格",
  visaOther: "其他在留资格",
  visaDate: "在留卡期限",
  jobs: "职种",
  exp: "经验",
  expYear: "经验(年)",
  expMonth: "经验(月)",
  zip: "邮编",
  address: "住址",
  selectedChome: "丁目",
  phone: "电话",
  healthDate: "健康检查日",
  bpHigh: "血压(高)",
  bpLow: "血压(低)",
  bloodPressure: "血压",
  blood: "血型",
  emgName: "紧急联系人姓名",
  emgFurigana: "紧急联系人ふりがな",
  emgPhone: "紧急联系人电话",
  emgAddress: "紧急联系人住址",
  emgSame: "紧急联系人同上",
  insuranceDate: "保险到期日",
  emgSelectedChome: "紧急联系人丁目",
  relationship: "关系",
  relationshipOther: "其他关系",
  emgZip: "紧急联系人邮编",
  lang: "语言",
  fullName: "姓名",
  fullFurigana: "ふりがな",
  fullRomaji: "罗马字",
};

const fieldLabelsJa: { [key: string]: string } = {
  fullName: "氏名",
  fullFurigana: "ふりがな",
  fullRomaji: "ローマ字",
  gender: "性別",
  birth: "生年月日",
  age: "年齢",
  nationality: "国籍",
  visa: "在留資格",
  visaOther: "在留資格（その他）",
  jobs: "職種",
  expYear: "経験年数",
  insuranceDate: "労災保険満了日",
  zip: "郵便番号",
  address: "住所",
  phone: "電話番号",
  healthDate: "健康診断日",
  bloodPressure: "血圧",
  blood: "血液型",
  emgName: "緊急連絡先氏名",
  emgFurigana: "緊急連絡先ふりがな",
  emgPhone: "緊急連絡先電話番号",
  relationship: "本人との関係",
  emgZip: "緊急連絡先郵便番号",
  emgAddress: "緊急連絡先住所",
};

// 字段顺序数组，自动从 fieldsConfig 生成，保证和 register 页面一致
const fieldOrder = fieldsConfig.map(f => f.key);

// 工具函数
function calcAge(birth: string): number | string {
  if (!/^[0-9]{8}$/.test(birth)) return '';
  const y = parseInt(birth.slice(0, 4), 10);
  const m = parseInt(birth.slice(4, 6), 10);
  const d = parseInt(birth.slice(6, 8), 10);

  const today = new Date();
  let age = today.getFullYear() - y;
  if (
    today.getMonth() + 1 < m ||
    (today.getMonth() + 1 === m && today.getDate() < d)
  ) {
    age--;
  }
  return age;
}
function calcExp(expYear: any, expMonth: any, submitDate: any) {
  let y = parseInt(expYear) || 0;
  let m = parseInt(expMonth) || 0;
  if (!submitDate) return m === 0 ? `${y}年` : `${y}年${m}月`;
  const submit = new Date(submitDate);
  const now = new Date();
  let months = (now.getFullYear() - submit.getFullYear()) * 12 + (now.getMonth() - submit.getMonth());
  m += months;
  y += Math.floor(m / 12);
  m = m % 12;
  return m === 0 ? `${y}年` : `${y}年${m}月`;
}

function formatJPDate(val: string): string {
  if (!/^[0-9]{8}$/.test(val)) return val;
  return `${val.slice(0, 4)}年${val.slice(4, 6)}月${val.slice(6, 8)}日`;
}

export default function AdminAccounts() {
  const [accounts, setAccounts] = useState<AccountInfo[]>([]);
  const [selected, setSelected] = useState<AccountInfo | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetPwd, setResetPwd] = useState("");
  const [resetError, setResetError] = useState("");
  const [lockStatus, setLockStatus] = useState<{[account: string]: boolean}>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<AccountInfo | null>(null);
  const [rawList, setRawList] = useState<any[]>([]);
  const [previewImg, setPreviewImg] = useState<string|null>(null);
  const router = useRouter();

  // 加载账号和锁定状态
  useEffect(() => {
    const list = JSON.parse(localStorage.getItem("registerList") || "[]");
    setRawList(list);
    const result = list.map((item: any, idx: number) => {
      const account = (item.firstNameRomaji + item.lastNameRomaji).replace(/\s/g, '').toUpperCase();
      const password = localStorage.getItem('userPassword_' + account) || '';
      return {
        account,
        password,
        name: item.firstName + ' ' + item.lastName,
        birth: item.birth,
        nationality: item.nationality,
        phone: item.phone,
        code: 1000 + idx,
        lastName: item.lastName,
        firstName: item.firstName,
      };
    });
    setAccounts(result);
    // 加载锁定状态
    const lockObj: {[account: string]: boolean} = {};
    result.forEach((a: AccountInfo) => {
      lockObj[a.account] = localStorage.getItem('userLocked_' + a.account) === '1';
    });
    setLockStatus(lockObj);
  }, []);

  // 新增：根据账号查找原始资料
  const getRawByAccount = (account: string) => {
    return rawList.find(item => (item.firstNameRomaji + item.lastNameRomaji).replace(/\s/g, '').toUpperCase() === account);
  };

  // 详情弹窗
  const handleShowDetail = (a: AccountInfo) => {
    setSelected(a);
    setShowDetail(true);
  };

  // 重置密码弹窗
  const handleShowReset = (a: AccountInfo) => {
    setSelected(a);
    setResetPwd("");
    setResetError("");
    setShowReset(true);
  };

  // 重置密码逻辑
  const handleResetPwd = () => {
    if (!resetPwd || !/^[0-9]{6}$/.test(resetPwd)) {
      setResetError("密码必须为6位数字");
      return;
    }
    if (selected) {
      localStorage.setItem('userPassword_' + selected.account, resetPwd);
      setAccounts(accs => accs.map(a => a.account === selected.account ? { ...a, password: resetPwd } : a));
      setShowReset(false);
    }
  };

  // 锁定/解锁账号
  const handleToggleLock = (a: AccountInfo) => {
    const locked = lockStatus[a.account];
    if (locked) {
      localStorage.removeItem('userLocked_' + a.account);
    } else {
      localStorage.setItem('userLocked_' + a.account, '1');
    }
    setLockStatus(s => ({ ...s, [a.account]: !locked }));
  };

  // 删除账号
  const handleDelete = (a: AccountInfo) => {
    setPendingDelete(a);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const a = pendingDelete;
    // 删除 registerList
    const list = JSON.parse(localStorage.getItem("registerList") || "[]");
    const newList = list.filter((item: any) => (item.firstNameRomaji + item.lastNameRomaji).replace(/\s/g, '').toUpperCase() !== a.account);
    localStorage.setItem("registerList", JSON.stringify(newList));
    // 删除密码和锁定状态
    localStorage.removeItem('userPassword_' + a.account);
    localStorage.removeItem('userLocked_' + a.account);
    setAccounts(accs => accs.filter(acc => acc.account !== a.account));
    setLockStatus(s => {
      const copy = { ...s };
      delete copy[a.account];
      return copy;
    });
    setShowDeleteConfirm(false);
    setPendingDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setPendingDelete(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 p-8">
      <OutlineButton
        className="fixed top-6 left-6 z-50 px-4 py-2 rounded font-medium transition-all shadow-sm text-lg font-bold"
        onClick={() => router.back()}
      >
        返回
      </OutlineButton>
      <div className="bg-white dark:bg-neutral-800 rounded-lg p-3 inline-block max-h-[90vh] overflow-y-auto shadow">
        <h2 className="text-xl font-bold mb-2">员工账号信息</h2>
        <table className="w-full text-sm border">
          <thead>
            <tr className="bg-neutral-100 dark:bg-neutral-700">
              <th className="border px-1 py-0.5 text-center">状态</th>
              <th className="border px-1 py-0.5 text-center">编码</th>
              <th className="border px-1 py-0.5 text-left">账号</th>
              <th className="border px-1 py-0.5 text-left">密码</th>
              <th className="border px-1 py-0.5 text-center">姓名</th>
              <th className="border px-1 py-0.5 text-center">出生年月日</th>
              <th className="border px-1 py-0.5 text-center">国籍</th>
              <th className="border px-1 py-0.5 text-center">电话</th>
              <th className="border px-1 py-0.5 text-center">操作</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a, i) => (
              <tr key={i} className="text-center">
                <td className="border px-1 py-1 text-center align-middle">
                  <span className={
                    lockStatus[a.account]
                      ? "inline-block w-4 h-4 rounded-full bg-red-500 align-middle"
                      : "inline-block w-4 h-4 rounded-full bg-green-500 align-middle"
                  }></span>
                </td>
                <td className="border px-1 py-1 text-center">{a.code}</td>
                <td className="border px-1 py-1 font-mono text-left">{a.account}</td>
                <td className="border px-1 py-1 font-mono text-left">{a.password}</td>
                <td className="border px-1 py-1 text-center whitespace-nowrap">{a.firstName} {a.lastName}</td>
                <td className="border px-1 py-1 text-center">{formatJPDate(a.birth)}</td>
                <td className="border px-1 py-1 text-center">{a.nationality}</td>
                <td className="border px-1 py-1 text-center">{a.phone}</td>
                <td className="border px-1 py-1 whitespace-nowrap">
                  <div className="flex flex-row flex-nowrap gap-0.5">
                    <OutlineButton className="w-[48px] h-8 text-sm flex items-center justify-center rounded font-medium" onClick={() => handleShowDetail(a)}>详情</OutlineButton>
                    <OutlineButton className="w-[48px] h-8 text-sm flex items-center justify-center rounded font-medium" onClick={() => handleToggleLock(a)}>{lockStatus[a.account] ? "激活" : "停用"}</OutlineButton>
                    <OutlineButton className="w-[64px] h-8 text-sm flex items-center justify-center rounded font-medium" onClick={() => handleShowReset(a)}>重置密码</OutlineButton>
                    <OutlineButton className="w-[48px] h-8 text-sm flex items-center justify-center rounded font-medium" onClick={() => handleDelete(a)}>删除</OutlineButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* 详情弹窗 */}
      {showDetail && selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-lg relative">
            {/* 导出PDF按钮 */}
            <OutlineButton
              className="absolute top-4 right-4 px-4 py-2 rounded font-medium"
              onClick={async () => {
                const raw = getRawByAccount(selected.account);
                if (!raw) return;
                const doc = new jsPDF();
                doc.setFont('NotoSansJP');
                let y = 10;
                doc.setFontSize(16);
                doc.text('アカウント詳細', 10, y);
                y += 10;
                doc.setFontSize(12);
                // 使用 fieldsConfig 顺序和日文label导出
                fieldsConfig.forEach(field => {
                  let value = raw[field.key];
                  if (field.key === 'fullName') {
                    value = (raw.firstName || '') + ' ' + (raw.lastName || '');
                  } else if (field.key === 'fullFurigana') {
                    value = (raw.firstNameFurigana || '') + ' ' + (raw.lastNameFurigana || '');
                  } else if (field.key === 'fullRomaji') {
                    value = (raw.firstNameRomaji || '') + ' ' + (raw.lastNameRomaji || '');
                  } else if (field.key === 'bloodPressure') {
                    value = `高/${raw.bpHigh || ''} 低/${raw.bpLow || ''}`;
                  }
                  if (typeof value !== 'undefined' && value !== '') {
                    doc.text(`${fieldLabelsJa[field.key] || field.key}: ${value}`, 10, y);
                    y += 8;
                  }
                });
                // 照片
                let imgY = y + 2;
                let imgX = 10;
                let imgCount = 0;
                Object.entries(raw).forEach(([key, value]) => {
                  if (typeof value === 'string' && value.startsWith('data:image/')) {
                    try {
                      doc.addImage(value, 'JPEG', imgX, imgY, 40, 40);
                      doc.text(key, imgX, imgY + 45);
                      imgX += 50;
                      imgCount++;
                      if (imgCount % 3 === 0) {
                        imgX = 10;
                        imgY += 55;
                      }
                    } catch {}
                  }
                  if (Array.isArray(value)) {
                    value.forEach((img, idx) => {
                      if (typeof img === 'string' && img.startsWith('data:image/')) {
                        try {
                          doc.addImage(img, 'JPEG', imgX, imgY, 40, 40);
                          doc.text(`${key}_${idx+1}`, imgX, imgY + 45);
                          imgX += 50;
                          imgCount++;
                          if (imgCount % 3 === 0) {
                            imgX = 10;
                            imgY += 55;
                          }
                        } catch {}
                      }
                    });
                  }
                });
                doc.save(`${selected.account}_detail.pdf`);
              }}
            >导出PDF</OutlineButton>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="mb-2">账号：{selected.account}</div>
                <div className="mb-2">姓名：{selected.name}</div>
                <div className="mb-2">出生年月日：{formatJPDate(selected.birth)}</div>
                <div className="mb-2">国籍：{selected.nationality}</div>
                <div className="mb-2">电话：{selected.phone}</div>
                <div className="mb-2">当前密码：{selected.password}</div>
                <div className="mb-2">账号状态：{lockStatus[selected.account] ? '已锁定' : '正常'}</div>
              </div>
              <div className="border-l pl-4 overflow-y-auto max-h-[60vh] flex flex-col gap-2 pr-2">
                {fieldOrder.map(key => {
                  const rawData = getRawByAccount(selected.account);
                  let value = rawData[key];
                  if (key === 'fullName') {
                    value = (rawData.firstName || '') + ' ' + (rawData.lastName || '');
                  } else if (key === 'fullFurigana') {
                    value = (rawData.firstNameFurigana || '') + ' ' + (rawData.lastNameFurigana || '');
                  } else if (key === 'fullRomaji') {
                    value = (rawData.firstNameRomaji || '') + ' ' + (rawData.lastNameRomaji || '');
                  } else if (key === 'bloodPressure') {
                    value = `高/${rawData.bpHigh || ''} 低/${rawData.bpLow || ''}`;
                  }
                  // 年龄
                  if (key === 'age') {
                    value = calcAge(rawData.birth) + '岁';
                  }
                  // 经验年数
                  if (key === 'expYear') {
                    value = calcExp(rawData.expYear, rawData.expMonth, rawData.submitDate || rawData.createdAt || '');
                  }
                  // 日期格式化
                  if (['birth', 'insuranceDate', 'healthDate'].includes(key)) {
                    value = formatJPDate(rawData[key]);
                  }
                  // 住址拼接
                  if (key === 'address') {
                    value = (rawData.autoAddress || '') + (rawData.address || '');
                  }
                  if (key === 'emgAddress') {
                    value = (rawData.emgAutoAddress || '') + (rawData.emgAddress || '');
                  }
                  // 跳过图片和照片
                  if (key === 'photos' && Array.isArray(value)) return null;
                  if (typeof value === 'string' && value.startsWith('data:image/')) return null;
                  if (typeof value !== 'undefined' && value !== '') {
                    return (
                      <div key={key}>
                        <span className="font-medium">{fieldLabels[key] || key}：</span>
                        <span className="ml-1">{String(value)}</span>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
            {/* 放大预览弹窗 */}
            {previewImg && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setPreviewImg(null)}>
                <img src={previewImg} alt="预览" className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-2xl border-4 border-white" />
              </div>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <a
                href="/admin/accounts/upload"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded font-medium text-blue-600 hover:underline border border-blue-200 bg-blue-50 mr-2"
              >证件查看</a>
              <OutlineButton
                className="px-4 py-2 rounded font-medium mr-2"
                onClick={async () => {
                  const raw = getRawByAccount(selected.account);
                  if (!raw) return;
                  const doc = new jsPDF();
                  doc.setFont('NotoSansJP');
                  let y = 10;
                  doc.setFontSize(16);
                  doc.text('アカウント詳細', 10, y);
                  y += 10;
                  doc.setFontSize(12);
                  fieldsConfig.forEach(field => {
                    let value = raw[field.key];
                    if (field.key === 'fullName') {
                      value = (raw.firstName || '') + ' ' + (raw.lastName || '');
                    } else if (field.key === 'fullFurigana') {
                      value = (raw.firstNameFurigana || '') + ' ' + (raw.lastNameFurigana || '');
                    } else if (field.key === 'fullRomaji') {
                      value = (raw.firstNameRomaji || '') + ' ' + (raw.lastNameRomaji || '');
                    } else if (field.key === 'bloodPressure') {
                      value = `高/${raw.bpHigh || ''} 低/${raw.bpLow || ''}`;
                    }
                    if (typeof value !== 'undefined' && value !== '') {
                      doc.text(`${fieldLabelsJa[field.key] || field.key}: ${value}`, 10, y);
                      y += 8;
                    }
                  });
                  let imgY = y + 2;
                  let imgX = 10;
                  let imgCount = 0;
                  Object.entries(raw).forEach(([key, value]) => {
                    if (typeof value === 'string' && value.startsWith('data:image/')) {
                      try {
                        doc.addImage(value, 'JPEG', imgX, imgY, 40, 40);
                        doc.text(key, imgX, imgY + 45);
                        imgX += 50;
                        imgCount++;
                        if (imgCount % 3 === 0) {
                          imgX = 10;
                          imgY += 55;
                        }
                      } catch {}
                    }
                    if (Array.isArray(value)) {
                      value.forEach((img, idx) => {
                        if (typeof img === 'string' && img.startsWith('data:image/')) {
                          try {
                            doc.addImage(img, 'JPEG', imgX, imgY, 40, 40);
                            doc.text(`${key}_${idx+1}`, imgX, imgY + 45);
                            imgX += 50;
                            imgCount++;
                            if (imgCount % 3 === 0) {
                              imgX = 10;
                              imgY += 55;
                            }
                          } catch {}
                        }
                      });
                    }
                  });
                  doc.save(`${selected.account}_detail.pdf`);
                }}
              >导出PDF</OutlineButton>
              <OutlineButton
                className="px-4 py-2 rounded font-medium"
                onClick={() => setShowDetail(false)}
              >关闭</OutlineButton>
            </div>
          </div>
        </div>
      )}
      {/* 重置密码弹窗 */}
      {showReset && selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 w-full max-w-md shadow-lg">
            <h3 className="text-lg font-bold mb-4">重置密码</h3>
            <div className="mb-2">账号：{selected.account}</div>
            <input
              className="border rounded px-3 py-2 w-full mb-2"
              placeholder="请输入新密码（6位数字）"
              value={resetPwd}
              maxLength={6}
              onChange={e => setResetPwd(e.target.value.replace(/[^0-9]/g, ''))}
            />
            {resetError && <div className="text-red-500 text-sm mb-2">{resetError}</div>}
            <div className="mt-6 flex justify-end gap-2">
              <OutlineButton
                className="px-4 py-2 rounded font-medium"
                onClick={() => setShowReset(false)}
              >取消</OutlineButton>
              <OutlineButton
                className="px-4 py-2 rounded font-medium"
                onClick={handleResetPwd}
              >确定重置</OutlineButton>
            </div>
          </div>
        </div>
      )}
      {/* 删除确认弹窗 */}
      {showDeleteConfirm && pendingDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 w-full max-w-md shadow-lg">
            <h3 className="text-lg font-bold mb-4 text-red-600">警告</h3>
            <div className="mb-4">确定要删除账号 <span className="font-mono text-lg text-red-600">{pendingDelete.account}</span> 吗？此操作不可恢复！</div>
            <div className="flex justify-end gap-2">
              <OutlineButton
                className="px-4 py-2 rounded font-medium"
                onClick={cancelDelete}
              >取消</OutlineButton>
              <OutlineButton className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700" onClick={confirmDelete}>确认删除</OutlineButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 