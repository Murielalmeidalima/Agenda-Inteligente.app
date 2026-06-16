import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ProfileProvider } from '@/providers/profile-provider';
import { DashboardContentWrapper } from '@/components/layout/DashboardContentWrapper';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProfileProvider>
      <div className="flex bg-background min-h-screen transition-colors duration-300">
        <Sidebar />
        <main className="flex-1 transition-all duration-300 ml-20 md:ml-64 p-4 md:p-8">
          <DashboardContentWrapper>
            {children}
          </DashboardContentWrapper>
        </main>
      </div>
    </ProfileProvider>
  );
}
