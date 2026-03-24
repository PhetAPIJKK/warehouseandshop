<template>
    <div class="cart-container">
        <h1 class="title">🛒 ตะกร้าสินค้าของคุณ</h1>

        <div v-if="cart.length === 0" class="empty-cart">
            <div class="empty-icon">🛍️</div>
            <h2>ยังไม่มีสินค้าในตะกร้า</h2>
            <p class="text-muted">ลองเลือกดูสินค้าที่น่าสนใจในร้านของเราสิครับ</p>
            <NuxtLink to="/" class="btn-primary" style="display: inline-block; margin-top: 1rem;">
                ไปเลือกซื้อสินค้าเลย
            </NuxtLink>
        </div>

        <div v-else class="cart-content">

            <div class="cart-items">
                <div v-for="item in cart" :key="item.product_id" class="cart-item-card">

                    <img v-if="item.image_url" :src="item.image_url" class="item-image" />
                    <div v-else class="no-image">ไม่มีรูป</div>

                    <div class="item-details">
                        <h3 class="item-name">{{ item.name }}</h3>
                        <p class="item-price">฿{{ item.price.toLocaleString() }} / ชิ้น</p>
                    </div>

                    <div class="qty-controls">
                        <button @click="updateQty(item.product_id, item.qty - 1)" class="btn-qty">-</button>
                        <span class="qty-number">{{ item.qty }}</span>
                        <button @click="updateQty(item.product_id, item.qty + 1)" class="btn-qty"
                            :disabled="item.qty >= item.max_stock">+</button>
                    </div>

                    <div class="item-total">
                        ฿{{ item.total_price.toLocaleString() }}
                    </div>

                    <button @click="removeFromCart(item.product_id)" class="btn-remove" title="ลบสินค้านี้">
                        🗑️
                    </button>
                </div>
            </div>

            <div class="cart-summary-card">
                <div class="address-selection-box">
                    <h3 style="border: none; padding: 0; margin-bottom: 1rem;">📍 ที่อยู่จัดส่ง</h3>

                    <div v-if="isLoadingAddresses" class="text-muted" style="font-size: 0.9rem;">กำลังโหลดที่อยู่...
                    </div>

                    <div v-else-if="addresses.length === 0" class="no-address-box">
                        <p style="font-size: 0.85rem; color: #ef4444; margin-bottom: 0.5rem;">ยังไม่มีที่อยู่จัดส่ง</p>
                        <NuxtLink to="/profile" class="btn-add-small">+ เพิ่มที่อยู่ใหม่</NuxtLink>
                    </div>

                    <div v-else class="address-list">
                        <label v-for="addr in addresses" :key="addr.id" class="address-option"
                            :class="{ 'selected': selectedAddressId === addr.id }">
                            <input type="radio" v-model="selectedAddressId" :value="addr.id" style="display: none;" />
                            <div class="addr-content">
                                <strong>{{ addr.label }}</strong>
                                <p class="text-muted" style="font-size: 0.8rem; margin: 2px 0;">{{ addr.address_detail
                                    }}</p>
                                <span style="font-size: 0.8rem;">📞 {{ addr.phone }}</span>
                            </div>
                        </label>
                    </div>
                </div>
                <h3>สรุปคำสั่งซื้อ</h3>
                <div class="summary-row">
                    <span>จำนวนสินค้าทั้งหมด</span>
                    <span>{{ cartItemCount }} ชิ้น</span>
                </div>
                <div class="summary-row total-row">
                    <span>ยอดรวมทั้งสิ้น</span>
                    <span class="total-price">฿{{ cartTotal.toLocaleString() }}</span>
                </div>

                <div class="payment-method-section"
                    style="margin: 1.5rem 0; padding-top: 1rem; border-top: 1px solid #e2e8f0;">
                    <h4 style="margin-top: 0; margin-bottom: 0.5rem; color: #1e293b;">ช่องทางการชำระเงิน</h4>

                    <label style="display: block; margin-bottom: 0.5rem; cursor: pointer;">
                        <input type="radio" v-model="paymentMethod" value="bank_transfer" />
                        โอนเงินผ่านบัญชีธนาคาร
                    </label>

                    <label style="display: block; cursor: pointer;">
                        <input type="radio" v-model="paymentMethod" value="promptpay" />
                        พร้อมเพย์ (PromptPay)
                    </label>
                </div>

                <button @click="handleCheckout" class="btn-checkout" :disabled="isCheckingOut">
                    💳 {{ isCheckingOut ? 'กำลังบันทึก...' : 'ยืนยันและดำเนินการชำระเงิน' }}
                </button>
            </div>

        </div>
    </div>
</template>

<script setup>
definePageMeta({ layout: 'default' })

const { cart, updateQty, removeFromCart, cartTotal, cartItemCount, processCheckout } = useCart()
const { fetchAddresses } = useAddress() // ⭐️ เรียกใช้ useAddress เพื่อดึงข้อมูลที่อยู่

const addresses = ref([])
const selectedAddressId = ref('')
const paymentMethod = ref('bank_transfer')
const isCheckingOut = ref(false)
const isLoadingAddresses = ref(true)

// โหลดข้อมูลที่อยู่เมื่อเปิดหน้าเว็บ
onMounted(async () => {
    addresses.value = await fetchAddresses()
    if (addresses.value.length > 0) {
        selectedAddressId.value = addresses.value[0].id // เลือกที่อยู่อันแรกเป็นค่าเริ่มต้น
    }
    isLoadingAddresses.value = false
})

const handleCheckout = async () => {
    if (isCheckingOut.value) return
    if (!selectedAddressId.value) {
        alert('กรุณาเลือกที่อยู่จัดส่งก่อนครับ')
        return
    }

    const total = cartTotal.value || 0
    const confirmCheckout = confirm(`ยืนยันคำสั่งซื้อยอดรวม ฿${total.toLocaleString()} ใช่หรือไม่?`)
    if (!confirmCheckout) return

    isCheckingOut.value = true

    try {
        // ⭐️ ส่งทั้ง วิธีชำระเงิน และ ID ที่อยู่ ไปยัง processCheckout
        const { error, data: order } = await processCheckout(paymentMethod.value, selectedAddressId.value)

        if (error) {
            alert('เกิดข้อผิดพลาดในการสั่งซื้อ: ' + error.message)
        } else if (order && order.id) {
            alert('สร้างคำสั่งซื้อสำเร็จ!')
            navigateTo(`/payment/${order.id}`)
        }
    } catch (err) {
        console.error(err)
        alert('เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง')
    } finally {
        isCheckingOut.value = false
    }
}
</script>
<style scoped>
.cart-container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 2rem;
}

.title {
    font-size: 1.8rem;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 2rem;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 1rem;
}

/* Empty State */
.empty-cart {
    text-align: center;
    padding: 4rem 2rem;
    background: white;
    border-radius: 12px;
    border: 1px dashed #cbd5e1;
}

.empty-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
}

.text-muted {
    color: #64748b;
}

/* Layout Grid */
.cart-content {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 2rem;
    align-items: start;
}

@media (max-width: 768px) {
    .cart-content {
        grid-template-columns: 1fr;
    }
}

/* Items List */
.cart-items {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.cart-item-card {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    background: white;
    padding: 1.5rem;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

@media (max-width: 640px) {
    .cart-item-card {
        flex-wrap: wrap;
    }

    .item-total {
        width: 100%;
        text-align: right;
    }
}

.item-image {
    width: 80px;
    height: 80px;
    object-fit: cover;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
}

.no-image {
    width: 80px;
    height: 80px;
    background: #f1f5f9;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    color: #94a3b8;
}

.item-details {
    flex-grow: 1;
}

.item-name {
    margin: 0 0 0.5rem 0;
    font-size: 1.1rem;
    color: #1e293b;
}

.item-price {
    margin: 0;
    color: #64748b;
    font-size: 0.95rem;
}

/* Qty Controls */
.qty-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 0.25rem;
}

.btn-qty {
    width: 32px;
    height: 32px;
    border: none;
    background: white;
    border-radius: 6px;
    cursor: pointer;
    font-weight: bold;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.btn-qty:hover:not(:disabled) {
    background: #e2e8f0;
}

.btn-qty:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.qty-number {
    min-width: 30px;
    text-align: center;
    font-weight: 600;
}

.item-total {
    font-weight: bold;
    color: #3b82f6;
    font-size: 1.2rem;
    min-width: 100px;
    text-align: right;
}

.btn-remove {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    opacity: 0.5;
    transition: opacity 0.2s;
    padding: 0.5rem;
}

.btn-remove:hover {
    opacity: 1;
    transform: scale(1.1);
}

/* Summary Card */
.cart-summary-card {
    background: white;
    padding: 1.5rem;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    position: sticky;
    top: 2rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.cart-summary-card h3 {
    margin-top: 0;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 1rem;
    color: #1e293b;
}

.summary-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 1rem;
    color: #475569;
}

.total-row {
    border-top: 1px solid #e2e8f0;
    padding-top: 1rem;
    margin-top: 1rem;
    align-items: center;
}

.total-price {
    font-size: 1.5rem;
    font-weight: 800;
    color: #0f172a;
}

.btn-checkout {
    width: 100%;
    background: #10b981;
    color: white;
    border: none;
    padding: 1rem;
    border-radius: 8px;
    font-weight: bold;
    font-size: 1.1rem;
    cursor: pointer;
    margin-top: 1rem;
    transition: background 0.2s;
}

.btn-checkout:hover {
    background: #059669;
}

.address-selection-box {
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e2e8f0;
}

.address-list {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    max-height: 200px;
    overflow-y: auto;
    padding-right: 5px;
}

.address-option {
    display: block;
    padding: 0.8rem;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
}

.address-option:hover {
    background: #f8fafc;
}

.address-option.selected {
    border-color: #3b82f6;
    background: #eff6ff;
    box-shadow: 0 0 0 1px #3b82f6;
}

.addr-content strong {
    font-size: 0.9rem;
    color: #1e293b;
}

.no-address-box {
    text-align: center;
    padding: 1rem;
    background: #fdf2f2;
    border-radius: 8px;
}

.btn-add-small {
    font-size: 0.8rem;
    color: #3b82f6;
    text-decoration: none;
    font-weight: bold;
}

/* ปรับแต่ง Scrollbar เล็กน้อย */
.address-list::-webkit-scrollbar {
    width: 4px;
}

.address-list::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 10px;
}
</style>