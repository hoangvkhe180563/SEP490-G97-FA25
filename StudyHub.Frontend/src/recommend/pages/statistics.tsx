import React from "react";
import StatsQuestions from "../components/StatsQuestions";
import StatsUsage from "../components/StatsUsage";
import StatsSubjects from "../components/StatsSubjects";
import StatsTokens from "../components/StatsTokens";

const RecommendStatistics: React.FC = () => {
  return (
    <div className="p-6 space-y-6 max-h-screen min-h-screen overflow-auto scrollbar-x-hide">
      <h1 className="text-2xl font-semibold">Bảng thống kê AI / LLM</h1>

      <div className="space-y-6">
        <div className="w-full">
          <StatsQuestions />
        </div>

        <div className="w-full">
          <StatsUsage />
        </div>

        <div className="w-full">
          <StatsSubjects />
        </div>

        <div className="w-full">
          <StatsTokens />
        </div>
      </div>
    </div>
  );
};

export default RecommendStatistics;
