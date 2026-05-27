import { BaseService } from "@/lib/baseService";
import type { ListComputeFunctionsResponseDto } from "@/app/api/compute/functions/entity";
import type { CreateComputeTaskDto, CreateComputeTaskResponseDto } from "@/app/api/compute/tasks/create/entity";
import type { ListComputeTasksResponseDto } from "@/app/api/compute/tasks/list/entity";
import type { ComputeTaskDetailDto } from "@/app/api/compute/tasks/[id]/entity";

export class ComputeService extends BaseService {
  constructor() {
    super("/api");
  }

  async getFunctions() {
    const res = await this.get<ListComputeFunctionsResponseDto>("compute/functions");
    if (res.data && res.data.success) {
      return res.data.data || null;
    }
  }

  async createTask(reqData: CreateComputeTaskDto) {
    const res = await this.post<CreateComputeTaskResponseDto>("compute/tasks/create", reqData);
    if (res.data && res.data.success) {
      return res.data.data || null;
    }
  }

  async listTasks() {
    const res = await this.get<ListComputeTasksResponseDto>("compute/tasks/list");
    if (res.data && res.data.success) {
      return res.data.data || null;
    }
  }

  async getTaskDetail(id: string) {
    const res = await this.get<ComputeTaskDetailDto>(`compute/tasks/${id}`);
    if (res.data && res.data.success) {
      return res.data.data || null;
    }
  }
}
