# Project Name

## Getting Started

### 1. Clone Repository

```bash
git clone https://github.com/<owner>/<repository>.git
cd <repository>
```

### 2. Checkout ไปยัง Branch ของตัวเอง

ดูรายการ Branch

```bash
git branch -r
```

สลับไปยัง Branch ของตัวเอง

```bash
git switch <your-branch>
```

หากยังไม่มี Branch ในเครื่อง

```bash
git switch --track origin/<your-branch>
```

### 3. ติดตั้ง Dependencies

```bash
npm install
```

### 4. รันโปรเจกต์

```bash
npm run dev
```

จากนั้นเปิด

```
http://localhost:3000
```

---

## Workflow

ก่อนเริ่มทำงานทุกครั้ง ให้อัปเดต `main`

```bash
git checkout main
git pull origin main
```

กลับไปยัง Branch ของตัวเอง

```bash
git checkout <your-branch>
```

Merge `main` เข้ามา

```bash
git merge main
```

เมื่อทำงานเสร็จ

```bash
git add .
git commit -m "feat: your message"
git push
```

จากนั้นเปิด **Pull Request** จาก Branch ของตัวเองเข้า `main`

---

## Rules

* ทำงานบน Branch ของตัวเองเท่านั้น
* ห้าม Commit หรือ Push ลง `main` โดยตรง
* อัปเดต Branch ของตัวเองจาก `main` ก่อนเริ่มงานทุกครั้ง
* เปิด Pull Request ก่อน Merge เข้า `main`
