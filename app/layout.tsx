import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PostTrain Atlas｜大模型后训练学习地图",
  description: "《大模型后训练：对齐、推理与智能体》的交互式中文学习地图：26 章解读、公式实验室、Agent RL 流水线与故障诊断。",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
