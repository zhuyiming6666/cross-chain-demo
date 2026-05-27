"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Steps } from "primereact/steps";
import { Toast } from "primereact/toast";
import { Checkbox } from "primereact/checkbox";
import { ResourceService } from "@/app/service/resourceService";

const resourceService = new ResourceService();

const RESOURCE_TYPES = [
  { label: "病例数据集", value: "case_dataset" },
  { label: "文件", value: "file" },
  { label: "列表", value: "list" },
  { label: "承诺", value: "commitment" },
];

export default function HospitalResourcesCreatePage() {
  const router = useRouter();
  const toast = useRef<Toast>(null);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [resourceType, setResourceType] = useState("");
  const [chainId, setChainId] = useState("");
  const [resourceHash, setResourceHash] = useState("");
  const [storageUri, setStorageUri] = useState("");
  const [selectedPolicies, setSelectedPolicies] = useState<string[]>([]);

  const steps = [{ label: "基础信息" }, { label: "资源内容" }, { label: "访问策略" }];

  function canNext(): boolean {
    if (step === 0) return !!name && !!resourceType && !!chainId;
    return true;
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const result = await resourceService.createResource({
        name, description, resource_type: resourceType, chain_id: chainId,
        resource_hash: resourceHash, storage_uri: storageUri,
        policy_template_ids: selectedPolicies,
      });
      if (result) {
        toast.current?.show({ severity: "success", summary: "创建成功", detail: `资源「${result.name}」已创建` });
        setTimeout(() => router.push("/hospital/resources"), 800);
      }
    } catch {
      toast.current?.show({ severity: "error", summary: "网络错误", detail: "" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Toast ref={toast} />
      <h2 className="text-2xl font-bold text-surface-900">创建数字资源</h2>

      <Steps model={steps} activeIndex={step} />

      <Card>
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-surface-700 block mb-1">资源名称 *</label>
              <InputText value={name} onChange={(e) => setName(e.target.value)} className="w-full" placeholder="如：肿瘤病例数据集" />
            </div>
            <div>
              <label className="text-sm font-medium text-surface-700 block mb-1">资源描述</label>
              <InputTextarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full" rows={3} placeholder="资源描述..." />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-surface-700 block mb-1">资源类型 *</label>
                <Dropdown value={resourceType} options={RESOURCE_TYPES} onChange={(e) => setResourceType(e.value)} className="w-full" placeholder="选择类型" />
              </div>
              <div>
                <label className="text-sm font-medium text-surface-700 block mb-1">所属链 *</label>
                <Dropdown
                  value={chainId}
                  options={[
                    { label: "医院链 (chain_hospital)", value: "11111111-1111-1111-1111-111111111111" },
                    { label: "科研机构链 (chain_research)", value: "22222222-2222-2222-2222-222222222222" },
                  ]}
                  onChange={(e) => setChainId(e.value)}
                  className="w-full"
                  placeholder="选择链"
                />
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-surface-700 block mb-1">资源哈希</label>
              <div className="flex gap-2">
                <InputText value={resourceHash} onChange={(e) => setResourceHash(e.target.value)} className="flex-1" placeholder="0x..." />
                <Button icon="pi pi-refresh" severity="secondary" label="生成" onClick={() => setResourceHash("0x" + Math.random().toString(16).substring(2, 42))} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-surface-700 block mb-1">存储地址</label>
              <InputText value={storageUri} onChange={(e) => setStorageUri(e.target.value)} className="w-full" placeholder="ipfs:// 或 https://" />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-surface-500">选择要绑定的访问策略模板（可选）</p>
            {[
              { id: "a46ab82c-ce6d-41f4-bf64-56ffb2cb61fa", name: "医生且认证医院", code: "role=doctor AND org=verified_hospital" },
              { id: "7f4be884-e128-4b8f-b255-a470bfa2ee4a", name: "科研人员且伦理审批通过", code: "role=research AND ethics_approved=true" },
              { id: "80eb0983-2442-4b70-a4d4-2f2fb064f828", name: "监管人员且审计用途", code: "role=regulator AND purpose=audit" },
              { id: "05697b10-0b87-45e3-880f-dd4f2ff78773", name: "认证医院且指定科室且访问窗口有效", code: "org=verified_hospital AND department IN (oncology,cardiology)" },
            ].map((p) => (
              <div key={p.id} className="flex items-start gap-3 p-3 border border-surface-200 rounded-lg">
                <Checkbox
                  inputId={p.id}
                  checked={selectedPolicies.includes(p.id)}
                  onChange={(e) => {
                    if (e.checked) setSelectedPolicies([...selectedPolicies, p.id]);
                    else setSelectedPolicies(selectedPolicies.filter((x) => x !== p.id));
                  }}
                />
                <div>
                  <label htmlFor={p.id} className="font-medium text-surface-800 cursor-pointer">{p.name}</label>
                  <p className="text-xs text-surface-500 font-mono mt-1">{p.code}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between mt-6 pt-4 border-t border-surface-100">
          <Button label="上一步" severity="secondary" disabled={step === 0} onClick={() => setStep(step - 1)} />
          <div className="flex gap-2">
            <Button label="取消" severity="secondary" text onClick={() => router.push("/hospital/resources")} />
            {step < 2 ? (
              <Button label="下一步" disabled={!canNext()} onClick={() => setStep(step + 1)} />
            ) : (
              <Button label={submitting ? "创建中..." : "创建资源"} loading={submitting} onClick={handleSubmit} />
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
