import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
import { Input } from "@/common/components/ui/input";
import { Textarea } from "@/common/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/common/components/ui/select";
import { Button } from "@/common/components/ui/button";
import { Label } from "@/common/components/ui/label";
import { ArrowLeft, Upload, Video } from "lucide-react";

const AddLecture: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  // keep a controlled local state for the lecture type so the Select component
  // can be controlled and we can sync changes to the URL without dropping
  // existing query params
  const initialType = searchParams.get("type") || "video";
  const [type, setTypeState] = React.useState<string>(initialType);

  // Keep local state in sync when the URL changes (e.g. navigation/back)
  React.useEffect(() => {
    const p = searchParams.get("type") || "video";
    if (p !== type) setTypeState(p);
  }, [searchParams, type]);

  const setType = (t: string) => {
    setTypeState(t);
    // preserve other existing query params
    const newParams = new URLSearchParams(searchParams);
    newParams.set("type", t);
    setSearchParams(newParams);
  };

  return (
    <div className="flex-1 overflow-auto bg-white">
      <div className="max-w-[1200px] mx-auto px-8 py-6">
        <div className="text-sm text-[#525252] mb-3">
          Lectures / Add Lecture
        </div>

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
                Add Lecture
              </h1>
              <p className="text-sm text-[#525252]">
                Modify lecture details and content
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline">Cancel</Button>
            <Button>Save Changes</Button>
          </div>
        </div>

        <Card>
          <CardContent>
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 lg:col-span-8 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <Label>Course Selection</Label>
                    <Select>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="c1">
                          Complete Web Development
                        </SelectItem>
                        <SelectItem value="c2">React Development</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <Label>Lecture Type</Label>
                    <Select value={type} onValueChange={(v) => setType(v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            type === "video" ? "Video Lecture" : "Document"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="video">Video Lecture</SelectItem>
                        <SelectItem value="document">Document</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Lecture Title</Label>
                  <Input placeholder="Enter lecture title" />
                </div>

                <div className="space-y-4">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Describe what students will learn in this lecture..."
                    rows={4}
                  />
                </div>

                {type === "video" ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <Label>Duration (minutes)</Label>
                      <Input placeholder="45" />
                    </div>
                    <div className="space-y-4">
                      <Label>Difficulty Level</Label>
                      <Select>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Beginner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">
                            Intermediate
                          </SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Pages</Label>
                      <Input placeholder="20" />
                    </div>
                    <div>
                      <Label>Difficulty Level</Label>
                      <Select>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Beginner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">
                            Intermediate
                          </SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div>
                  <Label>Upload Content</Label>
                  <div className="mt-2 border-2 border-dashed border-[#D4D4D4] rounded-lg h-[160px] flex flex-col items-center justify-center">
                    <Upload className="w-6 h-6 text-[#A3A3A3] mb-2" />
                    <p className="text-sm text-[#525252] mb-1">
                      Drop your files here or click to browse
                    </p>
                    <p className="text-xs text-[#737373] mb-3">
                      {type === "video"
                        ? "Supports: MP4 (Max 500MB)"
                        : "Supports: PDF, PPTX (Max 20MB)"}
                    </p>
                    <Button variant="outline">Browse Files</Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Tags</Label>
                  <Input placeholder="Add tags separated by commas" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <Label>Scheduled Date</Label>
                    <Input type="date" />
                  </div>
                  <div className="space-y-4">
                    <Label>Scheduled Time</Label>
                    <Input type="time" />
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <input id="immediate" type="checkbox" className="w-4 h-4" />
                    <label
                      htmlFor="immediate"
                      className="text-sm text-[#404040]"
                    >
                      Make this lecture available immediately
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input id="notify" type="checkbox" className="w-4 h-4" />
                    <label htmlFor="notify" className="text-sm text-[#404040]">
                      Send notification to enrolled students
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 mt-6">
                  <Button variant="outline">Save as Draft</Button>
                  <Button>Publish Lecture</Button>
                </div>
              </div>

              <aside className="col-span-12 lg:col-span-4">
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-28 bg-[#FAFAFA] rounded flex items-center justify-center text-sm text-[#666]">
                        <Video className="w-6 h-6 text-[#666]" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Options</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 text-sm text-[#404040]">
                        <div className="flex justify-between">
                          <span>Duration / Pages</span>
                          <span className="font-semibold">—</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Difficulty</span>
                          <span className="font-semibold">—</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </aside>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddLecture;
