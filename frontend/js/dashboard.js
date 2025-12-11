// Smart Career Advisor - Dashboard JavaScript
// Handles profile management, avatar upload, and resume handling on the dashboard

document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile();
    setupAvatarUpload();
    setupResumeUpload();
    setupEditProfileModal();
});

// ===== PROFILE LOADING =====
function loadUserProfile() {
    fetch(`${API_BASE}/api/profile`, {
        credentials: 'include'
    })
        .then(r => {
            if (!r.ok) throw new Error(`Status ${r.status}`);
            return r.json();
        })
        .then(data => {
            // Update welcome message
            const welcomeEl = document.querySelector('.profile-welcome-text');
            if (welcomeEl) {
                welcomeEl.textContent = `Welcome, @${data.username}`;
            }

            // Update profile fields
            document.getElementById('fullName').value = data.full_name || '';
            document.getElementById('initials').value = data.initials || '';
            document.getElementById('phone').value = data.phone || '';
            document.getElementById('dob').value = data.dob || '';

            // Update profile display
            updateProfileDisplay(data);

            // Handle avatar
            const profileAvatar = document.getElementById('profileAvatar');
            const avatarPlaceholder = document.getElementById('avatarPlaceholder');

            if (data.avatar_filename) {
                profileAvatar.src = `${API_BASE}/static/uploads/avatars/${data.avatar_filename}`;
                profileAvatar.style.display = 'block';
                if (avatarPlaceholder) avatarPlaceholder.style.display = 'none';
            } else {
                profileAvatar.style.display = 'none';
                if (avatarPlaceholder) {
                    createAvatarPlaceholder(document.getElementById('avatarPlaceholder'), data.username);
                    avatarPlaceholder.style.display = 'flex';
                }
            }

            // Update skills
            if (data.skills && Array.isArray(data.skills)) {
                document.getElementById('skills').value = data.skills.join(', ');
            }
        })
        .catch(err => {
            console.error('Failed to load profile:', err);
            // Show error message
            const welcomeEl = document.querySelector('.profile-welcome-text');
            if (welcomeEl) {
                welcomeEl.textContent = 'Failed to load profile. Please refresh.';
            }
        });
}

function updateProfileDisplay(data) {
    // Update username in settings header
    const settingsUsername = document.getElementById('settingsUsername');
    if (settingsUsername) {
        settingsUsername.textContent = data.username;
    }

    // Update email
    const settingsEmail = document.getElementById('settingsEmail');
    if (settingsEmail) {
        settingsEmail.textContent = data.email;
    }

    // Update dashboard username
    const dashboardUsername = document.getElementById('dashboardUsername');
    if (dashboardUsername) {
        dashboardUsername.textContent = data.username;
    }

    // Update email on dashboard profile
    const userEmail = document.getElementById('userEmail');
    if (userEmail) {
        userEmail.textContent = data.email || 'Not available';
    }

    // Update name + initial
    let nameInitialText = '-';
    if (data.full_name || data.initials) {
        nameInitialText = `${data.full_name || ''} ${data.initials || ''}`.trim() || '-';
    }
    const userNameInitial = document.getElementById('userNameInitial');
    if (userNameInitial) {
        userNameInitial.textContent = nameInitialText;
    }

    // Update phone
    const userPhone = document.getElementById('userPhone');
    if (userPhone) {
        userPhone.textContent = data.phone || '-';
    }

    // Calculate and display age if DOB is set
    let dobText = '-';
    if (data.dob) {
        const age = calculateAge(data.dob);
        dobText = `${data.dob} (${age} years)`;
    }
    const userDOB = document.getElementById('userDOB');
    if (userDOB) {
        userDOB.textContent = dobText;
    }

    // Display skills as chips
    if (data.skills && Array.isArray(data.skills) && data.skills.length > 0) {
        const userSkills = document.getElementById('userSkills');
        if (userSkills) {
            userSkills.innerHTML = data.skills
                .slice(0, 5)
                .map(skill => `<span class="skill-chip">${skill}</span>`)
                .join('');
        }
    }
}

function calculateAge(dob) {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

// ===== AVATAR UPLOAD =====
function setupAvatarUpload() {
    const avatarInput = document.getElementById('avatarInput');
    if (!avatarInput) return;

    avatarInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            showErrorPopup('Only JPG, PNG, and WebP images are allowed');
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            showErrorPopup('Image must be smaller than 5MB');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        fetch(`${API_BASE}/api/avatar`, {
            method: 'POST',
            body: formData,
            credentials: 'include'
        })
            .then(r => {
                if (!r.ok) {
                    throw new Error(`Upload failed with status ${r.status}`);
                }
                return r.json();
            })
            .then(data => {
                if (data.success) {
                    // Update avatar image
                    const profileAvatar = document.getElementById('profileAvatar');
                    profileAvatar.src = data.url;
                    profileAvatar.style.display = 'block';

                    // Hide placeholder
                    const avatarPlaceholder = document.getElementById('avatarPlaceholder');
                    if (avatarPlaceholder) {
                        avatarPlaceholder.style.display = 'none';
                    }

                    showSuccessPopup('Avatar updated successfully');

                    // Reset input
                    avatarInput.value = '';
                } else {
                    showErrorPopup(data.error || 'Avatar upload failed');
                }
            })
            .catch(err => {
                console.error('Avatar upload error:', err);
                showErrorPopup('Failed to upload avatar. Please try again.');
            });
    });
}

// ===== RESUME UPLOAD =====
function setupResumeUpload() {
    const resumeInput = document.getElementById('resumeInput');
    if (!resumeInput) return;

    resumeInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['application/pdf', 'text/plain'];
        const extension = file.name.split('.').pop().toLowerCase();
        if (!['pdf', 'txt'].includes(extension)) {
            showErrorPopup('Only PDF and TXT files are allowed');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        fetch(`${API_BASE}/api/upload-resume`, {
            method: 'POST',
            body: formData,
            credentials: 'include'
        })
            .then(r => {
                if (!r.ok) {
                    throw new Error(`Upload failed with status ${r.status}`);
                }
                return r.json();
            })
            .then(data => {
                if (data.success) {
                    displayResumePreview(data);
                    showSuccessPopup(data.message || 'Resume uploaded successfully');

                    // Reset input
                    resumeInput.value = '';
                } else {
                    showErrorPopup(data.error || 'Resume upload failed');
                }
            })
            .catch(err => {
                console.error('Resume upload error:', err);
                showErrorPopup('Failed to upload resume. Please try again.');
            });
    });
}

function displayResumePreview(data) {
    const resumeResult = document.getElementById('resumeResult');
    const resumePreview = document.getElementById('resumePreview');

    if (!resumeResult || !resumePreview) return;

    // Show preview text if available
    const previewText = data.preview_text || 'No text could be extracted from the file.';
    const textPreviewBox = resumePreview.querySelector('.text-preview-box');

    if (textPreviewBox) {
        textPreviewBox.innerHTML = `
            <p class="preview-text">${previewText.substring(0, 300).replace(/</g, '&lt;').replace(/>/g, '&gt;')}...</p>
            <a href="${data.file_url}" target="_blank" class="preview-link">View Full File →</a>
        `;
    }

    // Update extracted skills
    if (data.skills && Array.isArray(data.skills)) {
        const skillsContainer = resumePreview.querySelector('.extracted-skills');
        if (skillsContainer) {
            skillsContainer.innerHTML = data.skills
                .map(skill => `<span class="skill-tag">${skill}</span>`)
                .join('');
        }

        // Update resume count
        const resumeCount = document.getElementById('resumeCount');
        if (resumeCount) {
            resumeCount.textContent = data.skills.length;
        }
    }

    // Show resume result section
    resumeResult.style.display = 'block';
}

// ===== EDIT PROFILE MODAL =====
function setupEditProfileModal() {
    const editProfileBtn = document.getElementById('editProfileBtn');
    const profileModal = document.getElementById('editProfileModal');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const editProfileForm = document.querySelector('#editProfileModal form');

    if (!editProfileBtn || !profileModal) return;

    // Open modal
    editProfileBtn?.addEventListener('click', () => {
        profileModal.style.display = 'flex';
    });

    // Close modal
    cancelEditBtn?.addEventListener('click', () => {
        profileModal.style.display = 'none';
    });

    // Close on overlay click
    profileModal.addEventListener('click', (e) => {
        if (e.target === profileModal) {
            profileModal.style.display = 'none';
        }
    });

    // Save profile
    editProfileForm?.addEventListener('submit', (e) => {
        e.preventDefault();

        // Parse skills
        const skillsInput = document.getElementById('skills').value;
        const skills = skillsInput
            .split(',')
            .map(s => s.trim())
            .filter(s => s)
            .slice(0, 5);

        const profileData = {
            full_name: document.getElementById('fullName').value,
            initials: document.getElementById('initials').value,
            phone: document.getElementById('phone').value,
            dob: document.getElementById('dob').value,
            skills: skills
        };

        fetch(`${API_BASE}/api/profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profileData),
            credentials: 'include'
        })
            .then(r => {
                if (!r.ok) throw new Error(`Failed to save profile`);
                return r.json();
            })
            .then(data => {
                showSuccessPopup('Profile updated successfully');
                profileModal.style.display = 'none';
                loadUserProfile(); // Refresh profile data
            })
            .catch(err => {
                console.error('Profile save error:', err);
                showErrorPopup('Failed to update profile. Please try again.');
            });
    });
}

// Helper function to create avatar placeholder (from main.js)
function createAvatarPlaceholder(container, username) {
    if (!container) return;

    const firstLetter = username ? username.charAt(0).toUpperCase() : '?';
    const colors = [
        '#3B82F6', '#8B5CF6', '#EC4899', '#F97316', '#06B6D4',
        '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#14B8A6'
    ];

    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const bgColor = colors[Math.abs(hash) % colors.length];

    container.textContent = firstLetter;
    container.style.backgroundColor = bgColor;
    container.style.color = 'white';
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.fontSize = '24px';
    container.style.fontWeight = '600';
    container.style.borderRadius = '50%';
    container.style.width = '80px';
    container.style.height = '80px';
}
