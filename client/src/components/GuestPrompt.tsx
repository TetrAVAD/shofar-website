import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, BookOpen } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface GuestPromptProps {
  title?: string;
  description?: string;
}

export function GuestPrompt({
  title = "쇼파르 전문가 교육에 오신 것을 환영합니다",
  description = "120명 나팔단을 위한 전문가 교육 과정입니다. 로그인하여 학습을 시작하세요."
}: GuestPromptProps) {
  const { signInWithGoogle } = useAuth();

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-primary/20 shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-display">{title}</CardTitle>
          <CardDescription className="text-base">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleGoogleLogin}
            className="w-full gap-3 h-12 text-base"
            variant="default"
          >
            <Mail className="w-5 h-5" />
            Gmail 계정으로 시작하기
          </Button>

          <p className="text-xs text-center text-muted-foreground mt-4">
            로그인하면 학습 진도가 저장되고, 모든 교육 콘텐츠에 접근할 수 있습니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

