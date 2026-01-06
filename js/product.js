/**
 * Product management functions
 */

let allProducts = [];
let productsMap = new Map(); // For quick lookup by ID

// Load all products
async function loadProducts() {
    try {
        const products = await apiRequest('/product/all');
        allProducts = products;
        
        // Build products map for quick lookup
        productsMap.clear();
        products.forEach(product => {
            productsMap.set(product.id, product);
        });
        
        renderProducts(products);
    } catch (error) {
        handleError(error, 'load products');
        document.getElementById('productGrid').innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    Failed to load products. Please try again.
                </div>
            </div>
        `;
    }
}

// Render products as cards
function renderProducts(products) {
    const productGrid = document.getElementById('productGrid');
    
    if (!products || products.length === 0) {
        productGrid.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info text-center">
                    No products found. Add your first product!
                </div>
            </div>
        `;
        return;
    }
    
    productGrid.innerHTML = '';
    
    products.forEach(product => {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4 col-xl-3 mb-4';
        
        col.innerHTML = `
            <div class="card product-card h-100">
                <div class="card-body">
                    <h5 class="card-title">${product.name || 'Unnamed Product'}</h5>
                    <h6 class="card-subtitle mb-2 text-muted">${product.category || 'Uncategorized'}</h6>
                    <p class="card-text">${product.description || 'No description available.'}</p>
                    
                    <div class="d-flex justify-content-between align-items-center mt-3">
                        <span class="product-price">$${(product.price || 0).toFixed(2)}</span>
                        <span class="product-stock badge ${product.stock > 10 ? 'bg-success' : product.stock > 0 ? 'bg-warning' : 'bg-danger'}">
                            Stock: ${product.stock || 0}
                        </span>
                    </div>
                </div>
                <div class="card-footer bg-transparent border-top-0">
                    <div class="d-flex justify-content-between">
                        <button class="btn btn-sm btn-outline-primary" onclick="editProduct(${product.id})">
                            <i class="bi bi-pencil"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteProductPrompt(${product.id})">
                            <i class="bi bi-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        productGrid.appendChild(col);
    });
}

// Add new product
async function addProduct() {
    try {
        const product = {
            name: document.getElementById('productName').value,
            description: document.getElementById('productDescription').value,
            price: parseFloat(document.getElementById('productPrice').value),
            stock: parseInt(document.getElementById('productStock').value),
            category: document.getElementById('productCategory').value
        };
        
        if (!product.name || isNaN(product.price) || isNaN(product.stock)) {
            showNotification('Please fill in all required fields', 'warning');
            return;
        }
        
        const response = await apiRequest('/product/add', {
            method: 'POST',
            body: JSON.stringify(product)
        });
        
        // Refresh product list
        await loadProducts();
        
        // Reset form and close modal
        document.getElementById('addProductForm').reset();
        bootstrap.Modal.getInstance(document.getElementById('addProductModal')).hide();
        
        showNotification('Product added successfully!', 'success');
    } catch (error) {
        handleError(error, 'add product');
    }
}

// Edit product - load data into modal
async function editProduct(productId) {
    try {
        const product = await apiRequest(`/product/${productId}`);
        
        if (product) {
            document.getElementById('editProductId').value = product.id;
            document.getElementById('editProductName').value = product.name || '';
            document.getElementById('editProductDescription').value = product.description || '';
            document.getElementById('editProductPrice').value = product.price || 0;
            document.getElementById('editProductStock').value = product.stock || 0;
            document.getElementById('editProductCategory').value = product.category || 'Other';
            
            const modal = new bootstrap.Modal(document.getElementById('editProductModal'));
            modal.show();
        }
    } catch (error) {
        handleError(error, 'load product for editing');
    }
}

// Update product
async function updateProduct() {
    try {
        const productId = document.getElementById('editProductId').value;
        const product = {
            id: parseInt(productId),
            name: document.getElementById('editProductName').value,
            description: document.getElementById('editProductDescription').value,
            price: parseFloat(document.getElementById('editProductPrice').value),
            stock: parseInt(document.getElementById('editProductStock').value),
            category: document.getElementById('editProductCategory').value
        };
        
        if (!product.name || isNaN(product.price) || isNaN(product.stock)) {
            showNotification('Please fill in all required fields', 'warning');
            return;
        }
        
        const response = await apiRequest('/product/update', {
            method: 'PUT',
            body: JSON.stringify(product)
        });
        
        // Refresh product list
        await loadProducts();
        
        // Close modal
        bootstrap.Modal.getInstance(document.getElementById('editProductModal')).hide();
        
        showNotification('Product updated successfully!', 'success');
    } catch (error) {
        handleError(error, 'update product');
    }
}

// Delete product with confirmation
async function deleteProductPrompt(productId) {
    const confirmed = await confirmAction('Are you sure you want to delete this product?');
    
    if (confirmed) {
        await deleteProduct(productId);
    }
}

// Delete product
async function deleteProduct(productId) {
    try {
        const response = await apiRequest(`/product/delete/${productId}`, {
            method: 'DELETE'
        });
        
        if (response) {
            // Refresh product list
            await loadProducts();
            showNotification('Product deleted successfully!', 'success');
        }
    } catch (error) {
        handleError(error, 'delete product');
    }
}

// Get product by ID (from cache)
function getProductById(productId) {
    return productsMap.get(parseInt(productId));
}

// Search products
function searchProducts(searchTerm) {
    if (!searchTerm) {
        renderProducts(allProducts);
        return;
    }
    
    const filtered = allProducts.filter(product =>
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    renderProducts(filtered);
}

// Get products for dropdown (used in order management)
async function getProductsForDropdown() {
    try {
        const products = await apiRequest('/product/all');
        return products.map(product => ({
            id: product.id,
            name: product.name,
            price: product.price,
            stock: product.stock
        }));
    } catch (error) {
        console.error('Error fetching products for dropdown:', error);
        return [];
    }
}