"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "primereact/button";
import { Avatar } from "primereact/avatar";
import { Menu } from "primereact/menu";
import { Badge } from "primereact/badge";
import { Skeleton } from "primereact/skeleton";

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

const ROLE_NAV: Record<string, NavItem[]> = {
  hospital: [
    { label: "数字资源管理", path: "/hospital/resources", icon: "pi pi-database" },
    { label: "创建资源", path: "/hospital/resources/create", icon: "pi pi-plus-circle" },
    { label: "权限策略", path: "/hospital/policies", icon: "pi pi-shield" },
    { label: "计算任务", path: "/hospital/compute", icon: "pi pi-cog" },
  ],
  research: [
    { label: "计算模板", path: "/research/templates", icon: "pi pi-file-code" },
    { label: "计算任务", path: "/research/compute", icon: "pi pi-cog" },
    { label: "创建计算任务", path: "/research/compute/create", icon: "pi pi-plus-circle" },
  ],
  doctor: [
    { label: "身份登记", path: "/doctor/register", icon: "pi pi-id-card" },
    { label: "我的凭证", path: "/doctor/credentials", icon: "pi pi-verified" },
    { label: "生成证明", path: "/doctor/prove", icon: "pi pi-check-circle" },
  ],
  regulator: [
    { label: "凭证签发", path: "/regulator/issue", icon: "pi pi-pencil" },
    { label: "审计日志", path: "/regulator/audit", icon: "pi pi-list" },
    { label: "身份追溯", path: "/regulator/recovery", icon: "pi pi-search" },
  ],
};

const ROLE_LABELS: Record<string, string> = {
  hospital: "医院端",
  research: "科研端",
  doctor: "医生端",
  regulator: "监管端",
};

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (status !== "loading" && !session) {
      router.push("/login");
    }
  }, [status, session, router]);

  if (status === "loading" || !session) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton height="64px" />
        <Skeleton height="400px" />
      </div>
    );
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const user = session.user as any;
  const role: string = user?.role || "doctor";
  const navItems = ROLE_NAV[role] || [];
  const roleLabel = ROLE_LABELS[role] || role;

  function handleLogout() {
    signOut({ callbackUrl: "/login" });
  }

  const sidebar = (
    <div className="w-64 min-h-screen bg-surface-800 text-white flex flex-col">
      <div className="p-5 border-b border-surface-700">
        <h1 className="text-lg font-bold">跨链医疗数据安全共享</h1>
        <p className="text-xs text-surface-400 mt-1">隐私身份系统 Demo</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        <button
          onClick={() => router.push("/dashboard")}
          className={`w-full text-left px-4 py-2.5 rounded-lg flex items-center gap-3 text-sm transition-colors ${pathname === "/dashboard" ? "bg-primary text-white" : "text-surface-300 hover:bg-surface-700 hover:text-white"}`}
        >
          <i className="pi pi-home" /> 系统看板
        </button>
        <div className="pt-3 pb-1 px-3">
          <span className="text-xs text-surface-500 font-semibold uppercase">{roleLabel}</span>
        </div>
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            className={`w-full text-left px-4 py-2.5 rounded-lg flex items-center gap-3 text-sm transition-colors ${pathname?.startsWith(item.path) ? "bg-primary text-white" : "text-surface-300 hover:bg-surface-700 hover:text-white"}`}
          >
            <i className={item.icon} /> {item.label}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-surface-700">
        <button
          onClick={handleLogout}
          className="w-full text-left px-4 py-2 rounded-lg text-surface-400 hover:bg-surface-700 hover:text-white transition-colors text-sm flex items-center gap-2"
        >
          <i className="pi pi-sign-out" /> 退出登录
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-surface-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:block">{sidebar}</aside>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="md:hidden fixed left-0 top-0 z-50 h-full">{sidebar}</div>
        </>
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="h-16 bg-surface-0 border-b border-surface-200 flex items-center justify-between px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden text-surface-600 p-1"
              onClick={() => setSidebarOpen(true)}
            >
              <i className="pi pi-bars text-xl" />
            </button>
            <span className="text-sm text-surface-500 hidden sm:block">跨链医疗数据安全共享与隐私身份系统</span>
          </div>
          <div className="flex items-center gap-3">
            <Badge value={roleLabel} severity="info" className="text-xs" />
            <div className="flex items-center gap-2">
              <Avatar icon="pi pi-user" shape="circle" size="normal" />
              <span className="text-sm text-surface-700 font-medium hidden sm:block">{user?.displayName}</span>
            </div>
            <Button
              icon="pi pi-sign-out"
              severity="secondary"
              text
              rounded
              onClick={handleLogout}
              tooltip="退出登录"
              pt={{ root: { className: "hidden sm:flex" } }}
            />
          </div>
        </header>
        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
