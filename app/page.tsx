"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowRight, BookOpen, Check, CheckCircle2, ChevronRight,
  CircleHelp, Gauge, GitBranch, Lightbulb, ListChecks, Menu, Network,
  Orbit, Search, ShieldCheck, Sigma, SlidersHorizontal, Sparkles,
  Target, Wrench, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Chapter = {
  id: number; part: number; title: string; problem: string; conclusion: string;
  practice: string; formula?: string; tags: string[];
};

type PageModelContext = {
  registerTool: (tool: {
    name: string; title: string; description: string; inputSchema: object;
    annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
    execute: (input: unknown) => unknown | Promise<unknown>;
  }, options?: { signal?: AbortSignal }) => void | Promise<void>;
};

const parts = [
  { id: 1, title: "基础", range: "1–4", color: "#0f766e", note: "把语言模型看成策略" },
  { id: 2, title: "反馈对齐", range: "5–9", color: "#2563eb", note: "从偏好到在线优化" },
  { id: 3, title: "推理", range: "10–15", color: "#7c3aed", note: "验证器、RLVR 与信用" },
  { id: 4, title: "智能体", range: "16–20", color: "#c2410c", note: "工具、环境与长时域" },
  { id: 5, title: "系统", range: "21–23", color: "#be123c", note: "吞吐、失配与成本" },
  { id: 6, title: "测量与安全", range: "24–26", color: "#334155", note: "知道自己是否真的进步" },
];

const chapters: Chapter[] = [
  { id: 1, part: 1, title: "后训练范式", problem: "预训练只会复现语料分布，不能稳定地选择好行为。", conclusion: "后训练是在参考策略附近最大化反馈；格式、偏好、能力与智能体是四重差距。验证比生成便宜，是整个时代的发动机。", practice: "先写清奖励来源、KL 锚点、信用粒度和可验证边界，再讨论算法。", formula: "max E[r(x,y)] − β Dₖₗ(πθ ‖ πref)", tags: ["总览", "KL", "反馈"] },
  { id: 2, part: 1, title: "作为策略的语言模型", problem: "怎样把逐词元生成写成可以优化的决策过程？", conclusion: "词元级 MDP 与序列级老虎机共享同一目标，却导向不同估计器；长序列会放大重要性比值与方差。", practice: "同时记录 KL、熵、ESS、截断率与 pass@1/pass@k，别照搬控制 RL 的折扣习惯。", formula: "πθ(y|x)=∏ₜ πθ(yₜ|x,y<ₜ)", tags: ["MDP", "重要性采样", "熵"] },
  { id: 3, part: 1, title: "监督微调", problem: "怎样让基座模型学会格式、风格和任务接口？", conclusion: "SFT 是模仿学习：擅长播种行为，不擅长从模型自己造成的错误状态中恢复；过量 SFT 会遗忘与记忆。", practice: "模板逐字节一致；明确 loss mask 与序列/词元归一化；用回放或权重插值防遗忘。", formula: "Lₛ𝒻ₜ=−Σₜ mₜ log πθ(yₜ|x,y<ₜ)", tags: ["SFT", "模板", "掩码"] },
  { id: 4, part: 1, title: "后训练的数据", problem: "什么数据值得生产，怎样避免“多但没梯度”？", conclusion: "示范只能给一次方向；可验证提示能随策略更新反复产生新鲜梯度。对组相对 RL，过难和过易提示都几乎无贡献。", practice: "按当前策略通过率做课程；持续去污染；把环境与验证器当作可复用资产。", formula: "P(退化组)=pᴳ+(1−p)ᴳ", tags: ["数据", "课程", "去污染"] },
  { id: 5, part: 2, title: "偏好与奖励模型", problem: "如何把人类或模型的比较变成可优化的标量？", conclusion: "Bradley–Terry 只能识别逐提示奖励差；奖励误差有结构，冻结奖励模型的有效半径应以策略 KL 衡量。", practice: "评估校准与系统偏差；按 KL 安排外部评测；用永久留出评判器发现规范误差。", formula: "P(y⁺≻y⁻)=σ(rφ(x,y⁺)−rφ(x,y⁻))", tags: ["奖励模型", "Bradley–Terry", "偏差"] },
  { id: 6, part: 2, title: "策略梯度", problem: "奖励怎样真正改变模型输出概率？", conclusion: "梯度把高优势词元的 log 概率推高、低优势词元推低；算法差异主要在优势估计与信赖域。", practice: "先选基线，再选归一化，再决定 KL/截断；用显式指标证明更新仍在可信区域。", formula: "∇J=E[Σₜ Aₜ∇logπθ(aₜ|sₜ)]", tags: ["PPO", "优势", "策略梯度"] },
  { id: 7, part: 2, title: "RLHF 工程实践", problem: "为什么理论相同的 PPO 实现会得到完全不同的结果？", conclusion: "实现细节常比截断目标本身更重要；代理奖励不能当停止准则，KL 放在奖励与损失里不是同一件事。", practice: "维护诊断契约：黄金奖励、KL、优势均值、clip fraction、长度、熵与值函数误差。", tags: ["PPO", "工程", "诊断"] },
  { id: 8, part: 2, title: "直接对齐算法", problem: "能否不训练奖励模型、不在线采样，直接用偏好更新策略？", conclusion: "DPO 是对 KL 正则最优策略的重参数化极大似然，不是 RL；它便宜，但会出现似然位移与结构性长度偏置。", practice: "报告实际 KL 而非 β；监控 chosen log-ratio 与生成质量；离线数据覆盖决定上限。", formula: "Lᴅᴘᴏ=−logσ(β[(logπθ/πref)⁺−(logπθ/πref)⁻])", tags: ["DPO", "离线", "偏好"] },
  { id: 9, part: 2, title: "在线、迭代与博弈", problem: "为什么同一损失换成当前策略数据后经常更强？", conclusion: "迭代的价值是产生相关负样本；陈旧 rejected response 梯度价值很低。非传递偏好更适合作为博弈而非单标量奖励。", practice: "保留 NLL 锚定与永久留出评估器；每轮监测长度、多样性与评判器俘获。", tags: ["在线", "迭代", "自博弈"] },
  { id: 10, part: 3, title: "推理与测试时计算", problem: "推理预算应该花在更长、更多、筛选还是搜索？", conclusion: "思维链是串行计算，不保证忠实解释；验证器把覆盖率转化为可靠答案，质量通常比采样数更重要。", practice: "以等词元预算比较长链、投票、best-of-n、修订和搜索，并报告对应 KL 成本。", formula: "pass@k=1−(1−p)ᵏ", tags: ["CoT", "best-of-n", "验证器"] },
  { id: 11, part: 3, title: "可验证奖励强化学习", problem: "怎样只用答案正确与否，激发长推理行为？", conclusion: "RLVR 用程序替代奖励模型；R1-Zero 说明结果奖励可诱发回溯与自检，但完整能力来自冷启动、RL、拒绝采样与蒸馏的流水线。", practice: "核查验证器可靠性与完备性；截断轨迹应掩码，不应直接判失败。", tags: ["RLVR", "GRPO", "R1"] },
  { id: 12, part: 3, title: "GRPO 的解剖", problem: "GRPO 的提升究竟来自策略梯度，还是来自记账方式？", conclusion: "最大效应常来自长度与组标准差归一化；退化组会让有效批量持续缩小，熵奖励通常救不了坍缩。", practice: "明确分母；记录退化组率与有效批量；离策略权重不可靠时截尾权重而非抹掉目标。", formula: "Âᵢ=(rᵢ−mean(r))/[std(r)+ε]", tags: ["GRPO", "归一化", "退化组"] },
  { id: 13, part: 3, title: "信用分配与过程监督", problem: "最终奖励应该如何分配给长链中的每一步？", conclusion: "精确优势是前缀值增量；更细信用用偏差换方差。PRM 适合重排序，但作为训练奖励的证据更弱。", practice: "短链先用组基线；只有在可快照、可重放且时域够长时，再支付细粒度估值成本。", formula: "A(sₜ,aₜ)=V(sₜ₊₁)−V(sₜ)", tags: ["信用分配", "PRM", "价值"] },
  { id: 14, part: 3, title: "RL 究竟教会了什么", problem: "RL 是发现新能力，还是只把已有正确行为变得更常见？", conclusion: "更稳妥的答案是“先发现、后锐化”，且依提示难度而变；pass@1 上升不代表大 k 覆盖率上升。", practice: "画完整 pass@k 曲线，并按训练算力跟踪；同时测词元熵与答案级多样性。", tags: ["激发", "锐化", "覆盖率"] },
  { id: 15, part: 3, title: "超越可验证领域", problem: "写作、研究等不能精确验收的任务怎样构造可信奖励？", conclusion: "可验证性是连续谱；评分细则只能降低独立噪声，消不掉共同偏差。乘法门控优于把程序分数与评判分数相加。", practice: "先程序闸门，再对通过集合评分；记录逐判据相关矩阵与可辩护奖励份额。", tags: ["半可验证", "Judge", "门控"] },
  { id: 16, part: 4, title: "从推理到智能体", problem: "环境进入循环后，单轮语言 RL 的哪些假设失效？", conclusion: "轨迹由策略与环境联合生成，问题变为 POMDP；观测词元不属于策略动作，给它们算 loss 会教模型伪造工具输出。", practice: "严格区分注意力、损失与比值掩码；按轮次建模优势；给工具调用显式定价。", formula: "p(τ)=∏ₜ πθ(aₜ|hₜ)·P(oₜ₊₁|hₜ,aₜ)", tags: ["Agent", "POMDP", "掩码"] },
  { id: 17, part: 4, title: "工具集成强化学习", problem: "怎样让模型在正确时机调用正确工具，而不是刷调用次数？", conclusion: "工具把缺失信息变成少数关键决策，从而扩张有效能力边界；奖励调用次数会选择低信息查询。", practice: "奖励最终结果，把格式和证据设为门，并扫描调用价格得到“准确率—成本”前沿。", formula: "调用当且仅当 E[信息价值] > c", tags: ["工具调用", "检索", "成本"] },
  { id: 18, part: 4, title: "长时域智能体 RL", problem: "百轮任务为何让单轮 RL 配方失灵？", conclusion: "奖励稀疏、上下文、采样成本与方差共同随时域恶化；一个坏轮次会污染整条轨迹的均匀优势。", practice: "优先掩蔽空转轮次；把截断视作缺失证据；训练与部署的历史压缩策略必须一致。", formula: "SNR ∝ m√G / N", tags: ["长时域", "稀疏奖励", "历史管理"] },
  { id: 19, part: 4, title: "环境、沙箱与任务供给", problem: "为什么环境质量本身就是奖励函数的一部分？", conclusion: "基础设施失败会系统性惩罚本来正确的动作；固定任务池很快耗尽，任务与验证器供给才是真瓶颈。", practice: "验证优先生成任务；只读重建后评分；上线训练前测确定性、可达性、可重放与可学习性。", tags: ["环境", "沙箱", "任务生成"] },
  { id: 20, part: 4, title: "多智能体与自博弈", problem: "多角色协作何时需要真正的多智能体训练？", conclusion: "关键不是角色数量，而是参数与奖励是否共享；轨迹奖励给无关角色同量级噪声，会导致角色坍缩。", practice: "先诊断共享参数是否足够；对链尾角色优先做反事实信用；监控通信可读性与合谋。", tags: ["多智能体", "自博弈", "通信"] },
  { id: 21, part: 5, title: "大规模后训练系统", problem: "采样、训练、同步和环境怎样排布，才能不让 GPU 等待？", conclusion: "生成主导账单；权重同步与掉队者是隐藏大项。异步不是开关，而是一个必须受控的陈旧度界。", practice: "记录各阶段时间、KV 缓存、同步带宽、生成/训练长度分布；LoRA 可显著降低同步成本。", tags: ["系统", "并行", "异步"] },
  { id: 22, part: 5, title: "采样与训练失配", problem: "为什么同一权重在推理引擎与训练引擎上也可能不是同一策略？", conclusion: "数值后端、MoE 路由、温度和 top-p 都会制造离策略误差；小的逐词元差距会沿长序列累积并毁掉 ESS。", practice: "逐词元对齐 logprob；先修数值，再做截尾重要性采样；采样与打分必须使用同一分布。", formula: "ESS/n≈exp(−T·s²)", tags: ["失配", "ESS", "数值"] },
  { id: 23, part: 5, title: "效率与成本控制", problem: "下一单位算力应该花在采样、训练、蒸馏还是数据上？", conclusion: "生成通常占约四分之三成本；退化组浪费大量词元。多数工程优化移动的是到达同一水平的速度，不是能力上限。", practice: "按生成词元而非步数比较；先预测无梯度样本；优先前缀共享、量化采样与适配器。", tags: ["成本", "吞吐", "蒸馏"] },
  { id: 24, part: 6, title: "评测与测量", problem: "怎样证明两条后训练流程真的不同，而不是抽样噪声？", conclusion: "能力、行为、可靠性不是一件事；小基准的 2–5 个百分点增益常低于噪声底，单种子消融尤其不可信。", practice: "保留逐题结果；优先配对检验与多种子；固定词元预算、抽取规则和评测框架版本。", tags: ["评测", "统计", "pass@k"] },
  { id: 25, part: 6, title: "安全对齐与稳健性", problem: "拒答能力能否代表诚实、稳健和安全行动？", conclusion: "安全包含五个不同问题；标准目标通常只能产生浅层对齐。提示注入是权限分离失败，不是拒答失败。", practice: "分别报告误拒与漏拒；以攻击成本描述稳健性；把关键管控移出策略动作空间。", tags: ["安全", "拒答", "提示注入"] },
  { id: 26, part: 6, title: "开放问题与前沿", problem: "2026 年中，哪些已定论，哪些仍只是排行榜印象？", conclusion: "最可靠的共识多是机制与测量原则，而不是算法排名；目标设定、长时域信用、环境供给与系统失配仍未解决。", practice: "优先投资测量、验证器和环境；任何新目标都应凭证一个可在训练损失之外测量的量。", tags: ["前沿", "开放问题", "方法论"] },
];

const formulas = [
  { key: "objective", name: "统一目标", equation: "J(θ)=E₍y∼πθ₎[r(x,y)]−βDₖₗ(πθ‖πref)", solves: "在追求奖励时，限制策略不要偏离一个仍会正常说话的参考模型。", params: [["θ", "待训练策略参数"], ["r", "反馈：人类、模型、程序或环境"], ["β", "锚定强度；越大越保守"], ["πref", "参考策略，定义可接受的起点"]], insight: "几乎全书的算法都在替换奖励、估计器、信用粒度或正则项。" },
  { key: "optimum", name: "KL 正则最优策略", equation: "π*(y|x)=πref(y|x)·exp(r/β) / Z(x)", solves: "解释奖励如何重排原策略的概率，而不是凭空创造完全没有的行为。", params: [["Z(x)", "归一化常数"], ["r/β", "奖励相对保守强度的比值"], ["exp", "把奖励差变成概率倍率"]], insight: "β 是“模仿参考”与“最大化奖励”的旋钮；奖励差 1、β=0.1 意味着约 e¹⁰ 倍倾斜。" },
  { key: "pg", name: "策略梯度", equation: "∇θJ=E[Σₜ Âₜ∇θlogπθ(aₜ|sₜ)]", solves: "把整条轨迹的一次评分，转成对每个已采样动作概率的更新。", params: [["Âₜ", "优势：该动作比基线好多少"], ["logπ", "动作的对数概率"], ["sₜ,aₜ", "第 t 步状态与动作"]], insight: "优势为正就提高该动作概率，为负就降低；信用分配决定每个词元拿到多少责任。" },
  { key: "ppo", name: "PPO 截断目标", equation: "L=−E[min(ρₜÂₜ, clip(ρₜ,1−ε,1+ε)Âₜ)]", solves: "避免一次更新把新策略推得离采样策略太远。", params: [["ρₜ", "新旧策略概率比"], ["ε", "截断宽度"], ["Âₜ", "优势估计"]], insight: "截断只是廉价近似，并不真正约束 KL；显式 KL 与早停仍有价值。" },
  { key: "dpo", name: "DPO", equation: "L=−logσ(β[Δlogπθ−Δlogπref])", solves: "直接从 chosen/rejected 样本对优化策略，无需在线采样和显式奖励模型。", params: [["Δ", "chosen 与 rejected 的对数概率差"], ["σ", "logistic 函数"], ["β", "隐式 KL/偏好强度"]], insight: "它只要求间隔变大，所以 chosen 的绝对概率也可能下降：这叫似然位移。" },
  { key: "grpo", name: "GRPO 组优势", equation: "Âᵢ=(rᵢ−r̄)/(sᵣ+ε)", solves: "不用评论家，用同一提示下多个回答的相对得分构造基线。", params: [["G", "每个提示采样数"], ["r̄", "组均值"], ["sᵣ", "组内奖励标准差"]], insight: "如果全对或全错，组内优势全为零；标准差归一化还会放大小方差组。" },
  { key: "passk", name: "pass@k", equation: "pass@k=1−(1−p)ᵏ", solves: "回答“采样 k 次，至少一次成功”的概率。", params: [["p", "单次成功概率"], ["k", "采样次数"]], insight: "RL 可能提高 pass@1 却降低大 k，说明众数更对但覆盖率更窄。" },
  { key: "ess", name: "长序列有效样本量", equation: "ESS/n≈exp(−T·s²)", solves: "估算推理与训练 logprob 的微小方差，沿长序列累积后还剩多少有效样本。", params: [["T", "序列长度"], ["s", "逐词元 logprob 间隙标准差"], ["n", "原始样本数"]], insight: "均值接近零不代表安全；重尾与离散程度才决定重要性权重是否失效。" },
];

const established = [
  ["已确立", "SFT 负责播种与格式，RL 负责按反馈重新分配概率；二者不是互斥替代。"],
  ["已确立", "验证器质量与任务供给，往往比 PPO/GRPO/DPO 的名字更决定上限。"],
  ["已确立", "长序列会放大比值方差、数值失配与信用噪声，必须单独测量。"],
  ["已确立", "奖励上升不是成功证据；要看留出指标、KL、覆盖率与真实任务结果。"],
  ["条件成立", "RL 能发现极低概率行为，但效果依提示难度、工具和有效支撑集而变。"],
  ["仍开放", "百轮智能体中的低偏差信用分配、环境生成与跨后端同策略性尚无通解。"],
];

const symptoms = {
  stop: { label: "模型说“接下来我会…”然后停止", why: "SFT 学到了叙述计划的文本模式，却没学到在自身状态分布上继续行动；结束符、assistant mask 或轨迹切分也可能把“承诺继续”当成合法终点。", chapters: "第 3、16、18、24 章", actions: ["统计 stop token 前 64 个 token 的模式，并把“计划性结尾”单列为失败类型", "检查多轮 loss mask：工具观测不训练，后续 assistant 动作必须训练；确认模板与 serving 完全一致", "补充从学生中间状态继续到成功的 recovery trace，而不只是完整专家轨迹", "将完成验证、预算合规、有效工具调用拆成独立指标；再考虑在线 RL/拒绝采样"] },
  tool: { label: "工具调用数量变多，但任务没更好", why: "奖励了调用或调用成功，而不是信息价值与最终结果；策略会挑容易成功但没信息量的查询。", chapters: "第 17、19、23 章", actions: ["只对最终结果给主奖励，把证据与格式设为门", "给每次调用加成本 c，扫描准确率—调用次数前沿", "做 observation ablation：删掉工具返回后重采样，判断它是否真正承重", "把检索器/环境故障与策略错误分开记录"] },
  reward: { label: "训练奖励涨，真实评测反而掉", why: "典型的代理奖励过度优化、奖励模型出分布或评判器俘获；奖励曲线是最不可信的单一指标。", chapters: "第 5、7、15、24 章", actions: ["按实际 KL 而非 step 对齐多个 checkpoint", "使用从不进训练的留出评判器和程序性闸门", "人工阅读奖励分位点两端的轨迹，寻找长度、格式、自信等捷径", "降低更新距离，并补充当前策略产生的新鲜比较数据"] },
  zero: { label: "GRPO 大量 batch 几乎没有梯度", why: "同一提示的样本全对或全错，组相对优势恰好为零；随着模型变强，全对组会越来越多。", chapters: "第 4、11、12、23 章", actions: ["记录 all-correct、all-wrong 与有效组比例", "根据当前通过率重采样提示，优先中等难度", "用 B/(B−M) 修正退化组造成的有效批量变化", "先修数据课程，再调学习率或 clip"] },
  cost: { label: "长程 Agent rollout 太慢、方差又大", why: "生成、环境延迟与掉队者叠加；终局一比特奖励却要分配给上万次决策。", chapters: "第 18、21、23 章", actions: ["先做空转轮次掩蔽和轮次级优势，不急着上昂贵 PRM", "前缀共享、环境快照与按整个 prompt group 调度", "按生成 token 记账，并对比生成/训练长度分布", "设定并监控陈旧度上限；异步不是无限免费的吞吐"] },
};

const quiz = [
  { q: "为什么 DPO 不等同于在线强化学习？", options: ["它不使用 Transformer", "它是在固定偏好数据上的重参数化极大似然", "它没有 β", "它不能使用参考模型"], answer: 1, note: "DPO 的 RL 结构来自推导；训练本身是固定数据上的分类/极大似然。" },
  { q: "GRPO 中一组样本全对时，最直接的后果是什么？", options: ["KL 变为无穷", "优势全部为零", "学习率自动增加", "评论家过拟合"], answer: 1, note: "组内没有相对差异，所以这组对策略梯度没有贡献。" },
  { q: "长时域工具轨迹中，为什么不能给 observation token 算 loss？", options: ["它们太长", "它们来自环境而非策略动作", "它们没有位置编码", "它们无法分词"], answer: 1, note: "否则模型会学习复述甚至伪造环境文本，而不是改善行动策略。" },
];

function Metric({ value, label, detail }: { value: string; label: string; detail: string }) {
  return <div className="metric"><span className="metric-value">{value}</span><span className="metric-label">{label}</span><span className="metric-detail">{detail}</span></div>;
}

export default function App() {
  const [tab, setTab] = useState("overview");
  const [partFilter, setPartFilter] = useState(0);
  const [selectedChapter, setSelectedChapter] = useState(17);
  const [query, setQuery] = useState("");
  const [done, setDone] = useState<number[]>([]);
  const [beta, setBeta] = useState(0.5);
  const [rewardGap, setRewardGap] = useState(1);
  const [successP, setSuccessP] = useState(0.25);
  const [sampleK, setSampleK] = useState(8);
  const [groupG, setGroupG] = useState(8);
  const [formulaKey, setFormulaKey] = useState("objective");
  const [symptom, setSymptom] = useState<keyof typeof symptoms>("stop");
  const [answers, setAnswers] = useState<Record<number, number>>({});

  useEffect(() => {
    try { const saved = localStorage.getItem("posttraining-progress"); if (saved) setDone(JSON.parse(saved)); } catch {}
  }, []);
  useEffect(() => {
    const context = (document as Document & { modelContext?: PageModelContext }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const report = () => {};
    void Promise.resolve(context.registerTool({
      name: "open_learning_chapter",
      title: "打开学习章节",
      description: "在章节地图中打开 1 到 26 之间的指定章节，并展示问题、结论、公式和实践建议。",
      inputSchema: { type: "object", properties: { chapter: { type: "integer", minimum: 1, maximum: 26 } }, required: ["chapter"], additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute(input) {
        const chapter = (input as { chapter?: unknown })?.chapter;
        if (!Number.isInteger(chapter) || Number(chapter) < 1 || Number(chapter) > 26) throw new Error("chapter 必须是 1 到 26 的整数");
        const item = chapters[Number(chapter) - 1];
        setSelectedChapter(Number(chapter)); setPartFilter(item.part); setTab("chapters");
        return { chapter: item.id, title: item.title, part: item.part };
      },
    }, { signal: lifecycle.signal })).catch(report);
    void Promise.resolve(context.registerTool({
      name: "set_chapter_completion",
      title: "设置章节学习状态",
      description: "把指定章节标记为已掌握或未完成，并同步更新页面学习进度。",
      inputSchema: { type: "object", properties: { chapter: { type: "integer", minimum: 1, maximum: 26 }, completed: { type: "boolean" } }, required: ["chapter", "completed"], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        const { chapter, completed } = input as { chapter?: unknown; completed?: unknown };
        if (!Number.isInteger(chapter) || Number(chapter) < 1 || Number(chapter) > 26 || typeof completed !== "boolean") throw new Error("需要有效的 chapter 与 completed");
        setDone((previous) => {
          const id = Number(chapter);
          const next = completed ? Array.from(new Set([...previous, id])) : previous.filter((x) => x !== id);
          try { localStorage.setItem("posttraining-progress", JSON.stringify(next)); } catch {}
          return next;
        });
        return { chapter: Number(chapter), completed };
      },
    }, { signal: lifecycle.signal })).catch(report);
    return () => lifecycle.abort();
  }, []);
  const toggleDone = (id: number) => {
    const next = done.includes(id) ? done.filter((x) => x !== id) : [...done, id];
    setDone(next);
    try { localStorage.setItem("posttraining-progress", JSON.stringify(next)); } catch {}
  };
  const filtered = useMemo(() => chapters.filter((c) => {
    const matchPart = partFilter === 0 || c.part === partFilter;
    return matchPart && `${c.title} ${c.problem} ${c.conclusion} ${c.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase());
  }), [partFilter, query]);
  const current = chapters.find((c) => c.id === selectedChapter) ?? chapters[0];
  const currentPart = parts.find((p) => p.id === current.part)!;
  const currentFormula = formulas.find((f) => f.key === formulaKey)!;
  const tilt = Math.min(0.999, (0.2 * Math.exp(rewardGap / beta)) / (0.8 + 0.2 * Math.exp(rewardGap / beta)));
  const passK = 1 - Math.pow(1 - successP, sampleK);
  const degenerate = Math.pow(successP, groupG) + Math.pow(1 - successP, groupG);
  const signal = ((groupG - 1) / groupG) * successP * (1 - successP);
  const progress = Math.round((done.length / chapters.length) * 100);
  const openPart = (id: number) => { setPartFilter(id); setTab("chapters"); };

  return (
    <SidebarProvider style={{ "--sidebar-width": "17.5rem" } as React.CSSProperties}>
      <Sidebar collapsible="offcanvas" className="atlas-sidebar">
        <SidebarHeader className="brand-block"><div className="brand-mark"><Orbit size={21} /></div><div><div className="brand-title">PostTrain Atlas</div><div className="brand-sub">后训练 · 推理 · 智能体</div></div></SidebarHeader>
        <SidebarContent>
          <SidebarGroup><SidebarGroupLabel>学习工作区</SidebarGroupLabel><SidebarGroupContent><SidebarMenu>
            {([["overview", "全书总览", BookOpen], ["chapters", "章节地图", Network], ["formulas", "公式实验室", Sigma], ["playbook", "实战流水线", Wrench]] as const).map(([key, label, Icon]) => (
              <SidebarMenuItem key={key}><SidebarMenuButton isActive={tab === key} onClick={() => setTab(key)}><Icon size={17} /><span>{label}</span></SidebarMenuButton></SidebarMenuItem>
            ))}
          </SidebarMenu></SidebarGroupContent></SidebarGroup>
          <SidebarGroup><SidebarGroupLabel>六部分</SidebarGroupLabel><SidebarGroupContent><SidebarMenu>
            {parts.map((p) => <SidebarMenuItem key={p.id}><SidebarMenuButton onClick={() => openPart(p.id)} isActive={tab === "chapters" && partFilter === p.id}><span className="part-dot" style={{ background: p.color }} /><span>{p.id}. {p.title}</span><span className="range">{p.range}</span></SidebarMenuButton></SidebarMenuItem>)}
          </SidebarMenu></SidebarGroupContent></SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="progress-card"><div className="progress-row"><span>学习进度</span><strong>{progress}%</strong></div><Progress value={progress} /><div className="progress-note">已掌握 {done.length} / {chapters.length} 章</div></SidebarFooter>
      </Sidebar>

      <SidebarInset className="site-shell">
        <header className="topbar">
          <div className="topbar-left"><SidebarTrigger aria-label="打开导航"><Menu /></SidebarTrigger><div className="crumb"><span>大模型后训练</span><ChevronRight size={14} /><strong>{tab === "overview" ? "全书总览" : tab === "chapters" ? "章节地图" : tab === "formulas" ? "公式实验室" : "实战流水线"}</strong></div></div>
          <div className="search-wrap"><Search size={16} /><Input value={query} onChange={(e) => setQuery(e.target.value)} onFocus={() => setTab("chapters")} placeholder="搜索章节、概念或失效模式…" aria-label="搜索全书" /></div>
          <div className="source-badge"><Sparkles size={14} />基于 2026·07 版全书</div>
        </header>
        <main className="main-canvas">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="mobile-tabs" variant="line"><TabsTrigger value="overview">总览</TabsTrigger><TabsTrigger value="chapters">章节</TabsTrigger><TabsTrigger value="formulas">公式</TabsTrigger><TabsTrigger value="playbook">实战</TabsTrigger></TabsList>

            <TabsContent value="overview" className="workspace">
              <section className="hero-grid">
                <div className="hero-copy"><div className="eyebrow"><span className="pulse" />791 页压缩成一张可操作的学习地图</div><h1>从“模型会说”到<br /><span>模型会完成任务</span></h1><p className="hero-lead">这本书解决的是同一个核心问题：如何把预训练得到的概率分布，变成能稳定追求目标、使用工具、接受验证并在长时域里完成任务的策略。</p><div className="hero-actions"><Button onClick={() => { setTab("chapters"); setPartFilter(4); }} className="primary-cta">从智能体部分开始 <ArrowRight /></Button><Button variant="outline" onClick={() => setTab("formulas")}>先看统一公式</Button></div></div>
                <div className="thesis-card"><div className="thesis-top"><Target size={19} /><span>全书一句话结论</span></div><p>算法名会变，真正承重的是四件事：</p><div className="four-pill"><span>反馈是否可信</span><span>样本是否有梯度</span><span>信用是否给对动作</span><span>测量是否看见真实进步</span></div><div className="thesis-foot"><Lightbulb size={16} />先优化验证器、环境与诊断，再优化损失函数。</div></div>
              </section>
              <section className="metric-strip"><Metric value="26" label="核心章节" detail="从 SFT 到 Agent RL" /><Metric value="6" label="知识层级" detail="基础 → 测量与安全" /><Metric value="4" label="反馈来源" detail="人类 / 模型 / 程序 / 世界" /><Metric value="1" label="统一母式" detail="奖励最大化 + KL 锚定" /></section>
              <section className="section-block"><div className="section-heading"><div><span className="section-kicker">THE PIPELINE</span><h2>现代后训练流水线，不是一种算法</h2></div><p>每一步解决不同差距；后一步不能替前一步补齐基本格式与接口。</p></div>
                <div className="pipeline">{[
                  ["01", "继续预训练", "补领域与推理底座", "数据分布"], ["02", "SFT", "播种格式与工具轨迹", "演示分布"], ["03", "偏好对齐", "选择更符合意图的回复", "比较反馈"], ["04", "推理 RL", "用验证器提升可靠性", "结果奖励"], ["05", "智能体 RL", "在环境中优化行动序列", "世界反馈"], ["06", "蒸馏与评测", "固化成果并验证没破坏什么", "留出测量"],
                ].map((s, i) => <div className="pipeline-step" key={s[0]}><div className="step-node"><span>{s[0]}</span>{i < 5 && <ArrowRight size={15} />}</div><h3>{s[1]}</h3><p>{s[2]}</p><small>{s[3]}</small></div>)}</div>
              </section>
              <section className="section-block"><div className="section-heading"><div><span className="section-kicker">KNOWLEDGE MAP</span><h2>六部分，各自解决什么</h2></div><p>点击任意部分，进入对应章节与可复用结论。</p></div>
                <div className="parts-grid">{parts.map((p) => <button key={p.id} className="part-card" onClick={() => openPart(p.id)} style={{ "--part": p.color } as React.CSSProperties}><div className="part-card-top"><span>PART {String(p.id).padStart(2, "0")}</span><ArrowRight size={17} /></div><h3>{p.title}</h3><p>{p.note}</p><div className="part-card-bottom"><span>章节 {p.range}</span><span className="mini-line" /></div></button>)}</div>
              </section>
              <section className="two-col section-block">
                <div className="panel established-panel"><div className="panel-title"><ShieldCheck size={20} /><div><h2>什么已经站得住</h2><p>把共识与开放问题分开，避免被算法榜单牵着走。</p></div></div><div className="claims">{established.map(([status, text], i) => <div className="claim" key={i}><span className={`status ${status === "仍开放" ? "open" : status === "条件成立" ? "conditional" : "solid"}`}>{status}</span><p>{text}</p></div>)}</div></div>
                <div className="panel quiz-panel"><div className="panel-title"><CircleHelp size={20} /><div><h2>3 分钟自测</h2><p>不是背术语，而是检查关键机制是否真的理解。</p></div></div>{quiz.map((item, qi) => <div className="quiz-item" key={item.q}><h3>{qi + 1}. {item.q}</h3><div className="quiz-options">{item.options.map((o, oi) => <button key={o} onClick={() => setAnswers({ ...answers, [qi]: oi })} className={answers[qi] === oi ? (oi === item.answer ? "correct" : "wrong") : ""}>{answers[qi] === oi ? (oi === item.answer ? <Check size={14} /> : <X size={14} />) : <span>{String.fromCharCode(65 + oi)}</span>}{o}</button>)}</div>{answers[qi] !== undefined && <p className="quiz-note">{item.note}</p>}</div>)}</div>
              </section>
            </TabsContent>

            <TabsContent value="chapters" className="workspace chapter-workspace">
              <section className="chapter-header"><div><span className="section-kicker">CHAPTER ATLAS</span><h1>26 章，不按顺序也能学</h1><p>每章只回答三件事：它解决什么问题、最可信的结论是什么、落地时要做什么。</p></div><div className="filter-chips"><button className={partFilter === 0 ? "active" : ""} onClick={() => setPartFilter(0)}>全部</button>{parts.map((p) => <button className={partFilter === p.id ? "active" : ""} key={p.id} onClick={() => setPartFilter(p.id)}>{p.title}</button>)}</div></section>
              <div className="chapter-layout">
                <div className="chapter-list"><div className="results-count">{filtered.length} 个章节{query && <span> · “{query}”</span>}</div>
                  {filtered.length === 0 ? <div className="empty-state"><Search size={26} /><h3>没有匹配结果</h3><p>换一个概念，或清除筛选。</p><Button variant="outline" onClick={() => { setQuery(""); setPartFilter(0); }}>清除筛选</Button></div> : filtered.map((c) => { const p = parts.find((x) => x.id === c.part)!; return <button key={c.id} onClick={() => setSelectedChapter(c.id)} className={`chapter-row ${selectedChapter === c.id ? "selected" : ""}`}><span className="chapter-number" style={{ borderColor: p.color, color: p.color }}>{String(c.id).padStart(2, "0")}</span><span className="chapter-row-copy"><strong>{c.title}</strong><small>{c.problem}</small><span className="tag-row">{c.tags.map((t) => <em key={t}>{t}</em>)}</span></span>{done.includes(c.id) ? <CheckCircle2 className="done-icon" size={19} /> : <ChevronRight size={18} />}</button>; })}
                </div>
                <aside className="chapter-detail" style={{ "--part": currentPart.color } as React.CSSProperties}><div className="detail-meta"><span>PART {current.part} · CHAPTER {current.id}</span><span>{currentPart.title}</span></div><h2>{current.title}</h2><div className="detail-section problem"><span><CircleHelp size={16} />解决的问题</span><p>{current.problem}</p></div><div className="detail-section conclusion"><span><Lightbulb size={16} />最重要的结论</span><p>{current.conclusion}</p></div>{current.formula && <div className="inline-formula"><small>关键表达</small><code>{current.formula}</code></div>}<div className="detail-section practice"><span><ListChecks size={16} />落地动作</span><p>{current.practice}</p></div><Button onClick={() => toggleDone(current.id)} variant={done.includes(current.id) ? "outline" : "default"} className="complete-button">{done.includes(current.id) ? <><Check size={16} />已掌握，点击撤销</> : <><CheckCircle2 size={16} />标记为已掌握</>}</Button><div className="detail-nav"><button disabled={current.id === 1} onClick={() => setSelectedChapter(current.id - 1)}>上一章</button><span>{current.id} / 26</span><button disabled={current.id === 26} onClick={() => setSelectedChapter(current.id + 1)}>下一章</button></div></aside>
              </div>
            </TabsContent>

            <TabsContent value="formulas" className="workspace">
              <section className="chapter-header formula-header"><div><span className="section-kicker">FORMULA LAB</span><h1>公式不是门槛，是流水线的仪表盘</h1><p>先理解每个量在控制什么，再看推导。点击公式，参数释义与直觉会同步更新。</p></div></section>
              <div className="formula-layout">
                <div className="formula-nav">{formulas.map((f, i) => <button className={formulaKey === f.key ? "active" : ""} key={f.key} onClick={() => setFormulaKey(f.key)}><span>{String(i + 1).padStart(2, "0")}</span><strong>{f.name}</strong><ChevronRight size={16} /></button>)}</div>
                <div className="formula-stage"><div className="formula-title-row"><div><span>当前公式</span><h2>{currentFormula.name}</h2></div><Sigma size={30} /></div><div className="equation">{currentFormula.equation}</div><div className="formula-solves"><Target size={17} /><p><strong>它解决：</strong>{currentFormula.solves}</p></div><div className="param-grid">{currentFormula.params.map(([k, v]) => <div key={k}><code>{k}</code><p>{v}</p></div>)}</div><div className="insight"><Lightbulb size={18} /><p>{currentFormula.insight}</p></div></div>
              </div>
              <section className="lab-grid section-block">
                <div className="lab-card"><div className="lab-title"><SlidersHorizontal size={19} /><div><h3>奖励如何改变概率</h3><p>参考概率固定为 20%</p></div></div><label><span>奖励差 Δr</span><strong>{rewardGap.toFixed(1)}</strong></label><Slider min={0.1} max={3} step={0.1} value={[rewardGap]} onValueChange={(v) => setRewardGap(v[0])} /><label><span>KL 强度 β</span><strong>{beta.toFixed(2)}</strong></label><Slider min={0.05} max={2} step={0.05} value={[beta]} onValueChange={(v) => setBeta(v[0])} /><div className="bar-compare"><div><span>参考策略</span><div className="bar"><i style={{ width: "20%" }} /></div><strong>20.0%</strong></div><div><span>倾斜后策略</span><div className="bar accent"><i style={{ width: `${tilt * 100}%` }} /></div><strong>{(tilt * 100).toFixed(1)}%</strong></div></div><p className="lab-caption">倍率 exp(Δr/β) = {Math.exp(Math.min(20, rewardGap / beta)).toFixed(1)}。β 很小时，一点奖励差也会让策略迅速变尖。</p></div>
                <div className="lab-card"><div className="lab-title"><Gauge size={19} /><div><h3>pass@k 与退化组</h3><p>同一个 p，推理与训练看到不同信号</p></div></div><label><span>单次成功率 p</span><strong>{Math.round(successP * 100)}%</strong></label><Slider min={0.01} max={0.99} step={0.01} value={[successP]} onValueChange={(v) => setSuccessP(v[0])} /><div className="dual-slider"><div><label><span>采样 k</span><strong>{sampleK}</strong></label><Slider min={1} max={64} step={1} value={[sampleK]} onValueChange={(v) => setSampleK(v[0])} /></div><div><label><span>组大小 G</span><strong>{groupG}</strong></label><Slider min={2} max={32} step={1} value={[groupG]} onValueChange={(v) => setGroupG(v[0])} /></div></div><div className="score-pair"><div><strong>{(passK * 100).toFixed(1)}%</strong><span>至少一次成功</span></div><div><strong>{(degenerate * 100).toFixed(1)}%</strong><span>全对/全错，无相对梯度</span></div><div><strong>{signal.toFixed(3)}</strong><span>相对信号强度</span></div></div><p className="lab-caption">提示太难或太容易都会让训练信号消失；课程学习的目标不是“更难”，而是“当前策略可学习”。</p></div>
              </section>
            </TabsContent>

            <TabsContent value="playbook" className="workspace">
              <section className="chapter-header"><div><span className="section-kicker">REUSABLE PLAYBOOK</span><h1>把书里的经验，变成可执行的流水线</h1><p>先从症状定位机制，再决定补数据、改奖励、换估计器，还是修系统。</p></div></section>
              <section className="diagnose panel"><div className="diagnose-top"><div><span className="section-kicker">DIAGNOSTIC</span><h2>你的训练现在卡在哪里？</h2></div><Activity size={28} /></div><div className="symptom-tabs">{(Object.keys(symptoms) as (keyof typeof symptoms)[]).map((k) => <button className={symptom === k ? "active" : ""} key={k} onClick={() => setSymptom(k)}>{symptoms[k].label}</button>)}</div><div className="diagnosis-result"><div className="why"><span>机制判断</span><p>{symptoms[symptom].why}</p><small>对应：{symptoms[symptom].chapters}</small></div><div className="action-list"><span>建议按这个顺序做</span>{symptoms[symptom].actions.map((a, i) => <div key={a}><b>{i + 1}</b><p>{a}</p></div>)}</div></div></section>
              <section className="section-block"><div className="section-heading"><div><span className="section-kicker">PRODUCTION PIPELINE</span><h2>一条成熟的 Agent 后训练闭环</h2></div><p>每一阶段都有输入、产物与放行条件；没有 gate，就没有“流水线”。</p></div><div className="maturity-flow">{[
                ["01", "任务与环境合同", "固定观测/动作 schema、终止条件、预算、可重放性", "Gate：环境成功率与抖动率"],
                ["02", "SFT 冷启动", "专家成功轨迹 + 学生失败状态上的 recovery trace", "Gate：格式、续跑、合法工具调用"],
                ["03", "验证与奖励", "程序性结果为主；证据/格式门控；工具成本定价", "Gate：可靠性、完备性、抗作弊"],
                ["04", "在线采样", "按当前通过率分层；保留失败类型与系统错误标签", "Gate：非退化组率、有效 token"],
                ["05", "策略更新", "组基线或评论家；严格 mask；KL 与失配校正", "Gate：KL、ESS、clip、熵、长度"],
                ["06", "留出评测", "逐题/逐任务配对；多种子；pass@k 与成本前沿", "Gate：真实提升且无关键能力回退"],
                ["07", "蒸馏与再循环", "把当前最佳成功轨迹蒸馏回 SFT，并补新环境", "Gate：新鲜度、去污染、版本化"],
              ].map((x) => <div className="maturity-step" key={x[0]}><div className="maturity-index">{x[0]}</div><div className="maturity-copy"><h3>{x[1]}</h3><p>{x[2]}</p><small>{x[3]}</small></div></div>)}</div></section>
              <section className="two-col section-block">
                <div className="panel checklist-panel"><div className="panel-title"><ListChecks size={20} /><div><h2>开跑前 12 项检查</h2><p>比再换一个算法更值得先做。</p></div></div><div className="check-grid">{["训练与服务模板逐字节一致", "assistant / observation mask 有单测", "截断轨迹与失败轨迹分开", "采样与打分温度完全一致", "推理/训练 logprob 逐词元对齐", "记录全对/全错退化组", "奖励模型有永久留出集", "真实指标按 KL 而非 step 对齐", "pass@1 与 pass@k 同时报告", "按生成 token 统计成本", "环境抖动与系统失败单列", "逐任务结果表可配对复算"].map((x) => <div key={x}><CheckCircle2 size={16} /><span>{x}</span></div>)}</div></div>
                <div className="panel decision-panel"><div className="panel-title"><GitBranch size={20} /><div><h2>方法选择，不从缩写开始</h2><p>先问反馈与环境是什么形状。</p></div></div><div className="decision-tree"><div><span>结果能程序验证？</span><b>是</b><p>优先 RLVR / 组基线；先验证 checker 可靠性与任务难度。</p></div><div><span>只有离线偏好对？</span><b>是</b><p>DPO 类方法是低成本起点；监控似然位移、长度与覆盖。</p></div><div><span>奖励依赖当前策略分布？</span><b>是</b><p>需要在线/迭代采样；陈旧负样本价值有限。</p></div><div><span>任务跨很多轮、环境可快照？</span><b>是</b><p>再考虑轮次信用、分叉估值或评论家；否则先做廉价掩蔽。</p></div></div></div>
              </section>
              <section className="closing-card"><div><span>最终原则</span><h2>训练的不是“一个 loss”，而是一套不断产生新证据的系统。</h2><p>策略、数据、验证器、环境与评测必须一起迭代；任何一个冻结太久，都会成为下一轮的瓶颈。</p></div><Button onClick={() => { setTab("chapters"); setSelectedChapter(24); setPartFilter(6); }}>回到测量章节 <ArrowRight /></Button></section>
            </TabsContent>
          </Tabs>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
