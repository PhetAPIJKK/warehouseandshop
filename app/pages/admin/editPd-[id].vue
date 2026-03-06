<template>
  <div class="form-container">
    <header class="page-header">
      <h1 class="title">✏️ แก้ไขสินค้า</h1>
      <NuxtLink to="/admin" class="btn-cancel">กลับหน้ารายการ</NuxtLink>
    </header>

    <div v-if="loading" class="loading-state">กำลังโหลดข้อมูล...</div>

    <div v-else class="form-card">
      <div class="form-grid">
        <div class="form-group">
          <label>SKU (รหัสสินค้า)</label>
          <input v-model="form.sku" type="text" class="input-field" placeholder="เช่น PROD-001" />
        </div>

        <div class="form-group">
          <label>ชื่อสินค้า</label>
          <input v-model="form.name" type="text" class="input-field" />
        </div>

        <div class="form-group">
          <label>หมวดหมู่</label>
          <select v-model="form.category_id" class="input-field">
            <option value="">-- เลือกหมวดหมู่ --</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">
              {{ cat.name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>ราคาขาย (บาท)</label>
          <input v-model.number="form.sell_price" type="number" class="input-field" />
        </div>

        <div class="form-group full-width">
          <label>รายละเอียดสินค้า</label>
          <textarea v-model="form.description" class="input-field" rows="4"></textarea>
        </div>

        <div class="form-group">
          <label>จำนวนคงเหลือ (ไม่อนุญาตให้แก้ไขที่หน้านี้)</label>
          <input 
            v-model="form.stock_qty" 
            type="number" 
            class="input-field disabled-input" 
            disabled 
          />
        </div>
      </div>

      <div class="form-actions">
        <button @click="saveUpdate" :disabled="saving" class="btn-primary">
          {{ saving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const { getProductById, updateProduct, getCategories } = useInventory()

const form = ref({
  sku: '',
  name: '',
  category_id: '',
  description: '',
  sell_price: 0,
  stock_qty: 0 // ดึงมาแสดงเฉยๆ
})

const categories = ref([])
const loading = ref(true)
const saving = ref(false)

// ดึงข้อมูลเดิมมาแสดงเมื่อเปิดหน้าเว็บ
onMounted(async () => {
  // 1. ดึงหมวดหมู่สำหรับ Dropdown
  const { data: catData } = await getCategories()
  if (catData) categories.value = catData

  // 2. ดึงข้อมูลสินค้าเดิมตาม ID ใน URL
  const { data: product } = await getProductById(route.params.id)
  if (product) {
    form.value = {
      sku: product.sku || '',
      name: product.name || '',
      category_id: product.category_id || '',
      description: product.description || '',
      sell_price: product.sell_price || 0,
      stock_qty: product.stock_qty || 0 // เอามาโชว์ให้เห็นว่ามีกี่ชิ้น
    }
  }
  loading.value = false
})

// ฟังก์ชันตอนกดบันทึก
const saveUpdate = async () => {
  saving.value = true

  // ⭐️ สำคัญ: สร้าง Object ใหม่เพื่อส่งไปอัปเดต โดยจงใจ "ไม่ใส่" stock_qty เข้าไป
  const payloadToUpdate = {
    sku: form.value.sku,
    name: form.value.name,
    category_id: form.value.category_id || null, // ถ้าไม่ได้เลือกให้เป็น null
    description: form.value.description,
    sell_price: form.value.sell_price
  }

  const { error } = await updateProduct(route.params.id, payloadToUpdate)
  saving.value = false

  if (error) {
    alert('เกิดข้อผิดพลาดในการอัปเดต: ' + error.message)
  } else {
    alert('บันทึกการแก้ไขสำเร็จ!')
    navigateTo('/admin') // เด้งกลับไปหน้ารายการสินค้า (เปลี่ยนเป็น /admin/products ได้ถ้าคุณใช้ path นั้น)
  }
}
</script>

<style scoped>
.form-container { max-width: 800px; margin: 0 auto; padding: 2rem; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
.title { font-size: 1.5rem; font-weight: bold; color: #1e293b; }
.form-card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
.form-group { display: flex; flex-direction: column; gap: 0.5rem; }
.full-width { grid-column: 1 / -1; } /* ให้กว้างเต็มบรรทัด */

label { font-size: 0.9rem; font-weight: 600; color: #475569; }
.input-field { padding: 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 1rem; width: 100%; box-sizing: border-box; }
.input-field:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }

/* สไตล์สำหรับช่องที่ถูกล็อก */
.disabled-input { background-color: #f1f5f9; color: #94a3b8; cursor: not-allowed; border-color: #e2e8f0; }

.form-actions { margin-top: 2rem; display: flex; justify-content: flex-end; padding-top: 1rem; border-top: 1px solid #e2e8f0; }
.btn-primary { background: #0f172a; color: white; padding: 0.75rem 2rem; border-radius: 6px; font-weight: 600; cursor: pointer; border: none; }
.btn-primary:hover:not(:disabled) { background: #1e293b; }
.btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
.btn-cancel { color: #64748b; text-decoration: none; padding: 0.5rem 1rem; border: 1px solid #cbd5e1; border-radius: 6px; }
.btn-cancel:hover { background: #f8fafc; color: #0f172a; }
</style>