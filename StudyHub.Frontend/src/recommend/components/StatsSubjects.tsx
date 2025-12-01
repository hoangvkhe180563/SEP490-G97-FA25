import React, { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/common/components/ui/card";
import useRecommendStore from "../stores/useRecommendStore";
import { Skeleton } from "@/common/components/ui/skeleton";
import { Button } from "@/common/components/ui/button";
import { Input } from "@/common/components/ui/input";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/common/components/ui/popover";
import { Calendar as DatePicker } from "@/common/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
// no Select used here; inputs use shadcn `Input` or Calendar popovers

type Props = {
  start?: string | null;
  end?: string | null;
  top?: number;
};

const StatsSubjects: React.FC<Props> = () => {
  const {
    llmTopSubjects,
    llmTopRecommendedCourses,
    llmTopRecommendedDocuments,
    llmTopSubjectsLoading,
    llmTopRecommendedCoursesLoading,
    llmTopRecommendedDocumentsLoading,
    fetchLlmTopSubjects,
    fetchLlmTopRecommendedCourses,
    fetchLlmTopRecommendedDocuments,
  } = useRecommendStore((s: any) => s);

  // per-section filter state (dates shown as dd/mm/yyyy)
  const [draftSubStart, setDraftSubStart] = useState<string | null>(null);
  const [draftSubEnd, setDraftSubEnd] = useState<string | null>(null);
  const [draftSubTop, setDraftSubTop] = useState<number>(10);
  const [appliedSubStart, setAppliedSubStart] = useState<string | null>(null);
  const [appliedSubEnd, setAppliedSubEnd] = useState<string | null>(null);
  const [appliedSubTop, setAppliedSubTop] = useState<number>(10);

  const [draftCourseStart, setDraftCourseStart] = useState<string | null>(null);
  const [draftCourseEnd, setDraftCourseEnd] = useState<string | null>(null);
  const [draftCourseTop, setDraftCourseTop] = useState<number>(10);
  const [appliedCourseStart, setAppliedCourseStart] = useState<string | null>(
    null
  );
  const [appliedCourseEnd, setAppliedCourseEnd] = useState<string | null>(null);
  const [appliedCourseTop, setAppliedCourseTop] = useState<number>(10);

  const [draftDocStart, setDraftDocStart] = useState<string | null>(null);
  const [draftDocEnd, setDraftDocEnd] = useState<string | null>(null);
  const [draftDocTop, setDraftDocTop] = useState<number>(10);
  const [appliedDocStart, setAppliedDocStart] = useState<string | null>(null);
  const [appliedDocEnd, setAppliedDocEnd] = useState<string | null>(null);
  const [appliedDocTop, setAppliedDocTop] = useState<number>(10);

  function parseDdMmYyyyToIso(v: string | null): string | null {
    if (!v) return null;
    const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return null;
    const [_, dd, mm, yyyy] = m;
    return `${yyyy}-${mm}-${dd}`;
  }

  function formatDateToDdMmYyyy(d: Date): string {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  useEffect(() => {
    void fetchLlmTopSubjects(
      parseDdMmYyyyToIso(appliedSubStart) ?? undefined,
      parseDdMmYyyyToIso(appliedSubEnd) ?? undefined,
      appliedSubTop ?? 10
    );
  }, [fetchLlmTopSubjects, appliedSubStart, appliedSubEnd, appliedSubTop]);

  useEffect(() => {
    void fetchLlmTopRecommendedCourses(
      parseDdMmYyyyToIso(appliedCourseStart) ?? undefined,
      parseDdMmYyyyToIso(appliedCourseEnd) ?? undefined,
      appliedCourseTop ?? 10
    );
  }, [
    fetchLlmTopRecommendedCourses,
    appliedCourseStart,
    appliedCourseEnd,
    appliedCourseTop,
  ]);

  useEffect(() => {
    void fetchLlmTopRecommendedDocuments(
      parseDdMmYyyyToIso(appliedDocStart) ?? undefined,
      parseDdMmYyyyToIso(appliedDocEnd) ?? undefined,
      appliedDocTop ?? 10
    );
  }, [
    fetchLlmTopRecommendedDocuments,
    appliedDocStart,
    appliedDocEnd,
    appliedDocTop,
  ]);

  return (
    <Card className="w-full">
      <CardHeader>
        <div>
          <CardTitle className="text-sm">
            Thống kê đề xuất / Môn được hỏi
          </CardTitle>
          <div className="text-xs text-slate-500 mt-1">
            Danh sách các môn xuất hiện nhiều nhất trong đề xuất LLM và các
            khóa/tài liệu được đề xuất nhiều nhất.
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Subjects controls */}
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium mb-2">
              Môn học được hỏi nhiều nhất
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 items-center">
              <div className="w-28">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="justify-between px-2"
                    >
                      <span className="text-left">
                        {draftSubStart ?? "Từ (dd/mm/yyyy)"}
                      </span>
                      <CalendarIcon className="text-gray-400" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-0">
                    <DatePicker
                      mode="single"
                      selected={
                        draftSubStart
                          ? new Date(
                              parseDdMmYyyyToIso(draftSubStart) as string
                            )
                          : undefined
                      }
                      onSelect={(date?: Date) =>
                        date && setDraftSubStart(formatDateToDdMmYyyy(date))
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="w-28">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="justify-between px-2"
                    >
                      <span className="text-left">
                        {draftSubEnd ?? "Đến (dd/mm/yyyy)"}
                      </span>
                      <CalendarIcon className="text-gray-400" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-0">
                    <DatePicker
                      mode="single"
                      selected={
                        draftSubEnd
                          ? new Date(parseDdMmYyyyToIso(draftSubEnd) as string)
                          : undefined
                      }
                      onSelect={(date?: Date) =>
                        date && setDraftSubEnd(formatDateToDdMmYyyy(date))
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="w-32">
                <Input
                  type="number"
                  min={1}
                  value={String(draftSubTop)}
                  onChange={(e) =>
                    setDraftSubTop(Math.max(1, Number(e.target.value) || 1))
                  }
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setAppliedSubStart(draftSubStart);
                    setAppliedSubEnd(draftSubEnd);
                    setAppliedSubTop(draftSubTop);
                  }}
                >
                  Áp dụng
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setDraftSubStart(appliedSubStart);
                    setDraftSubEnd(appliedSubEnd);
                    setDraftSubTop(appliedSubTop);
                  }}
                >
                  Đặt lại
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end mb-2">
            {llmTopSubjectsLoading ? (
              <Skeleton className="h-5 w-20" />
            ) : (
              <div className="text-sm text-slate-600">
                Tổng:{" "}
                {llmTopSubjects.reduce(
                  (s: number, x: any) => s + (x.count ?? x.Count ?? 0),
                  0
                )}{" "}
                lần
              </div>
            )}
          </div>

          {llmTopSubjectsLoading ? (
            <div className="space-y-2 max-h-64">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* header for subjects list */}
              <div className="grid grid-cols-2 gap-4 text-xs text-slate-500 mb-2">
                <div className="font-medium">Môn</div>
                <div className="text-right font-medium">Số lượng</div>
              </div>
              <ul className="space-y-3 max-h-64 overflow-auto">
                {llmTopSubjects.map((it: any) => (
                  <li
                    key={it.subject}
                    className="flex items-center justify-between py-2 border-b last:border-b-0"
                  >
                    <div className="text-sm">{it.subject}</div>
                    <div className="text-sm font-semibold">{it.count}</div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* divider between sections */}
        <div className="border-t border-slate-200 my-3" />

        {/* Courses */}
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium mb-2">
              Khóa học được đề xuất nhiều nhất
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 items-center">
              <div className="w-32">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="justify-between px-2"
                    >
                      <span className="text-left">
                        {draftCourseStart ?? "Từ (dd/mm/yyyy)"}
                      </span>
                      <CalendarIcon className="text-gray-400" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-0">
                    <DatePicker
                      mode="single"
                      selected={
                        draftCourseStart
                          ? new Date(
                              // parse to ISO then to Date
                              parseDdMmYyyyToIso(draftCourseStart) as string
                            )
                          : undefined
                      }
                      onSelect={(date?: Date) => {
                        if (date)
                          setDraftCourseStart(formatDateToDdMmYyyy(date));
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="w-32">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="justify-between px-2"
                    >
                      <span className="text-left">
                        {draftCourseEnd ?? "Đến (dd/mm/yyyy)"}
                      </span>
                      <CalendarIcon className="text-gray-400" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-0">
                    <DatePicker
                      mode="single"
                      selected={
                        draftCourseEnd
                          ? new Date(
                              parseDdMmYyyyToIso(draftCourseEnd) as string
                            )
                          : undefined
                      }
                      onSelect={(date?: Date) => {
                        if (date) setDraftCourseEnd(formatDateToDdMmYyyy(date));
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="w-32">
                <Input
                  type="number"
                  min={1}
                  value={String(draftCourseTop)}
                  onChange={(e) =>
                    setDraftCourseTop(Math.max(1, Number(e.target.value) || 1))
                  }
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setAppliedCourseStart(draftCourseStart);
                    setAppliedCourseEnd(draftCourseEnd);
                    setAppliedCourseTop(draftCourseTop);
                  }}
                >
                  Áp dụng
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setDraftCourseStart(appliedCourseStart);
                    setDraftCourseEnd(appliedCourseEnd);
                    setDraftCourseTop(appliedCourseTop);
                  }}
                >
                  Đặt lại
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end mb-2">
            {llmTopRecommendedCoursesLoading ? (
              <Skeleton className="h-5 w-20" />
            ) : (
              <div className="text-sm text-slate-600">
                Tổng:{" "}
                {llmTopRecommendedCourses.reduce(
                  (s: number, x: any) => s + (x.count ?? x.Count ?? 0),
                  0
                )}{" "}
                lần
              </div>
            )}
          </div>

          {llmTopRecommendedCoursesLoading ? (
            <div className="space-y-2 max-h-48">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* header for courses list */}
              <div className="grid grid-cols-3 gap-4 text-xs text-slate-500 mb-2">
                <div className="font-medium">Tiêu đề</div>
                <div className="font-medium">Môn</div>
                <div className="text-right font-medium">Số lượt</div>
              </div>
              <ul className="space-y-2 max-h-48 overflow-auto">
                {llmTopRecommendedCourses.map((c: any) => (
                  <li
                    key={c.id ?? c.Id}
                    className="py-2 border-b last:border-b-0"
                  >
                    <div className="grid grid-cols-3 gap-4 items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded overflow-hidden flex-shrink-0">
                          {(c.imageUrl ?? c.ImageUrl) ? (
                            <img src={(c.imageUrl ?? c.ImageUrl) as string} alt={(c.title ?? c.Title ?? c.id ?? c.Id) as string} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-slate-100" />
                          )}
                        </div>
                        <div className="text-sm">{c.title ?? c.Title ?? c.id ?? c.Id}</div>
                      </div>
                      <div className="text-sm">
                        {c.subject ?? c.Subject ?? "-"}
                      </div>
                      <div className="text-sm font-semibold text-right">
                        {c.count ?? c.Count}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* divider between sections */}
        <div className="border-t border-slate-200 my-3" />

        {/* Documents */}
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium mb-2">
              Tài liệu được đề xuất nhiều nhất
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 items-center">
              <div className="w-32">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="justify-between px-2"
                    >
                      <span className="text-left">
                        {draftDocStart ?? "Từ (dd/mm/yyyy)"}
                      </span>
                      <CalendarIcon className="text-gray-400" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-0">
                    <DatePicker
                      mode="single"
                      selected={
                        draftDocStart
                          ? new Date(
                              parseDdMmYyyyToIso(draftDocStart) as string
                            )
                          : undefined
                      }
                      onSelect={(date?: Date) => {
                        if (date) setDraftDocStart(formatDateToDdMmYyyy(date));
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="w-32">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="justify-between px-2"
                    >
                      <span className="text-left">
                        {draftDocEnd ?? "Đến (dd/mm/yyyy)"}
                      </span>
                      <CalendarIcon className="text-gray-400" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-0">
                    <DatePicker
                      mode="single"
                      selected={
                        draftDocEnd
                          ? new Date(parseDdMmYyyyToIso(draftDocEnd) as string)
                          : undefined
                      }
                      onSelect={(date?: Date) => {
                        if (date) setDraftDocEnd(formatDateToDdMmYyyy(date));
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="w-32">
                <Input
                  type="number"
                  min={1}
                  value={String(draftDocTop)}
                  onChange={(e) =>
                    setDraftDocTop(Math.max(1, Number(e.target.value) || 1))
                  }
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setAppliedDocStart(draftDocStart);
                    setAppliedDocEnd(draftDocEnd);
                    setAppliedDocTop(draftDocTop);
                  }}
                >
                  Áp dụng
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setDraftDocStart(appliedDocStart);
                    setDraftDocEnd(appliedDocEnd);
                    setDraftDocTop(appliedDocTop);
                  }}
                >
                  Đặt lại
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end mb-2">
            {llmTopRecommendedDocumentsLoading ? (
              <Skeleton className="h-5 w-20" />
            ) : (
              <div className="text-sm text-slate-600">
                Tổng:{" "}
                {llmTopRecommendedDocuments.reduce(
                  (s: number, x: any) => s + (x.count ?? x.Count ?? 0),
                  0
                )}{" "}
                lần
              </div>
            )}
          </div>

          {llmTopRecommendedDocumentsLoading ? (
            <div className="space-y-2 max-h-48">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* header for documents list */}
              <div className="grid grid-cols-3 gap-4 text-xs text-slate-500 mb-2">
                <div className="font-medium">Tiêu đề</div>
                <div className="font-medium">Môn</div>
                <div className="text-right font-medium">Số lượt</div>
              </div>
              <ul className="space-y-2 max-h-48 overflow-auto">
                {llmTopRecommendedDocuments.map((d: any) => (
                  <li
                    key={d.id ?? d.Id}
                    className="py-2 border-b last:border-b-0"
                  >
                    <div className="grid grid-cols-3 gap-4 items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded overflow-hidden flex-shrink-0">
                          {(d.thumbnail ?? d.Thumbnail) ? (
                            <img src={(d.thumbnail ?? d.Thumbnail) as string} alt={(d.title ?? d.Title ?? d.id ?? d.Id) as string} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-slate-100" />
                          )}
                        </div>
                        <div className="text-sm">{d.title ?? d.Title ?? d.id ?? d.Id}</div>
                      </div>
                      <div className="text-sm">
                        {d.subject ?? d.Subject ?? "-"}
                      </div>
                      <div className="text-sm font-semibold text-right">
                        {d.count ?? d.Count}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsSubjects;
