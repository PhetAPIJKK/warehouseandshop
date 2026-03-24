<template>
  <div class="orders-container">
    <h1 class="page-title">📋 ประวัติการสั่งซื้อ</h1>

    <div v-if="pending" class="status-msg">กำลังโหลดข้อมูล...</div>
    
    <div v-else-if="error" class="error-state">
      <p>เกิดข้อผิดพลาด: {{ error.message }}</p>
    </div>

    <div v-else-if="!orders || orders.length === 0" class="empty-state">
      <p>คุณยังไม่มีรายการสั่งซื้อในขณะนี้</p>
      <NuxtLink to="/" class="btn-shop">ไปเลือกซื้อสินค้า</NuxtLink>
    </div>

    <div v-else class="orders-list">
      <div v-for="order in orders" :key="order.id" class="order-card">
        <div class="order-header">
          <span class="order-no">{{ order.order_no }}</span>
          <span class="order-date">{{ formatDate(order.created_at) }}</span>
        </div>

        <div class="order-body">
          <div class="info-group">
            <span class="label">ยอดรวม:</span>
            <span class="price">฿{{ order.total_amount?.toLocaleString() }}</span>
          </div>
          <div class="info-group">
            <span class="label">สถานะ:</span>
            <span :class="['status-badge', order.status]">
              {{ translateStatus(order.status) }}
            </span>
          </div>
        </div>

        <div v-if="order.address" class="address-detail">
  📍 ส่งไปที่: {{ order.address.address_detail }} 
  (โทร: {{ order.address.phone }})
</div>

        <div class="order-footer">
          <NuxtLink 
            v-if="order.status === 'pending_payment'" 
            :to="`/payment/${order.id}`" 
            class="btn-pay"
          >
            แจ้งโอนเงิน
          </NuxtLink>
          <span v-else class="text-info">ทำรายการสำเร็จแล้ว</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'default' })

// ⭐️ 1. เรียกใช้ useOrder Composable ที่เราสร้างไว้
const { getUserOrders } = useOrder()

// ⭐️ 2. ดึงข้อมูลผ่าน getUserOrders (จะได้ data, pending, error มาใช้ได้เลย)
const { data: orders, pending, error } = await getUserOrders()

// --- ฟังก์ชันเสริมสำหรับแสดงผล ---
const translateStatus = (status) => {
  const map = {
    'pending_payment': 'รอชำระเงิน',
    'paid_wait_verify': 'รอตรวจสอบสลิป',
    'verified': 'ชำระเงินแล้ว',
    'completed': 'สำเร็จ',
    'cancelled': 'ถูกปฏิเสธ / ยกเลิก' // ⭐️ อัปเดตคำนี้ให้ชัดเจน
  }
  return map[status] || status
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('th-TH', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}
</script>

<style scoped>
/* CSS คงเดิมตามที่คุณออกแบบไว้ ซึ่งดูดีอยู่แล้วครับ */
.orders-container { max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
.page-title { font-size: 1.8rem; font-weight: 800; margin-bottom: 2rem; color: #0f172a; }

.order-card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
.order-header { display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.75rem; margin-bottom: 1rem; }
.order-no { font-weight: 700; color: #3b82f6; }
.order-date { font-size: 0.9rem; color: #94a3b8; }

.order-body { display: flex; gap: 2rem; margin-bottom: 1rem; }
.label { color: #64748b; margin-right: 0.5rem; }
.price { font-weight: 700; color: #1e293b; }

.status-badge { padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.85rem; font-weight: 600; }
.pending_payment { background: #fef3c7; color: #92400e; }
.paid_wait_verify { background: #e0f2fe; color: #075985; }
.verified { background: #dcfce7; color: #166534; }

.btn-pay { background: #0f172a; color: white; text-decoration: none; padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.9rem; font-weight: 600; }
.empty-state { text-align: center; padding: 4rem; background: #f8fafc; border-radius: 12px; }
.btn-shop { display: inline-block; margin-top: 1rem; color: #3b82f6; text-decoration: none; font-weight: 600; }
.error-state { color: #ef4444; text-align: center; padding: 2rem; }
order-body {
  display: flex;
  flex-direction: column; /* ปรับเป็นแนวตั้งเพื่อให้รองรับที่อยู่ยาวๆ */
  gap: 1rem;
  margin-bottom: 1.5rem;
}

@media (min-width: 640px) {
  .order-body {
    flex-direction: row; /* ถ้าจอใหญ่ให้แบ่งซ้ายขวา */
    justify-content: space-between;
    align-items: flex-start;
  }
}

.main-info {
  flex: 1;
}

.address-info {
  flex: 1;
  background: #f8fafc;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid #f1f5f9;
}

.address-box {
  font-size: 0.85rem;
  line-height: 1.4;
  color: #475569;
}

.address-text {
  margin: 0.2rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.address-phone {
  font-weight: 600;
  color: #1e293b;
  margin-top: 0.25rem;
}

.text-info-success {
  color: #10b981;
  font-size: 0.9rem;
  font-weight: 600;
}

.status-badge {
  display: inline-block;
  margin-top: 0.25rem;
}
</style>