import React from "react";
import LectureResources from "../../components/LectureResources";
import LectureDiscussion from "../../components/LectureDiscussion";
import LectureNextUp from "../../components/LectureNextUp";
import { Button } from "@/common/components/ui/button";
import LectureFilters from "@/courseManagement/components/LectureFilters";

const LecturePlayer: React.FC = () => {
  return (
    <div className="w-full bg-white">
      <div className="max-w-screen-xl mx-auto">
        <div className="grid grid-cols-12 gap-6">
          <aside className="col-span-12 lg:col-span-3">
            <LectureFilters />
          </aside>

          <main className="col-span-12 lg:col-span-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-sm text-gray-500 mb-2">
                  My Courses / Web Development / JavaScript Fundamentals
                </div>
                <div className="text-lg font-medium">Matrix Operations</div>
                <div className="text-sm text-gray-500 mt-1">
                  18:45 minutes • Dr. Sarah Johnson • Updated Jan 15, 2025
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button className="border rounded px-3 py-1 text-sm">
                  Save
                </button>
                <button className="border rounded px-3 py-1 text-sm">
                  Share
                </button>
              </div>
            </div>

            <div className="bg-black h-[420px] rounded mb-4 flex items-center justify-center text-white">
              <div className="text-3xl">▶</div>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <Button className="bg-black text-white">Play</Button>
              <Button variant="outline">Download</Button>
              <Button variant="outline">Bookmark</Button>
            </div>

            <div className="bg-white border rounded p-4">
              <h4 className="font-medium mb-2">Lecture Transcript</h4>
              <div className="max-h-48 overflow-auto text-sm text-gray-700">
                <p>
                  In this comprehensive lecture, you'll learn the fundamental
                  concepts of HTML (HyperText Markup Language), the backbone of
                  web development. We'll cover the basic structure of HTML
                  documents, essential tags, and how to create your first
                  webpage from scratch.
                </p>
                <p className="mt-2">(transcript repeated for demo)</p>
              </div>
            </div>
          </main>

          <aside className="col-span-12 lg:col-span-3 space-y-4">
            <LectureResources />
            <LectureDiscussion />
            <LectureNextUp />
          </aside>
        </div>
      </div>
    </div>
  );
};

export default LecturePlayer;
