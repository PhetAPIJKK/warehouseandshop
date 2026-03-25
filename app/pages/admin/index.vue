<template>
  <div class="admin-dashboard-root p-6 md:p-8 bg-slate-50 min-h-screen">
    <header class="mb-10 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">🚀 แผงควบคุม (Dashboard)</h1>
        <p class="text-slate-500 mt-1">สรุปภาพรวม Warehouse, Web Shop, และ POS</p>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-xs text-slate-400">อัปเดต: {{ new Date().toLocaleString('th-TH') }}</span>
        <button @click="refreshSummary" class="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition">
          🔄 รีเฟรช
        </button>
      </div>
    </header>

    <section v-if="summary" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
      <div class="stat-card bg-sky-50 border-sky-200">
        <span class="stat-label">💰 ยอดขายทั้งหมด (Web+POS)</span>
        <h2 class="stat-value text-sky-700">฿{{ summary.totalRevenue.toLocaleString('th-TH') }}</h2>
      </div>

      <div class="stat-card bg-emerald-50 border-emerald-200">
        <span class="stat-label">📦 ออเดอร์ทั้งหมด</span>
        <h2 class="stat-value text-emerald-700">{{ summary.totalOrders }} รายการ</h2>
      </div>

      <div class="stat-card bg-orange-50 border-orange-200">
        <span class="stat-label">🚚 สินค้ารอจัดส่ง</span>
        <h2 class="stat-value text-orange-700">{{ summary.pendingShipment }} รายการ</h2>
      </div>

      <div class="stat-card bg-blue-50 border-blue-200">
        <span class="stat-label">🟢 สต็อกสินค้าทั้งหมด</span>
        <h2 class="stat-value text-blue-700">{{ summary.totalInventoryCount || 0 }} ชิ้น</h2>
      </div>
    </section>

    <section class="grid grid-cols-1 xl:grid-cols-3 gap-8">
      
      <div class="xl:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 class="font-bold text-lg mb-6 flex items-center gap-2">
          📈 แนวโน้มยอดขายรายสัปดาห์ (ยอดรวม vs เว็บ vs POS)
        </h3>
        <div class="w-full h-80 flex items-center justify-center text-slate-400 bg-slate-50 rounded-xl">
          [ Image: Bar Chart - Weekly Sales Trend: Total, Web, POS]
          <p class="text-sm">📈 กราฟแสดงยอดขาย (Coming Soon - ติดตั้ง chart.js)</p>
        </div>
      </div>

      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 class="font-bold text-lg mb-6 flex items-center gap-2">
          🔴 สินค้าที่ต้องเติมด่วน (สต็อก <= 5)
        </h3>
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left border-bottom border-slate-100">
              <th class="pb-3">ชื่อสินค้า</th>
              <th class="pb-3 text-right">จำนวนคงเหลือ</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in lowStockProducts" :key="p.product_name" class="border-t border-slate-50">
              <td class="py-4">{{ p.product_name }}</td>
              <td class="py-4 text-right font-bold text-red-500">{{ p.stock_qty }} ชิ้น</td>
            </tr>
          </tbody>
        </table>
      </div>

    </section>

    <section class="mt-10 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <h3 class="font-bold text-lg mb-6">📋 ล่าสุด: 5 คำสั่งซื้อ</h3>
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left border-bottom border-slate-100">
            <th class="pb-3">เลขที่ออเดอร์</th>
            <th class="pb-3">ลูกค้า</th>
            <th class="pb-3 text-right">ยอดรวม</th>
            <th class="pb-3 text-center">สถานะ</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="py-4 text-blue-600 font-bold">#{{ new Date().getFullYear().toString().slice(2) }}...</td>
            <td class="py-4">ลูกค้าทั่วไป</td>
            <td class="py-4 text-right font-bold">฿0.00</td>
            <td class="py-4 text-center"><span class="bg-orange-50 text-orange-700 px-3 py-1 rounded-full font-bold text-xs">รอจัดส่ง</span></td>
          
          </tr>
          </tbody>
      </table>
    </section>

  </div>
</template>

<script setup lang="ts">
// เราจะสมมติว่าคุณสร้าง composables/useAdmin.ts ไว้ตามที่แนะนำก่อนหน้านี้
definePageMeta({ layout: 'admin', middleware: 'admin' });

const { getDashboardSummary, getLowStockList } = useAdmin();
const { data: summary, refresh: refreshSummary } = await getDashboardSummary();

const lowStockProducts = ref<any[]>([]);

// ดึงรายการสินค้าสต็อกต่ำ
const fetchLowStock = async () => {
  const { data } = await getLowStockList();
  lowStockProducts.value = data || [];
};

onMounted(fetchLowStock);
</script>

<style scoped>
/* Scoped Tailwind Classes for professional UI */
.stat-card {
  @apply p-6 rounded-2xl border flex flex-col gap-2 shadow-sm transition-transform hover:scale-105;
}
.stat-label {
  @apply text-sm font-semibold text-slate-600;
}
.stat-value {
  @apply text-3xl font-extrabold;
}
</style>