# Gemini Image Toolbox - 云架构图

## 整体架构图

```mermaid
graph TB
    subgraph "用户层"
        U1[全球用户]
        U2[中国用户]
    end
    
    subgraph "CDN层"
        CF[Cloudflare Global CDN]
        CF_CN[Cloudflare China + 京东云]
        ALI_CDN[阿里云CDN]
    end
    
    subgraph "边缘计算层"
        W1[CF Workers - 图像优化]
        W2[CF Workers - API网关]
        W3[CF Workers - 速率限制]
        FC[阿里云函数计算]
    end
    
    subgraph "应用层"
        subgraph "Vercel边缘网络"
            V1[东京 hnd1]
            V2[新加坡 sin1]
            V3[旧金山 sfo1]
            V4[华盛顿 iad1]
            V5[法兰克福 fra1]
        end
    end
    
    subgraph "API层"
        API1[/api/generate]
        API2[/api/generate-image]
        API3[/api/health]
        GEMINI[Google Gemini API]
    end
    
    subgraph "存储层"
        R2[Cloudflare R2]
        OSS[阿里云OSS]
        S3[AWS S3 备份]
    end
    
    subgraph "缓存层"
        KV[CF KV Store]
        REDIS1[AWS ElastiCache]
        REDIS2[阿里云Redis]
    end
    
    subgraph "监控层"
        CW[CloudWatch]
        CF_A[CF Analytics]
        ALI_M[阿里云监控]
    end
    
    U1 --> CF
    U2 --> CF_CN
    U2 --> ALI_CDN
    
    CF --> W1
    CF --> W2
    CF --> W3
    CF_CN --> FC
    ALI_CDN --> FC
    
    W1 --> V1
    W2 --> V2
    W3 --> V3
    FC --> V1
    
    V1 --> API1
    V2 --> API2
    V3 --> API3
    
    API1 --> GEMINI
    API2 --> GEMINI
    
    API1 --> R2
    API2 --> OSS
    R2 -.->|备份| S3
    OSS -.->|同步| R2
    
    V1 --> KV
    V2 --> REDIS1
    FC --> REDIS2
    
    V1 --> CW
    CF --> CF_A
    FC --> ALI_M
```

## 数据流架构

```mermaid
sequenceDiagram
    participant User as 用户
    participant CDN as Cloudflare CDN
    participant Worker as Edge Worker
    participant Vercel as Vercel Function
    participant Gemini as Gemini API
    participant Storage as R2/OSS
    participant Cache as Redis/KV
    
    User->>CDN: 请求图像生成
    CDN->>Worker: 边缘处理
    Worker->>Cache: 检查缓存
    
    alt 缓存命中
        Cache-->>Worker: 返回缓存结果
        Worker-->>User: 返回图像
    else 缓存未命中
        Worker->>Vercel: 转发请求
        Vercel->>Gemini: 调用AI API
        Gemini-->>Vercel: 生成结果
        Vercel->>Storage: 存储图像
        Vercel->>Cache: 更新缓存
        Vercel-->>Worker: 返回结果
        Worker-->>User: 返回图像
    end
```

## 故障转移架构

```mermaid
graph LR
    subgraph "主区域 - 东京"
        P_LB[负载均衡器]
        P_V[Vercel主节点]
        P_R[Redis主节点]
        P_S[R2主存储]
    end
    
    subgraph "备用区域 - 新加坡"
        B_LB[负载均衡器]
        B_V[Vercel备节点]
        B_R[Redis备节点]
        B_S[R2备存储]
    end
    
    subgraph "冷备区域 - 美西"
        C_LB[负载均衡器]
        C_V[Lambda函数]
        C_R[ElastiCache]
        C_S[S3存储]
    end
    
    subgraph "健康检查"
        HC[Health Check]
    end
    
    HC -->|检查| P_LB
    HC -->|检查| B_LB
    HC -->|检查| C_LB
    
    P_V -.->|同步| B_V
    P_R -.->|复制| B_R
    P_S -.->|同步| B_S
    
    B_V -.->|备份| C_V
    B_R -.->|快照| C_R
    B_S -.->|备份| C_S
    
    P_LB -->|故障| B_LB
    B_LB -->|故障| C_LB
```

## 自动扩展架构

```mermaid
graph TB
    subgraph "监控指标"
        M1[CPU使用率]
        M2[内存使用率]
        M3[请求延迟]
        M4[错误率]
        M5[并发连接数]
    end
    
    subgraph "扩展决策"
        AS[Auto Scaler]
        RULES[扩展规则]
    end
    
    subgraph "资源池"
        subgraph "Vercel Functions"
            F1[实例1]
            F2[实例2]
            F3[实例3]
            F4[实例n...]
        end
        
        subgraph "Redis Cluster"
            R1[主节点]
            R2[从节点1]
            R3[从节点2]
            R4[从节点n...]
        end
    end
    
    M1 --> AS
    M2 --> AS
    M3 --> AS
    M4 --> AS
    M5 --> AS
    
    AS --> RULES
    
    RULES -->|扩容| F4
    RULES -->|扩容| R4
    RULES -->|缩容| F1
    RULES -->|缩容| R2
```

## 安全架构

```mermaid
graph TB
    subgraph "外部访问"
        Internet[互联网]
    end
    
    subgraph "安全层"
        WAF[Web应用防火墙]
        DDOS[DDoS防护]
        RL[速率限制]
    end
    
    subgraph "认证授权"
        AUTH[API密钥验证]
        RBAC[基于角色的访问控制]
    end
    
    subgraph "网络安全"
        VPC[私有网络]
        SG[安全组]
        NACL[网络ACL]
    end
    
    subgraph "数据安全"
        ENC1[传输加密 TLS 1.3]
        ENC2[存储加密 AES-256]
        BACKUP[加密备份]
    end
    
    subgraph "应用"
        APP[Vercel应用]
        DB[数据存储]
    end
    
    Internet --> WAF
    WAF --> DDOS
    DDOS --> RL
    RL --> AUTH
    AUTH --> RBAC
    RBAC --> VPC
    VPC --> SG
    SG --> NACL
    NACL --> APP
    APP --> ENC1
    ENC1 --> DB
    DB --> ENC2
    ENC2 --> BACKUP
```

## 成本优化架构

```mermaid
pie title 月度成本分布
    "Vercel托管" : 45
    "Cloudflare CDN" : 25
    "存储(R2/OSS/S3)" : 10
    "Redis缓存" : 12
    "API调用(Gemini)" : 30
    "监控和日志" : 8
    "备份" : 5
    "其他" : 5
```

## 性能指标架构

```mermaid
graph LR
    subgraph "性能目标"
        P1[TTFB < 200ms]
        P2[FCP < 1.5s]
        P3[LCP < 2.5s]
        P4[CLS < 0.1]
        P5[可用性 > 99.95%]
    end
    
    subgraph "优化策略"
        O1[边缘缓存]
        O2[图像优化]
        O3[代码分割]
        O4[预加载]
        O5[CDN加速]
    end
    
    subgraph "监控工具"
        T1[Lighthouse]
        T2[WebPageTest]
        T3[CloudWatch]
        T4[New Relic]
    end
    
    P1 --> O1
    P2 --> O2
    P3 --> O3
    P4 --> O4
    P5 --> O5
    
    O1 --> T3
    O2 --> T1
    O3 --> T2
    O4 --> T1
    O5 --> T4
```

## 部署流水线

```mermaid
graph LR
    subgraph "开发"
        DEV[本地开发]
        TEST[单元测试]
    end
    
    subgraph "CI/CD"
        GIT[Git推送]
        CI[GitHub Actions]
        BUILD[构建]
        SCAN[安全扫描]
    end
    
    subgraph "部署"
        PREVIEW[预览环境]
        STAGING[预发布]
        PROD[生产环境]
    end
    
    subgraph "验证"
        E2E[E2E测试]
        PERF[性能测试]
        ROLLBACK[回滚机制]
    end
    
    DEV --> TEST
    TEST --> GIT
    GIT --> CI
    CI --> BUILD
    BUILD --> SCAN
    SCAN --> PREVIEW
    PREVIEW --> E2E
    E2E --> STAGING
    STAGING --> PERF
    PERF --> PROD
    PROD -.->|失败| ROLLBACK
```