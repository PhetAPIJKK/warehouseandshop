<template>
    <div class="form-container">
        <header class="page-header">
            <h1 class="title">📦 ปรับปรุงสต็อกสินค้า</h1>
            <NuxtLink to="/admin" class="btn-cancel">กลับหน้ารายการ</NuxtLink>
        </header>

        <div v-if="loading" class="loading-state">กำลังโหลดข้อมูล...</div>

        <div v-else class="form-card">
            <div class="product-info">
                <h3>{{ product.name }}</h3>
                <p>SKU: {{ product.sku || '-' }}</p>
                <div class="current-stock">
                    ยอดคงเหลือปัจจุบัน: <strong>{{ product.stock_qty }}</strong> ชิ้น
                </div>
            </div>

            <div class="form-grid">
                <div class="form-group">
                    <label>ประเภทการทำรายการ</label>
                    <select v-model="form.type" class="input-field">
                        <option value="receive">📥 รับเข้า (รับของคืน / ยอดยกมา)</option>
                        <option value="issue">📤 เบิกออก (นำไปใช้งาน / ตัวอย่าง)</option>
                        <option value="adjust">🗑️ ปรับปรุงสต็อก (ของเสีย / ชำรุด / สต็อกขาด)</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>จำนวนชิ้น</label>
                    <input v-model.number="form.qty" type="number" min="1" class="input-field"
                        placeholder="ระบุจำนวน..." />
                </div>
            </div>

            <div class="preview-box" :class="previewClass">
                ยอดคงเหลือหลังปรับปรุง: <span>{{ previewBalance }}</span> ชิ้น
            </div>

            <div class="form-actions">
                <button @click="saveStock" :disabled="saving || form.qty <= 0" class="btn-primary">
                    {{ saving ? 'กำลังบันทึก...' : 'ยืนยันการปรับสต็อก' }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const { getProductById, adjustProductStock } = useInventory()

const product = ref({})
const loading = ref(true)
const saving = ref(false)

const form = ref({
    type: 'adj_in',
    qty: 0
})

// โหลดข้อมูลสินค้าตอนเปิดหน้าเว็บ
onMounted(async () => {
    const { data } = await getProductById(route.params.id)
    if (data) product.value = data
    loading.value = false
})

// คำนวณยอดพรีวิวให้เห็นก่อนกดบันทึก
const previewBalance = computed(() => {
  const current = product.value.stock_qty || 0
  // ให้ issue กับ adjust เป็นการหักสต็อก
  const isOut = ['issue', 'adjust'].includes(form.value.type) 
  const change = isOut ? -(form.value.qty || 0) : (form.value.qty || 0)
  return current + change
})

const previewClass = computed(() => {
    if (previewBalance.value < 0) return 'text-error'
    if (form.value.type === 'adj_in') return 'text-success'
    return 'text-warning'
})

// ฟังก์ชันกดยืนยัน
const saveStock = async () => {
    if (previewBalance.value < 0) {
        return alert('ยอดสต็อกติดลบไม่ได้ครับ')
    }

    saving.value = true
    const { error } = await adjustProductStock(route.params.id, form.value.qty, form.value.type)
    saving.value = false

    if (error) {
        alert('เกิดข้อผิดพลาด: ' + error.message)
    } else {
        alert('ปรับปรุงสต็อกเรียบร้อยแล้ว!')
        navigateTo('/admin') // เด้งกลับหน้ารายการ
    }
}
</script>

<style scoped>
.form-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}

.title {
    font-size: 1.5rem;
    font-weight: bold;
    color: #1e293b;
}

.form-card {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    border: 1px solid #e2e8f0;
}

.product-info {
    background: #f8fafc;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    border: 1px solid #e2e8f0;
}

.product-info h3 {
    margin: 0 0 0.5rem 0;
    color: #0f172a;
}

.current-stock {
    margin-top: 1rem;
    font-size: 1.1rem;
    color: #334155;
}

.current-stock strong {
    color: #3b82f6;
    font-size: 1.3rem;
}

.form-grid {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

label {
    font-size: 0.95rem;
    font-weight: 600;
    color: #475569;
}

.input-field {
    padding: 0.75rem;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    font-size: 1rem;
    width: 100%;
    box-sizing: border-box;
}

.preview-box {
    padding: 1rem;
    border-radius: 8px;
    font-weight: bold;
    text-align: center;
    font-size: 1.1rem;
    background: #f1f5f9;
    margin-bottom: 1.5rem;
}

.text-success span {
    color: #10b981;
}

.text-warning span {
    color: #f59e0b;
}

.text-error {
    background: #fee2e2;
    color: #ef4444;
}

.form-actions {
    display: flex;
    justify-content: flex-end;
}

.btn-primary {
    background: #0f172a;
    color: white;
    padding: 0.75rem 2rem;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    width: 100%;
}

.btn-primary:hover:not(:disabled) {
    background: #1e293b;
}

.btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn-cancel {
    color: #64748b;
    text-decoration: none;
    padding: 0.5rem 1rem;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
}
</style>