export const useCart = () => {
    // ใช้ Cookie เก็บตะกร้าเพื่อป้องกันรีเฟรชแล้วหาย
    const cart = useCookie<any[]>('shopping-cart', {
        default: () => [],
        watch: true,
        maxAge: 60 * 60 * 24 * 7 // เก็บไว้ 7 วัน
    })

    const client = useSupabaseClient()

    // 1. ฟังก์ชันเพิ่มสินค้าลงตะกร้า (พร้อมเช็คสต็อก)
    const addToCart = (product: any, qty = 1) => {
        const existingItem = cart.value.find(item => item.product_id === product.id)

        if (existingItem) {
            if (existingItem.qty + qty > product.stock_qty) {
                alert('ขออภัยครับ สินค้าในสต็อกไม่เพียงพอ')
                return
            }
            existingItem.qty += qty
            existingItem.total_price = existingItem.qty * existingItem.price
        } else {
            if (qty > product.stock_qty) {
                alert('ขออภัยครับ สินค้าในสต็อกไม่เพียงพอ')
                return
            }
            cart.value.push({
                product_id: product.id,
                name: product.name,
                image_url: product.image_url,
                price: product.sell_price,
                qty: qty,
                max_stock: product.stock_qty,
                total_price: product.sell_price * qty
            })
        }
        alert(`เพิ่ม ${product.name} ลงตะกร้าแล้ว!`)
    }

    // 2. ฟังก์ชันลบสินค้าออกจากตะกร้า
    const removeFromCart = (productId: string) => {
        cart.value = cart.value.filter(item => item.product_id !== productId)
    }

    // 3. ฟังก์ชันอัปเดตจำนวนสินค้า
    const updateQty = (productId: string, newQty: number) => {
        const item = cart.value.find(i => i.product_id === productId)
        if (item) {
            if (newQty <= 0) {
                removeFromCart(productId)
            } else if (newQty > item.max_stock) {
                alert('จำนวนที่สั่งเกินสต็อกที่มีครับ')
            } else {
                item.qty = newQty
                item.total_price = item.qty * item.price
            }
        }
    }

    // 4. ฟังก์ชันเคลียร์ตะกร้า
    const clearCart = () => {
        cart.value = []
    }

    // 5. คำนวณยอดรวมและจำนวนชิ้น (Computed)
    const cartTotal = computed(() => cart.value.reduce((sum, item) => sum + item.total_price, 0))
    const cartItemCount = computed(() => cart.value.reduce((count, item) => count + item.qty, 0))

    // 6. ⭐️ ฟังก์ชันดำเนินการสั่งซื้อ (Checkout Process) แบบ Full-Flow
    // รับค่า paymentMethod และ addressId เข้ามาเพื่อบันทึกให้ครบถ้วน
    const processCheckout = async (paymentMethod: string, addressId: string) => {
        if (cart.value.length === 0) return { error: { message: 'ตะกร้าสินค้าว่างเปล่า' } }
        if (!addressId) return { error: { message: 'กรุณาเลือกที่อยู่สำหรับจัดส่ง' } }

        // ดึง Auth User แบบชัวร์ๆ
        const { data: { user: authUser }, error: authError } = await client.auth.getUser()
        if (authError || !authUser) return { error: { message: 'กรุณาล็อกอินใหม่อีกครั้ง' } }

        try {
            // 1. ตรวจสอบสิทธิ์ผู้ใช้งาน (Role)
            const { data: dbUser, error: dbUserError } = await client
                .from('users')
                .select('id, member_id, role') 
                .eq('id', authUser.id)
                .single()

            if (dbUserError || !dbUser) throw new Error('ไม่พบข้อมูลผู้ใช้งานในระบบ')

            if (dbUser.role !== 'customer') {
                 return { error: { message: 'ขออภัยครับ เฉพาะบัญชีลูกค้า (Customer) เท่านั้นที่สามารถสั่งซื้อสินค้าหน้าร้านได้' } }
            }

            const orderNo = `WEB-${Date.now()}`

            // 📦 ขั้นตอนที่ 1: สร้าง Order (บันทึกที่อยู่จัดส่งลงไปด้วย)
            const { data: order, error: orderError } = await client
                .from('orders')
                .insert({
                    order_no: orderNo,
                    order_source: 'web',
                    member_id: dbUser.member_id,
                    created_by_user_id: dbUser.id,
                    total_amount: cartTotal.value,
                    status: 'pending_payment',
                    delivery_address_id: addressId // ⭐️ โยงกับที่อยู่ที่ลูกค้าเลือก
                })
                .select()
                .single()

            if (orderError) throw orderError

            // 🛒 ขั้นตอนที่ 2: บันทึกรายการสินค้าในตะกร้าลงฐานข้อมูล
            const orderItems = cart.value.map(item => ({
                order_id: order.id,
                product_id: item.product_id,
                qty: item.qty,
                unit_price: item.price
            }))
            
            const { error: itemError } = await client.from('order_items').insert(orderItems)
            if (itemError) throw itemError

            // 💳 ขั้นตอนที่ 3: ตั้งต้นข้อมูลการชำระเงิน
            const { error: paymentError } = await client.from('payments').insert({
                order_id: order.id,
                payment_method: paymentMethod,
                payment_status: 'pending',
                payment_amount: cartTotal.value
            })
            if (paymentError) throw paymentError

            // ✨ สำเร็จแล้วล้างตะกร้าได้เลย
            clearCart()
            return { data: order, error: null }

        } catch (error: any) {
            console.error('Checkout Error:', error)
            return { error: { message: error.message || 'เกิดข้อผิดพลาดในการสั่งซื้อ' } }
        }
    }

    return {
        cart,
        addToCart,
        removeFromCart,
        updateQty,
        clearCart,
        cartTotal,
        cartItemCount,
        processCheckout
    }
}