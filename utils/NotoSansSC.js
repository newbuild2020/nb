// jsPDF font definition for NotoSansSC-Regular
// export const fontData = 'AAEAAAALAIAAAwAwT1MvMg8SBJcAAAC8AAAAYGNtYXAWwAABAAABHAAAAFRnYXNwAAAAEAAAAXgAAABUZ2x5ZgAAABwAAAGgAAABCGhlYWQAAAB4AAABuAAAADZoaGVhAAAB+AAAAbwAAAAkaG10eAAACAAAAAAgAAAAIGxvY2EAAAIYAAABwAAAABRtYXhwAAACkAAAAgAAAAAgbmFtZQAAAsAAAAI4AAABwnBvc3QAAAMQAAAB2AAAACRwcmVwAAADgAAAAgAAAAIAAAACAAAwAAQAAAEAAAAAAAAAAEAAAEAAAAAAAgAAAAAAAAAAAEAAAEAAADwAAEAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAABAAAAAAAEAAQAAABAAAwABAAAAAAQAAwABAAAAAAUAAwABAAAAAAYAAwABAAAAAAcAAwABAAAAAAkAAwABAAAAAAoAAwABAAAAAAsAAwABAAAAAAwAAwABAAAAAA0AAwABAAAAAA4AAwABAAAAAA8AAwABAAAAABAAAwABAAAAABEAAgABAAAAABIAAwABAAAAABMAAwABAAAAABQAAwABAAAAABUAAwABAAAAABYAAwABAAAAABcAAwABAAAAABgAAwABAAAAABkAAwABAAAAABoAAwABAAAAABsAAwABAAAAABwAAwABAAAAAB0AAwABAAAAAB4AAwABAAAAAB8AAwABAAAAACAAAwABAAAAACEAAwABAAAAACIAAwABAAAAACMAAwABAAAAACQAAwABAAAAACUAAwABAAAAACYAAwABAAAAACcAAwABAAAAACgAAwABAAAAACkAAwABAAAAACoAAwABAAAAACsAAwABAAAAACwAAwABAAAAAC0AAwABAAAAAC4AAwABAAAAAC8AAwABAAAAADAAAwABAAAAADEAAwABAAAAADIAAwABAAAAADMAAwABAAAAADQAAwABAAAAADUAAwABAAAAADYAAwABAAAAADcAAwABAAAAADgAAwABAAAAADkAAwABAAAAADoAAwABAAAAADsAAwABAAAAADwAAwABAAAAAD0AAwABAAAAAD4AAwABAAAAAD8AAwABAAAAAEAAAwABAAAAAEEAAwABAAAAAEIAAwABAAAAAEMAAwABAAAAAEQAAwABAAAAAEUAAwABAAAAAEYAAwABAAAAAEcAAwABAAAAAEgAAwABAAAAAEkAAwABAAAAAEoAAwABAAAAAEsAAwABAAAAAEwAAwABAAAAAE0AAwABAAAAAE4AAwABAAAAAE8AAwABAAAAAF...'; // 这里应为完整base64字符串

export const registerFont = (doc) => {guo
  // doc.setFont('NotoSansSC');
  // 不注册字体，使用默认字体
};

export function calcAge(birth) {
  if (!birth) return '';
  const birthDate = typeof birth === 'string' ? new Date(birth) : birth;
  if (isNaN(birthDate)) return '';
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function validateName(name) {
  return name.trim().length > 0;
}

export function validateBirth(birth) {
  if (!birth) return false;
  const age = calcAge(birth);
  return age >= 16;
}

export function parseBirthInput(input) {
  const val = input.replace(/\D/g, '');
  if (val.length !== 8) return '';
  return `${val.slice(0, 4)}-${val.slice(4, 6)}-${val.slice(6, 8)}`;
}

const API_BASE_URL = 'https://www.newbuild.jp'; 

// 不要在这里写 useCallback 和 autoFillTestData 

// const handleConfirmSubmit = useCallback(() => {
//   localStorage.setItem('registerList', JSON.stringify([{ ...form, lang }]));
//   setShowConfirmModal(false);
//   router.push('/register/upload');
// }, [form, lang, router]); 

// const userInfo = (
//   <div className="mb-6 p-4 rounded bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 w-full">
//     <div className="flex flex-wrap text-sm">
//       <div className="w-1/2 min-w-[180px] mb-1">
//         <span className="font-semibold">{lang === 'zh' ? '姓名' : '氏名'}:</span> {form.firstName} {form.lastName}
//       </div>
//       <div className="w-1/2 min-w-[180px] mb-1">
//         <span className="font-semibold">{lang === 'zh' ? 'ふりがな' : 'ふりがな'}:</span> {form.firstNameFurigana} {form.lastNameFurigana}
//       </div>
//       <div className="w-1/2 min-w-[180px] mb-1">
//         <span className="font-semibold">{lang === 'zh' ? '罗马字' : 'ローマ字'}:</span> {form.firstNameRomaji} {form.lastNameRomaji}
//       </div>
//       <div className="w-1/2 min-w-[180px] mb-1">
//         <span className="font-semibold">{lang === 'zh' ? '国籍' : '国籍'}:</span> {form.nationality}{form.nationalityOther ? `（${form.nationalityOther}）` : ''}
//       </div>
//     </div>
//   </div>
// ); 