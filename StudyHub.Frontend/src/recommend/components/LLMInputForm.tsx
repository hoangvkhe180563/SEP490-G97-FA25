import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRecommendStore } from "../stores/useRecommendStore";
import LlmSidebar from "./LlmSidebar";

import { Wand2, RefreshCw, Hourglass } from "lucide-react";
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
import { Checkbox } from "@/common/components/ui/checkbox";
import { Label } from "@/common/components/ui/label";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/common/components/ui/tooltip";

const hints = [
  'Muốn củng cố "đại số" và "phương trình"',
  "Chuẩn bị ôn thi THPT, ưu tiên luyện đề",
  "Muốn học nhanh, nội dung ngắn gọn, tập trung",
];

const LLMInputForm: React.FC = () => {
  const [text, setText] = useState("");
  const [selectedHint, setSelectedHint] = useState<string | null>(null);
  const [generateExplanation, setGenerateExplanation] = useState<boolean>(true);
  // use store via getState when needed to coordinate create->recommend->update flow
  const nav = useNavigate();

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const message = text || selectedHint || undefined;
    try {
      // create history entry first
      const created = await (useRecommendStore as any)
        .getState()
        .createLlmHistory(message);
      const historyId =
        created?.Id ?? created?.id ?? created?.data?.Id ?? created?.data?.id;

      // navigate to dedicated LLM result page using path param
      nav(`/recommend/student/llm/${historyId}`);

      // If user opted out, skip calling the AI and updating history
      if (!generateExplanation) return;

      // call recommend LLM and after it completes update history response
      const store = useRecommendStore.getState();
      // fetchRecommendLLM now returns the result to avoid a read-after-write race
      const result = await store.fetchRecommendLLM(message);
      if (result) {
        // persist the LLM response as JSON string (so backend stores full payload)
        const responseText = JSON.stringify(result);
        await store.updateLlmHistoryResponse(
          historyId,
          responseText,
          result.totalPromptTokens,
          result.totalResponseTokens
        );
      }
    } catch (err) {
      // error handling left to store (error state)
      console.error("LLM submit error", err);
    }
  };

  // handle Enter for quick submit (Shift+Enter for newline)
  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      await submit();
    }
  };

  return (
    <div className="relative min-h-screen max-h-screen overflow-y-auto p-6 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
      <div className="max-w-full grid grid-cols-[20rem_1fr] gap-6">
        <LlmSidebar />

        <div className="relative">
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
          <Card className="relative z-10 w-full shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)] border border-white/20 dark:border-slate-700/50 bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-3xl font-semibold">
                Mô tả mục tiêu học tập của bạn
              </CardTitle>
              <CardDescription className="text-base">
                Chọn một gợi ý hoặc mô tả ngắn gọn chủ đề, kỹ năng bạn muốn AI
                phân tích để tạo đề xuất.
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
                onKeyDown={handleKeyDown}
                rows={6}
                placeholder="Ví dụ: Tôi muốn củng cố đại số, nhất là phần phương trình để chuẩn bị thi vào 10..."
                className="bg-white/80 dark:bg-slate-900/60 border border-slate-300/60 dark:border-slate-700/60"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center">
                        <Checkbox
                          id="generateExplanation"
                          checked={generateExplanation}
                          onCheckedChange={(v: boolean) =>
                            setGenerateExplanation(Boolean(v))
                          }
                        />
                        <Label
                          htmlFor="generateExplanation"
                          className="text-sm cursor-pointer ml-2"
                        >
                          Tạo câu giải thích bằng AI
                        </Label>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <div className="flex items-center gap-2">
                        <Hourglass className="h-4 w-4" />
                        <span>
                          Chọn sẽ mất thời gian để AI tạo ra lời giải thích hơn
                        </span>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="text-xs text-slate-500">
                  Bật để AI phân tích và lưu kết quả
                </div>
              </div>

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
      </div>
    </div>
  );
};

export default LLMInputForm;
