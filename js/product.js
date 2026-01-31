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

// Render products as cards with images
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
        
        // Get image URL or use placeholder
        const imageUrl = product.imageUrl || `https://via.placeholder.com/300x200/cccccc/666666?text=${encodeURIComponent(product.name?.substring(0, 15) || 'Product')}`;
        
        col.innerHTML = `
            <div class="card product-card h-100 shadow-sm">
                <div class="position-relative">
                    <img src="${imageUrl}" 
                         class="card-img-top product-image" 
                         alt="${product.name || 'Product'}"
                         style="height: 200px; object-fit: cover;"
                         onerror="this.src='https://via.placeholder.com/300x200/cccccc/666666?text=No+Image'">
                    <span class="position-absolute top-0 end-0 m-2 badge ${product.stock > 10 ? 'bg-success' : product.stock > 0 ? 'bg-warning' : 'bg-danger'}">
                        Stock: ${product.stock || 0}
                    </span>
                </div>
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title text-truncate" title="${product.name || 'Unnamed Product'}">
                        ${product.name || 'Unnamed Product'}
                    </h5>
                    <h6 class="card-subtitle mb-2 text-muted">${product.category || 'Uncategorized'}</h6>
                    <p class="card-text flex-grow-1" style="height: 60px; overflow: hidden; text-overflow: ellipsis;">
                        ${product.description || 'No description available.'}
                    </p>
                    
                    <div class="d-flex justify-content-between align-items-center mt-3">
                        <span class="product-price fw-bold text-primary">$${(product.price || 0).toFixed(2)}</span>
                        <small class="text-muted">SKU: #${product.id}</small>
                    </div>
                </div>
                <div class="card-footer bg-white border-top-0 pt-0">
                    <div class="d-flex justify-content-between">
                        <button class="btn btn-sm btn-outline-primary" onclick="editProduct(${product.id})" title="Edit">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteProductPrompt(${product.id})" title="Delete">
                            <i class="bi bi-trash"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-info" onclick="viewProductDetails(${product.id})" title="View Details">
                            <i class="bi bi-eye"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        productGrid.appendChild(col);
    });
}

// View product details
async function viewProductDetails(productId) {
    try {
        const product = await apiRequest(`/product/${productId}`);
        
        // Create modal for product details
        const modalId = 'productDetailsModal';
        let modal = document.getElementById(modalId);
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'modal fade';
            modal.innerHTML = `
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Product Details</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body" id="productDetailsContent">
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
        
        // Get image URL or use placeholder
        const imageUrl = product.imageUrl || `https://via.placeholder.com/400x300/cccccc/666666?text=${encodeURIComponent(product.name?.substring(0, 20) || 'Product')}`;
        
        // Populate product details
        const content = document.getElementById('productDetailsContent');
        content.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <div class="card h-100">
                        <div class="card-body text-center">
                            <img src="${imageUrl}" 
                                 alt="${product.name || 'Product'}" 
                                 class="img-fluid rounded mb-3"
                                 style="max-height: 300px; object-fit: contain;"
                                 onerror="this.src='https://via.placeholder.com/400x300/cccccc/666666?text=No+Image'">
                            <div class="d-flex justify-content-center gap-2">
                                <span class="badge bg-primary">${product.category || 'Uncategorized'}</span>
                                <span class="badge ${product.stock > 10 ? 'bg-success' : product.stock > 0 ? 'bg-warning' : 'bg-danger'}">
                                    Stock: ${product.stock || 0}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card h-100">
                        <div class="card-body">
                            <h4 class="card-title">${product.name || 'Unnamed Product'}</h4>
                            <p class="text-muted">SKU: #${product.id}</p>
                            
                            <div class="mb-3">
                                <h5 class="text-primary">$${(product.price || 0).toFixed(2)}</h5>
                            </div>
                            
                            <div class="mb-3">
                                <h6>Description</h6>
                                <p class="card-text">${product.description || 'No description available.'}</p>
                            </div>
                            
                            <div class="row">
                                <div class="col-6">
                                    <div class="mb-2">
                                        <small class="text-muted d-block">Category</small>
                                        <span class="fw-medium">${product.category || 'N/A'}</span>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <div class="mb-2">
                                        <small class="text-muted d-block">Stock Level</small>
                                        <span class="fw-medium ${product.stock > 10 ? 'text-success' : product.stock > 0 ? 'text-warning' : 'text-danger'}">
                                            ${product.stock || 0} units
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="mt-4">
                                <button class="btn btn-primary" onclick="editProduct(${product.id})" data-bs-dismiss="modal">
                                    <i class="bi bi-pencil"></i> Edit Product
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const productModal = new bootstrap.Modal(modal);
        productModal.show();
    } catch (error) {
        handleError(error, 'view product details');
    }
}

// Add new product with image
async function addProduct() {
    try {
        const product = {
            name: document.getElementById('productName').value,
            description: document.getElementById('productDescription').value,
            price: parseFloat(document.getElementById('productPrice').value),
            stock: parseInt(document.getElementById('productStock').value),
            category: document.getElementById('productCategory').value,
            imageUrl: document.getElementById('productImageUrl').value || null
        };
        
        if (!product.name || isNaN(product.price) || isNaN(product.stock)) {
            showNotification('Please fill in all required fields (Name, Price, Stock)', 'warning');
            return;
        }
        
        const response = await apiRequest('/product/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(product)
        });
        
        // Refresh product list
        await loadProducts();
        
        // Reset form and close modal
        document.getElementById('addProductForm').reset();
        document.getElementById('productImagePreview').style.display = 'none';
        document.getElementById('productImagePreview').src = '';
        
        // Close modal
        const modalElement = document.getElementById('addProductModal');
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) {
            modalInstance.hide();
        }
        
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
            document.getElementById('editProductImageUrl').value = product.imageUrl || '';
            
            // Show image preview if exists
            const preview = document.getElementById('editProductImagePreview');
            if (product.imageUrl) {
                preview.src = product.imageUrl;
                preview.style.display = 'block';
            } else {
                preview.style.display = 'none';
            }
            
            const modal = new bootstrap.Modal(document.getElementById('editProductModal'));
            modal.show();
        }
    } catch (error) {
        handleError(error, 'load product for editing');
    }
}

// Update product with image - CORRECTED VERSION
async function updateProduct() {
    try {
        const productId = document.getElementById('editProductId').value;
        
        // Get the current product from cache to preserve any fields not in the form
        const currentProduct = getProductById(productId);
        
        // Create product object from form values
        const product = {
            id: parseInt(productId),
            name: document.getElementById('editProductName').value,
            description: document.getElementById('editProductDescription').value,
            price: parseFloat(document.getElementById('editProductPrice').value),
            stock: parseInt(document.getElementById('editProductStock').value),
            category: document.getElementById('editProductCategory').value,
            imageUrl: document.getElementById('editProductImageUrl').value || null
        };
        
        // Validation
        if (!product.name || product.name.trim() === '') {
            showNotification('Product name is required', 'warning');
            return;
        }
        
        if (isNaN(product.price) || product.price <= 0) {
            showNotification('Price must be a positive number', 'warning');
            return;
        }
        
        if (isNaN(product.stock) || product.stock < 0) {
            showNotification('Stock must be a non-negative number', 'warning');
            return;
        }
        
        // Log the product being sent for debugging
        console.log('Updating product:', product);
        
        const response = await apiRequest('/product/update', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(product)
        });
        
        console.log('Update response:', response);
        
        // Update the cache immediately
        productsMap.set(product.id, { ...currentProduct, ...product });
        
        // Refresh product list from server
        await loadProducts();
        
        // Close modal
        const modalElement = document.getElementById('editProductModal');
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) {
            modalInstance.hide();
        }
        
        showNotification('Product updated successfully!', 'success');
    } catch (error) {
        console.error('Error updating product:', error);
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
        
        if (response !== undefined) {
            // Remove from cache
            productsMap.delete(parseInt(productId));
            
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
            stock: product.stock,
            imageUrl: product.imageUrl
        }));
    } catch (error) {
        console.error('Error fetching products for dropdown:', error);
        return [];
    }
}

// Image preview functionality for add product form
function initImagePreview() {
    const addImageUrlInput = document.getElementById('productImageUrl');
    const addPreview = document.getElementById('productImagePreview');
    const editImageUrlInput = document.getElementById('editProductImageUrl');
    const editPreview = document.getElementById('editProductImagePreview');
    
    if (addImageUrlInput && addPreview) {
        addImageUrlInput.addEventListener('input', function(e) {
            const imageUrl = e.target.value;
            if (imageUrl && isValidUrl(imageUrl)) {
                addPreview.src = imageUrl;
                addPreview.style.display = 'block';
                addPreview.onerror = function() {
                    this.style.display = 'none';
                    showNotification('Could not load image from URL', 'warning');
                };
            } else {
                addPreview.style.display = 'none';
            }
        });
    }
    
    if (editImageUrlInput && editPreview) {
        editImageUrlInput.addEventListener('input', function(e) {
            const imageUrl = e.target.value;
            if (imageUrl && isValidUrl(imageUrl)) {
                editPreview.src = imageUrl;
                editPreview.style.display = 'block';
                editPreview.onerror = function() {
                    this.style.display = 'none';
                    showNotification('Could not load image from URL', 'warning');
                };
            } else {
                editPreview.style.display = 'none';
            }
        });
    }
}

// Helper function to check if URL is valid
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Helper function to preview image URL
function previewImage(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    
    if (input && preview) {
        const url = input.value.trim();
        if (url && isValidUrl(url)) {
            preview.src = url;
            preview.style.display = 'block';
        } else {
            preview.style.display = 'none';
        }
    }
}

// Initialize image preview on page load
document.addEventListener('DOMContentLoaded', function() {
    initImagePreview();
    
    // Add form submission handlers
    const addProductForm = document.getElementById('addProductForm');
    if (addProductForm) {
        addProductForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addProduct();
        });
    }
    
    const editProductForm = document.getElementById('editProductForm');
    if (editProductForm) {
        editProductForm.addEventListener('submit', function(e) {
            e.preventDefault();
            updateProduct();
        });
    }
});