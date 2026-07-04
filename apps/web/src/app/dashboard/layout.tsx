'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { ProfileProvider } from '@/providers/profile-provider';
import { DashboardContentWrapper } from '@/components/layout/DashboardContentWrapper';
import { Menu } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import NotificationBell from '@/components/layout/notification-bell';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <ProfileProvider>
      <div className="flex flex-col lg:flex-row bg-background min-h-screen transition-colors duration-300">
        {/* Backdrop for mobile */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 lg:hidden transition-all duration-300"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {/* Main Content Wrapper */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile Top Header */}
          <header className="lg:hidden h-16 shrink-0 bg-white border-b border-slate-100 px-4 flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 active:scale-95 transition-all"
                aria-label="Abrir menu"
              >
                <Menu className="w-6 h-6" />
              </button>
              <Logo size={32} showText={true} />
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
            </div>
          </header>

          {/* Main Workspace Content */}
          <main className="flex-1 p-4 md:p-8 min-w-0">
            <DashboardContentWrapper>
              {children}
            </DashboardContentWrapper>
          </main>
        </div>
      </div>
    </ProfileProvider>
  );
}
