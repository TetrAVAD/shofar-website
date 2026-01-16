import { Link } from "wouter";
import { Post } from "@/types/board";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Eye } from "lucide-react";
import { format } from "date-fns";

interface PostListProps {
  posts: Post[];
  category: 'notice' | 'free';
  loading: boolean;
}

export default function PostList({ posts, category, loading }: PostListProps) {
  if (loading) {
    return <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-24 w-full animate-pulse rounded-lg bg-muted" />
      ))}
    </div>;
  }

  if (posts.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
        <p className="text-muted-foreground">게시글이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Link key={post.id} href={`/board/${category}/${post.id}`}>
          <Card className="cursor-pointer transition-colors hover:bg-muted/50">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium line-clamp-1">
                  {category === 'notice' && <Badge variant="secondary" className="mr-2">공지</Badge>}
                  {post.title}
                </CardTitle>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {format(new Date(post.createdAt), 'yyyy.MM.dd')}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>{post.authorName || '익명'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  <span>{post.viewCount}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
