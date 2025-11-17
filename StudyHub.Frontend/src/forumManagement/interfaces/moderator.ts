// StudyHub.Frontend/src/forumManagement/interfaces/moderator.ts
export interface ViolationRecord {
  id: number;
  user_id: string;
  user_name: string;
  school_id: number;
  post_id?: number;
  comment_id?: number;
  matched_rule_id: number;
  rule_name: string;
  pattern?: string;
  violation_score: number;
  source_type: "auto" | "report" | "manual";
  reported_by?: string;
  reporter_name?: string;
  created_at: string;
}

export interface UserAppeal {
  id: number;
  user_id: string;
  user_name: string;
  school_id: number;
  reason: string;
  status: boolean | null;
  created_at: string;
  updated_at?: string;
  updated_by?: string;
}

export interface UserForumStatus {
  user_id: string;
  user_name: string;
  school_id: number;
  total_violation_score: number;
  is_mute: boolean;
  mute_until?: string;
  created_at: string;
  updated_at?: string;
}

export interface FlairPattern {
  id: number;
  rule_id: number;
  pattern: string;
  is_active: boolean;
  created_at: string;
  created_by: string;
  updated_at?: string;
}

export interface FlairRule {
  id: number;
  school_id: number;
  name: string;
  rule_type: string;
  severity: string;
  violation_score: number;
  description?: string;
  is_active: boolean;
  patterns: FlairPattern[];
  created_at: string;
  created_by: string;
  updated_at?: string;
}

export interface ForumFlair {
  id: number;
  school_id: number;
  name: string;
  description?: string;
  is_protected: boolean;
  status: boolean;
  created_at: string;
  created_by: string;
  updated_at?: string;
}

export interface Report {
  id: number;
  user_id: string;
  user_name: string;
  post_id?: number;
  post_title?: string;
  comment_id?: number;
  comment_content?: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
}
