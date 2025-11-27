import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRecommendStore } from "../stores/useRecommendStore";

import { Wand2, RefreshCw } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
import { Badge } from "@/common/components/ui/badge";
import { Textarea } from "@/common/components/ui/textarea";
import { Button } from "@/common/components/ui/button";

const hints = [
  'Muốn củng cố "đại số" và "phương trình"',
  "Chuẩn bị ôn thi THPT, ưu tiên luyện đề",
  "Muốn học nhanh, nội dung ngắn gọn, tập trung",
];

const LLMInputForm: React.FC = () => {
  const [text, setText] = useState("");
  const [selectedHint, setSelectedHint] = useState<string | null>(null);
  const { fetchRecommendLLM } = useRecommendStore();
  const nav = useNavigate();

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    nav("/recommend/results?mode=llm");
    await fetchRecommendLLM(text || selectedHint || undefined);
  };

  return (
    <div
      className="      
        relative min-h-screen flex items-center justify-center p-6
        bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 
        dark:from-slate-900 dark:via-slate-950 dark:to-slate-900
      "
    >
      {/* Dot grid (Linear style) */}
      <div
        className="absolute inset-0 opacity-[0.2] dark:opacity-[0.15]
          bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.20)_1px,transparent_0)] 
          bg-[size:22px_22px]"
      />

      {/* Aurora glow */}
      <div
        className="absolute -top-24 left-1/2 -translate-x-1/2 
                      w-[900px] h-[350px] blur-3xl 
                      bg-purple-300/20 dark:bg-purple-600/20 rounded-full"
      />
      <div
        className="absolute bottom-10 right-20 
                      w-[400px] h-[240px] blur-3xl 
                      bg-indigo-300/20 dark:bg-indigo-800/20 rounded-full"
      />

      {/* Main card */}
      <Card
        className="
          relative z-10 max-w-4xl w-full 
          shadow-[0_8px_30px_rgba(0,0,0,0.08)] 
          dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)]
          border border-white/20 dark:border-slate-700/50 
          bg-white/70 dark:bg-slate-900/40 
          backdrop-blur-xl rounded-2xl
      "
      >
        <CardHeader>
          <CardTitle className="text-3xl font-semibold">
            Mô tả mục tiêu học tập của bạn
          </CardTitle>
          <CardDescription className="text-base">
            Chọn một gợi ý hoặc mô tả ngắn gọn chủ đề, kỹ năng bạn muốn AI phân
            tích để tạo đề xuất.
          </CardDescription>
        </CardHeader>

        <CardContent className="mt-2 space-y-6">
          {/* Hint buttons */}
          <div className="flex flex-wrap gap-2">
            {hints.map((h) => (
              <Badge
                key={h}
                variant={selectedHint === h ? "default" : "outline"}
                onClick={() => {
                  setSelectedHint(h);
                  setText("");
                }}
                className={`
                  text-sm px-3 py-1 cursor-pointer transition
                  ${
                    selectedHint === h
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                      : "hover:bg-slate-200 dark:hover:bg-slate-700"
                  }
                `}
              >
                {h}
              </Badge>
            ))}
          </div>

          {/* Input textarea */}
          <Textarea
            value={text}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
              setText(e.target.value);
              setSelectedHint(null);
            }}
            rows={6}
            placeholder="Ví dụ: Tôi muốn củng cố đại số, nhất là phần phương trình để chuẩn bị thi vào 10..."
            className="bg-white/80 dark:bg-slate-900/60 border border-slate-300/60 dark:border-slate-700/60"
          />

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setText("");
                setSelectedHint(null);
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Làm lại
            </Button>

            <Button
              onClick={submit}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Wand2 className="mr-2 h-4 w-4" />
              Phân tích và lấy gợi ý
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LLMInputForm;
