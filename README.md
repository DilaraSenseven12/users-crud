# Users CRUD – React + Vite + Ant Design

Modern frontend mimarisiyle geliştirilmiş, servis katmanı ayrıştırılmış, local-first yaklaşımı bulunan bir **Users CRUD** uygulaması.  
Proje JSONPlaceholder API kullanılarak oluşturulmuştur ve gerçek backend entegrasyonuna hazır yapıdadır.

---

## 🚀 Features

- Users listesi görüntüleme  
- User detay sayfası  
- User’a ait:
  - Posts
  - Todos
  - Albums  
- Create / Update / Delete (modal yapılarıyla)
- Arama & tablo yönetimi
- LocalStorage destekli repository katmanı
- i18n altyapısı
- Modüler SCSS + Tailwind mimarisi
- Ant Design tabanlı profesyonel UI

---

## 🧱 Tech Stack

- **React**
- **Vite**
- **Ant Design**
- **Tailwind CSS**
- **SCSS architecture**
- **i18next**
- **Axios**
- **JSONPlaceholder API**

---

## 🏗️ Project Architecture

```txt
src/
 ├─ api/            # API endpoints & request layers
 ├─ app/            # App setup, providers, router
 ├─ assets/styles/  # Global SCSS, variables, mixins
 ├─ components/     # Reusable UI components
 ├─ i18n/           # Language configuration
 ├─ pages/          # Page-based routing structure
 ├─ storage/        # LocalStorage & repo pattern
 ├─ theme/          # Theme & dark-mode tokens
