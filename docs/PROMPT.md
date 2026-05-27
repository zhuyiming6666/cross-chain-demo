整体方案遵循 @docs/系统方案.md 的demo设计，我要使用nextjs-supabase的模式，前端的设计遵循 @docs/web设计.md 
下面是框架设计：
## 前端部分
该next项目使用 App Route 模式。使用 primereact 作为UI框架，使用
tailwindcss 作为 atom css 框架。

对于生成或者修改组件，请尽量使用 primereact
提供的组件完成。UI实现要美观大方，UI组件之间保持一定的间距。如果你想要定义彩色，请尽量使用
tailwindcss 的 primary 类的 css class 定义彩色，这样可以尽量符合颜色系统。

背景颜色不能使用 `text-gray`，而是必须使用 `text-surface`。

所有前端发起的网络请求，请通过 `@/app/service`
来实现。你需要先检查这个文件夹中是否存在已经实现好的业务。业务和 `@/app/api`
中的服务是一一对应的。

每一个 service 成员函数需要严格遵守如下格式：

```typescript
async publishContent(reqData: PublishContentDto) {
    const res = await this.post<PublishContentResponseDto>('publish-content', reqData);
    if (res.data && res.data.success) {
        return res.data.data || null;
    }
}
```

鉴权通过 NextAuth 的 getSession() 方法获取用户信息
具体请看例子：src/app/service/coachService.ts

import { BaseService } from "@/lib/baseService";
import { ApiData } from "@/types/api";
import { Coach, CoachStudentItem } from "@/types/coach";

// Coach 相关接口
import type {
    GetCoachDto,
    GetCoachResponseDto
} from '@/app/api/coach/get-coach/entity';
import type {
    ListStudentsDto,
    ListStudentsResponseDto
} from '@/app/api/coach/list-students/entity';
import type {
    GetAllCoachesDto,
    GetAllCoachesResponseDto
} from '@/app/api/coach/get-all-coaches/entity';
import type {
    GetStudentDto,
    GetStudentResponseDto
} from '@/app/api/coach/get-student/entity';

// 内容管理相关接口
import type {
    GetContentsDto,
    GetContentsResponseDto
} from '@/app/api/coach/get-contents/entity';
import type {
    PublishContentDto,
    PublishContentResponseDto
} from '@/app/api/coach/publish-content/entity';

// 规则包与专长相关接口
import type {
    GetSpecialtiesResponseDto
} from '@/app/api/coach/get-specialties/entity';
import type {
    GetCoachRulepacksDto,
    GetCoachRulepacksResponseDto
} from '@/app/api/coach/get-coach-rulepacks/entity';

// 定价管理相关接口
import type {
    GetPricingDto,
    GetPricingResponseDto
} from '@/app/api/coach/get-pricing/entity';
import type {
    UpdatePricingDto,
    UpdatePricingResponseDto
} from '@/app/api/coach/update-pricing/entity';

// 问卷管理相关接口
import type {
    GetQuestionnairesDto,
    GetQuestionnairesResponseDto
} from '@/app/api/coach/get-questionnaires/entity';
import type {
    UpdateQuestionnairesDto,
    UpdateQuestionnairesResponseDto
} from '@/app/api/coach/update-questionnaires/entity';

// 聚合信息相关接口
import type {
    GetAggregatedInfoDto,
    GetAggregatedInfoResponseDto
} from '@/app/api/coach/get-aggregated-info/entity';

// 概览数据相关接口
import type {
    GetOverviewDataDto,
    GetOverviewDataResponseDto
} from '@/app/api/coach/get-overview-data/entity';

// 教练资料更新相关接口
import type {
    UpdateCoachProfileDto,
    UpdateCoachProfileResponseDto
} from '@/app/api/coach/update-coach-profile/entity';
import { GetPaymentWaitingStudentsDto, GetPaymentWaitingStudentsResponseDto } from "../api/coach/get-payment-waiting-students/entity";


import type {
    GetCoachApplicationDto,
    GetCoachApplicationResponseDto
} from '@/app/api/coach/get-coach-application/entity';
import type {
    ListCoachApplicationsDto,
    ListCoachApplicationsResponseDto
} from '@/app/api/coach/list-coach-applications/entity';
import type {
    UpdateCoachApplicationDto,
    UpdateCoachApplicationResponseDto
} from '@/app/api/coach/update-coach-application/entity';
import { CreateCoachApplicationDto, CreateCoachApplicationResponseDto } from "../api/coach/create-coach-application/entity";

// 添加UpdateContentDto和DeleteContentDto类型
interface DeleteContentDto {
    id: string;
}

interface UpdateContentDto extends Partial<PublishContentDto> {
    id: string;
}

class CoachService extends BaseService {
    async getAllCoaches(reqData: GetAllCoachesDto) {
        const res = await this.post<GetAllCoachesResponseDto>('get-all-coaches', reqData);
        if (res.data && res.data.success) {
            return res.data.data;
        }

        return null;
    }

    async listStudents(reqData?: ListStudentsDto) {
        const res = await this.post<ListStudentsResponseDto>('list-students', reqData || {
            pagination: {
                page: 0,
                limit: 20
            }
        });
        if (res.data && res.data.success) {
            return res.data.data;
        }

        return null;
    }

    async getContents(reqData: GetContentsDto) {
        const res = await this.post<GetContentsResponseDto>('get-contents', reqData);
        if (res.data && res.data.success) {
            return res.data.data || null;
        }
    }

    async publishContent(reqData: PublishContentDto) {
        const res = await this.post<PublishContentResponseDto>('publish-content', reqData);
        if (res.data && res.data.success) {
            return res.data.data || null;
        }
    }

    // 添加更新内容的方法
    async updateContent(reqData: UpdateContentDto) {
        const res = await this.post<PublishContentResponseDto>('update-content', reqData);
        if (res.data && res.data.success) {
            return res.data.data || null;
        }
    }

    // 添加删除内容的方法
    async deleteContent(contentId: string) {
        const res = await this.post<DeleteContentDto>('delete-content', { id: contentId });
        if (res.data && res.data.success) {
            return res.data.data || null;
        }
    }

    async getAllSpecialties() {
        // TODO: 使用 redis 优化
        const res = await this.post<GetSpecialtiesResponseDto>('get-specialties');
        if (res.data && res.data.success) {
            return res.data.data?.specialties;
        }
    }

    async getCoach(reqData: GetCoachDto) {
        const res = await this.post<GetCoachResponseDto>('get-coach', reqData);
        if (res.data && res.data.success) {
            return res.data.data;
        }

        return null;
    }

    async updateCoachProfile(reqData: UpdateCoachProfileDto) {
        const res = await this.post<UpdateCoachProfileResponseDto>('update-coach-profile', reqData);
        if (res.data && res.data.success) {
            return res.data.data;
        }

        return null;
    }

    async getCoachRulepacks(reqData: GetCoachRulepacksDto) {
        const res = await this.post<GetCoachRulepacksResponseDto>('get-coach-rulepacks', reqData);
        if (res.data && res.data.success) {
            return res.data.data || null;
        }
    }

    async getPricing(reqData: GetPricingDto) {
        const res = await this.post<GetPricingResponseDto>('get-pricing', reqData || {});
        if (res.data && res.data.success) {
            return res.data.data || null;
        }
    }

    async updatePricing(reqData: UpdatePricingDto) {
        const res = await this.post<UpdatePricingResponseDto>('update-pricing', reqData);
        if (res.data && res.data.success) {
            return res.data.data || null;
        }
    }

    async getQuestionnaires(reqData?: GetQuestionnairesDto) {
        const res = await this.post<GetQuestionnairesResponseDto>('get-questionnaires', reqData || {});
        if (res.data && res.data.success) {
            return res.data.data || null;
        }
    }

    async updateQuestionnaires(reqData: UpdateQuestionnairesDto) {
        const res = await this.post<UpdateQuestionnairesResponseDto>('update-questionnaires', reqData);
        if (res.data && res.data.success) {
            return res.data.data || null;
        }
    }

    async getAggregatedInfo(reqData: GetAggregatedInfoDto) {
        const res = await this.post<GetAggregatedInfoResponseDto>('get-aggregated-info', reqData);
        if (res.data && res.data.success) {
            return res.data.data || null;
        }
    }

    async getOverviewData(reqData?: GetOverviewDataDto) {
        const res = await this.post<GetOverviewDataResponseDto>('get-overview-data', reqData || {});
        if (res.data && res.data.success) {
            return res.data.data || null;
        }

        return null;
    }

    async getPaymentWaitingStudents(reqData: GetPaymentWaitingStudentsDto) {
        const res = await this.post<GetPaymentWaitingStudentsResponseDto>('get-payment-waiting-students', reqData);
        if (res.data && res.data.success) {
            return res.data.data || null;
        }
        return null;
    }

    async getStudent(reqData: GetStudentDto) {
        const res = await this.post<GetStudentResponseDto>('get-student', reqData);
        if (res.data && res.data.success) {
            return res.data.data || null;
        }
        return null;
    }

    // 教练申请相关方法
    async createCoachApplication(reqData: CreateCoachApplicationDto) {
        const res = await this.post<CreateCoachApplicationResponseDto>('create-coach-application', reqData);
        if (res.data && res.data.success) {
            return res.data.data || null;
        }
        return null;
    }

    async getCoachApplication(reqData?: GetCoachApplicationDto) {
        const res = await this.post<GetCoachApplicationResponseDto>('get-coach-application', reqData || {});
        if (res.data && res.data.success) {
            return res.data.data || null;
        }
        return null;
    }

    async listCoachApplications(reqData?: ListCoachApplicationsDto) {
        const res = await this.post<ListCoachApplicationsResponseDto>('list-coach-applications', reqData || {});
        if (res.data && res.data.success) {
            return res.data.data || null;
        }
        return null;
    }

    async updateCoachApplication(reqData: UpdateCoachApplicationDto) {
        const res = await this.post<UpdateCoachApplicationResponseDto>('update-coach-application', reqData);
        if (res.data && res.data.success) {
            return res.data.data || null;
        }
        return null;
    }
}

export const coachService = new CoachService('/api/coach');


如果前端出现了 supabase 势力进行数据库访问，你应该把这部分迁移到后端中，并在
@/app/service 中的相关函数写入对应的 API 访问并通过访问替代当前的前端直接询问
supabase

- 如果前端代码出现了 setError 或者 setMessage 的函数，则替换为 toast
  函数来向用户发出提醒。
- loading 为 true 部分的组件替换为 primereact 的骨架屏。
- 所有改动都需要适配移动端。

---

## 后端部分

我现在有如下的一个 POST 函数代码

请根据我后续的要求，把最对应的其他请求转换为和上面的风格、代码依赖一致的 nextjs
POST 代码，重点：

1. 使用 NextResponse 返回 JSON。（内容严格为 success,message,data）
2. 依赖统一：import supabase from '@/lib/supabaseClient' import {
   getServerSession } from '../../auth/[...nextauth]/auth'
3. 接口里面应该尽量不要设置 userId，因为可以通过 getServerSession() 方法获取
   session，通过 session.user 或者 session.profile 来获取用户信息。

除此之外，你还需要根据接口理解，在对应文件夹下生成对应的 entity 文件，并以 type
形式导入。entity 文件往往以接口文件夹的名字设置如下两个接口：

```typescript
// 请求参数的接口类型
export interface GetUserProfileDto {}
// 返回参数的接口类型
export interface GetUserProfileResponseDto {}
```

然后你必须在 route.ts 文件中使用上面两个类型，一个事例如下：

```typescript
import { NextResponse } from "next/server";
import { getServerSession } from "../../auth/[...nextauth]/auth";
import supabase from "@/lib/supabaseClient";

// 重要！必须以 import type 引入接口类型
import type { ApiData } from "@/types/api";
import type {
    UpdatePersonalRecordsDto,
    UpdatePersonalRecordsResponseDto,
} from "./entity";

export async function POST(req: Request) {
    const session = await getServerSession();
    if (!session?.user?.id) {
        return NextResponse.json({
            success: false,
            message: "用户未登录",
            data: null,
        }, { status: 401 });
    }

    // 重点！通过 session 获取用户 ID
    const userId = session.user.id;

    const {
        exercises,
    } = await req.json() as UpdatePersonalRecordsDto;

    // 更新个人记录
    // 具体的访问数据库的操作
    // ... code ...

    // 重点！必须申请接口范型位 ApiData<返回参数的接口类型>
    return NextResponse.json<ApiData<UpdatePersonalRecordsResponseDto>>({
        success: true,
        message: "个人记录更新成功",
        // UpdatePersonalRecordsResponseDto 反应的就是这个地方 data 的数据结构
        data: null,
    });
}
```

### 权限获取

你可以通过如下的代码获取身份信息

```typescript
import { getServerSession } from "@/app/api/auth/[...nextauth]/auth";

export async function POST(req: Request) {
    const session = await getServerSession();
    if (!session?.user?.id) {
        return NextResponse.json({
            success: false,
            message: "用户未登录",
            data: null,
        }, { status: 401 });
    }

    // session.user.id 为用户 ID
    // session.user.is_admin 为用户是否是管理员
    // session.user.is_coach 为用户是否是教练
}
```

新建立表RLS一定要关闭。