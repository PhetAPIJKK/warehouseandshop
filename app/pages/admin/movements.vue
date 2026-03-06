<template>
  <div class="page-container">
    <header class="page-header">
      <h1 class="title">📉 ขายออก / ความเคลื่อนไหวสินค้า</h1>
    </header>

    <div class="card selector-card">
      <div class="form-group">
        <label>ค้นหาและเลือกสินค้า</label>
        <select v-model="selectedProductId" @change="onProductSelect" class="input-field">
          <option value="" disabled>-- กรุณาเลือกสินค้าเพื่อดูข้อมูล --</option>
          <option v-for="p in products" :key="p.id" :value="p.id">
            [{{ p.sku || 'ไม่มี SKU' }}] {{ p.name }} - (คงเหลือ: {{ p.stock_qty || 0 }} ชิ้น)
          </option>
        </select>
      </div>
    </div>

    <div v-if="selectedProductId" class="content-grid">
      
      <div class="card action-card">
        <h3 class="card-title">🛒 บันทึกขาย (ตัดสต็อก)</h3>
        <form @submit.prevent="submitSale" class="sale-form">
          <div class="form-group">
            <label>จำนวนที่ต้องการขาย (ชิ้น)</label>
            <input 
              v-model.number="saleQty" 
              type="number" 
              min="1" 
              :max="currentStock"
              class="input-field" 
              required 
            />
            <small class="text-muted">ตัดสต็อกได้สูงสุด: {{ currentStock }} ชิ้น</small>
          </div>
          <button type="submit" :disabled="saving || saleQty <= 0 || saleQty > currentStock" class="btn-danger">
            {{ saving ? 'กำลังบันทึก...' : 'ยืนยันการขายออก' }}
          </button>
        </form>
      </div>

      <div class="card history-card">
        <h3 class="card-title">📊 ประวัติความเคลื่อนไหว (Statement)</h3>
        
        <div v-if="loadingHistory" class="loading-state">กำลังโหลดประวัติ...</div>
        
        <div v-else class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>วัน-เวลา</th>
                <th>ประเภทรายการ</th>
                <th class="text-right">เข้า</th>
                <th class="text-right">ออก</th>
                <th class="text-right">คงเหลือ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="movements.length === 0">
                <td colspan="5" class="text-center text-muted">ยังไม่มีประวัติความเคลื่อนไหวสำหรับสินค้านี้</td>
              </tr>
              <tr v-for="log in movements" :key="log.id">
                <td>{{ formatDate(log.created_at) }}</td>
                <td>
                  <span class="badge" :class="getBadgeClass(log.movement_type)">
                    {{ translateType(log.movement_type) }}
                  </span>
                </td>
                <td class="text-right text-success">{{ log.qty_in > 0 ? '+' + log.qty_in : '-' }}</td>
                <td class="text-right text-danger">{{ log.qty_out > 0 ? '-' + log.qty_out : '-' }}</td>
                <td class="text-right font-bold">{{ log.balance_after }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin', middleware: 'admin' })

const { recordSale, getProductMovements } = useInventory()
const client = useSupabaseClient() // ⭐️ เรียกใช้ตรงๆ เช่นกัน

const products = ref([])
const selectedProductId = ref('')
const movements = ref([])
const saleQty = ref(1)

const loadingHistory = ref(false)
const saving = ref(false)

const currentStock = computed(() => {
  const p = products.value.find(item => item.id === selectedProductId.value)
  return p ? p.stock_qty : 0
})

onMounted(async () => {
  await loadProducts()
})

// ⭐️ เปลี่ยนมาดึงข้อมูลตรงๆ
const loadProducts = async () => {
  const { data } = await client
    .from('products')
    .select('id, sku, name, stock_qty')
    .order('created_at', { ascending: false })
    
  if (data) products.value = data
}

const onProductSelect = async () => {
  if (!selectedProductId.value) return
  saleQty.value = 1
  await loadHistory()
}

const loadHistory = async () => {
  loadingHistory.value = true
  const { data, error } = await getProductMovements(selectedProductId.value)
  if (!error && data) {
    movements.value = data
  }
  loadingHistory.value = false
}

const submitSale = async () => {
  if (saleQty.value <= 0 || saleQty.value > currentStock.value) {
    alert('จำนวนสต็อกไม่ถูกต้องหรือไม่เพียงพอครับ')
    return
  }

  saving.value = true
  const { error } = await recordSale(selectedProductId.value, saleQty.value)
  saving.value = false

  if (error) {
    alert('เกิดข้อผิดพลาด: ' + error.message)
  } else {
    alert('บันทึกการขายและตัดสต็อกสำเร็จ!')
    saleQty.value = 1
    await loadProducts()
    await loadHistory()
  }
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const d = new Date(dateString)
  return d.toLocaleString('th-TH', { 
    year: 'numeric', month: 'short', day: 'numeric', 
    hour: '2-digit', minute: '2-digit' 
  })
}

const translateType = (type) => {
  const types = {
    'receive': '📥 รับเข้า (ยอดยกมา/คืน)',
    'produce_in': '🏭 ผลิตเข้าสต็อก',
    'sale_out': '🛒 ขายออก',
    'issue': '📤 เบิกออก',
    'adjust': '⚙️ ปรับปรุงสต็อก'
  }
  return types[type] || type
}

const getBadgeClass = (type) => {
  if (['receive', 'produce_in'].includes(type)) return 'badge-success'
  if (type === 'sale_out') return 'badge-danger'
  if (type === 'issue') return 'badge-warning'
  return 'badge-gray'
}
</script>

<style scoped>
.page-container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
.page-header { margin-bottom: 2rem; }
.title { font-size: 1.5rem; font-weight: bold; color: #1e293b; }

.card { background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; margin-bottom: 1.5rem; }
.card-title { margin-top: 0; margin-bottom: 1.5rem; font-size: 1.25rem; color: #334155; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem; }

.content-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 1.5rem; align-items: start; }
@media (max-width: 768px) { .content-grid { grid-template-columns: 1fr; } }

.form-group { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem; }
label { font-size: 0.95rem; font-weight: 600; color: #475569; }
.input-field { padding: 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 1rem; width: 100%; box-sizing: border-box; }
.text-muted { color: #64748b; font-size: 0.85rem; }

.btn-danger { background: #ef4444; color: white; padding: 0.75rem 1rem; border-radius: 6px; font-weight: 600; cursor: pointer; border: none; width: 100%; }
.btn-danger:hover:not(:disabled) { background: #dc2626; }
.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }

/* Table Styles */
.table-responsive { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; min-width: 600px; }
.data-table th, .data-table td { padding: 0.75rem 1rem; border-bottom: 1px solid #e2e8f0; text-align: left; }
.data-table th { background-color: #f8fafc; font-weight: 600; color: #475569; }
.text-right { text-align: right !important; }
.text-center { text-align: center !important; }
.font-bold { font-weight: 700; color: #0f172a; }
.text-success { color: #10b981; }
.text-danger { color: #ef4444; }

/* Badges */
.badge { padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.85rem; font-weight: 500; display: inline-block; }
.badge-success { background: #d1fae5; color: #065f46; }
.badge-danger { background: #fee2e2; color: #991b1b; }
.badge-warning { background: #fef3c7; color: #92400e; }
.badge-gray { background: #f1f5f9; color: #475569; }
</style>