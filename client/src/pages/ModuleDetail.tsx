import { useParams, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ArrowRight, CheckCircle2, PlayCircle, FileText, Download, Volume2, PauseCircle, Check } from "lucide-react";
import { Streamdown } from "streamdown";
import { useState, useEffect, useRef, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

// Audio Player Component
const AudioPlayer = ({ src, label }: { src: string; label: string }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { t } = useLanguage();

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const handleEnded = () => setIsPlaying(false);
      audio.addEventListener('ended', handleEnded);
      return () => audio.removeEventListener('ended', handleEnded);
    }
  }, []);

  return (
    <div className="my-4 flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3 transition-colors hover:bg-primary/10">
      <button
        onClick={togglePlay}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform hover:scale-105 active:scale-95"
      >
        {isPlaying ? <PauseCircle className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </button>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">{isPlaying ? "Playing..." : t("detail.audio.play")}</span>
      </div>
      <audio ref={audioRef} src={src} />
    </div>
  );
};

// YouTube Player Component
const YouTubePlayer = ({ id, title }: { id: string; title?: string }) => {
  return (
    <div className="my-6">
      {title && <p className="text-sm font-medium text-muted-foreground mb-2">🎬 {title}</p>}
      <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-lg border border-border">
        <iframe
          src={`https://www.youtube.com/embed/${id}`}
          title={title || "YouTube video"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    </div>
  );
};
export default function ModuleDetail() {
  const { id, section } = useParams<{ id: string; section?: string }>();
  const [, setLocation] = useLocation();
  const { t, language } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("content");
  const moduleId = parseInt(id || "1");
  const currentSection = parseInt(section || "1") - 1; // 0-indexed

  // Fetch module progress for logged in users
  const { data: moduleProgress, refetch: refetchProgress } = trpc.progress.getModule.useQuery(
    { moduleId },
    { enabled: isAuthenticated }
  );

  // Update progress mutation
  const updateProgressMutation = trpc.progress.updateModule.useMutation({
    onSuccess: () => {
      refetchProgress();
    },
  });

  // Parse completed checkpoints from stored string
  const completedCheckpoints = useMemo(() => {
    if (!moduleProgress?.completedCheckpoints) return new Set<number>();
    return new Set(moduleProgress.completedCheckpoints.split(',').filter(Boolean).map(Number));
  }, [moduleProgress]);

  // Toggle checkpoint completion
  const toggleCheckpoint = (index: number) => {
    if (!isAuthenticated) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    const newCompleted = new Set(completedCheckpoints);
    if (newCompleted.has(index)) {
      newCompleted.delete(index);
    } else {
      newCompleted.add(index);
    }

    const completedStr = Array.from(newCompleted).join(',');
    const isCompleted = newCompleted.size >= 3; // Assume 3 checkpoints per module

    updateProgressMutation.mutate({
      moduleId,
      completedCheckpoints: completedStr,
      isCompleted,
    });
  };

  // Handle start learning button
  const handleStartLearning = () => {
    if (!isAuthenticated) {
      toast.info("학습 진도를 저장하려면 로그인이 필요합니다.");
      setLocation("/auth");
      return;
    }
    setActiveTab("content");
    toast.success("학습을 시작합니다!");
  };

  // Scroll to top on mount or section change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id, section]);

  // Parse content into sections based on ## headers
  const parseContentToSections = (content: string) => {
    // Split by ## X.X pattern
    const rawSections = content.split(/(?=^## \d+\.\d+)/gm);
    // Filter out empty sections and sections that don't start with ## X.X pattern
    const sections = rawSections.filter(s => {
      const trimmed = s.trim();
      return trimmed && /^## \d+\.\d+/.test(trimmed);
    });
    return sections;
  };

  // Dynamic content based on language
  const getModuleContent = (moduleId: string, lang: string) => {
    const title = t(`module${moduleId}.title`);
    const subtitle = t(`module${moduleId}.desc`);

    if (lang === 'ko') {
      return {
        title,
        subtitle,
        content: getKoreanContent(moduleId),
        checkpoints: getKoreanCheckpoints(moduleId)
      };
    } else if (lang === 'en') {
      return {
        title,
        subtitle,
        content: getEnglishContent(moduleId, title, subtitle),
        checkpoints: getEnglishCheckpoints(moduleId)
      };
    } else {
      return {
        title,
        subtitle,
        content: getChineseContent(moduleId, title, subtitle),
        checkpoints: getChineseCheckpoints(moduleId)
      };
    }
  };

  const moduleData = getModuleContent(id || "1", language);

  // Parse sections
  const sections = useMemo(() => parseContentToSections(moduleData.content), [moduleData.content]);
  const totalSections = sections.length;
  const currentSectionContent = sections[currentSection] || sections[0] || "";

  // Navigation handlers
  const goToPrevSection = () => {
    if (currentSection > 0) {
      setLocation(`/module/${id}/${currentSection}`); // currentSection is 0-indexed, so this goes to previous
    }
  };

  const goToNextSection = () => {
    if (currentSection < totalSections - 1) {
      setLocation(`/module/${id}/${currentSection + 2}`); // +2 because currentSection is 0-indexed and URL is 1-indexed
    } else if (moduleId < 6) {
      // Go to next module
      setLocation(`/module/${moduleId + 1}/1`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Main Content Area */}
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="pl-0 text-muted-foreground hover:text-primary">
              <ArrowLeft className="mr-2 h-4 w-4" /> {t("detail.back")}
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">
                Module {id}
              </Badge>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <PlayCircle className="h-3 w-3" /> {t(`module${id}.duration`)}
              </span>
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {moduleData.title}
            </h1>
            <p className="mt-2 text-xl text-muted-foreground">
              {moduleData.subtitle}
            </p>
          </div>
        </div>

        <Separator />

        {/* Content Tabs */}
        <Tabs defaultValue="content" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
            <TabsTrigger value="content">{t("detail.tabs.curriculum")}</TabsTrigger>
            <TabsTrigger value="practice">{t("detail.tabs.practice")}</TabsTrigger>
            <TabsTrigger value="resources">{t("detail.tabs.resources")}</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="mt-6 space-y-6">
            {/* Section Indicator */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {language === 'ko' ? '섹션' : language === 'en' ? 'Section' : '章節'} {currentSection + 1} / {totalSections}
              </span>
              <div className="flex gap-1">
                {Array.from({ length: totalSections }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setLocation(`/module/${id}/${i + 1}`)}
                    className={`w-2 h-2 rounded-full transition-colors ${i === currentSection ? 'bg-primary' : 'bg-muted hover:bg-muted-foreground/50'
                      }`}
                  />
                ))}
              </div>
            </div>

            <Card className="border-border/50 shadow-sm" key={`section-card-${currentSection}`}>
              <CardContent className="p-6 sm:p-10">
                <div className="prose prose-stone dark:prose-invert max-w-none prose-headings:font-display prose-a:text-primary prose-img:rounded-xl">
                  <Streamdown
                    key={`section-${id}-${currentSection}`}
                    components={{
                      "audio-player": (props: any) => <AudioPlayer {...props} />,
                      "youtube-player": (props: any) => <YouTubePlayer {...props} />
                    } as any}
                  >
                    {currentSectionContent}
                  </Streamdown>
                </div>
              </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-4">
              <Button
                variant="outline"
                onClick={goToPrevSection}
                disabled={currentSection === 0}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {language === 'ko' ? '이전' : language === 'en' ? 'Previous' : '上一頁'}
              </Button>

              <Button
                onClick={goToNextSection}
                className="gap-2"
              >
                {currentSection < totalSections - 1
                  ? (language === 'ko' ? '다음 학습' : language === 'en' ? 'Next' : '下一頁')
                  : moduleId < 6
                    ? (language === 'ko' ? '다음 모듈' : language === 'en' ? 'Next Module' : '下一單元')
                    : (language === 'ko' ? '완료' : language === 'en' ? 'Complete' : '完成')
                }
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="practice" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 rounded-full bg-muted p-4">
                    <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-bold">{t("detail.tabs.practice")}</h3>
                  <p className="text-muted-foreground mt-1 max-w-md">
                    {language === 'ko' ? "이 모듈의 실습 과제와 평가 기준이 여기에 표시됩니다." :
                      language === 'en' ? "Practice assignments and evaluation criteria will be displayed here." :
                        "此單元的練習作業與評估標準將顯示於此。"}
                  </p>
                  <Button className="mt-6" variant="outline">{t("detail.start")}</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <h3 className="font-bold flex items-center gap-2">
                    <Download className="h-4 w-4" /> {t("detail.tabs.resources")}
                  </h3>
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>{language === 'ko' ? '준비 중입니다' : language === 'en' ? 'Coming Soon' : '準備中'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs >
      </div >
    </div >
  );
}

// Helper functions to return original Korean content
function getKoreanContent(id: string) {
  const contents: Record<string, string> = {
    "1": `
## 1.1 쇼파르란 무엇인가

### 정의와 어원

쇼파르(שׁוֹפָר, Shofar)는 고대 이스라엘에서 사용된 관악기로, 주로 숫양의 뿔로 제작됩니다. 히브리어 어근 "שָׁפַר(shaphar)"는 "아름답게 하다", "개선하다"라는 의미를 가지며, 이는 쇼파르 소리가 영혼을 정화하고 회개로 이끈다는 영적 의미와 연결됩니다.

현대 금관악기의 조상이라 할 수 있는 쇼파르는 밸브나 키 없이 오직 연주자의 입술 진동(앙부슈르)으로만 소리를 냅니다. 이러한 단순함 속에 3,000년 이상의 역사가 담겨 있습니다.

### 히브리어 어원 분석
- **Shofar (שׁוֹפָר)**: 어근 **Sh-P-R (ש.פ.ר)**에서 유래
- 의미: "아름답게 하다", "개선하다", "닦다"
- 해석: 쇼파르 소리는 단순한 악기 소리가 아니라, 우리의 행실을 닦고 영혼을 아름답게 개선하라는 부르심입니다.
- **Keren (קֶרֶן)**: 일반적으로 '뿔'을 의미하지만, 동물의 뿔뿐만 아니라 '광체', '힘'을 상징하기도 합니다.

### 고대 악기와의 비교
- 쇼파르는 인류 역사상 가장 오래된 악기 중 하나입니다.
- **Hatzotzrah (은나팔)**와 구별:
- 은나팔: 인간이 금속을 두들겨 만든 악기 (인간의 기술)
- 쇼파르: 하나님이 창조한 동물의 뿔 (하나님의 창조물)
- 이는 쇼파르가 인간의 기교보다 하나님의 자연스러운 소리, 영혼의 찢어지는 외침을 대변함을 의미합니다.

---

## 1.2 성경에서의 쇼파르

### 첫 등장: 시나이 산 (출애굽기 19:16-19)

쇼파르가 성경에 처음 등장하는 장면은 시나이 산에서 토라가 주어지는 순간입니다. 이 쇼파르 소리는 하나님의 임재를 선포하며, 이스라엘 백성을 경외와 두려움으로 이끌었습니다.

> "셋째 날 아침에 우레와 번개와 빽빽한 구름이 산 위에 있고 **나팔 소리가 매우 크게** 들리니 진중에 있는 모든 백성이 떨었더라" (출애굽기 19:16)

### 주요 성경 구절

| 구절 | 내용 | 의미 |
|------|------|------|
| 출애굽기 19:16-19 | 시나이 산 계시 | 하나님의 임재 선포 |
| 레위기 23:24 | 나팔절(로쉬 하샤나) | 새해의 시작 |
| 레위기 25:9 | 희년 선포 | 자유와 해방 |
| 여호수아 6:4-20 | 여리고 성 함락 | 승리의 선언 |
| 사사기 7:22 | 기드온의 전쟁 | 전쟁의 신호 |
| 시편 47:5 | 찬양과 경배 | 왕의 대관식 |
| 시편 81:3 | 절기 선포 | 거룩한 모임 소집 |
| 이사야 27:13 | 종말의 나팔 | 이스라엘 회복 |

### 성경적 역사 타임라인

#### 1. 창조와 족장 시대
- **아케다(Akedah)**: 창세기 22장. 쇼파르 역사의 영적 기원. 이삭을 대신해 수풀에 걸린 숫양의 뿔은 훗날 쇼파르의 원형이 됩니다.

#### 2. 출애굽과 광야 시대
- **시나이 산 (BC 1446년경)**: 하나님의 강림과 함께 들린 초자연적인 쇼파르 소리. 이는 인간이 분 것이 아니라 하늘로부터 울려 퍼진 소리였습니다. (출 19:16)
- **희년의 선포**: 50년마다 자유를 선포할 때 쇼파르를 사용함으로, 사회적 정의와 해방의 도구가 되었습니다. (레 25:9)

#### 3. 정복 전쟁 시대
- **여리고 성 (BC 1406년경)**: 여호수아 6장. 7명의 제사장이 7일간 쇼파르를 불었고, 마지막 날 백성의 함성과 함께 견고한 성벽이 무너졌습니다. 이는 쇼파르가 영적 전쟁의 강력한 무기임을 보여줍니다.
- **기드온의 300 용사**: 횃불과 항아리, 그리고 쇼파르 소리만으로 미디안 대군을 물리쳤습니다. (삿 7장)

#### 4. 왕정 시대
- **왕의 대관식**: 솔로몬 왕의 대관식 등 왕의 등극을 알릴 때 사용되었습니다. (왕상 1:39)
- **언약궤 이동**: 다윗이 언약궤를 예루살렘으로 옮길 때 쇼파르와 즐거운 소리가 함께했습니다. (삼하 6:15)

---

## 1.3 아케다(Akedah)와 쇼파르의 연결
### 이삭 번제 사건 (창세기 22장)

쇼파르가 숫양 뿔로 만들어지는 것은 아브라함이 이삭 대신 제물로 바친 숫양과 깊은 연관이 있습니다. 이 사건은 유대 전통에서 "아케다(עֲקֵדָה, 결박)"라 불리며, 쇼파르의 영적 의미를 이해하는 핵심입니다.

> "아브라함이 눈을 들어 살펴본즉 한 숫양이 뒤에 있는데 **뿔이 수풀에 걸려 있는지라** 아브라함이 가서 그 숫양을 가져다가 아들을 대신하여 번제로 드렸더라" (창세기 22:13)

### 신학적 의미

아케다 사건에서 숫양은 대속(代贖)의 상징입니다. 쇼파르를 불 때마다 우리는 다음을 기억합니다:

1. **하나님의 공급**: 위기의 순간에 하나님이 제물을 준비하심
2. **대속의 원리**: 무고한 자가 죄인을 대신함
3. **순종의 모범**: 아브라함의 믿음과 이삭의 순종
4. **메시아 예표**: 하나님의 독생자 희생의 예표

### 📜 심화 탐구: 아케다의 4단계 드라마
1.  **부르심 (The Call)**: "네 아들, 네 사랑하는 독자 이삭을 데리고..." 하나님은 가장 소중한 것을 요구하십니다.
2.  **침묵의 동행 (The Silence)**: 3일 길을 걷는 동안 아브라함과 이삭의 대화는 절제되어 있습니다. 쇼파르의 침묵(준비)과 닮아 있습니다.
3.  **결박 (The Binding)**: 이삭이 스스로 제단 위에 누운 것은 자발적인 희생(Self-sacrifice)을 의미합니다.
4.  **개입 (The Intervention)**: 칼을 내리치려는 순간 들린 천사의 음성과 수풀에 걸린 숫양. 이것이 바로 구원의 소리, 쇼파르의 원형입니다.

> **유대 전승(Midrash)**: "그 숫양의 왼쪽 뿔은 시나이 산에서 울렸고, 오른쪽 뿔(더 큰 뿔)은 훗날 메시아가 오실 때 울릴 것이다."

---

## 1.4 성전 시대의 쇼파르

### 제1성전 시대 (솔로몬 성전)

다윗 왕은 성전 예배에 쇼파르를 포함시켰으며, 솔로몬 성전에서는 정교한 의식 체계 속에서 쇼파르가 사용되었습니다.

### 제2성전 시대

제2성전 시대에는 쇼파르 사용이 더욱 체계화되었습니다:

| 행사 | 쇼파르 배치 | 특징 |
|------|------------|------|
| 로쉬 하샤나 | 중앙에 쇼파르, 양쪽에 트럼펫 | 아이벡스 뿔, 직선형, 금 장식 |
| 금식일 | 중앙에 트럼펫, 양쪽에 쇼파르 | 숫양 뿔, 곡선형, 은 장식 |
| 희년 욤 키푸르 | 로쉬 하샤나와 동일 | 자유 선포 |

### 성전 예배의 황금기
솔로몬 성전(제1성전)과 스룹바벨/헤롯 성전(제2성전) 시대에 쇼파르는 공교한 예배 음악의 일부였습니다.

#### 제2성전 시대의 쇼파르 사용 규정 (미슈나 Rosh Hashanah 3:3-4)
- **로쉬 하샤나 (신년)**:
- 구성: 중앙에 금 장식 쇼파르 1개 + 양옆에 은나팔 2개
- 연주: 쇼파르 소리를 길게, 나팔 소리를 짧게 하여 쇼파르가 주가 되게 함
- **금식일 (국가적 위기)**:
- 구성: 중앙에 은나팔 2개 + 양옆에 은 장식 쇼파르 2개
- 연주: 나팔 소리를 길게 하여 기도가 주가 되게 함

#### 레위인과 제사장의 역할 구분
- **은나팔(Hatzotzrah)**: 제사장(아론의 자손)만이 불 수 있었습니다. (민 10:8)
- **쇼파르(Shofar)**: 제사장뿐만 아니라 레위인, 때로는 일반 백성도 불 수 있었습니다. 성전 밖에서는 구분의 의미가 확장되었습니다.

---

## 1.5 디아스포라 이후의 쇼파르

### 성전 파괴 후의 변화

70년 성전 파괴 이후, 쇼파르는 유대인 공동체에서 더욱 중요한 상징이 되었습니다. 성전 예배가 불가능해진 상황에서 쇼파르는 하나님과의 연결고리이자 정체성의 상징으로 남았습니다.

### 현대까지의 전승

| 시대 | 특징 | 주요 변화 |
|------|------|----------|
| 탈무드 시대 | 율법 체계화 | 쇼파르 규정 정립 |
| 중세 | 디아스포라 확산 | 지역별 전통 발전 |
| 근대 | 유럽 유대 공동체 | 아쉬케나지/세파르디 구분 |
| 현대 | 이스라엘 건국 | 국가적 상징으로 부활 |

### 성전 파괴 (AD 70년) 이후의 변화
로마에 의해 예루살렘 성전이 파괴되면서, 쇼파르의 역할은 극적으로 변화했습니다.

1.  **제사의 중단, 기도의 시작**: 희생 제사가 불가능해지자, 쇼파르는 ‘입술의 제사’인 기도를 돕는 도구로 회당(Synagogue)에 자리 잡았습니다.
2.  **랍비적 규정의 정립 (탈무드 시대)**:
- 어디서 불 것인가? (금지된 날과 허용된 날)
- 어떤 소리를 낼 것인가? (Teruah의 정의 논쟁 → TaSHRaT, TaSHaT, TaRaT 3가지 조합 탄생)
3.  **중세 시대 (유럽과 이슬람권)**:
- 박해 속에서도 쇼파르는 유대인 정체성을 지키는 '소리 탄환'이었습니다.
- 스페인 종교재판(Inquisition) 당시, 비밀 유대인(Marranos)들은 숲속이나 지하실에서 몰래 쇼파르를 불며 신앙을 지켰습니다.

### 지역별 전통의 분화

- **아쉬케나지 (동유럽)**: 애절하고 비탄에 잠긴 듯한 소리 스타일 발전. 박해의 역사가 소리에 담김.
- **세파르디 (서유럽/중동)**: 더 리드미컬하고 힘찬 소리.
- **예멘**: 쿠두 뿔(긴 나선형)을 사용하며, 독특한 저음과 울림을 보존.

---

## 1.6 쇼파르의 현대적 의미

### 종교적 사용

오늘날 쇼파르는 주로 다음 시기에 사용됩니다:

- **엘룰 월**: 로쉬 하샤나 준비 기간 동안 매일 아침
- **로쉬 하샤나**: 유대 새해의 핵심 의식
- **욤 키푸르**: 속죄일 종료 시

### 비종교적 사용

- 이스라엘 독립 선언 (1948년)
- 예루살렘 통일 (1967년)
- 국가 행사 및 기념식

### 이스라엘 건국과 쇼파르의 부활
2,000년의 침묵을 깨고 쇼파르는 국가적 상징으로 부활했습니다.

#### 결정적 역사적 순간들
1.  **통곡의 벽 사건 (1930-1947)**
- 영국 위임통치령 하에서 통곡의 벽에서 쇼파르를 부는 것은 금지되었습니다.
- 그러나 욤 키푸르가 끝날 때마다 용감한 젊은이들이 목숨을 걸고 옷 속에 쇼파르를 숨겨가서 불었습니다. (모세 세갈 등)

2.  **6일 전쟁과 성전산 탈환 (1967년)**
- **랍비 슐로모 고렌(Shlomo Goren)**: 이스라엘 군종감이었던 그는 낙하산 부대와 함께 예루살렘 올드 시티에 진입했습니다.
- 통곡의 벽에 도달하자마자 그는 토라 두루마리를 안고 강력하게 쇼파르를 불었습니다.
- 이 장면은 유대인 역사에서 '예루살렘의 귀환'을 알리는 가장 상징적인 사진이 되었습니다.

### 현대적 적용과 확장
- **국가 행사**: 대통령 취임식 등에서도 쇼파르가 울립니다.
- **메시아닉 운동**: 예수를 메시아로 믿는 유대인들과 기독교인들 사이에서 쇼파르는 '재림의 나팔'로서 다시 주목받고 있습니다.
- **치유와 예배**: 현대에는 단순한 의식을 넘어, 소리를 통한 치유(Sound Healing)와 워십의 도구로 전 세계적으로 확산되고 있습니다.
`,
    "2": `
## 2.1 쇼파르의 재료

### 허용되는 재료

유대 율법(할라카)에 따르면, 쇼파르는 **Bovidae 과(科)** 동물의 뿔로 만들어야 합니다. 단, 소의 뿔은 금송아지 사건을 연상시키므로 제외됩니다.

| 재료 | 허용 여부 | 비고 |
|------|----------|------|
| 숫양(Ram) 뿔 | ✅ 허용 | 가장 전통적, 아케다 연결 |
| 쿠두(Kudu) 뿔 | ✅ 허용 | 예멘 전통 |
| 염소(Goat) 뿔 | ✅ 허용 | 일부 지역 사용 |
| 아이벡스(Ibex) 뿔 | ✅ 허용 | 성전 시대 사용 |
| 소(Cow) 뿔 | ❌ 금지 | 금송아지 연상 |
| 사슴뿔(Antler) | ❌ 금지 | 속이 차 있어 불가 |

### 뿔의 구조

쇼파르에 사용되는 뿔은 **케라틴(keratin)**으로 이루어져 있습니다. 이는 인간의 손톱, 발톱과 동일한 물질입니다. 뿔의 내부 구조는 다음과 같습니다:

1. **외층**: 케라틴 층 (악기의 본체)
2. **중간층**: 연골 (제거됨)
3. **내부**: 뼈 코어 (제거되어 빈 공간 형성)

### 💡 케라틴(Keratin)의 비밀
뿔을 구성하는 케라틴은 열가소성(Thermoplastic) 물질입니다.
- **가열 시**: 부드러워져 형태 변형이 가능합니다. (쇼파르 제작의 핵심 원리)
- **냉각 시**: 다시 단단해져 모양을 유지합니다.
- **특징**: 탄성이 있어 잘 깨지지 않으나, 급격한 온도/습도 변화에는 갈라질 수 있습니다.

---

## 2.2 쇼파르의 종류

### 숫양 뿔 쇼파르 (Ram's Horn)

가장 전통적이고 널리 사용되는 쇼파르입니다.

| 특성 | 설명 |
|------|------|
| **형태** | 곡선형 (C자 또는 나선형) |
| **길이** | 10-14인치 (25-35cm) |
| **음색** | 밝고 날카로운 중간 음역대 |
| **전통** | 아쉬케나지, 세파르디 |
| **권장 대상** | 초보자, 일반 의식용 |

### 쿠두 뿔 쇼파르 (Kudu Horn / Yemenite)

예멘 유대인 전통의 쇼파르로, 아프리카 쿠두 영양의 뿔로 제작됩니다.

| 특성 | 설명 |
|------|------|
| **형태** | 긴 나선형 |
| **길이** | 최대 4피트 (120cm) |
| **음색** | 깊고 공명하는 저음역대 |
| **전통** | 예멘 유대인 |
| **권장 대상** | 경험자, 특별 행사 |

### 모로코 쇼파르 (Moroccan)

북아프리카 전통의 독특한 형태입니다.

| 특성 | 설명 |
|------|------|
| **형태** | 납작하고 넓은 곡선 |
| **길이** | 중간 크기 |
| **음색** | 독특한 음색 |
| **전통** | 모로코 유대인 |

### 📷 사진 자료와 특징
- **Ashkenazi Ram's Horn**: 겉면을 매끄럽게 갈아내고 직선에 가까운 J자 형태. 소리가 날카롭습니다.
- **Moroccan Ram's Horn**: 뿔의 원래 질감을 살리고 납작하게 누른 형태. 야성적인 소리가 납니다.
- **Yemenite Kudu**: 나선형(Spiral) 구조가 그대로 보존됨. 첼로와 같은 깊은 울림이 특징입니다.

---

## 2.3 쇼파르 선택 기준

### 선호 순서 (Elef Hamagen 586:5)

유대 전통에 따른 쇼파르 선택 우선순위:

| 순위 | 종류 | 축복(Bracha) |
|------|------|-------------|
| 1 | 곡선형 숫양 뿔 | 축복과 함께 |
| 2 | 곡선형 다른 양 뿔 | 축복과 함께 |
| 3 | 곡선형 다른 동물 뿔 | 축복과 함께 |
| 4 | 직선형 (숫양 또는 기타) | 축복 없이 |
| 5 | 비코셔 동물 뿔 | 축복 없이 |
| 6 | 소 뿔 | 사용 불가 |

### 개인 선택 시 고려사항

| 요소 | 초보자 권장 | 경험자 권장 |
|------|------------|------------|
| **크기** | 중간 (12인치) | 개인 선호 |
| **무게** | 가벼운 것 | 상관없음 |
| **마우스피스** | 넓은 것 | 개인 맞춤 |
| **음색** | 밝은 것 | 다양한 시도 |
| **가격** | 중저가 | 품질 우선 |

### ✅ 품질 평가 체크리스트
1.  **마우스피스**: 입술에 닿는 면이 매끄러운가? (거칠면 입술 부상 위험)
2.  **공기 흐름**: 살짝 불었을 때 저항 없이 소리가 즉각 반응하는가?
3.  **옥타브**: 기본음과 옥타브 위의 음이 명확하게 구분되는가?
4.  **냄새**: 역한 냄새가 나지 않는가? (완전 건조된 뿔은 냄새가 거의 없음)

---

## 2.4 쇼파르 제작 과정

### 전통적 제작 단계

쇼파르 제작은 섬세한 기술을 요하는 과정입니다:

| 단계 | 과정 | 주의사항 |
|------|------|----------|
| 1. 원재료 확보 | 코셔 동물의 뿔 수집 | 도축 방식 확인 |
| 2. 내부 제거 | 뼈와 연골 제거 | 완전히 비워야 함 |
| 3. 열처리 | 열을 가해 형태 조정 | 과열 주의 |
| 4. 구멍 뚫기 | 마우스피스 부분 가공 | 크기 정밀 조절 |
| 5. 마감 | 광택 또는 자연 마감 | 색칠 금지 |
| 6. 검수 | 소리 및 균열 확인 | 의식용 적합성 |

### 의식용 규정

쇼파르가 종교 의식에 사용되려면 다음 조건을 충족해야 합니다:

- **색칠 금지**: 예술적 조각은 허용되나 색칠은 불가
- **균열 없음**: 소리에 영향을 주는 균열은 부적합
- **구멍 없음**: 추가 구멍이 있으면 무효
- **자연 상태**: 인공 첨가물 없이 자연 뿔 사용

### 🏭 현대적 제작 공정
1.  **세척 및 소독**: 과산화수소 등으로 뿔 내부의 박테리아 제거.
2.  **연마(Sanding)**: 거친 표면을 단계별 사포(Grit 400~2000)로 다듬음.
3.  **광택(Buffing)**: 고속 회전 버퍼로 거울 같은 광택을 냄.
4.  **튜닝**: 마우스피스 구멍의 크기를 미세하게 조절하여 기본 피치(Pitch)를 조정. (단, 정확한 음계 튜닝은 불가능)

---

## 2.5 쇼파르 관리와 보관

### 일상 관리

| 항목 | 권장 사항 | 주의사항 |
|------|----------|----------|
| **청소** | 사용 후 마른 천으로 닦기 | 물 사용 최소화 |
| **소독** | 알코올 스왑으로 마우스피스 | 내부 세척 자제 |
| **건조** | 통풍 잘 되는 곳에서 | 직사광선 피하기 |

### 보관 방법

| 환경 | 권장 | 피해야 할 것 |
|------|------|-------------|
| **온도** | 실온 (15-25°C) | 극단적 온도 변화 |
| **습도** | 적당한 습도 | 과습/과건조 |
| **보관함** | 전용 케이스 또는 천 주머니 | 밀폐 용기 |
| **위치** | 안전하고 존경받는 장소 | 바닥이나 불결한 곳 |

### 문제 해결

| 문제 | 원인 | 해결책 |
|------|------|--------|
| 소리가 안 남 | 마우스피스 막힘 | 청소 후 재시도 |
| 균열 발생 | 건조 또는 충격 | 전문가 상담 |
| 냄새 발생 | 습기 또는 세균 | 건조 및 소독 |
| 변색 | 자연 현상 | 정상, 관리 지속 |

### ❄️ 계절별 관리 팁
- **여름 (다습)**: 통풍이 잘 되는 서늘한 곳에 보관. 케이스 안에 제습제(Silica gel) 하나를 넣어두면 좋음.
- **겨울 (건조)**: 뿔이 가장 잘 갈라지는 시기. 한 달에 한 번 내부에 올리브 오일을 얇게 도포하여 유분 공급.
- **여행 시**: 반드시 하드 케이스나 두꺼운 폼이 내장된 가방 사용. 기내 반입 시 기압 차이는 큰 문제 없으나 파손 주의.

---

## 2.6 단체용 쇼파르 선택

### 120명 나팔단을 위한 권장사항

대규모 앙상블을 위해서는 악기의 통일성이 중요합니다:

| 고려사항 | 권장 사항 |
|----------|----------|
| **종류 통일** | 동일 유형 (숫양 뿔 권장) |
| **크기 범위** | 11-13인치로 통일 |
| **음색 조화** | 사전 테스트로 조화 확인 |
| **품질 수준** | 중상급 이상 통일 |
| **예비 악기** | 10% 여유분 확보 |

### 📦 단체 악기 관리 시스템
1.  **네임택 부착**: 모든 악기에 고유 번호와 소유자 이름 스티커 부착.
2.  **정기 점검일**: 매월 첫째 주 리허설 전, 악기 관리팀이 일괄 점검 (균열, 청결 상태).
3.  **공용 악기**: 10%의 예비 악기는 항상 A급 상태로 유지하여, 개인 악기 고장 시 즉시 투입.
`,
    "3": `
## 3.1 소리 생성의 원리

### 물리학적 이해

쇼파르는 금관악기와 동일한 원리로 소리를 냅니다. 연주자의 입술 진동이 소리의 근원이며, 뿔의 빈 공간이 이를 증폭합니다.

| 단계 | 과정 | 결과 |
|------|------|------|
| 1 | 입술을 떨면서 작은 구멍으로 공기 불기 | 진동 생성 |
| 2 | 진동이 음파 생성 | 소리 발생 |
| 3 | 음파가 쇼파르 내부 통과 | 공명 |
| 4 | 뿔의 형태가 소리 증폭 및 투사 | 최종 소리 |

### 쇼파르의 특수성

현대 금관악기와 달리 쇼파르에는 밸브, 키, 슬라이드가 없습니다. 따라서 음정과 음색 조절은 **오직 입술, 혀, 호흡**으로만 가능합니다. 이것이 쇼파르를 도전적이면서도 보람 있는 악기로 만듭니다.

### 🔊 음향학적 원리
쇼파르는 '닫힌 관(Closed Pipe)'의 원리를 따릅니다.
- **길이와 피치**: 뿔이 길수록 기본 음정이 낮아집니다.
- **내부 모양**: 내부가 거칠수록 배음(Harmonics)이 풍부해지지만, 소리 내기는 더 힘듭니다.
- **벨(Bell) 효과**: 끝부분이 넓게 퍼져 있어 고음역을 증폭시켜 소리를 멀리 보냅니다.

---

## 3.2 호흡법 (Breathing Technique)

### 흔한 실수

많은 초보자들이 폐활량으로 소리를 강제하려 합니다. 이는 다음과 같은 결과를 초래합니다:

| 실수 | 결과 |
|------|------|
| 너무 세게 불기 | 소리 없음 또는 삐걱거림 |
| 짧은 호흡 | 불안정한 소리 |
| 가슴 호흡만 사용 | 빠른 피로 |
| 긴장한 상태로 불기 | 음색 저하 |

### 횡격막 호흡 (Diaphragmatic Breathing)

올바른 호흡의 핵심은 **횡격막 호흡**입니다:

| 단계 | 동작 | 확인 방법 |
|------|------|----------|
| 1. 준비 | 편안한 자세, 어깨 이완 | 거울로 확인 |
| 2. 흡기 | 복부부터 팽창, 이후 가슴 | 손을 배에 대고 확인 |
| 3. 유지 | 잠시 멈춤 (1-2초) | 긴장 없이 유지 |
| 4. 호기 | 천천히, 일정하게 방출 | 촛불 테스트 |

### 공기 흐름 조절

쇼파르 연주의 비밀은 **부드럽고 지속적인 공기 흐름**입니다:

> 💡 **핵심 원리**: 강력한 돌풍이 아닌, 부드러운 시냇물처럼 공기를 보내세요.

| 잘못된 방식 | 올바른 방식 |
|------------|------------|
| 폭발적 분출 | 안정적 흐름 |
| 빠르게 비우기 | 천천히 방출 |
| 힘으로 밀어내기 | 자연스럽게 흘려보내기 |

### 호흡 연습
#### 연습 1: 기초 호흡
1. 쇼파르 없이 깊이 숨쉬기
2. 오므린 입술로 천천히 내쉬기
3. 몇 초간 안정적으로 유지할 수 있는지 측정
4. 목표: 20초 이상 유지

#### 연습 2: 촛불 테스트
1. 촛불을 30cm 앞에 두기
2. 불꽃이 흔들리지만 꺼지지 않도록 불기
3. 10초 이상 유지
4. 일정한 흔들림 유지가 목표

#### 연습 3: 복식호흡 강화
1. 바닥에 누워 무릎 세우기
2. 배 위에 책 올려놓기
3. 숨쉴 때 책이 오르내리는지 확인
4. 매일 5분씩 연습

### 🎥 호흡 자가 점검 (Video Check)
거울을 보거나 동영상을 찍어 다음을 확인하십시오.
1.  **어깨**: 숨을 들이마실 때 어깨가 올라가면 잘못된 '흉식 호흡'입니다.
2.  **배**: 숨을 들이마실 때 배가 **풍선처럼** 나와야 합니다.
3.  **촛불**: 10초 이상 불꽃이 꺼지지 않고 45도 각도로 계속 누워있게 하십시오.

---

## 3.3 앙부슈르 (Embouchure)

### 정의

앙부슈르(Embouchure)는 마우스피스에 입술을 위치시키고 형태를 잡는 방법입니다. 이것이 소리 품질, 음정 조절, 연주 성공을 결정하는 **가장 중요한 요소**입니다.

### 기본 앙부슈르 형성

#### Step 1: 입술 준비
- 마른 입술은 제대로 밀봉되지 않음
- 불기 전 가볍게 입술 적시기
- 립밤이나 챕스틱 사용 가능

#### Step 2: 오므리기-미소 조합
| 근육 | 동작 | 목적 |
|------|------|------|
| 오므리는 근육 | 휘파람 불 듯 입술 오므리기 | 구멍 형성 |
| 미소 근육 (볼) | 약간 긴장시키기 | 단단함 유지 |

> 💡 **핵심**: 두 근육 그룹의 균형 잡힌 긴장이 올바른 앙부슈르의 비결입니다.

#### Step 3: 마우스피스 위치

| 위치 | 비율 | 설명 |
|------|------|------|
| 윗입술 | 2/3 | 소리 생성의 핵심 |
| 아랫입술 | 1/3 | 지지 역할 |

- 입 안이 아닌 **입술에** 대고 놓기
- 윗입술의 살 부분이 소리 생성에 중요

#### Step 4: 자신만의 위치 찾기

대부분의 연주자는 중앙보다 **약간 옆(입꼬리)**에 놓는 것이 효과적입니다:

| 위치 | 장점 | 단점 |
|------|------|------|
| 중앙 | 대칭적 | 일부에게 어려움 |
| 오른쪽 | 자연스러운 경우 많음 | 개인차 |
| 왼쪽 | 자연스러운 경우 있음 | 개인차 |

> ⚠️ **중요**: 보편적으로 "올바른" 위치는 없습니다. 자신의 얼굴 구조에 맞는 것이 최선입니다.

#### Step 5: 밀봉 (Seal)

| 올바른 밀봉 | 잘못된 밀봉 |
|------------|------------|
| 공기가 새지 않음 | 옆으로 공기 누출 |
| 유연함 유지 | 너무 딱딱함 |
| 편안한 압력 | 과도한 압력 |

- 손가락으로 쇼파르를 입술에 부드럽게 누르면 도움
- 초보자에게 특히 유용한 기법

#### Step 6: 구멍 (Aperture) 조절
구멍(Aperture)은 입술 사이의 작은 틈으로, 공기가 통과하는 곳입니다:

| 음역 | 구멍 크기 | 입술 긴장 |
|------|----------|----------|
| 저음 | 크게 | 이완 |
| 고음 | 작게 | 긴장 |

> 💡 **비유**: 정원 호스 노즐 조절과 같습니다 - 좁으면 높은 압력, 넓으면 낮은 압력

### 앙부슈르 연습

#### 연습 1: 입술 버징 (Lip Buzzing)
1. 쇼파르 없이 입술만으로 윙윙거리는 소리 만들기
2. 5-10초 동안 유지
3. 음정 변화 시도 (높게/낮게)
4. 일관되게 가능해지면 쇼파르 추가

#### 연습 2: 마우스피스만 연습
1. 쇼파르에서 마우스피스 부분만 사용
2. 안정적인 소리 내기
3. 다양한 위치 실험
4. 최적의 위치 기록

#### 연습 3: 거울 연습
1. 거울 앞에서 앙부슈르 형성
2. 대칭성 확인
3. 긴장 부위 파악
4. 교정 후 재시도

### 👩‍🏫 멘토링 체크리스트 (For Teachers)
학생의 앙부슈르를 교정할 때 다음을 확인하십시오:
1.  **볼 부풀림 (Puffing Checks)**: 볼에 바람이 들어가면 입술 근육이 풀립니다. 볼은 단단해야 합니다.
2.  **턱의 긴장**: 턱이 앞으로 튀어나오면 안 됩니다.
3.  **마우스피스 압력**: 자국이 남을 정도로 꽉 누르면 혈액순환을 방해하여 금방 지칩니다. "살포시 얹는" 느낌을 강조하십시오.

---

## 3.4 첫 소리 내기

### 단계별 가이드

| 단계 | 동작 | 확인 사항 |
|------|------|----------|
| 1 | 편안한 자세 취하기 | 어깨, 목 이완 |
| 2 | 깊은 횡격막 호흡 | 복부 팽창 확인 |
| 3 | 입술 적시기 | 건조하지 않은지 |
| 4 | 앙부슈르 형성 | 오므리기-미소 조합 |
| 5 | 쇼파르 위치 잡기 | 2/3 윗입술 |
| 6 | 부드럽게 공기 불기 | 강제하지 않기 |
| 7 | 입술 진동 느끼기 | 버징 감각 |
| 8 | 소리 유지 | 안정적으로 2-3초 |

### 문제 해결

| 문제 | 가능한 원인 | 해결책 |
|------|------------|--------|
| 소리가 전혀 안 남 | 입술 긴장, 공기 부족 | 이완 후 재시도 |
| 삐걱거리는 소리 | 과도한 공기, 잘못된 앙부슈르 | 부드럽게, 위치 조정 |
| 불안정한 소리 | 호흡 불안정 | 호흡 연습 강화 |
| 빠른 피로 | 과도한 긴장 | 휴식, 이완 연습 |
| 어지러움 | 과호흡 | 휴식, 천천히 |

### 🔍 첫 소리 성공 진단
- **성공 요인**: "Bzzz" 하는 입술 떨림이 뿔 안으로 정확히 들어갔음.
- **실패 요인 (바람 소리만 남)**:
- 입술 틈이 너무 넓음 (구멍을 줄이세요)
- 입술이 마우스피스 중앙에 오지 않음
- 호흡 압력이 너무 약함 (배에 힘을 주세요)

---

## 3.5 기본 음색 개발

### 좋은 소리의 특징

| 특징 | 설명 | 반대 |
|------|------|------|
| **풍부함** | 깊이 있는 울림 | 얇고 빈 소리 |
| **안정성** | 흔들림 없는 지속 | 떨리는 소리 |
| **명확성** | 깨끗한 시작과 끝 | 흐릿한 경계 |
| **공명** | 뿔 전체의 울림 | 막힌 소리 |

### 음색 개선 연습
#### 연습 1: 롱톤 (Long Tone)
1. 가능한 한 긴 소리 유지
2. 음색 일관성 유지
3. 시작: 5초 → 목표: 15초 이상
4. 매일 10회 반복

#### 연습 2: 다이내믹 변화
1. 작은 소리로 시작 (piano)
2. 점점 크게 (crescendo)
3. 다시 작게 (decrescendo)
4. 음색 유지하며 변화

#### 연습 3: 음정 탐색
1. 자연스러운 음에서 시작
2. 앙부슈르 조절로 음정 변화
3. 높은 음, 낮은 음 시도
4. 각 음정에서 안정성 확인

### 🎙️ 녹음 자기 평가 (Self-Recording)
스마트폰으로 자신의 소리를 녹음하여 들어보십시오.
1.  **시작이 깨끗한가?** (앞에 '푸-' 하는 바람 소리가 없는가?)
2.  **음정이 흔들리지 않는가?** (직선으로 뻗어나가는가?)
3.  **끝이 명확한가?** (소리가 꼬리를 물며 흐려지지 않는가?)

---

## 3.6 연습 계획

### 초보자 일일 연습 계획 (30분)

| 시간 | 활동 | 목적 |
|------|------|------|
| 5분 | 호흡 연습 | 횡격막 강화 |
| 5분 | 입술 버징 | 앙부슈르 준비 |
| 10분 | 기본 소리 연습 | 안정성 개발 |
| 5분 | 롱톤 연습 | 지속력 향상 |
| 5분 | 휴식 및 정리 | 회복 |

### 주간 연습 계획

| 요일 | 중점 영역 |
|------|----------|
| 월 | 호흡법 집중 |
| 화 | 앙부슈르 집중 |
| 수 | 롱톤 집중 |
| 목 | 음색 개발 |
| 금 | 종합 연습 |
| 토 | 자유 연습 |
| 일 | 휴식 |

### 📈 정체기(Slump) 극복 전략
연습해도 소리가 늘지 않는 것 같을 때:
1.  **하루 휴식**: 근육 피로일 수 있습니다. 과감히 쉬십시오.
2.  **기본 돌아가기**: 복잡한 기교를 멈추고 '롱톤'만 10분 하십시오.
3.  **작은 쇼파르로 변경**: 잠시 작은 악기를 불어 앙부슈르 부담을 줄여보십시오.
`,
    "4": `
## 4.1 쇼파르의 4가지 전통 소리

### 개요

유대 전통에서 쇼파르는 4가지 기본 소리(קולות, Kolot)를 냅니다. 각 소리는 고유한 패턴, 의미, 영적 상징을 가지고 있습니다.

| 소리 | 히브리어 | 패턴 | 의미 |
|------|---------|------|------|
| **Tekiah** | תְּקִיעָה | 단일 긴 소리 | 왕의 대관, 선포 |
| **Shevarim** | שְׁבָרִים | 3개의 짧은 소리 | 흐느낌, 탄식 |
| **Teruah** | תְּרוּעָה | 9개의 빠른 소리 | 경보, 울음 |
| **Tekiah Gedolah** | תְּקִיעָה גְּדוֹלָה | 매우 긴 소리 | 최종 선포, 승리 |

### 🎧 소리 감상 가이드
- **Tekiah**: "빠-아---" (승리의 팡파르)
- **Shevarim**: "우-우-우-" (흐느끼는 울음)
- **Teruah**: "투투투투투투투투투" (급박한 알람)
- **역사**: 고대에는 Shevarim과 Teruah의 구분이 모호했으나, 탈무드 시대에 명확히 규정되었습니다.

<audio-player src="/audio/tekiah.wav" label="Tekiah (테키아) - 왕의 대관식" />
<audio-player src="/audio/shevarim.wav" label="Shevarim (쉐바림) - 회개의 흐느낌" />
<audio-player src="/audio/teruah.wav" label="Teruah (테루아) - 영적 경보" />

---

## 4.2 Tekiah (תְּקִיעָה)

### 정의와 특성

Tekiah는 단일하고 긴 소리로, 쇼파르의 가장 기본적인 소리입니다.

| 특성 | 설명 |
|------|------|
| **패턴** | 하나의 연속된 소리 |
| **길이** | 약 3-4초 (최소 1초) |
| **음색** | 안정적이고 명확한 |
| **시작** | 깨끗하고 확실하게 |
| **끝** | 명확하게 끊기 |

### 영적 의미

Tekiah는 다음을 상징합니다:

1. **왕의 대관식**: 하나님을 왕으로 선포
2. **주의 환기**: 영혼을 깨우는 소리
3. **선포**: 중요한 메시지 전달
4. **시작**: 새로운 시작의 알림

### 연주 기법

| 단계 | 동작 | 주의사항 |
|------|------|----------|
| 1 | 깊은 호흡 | 충분한 공기 확보 |
| 2 | 앙부슈르 형성 | 안정적인 위치 |
| 3 | 깨끗한 시작 | 혀로 "tu" 발음하듯 |
| 4 | 일정한 유지 | 음색 변화 없이 |
| 5 | 명확한 종료 | 갑자기 끊기 |

### 연습 방법

#### 연습 1: 기본 Tekiah
1. 3초 동안 안정적인 소리 유지
2. 시작과 끝의 명확성 확인
3. 10회 반복, 일관성 체크

#### 연습 2: 길이 확장
1. 3초 → 4초 → 5초로 점진적 확장
2. 음색 유지하며 길이 늘리기
3. 무리하지 않고 자연스럽게

### ⚠️ 흔한 실수 (Common Mistakes)
1.  **끝이 처짐**: 소리 끝이 "으-음" 하고 내려가면 안 됩니다. 딱 끊어야 합니다.
2.  **음정 불안**: 호흡이 부족하면 중간에 음정이 떨어집니다.
3.  **너무 짧음**: 1초 미만은 Tekiah로 인정되지 않습니다. 최소 3초를 유지하십시오.

---

## 4.3 Shevarim (שְׁבָרִים)

### 정의와 특성

Shevarim은 "부서진 것들"이라는 의미로, 3개의 연결된 짧은 소리입니다.

| 특성 | 설명 |
|------|------|
| **패턴** | 3개의 짧은 소리 |
| **각 소리 길이** | 약 1초씩 |
| **총 길이** | 약 3초 |
| **음색** | 흐느끼는 듯한 |
| **연결** | 한 호흡으로 연결 |

### 영적 의미

Shevarim은 다음을 상징합니다:

1. **흐느낌**: 회개의 눈물
2. **부서진 마음**: 겸손한 영혼
3. **탄식**: 죄에 대한 슬픔
4. **갈망**: 하나님을 향한 그리움

### 연주 기법

| 단계 | 동작 | 주의사항 |
|------|------|----------|
| 1 | 한 번의 깊은 호흡 | 3음 모두 커버할 양 |
| 2 | 첫 번째 음 | 약 1초, 명확히 |
| 3 | 짧은 끊김 | 혀로 분리 |
| 4 | 두 번째 음 | 첫 음과 동일 |
| 5 | 짧은 끊김 | 동일한 방식 |
| 6 | 세 번째 음 | 마지막 음 |

### 3음의 균일성

| 요소 | 목표 |
|------|------|
| 길이 | 3음 모두 동일 |
| 음정 | 3음 모두 동일 |
| 음량 | 3음 모두 동일 |
| 간격 | 끊김 시간 동일 |

### 연습 방법

#### 연습 1: 분리 연습
1. 각 음을 개별적으로 연습
2. 1초씩 정확히 유지
3. 메트로놈 활용 (60 BPM)

#### 연습 2: 연결 연습
1. 3음을 한 호흡으로 연결
2. 균일한 간격 유지
3. 녹음 후 자가 평가

### 🌍 전통별 차이 (Traditions)
- **아쉬케나지**: 3개의 소리가 뚝뚝 끊어지며 비탄에 잠긴 소리. "U-Ah, U-Ah, U-Ah"
- **세파르디**: 조금 더 리드미컬하고 빠름.
- **예멘**: 매우 길고 깊은 3번의 울림.

---

## 4.4 Teruah (תְּרוּעָה)

### 정의와 특성

Teruah는 "경보"라는 의미로, 최소 9개의 빠른 스타카토 소리입니다.

| 특성 | 설명 |
|------|------|
| **패턴** | 9개 이상의 빠른 소리 |
| **각 소리 길이** | 매우 짧음 (스타카토) |
| **총 길이** | 약 3초 |
| **음색** | 날카롭고 경쾌한 |
| **리듬** | 빠르고 균일한 |

### 전통별 차이
| 전통 | Teruah 스타일 |
|------|--------------|
| **아쉬케나지** | 9개의 빠른 스타카토 |
| **세파르디** | 떨리는 듯한 연속음 |
| **예멘** | 독특한 리듬 패턴 |

### 영적 의미

Teruah는 다음을 상징합니다:

1. **경보**: 영적 위험 경고
2. **울음**: 깊은 회개의 울음
3. **긴급함**: 즉각적 응답 요청
4. **전쟁**: 영적 전투의 신호

### 연주 기법

| 단계 | 동작 | 주의사항 |
|------|------|----------|
| 1 | 충분한 호흡 | 9음 이상 커버 |
| 2 | 혀 준비 | "tu-tu-tu" 준비 |
| 3 | 빠른 혀 움직임 | 일정한 속도 |
| 4 | 균일한 음 | 각 음 동일하게 |
| 5 | 명확한 분리 | 뭉개지지 않게 |

### 연습 방법

#### 연습 1: 느린 Teruah
1. 천천히 9음 연습
2. 각 음의 명확성 확인
3. 점진적으로 속도 증가

#### 연습 2: 메트로놈 연습
1. 60 BPM에서 시작
2. 박자당 3음씩
3. 점차 120 BPM까지

#### 연습 3: 카운팅 연습
1. 소리 내며 마음속으로 카운트
2. 정확히 9음 확인
3. 일관성 유지

### 👅 텅잉(Tonguing) 기술 상세
Teruah를 위해 혀는 **"Tu-Ku-Tu-Ku"** (더블 텅잉) 또는 **"Tu-Tu-Tu-Tu"** (싱글 텅잉)를 빠르게 반복해야 합니다.
- **팁**: 혀끝이 윗니 뒤쪽 잇몸을 가볍게 치듯이 움직이십시오.
- **주의**: 목구멍으로 소리를 끊으려 하지 마십시오(Throat stopping). 혀를 써야 명확합니다.

---

## 4.5 Tekiah Gedolah (תְּקִיעָה גְּדוֹלָה)

### 정의와 특성

Tekiah Gedolah는 "큰 Tekiah"로, 가능한 한 길게 유지하는 소리입니다.

| 특성 | 설명 |
|------|------|
| **패턴** | 하나의 매우 긴 소리 |
| **최소 길이** | 9초 이상 |
| **권장 길이** | 가능한 한 길게 |
| **음색** | Tekiah와 동일 |
| **위치** | 시리즈의 마지막 |

### 영적 의미

Tekiah Gedolah는 다음을 상징합니다:

1. **최종 선포**: 의식의 완결
2. **승리**: 하나님의 최종 승리
3. **영원**: 끝없는 하나님의 통치
4. **메시아**: 메시아 시대의 도래

### 연주 기법

| 단계 | 동작 | 주의사항 |
|------|------|----------|
| 1 | 최대한 깊은 호흡 | 폐 전체 활용 |
| 2 | 안정적 시작 | Tekiah와 동일 |
| 3 | 효율적 공기 사용 | 낭비 없이 |
| 4 | 음색 유지 | 끝까지 일정하게 |
| 5 | 자연스러운 종료 | 공기 소진 시 |

### 지속 시간 향상
| 수준 | 목표 시간 | 훈련 기간 |
|------|----------|----------|
| 초급 | 9초 | 1-2주 |
| 중급 | 15초 | 1개월 |
| 고급 | 20초+ | 3개월+ |

### 연습 방법

#### 연습 1: 시간 측정
1. 스톱워치로 현재 최대 시간 측정
2. 매일 기록
3. 점진적 향상 추적

#### 연습 2: 호흡 효율화
1. 최소한의 공기로 소리 유지
2. 불필요한 긴장 제거
3. 공기 누출 최소화

#### 연습 3: 단체 Tekiah Gedolah
1. 여러 명이 함께 시작
2. 가장 오래 유지하는 사람까지
3. 자연스러운 페이드 아웃 효과

### 🌬️ 폐활량 향상 훈련
1.  **수영 (잠영)**: 물속에서 숨을 참으며 이동하는 훈련이 폐활량에 최고입니다.
2.  **풍선 불기**: 두꺼운 풍선을 한 번의 호흡으로 터뜨릴 듯이 부는 연습.
3.  **단체 조화**: 여러 명이 불 때는 **'릴레이 기법'**을 씁니다. 한 사람이 숨이 찰 때 옆 사람이 치고 나와 끊어지지 않게 만듭니다.

---

## 4.6 소리 조합과 시리즈

### 기본 시리즈 구조

유대 전통에서 쇼파르 소리는 특정 패턴으로 조합됩니다:

| 시리즈 | 구성 | 총 소리 수 |
|--------|------|-----------|
| **TaSHRaT** | Tekiah - Shevarim-Teruah - Tekiah | 1 + (3+9) + 1 = 14 |
| **TaSHaT** | Tekiah - Shevarim - Tekiah | 1 + 3 + 1 = 5 |
| **TaRaT** | Tekiah - Teruah - Tekiah | 1 + 9 + 1 = 11 |

### 로쉬 하샤나 전체 순서

전통적으로 로쉬 하샤나에는 100회(또는 101회)의 쇼파르 소리가 울립니다:

| 세션 | 시리즈 | 반복 | 소리 수 |
|------|--------|------|---------|
| Tekiot Meyushav | TaSHRaT x3, TaSHaT x3, TaRaT x3 | 3세트 | 30 |
| Tekiot Meumad | 동일 | 3세트 | 30 |
| Tekiot D'Malchuyot | TaSHRaT x3, TaSHaT x3, TaRaT x3 | 1세트 | 10 |
| Tekiot D'Zichronot | 동일 | 1세트 | 10 |
| Tekiot D'Shofarot | 동일 | 1세트 | 10 |
| 추가 Tekiot | 다양 | - | 10 |
| **총계** | | | **100** |

### 🕍 의식의 세션별 의미
1.  **Meyushav (앉아서 듣는 소리)**: 말씀 낭독 전. 개별적인 회개를 촉구.
2.  **Meumad (서서 듣는 소리)**: 무사프(Musaf) 기도 중. 공동체 전체의 결단.
3.  **Malchuyot (왕권)**: 하나님을 왕으로 인정.
4.  **Zichronot (기억)**: 언약을 기억해 달라는 호소.
5.  **Shofarot (계시)**: 시나이 산의 계시와 미래의 구원.

---

## 4.7 의식에서의 역할

### Ba'al Tekiah (בַּעַל תְּקִיעָה)

Ba'al Tekiah는 "쇼파르 부는 자"로, 의식에서 쇼파르를 담당하는 사람입니다.

| 자격 요건 | 설명 |
|----------|------|
| **기술적** | 모든 소리를 정확히 구사 |
| **영적** | 경건하고 준비된 마음 |
| **신체적** | 건강하고 지구력 있음 |
| **지식** | 의식 순서 완벽 숙지 |

### Makri (מַקְרִיא)

Makri는 "부르는 자"로, Ba'al Tekiah에게 어떤 소리를 낼지 알려주는 역할입니다.

| 역할 | 설명 |
|------|------|
| 소리 호명 | 각 소리 이름 선창 |
| 순서 관리 | 전체 순서 진행 |
| 실수 교정 | 필요시 재시도 지시 |

### 🤝 Ba'al Tekiah와 Makri의 협력
- **신호**: Makri가 소리 이름을 부르면, 1-2초 후 Ba'al Tekiah가 붑니다.
- **실수 대처**:
- Ba'al Tekiah가 소리를 잘못 내거나 삑사리가 나면?
- Makri는 당황하지 않고 **"다시(Again)"**라고 말하거나 눈짓을 줍니다.
- Ba'al Tekiah는 심호흡을 한 번 하고, **처음부터 다시** 그 소리를 붑니다. (전체 시리즈가 아닌 해당 소리만)
`,
    "5": `
## 5.1 음색 심화

### 전문가 수준의 음색

전문가 수준의 쇼파르 연주는 단순히 소리를 내는 것을 넘어, 영혼을 울리는 음색을 만들어냅니다.

| 수준 | 특징 | 청중 반응 |
|------|------|----------|
| 초급 | 소리가 남 | 인식 |
| 중급 | 안정적인 소리 | 주목 |
| 고급 | 풍부한 음색 | 감동 |
| 전문가 | 영적 울림 | 변화 |

### 음색의 요소

| 요소 | 설명 | 개선 방법 |
|------|------|----------|
| **공명(Resonance)** | 뿔 전체의 울림 | 적절한 공기압 |
| **깊이(Depth)** | 소리의 풍부함 | 이완된 앙부슈르 |
| **명확성(Clarity)** | 깨끗한 음질 | 정확한 입술 위치 |
| **투사(Projection)** | 멀리 퍼지는 힘 | 횡격막 지지 |

### 👂 전문가 연주 분석 (Case Study)
- **Amit Sofer**: 클래식 트럼펫 기술을 응용하여 매우 깨끗하고 정제된 소리를 냄. (오케스트라 협연 참고)
- **Robert Weinger**: 거친 '야성'과 영적인 깊이를 강조. 배음(Overtone)을 풍부하게 사용.
- **자기 적용**: 나는 어떤 스타일을 추구하는가? 깨끗함(Clean) vs 야성(Raw)?

---

## 5.2 다이내믹 조절

### 음량 범위

쇼파르도 다른 악기처럼 다양한 음량으로 연주할 수 있습니다:

| 다이내믹 | 기호 | 설명 | 사용 상황 |
|----------|------|------|----------|
| Pianissimo | pp | 매우 여리게 | 친밀한 순간 |
| Piano | p | 여리게 | 명상적 분위기 |
| Mezzo Piano | mp | 조금 여리게 | 일반적 시작 |
| Mezzo Forte | mf | 조금 세게 | 표준 연주 |
| Forte | f | 세게 | 선포, 경고 |
| Fortissimo | ff | 매우 세게 | 클라이맥스 |

### 다이내믹 변화 기법

| 변화 | 설명 | 기법 |
|------|------|------|
| **Crescendo** | 점점 크게 | 공기압 점진적 증가 |
| **Decrescendo** | 점점 작게 | 공기압 점진적 감소 |
| **Sforzando** | 갑자기 강하게 | 순간적 공기 분출 |
| **Subito Piano** | 갑자기 여리게 | 즉각적 공기압 감소 |

### 연습 방법

#### 연습 1: 다이내믹 스케일
1. pp에서 시작
2. 8박에 걸쳐 ff까지 crescendo
3. 8박에 걸쳐 pp까지 decrescendo
4. 음색 유지하며 반복

#### 연습 2: 갑작스러운 변화
1. mf로 시작
2. 지휘 신호에 따라 즉시 변화
3. p ↔ f 빠른 전환 연습

### 🎵 앙상블에서의 다이내믹 룰
- **Solo**: 멜로디나 솔로 파트는 **mf** 이상으로 연주하여 뚫고 나오게 함.
- **Background**: 배경음 역할일 때는 **mp** 이하로 줄여 솔로를 받쳐줌.
- **Tutti (전체 합주)**: 지휘자의 양팔 벌림 폭에 비례하여 음량을 조절.

---

## 5.3 음정 조절

### 쇼파르의 음정

쇼파르는 자연 배음 계열(Natural Harmonic Series)을 따릅니다:

| 배음 | 상대 음정 | 난이도 |
|------|----------|--------|
| 1차 (기음) | 기본음 | 쉬움 |
| 2차 | 옥타브 위 | 중간 |
| 3차 | 옥타브 + 5도 | 어려움 |
| 4차 | 2옥타브 위 | 매우 어려움 |

### 음정 변화 기법

| 목표 | 앙부슈르 조절 | 공기압 |
|------|-------------|--------|
| 낮은 음 | 이완, 큰 구멍 | 적은 압력 |
| 높은 음 | 긴장, 작은 구멍 | 높은 압력 |

### 연습 방법

#### 연습 1: 기음 안정화
1. 가장 자연스러운 음 찾기
2. 30초간 안정적 유지
3. 음정 변화 없이 반복

#### 연습 2: 옥타브 점프
1. 기음에서 시작
2. 앙부슈르 조절로 옥타브 위로
3. 다시 기음으로
4. 깨끗한 전환 연습

### 🎹 배음(Harmonics)의 신비
쇼파르는 길이에 따라 낼 수 있는 자연 배음이 정해져 있습니다.
- **짧은 쇼파르**: 보통 기음(1차)과 옥타브(2차)까지만 가능.
- **긴 예멘 쇼파르**: 3차, 4차 배음(12도, 2옥타브)까지 가능하여 멜로디 연주가 가능함.
- **훈련**: 입술 구멍을 아주 작게 줄이고 공기 속도를 2배로 높여 고음을 뚫어보십시오.

---

## 5.4 지구력과 체력

### 장시간 연주의 도전

120명 나팔단의 행사에서는 장시간 연주가 요구될 수 있습니다:

| 도전 | 원인 | 대책 |
|------|------|------|
| 입술 피로 | 근육 과사용 | 휴식, 강화 훈련 |
| 호흡 고갈 | 폐활량 한계 | 호흡 효율화 |
| 집중력 저하 | 정신적 피로 | 명상, 휴식 |
| 어지러움 | 과호흡 | 호흡 조절 |

### 지구력 향상 훈련

#### 훈련 1: 점진적 시간 증가
| 주차 | 연속 연주 시간 | 휴식 |
|------|---------------|------|
| 1주 | 5분 | 5분 |
| 2주 | 10분 | 5분 |
| 3주 | 15분 | 5분 |
| 4주 | 20분 | 5분 |

#### 훈련 2: 입술 강화
1. 입술 버징 연습 확대
2. 저항 훈련 (작은 구멍으로 불기)
3. 매일 5분씩 추가

#### 훈련 3: 심폐 지구력
1. 유산소 운동 병행
2. 수영 특히 효과적
3. 호흡 운동 (요가, 명상)

### 💤 피로 관리와 회복 (Recovery)
- **쿨다운(Cool-down)**: 연주 후에는 반드시 입술을 '푸르르' 털어주어 긴장을 풀어야 합니다.
- **온찜질**: 입술이 너무 부었을 때는 따뜻한 수건으로 혈액순환을 돕습니다.
- **수분 섭취**: 입이 마르면 입술이 찢어질 수 있습니다. 물을 자주 마시십시오.

---

## 5.5 앙상블 기초

### 단체 연주의 원리

120명이 함께 연주할 때는 개인 기량 외에 **조화**가 핵심입니다.

| 요소 | 개인 연주 | 앙상블 연주 |
|------|----------|------------|
| 시작 | 자유롭게 | 동시에 |
| 종료 | 자유롭게 | 동시에 |
| 음량 | 최대한 | 조절하여 |
| 음색 | 개성적 | 통일감 있게 |

### 동기화 (Synchronization)

| 요소 | 방법 | 연습 |
|------|------|------|
| **시작 동기화** | 지휘 신호 따르기 | 카운트다운 연습 |
| **종료 동기화** | 지휘 신호 따르기 | 컷오프 연습 |
| **리듬 동기화** | 공통 템포 유지 | 메트로놈 연습 |
| **호흡 동기화** | 함께 숨쉬기 | 그룹 호흡 연습 |

### 🧩 소그룹 연습: '피라미드 쌓기'
1.  **베이스(Base)**: 저음 파트 3명이 롱톤 유지.
2.  **미들(Middle)**: 그 위에 중간음 파트 3명이 3도 위 화음 쌓기.
3.  **탑(Top)**: 고음 파트 3명이 옥타브 위 소리 얹기.
4.  **목표**: 서로의 소리를 들으며 완벽한 균형(Balance) 찾기.

---

## 5.6 대규모 앙상블 (120명)

### 조직 구조

120명의 나팔단을 효과적으로 운영하기 위한 구조:

\`\`\`
나팔단장 (1명)
│
├── 부단장 (2명)
│       │
│       ├── 섹션 리더 A (1명) ─── 단원 30명
│       ├── 섹션 리더 B (1명) ─── 단원 30명
│       ├── 섹션 리더 C (1명) ─── 단원 30명
│       └── 섹션 리더 D (1명) ─── 단원 30명
│
└── 지원팀
├── 악기 관리
├── 음향 담당
└── 행사 진행
\`\`\`

### 섹션별 역할

| 섹션 | 위치 | 역할 |
|------|------|------|
| A | 전면 중앙 | 리드, 시작 신호 |
| B | 전면 좌우 | 서포트, 음량 보강 |
| C | 후면 중앙 | 깊이감 추가 |
| D | 후면 좌우 | 공간감 확장 |

### 배치 원리

| 고려사항 | 권장 사항 |
|----------|----------|
| **경험 수준** | 경험자를 전면에 |
| **음량** | 강한 연주자를 후면에 |
| **음색** | 유사한 음색끼리 그룹 |
| **시야** | 모든 단원이 지휘자 볼 수 있게 |

### 👑 섹션 리더(Section Leader)의 역할
- **음악적 리더**: 자기 섹션의 시작과 끝을 책임집니다.
- **수신호 전달**: 지휘자의 신호가 안 보일 수 있는 뒷줄 단원들에게 신호를 전달(Relay)합니다.
- **분위기 메이커**: 대기 시간이 길어질 때 단원들의 텐션을 유지시킵니다.

---

## 5.7 지휘와 신호 체계
### 기본 지휘 신호

| 신호 | 동작 | 의미 |
|------|------|------|
| **준비** | 양손 들어올림 | 악기 준비 |
| **호흡** | 손 위로 올림 | 함께 숨쉬기 |
| **시작** | 손 내림 | 소리 시작 |
| **유지** | 손 수평 유지 | 소리 지속 |
| **종료** | 손 모음 | 소리 끝 |
| **크게** | 손 벌림 | 음량 증가 |
| **작게** | 손 모음 | 음량 감소 |

### 소리별 신호

| 소리 | 준비 신호 | 시작 신호 |
|------|----------|----------|
| Tekiah | 손가락 1개 | 내림 |
| Shevarim | 손가락 3개 | 3회 내림 |
| Teruah | 손 흔들기 | 빠른 흔들기 |
| Tekiah Gedolah | 양손 넓게 | 천천히 내림 |

### 🚨 비상 신호 (Emergency Signals)
- **주먹 꽉 쥐기**: "즉시 중단(Cut-off)!" (돌발 상황 발생 시)
- **검지로 입 가리기**: "소리 줄여(Hush)!"
- **손바닥으로 머리 치기**: "처음으로 돌아가(Da Capo)!"

---

## 5.8 리허설 계획

### 단계별 리허설

| 단계 | 내용 | 인원 | 기간 |
|------|------|------|------|
| 1단계 | 개인 기량 점검 | 개인 | 2주 |
| 2단계 | 소그룹 연습 | 10명 | 2주 |
| 3단계 | 섹션 연습 | 30명 | 2주 |
| 4단계 | 전체 합동 | 120명 | 2주 |
| 5단계 | 드레스 리허설 | 120명 | 1주 |

### 리허설 체크리스트

#### 개인 점검
- [ ] 4가지 소리 정확도
- [ ] 지속 시간 (Tekiah Gedolah 9초+)
- [ ] 음색 품질
- [ ] 악기 상태

#### 그룹 점검
- [ ] 시작/종료 동기화
- [ ] 음량 균형
- [ ] 음색 조화
- [ ] 지휘 신호 반응

### 🗓️ 리허설 일정표 (Sample)
- **19:00 - 19:20**: 워밍업 및 개인 튜닝
- **19:20 - 20:00**: 섹션별 파트 연습 (리더 주도)
- **20:00 - 20:10**: 휴식
- **20:10 - 21:00**: 전체 런스루 (Run-through)
- **21:00 - 21:10**: 피드백 및 공지

---

## 5.9 공연 준비

### 행사 전 체크리스트

#### D-7 (1주 전)
- [ ] 전체 리허설 완료
- [ ] 악기 최종 점검
- [ ] 배치 확정
- [ ] 음향 테스트

#### D-1 (전날)
- [ ] 현장 리허설
- [ ] 동선 확인
- [ ] 비상 계획 공유
- [ ] 충분한 휴식

#### D-Day (당일)

- [ ] 조기 도착 (2시간 전)
- [ ] 워밍업
- [ ] 최종 점검
- [ ] 정신적 준비

### 🎬 공연 후 정리 (Post-Event)
1.  **악기 점검**: 침을 제거하고 건조되었는지 확인 후 케이스에 보관.
2.  **분실물 확인**: 마우스피스, 악보 등 개인 물품 챙기기.
3.  **감사 인사**: 수고한 동료들과 포옹하며 격려하기. ("Chazak U'Baruch" - 강하고 복되소서)
`,
    "6": `
## 6.1 쇼파르 연주자의 마음

### Ba'al Tekiah의 영적 자세

쇼파르를 부는 것은 단순한 음악 연주가 아닙니다. Ba'al Tekiah(쇼파르 부는 자)는 하나님과 회중 사이의 **영적 중재자** 역할을 합니다.

| 자세 | 설명 | 실천 방법 |
|------|------|----------|
| **겸손** | 자신이 아닌 하나님을 높임 | 연주 전 기도 |
| **경건** | 거룩한 임무 인식 | 정결한 생활 |
| **헌신** | 최선을 다함 | 철저한 준비 |
| **사랑** | 회중을 섬김 | 봉사의 마음 |

### 연주 전 영적 준비

| 시기 | 준비 내용 |
|------|----------|
| **한 달 전** | 엘룰 월 묵상, 회개의 시간 |
| **일주일 전** | 집중 기도, 금식 고려 |
| **전날** | 정결 의식, 충분한 휴식 |
| **당일 아침** | 기도, 묵상, 마음 준비 |
| **직전** | 짧은 기도, 집중 |

### 📜 영적 준비 기도문 (Ba'al Tekiah's Prayer)
> "우주를 창조하신 왕이시여, 당신께서 우리에게 쇼파르 소리를 들으라 명하셨습니다.
> 비록 저는 부족하고 입술이 둔한 자이오나, 아브라함과 이삭의 공로를 기억하사 저를 자비로 덮어 주소서.
> 
> 제 호흡이 당신의 호흡이 되게 하시고, 제 소리가 하늘 문을 여는 열쇠가 되게 하소서.
> 저를 통해 나오는 이 소리가 회중의 마음을 찢고 당신께로 돌이키게 하소서.
> 사탄의 고소를 잠재우시고, 오직 당신의 자비와 사랑만이 이 공간에 가득하게 하소서.
> 
> 제 자아는 사라지고, 오직 당신의 목소리만 남기를 원하나이다. 아멘."

### 🧘‍♂️ 묵상 가이드 (Kavanah)
1.  **눈을 감고 호흡 집중**: 3번 깊게 호흡하며 마음의 소음을 잠재웁니다.
2.  **아케다 상상**: 이삭이 묶여 있던 모리아 산을 떠올리십시오. 그 순종의 자리에 내가 있음을 고백합니다.
3.  **왕의 대관식**: 지금 내가 부는 나팔 소리가 왕의 행차를 알리는 팡파르임을 인식하십시오.
4.  **회중 품기**: 내 뒤에 서 있는 수많은 영혼들의 아픔과 기도를 내 뿔에 담아 하늘로 쏘아 올린다고 상상하십시오.

---

## 6.2 쇼파르의 영적 의미 심화

### Saadia Gaon의 10가지 이유

10세기 유대 현자 Saadia Gaon이 정리한 쇼파르의 10가지 의미:

| 번호 | 의미 | 적용 |
|------|------|------|
| 1 | 세상 창조 상기 | 하나님의 주권 인정 |
| 2 | 새해 시작 상기 | 새로운 시작의 기회 |
| 3 | 시나이 산 경험 상기 | 토라에 대한 헌신 |
| 4 | 선지자들의 말씀 상기 | 예언의 성취 기대 |
| 5 | 성전 파괴 상기 | 회복을 향한 소망 |
| 6 | 이삭 번제 상기 | 대속의 은혜 감사 |
| 7 | 하나님에 대한 경외 | 거룩한 두려움 |
| 8 | 심판의 날 경외 | 삶의 점검 |
| 9 | 유배자 귀환 믿음 | 이스라엘 회복 소망 |
| 10 | 죽은 자 부활 믿음 | 영원한 생명 소망 |

### 쇼파르 소리의 영적 상징

| 소리 | 영적 의미 | 적용 |
|------|----------|------|
| **Tekiah** | 왕의 대관, 하나님의 주권 선포 | 하나님을 왕으로 인정 |
| **Shevarim** | 부서진 마음, 회개의 흐느낌 | 죄를 고백하고 돌이킴 |
| **Teruah** | 영적 경보, 깨어남의 부름 | 영적 각성과 준비 |
| **Tekiah Gedolah** | 최종 승리, 메시아의 도래 | 소망과 기대 |

---

## 🎓 커리큘럼 완료

축하합니다! 모든 모듈을 완료하셨습니다.

이제 당신은:
- ✅ 쇼파르의 역사와 영적 의미를 깊이 이해합니다
- ✅ 4가지 전통 소리를 정확히 구사할 수 있습니다
- ✅ 120명 앙상블을 이끌 준비가 되었습니다
- ✅ 나팔단장으로서의 리더십을 갖추었습니다

> **"나팔 소리를 아는 백성은 복이 있나니 여호와여 그들이 주의 얼굴 빛 안에서 다니리이다"**
> — 시편 89:15
`
  };
  return contents[id] || "Content not found.";
}

function getKoreanCheckpoints(id: string) {
  const checkpoints: Record<string, string[]> = {
    "1": ["쇼파르의 어원과 의미 이해", "성경적 역사 타임라인 파악", "아케다 사건의 영적 의미 묵상", "성전 시대와 현대의 쇼파르 역할 비교"],
    "2": ["허용되는 뿔 재료 구분", "쇼파르 종류별 특징 이해", "올바른 쇼파르 선택 및 관리법 숙지", "단체용 악기 관리 시스템 이해"],
    "3": ["소리 생성 원리 이해", "횡격막 호흡법 습득", "올바른 앙부슈르 형성", "안정적인 첫 소리 내기"],
    "4": ["4가지 전통 소리(Tekiah, Shevarim, Teruah, Tekiah Gedolah) 구분", "각 소리의 영적 의미 이해", "정확한 연주 기법 습득", "로쉬 하샤나 의식 순서 파악"],
    "5": ["전문가 수준의 음색 개발", "다이내믹 및 음정 조절 능력 향상", "앙상블 연주 원리 이해", "지휘 신호 숙지 및 반응"],
    "6": ["Ba'al Tekiah의 영적 자세 확립", "나팔단장의 리더십 역량 강화", "행사 준비 및 위기 대처 능력 함양", "지속적 성장 계획 수립"]
  };
  return checkpoints[id] || [];
}

function getEnglishContent(id: string, title: string, subtitle: string) {
  const contents: Record<string, string> = {
    "1": `
## 1.1 What is a Shofar?

### Definition and Etymology

The Shofar (שׁוֹפָר) is an ancient wind instrument used in Israel, primarily made from a ram's horn. The Hebrew root "שָׁפַר (shaphar)" means "to beautify" or "to improve," connecting to the spiritual meaning that the shofar's sound purifies the soul and leads to repentance.

As the ancestor of modern brass instruments, the shofar produces sound solely through the vibration of the player's lips (embouchure), without valves or keys. Within this simplicity lies over 3,000 years of history.

### Hebrew Etymology Analysis
- **Shofar (שׁוֹפָר)**: Derived from root **Sh-P-R (ש.פ.ר)**
- Meaning: "to beautify," "to improve," "to polish"
- Interpretation: The shofar's sound is not merely instrumental music, but a calling to polish our conduct and beautify our souls.
- **Keren (קֶרֶן)**: Generally means 'horn,' but also symbolizes 'radiance' and 'power.'

### Comparison with Ancient Instruments
- The shofar is one of the oldest instruments in human history.
- Distinguished from **Hatzotzrah (silver trumpet)**:
- Silver trumpet: An instrument forged by human skill (human craftsmanship)
- Shofar: A horn from God's created animal (God's creation)
- This signifies that the shofar represents God's natural sound and the soul's cry rather than human artistry.

---

## 1.2 The Shofar in Scripture

### First Appearance: Mount Sinai (Exodus 19:16-19)

The shofar first appears in Scripture at Mount Sinai when the Torah was given. This shofar sound proclaimed God's presence and led the Israelites to awe and trembling.

> "On the morning of the third day there were thunders and lightnings and a thick cloud on the mountain and a very loud **trumpet blast**, so that all the people in the camp trembled." (Exodus 19:16)

### Key Biblical Passages

| Passage | Content | Meaning |
|---------|---------|---------|
| Exodus 19:16-19 | Sinai revelation | Proclamation of God's presence |
| Leviticus 23:24 | Feast of Trumpets (Rosh Hashanah) | Beginning of the new year |
| Leviticus 25:9 | Jubilee proclamation | Freedom and liberation |
| Joshua 6:4-20 | Fall of Jericho | Declaration of victory |
| Judges 7:22 | Gideon's battle | Signal for war |
| Psalm 47:5 | Praise and worship | King's coronation |
| Psalm 81:3 | Festival announcement | Calling holy assembly |
| Isaiah 27:13 | End-times trumpet | Restoration of Israel |

---

## 1.3 The Akedah and the Shofar Connection

### The Binding of Isaac (Genesis 22)

The fact that the shofar is made from a ram's horn is deeply connected to the ram that Abraham sacrificed instead of Isaac. This event is called "Akedah (עֲקֵדָה, binding)" in Jewish tradition and is key to understanding the shofar's spiritual meaning.

> "And Abraham lifted up his eyes and looked, and behold, behind him was a ram, **caught in a thicket by his horns**. And Abraham went and took the ram and offered it up as a burnt offering instead of his son." (Genesis 22:13)

### Theological Significance

The ram in the Akedah is a symbol of substitution. Every time we blow the shofar, we remember:

1. **God's provision**: God prepared the sacrifice at the moment of crisis
2. **The principle of substitution**: The innocent taking the place of the guilty
3. **The model of obedience**: Abraham's faith and Isaac's submission
4. **Messianic foreshadowing**: A preview of God's only Son's sacrifice

---

## 1.4 The Shofar in Temple Times

### First Temple Period (Solomon's Temple)

King David included the shofar in Temple worship, and Solomon's Temple used the shofar within an elaborate ritual system.

### Second Temple Period

During the Second Temple period, shofar use became more systematized. The shofar accompanied the morning and evening sacrifices and proclaimed the beginning of the Sabbath.

---

## 1.5 Modern Shofar Revival

### Contemporary Use

Today, the shofar is experiencing a revival worldwide. It is used not only in Jewish festivals but also in Messianic congregations and Christian worship.

### The 120 Trumpeters Vision

This curriculum is designed to prepare 120 shofar players for a special event in Israel 2026, following the biblical pattern of consecration and unity.

---

## 1.6 Spiritual Dimensions

### The Sound of Heaven

The shofar is more than an instrument—it is a prophetic tool that bridges heaven and earth. Its sound awakens souls, breaks spiritual barriers, and announces God's Kingdom.

### Personal Application

As you learn to play the shofar, remember that you are handling a sacred instrument with thousands of years of spiritual heritage. Approach each practice session with reverence and intention.
`,
    "2": `
## 2.1 Permitted Materials

### Kosher Horn Sources

According to Jewish law (Halacha), not all animal horns can be used for a shofar:

| Animal | Permitted | Reason |
|--------|-----------|--------|
| Ram (sheep) | ✅ Yes | Reminds of the Akedah |
| Goat | ✅ Yes | Kosher animal |
| Kudu/Antelope | ✅ Yes | Kosher animal |
| Cow/Bull | ❌ No | Reminds of the golden calf |
| Deer | ❌ No | Antler, not true horn |

### Material Characteristics
- Must be a true horn (keratin), not antler (bone)
- Cannot be artificially modified in ways that alter the sound
- Small repairs are permitted if they don't affect the sound

---

## 2.2 Types of Shofarot

### By Animal Source

**Ashkenazi (European) Style** - Ram's horn
- Curved shape
- Typically 10-14 inches
- Traditional in European Jewish communities

**Yemenite Style** - Kudu horn
- Long, spiraling shape
- Can reach 3+ feet in length
- Capable of producing more harmonics

**Moroccan Style** - Flat/wide shape
- Distinctive flattened curve
- Medium length
- Popular in Sephardic communities

---

## 2.3 Selecting Your Shofar

### Quality Indicators

1. **Sound Quality**: Should produce a clear, strong tone
2. **Structural Integrity**: No cracks or major defects
3. **Mouthpiece Fit**: Should match your embouchure size
4. **Size**: Consider your lung capacity and purpose

### Testing a Shofar
- Blow a sustained Tekiah
- Check for air leaks
- Listen for rattling or buzzing
- Ensure comfortable playing position

---

## 2.4 Care and Maintenance

### Regular Cleaning
1. After playing, remove moisture by blowing air through
2. Store in a dry place, away from heat
3. Occasionally clean with a mild solution
4. Avoid dropping or striking

### Long-term Storage
- Keep in a protective case
- Maintain moderate temperature
- Consider periodic oiling (food-grade mineral oil)

---

## 2.5 Group Instrument Management

### For the 120-member ensemble:
- Numbered inventory system
- Regular maintenance schedule
- Backup instruments available
- Proper storage facilities
`,
    "3": `
## 3.1 Sound Production Principles

### How the Shofar Produces Sound

The shofar produces sound through the vibration of the player's lips against the mouthpiece, creating pressure waves through the horn.

**Key Components:**
1. **Lip tension** creates the initial vibration
2. **Air pressure** sustains the sound
3. **Horn shape** amplifies and colors the tone

---

## 3.2 Breathing Techniques

### Diaphragmatic Breathing

Proper breathing is fundamental to good shofar playing:

1. **Inhale deeply** from your diaphragm, not chest
2. **Expand your belly** as you breathe in
3. **Control the exhale** with steady pressure
4. **Practice without the shofar** first

### Exercises
- Breathe in for 4 counts, hold for 4, exhale for 8
- Practice long, sustained exhalations
- Build lung capacity gradually

---

## 3.3 Forming the Embouchure

### Lip Position

The embouchure is how you position your lips on the mouthpiece:

1. **Firm but relaxed** lips
2. **Small aperture** in the center
3. **Corners pulled slightly back**
4. **Upper and lower lips balanced**

### Finding Your Position
- Start with a buzz (lips only, no shofar)
- Place shofar at corner of mouth or center
- Experiment to find your sweet spot

---

## 3.4 Producing Your First Sound

### Step-by-Step

1. Take a deep breath
2. Form your embouchure
3. Seal lips against mouthpiece
4. Apply steady air pressure
5. "Blow through" the horn, not at it

### Common Beginner Mistakes
- Too much pressure on lips
- Cheeks puffing out
- Inconsistent air flow
- Tension in shoulders and neck

---

## 3.5 Practice Exercises

### Daily Warm-up Routine
1. Deep breathing exercises (2 min)
2. Lip buzzing without shofar (2 min)
3. Mouthpiece buzzing (2 min)
4. Long tones on shofar (5 min)
5. Short bursts practice (3 min)

### Building Endurance
- Gradually increase practice time
- Rest when lips feel tired
- Hydrate frequently
`,
    "4": `
## 4.1 Overview of Traditional Sounds

### The Four Sounds

Jewish tradition prescribes four distinct shofar sounds:

| Sound | Character | Meaning |
|-------|-----------|---------|
| **Tekiah** | One long blast | Declaration/Proclamation |
| **Shevarim** | Three medium wails | Broken heart/Weeping |
| **Teruah** | Nine short blasts | Alarm/Awakening |
| **Tekiah Gedolah** | Extended long blast | Final victory |

---

## 4.2 Tekiah (תְּקִיעָה)

### The Straight Blast

Tekiah is a strong, continuous sound symbolizing the proclamation of God's sovereignty.

**Technique:**
1. Deep breath
2. Strong, steady air flow
3. Maintain consistent pitch
4. Clear start and end
5. Duration: 2-3 seconds minimum

**Practice Tips:**
- Focus on clean attacks
- Keep the sound steady, not wavering
- End deliberately, not fading

---

## 4.3 Shevarim (שְׁבָרִים)

### The Broken Sounds

Shevarim consists of three medium wailing sounds, representing the broken cries of repentance.

**Technique:**
1. Three distinct but connected blasts
2. Each blast: about 1 second
3. Brief pause between each
4. Sound like weeping or sighing

**Practice Tips:**
- Practice the "wailing" quality
- Keep consistent pitch throughout
- Make the three parts clearly distinguishable

---

## 4.4 Teruah (תְּרוּעָה)

### The Alarm Sound

Teruah is a series of nine (or more) very short, staccato blasts, sounding an alarm.

**Technique:**
1. Nine quick, sharp blasts
2. Tongue articulation (like "tu-tu-tu")
3. Rapid succession
4. Same pitch throughout

**Practice Tips:**
- Start slowly, increase speed
- Keep each note clean
- Maintain breath support

---

## 4.5 Tekiah Gedolah (תְּקִיעָה גְּדוֹלָה)

### The Great Blast

Tekiah Gedolah is an extended Tekiah, held as long as possible, symbolizing final victory and the coming of Messiah.

**Duration Goals:**
| Level | Target Time |
|-------|-------------|
| Beginner | 9 seconds |
| Intermediate | 15 seconds |
| Advanced | 20+ seconds |

---

## 4.6 Sound Combinations and Series

### Traditional Patterns

| Series | Components | Total Sounds |
|--------|------------|--------------|
| TaSHRaT | Tekiah - Shevarim-Teruah - Tekiah | 14 |
| TaSHaT | Tekiah - Shevarim - Tekiah | 5 |
| TaRaT | Tekiah - Teruah - Tekiah | 11 |
`,
    "5": `
## 5.1 Advanced Tone Development

### Expert-Level Sound Quality

Expert shofar playing goes beyond simply producing sound to creating a tone that moves the soul.

| Level | Characteristic | Audience Response |
|-------|----------------|-------------------|
| Beginner | Sound produced | Awareness |
| Intermediate | Stable sound | Attention |
| Advanced | Rich tone | Moved |
| Expert | Spiritual resonance | Transformation |

---

## 5.2 Dynamic Control

### Volume Range

The shofar can be played at various dynamics:

| Dynamic | Symbol | Description |
|---------|--------|-------------|
| Pianissimo | pp | Very soft |
| Piano | p | Soft |
| Mezzo Piano | mp | Moderately soft |
| Mezzo Forte | mf | Moderately loud |
| Forte | f | Loud |
| Fortissimo | ff | Very loud |

### Changing Dynamics
- **Crescendo**: Gradually louder
- **Decrescendo**: Gradually softer
- Control comes from air pressure, not embouchure tension

---

## 5.3 Pitch Control

### Natural Harmonics

The shofar follows the natural harmonic series:

| Harmonic | Relative Pitch | Difficulty |
|----------|----------------|------------|
| 1st (Fundamental) | Base note | Easy |
| 2nd | Octave above | Medium |
| 3rd | Octave + 5th | Difficult |
| 4th | Two octaves | Very difficult |

---

## 5.4 Endurance Training

### Building Stamina

For extended performances with 120 players:

| Challenge | Cause | Solution |
|-----------|-------|----------|
| Lip fatigue | Muscle overuse | Rest, strengthening |
| Breath depletion | Limited capacity | Efficiency training |
| Concentration loss | Mental fatigue | Meditation, rest |

---

## 5.5 Ensemble Basics

### Playing Together

When 120 players perform together, **harmony** is more important than individual skill.

| Element | Solo Playing | Ensemble Playing |
|---------|--------------|------------------|
| Start | Freely | Together |
| End | Freely | Together |
| Volume | Maximum | Balanced |
| Tone | Individual | Unified |

---

## 5.6 Large Ensemble (120 Players)

### Organization Structure

For effective management of 120 trumpeters:

- 1 Director
- 2 Assistant Directors
- 4 Section Leaders (30 each)
- Support Team (equipment, sound, coordination)

---

## 5.7 Conducting and Signals

### Basic Conducting Signals

| Signal | Action | Meaning |
|--------|--------|---------|
| Prepare | Arms up | Ready instruments |
| Breathe | Hand up | Inhale together |
| Start | Hand down | Begin sound |
| Hold | Hand level | Continue |
| Stop | Close hand | End sound |

---

## 5.8 Rehearsal Planning

### Staged Rehearsals

| Stage | Focus | Size | Duration |
|-------|-------|------|----------|
| 1 | Individual skills | Individual | 2 weeks |
| 2 | Small group | 10 players | 2 weeks |
| 3 | Section | 30 players | 2 weeks |
| 4 | Full ensemble | 120 players | 2 weeks |
| 5 | Dress rehearsal | 120 players | 1 week |
`,
    "6": `
## 6.1 The Heart of a Shofar Player

### Spiritual Posture of the Ba'al Tekiah

Blowing the shofar is not mere musical performance. The Ba'al Tekiah (shofar blower) serves as a **spiritual mediator** between God and the congregation.

| Attitude | Description | Practice |
|----------|-------------|----------|
| **Humility** | Elevating God, not self | Prayer before playing |
| **Reverence** | Recognizing the sacred duty | Pure living |
| **Dedication** | Giving one's best | Thorough preparation |
| **Love** | Serving the congregation | Heart of service |

### Spiritual Preparation Before Playing

| Timing | Preparation |
|--------|-------------|
| One month before | Elul month meditation, time of repentance |
| One week before | Focused prayer, consider fasting |
| Day before | Purification ritual, sufficient rest |
| Day of event | Prayer, meditation, heart preparation |
| Just before | Brief prayer, focus |

---

## 6.2 Deeper Spiritual Meaning of the Shofar

### Saadia Gaon's 10 Reasons

The 10th-century Jewish sage Saadia Gaon compiled 10 meanings of the shofar:

| Number | Meaning | Application |
|--------|---------|-------------|
| 1 | Remember world's creation | Acknowledge God's sovereignty |
| 2 | Remember the new year | Opportunity for new beginning |
| 3 | Remember Sinai | Commitment to Torah |
| 4 | Remember the prophets | Expect prophetic fulfillment |
| 5 | Remember Temple's destruction | Hope for restoration |
| 6 | Remember Isaac's sacrifice | Gratitude for substitution |
| 7 | Awe of God | Holy fear |
| 8 | Fear of judgment day | Life examination |
| 9 | Faith in exile's return | Hope for Israel's restoration |
| 10 | Faith in resurrection | Hope for eternal life |

---

## 🎓 Curriculum Complete

Congratulations! You have completed all modules.

You now:
- ✅ Deeply understand the shofar's history and spiritual meaning
- ✅ Can accurately produce the 4 traditional sounds
- ✅ Are prepared to lead a 120-member ensemble
- ✅ Have developed leadership qualities as a trumpeter

> **"Blessed are the people who know the joyful sound! They walk, O LORD, in the light of Your countenance."**
> — Psalm 89:15
`
  };
  return contents[id] || `# ${title}\n\n${subtitle}\n\n*Content coming soon*`;
}

function getEnglishCheckpoints(id: string) {
  const checkpoints: Record<string, string[]> = {
    "1": ["Understand shofar etymology and meaning", "Know biblical history timeline", "Meditate on Akedah's spiritual significance", "Compare Temple era and modern shofar use"],
    "2": ["Distinguish permitted horn materials", "Understand different shofar types", "Know proper shofar selection and care", "Understand group instrument management"],
    "3": ["Understand sound production principles", "Master diaphragmatic breathing", "Form proper embouchure", "Produce stable first sound"],
    "4": ["Distinguish four traditional sounds", "Understand spiritual meaning of each", "Master accurate playing techniques", "Know Rosh Hashanah ritual order"],
    "5": ["Develop expert-level tone", "Improve dynamics and pitch control", "Understand ensemble principles", "Master conducting signals"],
    "6": ["Establish Ba'al Tekiah's spiritual posture", "Strengthen leadership capabilities", "Develop event preparation and crisis response", "Create continuous growth plan"]
  };
  return checkpoints[id] || ["Understand key concepts", "Practice basic techniques", "Review spiritual meaning"];
}

function getChineseContent(id: string, title: string, subtitle: string) {
  const contents: Record<string, string> = {
    "1": `
## 1.1 什麼是羊角號？

### 定義與詞源

羊角號（שׁוֹפָר, Shofar）是古代以色列使用的管樂器，主要由公羊角製成。希伯來語詞根「שָׁפַר (shaphar)」意為「使美麗」、「改善」，這與羊角號聲音淨化靈魂、引導悔改的屬靈意義相連。

作為現代銅管樂器的祖先，羊角號僅通過演奏者嘴唇的振動（吹嘴技巧）發聲，沒有閥門或鍵。這種簡單中蘊含著超過3000年的歷史。

### 希伯來語詞源分析
- **Shofar (שׁוֹפָר)**：源自詞根 **Sh-P-R (ש.פ.ר)**
- 意義：「使美麗」、「改善」、「擦亮」
- 詮釋：羊角號的聲音不僅僅是樂器聲，而是呼召我們擦亮行為、美化靈魂。
- **Keren (קֶרֶן)**：通常指「角」，但也象徵「光輝」和「力量」。

### 與古代樂器的比較
- 羊角號是人類歷史上最古老的樂器之一。
- 與**銀號（Hatzotzrah）**的區別：
- 銀號：人類用金屬鍛造的樂器（人的技藝）
- 羊角號：神所創造動物的角（神的創造物）
- 這意味著羊角號代表神自然的聲音和靈魂的呼喊，而非人的技藝。

---

## 1.2 聖經中的羊角號

### 首次出現：西奈山（出埃及記 19:16-19）

羊角號在聖經中首次出現是在西奈山頒布律法的時刻。這羊角號聲宣告了神的同在，使以色列百姓敬畏戰兢。

> 「第三天早晨，山上有雷轟閃電和密雲，並且**角聲甚大**，營中的百姓盡都發顫。」（出埃及記 19:16）

### 重要聖經經文

| 經文 | 內容 | 意義 |
|------|------|------|
| 出埃及記 19:16-19 | 西奈山啟示 | 宣告神的同在 |
| 利未記 23:24 | 吹角節（猶太新年） | 新年的開始 |
| 利未記 25:9 | 禧年宣告 | 自由與釋放 |
| 約書亞記 6:4-20 | 耶利哥城陷落 | 勝利的宣告 |
| 士師記 7:22 | 基甸的戰爭 | 戰爭信號 |
| 詩篇 47:5 | 讚美與敬拜 | 君王加冕 |
| 詩篇 81:3 | 節期宣告 | 召集聖會 |
| 以賽亞書 27:13 | 末日號角 | 以色列復興 |

---

## 1.3 燔祭與羊角號的連結

### 以撒獻祭事件（創世記22章）

羊角號由公羊角製成，與亞伯拉罕代替以撒獻祭的公羊有深刻關聯。這事件在猶太傳統中稱為「捆綁（עֲקֵדָה, Akedah）」，是理解羊角號屬靈意義的關鍵。

> 「亞伯拉罕舉目觀看，不料，有一隻公羊，**兩角扣在稠密的小樹中**。亞伯拉罕就取了那隻公羊來，獻為燔祭，代替他的兒子。」（創世記 22:13）

### 神學意義

燔祭事件中的公羊是代贖的象徵。每當我們吹響羊角號，便記念：

1. **神的供應**：在危機時刻神預備了祭物
2. **代贖原則**：無辜者代替有罪者
3. **順服的典範**：亞伯拉罕的信心和以撒的順服
4. **彌賽亞預表**：神獨生子犧牲的預表

---

## 1.4 聖殿時代的羊角號

### 第一聖殿時期（所羅門聖殿）

大衛王將羊角號納入聖殿敬拜中，所羅門聖殿在精緻的儀式體系中使用羊角號。

### 第二聖殿時期

在第二聖殿時期，羊角號的使用更加系統化。羊角號伴隨早晚獻祭，並宣告安息日的開始。

---

## 1.5 現代羊角號復興

### 當代使用

如今，羊角號正在全球經歷復興。它不僅用於猶太節日，也用於彌賽亞會眾和基督教敬拜。

### 120人號角隊異象

本課程旨在為2026年以色列特別活動培訓120名羊角號演奏者，遵循聖經中分別為聖與合一的模式。

---

## 1.6 屬靈層面

### 天堂的聲音

羊角號不僅是樂器——它是連接天地的先知性工具。它的聲音喚醒靈魂、打破屬靈障礙、宣告神的國度。

### 個人應用

當你學習吹羊角號時，請記住你正在使用一件承載數千年屬靈遺產的神聖樂器。以敬畏和專注的心態對待每次練習。
`,
    "2": `
## 2.1 許可材料

### 符合潔淨律法的角來源

根據猶太律法（哈拉卡），並非所有動物的角都可用於製作羊角號：

| 動物 | 許可 | 原因 |
|------|------|------|
| 公羊（綿羊） | ✅ 是 | 紀念燔祭 |
| 山羊 | ✅ 是 | 潔淨動物 |
| 捻角羚/羚羊 | ✅ 是 | 潔淨動物 |
| 牛/公牛 | ❌ 否 | 令人聯想金牛犢 |
| 鹿 | ❌ 否 | 鹿角，非真正的角 |

### 材料特性
- 必須是真正的角（角蛋白），非鹿角（骨）
- 不能以改變聲音的方式人工改造
- 不影響聲音的小修補是允許的

---

## 2.2 羊角號類型

### 按動物來源分類

**阿什肯納茲（歐洲）風格** - 公羊角
- 彎曲形狀
- 通常10-14吋
- 傳統用於歐洲猶太社區

**葉門風格** - 捻角羚角
- 長而螺旋的形狀
- 可達3英尺以上
- 能產生更多泛音

**摩洛哥風格** - 扁平/寬闊形狀
- 獨特的扁平曲線
- 中等長度
- 在塞法迪社區流行

---

## 2.3 選擇你的羊角號

### 品質指標

1. **音質**：應產生清晰、強勁的音色
2. **結構完整性**：無裂縫或重大缺陷
3. **吹嘴適合度**：應配合你的嘴型大小
4. **尺寸**：考慮你的肺活量和用途

### 測試羊角號
- 吹奏持續的Tekiah
- 檢查是否漏氣
- 聆聽是否有雜音或嗡嗡聲
- 確保舒適的演奏姿勢

---

## 2.4 保養和維護

### 定期清潔
1. 演奏後，通過吹氣去除水分
2. 存放在乾燥處，遠離熱源
3. 偶爾用溫和溶液清潔
4. 避免摔落或撞擊

### 長期存放
- 保存在保護性盒子中
- 保持適中溫度
- 考慮定期上油（食品級礦物油）

---

## 2.5 團體樂器管理

### 對於120人合奏團：
- 編號庫存系統
- 定期維護計劃
- 備用樂器可用
- 適當的存放設施
`,
    "3": `
## 3.1 發聲原理

### 羊角號如何發聲

羊角號通過演奏者嘴唇對吹嘴的振動產生聲音，在號角中產生壓力波。

**關鍵組成：**
1. **嘴唇張力**產生初始振動
2. **氣壓**維持聲音
3. **號角形狀**放大並為音色著色

---

## 3.2 呼吸技巧

### 腹式呼吸

正確的呼吸是良好羊角號演奏的基礎：

1. **深呼吸**從橫膈膜，而非胸腔
2. **吸氣時擴展腹部**
3. **以穩定壓力控制呼氣**
4. **先不用羊角號練習**

### 練習
- 吸氣4拍，屏住4拍，呼氣8拍
- 練習長而持續的呼氣
- 逐漸增加肺活量

---

## 3.3 形成吹嘴技巧

### 嘴唇位置

吹嘴技巧是你如何將嘴唇放在吹嘴上：

1. **堅定但放鬆**的嘴唇
2. **中央小開口**
3. **嘴角稍微向後拉**
4. **上下嘴唇平衡**

### 找到你的位置
- 先用嘴唇發出嗡嗡聲（不用羊角號）
- 將羊角號放在嘴角或中央
- 試驗找到你的最佳位置

---

## 3.4 產生第一個聲音

### 逐步指南

1. 深呼吸
2. 形成吹嘴技巧
3. 將嘴唇密封在吹嘴上
4. 施加穩定氣壓
5. 「吹過」號角，而非對著它吹

### 初學者常見錯誤
- 嘴唇壓力過大
- 臉頰鼓起
- 氣流不穩定
- 肩頸緊張

---

## 3.5 練習方法

### 每日熱身程序
1. 深呼吸練習（2分鐘）
2. 不用羊角號嘴唇嗡嗡聲（2分鐘）
3. 吹嘴嗡嗡聲（2分鐘）
4. 羊角號長音（5分鐘）
5. 短促練習（3分鐘）

### 建立耐力
- 逐漸增加練習時間
- 嘴唇感到疲勞時休息
- 經常補充水分
`,
    "4": `
## 4.1 傳統聲音概述

### 四種聲音

猶太傳統規定四種不同的羊角號聲：

| 聲音 | 特徵 | 意義 |
|------|------|------|
| **Tekiah** | 一長聲 | 宣告/宣布 |
| **Shevarim** | 三中聲 | 破碎的心/哭泣 |
| **Teruah** | 九短聲 | 警報/覺醒 |
| **Tekiah Gedolah** | 延長長聲 | 最終勝利 |

---

## 4.2 Tekiah（特基亞）

### 直吹聲

Tekiah是強勁、持續的聲音，象徵宣告神的主權。

**技巧：**
1. 深呼吸
2. 強勁、穩定的氣流
3. 保持一致音高
4. 清晰的開始和結束
5. 持續時間：至少2-3秒

**練習提示：**
- 專注於乾淨的起音
- 保持聲音穩定，不搖擺
- 刻意結束，不是漸弱

---

## 4.3 Shevarim（謝瓦林）

### 破碎聲

Shevarim由三個中等哀鳴聲組成，代表悔改的破碎哭聲。

**技巧：**
1. 三個獨立但連接的吹奏
2. 每個約1秒
3. 之間短暫停頓
4. 聽起來像哭泣或嘆息

**練習提示：**
- 練習「哀鳴」的品質
- 全程保持一致音高
- 使三個部分清晰可辨

---

## 4.4 Teruah（特魯亞）

### 警報聲

Teruah是一系列九個（或更多）非常短促的斷音，發出警報。

**技巧：**
1. 九個快速、尖銳的吹奏
2. 舌頭發音（像「tu-tu-tu」）
3. 快速連續
4. 全程相同音高

**練習提示：**
- 慢慢開始，逐漸加速
- 保持每個音符清晰
- 維持呼吸支撐

---

## 4.5 Tekiah Gedolah（大特基亞）

### 大吹奏

Tekiah Gedolah是延長的Tekiah，盡可能長時間保持，象徵最終勝利和彌賽亞的到來。

**持續時間目標：**
| 級別 | 目標時間 |
|------|----------|
| 初級 | 9秒 |
| 中級 | 15秒 |
| 高級 | 20秒以上 |

---

## 4.6 聲音組合和系列

### 傳統模式

| 系列 | 組成 | 總聲音數 |
|------|------|----------|
| TaSHRaT | Tekiah - Shevarim-Teruah - Tekiah | 14 |
| TaSHaT | Tekiah - Shevarim - Tekiah | 5 |
| TaRaT | Tekiah - Teruah - Tekiah | 11 |
`,
    "5": `
## 5.1 進階音色發展

### 專家級音質

專業羊角號演奏超越單純發聲，創造感動靈魂的音色。

| 級別 | 特徵 | 聽眾反應 |
|------|------|----------|
| 初級 | 發出聲音 | 意識到 |
| 中級 | 穩定聲音 | 注意 |
| 高級 | 豐富音色 | 感動 |
| 專家 | 屬靈共鳴 | 轉化 |

---

## 5.2 動態控制

### 音量範圍

羊角號可以用各種動態演奏：

| 動態 | 符號 | 描述 |
|------|------|------|
| 最弱音 | pp | 非常柔和 |
| 弱音 | p | 柔和 |
| 中弱音 | mp | 稍柔和 |
| 中強音 | mf | 稍響亮 |
| 強音 | f | 響亮 |
| 最強音 | ff | 非常響亮 |

### 改變動態
- **漸強**：逐漸變響
- **漸弱**：逐漸變柔
- 控制來自氣壓，而非吹嘴張力

---

## 5.3 音高控制

### 自然泛音

羊角號遵循自然泛音系列：

| 泛音 | 相對音高 | 難度 |
|------|----------|------|
| 第1（基音） | 基本音 | 容易 |
| 第2 | 高八度 | 中等 |
| 第3 | 八度加五度 | 困難 |
| 第4 | 兩個八度 | 非常困難 |

---

## 5.4 耐力訓練

### 建立體力

對於120人的延長演出：

| 挑戰 | 原因 | 解決方案 |
|------|------|----------|
| 嘴唇疲勞 | 肌肉過度使用 | 休息、強化訓練 |
| 呼吸耗盡 | 容量有限 | 效率訓練 |
| 注意力下降 | 精神疲勞 | 冥想、休息 |

---

## 5.5 合奏基礎

### 一起演奏

當120名演奏者一起表演時，**和諧**比個人技巧更重要。

| 元素 | 獨奏 | 合奏 |
|------|------|------|
| 開始 | 自由 | 一起 |
| 結束 | 自由 | 一起 |
| 音量 | 最大 | 平衡 |
| 音色 | 個人 | 統一 |

---

## 5.6 大型合奏（120人）

### 組織結構

有效管理120名號角手：

- 1名總監
- 2名副總監
- 4名分區領隊（每人30人）
- 支援團隊（設備、音響、協調）

---

## 5.7 指揮和信號

### 基本指揮信號

| 信號 | 動作 | 意義 |
|------|------|------|
| 準備 | 雙臂舉起 | 準備樂器 |
| 呼吸 | 手向上 | 一起吸氣 |
| 開始 | 手向下 | 開始發聲 |
| 保持 | 手平舉 | 繼續 |
| 停止 | 握拳 | 結束聲音 |

---

## 5.8 排練規劃

### 分階段排練

| 階段 | 重點 | 人數 | 時長 |
|------|------|------|------|
| 1 | 個人技巧 | 個人 | 2週 |
| 2 | 小組 | 10人 | 2週 |
| 3 | 分區 | 30人 | 2週 |
| 4 | 全體合奏 | 120人 | 2週 |
| 5 | 彩排 | 120人 | 1週 |
`,
    "6": `
## 6.1 羊角號演奏者的心

### Ba'al Tekiah的屬靈姿態

吹羊角號不僅是音樂表演。Ba'al Tekiah（羊角號吹奏者）作為神與會眾之間的**屬靈中介者**。

| 態度 | 描述 | 實踐 |
|------|------|------|
| **謙卑** | 高舉神，而非自己 | 演奏前禱告 |
| **敬畏** | 認識神聖職責 | 聖潔生活 |
| **奉獻** | 盡心竭力 | 徹底準備 |
| **愛心** | 服事會眾 | 服務的心 |

### 演奏前的屬靈預備

| 時機 | 預備 |
|------|------|
| 一個月前 | 以祿月默想，悔改時期 |
| 一週前 | 專注禱告，考慮禁食 |
| 前一天 | 潔淨儀式，充分休息 |
| 當天 | 禱告、默想、心靈預備 |
| 即將開始 | 簡短禱告、專注 |

---

## 6.2 羊角號更深的屬靈意義

### Saadia Gaon的10個理由

10世紀猶太智者Saadia Gaon整理了羊角號的10個意義：

| 編號 | 意義 | 應用 |
|------|------|------|
| 1 | 紀念世界創造 | 承認神的主權 |
| 2 | 紀念新年 | 新開始的機會 |
| 3 | 紀念西奈山 | 對律法的委身 |
| 4 | 紀念先知 | 期待預言成就 |
| 5 | 紀念聖殿毀滅 | 復興的盼望 |
| 6 | 紀念以撒獻祭 | 感謝代贖 |
| 7 | 敬畏神 | 聖潔的敬畏 |
| 8 | 懼怕審判日 | 生命省察 |
| 9 | 信心歸回 | 以色列復興的盼望 |
| 10 | 信心復活 | 永生的盼望 |

---

## 🎓 課程完成

恭喜！您已完成所有單元。

您現在：
- ✅ 深入理解羊角號的歷史和屬靈意義
- ✅ 能準確演奏4種傳統聲音
- ✅ 準備好領導120人合奏團
- ✅ 具備號角手的領導素質

> **「知道這喜樂聲音的人民是有福的！他們行在耶和華臉上的光中。」**
> — 詩篇 89:15
`
  };
  return contents[id] || `# ${title}\n\n${subtitle}\n\n*內容即將推出*`;
}

function getChineseCheckpoints(id: string) {
  const checkpoints: Record<string, string[]> = {
    "1": ["理解羊角號詞源和意義", "掌握聖經歷史時間線", "默想燔祭的屬靈意義", "比較聖殿時代和現代羊角號使用"],
    "2": ["區分許可的角材料", "了解不同羊角號類型", "掌握正確選擇和保養方法", "理解團體樂器管理"],
    "3": ["理解發聲原理", "掌握腹式呼吸", "形成正確吹嘴技巧", "產生穩定的第一個聲音"],
    "4": ["區分四種傳統聲音", "理解每種聲音的屬靈意義", "掌握準確的演奏技巧", "了解猶太新年儀式順序"],
    "5": ["發展專家級音色", "提高動態和音高控制", "理解合奏原則", "掌握指揮信號"],
    "6": ["建立Ba'al Tekiah的屬靈姿態", "加強領導能力", "發展活動準備和危機處理能力", "制定持續成長計劃"]
  };
  return checkpoints[id] || ["理解核心概念", "練習基礎技巧", "複習屬靈意義"];
}
