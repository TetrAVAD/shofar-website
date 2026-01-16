export interface Post {
  id: number;
  title: string;
  content: string;
  authorId: number;
  authorName: string | null;
  category: 'notice' | 'free';
  createdAt: Date;
  updatedAt: Date;
  viewCount: number;
}

export interface Comment {
  id: number;
  postId: number;
  content: string;
  authorId: number;
  authorName: string | null;
  createdAt: Date;
}
