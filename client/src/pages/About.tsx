import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Music, Calendar, MapPin, ExternalLink, Play } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface TimelineEvent {
    year: string;
    title: string;
    location?: string;
    videoUrl?: string;
}

const timelineEvents: TimelineEvent[] = [
    { year: "2013", title: "여의도순복음교회 청년 선교헌신 예배" },
    { year: "2014", title: "장막절 Israel Jerusalem Marching 한국팀 나팔수 리더", location: "Jerusalem, Israel" },
    { year: "2016", title: "여의도순복음교회 청년 선교헌신 예배" },
    { year: "2018", title: "Galilee Springs Gathering", location: "Israel" },
    { year: "2018", title: "수지선한목자교회 금요예배 나팔수 컨설팅" },
    { year: "2018", title: "장막절 Israel Jerusalem Marching 한국팀 나팔수 리더", location: "Jerusalem, Israel" },
    { year: "2019.05", title: "서빙고 온누리교회 SNS 공동체 특별예배 'One Thing'", videoUrl: "https://youtu.be/UBKuoI0ozf8?si=cj_-Ft3U7BKT-nCW&t=3055" },
    { year: "2019.11", title: "다니엘기도회 / 홀리임팩트", videoUrl: "https://youtu.be/2ndXjDAmUEM?t=527" },
    { year: "2020.11", title: "서빙고 온누리교회 SNS 공동체 주일 예배", videoUrl: "https://youtu.be/BTRKTp6KEVk" },
    { year: "2021.10", title: "주안장로교회 청년국 예배 / Praise Club", videoUrl: "https://youtu.be/UBKuoI0ozf8" },
    { year: "2022", title: "CBMC 한국대회 부산 / 인천연합회", location: "Busan" },
    { year: "2024", title: "CBMC 한국대회 울산 / 희년의 밤", location: "Ulsan" },
    { year: "2024", title: "POD" },
    { year: "2025.08", title: "POD" },
];

export default function About() {
    const { language } = useLanguage();

    const getTitle = () => {
        if (language === 'ko') return "소개";
        if (language === 'en') return "About";
        return "關於";
    };

    const getSubtitle = () => {
        if (language === 'ko') return "나팔수의 여정";
        if (language === 'en') return "Journey of a Shofar Player";
        return "號角手的旅程";
    };

    return (
        <div className="min-h-screen">
            {/* Hero Section with Profile Image */}
            <div className="relative h-[60vh] min-h-[400px] overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: "url('/images/profile-shofar.jpg')" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

                <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-end pb-12">
                    <Link href="/">
                        <Button variant="ghost" size="sm" className="mb-6 text-white/80 hover:text-white hover:bg-white/10">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            {language === 'ko' ? '홈으로' : language === 'en' ? 'Home' : '首頁'}
                        </Button>
                    </Link>

                    <Badge className="w-fit mb-4 bg-primary/80 text-primary-foreground">
                        <Music className="w-3 h-3 mr-1" />
                        {language === 'ko' ? '나팔수 이력' : language === 'en' ? 'Shofar History' : '號角手履歷'}
                    </Badge>

                    <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2">
                        {getTitle()}
                    </h1>
                    <p className="text-xl text-white/80 max-w-2xl">
                        {getSubtitle()}
                    </p>
                </div>
            </div>

            {/* Timeline Section */}
            <div className="container mx-auto px-4 py-16">
                <div className="max-w-3xl mx-auto">
                    <h2 className="font-display text-2xl font-bold mb-8 flex items-center gap-2">
                        <Calendar className="h-6 w-6 text-primary" />
                        {language === 'ko' ? '활동 타임라인' : language === 'en' ? 'Activity Timeline' : '活動時間線'}
                    </h2>

                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-[27px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-transparent" />

                        <div className="space-y-6">
                            {timelineEvents.map((event, index) => (
                                <div key={index} className="relative flex gap-6 group">
                                    {/* Timeline dot */}
                                    <div className="relative z-10 flex items-center justify-center w-14 h-14 rounded-full bg-background border-2 border-primary/30 group-hover:border-primary transition-colors shrink-0">
                                        <span className="text-xs font-bold text-primary">{event.year.split('.')[0].slice(-2)}</span>
                                    </div>

                                    {/* Content card */}
                                    <Card className="flex-1 border-border/50 shadow-sm hover:shadow-md transition-shadow group-hover:border-primary/30">
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <Badge variant="outline" className="mb-2 text-xs">
                                                        {event.year}
                                                    </Badge>
                                                    <h3 className="font-medium text-foreground">{event.title}</h3>
                                                    {event.location && (
                                                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                                            <MapPin className="h-3 w-3" /> {event.location}
                                                        </p>
                                                    )}
                                                </div>

                                                {event.videoUrl && (
                                                    <a
                                                        href={event.videoUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="shrink-0"
                                                    >
                                                        <Button size="sm" variant="outline" className="gap-1 text-xs">
                                                            <Play className="h-3 w-3" />
                                                            {language === 'ko' ? '영상' : 'Video'}
                                                        </Button>
                                                    </a>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Separator className="my-12" />

                    {/* Quote Section */}
                    <div className="text-center py-8">
                        <blockquote className="text-xl italic text-muted-foreground max-w-xl mx-auto">
                            {language === 'ko'
                                ? '"나팔 소리를 아는 백성은 복이 있나니"'
                                : language === 'en'
                                    ? '"Blessed are the people who know the joyful sound"'
                                    : '"知道這喜樂聲音的人民是有福的"'
                            }
                        </blockquote>
                        <p className="text-sm text-muted-foreground mt-2">
                            {language === 'ko' ? '시편 89:15' : 'Psalm 89:15'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
