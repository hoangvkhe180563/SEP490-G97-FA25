import React, { useState } from "react";
import { useForumDashboardStore } from "../stores/useForumDashboardStore";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";

export const ViolationStatsCard: React.FC = () => {
  const { violationStats } = useForumDashboardStore();
  const [showViolators, setShowViolators] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showFlairs, setShowFlairs] = useState(false);
  const [showSubjects, setShowSubjects] = useState(false);

  if (!violationStats) return null;

  const sourceTypeColors: Record<string, string> = {
    auto: "#0ea5e9",
    report: "#f59e0b",
    manual: "#ef4444",
  };

  const sourceTypeData = violationStats.violationsBySourceType.map((item) => ({
    ...item,
    fill: sourceTypeColors[item.sourceType.toLowerCase()] || "#6b7280",
  }));

  return (
    <Card className="bg-white border-sky-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-sky-500" />
            Thống kê vi phạm
          </CardTitle>
          <div className="text-2xl font-bold text-sky-600">
            {violationStats.totalViolations}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 rounded-lg bg-sky-50 border border-sky-200">
            <div className="text-sm text-sky-600 font-medium">Điểm TB</div>
            <div className="text-2xl font-bold text-sky-700">
              {violationStats.averageViolationScore}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
            <div className="text-sm text-purple-600 font-medium">
              Tổng vi phạm
            </div>
            <div className="text-2xl font-bold text-purple-700">
              {violationStats.totalViolations}
            </div>
          </div>
        </div>

        <div className="h-64 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={violationStats.violationsByPeriod}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="period" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#ef4444"
                strokeWidth={2}
                name="Vi phạm"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {violationStats.violationsBySourceType.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold mb-2 text-sky-700">
              Vi phạm theo nguồn
            </h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sourceTypeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="sourceType" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Số lượng">
                    {sourceTypeData.map((entry, index) => (
                      <Bar
                        key={`bar-${index}`}
                        dataKey="count"
                        fill={entry.fill}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2 text-xs">
              <div className="flex items-center gap-1">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: "#0ea5e9" }}
                ></div>
                <span>Tự động</span>
              </div>
              <div className="flex items-center gap-1">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: "#f59e0b" }}
                ></div>
                <span>Tố cáo</span>
              </div>
              <div className="flex items-center gap-1">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: "#ef4444" }}
                ></div>
                <span>Thủ công</span>
              </div>
            </div>
          </div>
        )}

        {violationStats.violationsByRule &&
          violationStats.violationsByRule.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setShowRules(!showRules)}
                className="w-full flex items-center justify-between p-2 rounded bg-orange-50 border border-orange-200 hover:bg-orange-100 transition-colors"
              >
                <h4 className="text-sm font-semibold text-orange-700">
                  Vi phạm theo quy tắc ({violationStats.violationsByRule.length}
                  )
                </h4>
                {showRules ? (
                  <ChevronUp className="h-4 w-4 text-orange-600" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-orange-600" />
                )}
              </button>
              {showRules && (
                <div className="space-y-2 mt-2">
                  {violationStats.violationsByRule.map((rule, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded bg-orange-50 border border-orange-100"
                    >
                      <span className="text-sm font-medium">
                        {rule.ruleName}
                      </span>
                      <span className="text-sm font-bold text-orange-600">
                        {rule.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        {violationStats.violationsByFlair &&
          violationStats.violationsByFlair.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setShowFlairs(!showFlairs)}
                className="w-full flex items-center justify-between p-2 rounded bg-sky-50 border border-sky-200 hover:bg-sky-100 transition-colors"
              >
                <h4 className="text-sm font-semibold text-sky-700">
                  Vi phạm theo flair ({violationStats.violationsByFlair.length})
                </h4>
                {showFlairs ? (
                  <ChevronUp className="h-4 w-4 text-sky-600" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-sky-600" />
                )}
              </button>
              {showFlairs && (
                <div className="space-y-2 mt-2">
                  {violationStats.violationsByFlair.map((flair, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded bg-sky-50 border border-sky-100"
                    >
                      <span className="text-sm font-medium">
                        {flair.flairName}
                      </span>
                      <span className="text-sm font-bold text-sky-600">
                        {flair.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        {violationStats.violationsBySubject &&
          violationStats.violationsBySubject.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setShowSubjects(!showSubjects)}
                className="w-full flex items-center justify-between p-2 rounded bg-purple-50 border border-purple-200 hover:bg-purple-100 transition-colors"
              >
                <h4 className="text-sm font-semibold text-purple-700">
                  Vi phạm theo môn học (
                  {violationStats.violationsBySubject.length})
                </h4>
                {showSubjects ? (
                  <ChevronUp className="h-4 w-4 text-purple-600" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-purple-600" />
                )}
              </button>
              {showSubjects && (
                <div className="space-y-2 mt-2">
                  {violationStats.violationsBySubject.map((subject, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded bg-purple-50 border border-purple-100"
                    >
                      <span className="text-sm font-medium">
                        {subject.subjectName}
                      </span>
                      <span className="text-sm font-bold text-purple-600">
                        {subject.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        {violationStats.topViolators.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setShowViolators(!showViolators)}
              className="w-full flex items-center justify-between p-2 rounded bg-red-50 border border-red-200 hover:bg-red-100 transition-colors"
            >
              <h4 className="text-sm font-semibold text-red-700">
                Top vi phạm nhiều ({violationStats.topViolators.length})
              </h4>
              {showViolators ? (
                <ChevronUp className="h-4 w-4 text-red-600" />
              ) : (
                <ChevronDown className="h-4 w-4 text-red-600" />
              )}
            </button>
            {showViolators && (
              <div className="space-y-2 mt-2">
                {violationStats.topViolators
                  .slice(0, 5)
                  .map((violator, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded bg-red-50 border border-red-100"
                    >
                      <span className="text-sm font-medium">
                        {violator.fullname || violator.username}
                      </span>
                      <span className="text-sm font-bold text-red-600">
                        {violator.count}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
