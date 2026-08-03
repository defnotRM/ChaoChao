# ChaoChao

## Getting Started

### 1. Clone Repository

```bash
git clone https://github.com/defnotRM/ChaoChao.git
cd ChaoChao
```

### 2. switch ไปยัง Branch ของตัวเอง

ดูรายการ Branch

```bash
git branch -r
```

สลับไปยัง Branch ของตัวเอง

```bash
git switch <your-branch>
```

หากยังไม่มี Branch ในเครื่อง (หลังจาก clone ครั้งแรก)

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

ก่อนเริ่มทำงานทุกครั้ง ให้อัปเดต Branch ของตัวเองด้วย `main`

```bash
git fetch origin 
git switch <your-branch>
git merge origin/main
```
คำอธิบาย

- `git fetch origin` ดึงข้อมูลและ Commit ล่าสุดจาก GitHub โดยยังไม่แก้ไขโค้ดในเครื่อง
- `git switch <your-branch>` สลับไปยัง Branch ของตัวเอง
- `git merge origin/main` รวมการเปลี่ยนแปลงล่าสุดจาก Branch `main` เข้า Branch ของตัวเอง

เมื่อทำงานเสร็จ

```bash
git add .
git commit -m "your message"
git push
```
คําอธิบาย
- `git add .`  เพิ่มไฟล์ที่มีการเปลี่ยนแปลงทั้งหมดเข้าสู่ Staging Area
- `git commit -m "your message"`  บันทึกการเปลี่ยนแปลงพร้อมข้อความอธิบายสิ่งที่แก้ไข เช่น `your message`
- `git push`  อัปโหลด Commit ล่าสุดจาก Branch ของตัวเองขึ้น GitHub

จากนั้นเปิด **Pull Request** จาก Branch ของตัวเองเข้า `main`

---

## Rules

* ทำงานบน Branch ของตัวเองเท่านั้น
* ห้าม Commit หรือ Push ลง `main` โดยตรง
* อัปเดต Branch ของตัวเองจาก `main` ก่อนเริ่มงานทุกครั้ง
* เปิด Pull Request ก่อน Merge เข้า `main`
