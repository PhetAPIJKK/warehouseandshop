<template>
  <div class="orders-container">
    <header class="page-header">
      <h1 class="page-title">📋 ประวัติการสั่งซื้อ</h1>
      <p class="subtitle">ติดตามสถานะรายการสั่งซื้อทั้งหมดของคุณ</p>
    </header>

    <div v-if="pending" class="loading-state">
      <div class="spinner"></div>
      <p>กำลังดึงข้อมูลออเดอร์ของคุณ...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>⚠️ เกิดข้อผิดพลาด: {{ error.message }}</p>
      <button @click="refresh" class="btn-retry">ลองใหม่อีกครั้ง</button>
    </div>

    <div v-else-if="!orders || orders.length === 0" class="empty-state">
      <div class="empty-icon">📦</div>
      <p>คุณยังไม่มีรายการสั่งซื้อในขณะนี้</p>
      <NuxtLink to="/" class="btn-shop">ไปเลือกซื้อสินค้ากันเลย</NuxtLink>
    </div>

    <div v-else class="orders-list">
      <div v-for="order in orders" :key="order.id" class="order-card">
        <div class="order-header">
          <div>
            <span class="order-no">#{{ order.order_no }}</span>
            <span class="order-date">{{ formatDate(order.created_at) }}</span>
          </div>
          <span :class="['status-badge', order.status]">
            {{ translateStatus(order.status) }}
          </span>
        </div>

        <div class="order-body">
          <div class="info-group">
            <span class="label">ยอดชำระสุทธิ:</span>
            <span class="price">฿{{ order.total_amount?.toLocaleString() }}</span>
          </div>
        </div>

        <div :class="['order-card-detail', order.status === 'shipped' ? 'bg-shipped' : 'bg-pending']">

          <div v-if="order.status === 'shipped'" class="shipping-info">
            <div class="tracking-box">
              <p class="tracking-label">🚚 พัสดุของคุณกำลังเดินทาง:</p>
              <div class="tracking-content">
                <div>
                  <p class="tracking-no">{{ order.tracking_no }}</p>
                  <p class="carrier-text">
                    ขนส่งโดย: <strong>{{ detectCarrier(order.tracking_no) }}</strong>
                  </p>
                </div>
                <div class="action-btns">
                  <button @click="copyTracking(order.tracking_no)" class="btn-copy">คัดลอก</button>
                  <a :href="getTrackingLink(order.tracking_no)" target="_blank" class="btn-track">ติดตามพัสดุ 🌐</a>
                </div>
              </div>
            </div>
          </div>

          <div v-if="order.address" class="address-detail">
            <span class="address-label">📍 ที่อยู่จัดส่ง:</span>
            <p class="address-text">
              {{ order.address.address_detail }}
              <span class="phone-text">📞 โทร: {{ order.address.phone }}</span>
            </p>
          </div>

          <div
            v-else-if="order.status !== 'shipped' && order.status !== 'cancelled' && order.status !== 'pending_payment'"
            class="pending-notice">
            ⏳ ทางร้านกำลังเตรียมสินค้าเพื่อจัดส่งให้คุณโดยเร็วที่สุด
          </div>
        </div>

        <div class="order-footer">
          <NuxtLink v-if="order.status === 'pending_payment'" :to="`/payment/${order.id}`" class="btn-pay-now">
            💳 แจ้งโอนเงินที่นี่
          </NuxtLink>
          <div v-else-if="order.status === 'cancelled'" class="text-cancelled">รายการนี้ถูกยกเลิกแล้ว</div>
          <div v-else class="text-success-info">✔️ รายการคำสั่งซื้อสมบูรณ์</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// เนื่องจากเราใช้ Nuxt 3 ฟังก์ชันใน utils/shipping.ts จะถูก Auto-import มาให้แล้ว
// แต่ถ้า VS Code แจ้งเตือน ให้ตรวจสอบว่ามีไฟล์ utils/shipping.ts อยู่จริงครับ

definePageMeta({ layout: 'default' })

const { getUserOrders } = useOrder()
const { data: orders, pending, error, refresh } = await getUserOrders()

// --- ฟังก์ชันเสริม ---

const translateStatus = (status: string) => {
  const map: Record<string, string> = {
    'pending_payment': 'รอชำระเงิน',
    'paid_wait_verify': 'รอตรวจสอบสลิป',
    'pending_shipment': 'รอจัดส่ง',
    'shipped': 'จัดส่งแล้ว',
    'completed': 'สำเร็จ',
    'cancelled': 'ยกเลิก'
  }
  return map[status] || status
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('th-TH', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

// คัดลอกเลขพัสดุ
const copyTracking = (text: string | undefined) => {
  if (!text) return
  navigator.clipboard.writeText(text)
  alert('คัดลอกเลขพัสดุ: ' + text + ' แล้วครับ!')
}
</script>

<style scoped>
/* --- Layout & Base --- */
.orders-container {
  max-width: 800px;
  margin: 2rem auto;
  padding: 0 1rem;
}

.subtitle {
  color: #64748b;
  margin-top: -1.5rem;
  margin-bottom: 2rem;
}

/* --- Card Styles --- */
.order-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 1rem;
  margin-bottom: 1rem;
}

.order-no {
  font-weight: 800;
  color: #3b82f6;
  font-size: 1.1rem;
  margin-right: 1rem;
}

.order-date {
  font-size: 0.85rem;
  color: #94a3b8;
}

/* --- Status Badges --- */
.status-badge {
  padding: 0.35rem 1rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
}

.pending_payment {
  background: #fff7ed;
  color: #9a3412;
}

.paid_wait_verify {
  background: #e0f2fe;
  color: #075985;
}

.pending_shipment {
  background: #ffedd5;
  color: #9a3412;
}

.shipped {
  background: #dcfce7;
  color: #166534;
}

.cancelled {
  background: #fee2e2;
  color: #991b1b;
}

/* --- Detail Box (Dynamic Colors) --- */
.order-card-detail {
  padding: 1.25rem;
  border-radius: 12px;
  border: 1px solid transparent;
  margin-top: 1rem;
}

.bg-pending {
  background-color: #fffbeb;
  border-color: #fef08a;
}

.bg-shipped {
  background-color: #f0fdf4;
  border-color: #bbf7d0;
}

/* --- Tracking Box --- */
.tracking-box {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px dashed #bbf7d0;
}

.tracking-label {
  font-size: 0.85rem;
  font-weight: 700;
  color: #15803d;
  margin-bottom: 0.5rem;
}

.tracking-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.tracking-no {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 800;
  color: #15803d;
  font-size: 1.3rem;
  line-height: 1;
}

.carrier-text {
  font-size: 0.75rem;
  color: #166534;
  margin-top: 4px;
}

.action-btns {
  display: flex;
  gap: 8px;
}

/* --- Buttons --- */
.btn-track {
  background: #15803d;
  color: white;
  text-decoration: none;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  transition: all 0.2s;
}

.btn-track:hover {
  background: #166534;
  transform: translateY(-1px);
}

.btn-copy {
  background: white;
  border: 1px solid #bbf7d0;
  color: #15803d;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.85rem;
  cursor: pointer;
}

.btn-pay-now {
  display: block;
  text-align: center;
  background: #0f172a;
  color: white;
  text-decoration: none;
  padding: 1rem;
  border-radius: 12px;
  font-weight: 800;
  margin-top: 1.5rem;
  transition: background 0.2s;
}

.btn-pay-now:hover {
  background: #1e293b;
}

/* --- Address --- */
.address-label {
  font-weight: 700;
  color: #475569;
  font-size: 0.85rem;
  display: block;
  margin-bottom: 4px;
}

.address-text {
  font-size: 0.9rem;
  color: #1e293b;
  line-height: 1.5;
}

.phone-text {
  display: block;
  font-weight: 700;
  margin-top: 4px;
}

.text-success-info {
  color: #64748b;
  font-size: 0.85rem;
  text-align: center;
  margin-top: 1rem;
}

/* --- States --- */
.loading-state,
.empty-state {
  text-align: center;
  padding: 5rem 1rem;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.btn-shop {
  display: inline-block;
  margin-top: 1.5rem;
  color: #3b82f6;
  font-weight: 700;
  text-decoration: underline;
}

@media (max-width: 640px) {
  .tracking-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .action-btns {
    width: 100%;
  }

  .btn-track,
  .btn-copy {
    flex: 1;
    text-align: center;
  }
}
</style>