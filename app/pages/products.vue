<template>
  <main class="container">
    <header class="page-header">
      <h1 class="title">สินค้าทั้งหมด</h1>
      <p class="subtitle">เลือกดูสินค้าคุณภาพจากคลังสินค้าของเรา</p>
    </header>

    <div v-if="pending" class="status-msg">กำลังโหลดรายการสินค้า...</div>
    <div v-else-if="error" class="status-msg error">เกิดข้อผิดพลาด: {{ error.message }}</div>

    <div v-else class="product-grid">
      <div v-for="item in products" :key="item.id" class="product-card">
        <div class="product-image">
          <img :src="item.image_url || 'https://via.placeholder.com/150'" :alt="item.name" />
        </div>
        <div class="product-details">
          <h3 class="name">{{ item.name }}</h3>
          <p class="category" v-if="item.product_categories">
            หมวดหมู่: {{ item.product_categories.name }}
          </p>
          <p class="sku">SKU: {{ item.sku }}</p>
          <p class="price">฿{{ item.sell_price?.toLocaleString() }}</p>
          <div class="stock-info">คงเหลือ: {{ item.stock_qty }}</div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
/**
 * หน้าหนี้ไม่ต้องใส่ definePageMeta({ middleware: 'auth' })
 * เพื่อให้บุคคลทั่วไปเข้าถึงได้โดยไม่ต้อง Login ครับ
 */

const { getAllProducts } = useProducts() // เรียกใช้ฟังก์ชันดึงสินค้าทั้งหมด
const { data: products, pending, error } = await getAllProducts()
</script>

<style scoped>
.container { max-width: 1200px; margin: 0 auto; padding: 3rem 1.5rem; }
.page-header { text-align: center; margin-bottom: 3rem; }
.title { font-size: 2rem; font-weight: 800; color: #1a1a1a; }
.subtitle { color: #666; margin-top: 0.5rem; }

/* Product Grid ตามดีไซน์ที่คุณชอบ */
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 2rem;
}

.product-card {
  background: white;
  border: 1px solid #eee;
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.3s ease;
}

.product-card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.05); }

.product-image { width: 100%; height: 220px; background: #fafafa; }
.product-image img { width: 100%; height: 100%; object-fit: contain; padding: 1rem; }

.product-details { padding: 1.5rem; text-align: center; }
.name { font-size: 1.1rem; font-weight: 700; color: #333; margin-bottom: 0.5rem; }
.category { font-size: 0.85rem; color: #4f46e5; margin-bottom: 0.5rem; }
.sku { font-size: 0.8rem; color: #999; margin-bottom: 1rem; }
.price { font-size: 1.3rem; font-weight: 800; color: #4f46e5; margin-bottom: 0.5rem; }
.stock-info { font-size: 0.9rem; color: #10b981; font-weight: 600; }

.status-msg { text-align: center; padding: 5rem; color: #666; }
.error { color: #ef4444; }
</style>