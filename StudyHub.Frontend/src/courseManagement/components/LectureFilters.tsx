import React, { useState } from "react";

type Lesson = {
  id: string;
  title: string;
  duration?: string;
  active?: boolean;
};
type Chapter = { id: string; title: string; lessons: Lesson[] };

const chaptersData: Chapter[] = [
  {
    id: "ch1",
    title: "Chapter 1: Linear Algebra",
    lessons: [
      { id: "l1", title: "Introduction to Vectors", duration: "12:30" },
      { id: "l2", title: "Matrix Operations", duration: "18:45", active: true },
      { id: "l3", title: "Determinants", duration: "15:20" },
    ],
  },
  { id: "ch2", title: "Chapter 2: Calculus", lessons: [] },
  { id: "ch3", title: "Chapter 3: Statistics", lessons: [] },
];

const LectureFilters: React.FC = () => {
  const [openChapters, setOpenChapters] = useState<Record<string, boolean>>({
    ch1: true,
  });

  const toggleChapter = (id: string) => {
    setOpenChapters((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-md p-4 shadow-sm">
        <div className="text-sm font-medium">Advanced Mathematics</div>
        <div className="text-xs text-gray-500 mt-2">Progress: 65%</div>
        <div className="w-full bg-gray-100 h-2 rounded mt-3 overflow-hidden">
          <div className="bg-gray-700 h-2 w-2/3" />
        </div>
      </div>

      {chaptersData.map((ch) => {
        const isOpen = !!openChapters[ch.id];
        return (
          <div key={ch.id} className="bg-white rounded-md shadow-sm">
            <button
              aria-expanded={isOpen}
              onClick={() => toggleChapter(ch.id)}
              className="w-full text-left px-3 py-3 flex items-center justify-between"
            >
              <div className="text-sm font-medium">{ch.title}</div>
              <div className="text-gray-400">{isOpen ? "▾" : "▸"}</div>
            </button>

            {isOpen && ch.lessons.length > 0 && (
              <div className="p-3 space-y-2">
                {ch.lessons.map((l) => (
                  <div
                    key={l.id}
                    className={`flex items-center justify-between text-sm rounded p-2 ${
                      l.active ? "bg-gray-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                          l.active ? "bg-black text-white" : "bg-gray-100"
                        }`}
                      >
                        ●
                      </div>
                      <div className={`${l.active ? "font-medium" : ""}`}>
                        {l.title}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">{l.duration}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default LectureFilters;
