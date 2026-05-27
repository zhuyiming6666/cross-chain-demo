"use client";

import { useRef, useState } from "react";
import { Card } from "primereact/card";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Checkbox } from "primereact/checkbox";
import { Divider } from "primereact/divider";
import { Fieldset } from "primereact/fieldset";

const DEMO_CREDENTIALS = [
  { id: "1", name: "医生资格 (doctor_license)", claims: ["name", "unit", "education", "title", "department"] },
  { id: "2", name: "伦理审批 (ethics_approval)", claims: ["name", "unit", "project", "approval_number"] },
];

export default function DoctorProvePage() {
  const toast = useRef<Toast>(null);
  const [credentialId, setCredentialId] = useState("");
  const [purpose, setPurpose] = useState("");
  const [disclosed, setDisclosed] = useState<string[]>([]);

  const selectedCred = DEMO_CREDENTIALS.find((c) => c.id === credentialId);

  async function handleGenerate() {
    const proofText = "0x" + Math.random().toString(16).substring(2, 42);
    toast.current?.show({ severity: "success", summary: "证明生成成功", detail: `零知识证明: ${proofText.slice(0, 18)}...` });
    setCredentialId(""); setPurpose(""); setDisclosed([]);
  }

  return (
    <div className="space-y-6">
      <Toast ref={toast} />

      <div>
        <h2 className="text-2xl font-bold text-surface-900">生成零知识证明</h2>
        <p className="text-surface-500 mt-1 text-sm">基于已有凭证生成选择性披露证明，仅向验证方透露必要的身份属性</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="证明配置" pt={{ title: { className: "text-lg font-semibold text-surface-900" } }}>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-surface-700 block mb-1">选择凭证 *</label>
                <Dropdown
                  value={credentialId}
                  options={DEMO_CREDENTIALS.map((c) => ({ label: c.name, value: c.id }))}
                  onChange={(e) => { setCredentialId(e.value); setDisclosed([]); }}
                  className="w-full"
                  placeholder="选择要生成证明的凭证"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-surface-700 block mb-1">业务用途 *</label>
                <InputText value={purpose} onChange={(e) => setPurpose(e.target.value)} className="w-full" placeholder="如：跨院会诊申请" />
              </div>

              {selectedCred && (
                <Fieldset legend="选择披露声明字段" pt={{ legend: { className: "text-sm font-medium text-surface-700 px-2" }, content: { className: "p-3" } }}>
                  <p className="text-xs text-surface-500 mb-3">仅勾选的字段会包含在证明中，其他字段保持隐藏</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {selectedCred.claims.map((claim) => (
                      <div key={claim} className="flex items-center gap-2 p-2 rounded-lg border border-surface-200 hover:border-primary/30 transition-colors">
                        <Checkbox
                          inputId={claim}
                          checked={disclosed.includes(claim)}
                          onChange={(e) => {
                            if (e.checked) setDisclosed([...disclosed, claim]);
                            else setDisclosed(disclosed.filter((c) => c !== claim));
                          }}
                        />
                        <label htmlFor={claim} className="text-sm text-surface-700 cursor-pointer capitalize">{claim}</label>
                      </div>
                    ))}
                  </div>
                </Fieldset>
              )}

              <Divider />

              <div>
                <label className="text-sm font-medium text-surface-700 block mb-1">证明预览</label>
                <InputTextarea
                  value={disclosed.length > 0 ? `选择性披露: ${disclosed.join(", ")}\n凭证: ${selectedCred?.name}\n用途: ${purpose || "(未填写)"}` : ""}
                  className="w-full"
                  rows={3}
                  readOnly
                  placeholder="选择凭证和字段后自动生成证明预览"
                />
              </div>

              <Button label="生成零知识证明" icon="pi pi-check-circle" onClick={handleGenerate} disabled={!credentialId || !purpose || disclosed.length === 0} />
            </div>
          </Card>
        </div>

        <div>
          <Card title="什么是零知识证明？" pt={{ title: { className: "text-lg font-semibold text-surface-900" } }}>
            <div className="space-y-3 text-sm text-surface-600">
              <div className="flex items-start gap-2">
                <i className="pi pi-eye-slash text-primary mt-0.5 shrink-0" />
                <span>零知识证明允许您向验证方证明您拥有某个凭证，而无需透露凭证的全部内容</span>
              </div>
              <div className="flex items-start gap-2">
                <i className="pi pi-check text-primary mt-0.5 shrink-0" />
                <span>您可以<strong>选择性披露</strong>凭证中的部分字段，例如仅透露姓名和科室，隐藏学历和职称</span>
              </div>
              <div className="flex items-start gap-2">
                <i className="pi pi-lock text-primary mt-0.5 shrink-0" />
                <span>生成的证明具有<strong>密码学安全性</strong>，验证方可以确认真实性但无法获取未披露信息</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
