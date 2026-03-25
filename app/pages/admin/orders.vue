<template>
  <div class="products-container">
    <header class="page-header">
      <div>
        <h1 class="title">📋 ระบบจัดการคำสั่งซื้อ & คลังสินค้า</h1>
        <p class="subtitle">ตรวจสอบการชำระเงิน ดำเนินการจัดส่ง และตัดสต็อกสินค้าอัตโนมัติ</p>
      </div>
    </header>

    <div v-if="pending" class="loading-state">
      <div class="spinner"></div>
      <p>กำลังโหลดข้อมูลคำสั่งซื้อ...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>เกิดข้อผิดพลาด: {{ error.message }}</p>
      <button @click="refresh" class="btn-refresh">ลองอีกครั้ง</button>
    </div>
    
    <div v-else class="table-card">
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>เลขที่ออเดอร์</th>
              <th>ลูกค้า / ที่อยู่</th>
              <th class="text-right">ยอดรวม</th>
              <th class="text-center">สถานะ</th>
              <th class="text-center">การดำเนินการ</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in orders" :key="item.id" :class="{ 'bg-gray-50': item.status === 'shipped' }">
              <td class="font-bold text-indigo">
                {{ item.order_no }}
                <div class="text-xs text-gray-400 font-normal">{{ formatDate(item.created_at) }}</div>
              </td>
              <td>
                <div class="font-semibold">{{ item.members?.full_name || 'ลูกค้าทั่วไป' }}</div>
                <div v-if="item.address" class="text-xs text-gray-500 truncate" style="max-width: 200px;">
                  📍 {{ item.address.address_detail }}
                </div>
              </td>
              <td class="text-right font-bold text-lg">฿{{ item.total_amount?.toLocaleString() }}</td>
              <td class="text-center">
                <span :class="['status-badge', item.status]">
                  {{ translateStatus(item.status) }}
                </span>
              </td>
              <td class="text-center">
                <button 
                  v-if="item.status === 'paid_wait_verify'" 
                  @click="openVerifyModal(item)"
                  class="btn-action btn-verify"
                >
                  🔍 ตรวจสลิป
                </button>

                <button 
                  v-if="item.status === 'pending_shipment'" 
                  @click="openShipModal(item)"
                  class="btn-action btn-ship"
                >
                  📦 ส่งสินค้า & ตัดสต็อก
                </button>

                <div v-if="item.status === 'shipped'" class="shipped-info">
                  <span class="text-xs text-green-600 block">✅ จัดส่งแล้ว</span>
                  <span class="text-sm font-mono font-bold">{{ item.tracking_no }}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Transition name="fade">
      <div v-if="selectedOrder" class="modal-overlay" @click.self="selectedOrder = null">
        <div class="modal-content">
          <div class="modal-header">
            <h3>ออเดอร์: {{ selectedOrder.order_no }}</h3>
            <button @click="selectedOrder = null" class="close-x">&times;</button>
          </div>
          <hr />
          
          <div v-if="selectedOrder.status === 'paid_wait_verify'" class="modal-body">
            <p class="modal-label">หลักฐานการชำระเงิน:</p>
            <div class="slip-container" v-if="selectedOrder.payments?.[0]">
              <img :src="selectedOrder.payments[0].slip_image_url" class="slip-view shadow-lg" alt="Payment Slip" />
              <div class="slip-info">
                <span>ยอดที่แจ้ง: ฿{{ selectedOrder.payments[0].payment_amount }}</span>
                <span>เวลาโอน: {{ formatDate(selectedOrder.payments[0].slip_transfer_datetime) }}</span>
              </div>
            </div>
            <div v-else class="text-center p-4 text-red-500">ไม่พบข้อมูลการชำระเงิน</div>

            <div class="modal-btns mt-4">
              <button @click="updateStatus(selectedOrder.id, 'pending_shipment')" class="btn-approve">อนุมัติ (เตรียมส่ง)</button>
              <button @click="updateStatus(selectedOrder.id, 'cancelled')" class="btn-cancel">ปฏิเสธรายการ</button>
            </div>
          </div>

          <div v-if="selectedOrder.status === 'pending_shipment'" class="modal-body">
            <div class="input-group">
              <label>บริษัทขนส่ง</label>
              <select v-model="shipData.carrier" class="modal-input">
                <option value="Kerry Express">Kerry Express</option>
                <option value="Flash Express">Flash Express</option>
                <option value="J&T Express">J&T Express</option>
                <option value="ไปรษณีย์ไทย (EMS)">ไปรษณีย์ไทย (EMS)</option>
              </select>
            </div>

            <div class="input-group">
              <label>เลขพัสดุ (Tracking Number)</label>
              <input v-model="shipData.tracking" placeholder="ใส่เลข Tracking..." class="modal-input" />
            </div>
            
            <div class="stock-warning">
              ⚠️ การกดยืนยันจะทำการ **ตัดจำนวนสินค้าออกจากสต็อก** ทันที
            </div>

            <div class="modal-btns">
              <button @click="confirmShipping" :disabled="isProcessing" class="btn-confirm">
                <span v-if="isProcessing">⏳ กำลังประมวลผล...</span>
                <span v-else>🚀 ยืนยันการจัดส่ง & ตัดสต็อก</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
// นำเข้า Types จาก Composable ที่เราทำไว้
import type { Order } from '~/composables/useOrder'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const client = useSupabaseClient()
const { getOrdersData } = useOrder()
const { data: orders, pending, error, refresh } = await getOrdersData()

const selectedOrder = ref<Order | null>(null)
const isProcessing = ref(false)
const shipData = ref({ tracking: '', carrier: 'Kerry Express' })

// --- Logic การจัดการสถานะ ---

const openVerifyModal = (order: Order) => { 
  selectedOrder.value = order 
}

const openShipModal = (order: Order) => { 
  selectedOrder.value = order 
  shipData.value.tracking = '' // ล้างค่าเลขพัสดุเดิม
}

// 1. ฟังก์ชันอนุมัติสลิป หรือ ยกเลิก
const updateStatus = async (id: string, status: string) => {
  const { error: updateErr } = await client
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (updateErr) {
    alert('เกิดข้อผิดพลาด: ' + updateErr.message)
  } else {
    selectedOrder.value = null
    refresh()
  }
}

// ⭐️ 2. ฟังก์ชันยืนยันการส่ง และ ตัดสต็อก (Core Engine)
const confirmShipping = async () => {
  if (!shipData.value.tracking) return alert('กรุณากรอกเลขพัสดุให้ครบถ้วน')
  if (!selectedOrder.value) return

  isProcessing.value = true
  const orderId = selectedOrder.value.id

  try {
    // 2.1 ดึงรายการสินค้าในออเดอร์นี้เพื่อดูว่าต้องตัดอะไรบ้าง
    const { data: items, error: fetchError } = await client
      .from('order_items')
      .select('product_id, qty')
      .eq('order_id', orderId)

    if (fetchError) throw fetchError
    if (!items || items.length === 0) throw new Error('ไม่พบรายการสินค้าในออเดอร์นี้')

    // 2.2 วนลูปตัดสต็อก (ในโปรเจกต์ใหญ่ควรใช้ RPC แต่สำหรับเริ่มต้นแบบนี้ปลอดภัยระดับหนึ่งครับ)
    for (const item of items) {
      // ดึงยอดปัจจุบันเพื่อความแม่นยำ
      const { data: prod } = await client
        .from('products')
        .select('stock_qty')
        .eq('id', item.product_id)
        .single()
      
      if (prod) {
        await client
          .from('products')
          .update({ stock_qty: prod.stock_qty - item.qty })
          .eq('id', item.product_id)
      }
    }

    // 2.3 อัปเดตสถานะออเดอร์เป็น 'shipped' พร้อมบันทึกเลขพัสดุ
    const { error: finalError } = await client
      .from('orders')
      .update({
        status: 'shipped',
        tracking_no: shipData.value.tracking,
        carrier_name: shipData.value.carrier,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)

    if (finalError) throw finalError

    alert('🎉 จัดส่งสำเร็จและตัดสต็อกเรียบร้อย!')
    selectedOrder.value = null
    refresh()
  } catch (err: any) {
    alert('เกิดข้อผิดพลาด: ' + err.message)
    console.error(err)
  } finally {
    isProcessing.value = false
  }
}

// --- Helpers ---
const translateStatus = (status: string) => {
  const map: Record<string, string> = {
    'pending_payment': '⏳ รอชำระเงิน',
    'paid_wait_verify': '🔍 รอตรวจสลิป',
    'pending_shipment': '📦 รอจัดส่ง',
    'shipped': '🚛 จัดส่งแล้ว',
    'completed': '✅ สำเร็จ',
    'cancelled': '❌ ยกเลิก'
  }
  return map[status] || status
}

const formatDate = (d: string) => {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('th-TH', { 
    day: 'numeric', 
    month: 'short', 
    year: '2-digit',
    hour: '2-digit', 
    minute: '2-digit' 
  })
}
</script>

<style scoped>
@import '~/assets/css/admin-style.css';

/* Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  width: 480px;
  max-width: 95%;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.close-x {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #94a3b8;
}

.modal-label {
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.slip-view {
  width: 100%;
  max-height: 350px;
  object-fit: contain;
  border-radius: 8px;
  background: #f1f5f9;
}

.slip-info {
  margin-top: 0.5rem;
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #64748b;
}

.input-group {
  margin-bottom: 1.25rem;
}

.modal-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  margin-top: 0.25rem;
}

.stock-warning {
  background: #fff7ed;
  border: 1px solid #ffedd5;
  color: #9a3412;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.85rem;
  margin-bottom: 1.5rem;
}

/* Button Styles */
.btn-action {
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-verify { background: #6366f1; color: white; }
.btn-verify:hover { background: #4f46e5; }

.btn-ship { background: #f59e0b; color: white; }
.btn-ship:hover { background: #d97706; }

.btn-approve { flex: 1; background: #10b981; color: white; padding: 12px; border-radius: 8px; border: none; font-weight: bold; }
.btn-cancel { flex: 1; background: #ef4444; color: white; padding: 12px; border-radius: 8px; border: none; font-weight: bold; }

.btn-confirm {
  width: 100%;
  background: #2563eb;
  color: white;
  padding: 14px;
  border-radius: 10px;
  font-weight: 800;
  border: none;
  cursor: pointer;
}

.btn-confirm:disabled { opacity: 0.6; cursor: not-allowed; }

.status-badge {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
}

/* Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>