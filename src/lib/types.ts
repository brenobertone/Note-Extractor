
export type Note = {
  id: string;
  uid?: string;
  title: string | null;
  markdownContent: string | null;
  status: "processing" | "completed" | "error";
  error?: string;
  uploadTimestamp: Date;
  createdAt?: string | null;
  previewUrl?: string;
  imageUrl?: string;
  imagePath?: string;
};
