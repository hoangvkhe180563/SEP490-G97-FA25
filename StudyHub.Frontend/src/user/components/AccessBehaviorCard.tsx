import React, { useEffect, useState, useRef } from "react";
import useAccountDashboardStore from "@/user/stores/useAccountDashboardStore";
import { Button } from "@/common/components/ui/button";
import { Input } from "@/common/components/ui/input";
import { Badge } from "@/common/components/ui/badge";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/common/components/ui/popover";
import { Calendar as DatePicker } from "@/common/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/common/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
} from "@/common/components/ui/pagination";

const formatDateLabel = (d: string) => {
  try {
    const dt = new Date(d);
    if (!isNaN(dt.getTime())) return dt.toLocaleDateString();
  } catch {
    // ignore
  }
  return d;
};

const formatVietnameseDay = (period: string) => {
  // expect YYYY-MM-DD or similar
  try {
    const parts = period.split("-");
    if (parts.length >= 3) {
      const y = Number(parts[0]);
      const m = Number(parts[1]);
      const d = Number(parts[2]);
      if (!Number.isNaN(y) && !Number.isNaN(m) && !Number.isNaN(d)) {
        return `Ngày ${d} tháng ${m} năm ${y}`;
      }
    }
  } catch (e) {
    // ignore parse errors
    console.warn(e);
  }
  return period;
};

const formatVietnameseMonth = (period: string) => {
  // expect YYYY-MM
  try {
    const parts = period.split("-");
    if (parts.length >= 2) {
      const y = Number(parts[0]);
      const m = Number(parts[1]);
      if (!Number.isNaN(y) && !Number.isNaN(m)) {
        return `Tháng ${m} năm ${y}`;
      }
    }
  } catch (e) {
    // ignore parse errors
    console.warn(e);
  }
  return period;
};

const formatLocalYMD = (date: Date) => {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`;
};

const ymdToDate = (v?: string) => {
  if (!v) return undefined;
  const parts = v.split("-");
  if (parts.length < 3) return undefined;
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  return new Date(y, m - 1, d);
};

const ymdToEndDate = (v?: string) => {
  const d = ymdToDate(v);
  if (!d) return undefined;
  d.setHours(23, 59, 59, 999);
  return d;
};

const AccessBehaviorCard: React.FC<{ schoolId?: number }> = ({ schoolId }) => {
  const storePeakHours = useAccountDashboardStore((s) => s.peakHours);
  const storeDau = useAccountDashboardStore((s) => s.dau);
  const storeMau = useAccountDashboardStore((s) => s.mau);
  // using direct axios fetches here for independent DAU/MAU pagination
  const isLoading = useAccountDashboardStore((s) => s.isLoading);

  // Use store slices directly; store methods fetchDauPage/fetchMauPage
  // will set only the respective slices so DAU/MAU pagination stays independent.

  // page state is managed per-card (dauPage, mauPage)
  const abPageSize = 7;

  const [abStart, setAbStart] = useState<string | undefined>(undefined);
  const [abEnd, setAbEnd] = useState<string | undefined>(undefined);
  const [top, setTop] = useState<number>(5);

  const [dauPage, setDauPage] = useState<number>(1);
  const [mauPage, setMauPage] = useState<number>(1);

  // Capture the initial values at first mount so "Đặt lại" can restore
  // the calendar inputs/pages/top to the state they had when the page loaded
  // and re-fetch the same data.
  const initialRef = useRef<{
    abStart?: string;
    abEnd?: string;
    top: number;
    dauPage: number;
    mauPage: number;
  }>({ abStart, abEnd, top, dauPage, mauPage });

  useEffect(() => {
    initialRef.current = { abStart, abEnd, top, dauPage, mauPage };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // We'll call store.fetchDauPage / fetchMauPage / fetchPeakHours instead of axios here.
  const fetchDauPage = useAccountDashboardStore((s) => s.fetchDauPage);
  const fetchMauPage = useAccountDashboardStore((s) => s.fetchMauPage);
  const fetchPeakHours = useAccountDashboardStore((s) => s.fetchPeakHours);

  // initial load - fetch both DAU and MAU pages
  useEffect(() => {
    const s = abStart ? ymdToDate(abStart)?.toISOString() : undefined;
    const e = abEnd ? ymdToEndDate(abEnd)?.toISOString() : undefined;
    fetchDauPage({
      start: s,
      end: e,
      top,
      page: dauPage,
      pageSize: abPageSize,
      newestFirst: true,
      schoolId,
    }).catch(() => {});
    fetchMauPage({
      start: s,
      end: e,
      top,
      page: mauPage,
      pageSize: abPageSize,
      newestFirst: true,
      schoolId,
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDauPrev = () => {
    const next = Math.max(1, dauPage - 1);
    setDauPage(next);
    const s = abStart ? ymdToDate(abStart)?.toISOString() : undefined;
    const e = abEnd ? ymdToEndDate(abEnd)?.toISOString() : undefined;
    fetchDauPage({
      start: s,
      end: e,
      top,
      page: next,
      pageSize: abPageSize,
      newestFirst: true,
      schoolId,
    }).catch(() => {});
  };

  const handleDauNext = () => {
    const total = storeDau?.totalPages ?? 1;
    const next = Math.min(total, dauPage + 1);
    setDauPage(next);
    const s = abStart ? ymdToDate(abStart)?.toISOString() : undefined;
    const e = abEnd ? ymdToEndDate(abEnd)?.toISOString() : undefined;
    fetchDauPage({
      start: s,
      end: e,
      top,
      page: next,
      pageSize: abPageSize,
      newestFirst: true,
      schoolId,
    }).catch(() => {});
  };

  const handleMauPrev = () => {
    const next = Math.max(1, mauPage - 1);
    setMauPage(next);
    const s = abStart ? ymdToDate(abStart)?.toISOString() : undefined;
    const e = abEnd ? ymdToEndDate(abEnd)?.toISOString() : undefined;
    fetchMauPage({
      start: s,
      end: e,
      top,
      page: next,
      pageSize: abPageSize,
      newestFirst: true,
      schoolId,
    }).catch(() => {});
  };

  const handleMauNext = () => {
    const total = storeMau?.totalPages ?? 1;
    const next = Math.min(total, mauPage + 1);
    setMauPage(next);
    const s = abStart ? ymdToDate(abStart)?.toISOString() : undefined;
    const e = abEnd ? ymdToEndDate(abEnd)?.toISOString() : undefined;
    fetchMauPage({
      start: s,
      end: e,
      top,
      page: next,
      pageSize: abPageSize,
      newestFirst: true,
      schoolId,
    }).catch(() => {});
  };

  const applyDateRange = async () => {
    const s = abStart ? ymdToDate(abStart)?.toISOString() : undefined;
    const e = abEnd ? ymdToEndDate(abEnd)?.toISOString() : undefined;
    await fetchDauPage({
      start: s,
      end: e,
      top,
      page: dauPage,
      pageSize: abPageSize,
      newestFirst: true,
      schoolId,
    });
    await fetchMauPage({
      start: s,
      end: e,
      top,
      page: mauPage,
      pageSize: abPageSize,
      newestFirst: true,
      schoolId,
    });
  };

  const resetDateRange = async () => {
    // Restore the input controls (start/end/top) to the values captured
    // when the page first loaded, reset pages back to their initial values,
    // and re-fetch the same data as on initial load.
    const init = initialRef.current;
    setAbStart(init.abStart);
    setAbEnd(init.abEnd);
    setTop(init.top ?? 5);
    // restore pages
    setDauPage(init.dauPage ?? 1);
    setMauPage(init.mauPage ?? 1);

    const s = init.abStart ? ymdToDate(init.abStart)?.toISOString() : undefined;
    const e = init.abEnd ? ymdToEndDate(init.abEnd)?.toISOString() : undefined;

    // re-fetch DAU/MAU for the restored pages
    fetchDauPage({
      start: s,
      end: e,
      top: init.top ?? 5,
      page: init.dauPage ?? 1,
      pageSize: abPageSize,
      newestFirst: true,
      schoolId,
    }).catch(() => {});

    fetchMauPage({
      start: s,
      end: e,
      top: init.top ?? 5,
      page: init.mauPage ?? 1,
      pageSize: abPageSize,
      newestFirst: true,
      schoolId,
    }).catch(() => {});

    // re-fetch peak hours as they were on initial load
    fetchPeakHours({ start: s, end: e, top: init.top ?? 5, schoolId }).catch(
      () => {}
    );
  };

  const applyTopOnly = async (useTop?: number) => {
    const t = useTop ?? top;
    const s = abStart ? ymdToDate(abStart)?.toISOString() : undefined;
    const e = abEnd ? ymdToEndDate(abEnd)?.toISOString() : undefined;
    await fetchPeakHours({ start: s, end: e, top: t, schoolId });
  };

  return (
    <Card>
      <CardHeader>
        <div className="w-full flex items-start justify-between gap-4">
          <div>
            <CardTitle>2. Thống kê hành vi truy cập</CardTitle>
            <CardDescription className="mt-2">
              Thời gian cao điểm, số lượng người dùng hoạt động theo thời gian
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex-1 justify-between">
                  <span className="text-left">
                    {abStart ? formatDateLabel(abStart) : "(Chọn ngày bắt đầu)"}
                  </span>
                  <CalendarIcon className="text-gray-400" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                side="bottom"
                sideOffset={8}
                align="center"
                className="w-[330px] p-0 z-50"
              >
                <DatePicker
                  mode="single"
                  selected={abStart ? ymdToDate(abStart) : undefined}
                  onSelect={(d?: Date) => d && setAbStart(formatLocalYMD(d))}
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex-1 justify-between">
                  <span className="text-left">
                    {abEnd ? formatDateLabel(abEnd) : "(Chọn ngày kết thúc)"}
                  </span>
                  <CalendarIcon className="text-gray-400" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                side="bottom"
                sideOffset={8}
                align="center"
                className="w-[330px] p-0 z-50"
              >
                <DatePicker
                  mode="single"
                  selected={abEnd ? ymdToDate(abEnd) : undefined}
                  onSelect={(d?: Date) => d && setAbEnd(formatLocalYMD(d))}
                />
              </PopoverContent>
            </Popover>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                applyDateRange().catch(() => {});
              }}
            >
              Áp dụng
            </Button>
            <Button
              size="sm"
              onClick={() => {
                resetDateRange().catch(() => {});
              }}
            >
              Đặt lại
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-48 bg-gray-100" />
        ) : (
          <div className="space-y-4">
            {/* Peak Hours card */}
            <Card>
              <CardHeader>
                <CardTitle>Thời gian cao điểm</CardTitle>
                <CardDescription>Những giờ truy cập nhiều nhất</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-sm text-slate-600">Số lượng</div>
                  <Input
                    type="number"
                    className="w-24"
                    value={top}
                    onChange={(e) => setTop(Number(e.target.value || 0))}
                    min={1}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => applyTopOnly().catch(() => {})}
                  >
                    Áp dụng
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setTop(5);
                      applyTopOnly(5).catch(() => {});
                    }}
                  >
                    Đặt lại
                  </Button>
                </div>

                {storePeakHours && storePeakHours.length > 0 ? (
                  <div className="space-y-2">
                    {(() => {
                      const sorted = [...storePeakHours].sort(
                        (a, b) => b.count - a.count
                      );
                      const max = Math.max(...sorted.map((p) => p.count), 1);
                      return sorted.map((p, idx) => (
                        <div key={p.hour} className="flex items-center gap-3">
                          <div className="w-44 text-sm">
                            {p.hour}:00{" "}
                            {idx === 0 ? (
                              <Badge className="ml-2 text-xs px-2 py-0.5 bg-rose-50 text-rose-600">
                                Cao điểm
                              </Badge>
                            ) : null}
                          </div>
                          <div className="flex-1 bg-slate-100 h-5 rounded overflow-hidden">
                            <div
                              style={{ width: `${(p.count / max) * 100}%` }}
                              className="h-5 bg-indigo-500 rounded"
                            />
                          </div>
                          <div className="w-12 text-right text-sm font-medium">
                            {p.count}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                ) : (
                  <div className="text-sm text-slate-500">Không có dữ liệu</div>
                )}
              </CardContent>
            </Card>

            {/* DAU card */}
            <Card>
              <CardHeader>
                <CardTitle>DAU</CardTitle>
                <CardDescription>
                  Số lượng người dùng truy cập hằng ngày
                </CardDescription>
              </CardHeader>
              <CardContent>
                {storeDau && storeDau.items && storeDau.items.length > 0 ? (
                  <div className="space-y-2">
                    {storeDau.items.map((it: any) => (
                      <div
                        key={it.period}
                        className="flex justify-between items-center"
                      >
                        <div className="text-sm">
                          {formatVietnameseDay(it.period)}
                        </div>
                        <div className="text-sm font-medium">{it.count}</div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between mt-3">
                      <div className="text-sm text-slate-500">
                        Tổng: {storeDau?.totalCount ?? 0}
                      </div>
                      <div className="flex items-center gap-2">
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious onClick={handleDauPrev} />
                            </PaginationItem>
                            <PaginationItem>
                              <PaginationLink isActive>
                                {dauPage}
                              </PaginationLink>
                            </PaginationItem>
                            <PaginationItem>
                              <PaginationNext onClick={handleDauNext} />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-slate-500">Không có dữ liệu</div>
                )}
              </CardContent>
            </Card>

            {/* MAU card */}
            <Card>
              <CardHeader>
                <CardTitle>MAU</CardTitle>
                <CardDescription>
                  Số lượng người dùng truy cập hằng tháng
                </CardDescription>
              </CardHeader>
              <CardContent>
                {storeMau && storeMau.items && storeMau.items.length > 0 ? (
                  <div className="space-y-2">
                    {storeMau.items.map((it: any) => (
                      <div
                        key={it.period}
                        className="flex justify-between items-center"
                      >
                        <div className="text-sm">
                          {formatVietnameseMonth(it.period)}
                        </div>
                        <div className="text-sm font-medium">{it.count}</div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between mt-3">
                      <div className="text-sm text-slate-500">
                        Tổng: {storeMau?.totalCount ?? 0}
                      </div>
                      <div className="flex items-center gap-2">
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious onClick={handleMauPrev} />
                            </PaginationItem>
                            <PaginationItem>
                              <PaginationLink isActive>
                                {mauPage}
                              </PaginationLink>
                            </PaginationItem>
                            <PaginationItem>
                              <PaginationNext onClick={handleMauNext} />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-slate-500">Không có dữ liệu</div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AccessBehaviorCard;
