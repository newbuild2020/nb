'use client';

import { useRouter } from 'next/navigation';
import AdminForm from '@/app/components/AdminForm';
import OutlineButton from '../../manager/OutlineButton';

export default function NewAdminPage() {
  const router = useRouter();

  const handleSubmit = (data: any) => {
    console.log('Form submitted:', data);
    // 这里添加你的提交逻辑
    router.push('/admin/admins'); // 提交后返回管理员列表页
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <OutlineButton
            className="px-4 py-2 rounded font-medium transition-all shadow-sm text-lg font-bold"
            onClick={() => router.back()}
          >
            返回
          </OutlineButton>
          <h1 className="text-2xl font-bold">添加管理员</h1>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-xl p-8 shadow-md">
          <AdminForm onSubmit={handleSubmit} />
        </div>
      </div>
    </div>
  );
} 