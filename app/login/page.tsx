import { Suspense } from "react";
import LoginForm from "@/components/ui/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">กำลังโหลด...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}