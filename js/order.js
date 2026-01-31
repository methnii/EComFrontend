/**
 * Order management functions
 */

let allOrders = [];
let allCustomersForOrders = [];
let allProductsForOrders = [];

// Load all orders
async function loadOrders() {
    try {
        showLoading(document.querySelector('#orderTable tbody'));
        
        const orders = await apiRequest('/order/all');
        allOrders = orders;
        renderOrders(orders);
    } catch (error) {
        handleError(error, 'load orders');
        document.querySelector('#orderTable tbody').innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-danger">
                    Failed to load orders. Please try again.
                </td>
            </tr>
        `;
    }
}

// Render orders to table
function renderOrders(orders) {
    const tableBody = document.querySelector('#orderTable tbody');
    if (!tableBody) {
        console.error('Table body not found!');
        return;
    }
    
    tableBody.innerHTML = '';
    
    if (!orders || orders.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted">
                    <div class="py-4">
                        <i class="bi bi-inbox" style="font-size: 3rem;"></i>
                        <h5 class="mt-3">No orders found</h5>
                        <p class="text-muted">Start by placing your first order!</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    console.log('Rendering', orders.length, 'orders');
    
    // Sort orders by date (newest first)
    orders.sort((a, b) => {
        const dateA = new Date(a.orderDate || a.createdDate || 0);
        const dateB = new Date(b.orderDate || b.createdDate || 0);
        return dateB - dateA;
    });
    
    orders.forEach(order => {
        try {
            console.log('Processing order:', order);
            
            const row = document.createElement('tr');
            
            // Get customer name (handle different structures)
            let customerName = 'N/A';
            if (order.customer) {
                if (typeof order.customer === 'object') {
                    customerName = order.customer.name || order.customer.fullName || 'N/A';
                } else if (typeof order.customer === 'string') {
                    customerName = order.customer;
                }
            }
            
            // Format date
            const orderDate = order.orderDate || order.createdDate;
            let formattedDate = 'N/A';
            if (orderDate) {
                try {
                    formattedDate = formatDate(orderDate);
                } catch (e) {
                    console.error('Error formatting date:', e);
                    formattedDate = orderDate;
                }
            }
            
            // Get item count
            
            row.innerHTML = `
                <td><strong>#${order.id || 'N/A'}</strong></td>
                <td>${order.customerName}</td>
                <td>$${(order.totalPrice || 0).toFixed(2)}</td>
                <td>
                    <span class="badge bg-${getStatusColor(order.status)}">
                        ${getStatusText(order.status)}
                    </span>
                </td>
                <td>${formattedDate}</td>
                <td>${order.items ? order.items.length : 0}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="viewOrderDetails(${order.id})">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-outline-warning" onclick="updateOrderStatusPrompt(${order.id})">
                            <i class="bi bi-pencil"></i>
                        </button>
                    </div>
                </td>
            `;
            
            tableBody.appendChild(row);
            
        } catch (error) {
            console.error('Error rendering order:', order, error);
        }
    });
    
    console.log('Orders rendered to table');
}

// View order details
async function viewOrderDetails(orderId) {
    try {
        const order = await apiRequest(`/order/${orderId}`);
        
        // Create modal for order details
        const modalId = 'orderDetailsModal';
        let modal = document.getElementById(modalId);
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'modal fade';
            modal.innerHTML = `
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Order Details #${order.id}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body" id="orderDetailsContent">
                            <!-- Content will be loaded here -->
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        // Populate order details
        const content = document.getElementById('orderDetailsContent');
        content.innerHTML = `
            <div class="row mb-4">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-body">
                            <h6>Customer Information</h6>
                            <p><strong>Name:</strong> ${order.Blob || 'N/A'}</p>
                            <p><strong>Email:</strong> ${order.customer?.email || 'N/A'}</p>
                            <p><strong>Address:</strong> ${order.customer?.address || 'N/A'}</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-body">
                            <h6>Order Information</h6>
                            <p><strong>Order ID:</strong> #${order.id}</p>
                            <p><strong>Order Date:</strong> ${formatDate(order.orderDate)}</p>
                            <p><strong>Status:</strong> 
                                <span class="badge bg-${getStatusColor(order.status)}">
                                    ${getStatusText(order.status)}
                                </span>
                            </p>
                            <p><strong>Total Price:</strong> $${(order.totalPrice || 0).toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <h5>Order Items</h5>
            <div class="table-responsive">
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody id="orderItemsDetails">
                        <!-- Items will be loaded here -->
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3" class="text-end"><strong>Grand Total:</strong></td>
                            <td><strong>$${(order.totalPrice || 0).toFixed(2)}</strong></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;
        
        // Load order items
        const itemsBody = document.getElementById('orderItemsDetails');
        if (order.items && order.items.length > 0) {
            order.items.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.product?.name || 'N/A'}</td>
                    <td>${item.quantity || 0}</td>
                    <td>$${((item.price || 0) / (item.quantity || 1)).toFixed(2)}</td>
                    <td>$${(item.price || 0).toFixed(2)}</td>
                `;
                itemsBody.appendChild(row);
            });
        } else {
            itemsBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-muted">
                        No items found for this order
                    </td>
                </tr>
            `;
        }
        
        const orderModal = new bootstrap.Modal(modal);
        orderModal.show();
    } catch (error) {
        handleError(error, 'view order details');
    }
}

// Update order status prompt
async function updateOrderStatusPrompt(orderId) {
    // Create status update modal
    const modalId = 'updateStatusModal';
    let modal = document.getElementById(modalId);
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Update Order Status</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="updateStatusForm">
                            <input type="hidden" id="updateOrderId">
                            <div class="mb-3">
                                <label for="orderStatusSelect" class="form-label">Select Status</label>
                                <select class="form-select" id="orderStatusSelect">
                                    <option value="PROCESSING">Processing</option>
                                    <option value="DELIVERING">Delivering</option>
                                    <option value="DELIVERED">Delivered</option>
                                </select>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" id="confirmStatusUpdate">Update</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    // Set current status if available
    try {
        const order = await apiRequest(`/order/${orderId}`);
        const statusSelect = document.getElementById('orderStatusSelect');
        if (order && order.status) {
            statusSelect.value = order.status;
        }
    } catch (error) {
        console.error('Error loading order status:', error);
    }
    
    document.getElementById('updateOrderId').value = orderId;
    const statusModal = new bootstrap.Modal(modal);
    
    // Set up update button
    document.getElementById('confirmStatusUpdate').onclick = async () => {
        const status = document.getElementById('orderStatusSelect').value;
        await updateOrderStatus(orderId, status);
        statusModal.hide();
    };
    
    statusModal.show();
}

// Update order status
async function updateOrderStatus(orderId, status) {
    try {
        const response = await apiRequest(`/order/update-status/${orderId}?status=${encodeURIComponent(status)}`, {
            method: 'PUT'
        });
        
        // Refresh orders list
        await loadOrders();
        showNotification('Order status updated successfully!', 'success');
    } catch (error) {
        handleError(error, 'update order status');
    }
}

// Place new order
async function placeOrder() {
    try {
        const customerId = document.getElementById('orderCustomer').value;
        if (!customerId) {
            showNotification('Please select a customer', 'warning');
            return;
        }
        
        // Collect order items
        const orderItems = [];
        let totalPrice = 0;
        let isValid = true;
        
        document.querySelectorAll('.order-item').forEach(itemRow => {
            const productSelect = itemRow.querySelector('.product-select');
            const quantityInput = itemRow.querySelector('.quantity-input');
            
            const productId = productSelect.value;
            const quantity = parseInt(quantityInput.value);
            
            if (productId && quantity > 0) {
                const product = getProductById(productId);
                if (product) {
                    // Check stock availability
                    if (quantity > product.stock) {
                        showNotification(`Only ${product.stock} items available for ${product.name}`, 'warning');
                        isValid = false;
                        return;
                    }
                    
                    const itemTotal = product.price * quantity;
                    orderItems.push({
                        productId: parseInt(productId),
                        quantity: quantity,
                        price: itemTotal
                    });
                    totalPrice += itemTotal;
                }
            }
        });
        
        if (!isValid) return;
        
        if (orderItems.length === 0) {
            showNotification('Please add at least one item to the order', 'warning');
            return;
        }
        
        const orderDate = document.getElementById('orderDate').value || new Date().toISOString();
        
        const order = {
            customerId: parseInt(customerId),
            totalPrice: totalPrice,
            status: 'PROCESSING',
            orderDate: orderDate,
            items: orderItems
        };
        
        console.log('Placing order:', order); // Debug log
        
        const response = await apiRequest('/order/place', {
            method: 'POST',
            body: JSON.stringify(order)
        });
        
        // Refresh orders list
        await loadOrders();
        
        // Reset form and close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('placeOrderModal'));
        modal.hide();
        
        showNotification('Order placed successfully!', 'success');
    } catch (error) {
        console.error('Error placing order:', error);
        handleError(error, 'place order');
    }
}

// Add order item row
function addOrderItem() {
    const container = document.getElementById('orderItemsContainer');
    const newItem = document.createElement('div');
    newItem.className = 'order-item card mb-3';
    newItem.innerHTML = `
        <div class="card-body">
            <div class="row align-items-end">
                <div class="col-md-5">
                    <label class="form-label">Product *</label>
                    <select class="form-select product-select" onchange="updateProductPrice(this)" required>
                        <option value="">Select Product</option>
                    </select>
                    <small class="text-muted product-stock-info"></small>
                </div>
                <div class="col-md-3">
                    <label class="form-label">Quantity *</label>
                    <input type="number" class="form-control quantity-input" min="1" value="1" 
                           onchange="calculateItemTotal(this)" required>
                </div>
                <div class="col-md-3">
                    <label class="form-label">Price</label>
                    <input type="text" class="form-control price-display" readonly>
                </div>
                <div class="col-md-1">
                    <button type="button" class="btn btn-danger mt-4" onclick="removeOrderItem(this)">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    container.appendChild(newItem);
    
    // Populate product dropdown for the new item
    populateProductDropdown(newItem.querySelector('.product-select'));
}

// Remove order item row
function removeOrderItem(button) {
    const itemRow = button.closest('.order-item');
    if (itemRow) {
        itemRow.remove();
        calculateOrderTotal();
    }
}

// Get product by ID
function getProductById(productId) {
    return allProductsForOrders.find(p => p.id == productId);
}

// Update product price when selected
function updateProductPrice(selectElement) {
    const itemRow = selectElement.closest('.order-item');
    const priceDisplay = itemRow.querySelector('.price-display');
    const quantityInput = itemRow.querySelector('.quantity-input');
    const stockInfo = itemRow.querySelector('.product-stock-info');
    
    const productId = selectElement.value;
    if (productId) {
        const product = getProductById(productId);
        if (product) {
            // Update stock info
            stockInfo.textContent = `Stock: ${product.stock}`;
            if (product.stock < 1) {
                stockInfo.className = 'text-muted product-stock-info text-danger';
                quantityInput.disabled = true;
                priceDisplay.value = 'Out of Stock';
                return;
            } else {
                stockInfo.className = 'text-muted product-stock-info';
                quantityInput.disabled = false;
                quantityInput.max = product.stock;
            }
            
            const quantity = parseInt(quantityInput.value) || 1;
            if (quantity > product.stock) {
                quantityInput.value = product.stock;
                showNotification(`Only ${product.stock} items available`, 'warning');
            }
            const total = product.price * (quantity || 1);
            priceDisplay.value = `$${total.toFixed(2)}`;
            calculateOrderTotal();
        }
    } else {
        priceDisplay.value = '';
        stockInfo.textContent = '';
        calculateOrderTotal();
    }
}

// Calculate item total when quantity changes
function calculateItemTotal(inputElement) {
    const itemRow = inputElement.closest('.order-item');
    const productSelect = itemRow.querySelector('.product-select');
    const priceDisplay = itemRow.querySelector('.price-display');
    const stockInfo = itemRow.querySelector('.product-stock-info');
    
    const productId = productSelect.value;
    if (productId) {
        const product = getProductById(productId);
        if (product) {
            const quantity = parseInt(inputElement.value) || 1;
            
            // Check stock
            if (quantity > product.stock) {
                inputElement.value = product.stock;
                showNotification(`Only ${product.stock} items available`, 'warning');
            }
            
            const total = product.price * (parseInt(inputElement.value) || 1);
            priceDisplay.value = `$${total.toFixed(2)}`;
            stockInfo.textContent = `Stock: ${product.stock}`;
            calculateOrderTotal();
        }
    }
}

// Calculate total order amount
function calculateOrderTotal() {
    let total = 0;
    
    document.querySelectorAll('.order-item').forEach(itemRow => {
        const priceDisplay = itemRow.querySelector('.price-display');
        const priceText = priceDisplay.value;
        
        if (priceText && priceText !== 'Out of Stock') {
            const price = parseFloat(priceText.replace('$', '')) || 0;
            total += price;
        }
    });
    
    document.getElementById('orderTotalAmount').textContent = `$${total.toFixed(2)}`;
    document.getElementById('orderTotalPrice').value = total;
}

// Get products for dropdown
async function getProductsForDropdown() {
    try {
        const response = await fetch('http://localhost:8081/product/all');
        if (!response.ok) throw new Error('Failed to fetch products');
        
        const products = await response.json();
        allProductsForOrders = products; // Store globally
        return products.map(product => ({
            id: product.id,
            name: product.name,
            price: product.price,
            stock: product.stock,
            category: product.category
        }));
    } catch (error) {
        console.error('Error getting products for dropdown:', error);
        return [];
    }
}

// Populate product dropdown
async function populateProductDropdown(selectElement) {
    try {
        if (!allProductsForOrders || allProductsForOrders.length === 0) {
            allProductsForOrders = await getProductsForDropdown();
        }
        
        // Clear existing options except the first one
        while (selectElement.options.length > 1) {
            selectElement.remove(1);
        }
        
        // Add product options
        allProductsForOrders.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.name} - $${product.price.toFixed(2)}`;
            option.setAttribute('data-stock', product.stock);
            option.setAttribute('data-price', product.price);
            selectElement.appendChild(option);
        });
    } catch (error) {
        console.error('Error populating product dropdown:', error);
        showNotification('Failed to load products', 'danger');
    }
}

// Populate customer dropdown
async function populateCustomerDropdown() {
    try {
        if (!allCustomersForOrders || allCustomersForOrders.length === 0) {
            const response = await fetch('http://localhost:8081/customer/getAll');
            if (!response.ok) throw new Error('Failed to fetch customers');
            
            allCustomersForOrders = await response.json();
        }
        
        const selectElement = document.getElementById('orderCustomer');
        
        // Clear existing options except the first one
        while (selectElement.options.length > 1) {
            selectElement.remove(1);
        }
        
        // Add customer options
        allCustomersForOrders.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer.id;
            option.textContent = `${customer.name} - ${customer.email}`;
            selectElement.appendChild(option);
        });
    } catch (error) {
        console.error('Error populating customer dropdown:', error);
        showNotification('Failed to load customers', 'danger');
    }
}

// Populate all product dropdowns
async function populateProductDropdowns() {
    const selects = document.querySelectorAll('.product-select');
    for (const select of selects) {
        await populateProductDropdown(select);
    }
}

// Initialize order modal with enhanced features
function initOrderModal() {
    const orderModal = document.getElementById('placeOrderModal');
    if (orderModal) {
        orderModal.addEventListener('show.bs.modal', async () => {
            try {
                await populateCustomerDropdown();
                await populateProductDropdowns();
                
                // Clear existing order items and add one
                document.getElementById('orderItemsContainer').innerHTML = '';
                addOrderItem();
                
                // Set default date
                const now = new Date();
                const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
                    .toISOString()
                    .slice(0, 16);
                document.getElementById('orderDate').value = localDateTime;
                
                // Reset total
                calculateOrderTotal();
            } catch (error) {
                console.error('Error initializing order modal:', error);
                showNotification('Failed to initialize order form', 'danger');
            }
        });
        
        orderModal.addEventListener('hidden.bs.modal', () => {
            document.getElementById('placeOrderForm').reset();
            document.getElementById('orderItemsContainer').innerHTML = '';
            addOrderItem();
            calculateOrderTotal();
        });
    }
}

// Export orders to CSV
function exportOrdersToCSV() {
    if (!allOrders.length) {
        showNotification('No orders to export', 'warning');
        return;
    }
    
    const headers = ['Order ID', 'Customer', 'Total Price', 'Status', 'Order Date', 'Items Count'];
    const rows = allOrders.map(order => [
        order.id,
        order.customer?.name || '',
        order.totalPrice || 0,
        getStatusText(order.status),
        formatDate(order.orderDate),
        order.items ? order.items.length : 0
    ]);
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    showNotification('Orders exported to CSV', 'success');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    
    // Initialize order modal if on orders page
    if (document.getElementById('placeOrderModal')) {
        initOrderModal();
    }
    
    // Load orders if on orders page
    if (document.getElementById('orderTable')) {
        loadOrders();
    }
});