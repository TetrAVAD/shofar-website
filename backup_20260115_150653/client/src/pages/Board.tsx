import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import PostList from "@/components/board/PostList";
import PostEditor from "@/components/board/PostEditor";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function Board() {
  const [match, params] = useRoute("/board/:category");
  const [detailMatch, detailParams] = useRoute("/board/:category/:id");
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();

  const category = (params?.category || detailParams?.category) as 'notice' | 'free';
  const postId = detailParams?.id ? parseInt(detailParams.id) : null;

  const [isWriting, setIsWriting] = useState(false);

  // Fetch posts list
  const { data: posts, isLoading: postsLoading, refetch: refetchPosts } = trpc.posts.list.useQuery(
    { category },
    { enabled: !!category && !postId }
  );

  // Fetch single post
  const { data: currentPost, isLoading: postLoading } = trpc.posts.get.useQuery(
    { id: postId! },
    { enabled: !!postId }
  );

  // Create post mutation
  const createPostMutation = trpc.posts.create.useMutation({
    onSuccess: () => {
      toast.success("게시글이 작성되었습니다.");
      setIsWriting(false);
      refetchPosts();
    },
    onError: (error) => {
      toast.error(error.message || "게시글 작성에 실패했습니다.");
    },
  });

  // Delete post mutation
  const deletePostMutation = trpc.posts.delete.useMutation({
    onSuccess: () => {
      toast.success("게시글이 삭제되었습니다.");
      setLocation(`/board/${category}`);
    },
    onError: (error) => {
      toast.error(error.message || "게시글 삭제에 실패했습니다.");
    },
  });

  const handleCreatePost = async (title: string, content: string) => {
    createPostMutation.mutate({ title, content, category });
  };

  const handleDeletePost = async (id: number) => {
    if (confirm("정말 삭제하시겠습니까?")) {
      deletePostMutation.mutate({ id });
    }
  };

  const boardTitle = category === 'notice' ? '공지사항' : '자유게시판';
  const boardDescription = category === 'notice'
    ? '쇼파르 아카데미의 주요 소식을 전해드립니다.'
    : '단원들과 자유롭게 소통하는 공간입니다.';

  // Render Post Detail
  if (postId && currentPost) {
    const canDelete = user && (String(currentPost.authorId) === user.id || user.role === 'admin');

    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setLocation(`/board/${category}`)} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> 목록으로 돌아가기
        </Button>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="mb-6 border-b pb-4">
            <h1 className="text-2xl font-bold mb-2">{currentPost.title}</h1>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{currentPost.authorName || '익명'}</span>
                <span>{new Date(currentPost.createdAt).toLocaleDateString()}</span>
                <span>조회 {currentPost.viewCount}</span>
              </div>
              {canDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeletePost(currentPost.id)}
                  disabled={deletePostMutation.isPending}
                >
                  삭제
                </Button>
              )}
            </div>
          </div>
          <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
            {currentPost.content}
          </div>
        </div>
      </div>
    );
  }

  // Loading state for post detail
  if (postId && postLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  // Render Write Mode
  if (isWriting) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold font-display">{boardTitle} 글쓰기</h1>
        </div>
        <PostEditor
          onSubmit={handleCreatePost}
          onCancel={() => setIsWriting(false)}
          loading={createPostMutation.isPending}
        />
      </div>
    );
  }

  // Check if user can write
  const canWrite = isAuthenticated && (category === 'free' || user?.role === 'admin');

  // Render List Mode
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display">{boardTitle}</h1>
          <p className="text-muted-foreground mt-2">{boardDescription}</p>
        </div>
        {canWrite && (
          <Button onClick={() => setIsWriting(true)} className="gap-2">
            <Plus className="h-4 w-4" /> 글쓰기
          </Button>
        )}
      </div>

      <PostList
        posts={posts || []}
        category={category}
        loading={postsLoading}
      />
    </div>
  );
}
