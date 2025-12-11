// Smart Career Advisor - Main JavaScript
// API Base URL - use relative paths for same-origin requests
// In production, Render backend and Vercel frontend will handle CORS properly
const API_BASE = 'https://sca-backend-n7ic.onrender.com';

// ===== SESSION CHECK =====
async function checkSession() {
    try {
        const res = await fetch(`${API_BASE}/api/session`, {
            credentials: 'include'
        });
        if (!res.ok) {
            throw new Error('Session check failed');
        }
        const data = await res.json();
        return data.authenticated || false;
    } catch (err) {
        console.error('Session check error:', err);
        return false;
    }
}

// Store authentication state
let isAuthenticated = false;

// ===== API HELPER FUNCTION =====
async function apiFetch(url, options = {}) {
    // Add default AJAX headers
    const headers = {
        'X-Requested-With': 'XMLHttpRequest',
        ...options.headers
    };

    const res = await fetch(url, {
        credentials: 'include',
        ...options,
        headers
    });

    if (!res.ok) {
        const text = await res.text();
        try {
            const errorData = JSON.parse(text);
            throw new Error(errorData.error || text || `Status ${res.status}`);
        } catch (e) {
            throw new Error(text || `Status ${res.status}`);
        }
    }

    return res.json();
}

// ===== THEME MANAGEMENT =====
function initTheme() {
    const savedTheme = localStorage.getItem('sca-theme') || 'light';
    setTheme(savedTheme);
    updateThemeRadios(savedTheme);

    document.querySelectorAll('input[name="theme"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            setTheme(e.target.value);
            localStorage.setItem('sca-theme', e.target.value);
        });
    });

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (localStorage.getItem('sca-theme') === 'system') {
            setTheme('system');
        }
    });
}

function setTheme(theme) {
    const body = document.body;
    const isDark = theme === 'dark' ||
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
        body.classList.add('dark-mode');
    } else {
        body.classList.remove('dark-mode');
    }
}

function updateThemeRadios(theme) {
    document.querySelectorAll('input[name="theme"]').forEach(radio => {
        radio.checked = radio.value === theme;
    });
}

// ===== HEADER & NAVIGATION =====
async function handleDashboardClick(event) {
    event.preventDefault();

    // Check session with backend API
    try {
        const res = await fetch(`${API_BASE}/api/session`, {
            method: 'GET',
            credentials: 'include',
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });

        if (!res.ok) {
            // Not authenticated - open login modal and store redirect
            window.__postLoginRedirect = 'dashboard.html';
            openLoginModal();
            return;
        }

        const data = await res.json();
        if (data && data.authenticated) {
            // User authenticated - navigate to dashboard
            window.location.href = 'dashboard.html';
        } else {
            // Not authenticated - open login modal and store redirect
            window.__postLoginRedirect = 'dashboard.html';
            openLoginModal();
        }
    } catch (err) {
        // Network or other error - open login modal (do not navigate)
        console.error('Session check failed:', err);
        window.__postLoginRedirect = 'dashboard.html';
        openLoginModal();
    }
}

function openLoginModal() {
    const modal = document.getElementById('loginModal');
    const modalContent = modal.querySelector('.modal-content');
    const existingMsg = modalContent.querySelector('.dashboard-message');

    if (existingMsg) {
        existingMsg.remove();
    }

    const message = document.createElement('p');
    message.className = 'dashboard-message';
    message.textContent = 'Please login to access Dashboard';
    message.style.cssText = 'color: var(--current-text-muted); text-align: center; margin-bottom: 1rem;';
    modalContent.querySelector('h2').insertAdjacentElement('afterend', message);

    modal.style.display = 'flex';
}

// ===== HAMBURGER MENU =====
function setupHamburgerMenu() {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const navMobile = document.getElementById('navMobile');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

    if (!hamburgerBtn) return;

    // Toggle mobile nav on hamburger click
    hamburgerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isExpanded = hamburgerBtn.getAttribute('aria-expanded') === 'true';
        hamburgerBtn.setAttribute('aria-expanded', !isExpanded);
        navMobile.classList.toggle('active');
    });

    // Close menu when a link is clicked
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburgerBtn.setAttribute('aria-expanded', 'false');
            navMobile.classList.remove('active');
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!hamburgerBtn.contains(e.target) && !navMobile.contains(e.target)) {
            hamburgerBtn.setAttribute('aria-expanded', 'false');
            navMobile.classList.remove('active');
        }
    });

    // Close menu on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hamburgerBtn.setAttribute('aria-expanded', 'false');
            navMobile.classList.remove('active');
        }
    });
}

// ===== MODAL MANAGEMENT =====
function setupModals() {
    // Search modal
    const searchBtn = document.getElementById('searchBtn');
    const searchModal = document.getElementById('searchModal');
    const searchOverlay = document.getElementById('searchOverlay');
    const searchClose = document.getElementById('searchClose');

    searchBtn?.addEventListener('click', () => {
        searchModal.style.display = 'flex';
        document.getElementById('searchInput')?.focus();
    });

    [searchOverlay, searchClose].forEach(el => {
        el?.addEventListener('click', () => {
            searchModal.style.display = 'none';
        });
    });

    // Search suggestions
    document.querySelectorAll('.suggestion-chip')?.forEach(chip => {
        chip.addEventListener('click', () => {
            const query = chip.dataset.query;
            document.getElementById('searchInput').value = query;
            console.log('Search:', query);
            searchModal.style.display = 'none';
        });
    });

    document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            console.log('Search:', e.target.value);
            searchModal.style.display = 'none';
        }
    });

    // Handle ESC key for search modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && searchModal.style.display === 'flex') {
            searchModal.style.display = 'none';
        }
    });

    // Settings popup with overlay
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsPopover = document.getElementById('settingsPopover');
    const settingsOverlay = document.getElementById('settingsOverlay');

    settingsBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        const displayed = settingsPopover.style.display !== 'none';
        settingsPopover.style.display = displayed ? 'none' : 'flex';
        settingsOverlay.style.display = displayed ? 'none' : 'block';
    });

    [settingsOverlay].forEach(el => {
        el?.addEventListener('click', () => {
            settingsPopover.style.display = 'none';
            settingsOverlay.style.display = 'none';
        });
    });

    document.addEventListener('click', (e) => {
        if (!settingsPopover?.contains(e.target) && e.target !== settingsBtn && !e.target.closest('.settings-btn')) {
            settingsPopover.style.display = 'none';
            settingsOverlay.style.display = 'none';
        }
    });

    // Login/Signup modals
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const loginModal = document.getElementById('loginModal');
    const signupModal = document.getElementById('signupModal');

    loginBtn?.addEventListener('click', () => {
        settingsPopover.style.display = 'none';
        settingsOverlay.style.display = 'none';
        loginModal.style.display = 'flex';
    });

    signupBtn?.addEventListener('click', () => {
        settingsPopover.style.display = 'none';
        settingsOverlay.style.display = 'none';
        signupModal.style.display = 'flex';
    });

    // Login to Signup link
    const loginToSignupLink = document.getElementById('loginToSignupLink');
    loginToSignupLink?.addEventListener('click', () => {
        loginModal.style.display = 'none';
        signupModal.style.display = 'flex';
    });

    // Profile card button in settings - navigate to dashboard
    const profileCardBtn = document.getElementById('profileCardBtn');
    profileCardBtn?.addEventListener('click', () => {
        window.location.href = '/dashboard';
    });

    // Close auth modals
    document.querySelectorAll('.auth-close').forEach(btn => {
        btn.addEventListener('click', () => {
            loginModal.style.display = 'none';
            signupModal.style.display = 'none';
        });
    });

    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                e.target.parentElement.style.display = 'none';
            }
        });
    });
}

// ===== USER DATA & GREETING =====
function updateUserGreeting() {
    const greetingText = document.getElementById('greetingText');
    if (greetingText) {
        const settingsUsername = document.getElementById('settingsUsername');
        if (settingsUsername && settingsUsername.textContent.trim()) {
            greetingText.textContent = `Hello, ${settingsUsername.textContent}`;
        }
    }
}

// ===== AVATAR PLACEHOLDER GENERATOR =====
function getAvatarPlaceholder(username) {
    const firstLetter = username ? username.charAt(0).toUpperCase() : '?';
    return firstLetter;
}

function getAvatarColor(username) {
    // Generate a consistent color based on username
    const colors = [
        '#3B82F6', '#8B5CF6', '#EC4899', '#F97316', '#06B6D4',
        '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#14B8A6'
    ];
    if (!username) return colors[0];
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

function createAvatarPlaceholder(container, username) {
    // Remove existing placeholder if any
    const existing = container.querySelector('.avatar-placeholder');
    if (existing) existing.remove();

    const placeholder = document.createElement('div');
    placeholder.className = 'avatar-placeholder';
    placeholder.textContent = getAvatarPlaceholder(username);
    placeholder.style.backgroundColor = getAvatarColor(username);
    placeholder.style.color = 'white';
    placeholder.style.display = 'flex';
    placeholder.style.alignItems = 'center';
    placeholder.style.justifyContent = 'center';
    placeholder.style.fontSize = '24px';
    placeholder.style.fontWeight = '600';
    placeholder.style.borderRadius = '50%';
    placeholder.style.width = '50px';
    placeholder.style.height = '50px';
    container.appendChild(placeholder);
    return placeholder;
}

// ===== SUCCESS/ERROR POPUPS =====
function showSuccessPopup(message, onClose = null) {
    const popup = document.createElement('div');
    popup.className = 'success-popup';
    popup.innerHTML = `
        <div class="popup-content">
            <div class="popup-icon">✓</div>
            <h3>${message}</h3>
        </div>
    `;
    document.body.appendChild(popup);

    setTimeout(() => {
        popup.classList.add('show');
    }, 10);

    setTimeout(() => {
        popup.classList.remove('show');
        setTimeout(() => popup.remove(), 300);
        if (onClose) onClose();
    }, 1500);
}

function showErrorPopup(message) {
    const popup = document.createElement('div');
    popup.className = 'error-popup';
    popup.innerHTML = `
        <div class="popup-content">
            <div class="popup-icon">✕</div>
            <h3>${message}</h3>
        </div>
    `;
    document.body.appendChild(popup);

    setTimeout(() => {
        popup.classList.add('show');
    }, 10);

    setTimeout(() => {
        popup.classList.remove('show');
        setTimeout(() => popup.remove(), 300);
    }, 2500);
}

// ===== FORM VALIDATION & SUBMISSION =====
function setupFormValidation() {
    const signupForm = document.getElementById('signupForm');
    const loginForm = document.getElementById('loginForm');

    signupForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        if (validateSignupForm()) {
            submitSignupForm(signupForm);
        }
    });

    loginForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        if (validateLoginForm()) {
            submitLoginForm(loginForm);
        }
    });
}

function submitSignupForm(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    fetch(`${API_BASE}/signup`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(data),
        credentials: 'include'
    })
    .then(res => {
        if (!res.ok) {
            // Non-2xx status code - try to parse error response
            return res.text().then(text => {
                try {
                    const errorData = JSON.parse(text);
                    throw new Error(errorData.error || `Server error: ${res.status}`);
                } catch (e) {
                    throw new Error(`Server error: ${res.status}`);
                }
            });
        }
        return res.json();
    })
    .then(data => {
        if (data.success) {
            showSuccessPopup('Account created! Redirecting to dashboard...', () => {
                window.location.href = data.redirect || 'dashboard.html';
            });
        } else {
            showErrorPopup(data.error || 'Signup failed. Please try again.');
        }
    })
    .catch(err => {
        console.error('Signup error:', err);
        showErrorPopup(err.message || 'An error occurred. Please try again.');
    });
}

function submitLoginForm(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(data),
        credentials: 'include'
    })
    .then(res => {
        if (!res.ok) {
            // Non-2xx status code - try to parse error response
            return res.text().then(text => {
                try {
                    const errorData = JSON.parse(text);
                    throw new Error(errorData.error || `Server error: ${res.status}`);
                } catch (e) {
                    throw new Error(`Server error: ${res.status}`);
                }
            });
        }
        return res.json();
    })
    .then(data => {
        if (data.success) {
            // Close login modal
            const loginModal = document.getElementById('loginModal');
            loginModal.style.display = 'none';

            // Determine redirect URL
            const redirectTo = window.__postLoginRedirect || 'dashboard.html';

            // Clear the stored redirect
            window.__postLoginRedirect = null;

            showSuccessPopup('Login successful! Redirecting...', () => {
                window.location.href = redirectTo;
            });
        } else {
            showErrorPopup(data.error || 'Login failed. Invalid credentials.');
        }
    })
    .catch(err => {
        console.error('Login error:', err);
        showErrorPopup(err.message || 'An error occurred. Please try again.');
    });
}

function validateSignupForm() {
    const username = document.getElementById('signupUsername');
    const email = document.getElementById('signupEmail');
    const password = document.getElementById('signupPassword');
    const confirm = document.getElementById('signupConfirm');
    const tc = document.getElementById('tcCheckbox');

    let isValid = true;

    if (!username.value.trim()) {
        showError(username, 'Username required');
        isValid = false;
    } else {
        clearError(username);
    }

    if (!email.value.includes('@')) {
        showError(email, 'Valid email required');
        isValid = false;
    } else {
        clearError(email);
    }

    if (password.value.length < 6) {
        showError(password, 'Password must be at least 6 characters');
        isValid = false;
    } else {
        clearError(password);
    }

    if (password.value !== confirm.value) {
        showError(confirm, 'Passwords must match');
        isValid = false;
    } else {
        clearError(confirm);
    }

    if (!tc.checked) {
        showError(tc, 'Must accept terms');
        isValid = false;
    } else {
        clearError(tc);
    }

    return isValid;
}

function validateLoginForm() {
    const email = document.getElementById('loginEmail');
    const password = document.getElementById('loginPassword');

    let isValid = true;

    if (!email.value.includes('@')) {
        showError(email, 'Valid email required');
        isValid = false;
    } else {
        clearError(email);
    }

    if (password.value.length < 6) {
        showError(password, 'Password required');
        isValid = false;
    } else {
        clearError(password);
    }

    return isValid;
}

function showError(element, message) {
    const errorMsg = element.closest('.form-group').querySelector('.error-msg');
    if (errorMsg) {
        errorMsg.textContent = message;
        errorMsg.style.display = 'block';
    }
}

function clearError(element) {
    const errorMsg = element.closest('.form-group').querySelector('.error-msg');
    if (errorMsg) {
        errorMsg.textContent = '';
        errorMsg.style.display = 'none';
    }
}

// ===== LOGOUT =====
function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (!logoutBtn) return;

    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        fetch(`${API_BASE}/logout`, {
            method: 'POST',
            credentials: 'include'
        })
            .then(res => {
                if (!res.ok) throw new Error(`Logout failed: ${res.status}`);
                return res.json();
            })
            .then(data => {
                if (data.success) {
                    showSuccessPopup('Logged out successfully. Redirecting...', () => {
                        window.location.href = '/';
                    });
                } else {
                    showErrorPopup(data.error || 'Logout failed');
                }
            })
            .catch(err => {
                console.error('Logout error:', err);
                // Force redirect even on error
                window.location.href = '/';
            });
    });
}

// ===== NOTIFICATIONS =====
function setupNotifications() {
    const notifBell = document.getElementById('notifBell');
    const notifDropdown = document.getElementById('notifDropdown');

    if (!notifBell || !notifDropdown) return;

    // Toggle dropdown on bell click
    notifBell.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isVisible = notifDropdown.style.display !== 'none';
        notifDropdown.style.display = isVisible ? 'none' : 'block';
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!notifBell.contains(e.target) && !notifDropdown.contains(e.target)) {
            notifDropdown.style.display = 'none';
        }
    });

    // Close dropdown on ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            notifDropdown.style.display = 'none';
        }
    });
}

// ===== AI ASSISTANT =====
function setupAIAssistant() {
    const aiButton = document.getElementById('aiButton');
    const aiPanel = document.getElementById('aiPanel');
    const aiClose = document.getElementById('aiClose');
    const aiSend = document.getElementById('aiSend');
    const aiInput = document.getElementById('aiInput');
    const aiMessages = document.getElementById('aiMessages');

    aiButton?.addEventListener('click', () => {
        aiPanel.style.display = aiPanel.style.display === 'none' ? 'block' : 'none';
    });

    aiClose?.addEventListener('click', () => {
        aiPanel.style.display = 'none';
    });

    const sendMessage = () => {
        const message = aiInput.value.trim();
        if (message) {
            // Add user message
            const userMsg = document.createElement('div');
            userMsg.className = 'ai-message user';
            userMsg.textContent = message;
            aiMessages.appendChild(userMsg);
            aiInput.value = '';

            // Simulate AI response
            setTimeout(() => {
                const aiMsg = document.createElement('div');
                aiMsg.className = 'ai-message ai';
                aiMsg.textContent = 'Thanks for your question! I\'m here to help with career guidance. Ask me anything about your career path!';
                aiMessages.appendChild(aiMsg);
                aiMessages.scrollTop = aiMessages.scrollHeight;
            }, 500);

            aiMessages.scrollTop = aiMessages.scrollHeight;
        }
    };

    aiSend?.addEventListener('click', sendMessage);
    aiInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

// ===== API HELPERS =====
async function fetchAPI(url, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${url}`, {
            headers: { 'Content-Type': 'application/json', ...options.headers },
            ...options
        });
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        return { error: error.message };
    }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', async () => {
    // Check session first
    isAuthenticated = await checkSession();

    initTheme();
    setupModals();
    setupFormValidation();
    setupAIAssistant();
    setupHamburgerMenu();
    setupLogout();
    setupNotifications();
    updateUserGreeting();

    // Load user data in settings
    if (document.getElementById('settingsEmail') && isAuthenticated) {
        fetch(`${API_BASE}/api/profile`, {
            credentials: 'include'
        })
            .then(async r => {
                // Check response status
                if (!r.ok) {
                    // User not logged in or error - silently skip
                    const text = await r.text();
                    throw new Error(text || `Status ${r.status}`);
                }
                return r.json();
            })
            .then(data => {
                // Update username
                const usernameEl = document.getElementById('settingsUsername');
                if (usernameEl && data.username) {
                    usernameEl.textContent = data.username;
                    updateUserGreeting();
                }

                // Update email
                const emailEl = document.getElementById('settingsEmail');
                if (emailEl && data.email) {
                    emailEl.textContent = data.email;
                }

                // Update avatar
                const avatarContainer = document.getElementById('settingsAvatarContainer');
                const settingsAvatar = document.getElementById('settingsAvatar');

                if (data.avatar_filename) {
                    settingsAvatar.src = `${API_BASE}/static/uploads/avatars/${data.avatar_filename}`;
                    settingsAvatar.style.display = 'block';
                    // Remove placeholder if exists
                    const placeholder = avatarContainer.querySelector('.avatar-placeholder');
                    if (placeholder) placeholder.remove();
                } else if (data.username) {
                    // Show first-letter placeholder
                    settingsAvatar.style.display = 'none';
                    createAvatarPlaceholder(avatarContainer, data.username);
                }
            })
            .catch(err => console.log('Profile fetch skipped (likely not logged in)'));
    }

    // Add keyboard accessibility
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.getElementById('searchModal').style.display = 'none';
            document.getElementById('loginModal').style.display = 'none';
            document.getElementById('signupModal').style.display = 'none';
            document.getElementById('settingsPopover').style.display = 'none';
            document.getElementById('settingsOverlay').style.display = 'none';
        }
    });
});
