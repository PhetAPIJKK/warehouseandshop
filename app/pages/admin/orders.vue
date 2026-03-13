<template>
  <div class="products-container">
    <header class="page-header">
      <div>
        <h1 class="title">📋 รายการคำสั่งซื้อ</h1>
        <p class="subtitle">แสดงรายการสั่งซื้อทั้งหมดจากเว็บไซต์และหน้าร้าน</p>
      </div>
    </header>

    <div v-if="pending" class="loading-state">กำลังโหลดข้อมูลคำสั่งซื้อ...</div>
    <div v-else-if="error" class="error-state">เกิดข้อผิดพลาด: {{ error.message }}</div>
    <div v-else-if="!orders || orders.length === 0" class="empty-state">ยังไม่มีรายการสั่งซื้อ</div>

    <div v-else class="table-card">
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>เลขที่ออเดอร์</th>
              <th>ลูกค้า</th>
              <th class="text-center">ช่องทาง</th>
              <th class="text-right">ยอดรวม</th>
              <th class="text-center">สถานะ</th>
              <th class="text-center">วันที่</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in orders" :key="item.id">
              <td class="font-bold text-indigo">{{ item.order_no }}</td>
              <td>{{ item.members?.full_name || 'ลูกค้าทั่วไป' }}</td>
              <td class="text-center">
                <span :class="item.order_source === 'web' ? 'badge-web' : 'badge-pos'">
                  {{ item.order_source === 'web' ? '🌐 Web' : '🏪 POS' }}
                </span>
              </td>
              <td class="text-right font-bold">฿{{ item.total_amount?.toLocaleString() }}</td>
              <td class="text-center">
                <span :class="['status-badge', item.status]">
                  {{ translateStatus(item.status) }}
                </span>
              </td>
              <td class="text-center text-sm">{{ formatDate(item.created_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin', middleware: 'admin' })
const { getOrdersData } = useOrder()
const { data: orders, pending, error } = await getOrdersData()

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
const formatDate = (d) => new Date(d).toLocaleDateString('th-TH')
</script>

<style scoped> @import '~/assets/css/admin-style.css'; </style>