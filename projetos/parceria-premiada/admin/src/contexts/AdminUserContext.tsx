"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type AdminRole = "admin" | "operador" | "parceiro";

export interface AdminUser {
  id: string;
  nome: string;
  role: AdminRole;
  email: string;
}

interface AdminUserState {
  adminUser: AdminUser | null;
  loading: boolean;
}

const AdminUserContext = createContext<AdminUserState>({ adminUser: null, loading: true });

export function AdminUserProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AdminUserState>({ adminUser: null, loading: true });

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setState({ adminUser: null, loading: false }); return; }

      const { data, error } = await supabase.rpc("get_my_admin_profile");
      if (error || !data || data.length === 0) {
        setState({ adminUser: null, loading: false });
        return;
      }

      const row = data[0];
      setState({
        adminUser: { id: row.id, nome: row.nome, role: row.role, email: user.email ?? "" },
        loading: false,
      });
    }
    fetchProfile();
  }, []);

  return (
    <AdminUserContext.Provider value={state}>
      {children}
    </AdminUserContext.Provider>
  );
}

export function useAdminUser() {
  return useContext(AdminUserContext);
}
