<template>
  <div class="products-container">
    <header class="page-header">
      <div>
        <h1 class="title">💰 ตรวจสอบการชำระเงิน</h1>
        <p class="subtitle">ตรวจสอบหลักฐานและอนุมัติเพื่อตัดสต็อกสินค้า</p>
      </div>
    </header>

    <div v-if="pending" class="loading-state">
      กำลังดึงข้อมูลสลิปโอนเงิน...
    </div>

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
                  @click="window.open(item.payments[0].slip_image_url, '_blank')"
                />
                <div v-else class="no-img-placeholder">ไม่มีสลิป</div>
              </td>
              <td class="font-bold">{{ item.order_no }}</td>
              <td>{{ item.members?.full_name || 'ทั่วไป' }}</td>
              <td class="text-right font-bold text-success">
                ฿{{ item.total_amount?.toLocaleString() }}
              </td>
              <td class="text-center">
                <NuxtLink :to="`/admin/verify-${item.id}`" class="btn-primary" style="padding: 6px 15px; font-size: 0.85rem;">
                  ตรวจสอบ & อนุมัติ
                </NuxtLink>
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

const { getPendingPayments } = useOrder()
const { data: payments, pending } = await getPendingPayments()
</script>

<style scoped>
@import '~/assets/css/admin-style.css';

.slip-preview-img {
  width: 50px; height: 50px; object-fit: cover; border-radius: 6px; 
  cursor: pointer; border: 1px solid #e2e8f0;
}
.no-img-placeholder {
  width: 50px; height: 50px; background: #f1f5f9; border-radius: 6px;
  display: flex; align-items: center; justify-content: center; font-size: 10px; color: #94a3b8;
}
.text-success { color: #10b981; }
</style>