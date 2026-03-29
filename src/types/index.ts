export interface Image {
  id: number;
  user_action_id: number;
  storage_path: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  created_at: string;
  publicUrl?: string;
}

export interface UserAction {
  id: number;
  content: string;
  category: 'Tasks' | 'Habits';
  created_at: string;
  images: Image[];
}
