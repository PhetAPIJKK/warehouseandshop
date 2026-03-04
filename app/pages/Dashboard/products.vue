<template>
  <div class="dashboard-container">
    <header class="admin-header">
      <h2>📦 จัดการสต็อกสินค้า</h2>
      <button @click="showAddModal = true" class="btn-add">+ เพิ่มสินค้าใหม่</button>
    </header>

    <div class="inventory-table-wrapper">
      <table class="inventory-table">
        <thead>
          <tr>
            <th>ชื่อสินค้า</th>
            <th>SKU</th>
            <th>คงเหลือ</th>
            <th>ราคาขาย</th>
            <th>ผู้เพิ่ม/แก้ไข</th>
            <th>จัดการ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in products" :key="item.id">
            <td>{{ item.name }}</td>
            <td><code>{{ item.sku }}</code></td>
            <td :class="{ 'low-stock': item.stock_qty <= 5 }">
              {{ item.stock_qty }} ชิ้น
            </td>
            <td>฿{{ item.sell_price.toLocaleString() }}</td>
            <td class="audit-info">
              <div>➕ {{ item.created_user?.full_name || 'ไม่ระบุ' }}</div>
              <div>📝 {{ item.updated_user?.full_name || '-' }}</div>
            </td>
            <td>
              <button @click="editProduct(item)" class="btn-edit">แก้ไข</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'auth-global' // ต้อง Login ก่อนเข้าหน้านี้
})

const { getInventory } = useAdminProducts()
const { data: products, refresh } = await getInventory()
const showAddModal = ref(false)

const editProduct = (item) => {
  // Logic สำหรับเปิด Modal แก้ไข
  console.log('Editing:', item.id)
}
</script>

<style scoped>
.dashboard-container { padding: 2rem; }
.admin-header { display: flex; justify-content: space-between; margin-bottom: 2rem; }
.btn-add { background: #4f46e5; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; }

.inventory-table { width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; }
.inventory-table th { background: #f8f9fa; padding: 15px; text-align: left; }
.inventory-table td { padding: 15px; border-bottom: 1px solid #eee; }

.low-stock { color: #ef4444; font-weight: bold; background: #fee2e2; padding: 4px 8px; border-radius: 4px; }
.audit-info { font-size: 0.75rem; color: #666; }
.btn-edit { color: #4f46e5; background: none; border: 1px solid #4f46e5; padding: 5px 10px; border-radius: 4px; cursor: pointer; }
</style>