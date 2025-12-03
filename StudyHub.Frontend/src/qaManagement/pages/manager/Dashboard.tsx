import React from "react";
import QaOverview from "../../components/QaOverview";
import QaTopTeachers from "../../components/QaTopTeachers";
import QaTopStudents from "../../components/QaTopStudents";
import QaTopSubjects from "../../components/QaTopSubjects";

const ManagerDashboard: React.FC = () => {
  return (
    <div className="p-4 space-y-6 max-h-screen overflow-auto">
      <h1 className="text-3xl font-bold">Thống kê hỏi đáp</h1>

      <div className="space-y-6">
        <section className="w-full">
          <QaOverview />
        </section>

        <section className="w-full">
          <QaTopTeachers />
        </section>

        <section className="w-full">
          <QaTopStudents />
        </section>

        <section className="w-full">
          <QaTopSubjects />
        </section>
      </div>
    </div>
  );
};

export default ManagerDashboard;
