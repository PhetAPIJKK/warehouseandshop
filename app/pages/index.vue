<template>
  <div class="container">

    <main class="content">
      <!-- <section class="hero">
        <h1>ยินดีต้อนรับสู่ระบบจัดการคลังสินค้า</h1>
        <p>Master of Science in CS & IT - KKU Project</p>
      </section> -->

      <section class="w-full flex flex-col items-center pt-14 md:pt-18 px-4 md:px-8">
      
      <!-- กรอบรูปภาพ -->
      <div class="relative w-full max-w-6xl rounded-2xl md:rounded-[2rem] overflow-hidden shadow-md group">
        <!-- ภาพแบนเนอร์ -->
        <!-- [Responsive]: มือถือใช้สัดส่วน 4:3, จอคอมใช้ 21:9 และใช้ object-cover เพื่อไม่ให้ภาพผิดเพี้ยน -->
        <img 
          :src="heroImages[currentSlide]" 
          alt="Featured Craft Products" 
          class="w-full aspect-[4/3] md:aspect-[21/9] object-cover transition-all duration-500 ease-in-out"
        />

        <!-- ข้อความป้ายกำกับ (ถ้าอยากให้มีข้อความทับบนรูป ลบ comment ออกได้ครับ) -->
        <!-- 
        <div class="absolute inset-0 bg-black/20 flex items-center justify-center">
          <h1 class="text-white text-3xl md:text-5xl font-bold drop-shadow-lg">Welcome to Our Shop</h1>
        </div> 
        -->
      </div>

      <!-- จุดนำทาง (Dots Indicator) -->
      <div class="flex space-x-3 md:space-x-4 mt-6 md:mt-8">
        <button 
          v-for="(img, index) in heroImages" 
          :key="index"
          @click="setSlide(index)"
          :class="[
            'w-3 h-3 md:w-4 md:h-4 rounded-full transition-all duration-300 focus:outline-none',
            currentSlide === index ? 'bg-[#ff8fa3] scale-125' : 'bg-gray-300 hover:bg-gray-400'
          ]"
          :aria-label="`Go to slide ${index + 1}`"
        ></button>
      </div>
    </section>

      <section class="featured">
        
        
        <h2>รายการสินค้าแนะนำ</h2>

        <div v-if="pending" class="status-msg">กำลังโหลดสินค้า...</div>

        <div v-else-if="error" class="status-msg error">
          เกิดข้อผิดพลาด: {{ error.message }}
        </div>

        <div v-else class="product-grid">
          <div v-for="product in products" :key="product.id"  class="bg-pink-50 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition duration-300 group cursor-pointer">

            <NuxtLink :to="`/product/${product.id}`" class="product-image-wrapper">
              <img v-if="product.image_url" :src="product.image_url" :alt="product.name" class="product-image" />
              <div v-else class="no-image">ไม่มีรูปภาพ</div>
            </NuxtLink>

            <div class="product-info">
              <div class="product-sku">{{ product.sku || 'N/A' }}</div>

              <NuxtLink :to="`/product/${product.id}`" class="product-link">
                <h3 class="product-name">{{ product.name }}</h3>
              </NuxtLink>

              <div class="price-stock-row">
                <span class="product-price">฿{{ product.sell_price?.toLocaleString() || 0 }}</span>
                <span class="product-stock" :class="{ 'out-of-stock': product.stock_qty <= 0 }">
                  {{ product.stock_qty > 0 ? `เหลือ ${product.stock_qty} ชิ้น` : 'สินค้าหมด' }}
                </span>
              </div>
            </div>

            <button @click="addToCart(product, 1)" class="btn-add-cart" :disabled="product.stock_qty <= 0">
              {{ product.stock_qty > 0 ? 'หยิบใส่ตะกร้า' : 'สินค้าหมด' }}
            </button>
          </div>
        </div>


      </section>
      <section class="featured">
        <h2>ผู้ใช้ระบบ</h2>

        <div v-if="pending" class="status-msg">กำลังโหลดสินค้า...</div>

        <div v-else-if="error" class="status-msg error">
          เกิดข้อผิดพลาด: {{ error.message }}
        </div>

        <div v-else class="product-grid">
          <div v-for="user in users" :key="user.id" class="product-card">
            <h3>{{ user.sta }}</h3>
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
definePageMeta({layout:'default'})
// 1. ดึงข้อมูล User และฟังก์ชัน Logout จาก Composable
const { user, logout } = useAuth()
const { addToCart, cartItemCount } = useCart()

// 2. ดึงฟังก์ชันจัดการสินค้าจาก Composable
const { getFeaturedProducts } = useProducts()
const { getAllUsers } = useUsers()
const { role, isRoleLoading } = useUserRole()

// 3. ดึงข้อมูลสินค้า 4 รายการล่าสุด
const { data: products, pending, error } = await getFeaturedProducts(4)
const { data: users, refresh: refreshUsers } = await getAllUsers()
watch(user, () => {
  if (refreshUsers) refreshUsers()
})
const currentSlide = ref(0)
const heroImages = [
  '/Home/Home1.png', 
  '/Home/Home2.png',
  '/Home/Home3.png',
  '/Home/Home4.png'
]
const setSlide = (index) => {
  currentSlide.value = index
}
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 5%;
  background: #fff;
  border-bottom: 1px solid #eee;
}

.brand {
  font-size: 1.5rem;
  font-weight: bold;
  color: #4f46e5;
}

.user-logged-in {
  display: flex;
  align-items: center;
  gap: 10px;
}

.email-display {
  background: #f3f4f6;
  padding: 5px 15px;
  border-radius: 20px;
  font-size: 0.9rem;
}

.btn-logout {
  border: 1px solid #ff4d4f;
  color: #ff4d4f;
  background: none;
  padding: 5px 10px;
  border-radius: 6px;
  cursor: pointer;
}

.btn-login {
  background: #4f46e5;
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  text-decoration: none;
}

.content {
  padding: 2rem 5%;
}

.hero {
  text-align: center;
  margin-bottom: 3rem;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.product-card {
  border: 1px solid #eee;
  border-radius: 12px;
  overflow: hidden;
  background: #FF8fa3;
  text-align: center;
}

.product-card img {
  width: 100%;
  height: 150px;
  object-fit: cover;
}

.product-info {
  padding: 15px;
}

.sku {
  font-size: 0.8rem;
  color: #888;
}

.price {
  font-weight: bold;
  color: #4f46e5;
  font-size: 1.2rem;
  margin: 10px 0;
}

.stock-tag {
  font-size: 0.85rem;
  color: #10b981;
  font-weight: 500;
}

.status-msg {
  text-align: center;
  padding: 2rem;
}

.error {
  color: #ff4d4f;
}
</style>