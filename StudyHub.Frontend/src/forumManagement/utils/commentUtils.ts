import { axiosInstance } from "@/lib/axios";

export const getPostIdFromComment = async (
  commentId: number
): Promise<number | null> => {
  try {
    const response = await axiosInstance.get(`/Forum/comments/${commentId}`);
    console.log("Comment response:", response.data);

    if (response.data?.success && response.data?.data) {
      const postId = response.data.data.postId || response.data.data.post_id;
      console.log("Extracted postId:", postId);
      return postId;
    }
    return null;
  } catch (error) {
    console.error("Error fetching comment:", error);
    return null;
  }
};
