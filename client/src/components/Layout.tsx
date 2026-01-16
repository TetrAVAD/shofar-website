import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Menu, Music, BookOpen, Users, Award, Home, Info, Globe, LogOut, LogIn } from "lucide-react";
import { useState, useEffect } from "react";
import { useLanguage, Language } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { user, isAuthenticated, loading, signOut } = useAuth();

  // Get overall progress for logged in users
  const { data: overallProgress } = trpc.progress.getOverallProgress.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const navItems = [
    { path: "/", label: t("nav.home"), icon: Home },
    { path: "/about", label: language === 'ko' ? "소개" : language === 'en' ? "About" : "關於", icon: Users },
    { path: "/board/notice", label: language === 'ko' ? "공지사항" : language === 'en' ? "Notices" : "公告", icon: Info },
    { path: "/board/free", label: language === 'ko' ? "자유게시판" : language === 'en' ? "Community" : "討論區", icon: Users },
    { path: "/module/1", label: t("nav.module1"), icon: BookOpen },
    { path: "/module/2", label: t("nav.module2"), icon: Info },
    { path: "/module/3", label: t("nav.module3"), icon: Music },
    { path: "/module/4", label: t("nav.module4"), icon: Music },
    { path: "/module/5", label: t("nav.module5"), icon: Users },
    { path: "/module/6", label: t("nav.module6"), icon: Award },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const languageLabels: Record<Language, string> = {
    ko: "한국어",
    en: "English",
    "zh-TW": "繁體中文"
  };

  const handleLogin = () => {
    setLocation("/auth");
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/";
  };

  const progressPercent = overallProgress ?? 0;

  return (
    <div className="min-h-screen bg-background font-body text-foreground selection:bg-primary/20">
      {/* Desktop Top Header - Language & Login */}
      <header className="fixed top-0 right-0 left-72 z-50 hidden lg:flex h-14 items-center justify-end gap-3 px-6 border-b border-border/40 bg-background/80 backdrop-blur-md">
        {/* Language Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <Globe className="h-4 w-4" />
              {languageLabels[language]}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setLanguage('ko')}>
              한국어 {language === 'ko' && "✓"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLanguage('en')}>
              English {language === 'en' && "✓"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLanguage('zh-TW')}>
              繁體中文 {language === 'zh-TW' && "✓"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Auth Button */}
        {isAuthenticated && user ? (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold font-display text-xs">
              {(user.user_metadata?.name || user.user_metadata?.full_name || user.email || "U").substring(0, 2).toUpperCase()}
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              {language === 'ko' ? '로그아웃' : language === 'en' ? 'Logout' : '登出'}
            </Button>
          </div>
        ) : (
          <Button size="sm" onClick={handleLogin} className="gap-2">
            <LogIn className="h-4 w-4" />
            {language === 'ko' ? '로그인' : language === 'en' ? 'Login' : '登入'}
          </Button>
        )}
      </header>

      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 border-r border-border/40 bg-background/95 backdrop-blur-sm lg:block">
        <div className="flex h-full flex-col">
          <div className="flex h-20 items-center px-6 border-b border-border/40 justify-between">
            <Link href="/">
              <div className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Music className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="font-display text-lg font-bold tracking-tight text-foreground">
                    Shofar Academy
                  </h1>
                  <p className="text-xs text-muted-foreground font-medium">Expert Curriculum</p>
                </div>
              </div>
            </Link>
          </div>

          <ScrollArea className="flex-1 py-6">
            <nav className="space-y-1 px-4">
              {navItems.map((item) => {
                const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
                return (
                  <Link key={item.path} href={item.path}>
                    <div
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 cursor-pointer group relative overflow-hidden",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <item.icon className={cn("h-4 w-4", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground")} />
                      {item.label}
                      {isActive && (
                        <div className="absolute right-0 top-0 h-full w-1 bg-white/20" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-8 px-6">
              <div className="rounded-xl bg-secondary/50 p-4 border border-secondary">
                <h3 className="font-display text-sm font-bold text-secondary-foreground mb-2">
                  {t("nav.dday")}
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  {t("nav.prep")}
                </p>
                <div className="h-1.5 w-full rounded-full bg-background/50 overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-muted-foreground font-medium">
                  <span>{t("nav.progress")}</span>
                  <span>{progressPercent}%</span>
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="border-t border-border/40 p-4 space-y-4">
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-between bg-background/50 backdrop-blur-sm">
                  <span className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    {languageLabels[language]}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setLanguage('ko')}>
                  한국어 {language === 'ko' && "✓"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage('en')}>
                  English {language === 'en' && "✓"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage('zh-TW')}>
                  繁體中文 {language === 'zh-TW' && "✓"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {isAuthenticated && user ? (
              <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold font-display text-xs">
                  {(user.user_metadata?.name || user.user_metadata?.full_name || user.email || "U").substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium">{user.user_metadata?.name || user.user_metadata?.full_name || user.email}</p>
                  <p className="truncate text-xs text-muted-foreground cursor-pointer hover:text-primary" onClick={handleLogout}>
                    로그아웃
                  </p>
                </div>
              </div>
            ) : (
              <Button className="w-full gap-2" variant="default" onClick={handleLogin}>
                <LogIn className="h-4 w-4" />
                로그인
              </Button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header
        className={cn(
          "fixed left-0 right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-border/40 bg-background/80 px-4 backdrop-blur-md transition-all lg:hidden",
          isScrolled && "shadow-sm"
        )}
      >
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <Music className="h-5 w-5 text-primary" />
            <span className="font-display text-lg font-bold">Shofar Academy</span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Globe className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLanguage('ko')}>한국어</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('en')}>English</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('zh-TW')}>繁體中文</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {isAuthenticated ? (
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" onClick={handleLogin}>
              <LogIn className="h-5 w-5" />
            </Button>
          )}

          <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <SheetDescription className="sr-only">Mobile navigation menu for Shofar Academy</SheetDescription>
              <div className="flex h-full flex-col">
                <div className="flex h-16 items-center px-6 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <Music className="h-5 w-5 text-primary" />
                    <span className="font-display text-lg font-bold">Shofar Academy</span>
                  </div>
                </div>
                <ScrollArea className="flex-1 py-6">
                  <nav className="space-y-1 px-4">
                    {navItems.map((item) => {
                      const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
                      return (
                        <Link key={item.path} href={item.path}>
                          <div
                            onClick={() => setIsMobileOpen(false)}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors cursor-pointer",
                              isActive
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            )}
                          >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                          </div>
                        </Link>
                      );
                    })}
                  </nav>
                </ScrollArea>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main Content */}
      <main className={cn(
        "min-h-screen transition-all duration-300",
        "lg:pl-72 pt-16 lg:pt-14"
      )}>
        <div className="container mx-auto max-w-5xl py-8 px-4 md:px-8 lg:py-12">
          {children}
        </div>
      </main>
    </div>
  );
}
