import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RegisterUserForm } from "./RegisterUserForm";
import { AddSectorForm } from "./AddSectorForm";
import { UsersTable } from "./UsersTable";
import { SectorsTable } from "./SectorsTable";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  const user = session!.user as any;
  if (user.role !== "ADMIN" && user.role !== "EDITOR" && user.role !== "GESTOR") redirect("/dashboard");

  const isAdmin = user.role === "ADMIN" || user.role === "GESTOR";

  const [users, sectors] = await Promise.all([
    isAdmin ? prisma.user.findMany({ orderBy: { createdAt: "desc" } }) : Promise.resolve([]),
    prisma.sector.findMany({ orderBy: { name: "asc" } }),
  ]);

  const glassCard = {
    background: "rgba(255,255,255,0.15)",
    backdropFilter: "blur(20px) saturate(180%)",
    WebkitBackdropFilter: "blur(20px) saturate(180%)",
    border: "1px solid rgba(255,255,255,0.3)",
    boxShadow: "0 4px 24px rgba(31,38,135,0.1), inset 0 1px 0 rgba(255,255,255,0.4)",
  } as React.CSSProperties;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white drop-shadow">
        {isAdmin ? "Administración" : "Gestión de sectores"}
      </h1>

      {/* Sector management — visible for EDITOR and ADMIN */}
      <div className={isAdmin ? "grid md:grid-cols-2 gap-6" : ""}>
        <div style={glassCard} className="rounded-2xl p-6">
          <h2 className="font-semibold text-white mb-4">Agregar sector</h2>
          <AddSectorForm />
        </div>

        {/* User registration — ADMIN only */}
        {isAdmin && (
          <div style={glassCard} className="rounded-2xl p-6">
            <h2 className="font-semibold text-white mb-4">Registrar usuario</h2>
            <RegisterUserForm sectors={sectors} />
          </div>
        )}
      </div>

      <div style={glassCard} className="rounded-2xl overflow-hidden">
        <div style={{ borderBottom: "1px solid rgba(255,255,255,0.2)" }} className="px-6 py-4">
          <h2 className="font-semibold text-white">Sectores ({sectors.length})</h2>
        </div>
        <SectorsTable sectors={sectors} />
      </div>

      {/* Users table — ADMIN only */}
      {isAdmin && (
        <div style={glassCard} className="rounded-2xl overflow-hidden">
          <div style={{ borderBottom: "1px solid rgba(255,255,255,0.2)" }} className="px-6 py-4">
            <h2 className="font-semibold text-white">Usuarios ({users.length})</h2>
          </div>
          <UsersTable users={users} sectors={sectors} />
        </div>
      )}
    </div>
  );
}
