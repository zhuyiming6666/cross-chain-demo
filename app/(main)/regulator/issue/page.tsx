"use client";

import { useRef, useState } from "react";
import { Card } from "primereact/card";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Fieldset } from "primereact/fieldset";
import { Divider } from "primereact/divider";
import { Tag } from "primereact/tag";

const TEMPLATES = [
  { id: "1", name: "医生资格", type: "doctor_license", fields: ["name", "unit", "education", "title", "department"] },
  { id: "2", name: "科研资质", type: "research_qualification", fields: ["name", "unit", "title", "project"] },
  { id: "3", name: "伦理审批", type: "ethics_approval", fields: ["name", "unit", "project", "approval_number"] },
];

const RECIPIENTS = [
  { label: "李医生 (doctor@hospital.js.cn)", value: "762bd7e4-fe90-4546-9fb3-93f9e7338df7" },
  { label: "王研究员 (wang@research.js.cn)", value: "550e8400-e29b-41d4-a716-446655440002" },
];

export default function RegulatorIssuePage() {
  const toast = useRef<Toast>(null);
  const [templateId, setTemplateId] = useState("");
  const [recipient, setRecipient] = useState("");
  const [formData, setFormData] = useState<Record<string, string>>({});

  const selectedTemplate = TEMPLATES.find((t) => t.id === templateId);

  async function handleIssue() {
    toast.current?.show({ severity: "success", summary: "凭证签发成功", detail: `已向接收方签发 ${selectedTemplate?.name}` });
    setTemplateId(""); setRecipient(""); setFormData({});
  }

  const allFieldsFilled = selectedTemplate ? selectedTemplate.fields.every((f) => formData[f]?.trim()) : false;

  return (
    <div className="space-y-6">
      <Toast ref={toast} />

      <div>
        <h2 className="text-2xl font-bold text-surface-900">凭证签发</h2>
        <p className="text-surface-500 mt-1 text-sm">作为监管机构，为医生和科研人员签发可验证凭证 (Verifiable Credential)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="签发可验证凭证 (VC)" pt={{ title: { className: "text-lg font-semibold text-surface-900" } }}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-surface-700 block mb-1">凭证模板 *</label>
                  <Dropdown
                    value={templateId}
                    options={TEMPLATES.map((t) => ({ label: `${t.name} (${t.type})`, value: t.id }))}
                    onChange={(e) => { setTemplateId(e.value); setFormData({}); }}
                    className="w-full"
                    placeholder="选择凭证模板"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-surface-700 block mb-1">接收方 *</label>
                  <Dropdown
                    value={recipient}
                    options={RECIPIENTS}
                    onChange={(e) => setRecipient(e.value)}
                    className="w-full"
                    placeholder="选择凭证接收方"
                  />
                </div>
              </div>

              {selectedTemplate && (
                <Fieldset legend="声明内容" pt={{ legend: { className: "text-sm font-medium text-surface-700 px-2" }, content: { className: "p-3" } }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedTemplate.fields.map((field) => (
                      <div key={field}>
                        <label className="text-xs text-surface-500 block mb-1 capitalize">{field}</label>
                        <InputText
                          value={formData[field] || ""}
                          onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                          className="w-full"
                          placeholder={`输入 ${field}`}
                        />
                      </div>
                    ))}
                  </div>
                </Fieldset>
              )}

              <Divider />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-surface-500">
                  <i className="pi pi-info-circle" />
                  <span>已选模板: {selectedTemplate ? <Tag value={selectedTemplate.name} severity="info" /> : "—"}</span>
                </div>
                <Button label="签发凭证" icon="pi pi-pencil" onClick={handleIssue} disabled={!templateId || !recipient || !allFieldsFilled} />
              </div>
            </div>
          </Card>
        </div>

        <div>
          <Card title="凭证模板说明" pt={{ title: { className: "text-lg font-semibold text-surface-900" } }}>
            <div className="space-y-4">
              {TEMPLATES.map((t) => (
                <div key={t.id} className="p-3 rounded-lg border border-surface-200">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="pi pi-file text-primary" />
                    <span className="font-medium text-surface-800 text-sm">{t.name}</span>
                  </div>
                  <code className="text-xs text-surface-500">{t.type}</code>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {t.fields.map((f) => (
                      <span key={f} className="text-xs bg-surface-100 text-surface-600 px-1.5 py-0.5 rounded">{f}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
