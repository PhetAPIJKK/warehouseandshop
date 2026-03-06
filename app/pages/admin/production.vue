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
          <button type="submit" :disabled="saving || !form.product_id || form.qty <= 0" class="btn-primary">
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
.form-container { max-width: 800px; margin: 0 auto; padding: 2rem; }
.page-header { margin-bottom: 1.5rem; }
.title { font-size: 1.5rem; font-weight: bold; color: #1e293b; }
.form-card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
.form-group { display: flex; flex-direction: column; gap: 0.5rem; }
.full-width { grid-column: 1 / -1; }

label { font-size: 0.95rem; font-weight: 600; color: #475569; }
.input-field { padding: 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 1rem; width: 100%; box-sizing: border-box; }
.input-field:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }

.form-actions { margin-top: 1rem; display: flex; justify-content: flex-end; padding-top: 1rem; border-top: 1px solid #e2e8f0; }
.btn-primary { background: #10b981; color: white; padding: 0.75rem 2rem; border-radius: 6px; font-weight: 600; cursor: pointer; border: none; width: 100%; }
.btn-primary:hover:not(:disabled) { background: #059669; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.loading-state { text-align: center; color: #64748b; padding: 2rem 0; }
</style>