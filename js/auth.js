/**
 * Authentication functions
 */

// Check if user is logged in
function isLoggedIn() {
    return localStorage.getItem('currentUser') !== null;
}

// Get current user
function getCurrentUser() {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
}

// Login function
async function login(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
        });
        
        if (response.ok) {
            const customer = await response.json();
            localStorage.setItem('currentUser', JSON.stringify(customer));
            showNotification('Login successful!', 'success');
            return customer;
        } else {
            const error = await response.text();
            throw new Error(error || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

// Signup function
async function signup(customerData) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(customerData)
        });
        
        if (response.ok) {
            const customer = await response.json();
            showNotification('Account created successfully!', 'success');
            return customer;
        } else {
            const error = await response.text();
            throw new Error(error || 'Signup failed');
        }
    } catch (error) {
        console.error('Signup error:', error);
        throw error;
    }
}

// Update user profile
async function updateProfile(customerData) {
    try {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            throw new Error('No user logged in');
        }
        
        const response = await fetch(`${API_BASE_URL}/customer/update-customer`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ...customerData, id: currentUser.id })
        });
        
        if (response.ok) {
            const updatedCustomer = await response.json();
            localStorage.setItem('currentUser', JSON.stringify(updatedCustomer));
            showNotification('Profile updated successfully!', 'success');
            return updatedCustomer;
        } else {
            const error = await response.text();
            throw new Error(error || 'Update failed');
        }
    } catch (error) {
        console.error('Update profile error:', error);
        throw error;
    }
}

// Change password
async function changePassword(currentPassword, newPassword) {
    try {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            throw new Error('No user logged in');
        }
        
        // First verify current password by logging in
        await login(currentUser.email, currentPassword);
        
        // Then update password
        const response = await fetch(`${API_BASE_URL}/customer/update-customer`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: currentUser.id,
                email: currentUser.email,
                name: currentUser.name,
                password: newPassword,
                address: currentUser.address
            })
        });
        
        if (response.ok) {
            showNotification('Password changed successfully!', 'success');
            return true;
        } else {
            const error = await response.text();
            throw new Error(error || 'Password change failed');
        }
    } catch (error) {
        console.error('Change password error:', error);
        throw error;
    }
}

// Auto-login on page load for protected pages
document.addEventListener('DOMContentLoaded', function() {
    // Check auth for all pages except login/signup
    if (!window.location.pathname.endsWith('login.html') && 
        !window.location.pathname.endsWith('signup.html')) {
        checkAuth();
    }
    
    // Add logout functionality to all logout buttons
    document.querySelectorAll('[onclick*="logout"]').forEach(button => {
        button.onclick = logout;
    });
});