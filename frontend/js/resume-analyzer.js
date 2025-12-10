// Smart Career Advisor - Resume Analyzer JavaScript
// Handles the 3-step resume analysis wizard: Upload → Extract → Predict

let currentStep = 1;
let uploadedFile = null;
let extractedSkills = [];
let resumeText = '';

document.addEventListener('DOMContentLoaded', () => {
    setupStepNavigation();
    setupResumeUpload();
});

// ===== STEP NAVIGATION =====
function setupStepNavigation() {
    // Get all step buttons
    const stepButtons = document.querySelectorAll('[data-tab]');
    stepButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const tabName = button.getAttribute('data-tab');
            goToTab(tabName);
        });
    });

    // Next/Previous buttons
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    const predictBtn = document.getElementById('predictBtn');

    nextBtn?.addEventListener('click', () => {
        if (currentStep < 3) {
            // Validate current step before proceeding
            if (validateStep(currentStep)) {
                goToTab(`step${currentStep + 1}`);
            }
        }
    });

    prevBtn?.addEventListener('click', () => {
        if (currentStep > 1) {
            goToTab(`step${currentStep - 1}`);
        }
    });

    predictBtn?.addEventListener('click', performPrediction);
}

function goToTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });

    // Deactivate all tab buttons
    document.querySelectorAll('[data-tab]').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.style.display = 'block';
        currentStep = parseInt(tabName.replace('step', ''));

        // Activate tab button
        document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');

        // Update button visibility based on step
        updateNavigationButtons();
    }
}

function updateNavigationButtons() {
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    const predictBtn = document.getElementById('predictBtn');

    // Show/hide previous button
    if (prevBtn) {
        prevBtn.style.display = currentStep > 1 ? 'block' : 'none';
    }

    // Show/hide next button
    if (nextBtn) {
        nextBtn.style.display = currentStep < 3 ? 'block' : 'none';
    }

    // Show/hide predict button
    if (predictBtn) {
        predictBtn.style.display = currentStep === 3 ? 'block' : 'none';
    }
}

function validateStep(step) {
    if (step === 1) {
        // Step 1: Must have uploaded a file
        if (!uploadedFile) {
            showErrorPopup('Please upload a resume file first');
            return false;
        }
        return true;
    }
    if (step === 2) {
        // Step 2: Must have extracted skills
        if (extractedSkills.length === 0) {
            showErrorPopup('Please ensure skills are extracted');
            return false;
        }
        return true;
    }
    return true;
}

// ===== STEP 1: FILE UPLOAD =====
function setupResumeUpload() {
    const uploadInput = document.getElementById('resumeUploadInput');
    const uploadBox = document.querySelector('.upload-area');

    if (!uploadInput) return;

    // Click to upload
    uploadBox?.addEventListener('click', () => {
        uploadInput.click();
    });

    // Drag and drop
    uploadBox?.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadBox.classList.add('drag-over');
    });

    uploadBox?.addEventListener('dragleave', () => {
        uploadBox.classList.remove('drag-over');
    });

    uploadBox?.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadBox.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            uploadInput.files = files;
            handleFileUpload(files[0]);
        }
    });

    // File input change
    uploadInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });
}

function handleFileUpload(file) {
    // Validate file type
    const allowedExtensions = ['pdf', 'txt'];
    const extension = file.name.split('.').pop().toLowerCase();

    if (!allowedExtensions.includes(extension)) {
        showErrorPopup('Only PDF and TXT files are allowed');
        return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
        showErrorPopup('File must be smaller than 5MB');
        return;
    }

    uploadedFile = file;
    const formData = new FormData();
    formData.append('file', file);

    // Show loading state
    const uploadStatus = document.getElementById('uploadStatus');
    if (uploadStatus) {
        uploadStatus.innerHTML = '<p style="color: var(--current-text-muted);">Uploading and analyzing...</p>';
    }

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
                extractedSkills = data.skills || [];
                resumeText = data.preview_text || '';

                // Update Step 1 display
                updateStep1Display(data);

                // Populate Step 2 with extracted skills
                populateStep2(data.skills);

                showSuccessPopup('Resume uploaded and analyzed successfully');

                // Auto-move to Step 2
                setTimeout(() => {
                    goToTab('step2');
                }, 500);
            } else {
                showErrorPopup(data.error || 'Failed to upload resume');
            }
        })
        .catch(err => {
            console.error('Upload error:', err);
            showErrorPopup('Failed to upload resume. Please try again.');
            if (uploadStatus) {
                uploadStatus.innerHTML = '<p style="color: var(--current-error);">Upload failed. Please try again.</p>';
            }
        });
}

function updateStep1Display(data) {
    const uploadStatus = document.getElementById('uploadStatus');
    if (uploadStatus) {
        uploadStatus.innerHTML = `
            <div style="padding: 1rem; background: var(--current-surface); border-radius: 8px;">
                <p style="margin: 0 0 0.5rem 0; font-weight: 600;">✓ Resume Uploaded</p>
                <p style="margin: 0; color: var(--current-text-muted); font-size: 0.9rem;">
                    File: ${data.file_name}<br>
                    Extracted ${data.skills.length} technical skills
                </p>
            </div>
        `;
    }
}

// ===== STEP 2: SKILL EXTRACTION =====
function populateStep2(skills) {
    const skillsList = document.getElementById('extractedSkillsList');
    if (!skillsList) return;

    skillsList.innerHTML = skills
        .map((skill, index) => {
            return `
                <div class="skill-item" data-skill="${skill}">
                    <span class="skill-text">${skill}</span>
                    <button type="button" class="skill-remove" onclick="removeSkill('${skill}')">×</button>
                </div>
            `;
        })
        .join('');
}

function removeSkill(skill) {
    extractedSkills = extractedSkills.filter(s => s !== skill);
    populateStep2(extractedSkills);
}

function addCustomSkill() {
    const input = document.getElementById('customSkillInput');
    if (!input || !input.value.trim()) {
        showErrorPopup('Please enter a skill name');
        return;
    }

    const skill = input.value.trim();
    if (!extractedSkills.includes(skill)) {
        extractedSkills.push(skill);
        populateStep2(extractedSkills);
        input.value = '';
    } else {
        showErrorPopup('Skill already added');
    }
}

// ===== STEP 3: CAREER PREDICTION =====
function performPrediction() {
    if (extractedSkills.length === 0) {
        showErrorPopup('No skills to analyze. Please add skills in Step 2.');
        return;
    }

    const skillsText = extractedSkills.join(', ');

    // Show loading state
    const predictionContent = document.getElementById('predictionContent');
    if (predictionContent) {
        predictionContent.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--current-text-muted);">Analyzing your profile...</p>';
    }

    fetch(`${API_BASE}/api/predict-role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: skillsText }),
        credentials: 'include'
    })
        .then(r => {
            if (!r.ok) {
                throw new Error(`Prediction failed with status ${r.status}`);
            }
            return r.json();
        })
        .then(data => {
            if (data.success) {
                displayPredictionResults(data);
                showSuccessPopup('Career prediction complete');
            } else {
                showErrorPopup(data.error || 'Prediction failed');
            }
        })
        .catch(err => {
            console.error('Prediction error:', err);
            showErrorPopup('Failed to generate prediction. Please try again.');
        });
}

function displayPredictionResults(data) {
    const predictionContent = document.getElementById('predictionContent');
    if (!predictionContent) return;

    // Main prediction
    let html = `
        <div class="prediction-result">
            <h3>Predicted Career Role</h3>
            <div class="prediction-main-role">
                <p class="role-name">${data.predicted_role}</p>
                <p class="role-confidence">Confidence: ${(data.confidence * 100).toFixed(1)}%</p>
            </div>
    `;

    // Show individual model predictions if available
    if (data.svm_role || data.rf_role) {
        html += `<div class="model-predictions">
            <h4>Model Predictions</h4>
            <div class="model-grid">`;

        if (data.svm_role) {
            html += `
                <div class="model-card">
                    <p class="model-name">SVM Model</p>
                    <p class="model-role">${data.svm_role}</p>
                    <p class="model-confidence">${data.svm_confidence ? (data.svm_confidence * 100).toFixed(1) + '%' : 'N/A'}</p>
                </div>
            `;
        }

        if (data.rf_role) {
            html += `
                <div class="model-card">
                    <p class="model-name">Random Forest Model</p>
                    <p class="model-role">${data.rf_role}</p>
                    <p class="model-confidence">${data.rf_confidence ? (data.rf_confidence * 100).toFixed(1) + '%' : 'N/A'}</p>
                </div>
            `;
        }

        html += `</div></div>`;
    }

    // Top roles if available
    if (data.top_roles && Array.isArray(data.top_roles) && data.top_roles.length > 0) {
        html += `<div class="top-roles">
            <h4>Top Career Matches</h4>
            <div class="roles-list">`;

        data.top_roles.forEach((role, index) => {
            html += `
                <div class="role-item" style="margin-bottom: 0.75rem;">
                    <span class="role-rank">${index + 1}.</span>
                    <span class="role-title">${role.role}</span>
                    <span class="role-match">${(role.confidence * 100).toFixed(1)}% match</span>
                </div>
            `;
        });

        html += `</div></div>`;
    }

    // Uncertainty message if applicable
    if (data.is_uncertain) {
        html += `
            <div class="uncertainty-note">
                <p>⚠ ${data.uncertainty_message}</p>
            </div>
        `;
    }

    html += `</div>`;

    predictionContent.innerHTML = html;

    // Enable Job Fit Analysis button if exists
    const jobFitBtn = document.getElementById('jobFitBtn');
    if (jobFitBtn) {
        jobFitBtn.style.display = 'block';
        jobFitBtn.onclick = () => {
            analyzeJobFit(data.predicted_role);
        };
    }
}

function analyzeJobFit(jobRole) {
    const skillsText = extractedSkills.join(', ');

    fetch(`${API_BASE}/api/job-fit-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            job_role: jobRole,
            skills: skillsText,
            resume_text: resumeText
        }),
        credentials: 'include'
    })
        .then(r => {
            if (!r.ok) throw new Error('Job fit analysis failed');
            return r.json();
        })
        .then(data => {
            if (data.success) {
                displayJobFitResults(data);
            }
        })
        .catch(err => {
            console.error('Job fit analysis error:', err);
            showErrorPopup('Failed to analyze job fit');
        });
}

function displayJobFitResults(data) {
    const jobFitResult = document.getElementById('jobFitResult');
    if (jobFitResult) {
        jobFitResult.innerHTML = `
            <div class="job-fit-analysis">
                <h4>Job Fit Analysis: ${data.job_role}</h4>
                <div class="fit-metrics">
                    <div class="metric">
                        <p class="metric-label">Fit Score</p>
                        <p class="metric-value">${(data.fit_score * 100).toFixed(0)}%</p>
                    </div>
                    <div class="metric">
                        <p class="metric-label">Skills Match</p>
                        <p class="metric-value">${data.skills_match}</p>
                    </div>
                    <div class="metric">
                        <p class="metric-label">Experience Level</p>
                        <p class="metric-value">${data.experience_level}</p>
                    </div>
                </div>
            </div>
        `;
        jobFitResult.style.display = 'block';
    }
}
