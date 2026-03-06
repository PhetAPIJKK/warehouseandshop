<template>
  <div class="container">
 
    <main class="content">
      <section class="hero">
        <h1>ยินดีต้อนรับสู่ระบบจัดการคลังสินค้า</h1>
        <p>Master of Science in CS & IT - KKU Project</p>
      </section>

      <section class="featured">
        <h2>รายการสินค้าแนะนำ</h2>
        
        <div v-if="pending" class="status-msg">กำลังโหลดสินค้า...</div>
        
        <div v-else-if="error" class="status-msg error">
          เกิดข้อผิดพลาด: {{ error.message }}
        </div>

        <div v-else class="product-grid">
          <div v-for="item in products" :key="item.id" class="product-card">
            <img :src="item.image_url || 'https://via.placeholder.com/150'" alt="Product" />
            <div class="product-info">
              <h3>{{ item.name }}</h3>
              <p class="sku">SKU: {{ item.sku }}</p>
              <p class="price">฿{{ item.sell_price?.toLocaleString() }}</p>
              <div class="stock-tag">คงเหลือ: {{ item.stock_qty }}</div>
            </div>
          </div>
        </div>
      </section>
      <section class="featured">
        <h2>รายการสินค้าแนะนำ</h2>
        
        <div v-if="pending" class="status-msg">กำลังโหลดสินค้า...</div>
        
        <div v-else-if="error" class="status-msg error">
          เกิดข้อผิดพลาด: {{ error.message }}
        </div>

        <div v-else class="product-grid">
          <div v-for="user in users" :key="user.id" class="product-card">
              <h3>{{user.sta }}</h3>
              <p class="sku">เมล:{{ user.email }}</p>
              <div class="stock-tag">สถานะ: {{ user.role }}</div>
            </div>
          </div>
        
      </section>
      
      
    </main>
  </div>
</template>

<script setup>
/**
 * ไม่ต้องเขียน import { useAuth } หรือ useProducts
 * Nuxt จะหาไฟล์ในโฟลเดอร์ composables ให้เองอัตโนมัติ
 */

// 1. ดึงข้อมูล User และฟังก์ชัน Logout จาก Composable
const { user, logout } = useAuth()

// 2. ดึงฟังก์ชันจัดการสินค้าจาก Composable
const { getFeaturedProducts } = useProducts()
const { getAllUsers } = useUsers()
const { role, isRoleLoading } = useUserRole()

// 3. ดึงข้อมูลสินค้า 4 รายการล่าสุด
const { data: products, pending, error} = await getFeaturedProducts(4)

watch(user, () => {
  if (refreshUsers) refreshUsers()
})
</script>

<style scoped>
.navbar { display: flex; justify-content: space-between; align-items: center; padding: 1rem 5%; background: #fff; border-bottom: 1px solid #eee; }
.brand { font-size: 1.5rem; font-weight: bold; color: #4f46e5; }
.user-logged-in { display: flex; align-items: center; gap: 10px; }
.email-display { background: #f3f4f6; padding: 5px 15px; border-radius: 20px; font-size: 0.9rem; }
.btn-logout { border: 1px solid #ff4d4f; color: #ff4d4f; background: none; padding: 5px 10px; border-radius: 6px; cursor: pointer; }
.btn-login { background: #4f46e5; color: white; padding: 8px 16px; border-radius: 8px; text-decoration: none; }

.content { padding: 2rem 5%; }
.hero { text-align: center; margin-bottom: 3rem; }
.product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; }
.product-card { border: 1px solid #eee; border-radius: 12px; overflow: hidden; background: white; text-align: center; }
.product-card img { width: 100%; height: 150px; object-fit: cover; }
.product-info { padding: 15px; }
.sku { font-size: 0.8rem; color: #888; }
.price { font-weight: bold; color: #4f46e5; font-size: 1.2rem; margin: 10px 0; }
.stock-tag { font-size: 0.85rem; color: #10b981; font-weight: 500; }
.status-msg { text-align: center; padding: 2rem; }
.error { color: #ff4d4f; }
</style>