import { headers } from "next/headers";
import { AdminUserProvider } from "@/contexts/AdminUserContext";
import AuthGuard from "@/components/AuthGuard";
import { AdminInfoBanner } from "@/components/AdminInfoBanner";
import { IdleTimeout } from "@/components/IdleTimeout";
import Sidebar from "@/components/Sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const hdrs = await headers();
  const ip =
    hdrs.get("x-real-ip") ??
    hdrs.get("x-forwarded-for")?.split(",")[0].trim() ??
    null;

  return (
    <AdminUserProvider>
      <AuthGuard>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden md:pt-0 pt-14">
            <AdminInfoBanner ip={ip} />
            <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
              {children}
            </main>
          </div>
        </div>
        <IdleTimeout />
      </AuthGuard>
    </AdminUserProvider>
  );
}
