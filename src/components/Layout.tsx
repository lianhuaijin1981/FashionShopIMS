import { type ReactNode } from 'react';
import TopBar from './TopBar';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#F8F5F2]">
      <TopBar />
      <div className="flex flex-1 pt-16">
        <Sidebar />
        <main className="ml-[228px] flex-1 overflow-y-auto bg-[#F8F5F2] p-8 pb-12 transition-all duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}
