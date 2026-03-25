<template>
  <div class="admin-container">
    <header class="page-header">
      <h1 class="text-2xl font-bold mb-4">🚚 รายการรอจัดส่ง & ตัดสต็อก</h1>
      <p class="text-gray-600 mb-6">จัดการแพ็คสินค้าและกรอกเลขพัสดุเพื่อตัดสต็อกสินค้าออกจากคลัง</p>
    </header>

    <div v-if="pending" class="text-center p-10">กำลังโหลดข้อมูล...</div>
    
    <div v-else-if="!orders || orders.length === 0" class="text-center p-10 bg-gray-50 rounded-lg border-2 border-dashed">
      คุณไม่มีรายการค้างส่งในขณะนี้
    </div>

    <div v-else class="shipping-grid">
      <div v-for="order in orders" :key="order.id" class="shipping-card">
        <div class="card-info">
          <div class="flex items-center gap-2 mb-2">
            <span class="order-tag">#{{ order.order_no }}</span>
            <span class="text-xs text-gray-400">{{ formatDate(order.updated_at) }}</span>
          </div>
          <p class="font-bold text-lg">{{ order.members?.full_name || 'ลูกค้าทั่วไป' }}</p>
          <p class="text-sm text-gray-600 mt-1">📍 {{ order.address?.address_detail }}</p>
          <p class="text-sm font-semibold text-blue-600">📞 {{ order.address?.phone }}</p>
        </div>

        <div class="card-action">
          <div class="input-group">
            <input 
              v-model="trackingData[order.id]" 
              placeholder="ใส่เลขพัสดุ (Tracking)" 
              class="input-field" 
            />
            <button 
              @click="confirmShip(order)" 
              :disabled="isProcessing" 
              class="btn-confirm"
            >
              {{ isProcessing ? 'กำลังประมวลผล...' : 'ยืนยันการส่ง' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// ใช้ Layout และ Middleware สำหรับ Admin
definePageMeta({ layout: 'admin', middleware: 'admin' })

const client = useSupabaseClient()
const { getPendingShipments } = useOrder() // ⭐️ แก้ชื่อให้ตรงกับ Composable
const { data: orders, pending, refresh } = await getPendingShipments()

const trackingData = ref({})
const isProcessing = ref(false)

const confirmShip = async (order) => {
  const trackNo = trackingData.value[order.id]
  if (!trackNo) return alert('กรุณากรอกเลขพัสดุครับ')

  isProcessing.value = true
  try {
    // 1. ดึงรายการสินค้าในออเดอร์มาเพื่อเตรียมตัดสต็อก
    const { data: items, error: fetchError } = await client
      .from('order_items')
      .select('*')
      .eq('order_id', order.id)

    if (fetchError) throw fetchError

    // 2. วนลูปตัดสต็อกสินค้าทีละรายการ
    for (const item of items) {
      const { data: p } = await client
        .from('products')
        .select('stock_qty')
        .eq('id', item.product_id)
        .single()
      
      // อัปเดตสต็อก (ตัดออก)
      await client
        .from('products')
        .update({ stock_qty: p.stock_qty - item.qty })
        .eq('id', item.product_id)

      // บันทึก Stock Movement (ประวัติ)
      await client.from('stock_movements').insert({
        product_id: item.product_id,
        qty_out: item.qty,
        movement_type: 'sale_out',
        ref_table: 'orders',
        ref_id: order.id,
        item_type: 'product'
      })
    }

    // 3. อัปเดตสถานะออเดอร์เป็นจัดส่งแล้ว
    await client.from('orders').update({
      status: 'shipped',
      tracking_no: trackNo,
      carrier_name: 'Flash Express',
      updated_at: new Date().toISOString()
    }).eq('id', order.id)

    alert('✅ จัดส่งและตัดสต็อกสำเร็จ!')
    refresh() // โหลดข้อมูลใหม่ (ออเดอร์ที่ส่งแล้วจะหายไปจากหน้านี้)
  } catch (e) {
    alert('❌ เกิดข้อผิดพลาด: ' + e.message)
  } finally {
    isProcessing.value = false
  }
}

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('th-TH', { 
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
  })
}
</script>

<style scoped>
.admin-container { max-width: 1000px; margin: 2rem auto; padding: 0 1rem; }
.shipping-grid { display: grid; gap: 1.5rem; margin-top: 1.5rem; }
.shipping-card { 
  background: white; 
  padding: 1.5rem; 
  border-radius: 12px; 
  border: 1px solid #e2e8f0; 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}
.order-tag { background: #eef2ff; color: #6366f1; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 0.85rem; }
.input-group { display: flex; gap: 0.5rem; }
.input-field { border: 1px solid #cbd5e1; padding: 0.75rem; border-radius: 8px; width: 250px; font-size: 0.9rem; }
.btn-confirm { background: #10b981; color: white; border: none; padding: 0.75rem 1.25rem; border-radius: 8px; cursor: pointer; font-weight: bold; transition: background 0.2s; }
.btn-confirm:hover { background: #059669; }
.btn-confirm:disabled { opacity: 0.5; cursor: not-allowed; }

@media (max-width: 768px) { 
  .shipping-card { flex-direction: column; align-items: flex-start; gap: 1.5rem; } 
  .input-group { width: 100%; flex-direction: column; }
  .input-field { width: 100%; }
}
</style>