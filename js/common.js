/**
 * Common utility functions for the E-Commerce application
 */

const API_BASE_URL = 'http://localhost:8081';

// Show notification/toast
function showNotification(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1050;
        min-width: 300px;
    `;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Check authentication
function checkAuth() {
    const currentUser = localStorage.getItem('currentUser');
    const currentPath = window.location.pathname;
    
    // Pages that don't require authentication
    const publicPages = ['/login.html', '/signup.html'];
    
    if (!currentUser && !publicPages.some(page => currentPath.endsWith(page))) {
        window.location.href = 'login.html';
        return null;
    }
    
    if (currentUser) {
        const user = JSON.parse(currentUser);
        const userElement = document.getElementById('loggedInUser');
        if (userElement) {
            userElement.textContent = user.name || user.email;
        }
    }
    
    return currentUser ? JSON.parse(currentUser) : null;
}

// Logout function
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// Get status badge color
function getStatusColor(status) {
    switch(status?.toUpperCase()) {
        case 'DELIVERED': return 'success';
        case 'DELIVERING': return 'warning';
        case 'PROCESSING': return 'secondary';
        default: return 'info';
    }
}

// Get status text
function getStatusText(status) {
    switch(status?.toUpperCase()) {
        case 'DELIVERED': return 'Delivered';
        case 'DELIVERING': return 'Delivering';
        case 'PROCESSING': return 'Processing';
        default: return status || 'Processing';
    }
}

// Debounce function for search inputs
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Loading spinner
function showLoading(element) {
    if (!element) return;
    element.innerHTML = `
        <div class="spinner-container">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    `;
}

// Error handler
function handleError(error, context = 'operation') {
    console.error(`Error during ${context}:`, error);
    showNotification(`Failed to ${context}. Please try again.`, 'danger');
}

// Confirm dialog
async function confirmAction(message) {
    return new Promise((resolve) => {
        // Create modal for confirmation
        const modalId = 'confirmModal';
        let modal = document.getElementById(modalId);
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'modal fade';
            modal.innerHTML = `
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Confirm Action</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p id="confirmMessage">${message}</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="confirmButton">Confirm</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        const confirmModal = new bootstrap.Modal(modal);
        document.getElementById('confirmMessage').textContent = message;
        
        modal.querySelector('#confirmButton').onclick = () => {
            confirmModal.hide();
            resolve(true);
        };
        
        modal.addEventListener('hidden.bs.modal', () => {
            resolve(false);
        });
        
        confirmModal.show();
    });
}

// API request helper
async function apiRequest(endpoint, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };
    
    const finalOptions = { ...defaultOptions, ...options };
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, finalOptions);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `HTTP ${response.status}`);
        }
        
        // Check if response has content
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }
        
        return await response.text();
    } catch (error) {
        console.error('API Request failed:', error);
        throw error;
    }

}

