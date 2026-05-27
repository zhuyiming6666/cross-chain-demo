"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card } from "primereact/card";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { useRef } from "react";

const DEMO_ACCOUNTS = [
  { label: "医院管理员 - 张伟", value: "hospital_admin" },
  { label: "医生 - 李医生", value: "doctor" },
  { label: "研究员 - 王研究员", value: "researcher" },
  { label: "监管员 - 赵监管", value: "regulator" },
  { label: "系统管理员", value: "admin" },
];

export default function LoginPage() {
  const [username, setUsername] = useState("hospital_admin");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useRef<Toast>(null);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        username,
        password: password || "demo",
        redirect: false,
      });
      if (result?.error) {
        toast.current?.show({ severity: "error", summary: "登录失败", detail: "用户不存在" });
      } else {
        router.push("/dashboard");
      }
    } catch {
      toast.current?.show({ severity: "error", summary: "登录失败", detail: "网络错误" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-100 via-surface-50 to-blue-100 p-4">
      <Toast ref={toast} />
      <Card className="w-full max-w-md shadow-2xl" pt={{ content: { className: "p-0" } }}>
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-surface-900 mb-2">
              跨链医疗数据安全共享
            </h1>
            <h2 className="text-lg text-surface-600">与隐私身份系统</h2>
            <div className="mt-3">
              <span className="bg-primary text-white text-xs px-3 py-1 rounded-full">
                Demo
              </span>
            </div>
          </div>
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div>
              <label className="text-sm font-medium text-surface-700 block mb-1">选择演示账号</label>
              <Dropdown
                value={username}
                options={DEMO_ACCOUNTS}
                onChange={(e) => setUsername(e.value)}
                className="w-full"
                placeholder="选择账号"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-surface-700 block mb-1">密码（随意输入）</label>
              <InputText
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
                placeholder="Demo 环境可随意填写"
              />
            </div>
            <Button
              type="submit"
              label={loading ? "登录中..." : "登 录"}
              loading={loading}
              className="w-full"
            />
          </form>
          <p className="text-xs text-surface-400 text-center mt-6">
            Demo 环境 · 选择账号即可体验不同角色功能
          </p>
        </div>
      </Card>
    </div>
  );
}
