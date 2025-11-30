import React from "react";
import type { CourseRecommendation } from "../interfaces/recommend";
import { Book, Clock, Star, Tag, CalendarDays, User } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useEnrollmentStore } from "@/courseManagement/stores/useEnrollmentStore";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import DOMPurify from "dompurify";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/common/components/ui/tooltip";
import { Button } from "@/common/components/ui/button";
import { formatDate } from "@/user/utils/dateUtils";

const Badge: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <span
    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${className}`}
  >
    {children}
  </span>
);

function translateDifficulty(val?: string) {
  if (!val) return "Không xác định";
  const v = String(val).toLowerCase();
  if (v.includes("beginner") || v.includes("easy") || v.includes("dễ"))
    return "Dễ";
  if (v.includes("intermediate") || v.includes("medium") || v.includes("trung"))
    return "Trung bình";
  if (v.includes("advanced") || v.includes("hard") || v.includes("khó"))
    return "Khó";
  return val;
}

function translateLength(val?: string) {
  if (!val) return "Không xác định";
  const v = String(val).toLowerCase();
  if (v.includes("short") || v.includes("ngắn")) return "Ngắn";
  if (v.includes("medium") || v.includes("trung")) return "Trung bình";
  if (v.includes("long") || v.includes("dài")) return "Dài";
  return val;
}

function difficultyBadgeClass(val?: string) {
  const v = String(val ?? "").toLowerCase();
  if (v.includes("beginner") || v.includes("easy") || v.includes("dễ"))
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
  if (v.includes("intermediate") || v.includes("medium") || v.includes("trung"))
    return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
  if (v.includes("advanced") || v.includes("hard") || v.includes("khó"))
    return "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300";
  return "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200";
}

function lengthBadgeClass(val?: string) {
  const v = String(val ?? "").toLowerCase();
  if (v.includes("short") || v.includes("ngắn"))
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
  if (v.includes("medium") || v.includes("trung"))
    return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
  if (v.includes("long") || v.includes("dài"))
    return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300";
  return "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200";
}

const CourseCard: React.FC<{ course: CourseRecommendation }> = ({ course }) => {
  const navigate = useNavigate();

  const formattedPrice =
    course.price && course.price > 0
      ? new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(course.price)
      : "Miễn phí";

  // Inline Register button reusing enrollment logic from CourseCard
  const RegisterButton: React.FC<{ course: CourseRecommendation }> = ({
    course,
  }) => {
    const authUser = useAuthStore((s) => s.user);
    const fetchEnrollmentsByUser = useEnrollmentStore(
      (s: any) => s.fetchByUser
    );
    const enroll = useEnrollmentStore((s: any) => s.enroll);
    const consumeWallet = useEnrollmentStore((s: any) => s.consumeWallet);
    const enrollment = useEnrollmentStore((s: any) =>
      s.getEnrollmentForCourse(course.id)
    );

    return (
      <div className="w-1/2">
        {enrollment ? (
          <Button
            className="w-full bg-sky-600 text-white hover:bg-sky-700 rounded-lg py-2 text-sm shadow-md transition-all"
            onClick={(e) => {
              e.stopPropagation();
              try {
                navigate(`/course/student/courses/${course.id}`);
              } catch {
                /* ignore */
              }
            }}
          >
            Vào học
          </Button>
        ) : (
          <Button
            className="w-full bg-black text-white hover:bg-gray-900 rounded-lg py-2 text-sm shadow-md transition-all"
            onClick={async (e) => {
              e.stopPropagation();
              try {
                if (!authUser?.id) {
                  navigate(`/auth/login`);
                  return;
                }

                const priceNum = Number(course.price ?? 0);
                // If free, enroll directly
                if (!priceNum || priceNum <= 0) {
                  try {
                    await enroll({
                      appUserId: String(authUser.id),
                      courseId: course.id,
                    });
                    await fetchEnrollmentsByUser(String(authUser.id));
                  } catch (err) {
                    // ignore enroll error for now
                  }
                  return;
                }

                // if user has wallet balance, try to use it
                const wallet = Number(authUser?.wallet ?? 0);
                if (wallet >= priceNum) {
                  try {
                    await enroll({
                      appUserId: String(authUser.id),
                      courseId: course.id,
                    });
                    await fetchEnrollmentsByUser(String(authUser.id));
                  } catch (err) {
                    // fallback to checkout
                    try {
                      const params = new URLSearchParams({
                        courseId: String(course.id),
                        price: String(priceNum),
                        name: String(course.title ?? course.name ?? ""),
                        userId: String(authUser.id),
                      });
                      navigate(
                        `/payment/student/checkout?${params.toString()}`
                      );
                    } catch (e) {
                      /* ignore */
                    }
                  }
                  return;
                }

                // try consume wallet (partial)
                try {
                  const resp = await consumeWallet({
                    appUserId: String(authUser.id),
                    courseId: course.id,
                  });
                  if (resp?.created) {
                    await fetchEnrollmentsByUser(String(authUser.id));
                    return;
                  }
                  const info = resp?.info ?? resp;
                  const remaining = Number(
                    info?.remaining ?? Math.max(0, priceNum - wallet)
                  );
                  const params = new URLSearchParams({
                    courseId: String(course.id),
                    price: String(remaining),
                    name: String(course.title ?? course.name ?? ""),
                    userId: String(authUser.id),
                  });
                  navigate(`/payment/student/checkout?${params.toString()}`);
                } catch (err) {
                  const remaining = Math.max(0, priceNum - wallet);
                  const params = new URLSearchParams({
                    courseId: String(course.id),
                    price: String(remaining),
                    name: String(course.title ?? course.name ?? ""),
                    userId: String(authUser.id),
                  });
                  navigate(`/payment/student/checkout?${params.toString()}`);
                }
              } catch {
                /* ignore */
              }
            }}
          >
            Đăng ký
          </Button>
        )}
      </div>
    );
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="group relative" tabIndex={0}>
            <article
              onClick={() => {
                try {
                  navigate(`/course/student/courses/${course.id}`);
                } catch {
                  /* ignore */
                }
              }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transform hover:-translate-y-1 overflow-hidden"
            >
              {/* Top image/banner */}
              {course.imageUrl ? (
                <img
                  src={course.imageUrl}
                  alt={course.title ?? "course"}
                  className="w-full h-44 object-cover"
                />
              ) : (
                <div className="w-full h-44 bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white">
                  <Book size={48} />
                </div>
              )}

              <div className="p-5">
                <h3 className="text-lg font-semibold leading-tight text-slate-900 dark:text-slate-100">
                  {course.title ?? course.name}
                </h3>
                <div className="flex items-center justify-between mt-2 gap-3">
                  <div className="flex items-center gap-4">
                    <div className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="truncate max-w-[160px]">
                        {course.createdByName ?? "Giảng viên"}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end gap-2">
                    <div className="text-xs text-slate-500">
                      {course.subject ?? course.subjectName} • Lớp{" "}
                      {course.grade}
                    </div>
                    <div className="inline-flex items-center gap-2">
                      <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                        {formattedPrice}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <Badge className={difficultyBadgeClass(course.difficulty)}>
                    <Star size={14} /> {translateDifficulty(course.difficulty)}
                  </Badge>
                  <Badge className={lengthBadgeClass(course.length)}>
                    <Clock size={14} /> {translateLength(course.length)}
                  </Badge>
                  <Badge
                    className={lengthBadgeClass(course.grade?.toLocaleString())}
                  >
                    <Tag size={14} /> Lớp {course.grade}
                  </Badge>
                </div>
                {/* Course date range */}
                <div className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-4">
                  <CalendarDays className="w-4 h-4 text-slate-400" />
                  <span>
                    Bắt đầu: {course.startAt ? formatDate(course.startAt) : "—"}{" "}
                    - {course.endAt ? formatDate(course.endAt) : "—"}
                  </span>
                </div>

                <div className="mt-5 flex items-center gap-3">
                  <Link
                    to={`/course/student/courses/${course.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="w-1/2"
                  >
                    <Button className="w-full">Chi tiết</Button>
                  </Link>
                  <RegisterButton course={course} />
                </div>
              </div>
            </article>
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-md p-4 text-sm sm:text-base leading-relaxed bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-lg"
        >
          <div className="font-semibold text-slate-900 dark:text-slate-100 text-base">
            {course.title ?? course.name}
          </div>
          {course.information && (
            <div
              className="mt-2 text-slate-700 dark:text-slate-300 text-sm sm:text-base"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(course.information),
              }}
            />
          )}
          <div className="mt-3 flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
            <span className="inline-flex items-center gap-2">
              <Badge className={lengthBadgeClass(course.length)}>
                <Clock size={14} /> {translateLength(course.length)}
              </Badge>
            </span>
            <span className="inline-flex items-center gap-2">
              <Badge className={difficultyBadgeClass(course.difficulty)}>
                <Star size={14} /> {translateDifficulty(course.difficulty)}
              </Badge>
            </span>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const RecommendationCourseList: React.FC<{
  courses?: CourseRecommendation[];
  improveSubjects?: string[]; // subjects suggested by LLM to improve
  size?: "small" | "large";
}> = ({ courses = [], improveSubjects = [], size = "large" }) => {
  return (
    <div className="space-y-8 mb-6">
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
          <div>
            <h2 className="text-2xl font-semibold">Gợi ý khóa học</h2>
            <div className="text-sm text-slate-500">
              {courses.length} kết quả
            </div>
          </div>

          {improveSubjects.length > 0 && (
            <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-3 py-2 rounded-full text-sm">
              <Tag size={16} />
              <div>
                Cần cải thiện:{" "}
                <strong className="ml-1">
                  {improveSubjects.slice(0, 3).join(", ")}
                  {improveSubjects.length > 3 ? "..." : ""}
                </strong>
              </div>
            </div>
          )}
        </div>
        {courses.length > 0 ? (
          <div
            className={`grid grid-cols-1 gap-6 ${
              size === "small" ? "sm:grid-cols-2" : "sm:grid-cols-3"
            }`}
          >
            {courses.map((c) => (
              <CourseCard key={String(c.id)} course={c} />
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-slate-500 dark:text-slate-300">
            Không tìm thấy khoá học phù hợp với bạn.
          </div>
        )}
      </section>
    </div>
  );
};

export default RecommendationCourseList;
