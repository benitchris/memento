import { AuthGuard } from '@/components/auth-guard';

export default function HostLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
