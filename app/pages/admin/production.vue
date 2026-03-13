<template>
  <div class="form-container">
    <header class="page-header">
      <h1 class="title">🏭 การผลิต (เพิ่มสต็อก)</h1>
    </header>

    <div class="form-card">
      <div v-if="loading" class="loading-state">กำลังโหลดข้อมูลสินค้า...</div>
      
      <form v-else @submit.prevent="submitProduction" class="form-grid">
        
        <div class="form-group full-width">
          <label>เลือกสินค้าที่ผลิตเสร็จแล้ว</label>
          <select v-model="form.product_id" class="input-field" required>
            <option value="" disabled>-- กรุณาเลือกสินค้า --</option>
            <option v-for="product in products" :key="product.id" :value="product.id">
              [{{ product.sku || 'ไม่มี SKU' }}] {{ product.name }} - (สต็อกปัจจุบัน: {{ product.stock_qty || 0 }} ชิ้น)
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>จำนวนที่ผลิตได้ (ชิ้น)</label>
          <input 
            v-model.number="form.qty" 
            type="number" 
            min="1" 
            class="input-field" 
            placeholder="ระบุจำนวน..."
            required
          />
        </div>

        <div class="form-group">
          <label>หมายเหตุ (ถ้ามี)</label>
          <input 
            v-model="form.note" 
            type="text" 
            class="input-field" 
            placeholder="เช่น ผลิตล็อตพิเศษรอบเช้า"
          />
        </div>

        <div class="form-actions full-width">
          <button type="submit" :disabled="saving || !form.product_id || form.qty <= 0" class="btn-success">
            {{ saving ? 'กำลังบันทึก...' : 'บันทึกการผลิตสินค้า' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin', middleware: 'admin' })

const { produceProduct } = useInventory()
const client = useSupabaseClient() // ⭐️ เรียกใช้ Supabase ตรงๆ เพื่อไม่ให้ติด Cache

const products = ref([])
const loading = ref(true)
const saving = ref(false)

const form = ref({
  product_id: '',
  qty: 1,
  note: ''
})

onMounted(async () => {
  await loadProducts()
})

// ⭐️ เปลี่ยนมาใช้คำสั่งดึงข้อมูลตรงๆ
const loadProducts = async () => {
  loading.value = true
  const { data, error } = await client
    .from('products')
    .select('id, sku, name, stock_qty')
    .order('created_at', { ascending: false })
    
  if (data) {
    products.value = data
  }
  loading.value = false
}

const submitProduction = async () => {
  if (!form.value.product_id || form.value.qty <= 0) return

  saving.value = true
  const { error } = await produceProduct(form.value.product_id, form.value.qty, form.value.note)
  saving.value = false

  if (error) {
    alert('เกิดข้อผิดพลาดในการบันทึก: ' + error.message)
  } else {
    alert('บันทึกการผลิตและอัปเดตสต็อกเรียบร้อยแล้ว!')
    form.value.product_id = ''
    form.value.qty = 1
    form.value.note = ''
    await loadProducts() // โหลดข้อมูลใหม่ ตัวเลขสต็อกจะเปลี่ยนทันที
  }
}
</script>

<style scoped>
@import '~/assets/css/admin-style.css';
</style>