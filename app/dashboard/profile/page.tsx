import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "./ProfileForm";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  const me = (session!.user as any).id;

  const user = await prisma.user.findUnique({
    where: { id: me },
    select: { id: true, name: true, email: true, role: true, sector: true, avatarUrl: true },
  });

  if (!user) return null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white drop-shadow">Mi perfil</h1>
        <p className="text-white/65 text-sm mt-1">Editá tu información personal y contraseña</p>
      </div>
      <ProfileForm user={user} />
    </div>
  );
}
