import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  ChevronRight,
  ChevronDown,
  BookOpen,
  Clock,
  CheckCircle2,
  Circle,
  Loader2,
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GuestPrompt } from "@/components/GuestPrompt";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

// 모듈 데이터 구조
interface Section {
  id: string;
  title: string;
  content: string;
}

interface Module {
  id: number;
  title: string;
  duration: string;
  sections: Section[];
}

// 실제 MD 파일 기반 콘텐츠
const modules: Module[] = [
  {
    id: 1,
    title: "기원과 역사",
    duration: "4시간",
    sections: [
      {
        id: "1.1",
        title: "쇼파르란 무엇인가",
        content: `## 정의와 어원

쇼파르(שׁוֹפָר, Shofar)는 고대 이스라엘에서 사용된 관악기로, 주로 숫양의 뿔로 제작됩니다. 히브리어 어근 "שָׁפַר(shaphar)"는 "아름답게 하다", "개선하다"라는 의미를 가지며, 이는 쇼파르 소리가 영혼을 정화하고 회개로 이끈다는 영적 의미와 연결됩니다.

현대 금관악기의 조상이라 할 수 있는 쇼파르는 밸브나 키 없이 오직 연주자의 입술 진동(앙부슈르)으로만 소리를 냅니다. 이러한 단순함 속에 3,000년 이상의 역사가 담겨 있습니다.

### 학습 포인트
- 쇼파르의 정확한 정의
- 히브리어 어원 분석
- 다른 고대 악기와의 비교`
      },
      {
        id: "1.2",
        title: "성경에서의 쇼파르",
        content: `## 첫 등장: 시나이 산 (출애굽기 19:16-19)

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
| 시편 47:5 | 찬양과 경배 | 왕의 대관식 |`
      },
      {
        id: "1.3",
        title: "아케다와 쇼파르의 연결",
        content: `## 이삭 번제 사건 (창세기 22장)

쇼파르가 숫양 뿔로 만들어지는 것은 아브라함이 이삭 대신 제물로 바친 숫양과 깊은 연관이 있습니다. 이 사건은 유대 전통에서 "아케다(עֲקֵדָה, 결박)"라 불리며, 쇼파르의 영적 의미를 이해하는 핵심입니다.

> "아브라함이 눈을 들어 살펴본즉 한 숫양이 뒤에 있는데 **뿔이 수풀에 걸려 있는지라** 아브라함이 가서 그 숫양을 가져다가 아들을 대신하여 번제로 드렸더라" (창세기 22:13)

### 신학적 의미

아케다 사건에서 숫양은 대속(代贖)의 상징입니다. 쇼파르를 불 때마다 우리는 다음을 기억합니다:

1. **하나님의 공급**: 위기의 순간에 하나님이 제물을 준비하심
2. **대속의 원리**: 무고한 자가 죄인을 대신함
3. **순종의 모범**: 아브라함의 믿음과 이삭의 순종
4. **메시아 예표**: 하나님의 독생자 희생의 예표`
      },
      {
        id: "1.4",
        title: "성전 시대의 쇼파르",
        content: `## 제1성전 시대 (솔로몬 성전)

다윗 왕은 성전 예배에 쇼파르를 포함시켰으며, 솔로몬 성전에서는 정교한 의식 체계 속에서 쇼파르가 사용되었습니다.

## 제2성전 시대

제2성전 시대에는 쇼파르 사용이 더욱 체계화되었습니다:

| 행사 | 쇼파르 배치 | 특징 |
|------|------------|------|
| 로쉬 하샤나 | 중앙에 쇼파르, 양쪽에 트럼펫 | 아이벡스 뿔, 직선형, 금 장식 |
| 금식일 | 중앙에 트럼펫, 양쪽에 쇼파르 | 숫양 뿔, 곡선형, 은 장식 |
| 희년 욤 키푸르 | 로쉬 하샤나와 동일 | 자유 선포 |`
      },
      {
        id: "1.5",
        title: "디아스포라 이후의 쇼파르",
        content: `## 성전 파괴 후의 변화

70년 성전 파괴 이후, 쇼파르는 유대인 공동체에서 더욱 중요한 상징이 되었습니다. 성전 예배가 불가능해진 상황에서 쇼파르는 하나님과의 연결고리이자 정체성의 상징으로 남았습니다.

### 현대까지의 전승

| 시대 | 특징 | 주요 변화 |
|------|------|----------|
| 탈무드 시대 | 율법 체계화 | 쇼파르 규정 정립 |
| 중세 | 디아스포라 확산 | 지역별 전통 발전 |
| 근대 | 유럽 유대 공동체 | 아쉬케나지/세파르디 구분 |
| 현대 | 이스라엘 건국 | 국가적 상징으로 부활 |`
      },
      {
        id: "1.6",
        title: "쇼파르의 현대적 의미",
        content: `## 종교적 사용

오늘날 쇼파르는 주로 다음 시기에 사용됩니다:

- **엘룰 월**: 로쉬 하샤나 준비 기간 동안 매일 아침
- **로쉬 하샤나**: 유대 새해의 핵심 의식
- **욤 키푸르**: 속죄일 종료 시

## 비종교적 사용

- 이스라엘 독립 선언 (1948년)
- 예루살렘 통일 (1967년)
- 국가 행사 및 기념식

### 학습 점검 질문
1. 쇼파르의 히브리어 어원과 그 의미는 무엇인가?
2. 성경에서 쇼파르가 처음 등장하는 장면과 그 의미는?
3. 아케다 사건과 쇼파르의 연결점은 무엇인가?`
      }
    ]
  },
  {
    id: 2,
    title: "종류와 구조",
    duration: "3시간",
    sections: [
      {
        id: "2.1",
        title: "쇼파르의 재료",
        content: `## 허용되는 동물 뿔

유대 율법(할라카)에 따르면, 쇼파르는 특정 동물의 뿔로만 제작할 수 있습니다:

### 허용되는 재료
- **숫양(Ram)**: 가장 전통적이고 선호되는 재료
- **쿠두(Kudu)**: 아프리카 영양, 긴 나선형
- **아이벡스(Ibex)**: 산양, 곡선형
- **오릭스(Oryx)**: 직선형에 가까움

### 금지되는 재료
- **소 뿔**: 금송아지 사건 연상
- **사슴 뿔**: 뼈 구조로 속이 차 있음
- **코뿔소 뿔**: 케라틴 덩어리, 속이 비어있지 않음`
      },
      {
        id: "2.2",
        title: "쇼파르의 종류",
        content: `## 형태별 분류

### 1. 아쉬케나지 스타일 (Ashkenazi)
- **형태**: 짧고 곡선형
- **재료**: 주로 숫양 뿔
- **음색**: 높고 날카로운 소리
- **지역**: 동유럽 유대인 전통

### 2. 세파르디/예멘 스타일 (Sephardic/Yemenite)
- **형태**: 길고 나선형
- **재료**: 주로 쿠두 뿔
- **음색**: 깊고 울림 있는 소리
- **지역**: 중동, 북아프리카 유대인 전통

### 3. 모로코 스타일 (Moroccan)
- **형태**: 평평하게 눌린 형태
- **재료**: 숫양 뿔
- **음색**: 독특한 음색
- **지역**: 북아프리카 유대인 전통`
      },
      {
        id: "2.3",
        title: "제작 과정",
        content: `## 전통적 제작 방법

### 1단계: 뿔 선별
- 균열이나 구멍이 없는 뿔 선택
- 적절한 크기와 곡률 확인

### 2단계: 내부 청소
- 뿔 내부의 연골과 조직 제거
- 끓는 물에 담가 부드럽게 함
- 금속 막대로 내부 긁어내기

### 3단계: 마우스피스 제작
- 뿔 끝부분 절단
- 작은 구멍 뚫기 (직경 약 6-10mm)
- 입술이 닿는 부분 매끄럽게 다듬기

### 4단계: 건조 및 마무리
- 자연 건조 (수 주 소요)
- 외부 광택 처리 (선택사항)
- 균열 검사`
      },
      {
        id: "2.4",
        title: "좋은 쇼파르 선택법",
        content: `## 품질 평가 기준

### 외관 검사
- **균열**: 어떤 균열도 허용되지 않음
- **구멍**: 자연 구멍이나 손상 없어야 함
- **곡률**: 자연스러운 곡선 유지

### 소리 검사
- **음질**: 맑고 깨끗한 소리
- **음량**: 충분한 볼륨
- **지속성**: 안정적인 음 유지

### 마우스피스 검사
- **크기**: 연주자 입술에 맞는 크기
- **매끄러움**: 날카로운 모서리 없음
- **위치**: 적절한 각도

### 가격대별 특징
| 등급 | 가격대 | 특징 |
|------|--------|------|
| 입문용 | $30-80 | 기본 품질, 학습용 |
| 중급 | $80-200 | 좋은 음질, 일반 사용 |
| 고급 | $200-500 | 우수한 음질, 전문가용 |
| 프리미엄 | $500+ | 최상급, 수공예품 |`
      }
    ]
  },
  {
    id: 3,
    title: "기초 연주 기법",
    duration: "6시간",
    sections: [
      {
        id: "3.1",
        title: "호흡법의 기초",
        content: `## 복식호흡 (Diaphragmatic Breathing)

쇼파르 연주의 기본은 올바른 호흡입니다. 복식호흡은 횡격막을 사용하여 깊고 안정적인 공기 흐름을 만듭니다.

### 연습 방법

1. **자세 잡기**
   - 바르게 서거나 앉기
   - 어깨 힘 빼기
   - 턱을 살짝 당기기

2. **들숨 연습**
   - 코로 천천히 숨 들이쉬기
   - 배가 풍선처럼 부풀어 오르는 느낌
   - 가슴은 최소한으로 움직임

3. **날숨 연습**
   - 입으로 천천히 내쉬기
   - 배가 자연스럽게 들어감
   - 일정한 압력 유지

### 일일 연습 루틴
- 아침: 5분 호흡 명상
- 연습 전: 10회 깊은 호흡
- 연습 중: 매 5분마다 호흡 체크`
      },
      {
        id: "3.2",
        title: "앙부슈르 형성",
        content: `## 앙부슈르(Embouchure)란?

앙부슈르는 관악기를 연주할 때 입술과 얼굴 근육의 형태를 말합니다. 쇼파르에서 올바른 앙부슈르는 소리 생성의 핵심입니다.

### 기본 형태

1. **입술 위치**
   - 입술을 자연스럽게 다물기
   - 입꼬리를 살짝 당기기 (미소 짓듯이)
   - 입술 중앙에 작은 구멍 만들기

2. **마우스피스 접촉**
   - 마우스피스를 입술 중앙에 위치
   - 상하 입술에 균등한 압력
   - 너무 세게 누르지 않기

3. **공기 흐름**
   - "뿌" 또는 "투" 발음하듯이
   - 일정한 공기 압력 유지
   - 입술이 자연스럽게 진동하도록

### 흔한 실수와 교정
| 문제 | 원인 | 해결책 |
|------|------|--------|
| 소리 안 남 | 입술 너무 긴장 | 힘 빼고 다시 시도 |
| 공기만 샘 | 입술 구멍 너무 큼 | 입술 더 모으기 |
| 소리 끊김 | 공기 압력 불안정 | 복식호흡 연습 |`
      },
      {
        id: "3.3",
        title: "첫 소리 내기",
        content: `## 단계별 가이드

### 준비 단계
1. 쇼파르를 오른손으로 잡기
2. 마우스피스를 입술에 대기
3. 깊은 숨 들이쉬기

### 소리 내기
1. **버징(Buzzing) 연습**
   - 쇼파르 없이 입술만으로 "뿌~" 소리 내기
   - 안정적인 버징이 될 때까지 연습

2. **쇼파르에 적용**
   - 버징하면서 쇼파르에 공기 불어넣기
   - 처음에는 짧은 소리부터 시작
   - 점차 길게 유지

### 첫 주 연습 계획
| 일차 | 목표 | 연습 시간 |
|------|------|----------|
| 1-2일 | 버징 익히기 | 10분 |
| 3-4일 | 짧은 소리 내기 | 15분 |
| 5-7일 | 3초 이상 유지 | 20분 |`
      },
      {
        id: "3.4",
        title: "음정과 음색 조절",
        content: `## 음정 변화 원리

쇼파르는 밸브가 없어 입술의 긴장도와 공기 압력으로 음정을 조절합니다.

### 낮은 음 내기
- 입술 긴장 풀기
- 공기 압력 낮추기
- 입술 구멍 약간 넓히기

### 높은 음 내기
- 입술 긴장 높이기
- 공기 압력 높이기
- 입술 구멍 좁히기

### 음색 개선 팁
1. **맑은 소리**: 일정한 공기 흐름 유지
2. **풍부한 소리**: 복식호흡으로 충분한 공기
3. **힘 있는 소리**: 복부 근육 사용

### 연습 곡선
- 1주차: 한 음정 안정적으로
- 2주차: 두 음정 전환
- 3주차: 세 음정 자유롭게
- 4주차: 전통 소리 패턴 시작`
      }
    ]
  },
  {
    id: 4,
    title: "전통 소리와 의식",
    duration: "6시간",
    sections: [
      {
        id: "4.1",
        title: "테키아 (Tekiah)",
        content: `## 테키아의 의미

테키아(תְּקִיעָה)는 "불다"라는 뜻의 히브리어 "타카(תָּקַע)"에서 유래했습니다. 하나님의 주권과 왕권을 선포하는 소리입니다.

### 음악적 특성
- **길이**: 약 3-4초
- **음정**: 단일 음정, 안정적
- **시작**: 깨끗하고 명확하게
- **끝**: 갑자기 끊지 않고 자연스럽게

### 연주 기법
1. 깊은 숨을 들이쉰다
2. 안정적인 앙부슈르 형성
3. 일정한 압력으로 공기 내보내기
4. 3-4초 동안 유지
5. 자연스럽게 소리 마무리

### 영적 의미
- **왕의 대관식**: 하나님을 왕으로 선포
- **각성의 부름**: 영적 잠에서 깨어남
- **승리의 선언**: 전쟁에서의 승리`
      },
      {
        id: "4.2",
        title: "쉐바림 (Shevarim)",
        content: `## 쉐바림의 의미

쉐바림(שְׁבָרִים)은 "부서진 것들"이라는 뜻입니다. 회개하는 마음의 탄식과 흐느낌을 표현합니다.

### 음악적 특성
- **구성**: 3개의 중간 길이 음
- **각 음 길이**: 약 1-1.5초
- **음정 변화**: 하강하는 느낌
- **특징**: 흐느끼는 듯한 소리

### 연주 기법
1. 테키아처럼 시작
2. 약 1초 후 소리 끊기
3. 즉시 다음 음 시작
4. 총 3회 반복
5. 각 음 사이 최소한의 간격

### 영적 의미
- **부서진 마음**: 겸손과 회개
- **탄식**: 죄에 대한 슬픔
- **치유의 시작**: 회복을 향한 첫걸음`
      },
      {
        id: "4.3",
        title: "테루아 (Teruah)",
        content: `## 테루아의 의미

테루아(תְּרוּעָה)는 "외침" 또는 "경보"를 의미합니다. 급박한 회개의 부름이자 영적 각성의 소리입니다.

### 음악적 특성
- **구성**: 9개 이상의 짧은 음
- **각 음 길이**: 매우 짧음 (스타카토)
- **전체 길이**: 쉐바림과 비슷
- **특징**: 빠르고 급박한 느낌

### 연주 기법
1. 혀를 사용하여 "투-투-투" 발음
2. 빠른 속도로 연속 연주
3. 최소 9개 음 연주
4. 일정한 리듬 유지
5. 마지막 음은 약간 길게

### 영적 의미
- **긴급한 부름**: 즉각적인 회개 촉구
- **경보**: 영적 위험 경고
- **울부짖음**: 간절한 기도`
      },
      {
        id: "4.4",
        title: "테키아 게돌라 (Tekiah Gedolah)",
        content: `## 테키아 게돌라의 의미

테키아 게돌라(תְּקִיעָה גְּדוֹלָה)는 "큰 테키아"라는 뜻으로, 쇼파르 의식의 마지막을 장식하는 긴 소리입니다.

### 음악적 특성
- **길이**: 가능한 한 길게 (보통 9초 이상)
- **음정**: 단일 음정, 매우 안정적
- **시작**: 강하고 명확하게
- **끝**: 점점 작아지며 자연스럽게

### 연주 기법
1. 최대한 깊은 숨 들이쉬기
2. 복부 근육 완전히 활용
3. 안정적인 압력 유지
4. 가능한 한 오래 유지
5. 숨이 다할 때까지 연주

### 영적 의미
- **최종 선포**: 의식의 완결
- **영원한 왕권**: 하나님의 영원한 통치
- **승리의 확신**: 완전한 구원의 확신`
      },
      {
        id: "4.5",
        title: "전통 패턴과 순서",
        content: `## 로쉬 하샤나 쇼파르 순서

전통적으로 로쉬 하샤나에는 100번의 쇼파르 소리를 불며, 세 가지 주요 패턴이 있습니다.

### 기본 패턴

**1. 타쉬랏 (TaShRaT)**
테키아 → 쉐바림-테루아 → 테키아

**2. 타쉬앗 (TaShAT)**
테키아 → 쉐바림 → 테키아

**3. 타랏 (TaRaT)**
테키아 → 테루아 → 테키아

### 전체 순서 (30회 기본)
| 세트 | 패턴 | 반복 |
|------|------|------|
| 1 | 타쉬랏 | 3회 |
| 2 | 타쉬앗 | 3회 |
| 3 | 타랏 | 3회 |

### 120명 나팔단 배치
- **선두**: Ba'al Tekiah (주 연주자)
- **좌우**: 보조 연주자들
- **후방**: 지원 연주자들
- **동기화**: 지휘자의 신호에 따라`
      }
    ]
  },
  {
    id: 5,
    title: "고급 기법과 앙상블",
    duration: "8시간",
    sections: [
      {
        id: "5.1",
        title: "고급 호흡 기법",
        content: `## 순환 호흡 (Circular Breathing)

순환 호흡은 끊김 없이 연속적으로 소리를 내는 고급 기법입니다.

### 원리
- 볼에 공기를 저장
- 코로 숨 들이쉬면서 볼의 공기로 소리 유지
- 연속적인 소리 생성

### 연습 단계
1. **물컵 연습**: 빨대로 물에 거품 내면서 코로 숨쉬기
2. **버징 연습**: 입술 버징하면서 순환 호흡
3. **쇼파르 적용**: 실제 연주에 적용

### 주의사항
- 고급 기법으로 기초가 완벽해야 함
- 무리하면 어지러움 발생 가능
- 점진적으로 연습 시간 늘리기`
      },
      {
        id: "5.2",
        title: "다이내믹 조절",
        content: `## 음량 조절 기법

### 크레센도 (Crescendo)
- 점점 세게
- 복부 압력 점진적 증가
- 입술 긴장도 유지

### 데크레센도 (Decrescendo)
- 점점 여리게
- 복부 압력 점진적 감소
- 소리 끊기지 않게 주의

### 악센트 (Accent)
- 특정 음 강조
- 순간적인 압력 증가
- 즉시 원래 음량으로

### 연습 방법
| 단계 | 목표 | 시간 |
|------|------|------|
| 1 | pp에서 ff까지 | 10초 |
| 2 | ff에서 pp까지 | 10초 |
| 3 | 악센트 연습 | 5분 |`
      },
      {
        id: "5.3",
        title: "앙상블 연주 기법",
        content: `## 120명 동시 연주의 핵심

### 동기화 (Synchronization)
대규모 앙상블에서 가장 중요한 것은 정확한 동기화입니다.

### 시각적 신호 체계
1. **준비**: 쇼파르를 입에 대기
2. **대기**: 지휘자 손 올림
3. **시작**: 손 내림과 동시에 연주
4. **종료**: 손 쥐기 신호

### 청각적 동기화
- 주 연주자(Ba'al Tekiah) 소리 따라가기
- 옆 사람과 음정 맞추기
- 전체 울림 듣기

### 위치별 역할
| 위치 | 역할 | 특징 |
|------|------|------|
| 선두 | 리드 | 시작과 끝 결정 |
| 중앙 | 지원 | 풍성한 울림 |
| 후방 | 베이스 | 깊은 음색 |`
      },
      {
        id: "5.4",
        title: "문제 해결과 유지보수",
        content: `## 흔한 문제와 해결책

### 소리 관련 문제
| 문제 | 원인 | 해결책 |
|------|------|--------|
| 소리 안 남 | 입술 긴장 | 워밍업 충분히 |
| 소리 갈라짐 | 균열 | 쇼파르 점검 |
| 음정 불안정 | 호흡 불안정 | 호흡 연습 |

### 쇼파르 관리
1. **사용 후**: 마우스피스 닦기
2. **보관**: 서늘하고 건조한 곳
3. **정기 점검**: 균열 확인
4. **금지 사항**: 물에 담그기, 직사광선

### 연주자 건강 관리
- 입술 보습 유지
- 과도한 연습 피하기
- 충분한 휴식`
      }
    ]
  },
  {
    id: 6,
    title: "영적 준비와 리더십",
    duration: "5시간",
    sections: [
      {
        id: "6.1",
        title: "Ba'al Tekiah의 자격",
        content: `## Ba'al Tekiah란?

Ba'al Tekiah(בַּעַל תְּקִיעָה)는 "쇼파르 부는 자의 주인"이라는 뜻으로, 공동체를 대표하여 쇼파르를 부는 사람입니다.

### 전통적 자격 요건
1. **영적 자격**
   - 경건한 생활
   - 토라 학습에 헌신
   - 공동체의 존경

2. **기술적 자격**
   - 모든 소리 완벽 연주
   - 안정적인 음질
   - 충분한 지구력

3. **인격적 자격**
   - 겸손함
   - 책임감
   - 섬기는 마음

### 현대적 적용
- 기술적 숙련도
- 영적 성숙함
- 리더십 자질`
      },
      {
        id: "6.2",
        title: "영적 준비 과정",
        content: `## 연주 전 준비

### 장기 준비 (엘룰 월)
- 매일 아침 쇼파르 연습
- 회개와 자기 성찰
- 기도와 묵상 시간

### 당일 준비
1. **신체적 준비**
   - 충분한 수면
   - 가벼운 식사
   - 워밍업 연습

2. **영적 준비**
   - 기도
   - 축복문 암송
   - 마음 정돈

### 축복문 (Brachot)
연주 전 두 가지 축복을 낭송합니다:

1. **쇼파르 축복**
> "바루크 아타 아도나이... 아쉐르 키드샤누 베미츠보타브 베치바누 리쉬모아 콜 쇼파르"

2. **쉐헤키야누**
> "바루크 아타 아도나이... 쉐헤키야누 베키예마누 베히기아누 라즈만 하제"`
      },
      {
        id: "6.3",
        title: "120명 나팔단 리더십",
        content: `## 단장의 역할

### 조직 관리
- 연주자 배치 결정
- 연습 일정 조율
- 장비 관리 감독

### 음악적 리더십
- 템포 결정
- 다이내믹 지시
- 동기화 유지

### 영적 리더십
- 기도 인도
- 영적 분위기 조성
- 격려와 지원

### 행사 당일 체크리스트
| 시간 | 항목 | 담당 |
|------|------|------|
| -2시간 | 장비 점검 | 장비팀 |
| -1시간 | 연주자 집합 | 단장 |
| -30분 | 워밍업 | 각 조장 |
| -15분 | 최종 점검 | 단장 |
| -5분 | 기도 | 단장 |`
      },
      {
        id: "6.4",
        title: "Kavanah - 거룩한 의도",
        content: `## Kavanah의 의미

Kavanah(כַּוָּנָה)는 "의도" 또는 "집중"을 의미하며, 쇼파르 연주의 영적 핵심입니다.

### 연주자의 Kavanah
1. **하나님께 집중**: 연주가 예배임을 인식
2. **공동체를 위한 마음**: 듣는 이들의 영적 유익
3. **회개의 마음**: 자신의 부족함 인정

### 청중의 Kavanah
1. **경청**: 소리에 온전히 집중
2. **묵상**: 각 소리의 의미 생각
3. **반응**: 마음으로 회개와 헌신

### 실천 방법
- 연주 전 잠시 묵상
- 각 소리의 의미 되새기기
- 기도하는 마음으로 연주
- 연주 후 감사 기도`
      }
    ]
  }
];

export default function Learn() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedModule, setSelectedModule] = useState(1);
  const [selectedSection, setSelectedSection] = useState("1.1");
  const [expandedModules, setExpandedModules] = useState<number[]>([1]);
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 진도 데이터 가져오기
  const { data: progressData } = trpc.progress.getModule.useQuery(
    { moduleId: selectedModule },
    { enabled: isAuthenticated }
  );

  const updateProgressMutation = trpc.progress.updateModule.useMutation();

  // 진도 데이터 로드
  useEffect(() => {
    if (progressData && progressData.completedCheckpoints) {
      const completed = new Set<string>(progressData.completedCheckpoints.split(',').filter(Boolean));
      setCompletedSections(completed);
    }
  }, [progressData]);

  // 로딩 중
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // 비회원
  if (!isAuthenticated) {
    return <GuestPrompt />;
  }

  const currentModule = modules.find(m => m.id === selectedModule);
  const currentSection = currentModule?.sections.find(s => s.id === selectedSection);

  const toggleModule = (moduleId: number) => {
    setExpandedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const selectSection = (moduleId: number, sectionId: string) => {
    setSelectedModule(moduleId);
    setSelectedSection(sectionId);
    setIsSidebarOpen(false);
  };

  const toggleSectionComplete = async (sectionId: string) => {
    const newCompleted = new Set(completedSections);
    const isNowComplete = !newCompleted.has(sectionId);

    if (isNowComplete) {
      newCompleted.add(sectionId);
    } else {
      newCompleted.delete(sectionId);
    }
    setCompletedSections(newCompleted);

    // 서버에 저장
    if (isAuthenticated) {
      const module = modules.find(m => m.id === selectedModule);
      const allCompleted = module ? module.sections.every(s => newCompleted.has(s.id)) : false;
      await updateProgressMutation.mutateAsync({
        moduleId: selectedModule,
        completedCheckpoints: Array.from(newCompleted).join(','),
        isCompleted: allCompleted,
      });
    }
  };

  const calculateModuleProgress = (moduleId: number) => {
    const module = modules.find(m => m.id === moduleId);
    if (!module) return 0;
    const completed = module.sections.filter(s => completedSections.has(s.id)).length;
    return Math.round((completed / module.sections.length) * 100);
  };

  const totalProgress = () => {
    const totalSections = modules.reduce((acc, m) => acc + m.sections.length, 0);
    const completed = completedSections.size;
    return Math.round((completed / totalSections) * 100);
  };

  // 마크다운을 HTML로 변환하는 간단한 함수
  const renderContent = (content: string) => {
    return content
      .split('\n')
      .map((line, i) => {
        // 헤더
        if (line.startsWith('## ')) {
          return <h2 key={i} className="text-2xl font-bold mt-8 mb-4 text-foreground">{line.slice(3)}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={i} className="text-xl font-semibold mt-6 mb-3 text-foreground">{line.slice(4)}</h3>;
        }
        // 인용문
        if (line.startsWith('> ')) {
          return (
            <blockquote key={i} className="border-l-4 border-primary pl-4 my-4 italic text-muted-foreground bg-primary/5 py-2 pr-4 rounded-r">
              {line.slice(2)}
            </blockquote>
          );
        }
        // 리스트
        if (line.startsWith('- ')) {
          return <li key={i} className="ml-4 mb-2">{line.slice(2)}</li>;
        }
        if (line.match(/^\d+\. /)) {
          return <li key={i} className="ml-4 mb-2 list-decimal">{line.replace(/^\d+\. /, '')}</li>;
        }
        // 테이블 (간단한 처리)
        if (line.startsWith('|')) {
          return null; // 테이블은 별도 처리 필요
        }
        // 빈 줄
        if (line.trim() === '') {
          return <br key={i} />;
        }
        // 일반 텍스트
        return <p key={i} className="mb-3 leading-relaxed">{line}</p>;
      });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 모바일 헤더 */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b border-border h-14 flex items-center px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <span className="ml-3 font-semibold">쇼파르 전문가 교육</span>
      </div>

      <div className="flex">
        {/* 사이드바 - 목차 */}
        <aside className={cn(
          "fixed lg:sticky top-0 left-0 z-40 h-screen w-80 bg-card border-r border-border transition-transform duration-300",
          "lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex flex-col h-full">
            {/* 헤더 */}
            <div className="p-6 border-b border-border">
              <h1 className="font-display text-xl font-bold text-foreground">쇼파르 전문가 교육</h1>
              <p className="text-sm text-muted-foreground mt-1">120명 나팔단 양성 과정</p>

              {/* 전체 진도 */}
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">전체 진도</span>
                  <span className="font-medium text-primary">{totalProgress()}%</span>
                </div>
                <Progress value={totalProgress()} className="h-2" />
              </div>
            </div>

            {/* 목차 */}
            <ScrollArea className="flex-1 p-4">
              <nav className="space-y-2">
                {modules.map((module) => (
                  <div key={module.id} className="space-y-1">
                    {/* 모듈 헤더 */}
                    <button
                      onClick={() => toggleModule(module.id)}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors",
                        selectedModule === module.id
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-accent text-foreground"
                      )}
                    >
                      {expandedModules.includes(module.id) ? (
                        <ChevronDown className="h-4 w-4 shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">Module {module.id}</span>
                          <Badge variant="outline" className="text-[10px] shrink-0">
                            {calculateModuleProgress(module.id)}%
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{module.title}</p>
                      </div>
                    </button>

                    {/* 섹션 목록 */}
                    {expandedModules.includes(module.id) && (
                      <div className="ml-6 space-y-1">
                        {module.sections.map((section) => (
                          <button
                            key={section.id}
                            onClick={() => selectSection(module.id, section.id)}
                            className={cn(
                              "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors",
                              selectedSection === section.id && selectedModule === module.id
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-accent text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {completedSections.has(section.id) ? (
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                            ) : (
                              <Circle className="h-4 w-4 shrink-0" />
                            )}
                            <span className="truncate">{section.id} {section.title}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>
            </ScrollArea>

            {/* 사용자 정보 */}
            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                  {(user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email || "U").substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email}</p>
                  <p className="text-xs text-muted-foreground">학습 중</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* 오버레이 (모바일) */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* 메인 콘텐츠 */}
        <main className="flex-1 min-h-screen lg:ml-0 pt-14 lg:pt-0">
          <div className="max-w-4xl mx-auto p-6 lg:p-12">
            {currentModule && currentSection && (
              <>
                {/* 콘텐츠 헤더 */}
                <div className="mb-8">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <BookOpen className="h-4 w-4" />
                    <span>Module {currentModule.id}: {currentModule.title}</span>
                    <span>•</span>
                    <Clock className="h-4 w-4" />
                    <span>{currentModule.duration}</span>
                  </div>
                  <h1 className="text-3xl font-display font-bold text-foreground">
                    {currentSection.id} {currentSection.title}
                  </h1>
                </div>

                {/* 콘텐츠 본문 */}
                <Card className="mb-8">
                  <CardContent className="p-8 prose prose-neutral dark:prose-invert max-w-none">
                    {renderContent(currentSection.content)}
                  </CardContent>
                </Card>

                {/* 완료 체크 및 네비게이션 */}
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="complete"
                      checked={completedSections.has(currentSection.id)}
                      onCheckedChange={() => toggleSectionComplete(currentSection.id)}
                    />
                    <label htmlFor="complete" className="text-sm font-medium cursor-pointer">
                      이 섹션을 완료했습니다
                    </label>
                  </div>

                  <div className="flex gap-2">
                    {/* 이전 섹션 */}
                    <Button
                      variant="outline"
                      onClick={() => {
                        const allSections = modules.flatMap(m => m.sections.map(s => ({ moduleId: m.id, ...s })));
                        const currentIndex = allSections.findIndex(s => s.id === currentSection.id && s.moduleId === currentModule.id);
                        if (currentIndex > 0) {
                          const prev = allSections[currentIndex - 1];
                          selectSection(prev.moduleId, prev.id);
                        }
                      }}
                    >
                      이전
                    </Button>

                    {/* 다음 섹션 */}
                    <Button
                      onClick={() => {
                        const allSections = modules.flatMap(m => m.sections.map(s => ({ moduleId: m.id, ...s })));
                        const currentIndex = allSections.findIndex(s => s.id === currentSection.id && s.moduleId === currentModule.id);
                        if (currentIndex < allSections.length - 1) {
                          const next = allSections[currentIndex + 1];
                          selectSection(next.moduleId, next.id);
                        }
                      }}
                    >
                      다음
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
