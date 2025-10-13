import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/common/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
import { ArrowLeft, Play, Download, Bookmark } from "lucide-react";

const LectureDetails: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 overflow-auto bg-white">
      <div className="max-w-[1100px] mx-auto px-6 py-6">
        <div className="text-sm text-[#525252] mb-3">Courses / Lecture</div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center border border-[#E5E5E5] rounded-lg hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4 text-[#525252]" />
            </button>

            <div>
              <h1 className="text-2xl font-normal text-[#171717]">
                HTML Fundamentals
              </h1>
              <p className="text-sm text-[#525252]">
                45 minutes • 124 students • Updated Jan 15, 2025
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline">
              <Play className="w-4 h-4 mr-2" /> Play
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" /> Download
            </Button>
            <Button variant="outline">
              <Bookmark className="w-4 h-4 mr-2" /> Bookmark
            </Button>
          </div>
        </div>

        <div
          className="bg-black rounded-lg overflow-hidden"
          style={{ aspectRatio: "16/9" }}
        >
          <div className="w-full h-full flex items-center justify-center text-white">
            <div className="text-2xl">Video Player Placeholder</div>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <div className="w-3/4">
              <div className="h-3 bg-[#E5E5E5] rounded">
                <div
                  className="h-3 bg-[#171717] rounded"
                  style={{ width: "75%" }}
                />
              </div>
              <div className="text-xs text-[#8A8A8A] mt-2">
                75% completed (34 min remaining)
              </div>
            </div>
            <div className="text-sm text-[#8A8A8A]">Speed: 1x</div>
          </div>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Lecture Transcript</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-auto text-sm text-[#404040] leading-relaxed">
              <p>
                In this comprehensive lecture, you'll learn the fundamental
                concepts of HTML (HyperText Markup Language), the backbone of
                web development. We'll cover the basic structure of HTML
                documents, essential tags, and how to create your first webpage
                from scratch. In this comprehensive lecture, you'll learn the
                fundamental concepts of HTML (HyperText Markup Language), the
                backbone of web development. We'll cover the basic structure of
                HTML documents, essential tags, and how to create your first
                webpage from scratch.
              </p>

              <p className="mt-3">
                In this comprehensive lecture, you'll learn the fundamental
                concepts of HTML (HyperText Markup Language), the backbone of
                web development. We'll cover the basic structure of HTML
                documents, essential tags, and how to create your first webpage
                from scratch.
              </p>

              <p className="mt-3">
                In this comprehensive lecture, you'll learn the fundamental
                concepts of HTML (HyperText Markup Language), the backbone of
                web development. We'll cover the basic structure of HTML
                documents, essential tags, and how to create your first webpage
                from scratch.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LectureDetails;
