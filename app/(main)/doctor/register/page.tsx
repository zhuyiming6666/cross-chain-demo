"use client";

import { useRef, useState } from "react";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Divider } from "primereact/divider";

export default function DoctorRegisterPage() {
  const toast = useRef<Toast>(null);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [chain, setChain] = useState("");
  const [lastDid, setLastDid] = useState("");

  async function handleRegister() {
    const did = `did:medical:${name}@${unit}`;
    setLastDid(did);
    toast.current?.show({ severity: "success", summary: "DID 登记成功", detail: did });
    setName(""); setUnit(""); setChain("");
  }

  return (
    <div className="space-y-6">
      <Toast ref={toast} />

      <div>
        <h2 className="text-2xl font-bold text-surface-900">医生身份登记</h2>
        <p className="text-surface-500 mt-1 text-sm">创建去中心化身份 (DID)，用于后续凭证申请与跨机构身份验证</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="创建去中心化身份 (DID)" pt={{ title: { className: "text-lg font-semibold text-surface-900" } }}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-surface-700 block mb-1">姓名 *</label>
                  <InputText value={name} onChange={(e) => setName(e.target.value)} className="w-full" placeholder="医生姓名" />
                </div>
                <div>
                  <label className="text-sm font-medium text-surface-700 block mb-1">单位 *</label>
                  <InputText value={unit} onChange={(e) => setUnit(e.target.value)} className="w-full" placeholder="所属医院" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-surface-700 block mb-1">注册链 *</label>
                <Dropdown
                  value={chain}
                  options={[
                    { label: "医院链 (chain_hospital)", value: "11111111-1111-1111-1111-111111111111" },
                    { label: "监管链 (chain_regulator)", value: "33333333-3333-3333-3333-333333333333" },
                  ]}
                  onChange={(e) => setChain(e.value)}
                  className="w-full"
                  placeholder="选择注册链"
                />
              </div>
              <Divider />
              <Button label="创建 DID" icon="pi pi-id-card" onClick={handleRegister} disabled={!name || !unit || !chain} />
            </div>
          </Card>
        </div>

        <div>
          <Card title="说明" pt={{ title: { className: "text-lg font-semibold text-surface-900" } }}>
            <div className="space-y-3 text-sm text-surface-600">
              <div className="flex items-start gap-2">
                <i className="pi pi-info-circle text-primary mt-0.5 shrink-0" />
                <span>DID 是您在医疗数据共享网络中的唯一身份标识</span>
              </div>
              <div className="flex items-start gap-2">
                <i className="pi pi-shield text-primary mt-0.5 shrink-0" />
                <span>DID 关联您的公钥，用于后续签发凭证和生成零知识证明</span>
              </div>
              <div className="flex items-start gap-2">
                <i className="pi pi-globe text-primary mt-0.5 shrink-0" />
                <span>选择不同链注册将影响您的身份在哪些网络中可用</span>
              </div>
            </div>
          </Card>

          {lastDid && (
            <Card title="最近注册" className="mt-4" pt={{ title: { className: "text-lg font-semibold text-surface-900" } }}>
              <code className="text-xs bg-surface-100 px-2 py-1 rounded block break-all">{lastDid}</code>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
