<template>
  <div class="products-container">
    <header class="page-header">
      <div>
        <h1 class="title">💰 ตรวจสอบการชำระเงิน</h1>
        <p class="subtitle">ตรวจสอบหลักฐานและอนุมัติเพื่อเตรียมจัดส่งสินค้า</p>
      </div>
    </header>

    <div v-if="pending" class="loading-state">กำลังดึงข้อมูลสลิปโอนเงิน...</div>

    <div v-else-if="!payments || payments.length === 0" class="empty-state">
      🎉 ยอดเยี่ยม! ไม่มีสลิปค้างตรวจสอบในขณะนี้
    </div>

    <div v-else class="table-card">
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 80px;">หลักฐาน</th>
              <th>เลขที่ออเดอร์</th>
              <th>ลูกค้า</th>
              <th class="text-right">ยอดเงิน</th>
              <th class="text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in payments" :key="item.id">
              <td>
                <img 
                  v-if="item.payments?.[0]?.slip_image_url" 
                  :src="item.payments[0].slip_image_url" 
                  class="slip-preview-img"
                  @click="viewSlip(item.payments[0].slip_image_url)"
                />
                <div v-else class="no-img-placeholder">ไม่มีสลิป</div>
              </td>
              <td class="font-bold text-indigo">{{ item.order_no }}</td>
              <td>{{ item.members?.full_name || 'ทั่วไป' }}</td>
              <td class="text-right font-bold text-success">
                ฿{{ item.total_amount?.toLocaleString() }}
              </td>
              <td class="text-center">
                <button 
                  @click="approveOrder(item.id)" 
                  class="btn-approve-inline"
                  :disabled="processingId === item.id"
                >
                  {{ processingId === item.id ? 'กำลังบันทึก...' : '✔️ อนุมัติเงิน' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin', middleware: 'admin' })

const client = useSupabaseClient()
const { getPendingPayments } = useOrder()
const { data: payments, pending, refresh } = await getPendingPayments()

const processingId = ref(null)

// ฟังก์ชันอนุมัติ และส่งไป Flow จัดส่ง
const approveOrder = async (orderId) => {
  if (!confirm('ยืนยันว่าได้รับยอดเงินถูกต้องแล้วใช่หรือไม่?')) return
  
  processingId.value = orderId
  try {
    const { error } = await client
      .from('orders')
      .update({ 
        status: 'pending_shipment', // ⭐️ เปลี่ยนเป็นสถานะนี้เพื่อให้ไปโผล่หน้า Shipping
        updated_at: new Date().toISOString() 
      })
      .eq('id', orderId)

    if (error) throw error
    
    alert('อนุมัติสำเร็จ! รายการถูกส่งไปที่หน้า "รอจัดส่ง" แล้ว')
    refresh() // โหลดข้อมูลใหม่ (ออเดอร์ที่อนุมัติแล้วจะหายไปจากหน้านี้)
  } catch (err) {
    alert('เกิดข้อผิดพลาด: ' + err.message)
  } finally {
    processingId.value = null
  }
}

const viewSlip = (url) => {
  window.open(url, '_blank')
}
</script>

<style scoped>
@import '~/assets/css/admin-style.css';

.slip-preview-img {
  width: 50px; height: 50px; object-fit: cover; border-radius: 6px; 
  cursor: pointer; border: 1px solid #e2e8f0; transition: transform 0.2s;
}
.slip-preview-img:hover { transform: scale(1.1); }

.btn-approve-inline {
  background: #10b981; color: white; padding: 6px 12px; 
  border-radius: 6px; font-weight: 600; font-size: 0.85rem;
  border: none; cursor: pointer; transition: background 0.2s;
}
.btn-approve-inline:hover { background: #059669; }
.btn-approve-inline:disabled { opacity: 0.5; cursor: not-allowed; }

.text-success { color: #10b981; }
.text-indigo { color: #4f46e5; }
</style>