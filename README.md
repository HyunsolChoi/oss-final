# OSS CareerFit

채용 공고를 크롤링하고, 사용자 정보 및 GPT 기반 분석을 제공하는 취업 지원 웹 서비스입니다.

### 기능 요약
- 회원가입 및 로그인
- 관심 직무 기반 채용 공고 추천
- 채용 공고 조회 및 즐겨찾기
- 공고 크롤링
- 맵 필터링 등 사용자 경험 개선
- 기타

## 기술 스택
- 프론트엔드: React, TypeScript
- 백엔드: Node.js, Express
- DB: MySQL
- 기타: PM2, Nginx, cron
- 
## 프로젝트 구조
```
oss-careerfit/
├── backend/        # 백엔드 서버
│ ├── routes/       # API 라우터
│ ├── controllers/  # 직접 DB로 쿼리 전송 
│ ├── DB_setup/     # 크롤링 및 DB 삽입 스크립트
│ ├── Utils/        # 공통 유틸 및 스케줄러
│ ├── server.js     # 서버 엔트리 포인트
├── frontend/       # React 프론트엔드
│ ├── public/       
│ ├── src/          # 프론트엔드 소스 코드
│ │ ├── api/        # API 요청 관련 모듈
│ │ ├── components/ # React 컴포넌트(.tsx, .css)            
│ │ ├── App.tsx     # 루트 컴포넌트
│ │ └── ...        
│ └── ...
├── .env            # 환경변수 설정
├── package.json
└── README.md
```

## 실행 방법

`npm install`

### 1. 개발 환경 실행
.env 의 `PORT=5000 ` 설정 필요

```bash
npm run dev
```
dev:backend: 포트 5000에서 백엔드 실행

dev:frontend: 포트 3000에서 프론트엔드 실행

### 2. 서버 배포 환경 실행
.env 의 `PORT=3000 ` 설정 필요  
(JCloud 환경의 포트포워딩을 고려)  
React 환경 고려 메모리 확보 및 기타 실행 정보 수정 필요
```bash
pm2 start backend/server.js --name backend
npm run build
pm2 start npx --name frontend -- serve -s build -l 80
```

### 환경 변수 예시
```
DB_HOST=DB호스트주소
DB_PORT=DB포트
DB_USER=DB사용자명
DB_PASSWORD=DB비밀번호
DB_DATABASE=DB이름

# backend 서버 포트, 배포 시 3000 (환경에 맞게 변경)
PORT=5000 

SMTP_HOST=smtp.gmail.com
SMTP_PORT=SMTP포트
SMTP_SECURE=false
SMTP_USER=이메일주소
SMTP_PASS=이메일비밀번호
SMTP_FROM=예시)"CareerFit <example@gmail.com>"

# 랜덤한 값
JWT_SECRET=JWT를 위한 값

OPENAI_API_KEY=OPENAI_API_키 값
```