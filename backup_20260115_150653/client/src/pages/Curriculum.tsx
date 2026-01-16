import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import { BookOpen, Clock, CheckCircle2, ArrowRight, Star, Target, Award } from "lucide-react";

export default function Curriculum() {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();

  // Get progress for all modules
  const { data: allProgress } = trpc.progress.getAll.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: overallProgress } = trpc.progress.getOverallProgress.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const modules = [
    {
      id: 1,
      title: t("module1.title"),
      desc: t("module1.desc"),
      duration: t("module1.duration"),
      level: t("module1.level"),
      topics: ["쇼파르의 정의와 어원", "성경적 기원과 역사", "현대적 의미와 사용"],
    },
    {
      id: 2,
      title: t("module2.title"),
      desc: t("module2.desc"),
      duration: t("module2.duration"),
      level: t("module2.level"),
      topics: ["숫양 뿔 (Ram's Horn)", "쿠두 뿔 (Kudu Horn)", "재질과 음향 특성"],
    },
    {
      id: 3,
      title: t("module3.title"),
      desc: t("module3.desc"),
      duration: t("module3.duration"),
      level: t("module3.level"),
      topics: ["앙부슈르 기초", "호흡법과 자세", "첫 소리 내기"],
    },
    {
      id: 4,
      title: t("module4.title"),
      desc: t("module4.desc"),
      duration: t("module4.duration"),
      level: t("module4.level"),
      topics: ["테키아 (Tekiah)", "셰바림 (Shevarim)", "테루아 (Teruah)", "테키아 게돌라"],
    },
    {
      id: 5,
      title: t("module5.title"),
      desc: t("module5.desc"),
      duration: t("module5.duration"),
      level: t("module5.level"),
      topics: ["음역 확장", "앙상블 연주", "즉흥 연주 기법"],
    },
    {
      id: 6,
      title: t("module6.title"),
      desc: t("module6.desc"),
      duration: t("module6.duration"),
      level: t("module6.level"),
      topics: ["영적 준비", "예배 인도", "나팔단 리더십"],
    },
  ];

  const getModuleProgress = (moduleId: number) => {
    if (!allProgress) return { completed: 0, total: 3 };
    const progress = allProgress.find((p) => p.moduleId === moduleId);
    if (!progress?.completedCheckpoints) return { completed: 0, total: 3 };
    const completed = progress.completedCheckpoints.split(",").filter(Boolean).length;
    return { completed, total: 3 };
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">
            <BookOpen className="h-3 w-3 mr-1" />
            전체 커리큘럼
          </Badge>
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          쇼파르 전문가 교육 과정
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          6개 모듈로 구성된 체계적인 교육 과정을 통해 쇼파르 연주의 기초부터 고급 기법,
          영적 리더십까지 종합적으로 학습합니다.
        </p>
      </div>

      {/* Overall Progress (for logged in users) */}
      {isAuthenticated && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">나의 학습 진도</h3>
                  <p className="text-sm text-muted-foreground">전체 과정 완료율</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold text-primary">{overallProgress ?? 0}%</span>
              </div>
            </div>
            <Progress value={overallProgress ?? 0} className="h-3" />
          </CardContent>
        </Card>
      )}

      {/* Course Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">6개</p>
              <p className="text-sm text-muted-foreground">학습 모듈</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">약 6주</p>
              <p className="text-sm text-muted-foreground">예상 학습 기간</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
              <Award className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">전문가</p>
              <p className="text-sm text-muted-foreground">수료 후 자격</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module List */}
      <div className="space-y-4">
        <h2 className="font-display text-2xl font-bold">모듈별 상세 내용</h2>

        <div className="space-y-4">
          {modules.map((module, index) => {
            const progress = getModuleProgress(module.id);
            const progressPercent = Math.round((progress.completed / progress.total) * 100);

            return (
              <Card key={module.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-16 bg-primary/10 flex items-center justify-center p-4 md:p-0">
                    <span className="text-2xl font-bold text-primary">{module.id}</span>
                  </div>
                  <div className="flex-1 p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-display text-xl font-bold">{module.title}</h3>
                          <Badge variant="outline" className="text-xs">
                            {module.level}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {module.duration}
                          </span>
                        </div>
                        <p className="text-muted-foreground">{module.desc}</p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {module.topics.map((topic, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-3 min-w-[140px]">
                        {isAuthenticated && (
                          <div className="w-full">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-muted-foreground">진도</span>
                              <span className="font-medium">{progress.completed}/{progress.total}</span>
                            </div>
                            <Progress value={progressPercent} className="h-2" />
                          </div>
                        )}
                        <Link href={`/module/${module.id}`}>
                          <Button size="sm" className="gap-1">
                            학습하기 <ArrowRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Learning Path */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            추천 학습 경로
          </CardTitle>
          <CardDescription>
            최적의 학습 효과를 위해 아래 순서대로 진행하시는 것을 권장합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            {modules.map((module, index) => (
              <div key={module.id} className="flex items-center gap-2">
                <Link href={`/module/${module.id}`}>
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    Module {module.id}
                  </Badge>
                </Link>
                {index < modules.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
