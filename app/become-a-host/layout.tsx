import { AuthGuard } from '@/components/auth-guard';

export default function BecomeAHostLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
