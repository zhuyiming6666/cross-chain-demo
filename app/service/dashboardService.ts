import { BaseService } from "@/lib/baseService";
import type { GetOverviewResponseDto } from "@/app/api/dashboard/get-overview/entity";

export class DashboardService extends BaseService {
  constructor() {
    super("/api");
  }

  async getOverview() {
    const res = await this.post<GetOverviewResponseDto>("dashboard/get-overview");
    if (res.data && res.data.success) {
      return res.data.data || null;
    }
  }
}
