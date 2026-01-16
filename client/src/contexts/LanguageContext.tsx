import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'ko' | 'en' | 'zh-TW';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  ko: {
    // Navigation
    "nav.home": "홈",
    "nav.module1": "Module 1: 기원과 역사",
    "nav.module2": "Module 2: 종류와 구조",
    "nav.module3": "Module 3: 기초 연주",
    "nav.module4": "Module 4: 전통 소리",
    "nav.module5": "Module 5: 고급 기법",
    "nav.module6": "Module 6: 리더십",
    "nav.dday": "이스라엘 행사 D-Day",
    "nav.prep": "120명 나팔단을 위한 준비가 진행 중입니다.",
    "nav.progress": "진행률",
    "nav.role": "나팔단장",

    // Home Hero
    "hero.badge": "120명 나팔단을 위한 전문가 교육 과정",
    "hero.title1": "Maranatha",
    "hero.title2": "Convention",
    "hero.desc": "이스라엘 행사 120명 나팔단을 위한 전문가 교육 과정입니다. 역사적 기원부터 고급 연주 기법, 그리고 영적 리더십까지 체계적으로 마스터하세요.",
    "hero.start": "교육 시작하기",
    "hero.curriculum": "커리큘럼 전체보기",

    // Stats
    "stat.modules": "교육 모듈",
    "stat.members": "나팔단원",
    "stat.sounds": "전통 소리",
    "stat.period": "준비 기간",
    "stat.unit.modules": "6개",
    "stat.unit.members": "120명",
    "stat.unit.sounds": "4종",
    "stat.unit.period": "12주",

    // Modules Section
    "modules.title": "교육 모듈",
    "modules.subtitle": "단계별 전문가 양성 과정",
    "module.learn": "학습하기",

    // Module Titles & Descs
    "module1.title": "기원과 역사",
    "module1.desc": "성경적 배경과 아케다, 성전 시대의 쇼파르",
    "module1.level": "이론",
    "module1.duration": "4시간",

    "module2.title": "종류와 구조",
    "module2.desc": "재료, 제작 과정, 올바른 악기 선택법",
    "module2.level": "이론/실습",
    "module2.duration": "3시간",

    "module3.title": "기초 연주 기법",
    "module3.desc": "호흡법, 앙부슈르, 안정적인 소리 생성",
    "module3.level": "실기",
    "module3.duration": "6시간",

    "module4.title": "전통 소리와 의식",
    "module4.desc": "Tekiah, Shevarim, Teruah 완벽 마스터",
    "module4.level": "실기",
    "module4.duration": "6시간",

    "module5.title": "고급 기법과 앙상블",
    "module5.desc": "120명 단체 연주를 위한 동기화 훈련",
    "module5.level": "심화",
    "module5.duration": "8시간",

    "module6.title": "영적 준비와 리더십",
    "module6.desc": "Ba'al Tekiah의 마음가짐과 단장의 역할",
    "module6.level": "리더십",
    "module6.duration": "5시간",

    // Module Detail
    "detail.back": "홈으로 돌아가기",
    "detail.duration": "소요 시간",
    "detail.level": "난이도",
    "detail.start": "학습 시작하기",
    "detail.tabs.overview": "개요",
    "detail.tabs.curriculum": "커리큘럼",
    "detail.tabs.practice": "연습 과제",
    "detail.tabs.resources": "자료실",
    "detail.audio.title": "쇼파르 소리 듣기",
    "detail.audio.desc": "각 소리의 특징을 듣고 따라해보세요.",
    "detail.audio.play": "재생",
    "detail.checklist.title": "학습 체크리스트",
    "detail.checklist.desc": "진도율을 체크하며 학습하세요.",
  },
  en: {
    // Navigation
    "nav.home": "Home",
    "nav.module1": "Module 1: Origins & History",
    "nav.module2": "Module 2: Types & Structure",
    "nav.module3": "Module 3: Basic Techniques",
    "nav.module4": "Module 4: Traditional Sounds",
    "nav.module5": "Module 5: Advanced Ensemble",
    "nav.module6": "Module 6: Leadership",
    "nav.dday": "Israel Event D-Day",
    "nav.prep": "Preparation for 120 Trumpeters in progress.",
    "nav.progress": "Progress",
    "nav.role": "Trumpet Leader",

    // Home Hero
    "hero.badge": "Expert Curriculum for 120 Trumpeters",
    "hero.title1": "Maranatha",
    "hero.title2": "Convention",
    "hero.desc": "Expert training course for the 120-member Shofar ensemble for the Israel event. Master everything from historical origins to advanced techniques and spiritual leadership.",
    "hero.start": "Start Learning",
    "hero.curriculum": "View Curriculum",

    // Stats
    "stat.modules": "Modules",
    "stat.members": "Trumpeters",
    "stat.sounds": "Sounds",
    "stat.period": "Duration",
    "stat.unit.modules": "6",
    "stat.unit.members": "120",
    "stat.unit.sounds": "4 Types",
    "stat.unit.period": "12 Weeks",

    // Modules Section
    "modules.title": "Training Modules",
    "modules.subtitle": "Step-by-step Expert Course",
    "module.learn": "Learn More",

    // Module Titles & Descs
    "module1.title": "Origins & History",
    "module1.desc": "Biblical background, Akedah, and Temple era Shofar",
    "module1.level": "Theory",
    "module1.duration": "4 Hours",

    "module2.title": "Types & Structure",
    "module2.desc": "Materials, crafting process, selecting the right instrument",
    "module2.level": "Theory/Practice",
    "module2.duration": "3 Hours",

    "module3.title": "Basic Techniques",
    "module3.desc": "Breathing, embouchure, stable sound production",
    "module3.level": "Practice",
    "module3.duration": "6 Hours",

    "module4.title": "Traditional Sounds",
    "module4.desc": "Mastering Tekiah, Shevarim, Teruah",
    "module4.level": "Practice",
    "module4.duration": "6 Hours",

    "module5.title": "Advanced Ensemble",
    "module5.desc": "Synchronization training for 120-member ensemble",
    "module5.level": "Advanced",
    "module5.duration": "8 Hours",

    "module6.title": "Spiritual Leadership",
    "module6.desc": "Mindset of a Ba'al Tekiah and leader's role",
    "module6.level": "Leadership",
    "module6.duration": "5 Hours",

    // Module Detail
    "detail.back": "Back to Home",
    "detail.duration": "Duration",
    "detail.level": "Level",
    "detail.start": "Start Learning",
    "detail.tabs.overview": "Overview",
    "detail.tabs.curriculum": "Curriculum",
    "detail.tabs.practice": "Practice",
    "detail.tabs.resources": "Resources",
    "detail.audio.title": "Listen to Shofar",
    "detail.audio.desc": "Listen to the characteristics of each sound and practice along.",
    "detail.audio.play": "Play",
    "detail.checklist.title": "Checklist",
    "detail.checklist.desc": "Track your progress.",
  },
  "zh-TW": {
    // Navigation
    "nav.home": "首頁",
    "nav.module1": "單元 1: 起源與歷史",
    "nav.module2": "單元 2: 種類與構造",
    "nav.module3": "單元 3: 基礎演奏",
    "nav.module4": "單元 4: 傳統號聲",
    "nav.module5": "單元 5: 進階合奏",
    "nav.module6": "單元 6: 屬靈領導力",
    "nav.dday": "以色列活動倒數",
    "nav.prep": "120人號角隊準備工作中",
    "nav.progress": "進度",
    "nav.role": "號角隊長",

    // Home Hero
    "hero.badge": "為120人號角隊設計的專業課程",
    "hero.title1": "Maranatha",
    "hero.title2": "Convention",
    "hero.desc": "這是為以色列活動120人號角隊準備的專業培訓課程。從歷史起源到進階演奏技巧，以及屬靈領導力，進行系統化的掌握。",
    "hero.start": "開始學習",
    "hero.curriculum": "查看課程",

    // Stats
    "stat.modules": "教學單元",
    "stat.members": "號角手",
    "stat.sounds": "傳統號聲",
    "stat.period": "準備期間",
    "stat.unit.modules": "6個",
    "stat.unit.members": "120人",
    "stat.unit.sounds": "4種",
    "stat.unit.period": "12週",

    // Modules Section
    "modules.title": "培訓單元",
    "modules.subtitle": "循序漸進的專家養成過程",
    "module.learn": "開始學習",

    // Module Titles & Descs
    "module1.title": "起源與歷史",
    "module1.desc": "聖經背景、亞伯拉罕獻以撒、聖殿時期的號角",
    "module1.level": "理論",
    "module1.duration": "4小時",

    "module2.title": "種類與構造",
    "module2.desc": "材質、製作過程、選擇合適的樂器",
    "module2.level": "理論/實作",
    "module2.duration": "3小時",

    "module3.title": "基礎演奏技巧",
    "module3.desc": "呼吸法、嘴型、穩定的發聲",
    "module3.level": "實作",
    "module3.duration": "6小時",

    "module4.title": "傳統號聲與儀式",
    "module4.desc": "完全掌握 Tekiah, Shevarim, Teruah",
    "module4.level": "實作",
    "module4.duration": "6小時",

    "module5.title": "進階技巧與合奏",
    "module5.desc": "120人團體演奏的同步訓練",
    "module5.level": "進階",
    "module5.duration": "8小時",

    "module6.title": "屬靈準備與領導力",
    "module6.desc": "吹角者(Ba'al Tekiah)的心態與隊長的角色",
    "module6.level": "領導力",
    "module6.duration": "5小時",

    // Module Detail
    "detail.back": "返回首頁",
    "detail.duration": "所需時間",
    "detail.level": "難度",
    "detail.start": "開始學習",
    "detail.tabs.overview": "概覽",
    "detail.tabs.curriculum": "課程大綱",
    "detail.tabs.practice": "練習作業",
    "detail.tabs.resources": "資料庫",
    "detail.audio.title": "聆聽號角聲",
    "detail.audio.desc": "聆聽每種聲音的特徵並跟隨練習。",
    "detail.audio.play": "播放",
    "detail.checklist.title": "學習檢核表",
    "detail.checklist.desc": "檢查您的學習進度。",
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('ko');

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
