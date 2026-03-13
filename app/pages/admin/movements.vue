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
@import '~/assets/css/admin-style.css';
</style>