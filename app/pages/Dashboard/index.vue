<template>
  <div>
    <h2 class="page-title">สรุปภาพรวมคลังสินค้า</h2>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="label">ยอดขายเดือนนี้</div>
        <div class="value">฿45,678.90</div>
        <div class="trend up">+20.5%</div>
      </div>
      <div class="stat-card">
        <div class="label">สินค้าทั้งหมด</div>
        <div class="value">2,405</div>
        <div class="trend">รายการ</div>
      </div>
      <div class="stat-card">
        <div class="label">ออเดอร์ใหม่</div>
        <div class="value">10,353</div>
        <div class="trend down">-5%</div>
      </div>
    </div>

    <div class="chart-placeholder">
       [ พื้นที่สำหรับกราฟวิเคราะห์ข้อมูลการขาย ]
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'admin' // ใช้โครงสร้างหน้า Admin ที่เราเพิ่งสร้าง
})
</script>

<style scoped>
.page-title { margin-bottom: 2rem; font-size: 1.5rem; color: #334155; }
.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 2rem; }
.stat-card { background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
.label { color: #64748b; font-size: 0.9rem; margin-bottom: 0.5rem; }
.value { font-size: 1.8rem; font-weight: 700; color: #1e293b; }
.trend { font-size: 0.8rem; margin-top: 0.5rem; }
.trend.up { color: #10b981; }
.trend.down { color: #ef4444; }
.chart-placeholder { background: white; height: 300px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #94a3b8; border: 2px dashed #e2e8f0; }
</style>