import { BaseService } from "@/lib/baseService";
import type { CreateResourceDto, CreateResourceResponseDto } from "@/app/api/resources/create/entity";
import type { ListResourcesDto, ListResourcesResponseDto } from "@/app/api/resources/list/entity";
import type { ResourceDetailDto } from "@/app/api/resources/[id]/entity";

export class ResourceService extends BaseService {
  constructor() {
    super("/api");
  }

  async createResource(reqData: CreateResourceDto) {
    const res = await this.post<CreateResourceResponseDto>("resources/create", reqData);
    if (res.data && res.data.success) {
      return res.data.data || null;
    }
  }

  async listResources(reqData?: ListResourcesDto) {
    const res = await this.post<ListResourcesResponseDto>("resources/list", reqData);
    if (res.data && res.data.success) {
      return res.data.data || null;
    }
  }

  async getResourceDetail(id: string) {
    const res = await this.get<ResourceDetailDto>(`resources/${id}`);
    if (res.data && res.data.success) {
      return res.data.data || null;
    }
  }
}
