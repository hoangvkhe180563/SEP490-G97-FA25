import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
import { useLectureStore } from "@/courseManagement/stores/useLectureStore";

const LectureResources: React.FC = () => {
  const selectedLesson = useLectureStore((s: any) => s.selectedLesson);
  const getLessonResource = useLectureStore((s: any) => s.getLessonResource);
  const [resources, setResources] = useState<{ id: number; url: string }[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!selectedLesson) {
          setResources([]);
          return;
        }

        const resourceId =
          (selectedLesson as any).ResourceId ??
          (selectedLesson as any).resourceId ??
          null;
        if (resourceId && getLessonResource) {
          try {
            const res = await getLessonResource(Number(resourceId));
            if (!mounted) return;
            if (res && (res.id || res.url)) {
              setResources([res as { id: number; url: string }]);
              return;
            }
          } catch (err) {
            console.warn("LectureResources: getLessonResource threw", err);
          }
        }

        // fallback to inline arrays/fields
        const inline =
          (selectedLesson as any)?.resources ||
          (selectedLesson as any)?.attachments ||
          (selectedLesson as any)?.documents ||
          null;

        if (!inline) {
          setResources([]);
        } else if (Array.isArray(inline)) {
          const mapped = inline
            .map((r: any) => {
              if (!r) return null;
              if (r.id && (r.url || r.path || r.fileUrl || r.downloadUrl))
                return {
                  id: r.id,
                  url: r.url ?? r.path ?? r.fileUrl ?? r.downloadUrl,
                };
              if (r.url) return { id: r.id ?? 0, url: r.url };
              return null;
            })
            .filter(Boolean) as { id: number; url: string }[];
          setResources(mapped);
        } else {
          const r = inline;
          if (r && (r.id || r.url || r.path)) {
            const obj = {
              id: r.id ?? 0,
              url: r.url ?? r.path ?? r.fileUrl ?? r.downloadUrl,
            };
            setResources([obj]);
          } else {
            setResources([]);
          }
        }
      } catch (e) {
        console.error("LectureResources: failed to load resources", e);
        setResources([]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [selectedLesson, getLessonResource]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Tài nguyên</CardTitle>
        </CardHeader>
        <CardContent>
          {resources.length ? (
            <ul className="space-y-2 text-sm">
              {resources.map((r) => (
                <li key={r.id} className="flex items-center gap-2">
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline truncate"
                  >
                    {r.url.split("/").pop()}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-gray-600">
              Không có tài nguyên nào đính kèm cho bài giảng này.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LectureResources;
