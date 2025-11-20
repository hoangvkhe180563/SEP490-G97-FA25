// src/forumManagement/components/ForumTabs.tsx
import { Tabs, TabsList, TabsTrigger } from "@/common/components/ui/tabs";

interface ForumTabsProps {
  activeTab: "all" | "my-posts";
  onTabChange: (tab: "all" | "my-posts") => void;
}

export const ForumTabs = ({ activeTab, onTabChange }: ForumTabsProps) => {
  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => onTabChange(value as "all" | "my-posts")}
      className="mb-3 w-full"
    >
      <TabsList className="grid w-full grid-cols-2 max-w-none rounded-lg overflow-hidden">
        <TabsTrigger value="all" className="text-base py-1">
          Tất cả bài viết
        </TabsTrigger>
        <TabsTrigger value="my-posts" className="text-base py-1">
          Bài viết của tôi
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};
