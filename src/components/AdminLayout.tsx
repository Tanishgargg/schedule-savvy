import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-white">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <main className="flex-1 p-4 md:p-8 lg:p-10">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
  );
}