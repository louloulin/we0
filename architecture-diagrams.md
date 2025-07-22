# anon-kode 架构图集合

本文件包含了基于 `arch.md` 文档创建的三个核心架构图的 Mermaid 源代码。

## 图1: anon-kode 核心技术架构图

```mermaid
graph TB
    %% 用户交互层
    User[👤 用户输入] --> InputAnalyzer{输入分析器}
    
    %% 思维模型决策
    InputAnalyzer --> ThinkingManager[🧠 思维管理器]
    ThinkingManager --> |"think" → 4K tokens| BasicThinking[基础思维模式]
    ThinkingManager --> |"think hard" → 10K tokens| MediumThinking[中等思维模式]
    ThinkingManager --> |"ultrathink" → 32K tokens| DeepThinking[超级思维模式]
    ThinkingManager --> |无思维关键词| NoThinking[无思维模式]
    
    %% 二元反馈决策
    InputAnalyzer --> BinaryFeedbackDecision{二元反馈决策}
    BinaryFeedbackDecision --> |启用| ParallelGeneration[并行生成]
    BinaryFeedbackDecision --> |禁用| SingleGeneration[单一生成]
    
    %% 核心流式调度引擎
    BasicThinking --> StreamingEngine[🔄 流式调度引擎<br/>async function* query]
    MediumThinking --> StreamingEngine
    DeepThinking --> StreamingEngine
    NoThinking --> StreamingEngine
    
    %% 并行生成路径
    ParallelGeneration --> AIModel1[🤖 AI模型实例1]
    ParallelGeneration --> AIModel2[🤖 AI模型实例2]
    AIModel1 --> Response1[响应1]
    AIModel2 --> Response2[响应2]
    Response1 --> BinaryFeedbackUI[⚖️ 二元反馈界面]
    Response2 --> BinaryFeedbackUI
    
    %% 单一生成路径
    SingleGeneration --> AIModel[🤖 AI模型]
    AIModel --> SingleResponse[单一响应]
    
    %% 用户选择处理
    BinaryFeedbackUI --> UserChoice{用户选择}
    UserChoice --> |prefer-left| SelectedResponse1[选择响应1]
    UserChoice --> |prefer-right| SelectedResponse2[选择响应2]
    UserChoice --> |neither| RejectBoth[拒绝两个响应]
    UserChoice --> |no-preference| RandomSelect[随机选择]
    
    %% 流式输出处理
    SelectedResponse1 --> StreamingEngine
    SelectedResponse2 --> StreamingEngine
    SingleResponse --> StreamingEngine
    RandomSelect --> StreamingEngine
    
    %% 工具使用检测
    StreamingEngine --> ToolDetection{工具使用检测}
    ToolDetection --> |有工具使用| ToolClassification{工具分类}
    ToolDetection --> |无工具使用| DirectOutput[直接输出]
    
    %% 工具并发控制
    ToolClassification --> |只读工具| ConcurrentExecution[🔀 并发执行<br/>MAX_CONCURRENCY=10]
    ToolClassification --> |写操作工具| SerialExecution[📝 串行执行]
    
// [MermaidChart: 23d463ca-514a-409f-831a-027b18150fdd]
// [MermaidChart: a7e469d1-3a66-45f4-b400-8c8eaec436de]
// [MermaidChart: 0bbc98e8-eb21-421a-8dc0-d2c329b4a9a6]
// [MermaidChart: a7e469d1-3a66-45f4-b400-8c8eaec436de]
// [MermaidChart: a7e469d1-3a66-45f4-b400-8c8eaec436de]
// [MermaidChart: a7e469d1-3a66-45f4-b400-8c8eaec436de]
// [MermaidChart: a7e469d1-3a66-45f4-b400-8c8eaec436de]
    %% 并发执行细节
    ConcurrentExecution --> ToolPool[工具池]
    ToolPool --> Tool1[工具1]
    ToolPool --> Tool2[工具2]
    ToolPool --> Tool3[工具N...]
    Tool1 --> ToolResult1[结果1]
    Tool2 --> ToolResult2[结果2]
    Tool3 --> ToolResult3[结果N...]
    
    %% 串行执行
    SerialExecution --> SequentialTools[顺序工具执行]
    SequentialTools --> ToolResultSeq[串行结果]
    
    %% 结果聚合和递归
    ToolResult1 --> ResultAggregator[结果聚合器]
    ToolResult2 --> ResultAggregator
    ToolResult3 --> ResultAggregator
    ToolResultSeq --> ResultAggregator
    DirectOutput --> ResultAggregator
    
    %% 递归处理
    ResultAggregator --> RecursiveCheck{需要递归?}
    RecursiveCheck --> |是| StreamingEngine
    RecursiveCheck --> |否| FinalOutput[📤 最终输出]
    
    %% 数据收集和分析
    BinaryFeedbackUI --> DataCollector[📊 数据收集器]
    DataCollector --> UserPreferenceDB[(用户偏好数据库)]
    DataCollector --> QualityMetrics[质量指标分析]
    
    %% 思维工具特殊处理
    StreamingEngine --> ThinkTool{ThinkTool启用?}
    ThinkTool --> |是| ThinkToolExecution[思维工具执行]
    ThinkTool --> |否| NormalExecution[正常执行]
    ThinkToolExecution --> ThoughtLogging[思维过程记录]
    
    %% 样式定义
    classDef userLayer fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef thinkingLayer fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef streamingLayer fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef binaryLayer fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef toolLayer fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    classDef dataLayer fill:#f1f8e9,stroke:#33691e,stroke-width:2px
    
    %% 应用样式
    class User,InputAnalyzer userLayer
    class ThinkingManager,BasicThinking,MediumThinking,DeepThinking,NoThinking,ThinkTool,ThinkToolExecution,ThoughtLogging thinkingLayer
    class StreamingEngine,RecursiveCheck,ResultAggregator streamingLayer
    class BinaryFeedbackDecision,ParallelGeneration,BinaryFeedbackUI,UserChoice,SelectedResponse1,SelectedResponse2 binaryLayer
    class ToolDetection,ToolClassification,ConcurrentExecution,SerialExecution,ToolPool,Tool1,Tool2,Tool3 toolLayer
    class DataCollector,UserPreferenceDB,QualityMetrics dataLayer
```

## 图2: 三大核心算法详细流程图

```mermaid
graph TB
    subgraph "🔄 流式处理算法 - 异步生成器模式"
        A1[async function* query] --> A2[格式化系统提示词]
        A2 --> A3[创建AI响应生成函数]
        A3 --> A4[集成二元反馈机制]
        A4 --> A5[yield assistantMessage]
        A5 --> A6{检测工具使用}
        A6 --> |有工具| A7{工具类型分类}
        A6 --> |无工具| A8[return 结束]
        A7 --> |只读工具| A9[runToolsConcurrently<br/>MAX_CONCURRENCY=10]
        A7 --> |写操作工具| A10[runToolsSerially]
        A9 --> A11[yield 工具结果]
        A10 --> A11
        A11 --> A12[递归调用 yield* query]
        A12 --> A1
    end
    
    subgraph "🧠 思维模型算法 - 动态thinking tokens"
        B1[getMaxThinkingTokens] --> B2{环境变量检查}
        B2 --> |强制设置| B3[返回环境变量值]
        B2 --> |ThinkTool启用| B4[返回 0]
        B2 --> |正常模式| B5[分析用户输入内容]
        B5 --> B6{关键词匹配}
        B6 --> |"ultrathink"等| B7[返回 32,000 tokens]
        B6 --> |"think hard"等| B8[返回 10,000 tokens]
        B6 --> |"think"| B9[返回 4,000 tokens]
        B6 --> |无关键词| B10[返回 0 tokens]
        
        B11[getReasoningEffort] --> B12[获取thinking tokens]
        B12 --> B13{推理强度映射}
        B13 --> |< 10K| B14[low effort]
        B13 --> |10K-30K| B15[medium effort]
        B13 --> |≥ 30K| B16[high effort]
    end
    
    subgraph "⚖️ 二元反馈算法 - A/B测试质量提升"
        C1[queryWithBinaryFeedback] --> C2{启用条件检查}
        C2 --> |禁用| C3[单一响应模式]
        C2 --> |启用| C4[Promise.all并行生成]
        C4 --> C5[生成响应1]
        C4 --> C6[生成响应2]
        C5 --> C7{错误处理}
        C6 --> C7
        C7 --> |有错误| C8[选择正常响应]
        C7 --> |都正常| C9[messagePairValidForBinaryFeedback]
        C9 --> C10{响应有效性}
        C10 --> |无效| C11[返回响应1]
        C10 --> |有效| C12[getBinaryFeedbackResponse]
        C12 --> C13{用户选择}
        C13 --> |prefer-left| C14[返回响应1]
        C13 --> |prefer-right| C15[返回响应2]
        C13 --> |neither| C16[返回 null]
        C13 --> |no-preference| C17[随机选择]
        
        C20[shouldUseBinaryFeedback] --> C21{环境变量}
        C21 --> |DISABLE_BINARY_FEEDBACK| C22[返回 false]
        C21 --> |FORCE_BINARY_FEEDBACK| C23[返回 true]
        C21 --> |正常| C24{用户类型检查}
        C24 --> |非ant用户| C25[返回 false]
        C24 --> |ant用户| C26[获取采样配置]
        C26 --> C27["Math.random() < sampleFrequency"]
    end
    
    subgraph "🔀 并发控制算法"
        D1[all函数 - 自定义并发控制] --> D2[初始化等待队列]
        D2 --> D3[启动初始批次<br/>不超过concurrencyCap]
        D3 --> D4{promises.size > 0}
        D4 --> |是| D5[Promise.race等待]
        D5 --> D6[处理完成的生成器]
        D6 --> D7{还有等待的生成器?}
        D7 --> |是| D8[启动新的生成器]
        D7 --> |否| D9[yield value]
        D8 --> D9
        D9 --> D4
        D4 --> |否| D10[并发执行完成]
    end
    
    subgraph "📊 数据收集算法"
        E1[logBinaryFeedbackEvent] --> E2[获取模型信息]
        E2 --> E3[获取Git状态]
        E3 --> E4[记录用户选择]
        E4 --> E5[计算响应序列]
        E5 --> E6[发送遥测数据]
        
        E7[getMessageBlockSequence] --> E8[遍历消息块]
        E8 --> E9{块类型判断}
        E9 --> |text| E10[返回 'text']
        E9 --> |tool_use| E11[返回工具名称]
        E9 --> |其他| E12[返回块类型]
    end
    
    %% 算法间的关联
    A4 -.-> C1
    A3 -.-> B1
    A9 -.-> D1
    C12 -.-> E1
    
    %% 样式定义
    classDef streamingAlgo fill:#e8f5e8,stroke:#1b5e20,stroke-width:3px
    classDef thinkingAlgo fill:#f3e5f5,stroke:#4a148c,stroke-width:3px
    classDef binaryAlgo fill:#fff3e0,stroke:#e65100,stroke-width:3px
    classDef concurrentAlgo fill:#fce4ec,stroke:#880e4f,stroke-width:3px
    classDef dataAlgo fill:#f1f8e9,stroke:#33691e,stroke-width:3px
    
    %% 应用样式到子图中的节点
    class A1,A2,A3,A4,A5,A6,A7,A8,A9,A10,A11,A12 streamingAlgo
    class B1,B2,B3,B4,B5,B6,B7,B8,B9,B10,B11,B12,B13,B14,B15,B16 thinkingAlgo
    class C1,C2,C3,C4,C5,C6,C7,C8,C9,C10,C11,C12,C13,C14,C15,C16,C17,C20,C21,C22,C23,C24,C25,C26,C27 binaryAlgo
    class D1,D2,D3,D4,D5,D6,D7,D8,D9,D10 concurrentAlgo
    class E1,E2,E3,E4,E5,E6,E7,E8,E9,E10,E11,E12 dataAlgo
```

## 图3: 技术对比及升级路径图

```mermaid
graph TB
    subgraph "📊 技术对比分析"
        subgraph "传统AI助手架构"
            T1[用户请求] --> T2[同步处理]
            T2 --> T3[固定推理模式]
            T3 --> T4[单一响应生成]
            T4 --> T5[串行工具执行]
            T5 --> T6[完整响应返回]
            T6 --> T7[用户等待状态]
        end

        subgraph "anon-kode创新架构"
            A1[用户请求] --> A2[异步生成器处理]
            A2 --> A3[动态思维调整]
            A3 --> A4[并行A/B响应生成]
            A4 --> A5[智能并发工具执行]
            A5 --> A6[流式实时输出]
            A6 --> A7[用户实时反馈]
        end
    end

    subgraph "🚀 Mastra Codex升级路径"
        subgraph "Phase 1: 流式调度引擎 (P0)"
            P1A[实现基础异步生成器] --> P1B[集成Agent Network]
            P1B --> P1C[流式响应处理]
            P1C --> P1D[并发工具执行]
        end

        subgraph "Phase 2: 思维模型集成 (P0)"
            P2A[思维深度管理器] --> P2B[关键词检测]
            P2B --> P2C[动态token分配]
            P2C --> P2D[推理强度控制]
        end

        subgraph "Phase 3: 二元反馈机制 (P1)"
            P3A[二元反馈管理器] --> P3B[并行响应生成]
            P3B --> P3C[用户选择界面]
            P3C --> P3D[数据收集分析]
        end
    end

    subgraph "📈 预期技术指标提升"
        M1[响应延迟: -80%]
        M2[用户满意度: +30%]
        M3[资源利用率: +20%]
        M4[并发处理: 10x]
        M5[质量提升: 持续改进]
        M6[成本效益: 优化]
    end

    subgraph "🔧 核心技术实现要点"
        subgraph "性能优化"
            O1[内存管理<br/>流式处理避免大量缓存]
            O2[并发控制<br/>限制最大并发数]
            O3[缓存策略<br/>智能缓存思维结果]
            O4[错误恢复<br/>单点失败不影响整体]
        end

        subgraph "用户体验"
            U1[渐进增强<br/>从基础到高级功能]
            U2[用户控制<br/>可选择启用高级功能]
            U3[反馈机制<br/>收集用户反馈改进]
            U4[性能监控<br/>实时监控响应时间]
        end

        subgraph "数据收集"
            D1[匿名化<br/>保护用户隐私]
            D2[A/B测试<br/>持续测试不同配置]
            D3[质量指标<br/>建立评估体系]
            D4[用户偏好<br/>学习个性化体验]
        end
    end

    %% 连接关系
    T7 -.->|改进| A1
    A7 -.->|启发| P1A
    P1D --> P2A
    P2D --> P3A
    P3D --> M1

    %% 实施要点连接
    P1A -.-> O1
    P2A -.-> U1
    P3A -.-> D1

    %% 样式定义
    classDef traditional fill:#ffebee,stroke:#c62828,stroke-width:2px
    classDef innovative fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    classDef phase1 fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    classDef phase2 fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef phase3 fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    classDef metrics fill:#f1f8e9,stroke:#558b2f,stroke-width:2px
    classDef optimization fill:#fce4ec,stroke:#ad1457,stroke-width:2px

    %% 应用样式
    class T1,T2,T3,T4,T5,T6,T7 traditional
    class A1,A2,A3,A4,A5,A6,A7 innovative
    class P1A,P1B,P1C,P1D phase1
    class P2A,P2B,P2C,P2D phase2
    class P3A,P3B,P3C,P3D phase3
    class M1,M2,M3,M4,M5,M6 metrics
    class O1,O2,O3,O4,U1,U2,U3,U4,D1,D2,D3,D4 optimization
```

## 使用说明

### 如何使用这些架构图

1. **在线渲染**: 将 Mermaid 代码复制到 [Mermaid Live Editor](https://mermaid.live/) 中查看
2. **本地渲染**: 使用支持 Mermaid 的 Markdown 编辑器（如 Typora、VS Code 等）
3. **文档集成**: 直接在支持 Mermaid 的文档系统中使用（如 GitBook、Notion 等）
4. **导出图片**: 通过 Mermaid CLI 或在线工具导出为 PNG/SVG 格式

### 架构图说明

- **图1**: 展示完整的系统架构和数据流，适合技术概览
- **图2**: 详细的算法流程，适合开发人员理解具体实现
- **图3**: 技术对比和升级路径，适合项目规划和决策

### 颜色编码

- 🔵 蓝色：用户交互层
- 🟣 紫色：思维模型相关
- 🟢 绿色：流式处理相关
- 🟠 橙色：二元反馈相关
- 🔴 红色：工具执行相关
- 🟡 黄色：数据收集相关

---

**创建时间**: 2024年12月
**基于文档**: arch.md
**图表格式**: Mermaid
**状态**: 已完成 ✅
