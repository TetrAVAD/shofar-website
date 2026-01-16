import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, BookOpen, Music, Users, Star, PlayCircle, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { GuestPrompt } from "@/components/GuestPrompt";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const { t } = useLanguage();

  // 로딩 중일 때
  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // 비회원일 때 회원가입 안내 표시
  if (!isAuthenticated) {
    return <GuestPrompt />;
  }

  // 로그인된 사용자에게 보여줄 콘텐츠
  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-primary/5 border border-border/50 shadow-2xl shadow-primary/5">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero-shofar-desert.jpg"
            alt="Shofar in Desert"
            className="h-full w-full object-cover opacity-40 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        </div>

        <div className="relative z-10 grid gap-8 px-6 py-16 md:grid-cols-2 md:px-12 lg:py-24">
          <div className="flex flex-col justify-center space-y-6">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary w-fit backdrop-blur-sm">
              <Star className="mr-1 h-3 w-3 fill-primary" />
              {t("hero.badge")}
            </div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl xl:text-6xl">
              {t("hero.title1")} <br />
              <span className="text-primary">{t("hero.title2")}</span>
            </h1>
            <p className="max-w-[600px] text-lg text-muted-foreground leading-relaxed">
              {t("hero.desc")}
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href="/module/1">
                <Button size="lg" className="gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-105">
                  {t("hero.start")} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/curriculum">
                <Button variant="outline" size="lg" className="gap-2 backdrop-blur-sm bg-background/50">
                  {t("hero.curriculum")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: t("stat.modules"), value: t("stat.unit.modules"), icon: BookOpen },
          { label: t("stat.members"), value: t("stat.unit.members"), icon: Users },
          { label: t("stat.sounds"), value: t("stat.unit.sounds"), icon: Music },
          { label: t("stat.period"), value: t("stat.unit.period"), icon: Star },
        ].map((stat, i) => (
          <Card key={i} className="border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-card">
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <div className="mb-3 rounded-full bg-primary/10 p-3 text-primary">
                <stat.icon className="h-5 w-5" />
              </div>
              <div className="text-2xl font-bold font-display text-foreground">{stat.value}</div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Modules Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">{t("modules.title")}</h2>
            <p className="text-muted-foreground mt-1">{t("modules.subtitle")}</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              id: 1,
              title: t("module1.title"),
              desc: t("module1.desc"),
              image: "/images/jerusalem-stone-texture.jpg",
              duration: t("module1.duration"),
              level: t("module1.level")
            },
            {
              id: 2,
              title: t("module2.title"),
              desc: t("module2.desc"),
              image: "/images/kudu-shofar-full.jpg",
              duration: t("module2.duration"),
              level: t("module2.level")
            },
            {
              id: 3,
              title: t("module3.title"),
              desc: t("module3.desc"),
              image: "/images/shofar-close-up-artistic.jpg",
              duration: t("module3.duration"),
              level: t("module3.level")
            },
            {
              id: 4,
              title: t("module4.title"),
              desc: t("module4.desc"),
              image: "/images/icon-tekiah.png",
              duration: t("module4.duration"),
              level: t("module4.level")
            },
            {
              id: 5,
              title: t("module5.title"),
              desc: t("module5.desc"),
              image: "/images/icon-teruah.png",
              duration: t("module5.duration"),
              level: t("module5.level")
            },
            {
              id: 6,
              title: t("module6.title"),
              desc: t("module6.desc"),
              image: "/images/hero-shofar-desert.jpg",
              duration: t("module6.duration"),
              level: t("module6.level")
            }
          ].map((module) => (
            <Link key={module.id} href={`/module/${module.id}`}>
              <Card className="group h-full overflow-hidden border-border/50 bg-card transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 cursor-pointer">
                <div className="relative h-48 overflow-hidden bg-muted">
                  <div className="absolute inset-0 bg-primary/10 mix-blend-multiply z-10 transition-opacity group-hover:opacity-0" />
                  <img
                    src={module.image}
                    alt={module.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <Badge className="absolute right-3 top-3 z-20 bg-background/80 text-foreground backdrop-blur-md hover:bg-background">
                    Module {module.id}
                  </Badge>
                </div>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-[10px] border-primary/20 text-primary bg-primary/5">
                      {module.level}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <PlayCircle className="h-3 w-3" /> {module.duration}
                    </span>
                  </div>
                  <CardTitle className="font-display text-xl group-hover:text-primary transition-colors">
                    {module.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {module.desc}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="border-t border-border/40 bg-muted/20 p-4">
                  <div className="flex w-full items-center justify-between text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    <span>{t("module.learn")}</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
