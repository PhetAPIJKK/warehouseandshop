<template>
  <div class="product-detail-container">
    <div v-if="loading" class="loading-state">กำลังโหลดข้อมูลสินค้า...</div>
    <div v-else-if="!product" class="error-state">ไม่พบข้อมูลสินค้านี้</div>
    
    <div v-else class="product-layout">
      <div class="product-image-section">
        <img 
          v-if="product.image_url" 
          :src="product.image_url" 
          :alt="product.name" 
          class="main-image" 
        />
        <div v-else class="no-image-large">ไม่มีรูปภาพ</div>
      </div>

      <div class="product-info-section">
        <NuxtLink to="/" class="back-link">← กลับหน้าร้านค้า</NuxtLink>
        
        <div class="sku-badge">SKU: {{ product.sku || 'N/A' }}</div>
        <h1 class="product-title">{{ product.name }}</h1>
        <div class="product-price">฿{{ product.sell_price?.toLocaleString() || 0 }}</div>
        
        <div class="product-description">
          <h3>รายละเอียดสินค้า</h3>
          <p>{{ product.description || 'ไม่มีคำอธิบายเพิ่มเติม' }}</p>
        </div>

        <div class="stock-status" :class="{'text-danger': product.stock_qty <= 0}">
          สถานะ: {{ product.stock_qty > 0 ? `มีสินค้าในสต็อก (${product.stock_qty} ชิ้น)` : 'สินค้าหมด' }}
        </div>

        <div class="action-box">
          <div class="qty-selector">
            <button @click="decreaseQty" class="btn-qty-adj">-</button>
            <span class="qty-display">{{ orderQty }}</span>
            <button @click="increaseQty" class="btn-qty-adj" :disabled="orderQty >= product.stock_qty">+</button>
          </div>
          
          <button 
            @click="handleAddToCart" 
            class="btn-add-to-cart-large"
            :disabled="product.stock_qty <= 0"
          >
            {{ product.stock_qty > 0 ? 'หยิบใส่ตะกร้า' : 'สินค้าหมดชั่วคราว' }}
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'default' })

const route = useRoute()
const { getProductById } = useInventory()
const { addToCart } = useCart()

const product = ref(null)
const loading = ref(true)
const orderQty = ref(1) // จำนวนที่ต้องการซื้อเริ่มต้นคือ 1

onMounted(async () => {
  const { data } = await getProductById(route.params.id)
  if (data) {
    product.value = data
  }
  loading.value = false
})

const increaseQty = () => {
  if (orderQty.value < product.value.stock_qty) {
    orderQty.value++
  }
}

const decreaseQty = () => {
  if (orderQty.value > 1) {
    orderQty.value--
  }
}

const handleAddToCart = () => {
  if (product.value) {
    addToCart(product.value, orderQty.value)
    // เพิ่มเสร็จรีเซ็ตกลับเป็น 1 เผื่อกดเพิ่มซ้ำ
    orderQty.value = 1 
  }
}
</script>

<style scoped>
.product-detail-container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
.loading-state, .error-state { text-align: center; padding: 4rem; font-size: 1.2rem; color: #64748b; }

.product-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: start; background: white; padding: 2.5rem; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }
@media (max-width: 768px) { .product-layout { grid-template-columns: 1fr; gap: 2rem; padding: 1.5rem; } }

/* ฝั่งรูปภาพ */
.product-image-section { border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; background: #f8fafc; aspect-ratio: 1/1; display: flex; align-items: center; justify-content: center; }
.main-image { width: 100%; height: 100%; object-fit: cover; }
.no-image-large { font-size: 1.5rem; color: #94a3b8; }

/* ฝั่งข้อมูล */
.back-link { display: inline-block; margin-bottom: 1.5rem; color: #64748b; text-decoration: none; font-weight: 500; transition: color 0.2s; }
.back-link:hover { color: #0f172a; }

.sku-badge { display: inline-block; background: #f1f5f9; color: #475569; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.85rem; font-weight: 600; margin-bottom: 1rem; }
.product-title { font-size: 2.5rem; font-weight: 800; color: #0f172a; margin: 0 0 1rem 0; line-height: 1.2; }
.product-price { font-size: 2rem; font-weight: 800; color: #3b82f6; margin-bottom: 2rem; }

.product-description { margin-bottom: 2rem; }
.product-description h3 { font-size: 1.1rem; color: #1e293b; margin-bottom: 0.5rem; }
.product-description p { color: #475569; line-height: 1.6; }

.stock-status { font-weight: 600; color: #10b981; margin-bottom: 1.5rem; }
.text-danger { color: #ef4444; }

/* กล่องเพิ่มลงตะกร้า */
.action-box { display: flex; gap: 1rem; align-items: center; background: #f8fafc; padding: 1.5rem; border-radius: 12px; border: 1px solid #e2e8f0; }
@media (max-width: 640px) { .action-box { flex-direction: column; align-items: stretch; } }

.qty-selector { display: flex; align-items: center; background: white; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; }
.btn-qty-adj { width: 48px; height: 48px; background: none; border: none; font-size: 1.2rem; font-weight: bold; cursor: pointer; transition: background 0.2s; }
.btn-qty-adj:hover:not(:disabled) { background: #f1f5f9; }
.btn-qty-adj:disabled { opacity: 0.3; cursor: not-allowed; }
.qty-display { width: 50px; text-align: center; font-weight: bold; font-size: 1.1rem; border-left: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1; padding: 0.5rem 0; }

.btn-add-to-cart-large { flex-grow: 1; background: #0f172a; color: white; border: none; border-radius: 8px; font-size: 1.1rem; font-weight: bold; cursor: pointer; padding: 0 1.5rem; height: 48px; transition: background 0.2s; }
.btn-add-to-cart-large:hover:not(:disabled) { background: #1e293b; }
.btn-add-to-cart-large:disabled { background: #cbd5e1; cursor: not-allowed; }
</style>