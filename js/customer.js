/**
 * Customer management functions
 */

let allCustomers = [];

// Load all customers
async function loadCustomers() {
    try {
        showLoading(document.querySelector('#customerTable tbody'));
        
        const customers = await apiRequest('/customer/getAll');
        allCustomers = customers;
        renderCustomers(customers);
    } catch (error) {
        handleError(error, 'load customers');
        document.querySelector('#customerTable tbody').innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-danger">
                    Failed to load customers. Please try again.
                </td>
            </tr>
        `;
    }
}

// Render customers to table
function renderCustomers(customers) {
    const tableBody = document.querySelector('#customerTable tbody');
    tableBody.innerHTML = '';
    
    if (!customers || customers.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted">
                    No customers found
                </td>
            </tr>
        `;
        return;
    }
    
    customers.forEach(customer => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${customer.id}</td>
            <td>${customer.name || 'N/A'}</td>
            <td>${customer.email || 'N/A'}</td>
            <td>${customer.address || 'N/A'}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editCustomer(${customer.id})">
                    <i class="bi bi-pencil"></i> Edit
                </button>
                <button class="btn btn-sm btn-outline-danger ms-2" onclick="deleteCustomerPrompt(${customer.id})">
                    <i class="bi bi-trash"></i> Delete
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Add new customer
async function addCustomer() {
    try {
        const customer = {
            name: document.getElementById('customerName').value,
            email: document.getElementById('customerEmail').value,
            password: document.getElementById('customerPassword').value,
            address: document.getElementById('customerAddress').value
        };
        
        if (!customer.name || !customer.email || !customer.password) {
            showNotification('Please fill in all required fields', 'warning');
            return;
        }
        
        const response = await apiRequest('/customer/add-customer', {
            method: 'POST',
            body: JSON.stringify(customer)
        });
        
        // Refresh customer list
        await loadCustomers();
        
        // Reset form and close modal
        document.getElementById('addCustomerForm').reset();
        bootstrap.Modal.getInstance(document.getElementById('addCustomerModal')).hide();
        
        showNotification('Customer added successfully!', 'success');
    } catch (error) {
        handleError(error, 'add customer');
    }
}

// Edit customer - load data into modal
async function editCustomer(customerId) {
    try {
        const customer = await apiRequest(`/customer/searchById/${customerId}`);
        
        if (customer) {
            document.getElementById('editCustomerId').value = customer.id;
            document.getElementById('editCustomerName').value = customer.name || '';
            document.getElementById('editCustomerEmail').value = customer.email || '';
            document.getElementById('editCustomerAddress').value = customer.address || '';
            document.getElementById('editCustomerPassword').value = '';
            
            const modal = new bootstrap.Modal(document.getElementById('editCustomerModal'));
            modal.show();
        }
    } catch (error) {
        handleError(error, 'load customer for editing');
    }
}

// Update customer
async function updateCustomer() {
    try {
        const customerId = document.getElementById('editCustomerId').value;
        const customer = {
            id: parseInt(customerId),
            name: document.getElementById('editCustomerName').value,
            email: document.getElementById('editCustomerEmail').value,
            address: document.getElementById('editCustomerAddress').value
        };
        
        // Only include password if provided
        const password = document.getElementById('editCustomerPassword').value;
        if (password) {
            customer.password = password;
        }
        
        if (!customer.name || !customer.email) {
            showNotification('Please fill in all required fields', 'warning');
            return;
        }
        
        await apiRequest('/customer/update-customer', {
            method: 'PUT',
            body: JSON.stringify(customer)
        });
        
        // Refresh customer list
        await loadCustomers();
        
        // Close modal
        bootstrap.Modal.getInstance(document.getElementById('editCustomerModal')).hide();
        
        showNotification('Customer updated successfully!', 'success');
    } catch (error) {
        handleError(error, 'update customer');
    }
}

// Delete customer with confirmation
async function deleteCustomerPrompt(customerId) {
    const confirmed = await confirmAction('Are you sure you want to delete this customer?');
    
    if (confirmed) {
        await deleteCustomer(customerId);
    }
}

// Delete customer
async function deleteCustomer(customerId) {
    try {
        const response = await apiRequest(`/customer/delete/${customerId}`, {
            method: 'DELETE'
        });
        
        if (response) {
            // Refresh customer list
            await loadCustomers();
            showNotification('Customer deleted successfully!', 'success');
        }
    } catch (error) {
        handleError(error, 'delete customer');
    }
}

// Search customers
function searchCustomers(searchTerm) {
    if (!searchTerm) {
        renderCustomers(allCustomers);
        return;
    }
    
    const filtered = allCustomers.filter(customer =>
        customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.address?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    renderCustomers(filtered);
}

// Export customers to CSV
function exportCustomersToCSV() {
    if (!allCustomers.length) {
        showNotification('No customers to export', 'warning');
        return;
    }
    
    const headers = ['ID', 'Name', 'Email', 'Address'];
    const rows = allCustomers.map(customer => [
        customer.id,
        customer.name || '',
        customer.email || '',
        customer.address || ''
    ]);
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    showNotification('Customers exported to CSV', 'success');
}