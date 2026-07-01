import Sidebar from "@/components/Sidebar";
import AuthGuard from "@/components/AuthGuard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="md:hidden h-14" />
          {/* TODO SECURITY: proteger BackOffice com autenticação e permissões antes do deploy definitivo. */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 px-5 py-2 text-center text-xs text-amber-700 dark:text-amber-400 font-medium">
            ⚠️ Ambiente administrativo temporário. Proteger com autenticação antes do uso público.
          </div>
          <div className="p-5 md:p-8 max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
