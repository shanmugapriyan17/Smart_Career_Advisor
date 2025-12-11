// Smart Career Advisor - Resume Analyzer JavaScript
// Handles the 3-step resume analysis wizard: Upload → Extract → Predict
const API_BASE = 'https://sca-backend-n7ic.onrender.com';

let currentStep = 1;
let uploadedFile = null;
let extractedSkills = [];
let resumeText = '';
let resumeFileName = '';

document.addEventListener('DOMContentLoaded', () => {
    setupStepButtons();
    setupResumeUpload();
    setupPredictionFlow();
    setupDownloadReport();
});

// ===== STEP NAVIGATION =====
function setupStepButtons() {
    const nextStep1 = document.getElementById('nextStep1');
    const backStep2 = document.getElementById('backStep2');
    const nextStep2 = document.getElementById('nextStep2');
    const analyzeFitBtn = document.getElementById('analyzeFitBtn');

    // Next from Step 1 to Step 2
    nextStep1?.addEventListener('click', () => {
        goToStep(2);
    });

    // Back from Step 2 to Step 1
    backStep2?.addEventListener('click', () => {
        goToStep(1);
    });

    // Next from Step 2 to Step 3 (Analyze & Predict)
    nextStep2?.addEventListener('click', () => {
        if (extractedSkills.length === 0) {
            alert('Please add at least one skill before proceeding');
            return;
        }
        goToStep(3);
        performPrediction();
    });

    // Analyze job fit
    analyzeFitBtn?.addEventListener('click', () => {
        const jobRole = document.getElementById('jobRoleInput').value.trim();
        if (!jobRole) {
            alert('Please enter a job role');
            return;
        }
        analyzeJobFit(jobRole);
    });
}

function goToStep(step) {
    // Hide all steps
    document.getElementById('step1').style.display = 'none';
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step3').style.display = 'none';

    // Show selected step
    const stepId = `step${step}`;
    const stepEl = document.getElementById(stepId);
    if (stepEl) {
        stepEl.style.display = 'block';
        currentStep = step;
        window.scrollTo(0, 0);
    }
}

// ===== STEP 1: FILE UPLOAD =====
function setupResumeUpload() {
    const resumeFileInput = document.getElementById('resumeFile');
    const uploadBox = document.querySelector('.upload-box') || document.querySelector('[data-upload-box]');

    if (!resumeFileInput) return;

    // Click to upload
    if (uploadBox) {
        uploadBox.addEventListener('click', () => {
            resumeFileInput.click();
        });

        // Drag and drop
        uploadBox.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadBox.classList.add('drag-over');
        });

        uploadBox.addEventListener('dragleave', () => {
            uploadBox.classList.remove('drag-over');
        });

        uploadBox.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadBox.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFileUpload(files[0]);
            }
        });
    }

    // File input change
    resumeFileInput.addEventListener('change', (e) => {
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
        alert('Only PDF and TXT files are allowed');
        return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
        alert('File must be smaller than 5MB');
        return;
    }

    uploadedFile = file;
    resumeFileName = file.name;
    const formData = new FormData();
    formData.append('file', file);

    // Show loading state
    const uploadStatus = document.getElementById('uploadStatus');
    if (uploadStatus) {
        uploadStatus.style.display = 'block';
        uploadStatus.innerHTML = '<p>Uploading and analyzing...</p>';
    }

    fetch(`${API_BASE}/api/upload-resume`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
    })
        .then(async r => {
            if (!r.ok) {
                const text = await r.text();
                throw new Error(text || `Upload failed with status ${r.status}`);
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

                // Show success and next button
                const uploadSuccess = document.getElementById('uploadSuccess');
                if (uploadSuccess) {
                    uploadSuccess.style.display = 'block';
                    uploadSuccess.innerHTML = `<p>✓ ${data.message}</p>`;
                }

                const nextBtn = document.getElementById('nextStep1');
                if (nextBtn) {
                    nextBtn.style.display = 'block';
                }
            } else {
                alert(data.error || 'Failed to upload resume');
                if (uploadStatus) {
                    uploadStatus.style.display = 'block';
                    uploadStatus.innerHTML = '<p style="color: red;">Upload failed. Please try again.</p>';
                }
            }
        })
        .catch(err => {
            console.error('Upload error:', err);
            alert('Failed to upload resume. Please try again.');
            if (uploadStatus) {
                uploadStatus.style.display = 'block';
                uploadStatus.innerHTML = '<p style="color: red;">Upload failed. Please try again.</p>';
            }
        });
}

function updateStep1Display(data) {
    const uploadStatus = document.getElementById('uploadStatus');
    if (uploadStatus) {
        uploadStatus.style.display = 'none';
    }
}

// ===== STEP 2: SKILL EXTRACTION =====
function populateStep2(skills) {
    const skillsContainer = document.getElementById('skillsExtraction');
    if (!skillsContainer) return;

    skillsContainer.innerHTML = skills
        .map((skill, index) => {
            return `
                <div class="skill-tag" data-skill="${skill}">
                    <span>${skill}</span>
                    <button type="button" class="skill-remove-btn" onclick="removeSkill(${index})">×</button>
                </div>
            `;
        })
        .join('');

    // Show resume preview
    const resumePreview = document.getElementById('resumePreview');
    if (resumePreview) {
        resumePreview.innerHTML = `
            <div class="preview-content">
                <p><strong>File:</strong> ${resumeFileName}</p>
                <p><strong>Skills Extracted:</strong> ${skills.length}</p>
                <p><strong>Preview:</strong></p>
                <div class="preview-text">${(resumeText || 'No text extracted').substring(0, 200)}...</div>
            </div>
        `;
    }
}

function removeSkill(index) {
    extractedSkills.splice(index, 1);
    populateStep2(extractedSkills);
}

function addCustomSkill() {
    // This would need a custom skill input in the HTML
    // For now, this is a placeholder
}

// ===== STEP 3: CAREER PREDICTION =====
function setupPredictionFlow() {
    // Setup is handled in setupStepButtons
}

function performPrediction() {
    if (extractedSkills.length === 0) {
        alert('No skills to analyze. Please add skills in Step 2.');
        return;
    }

    const skillsText = extractedSkills.join(', ');

    // Show loading state
    updatePredictionDisplay('Loading...');

    fetch(`${API_BASE}/api/predict-role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: skillsText }),
        credentials: 'include'
    })
        .then(async r => {
            if (!r.ok) {
                const text = await r.text();
                throw new Error(text || `Prediction failed with status ${r.status}`);
            }
            return r.json();
        })
        .then(data => {
            if (data.success) {
                displayPredictionResults(data);
            } else {
                alert(data.error || 'Prediction failed');
            }
        })
        .catch(err => {
            console.error('Prediction error:', err);
            alert('Failed to generate prediction. Please try again.');
        });
}

function updatePredictionDisplay(message) {
    // Placeholder for loading state
    console.log('Prediction status:', message);
}

function displayPredictionResults(data) {
    // Update SVM prediction
    document.getElementById('svmRole').textContent = data.svm_role || '-';
    document.getElementById('svmConfidence').textContent = data.svm_role ? '✓' : '-';

    // Update RF prediction
    document.getElementById('rfRole').textContent = data.rf_role || '-';
    document.getElementById('rfConfidence').textContent = data.rf_role ? '✓' : '-';

    // Update top 3 predictions if available
    if (data.top_roles && Array.isArray(data.top_roles)) {
        for (let i = 0; i < Math.min(3, data.top_roles.length); i++) {
            const role = data.top_roles[i];
            const roleNum = i + 1;

            // Set role name
            const roleNameEl = document.getElementById(`topRole${roleNum}`);
            if (roleNameEl) {
                roleNameEl.textContent = role.role;
            }

            // Set confidence as visual bar (not percentage number)
            const scoreEl = document.getElementById(`topScore${roleNum}`);
            if (scoreEl) {
                const confidence = Math.min(100, Math.max(0, (role.confidence || 0) * 100));
                scoreEl.style.width = confidence + '%';
            }

            // Set confidence text (just checkmark or indicator, not percentage)
            const confEl = document.getElementById(`topConf${roleNum}`);
            if (confEl) {
                confEl.textContent = role.confidence ? '✓ Match' : '-';
            }
        }
    }

    // Log server data for debugging (not shown to user)
    console.log('Model predictions:', {
        svm: data.svm_role,
        rf: data.rf_role,
        final: data.predicted_role,
        top_roles: data.top_roles
    });
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
        .then(async r => {
            if (!r.ok) {
                const text = await r.text();
                throw new Error(text || 'Job fit analysis failed');
            }
            return r.json();
        })
        .then(data => {
            if (data.success) {
                displayJobFitResults(data);
            }
        })
        .catch(err => {
            console.error('Job fit analysis error:', err);
            alert('Failed to analyze job fit');
        });
}

function displayJobFitResults(data) {
    const fitResult = document.getElementById('fitResult');
    if (fitResult) {
        fitResult.innerHTML = `
            <div class="fit-analysis">
                <h4>${data.job_role}</h4>
                <p><strong>Skills Match:</strong> ${data.skills_match}</p>
                <p><strong>Experience Level:</strong> ${data.experience_level}</p>
            </div>
        `;
        fitResult.style.display = 'block';
    }
}

// ===== DOWNLOAD REPORT =====
function setupDownloadReport() {
    const downloadBtn = document.getElementById('downloadReport');
    if (!downloadBtn) return;

    downloadBtn.addEventListener('click', () => {
        generateAndDownloadReport();
    });
}

function generateAndDownloadReport() {
    const element = document.createElement('div');
    element.style.padding = '2rem';
    element.style.fontFamily = "'Poppins', sans-serif";
    element.style.backgroundColor = '#ffffff';
    element.style.color = '#0F172A';

    // Build report HTML content
    const timestamp = new Date().toLocaleString();
    const svmRole = document.getElementById('svmRole')?.textContent || '-';
    const rfRole = document.getElementById('rfRole')?.textContent || '-';
    const topRoles = [];

    for (let i = 1; i <= 3; i++) {
        const roleName = document.getElementById(`topRole${i}`)?.textContent || '-';
        if (roleName !== '-') {
            topRoles.push(`${i}. ${roleName}`);
        }
    }

    element.innerHTML = `
        <div style="text-align: center; margin-bottom: 2rem; border-bottom: 2px solid #2563EB; padding-bottom: 1rem;">
            <h1 style="color: #2563EB; margin: 0 0 0.5rem 0;">Smart Career Advisor</h1>
            <p style="color: #6B7280; margin: 0;">Career Prediction Report</p>
            <p style="font-size: 0.9rem; color: #6B7280; margin: 0.5rem 0 0 0;">Generated on ${timestamp}</p>
        </div>

        <div style="margin-bottom: 2rem;">
            <h2 style="color: #0F172A; font-size: 1.5rem; margin-bottom: 1rem;">Your Profile</h2>
            <div style="background: #F3F4F6; padding: 1rem; border-radius: 8px;">
                <p style="margin: 0.5rem 0;"><strong>Skills Extracted:</strong> ${extractedSkills.length} skills</p>
                <div style="margin-top: 0.75rem; display: flex; flex-wrap: wrap; gap: 0.5rem;">
                    ${extractedSkills.map(skill => `<span style="background: #2563EB; color: white; padding: 0.25rem 0.75rem; border-radius: 4px; font-size: 0.9rem;">${skill}</span>`).join('')}
                </div>
            </div>
        </div>

        <div style="margin-bottom: 2rem;">
            <h2 style="color: #0F172A; font-size: 1.5rem; margin-bottom: 1rem;">ML Model Predictions</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div style="background: #F3F4F6; padding: 1rem; border-radius: 8px; border-left: 4px solid #2563EB;">
                    <h3 style="margin: 0 0 0.5rem 0; color: #0F172A;">SVM Model</h3>
                    <p style="margin: 0; font-weight: 600; color: #2563EB; font-size: 1.2rem;">${svmRole}</p>
                    <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem; color: #6B7280;">Support Vector Machine</p>
                </div>
                <div style="background: #F3F4F6; padding: 1rem; border-radius: 8px; border-left: 4px solid #6366F1;">
                    <h3 style="margin: 0 0 0.5rem 0; color: #0F172A;">Random Forest</h3>
                    <p style="margin: 0; font-weight: 600; color: #6366F1; font-size: 1.2rem;">${rfRole}</p>
                    <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem; color: #6B7280;">Ensemble Learning</p>
                </div>
            </div>
        </div>

        ${topRoles.length > 0 ? `
        <div style="margin-bottom: 2rem;">
            <h2 style="color: #0F172A; font-size: 1.5rem; margin-bottom: 1rem;">Top Recommended Roles</h2>
            <div style="background: #F3F4F6; padding: 1rem; border-radius: 8px;">
                ${topRoles.map(role => `<p style="margin: 0.5rem 0; color: #0F172A; font-weight: 500;">${role}</p>`).join('')}
            </div>
        </div>
        ` : ''}

        <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #E5E7EB; font-size: 0.9rem; color: #6B7280;">
            <p style="margin: 0;">This report was generated by the Smart Career Advisor AI system.</p>
            <p style="margin: 0.5rem 0 0 0;">For more details, visit your dashboard or re-run the analysis with different parameters.</p>
        </div>
    `;

    const options = {
        margin: [10, 10, 10, 10],
        filename: `Career-Prediction-Report-${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };

    if (typeof html2pdf !== 'undefined') {
        html2pdf().set(options).from(element).save().catch(err => {
            console.error('Report download error:', err);
            alert('Failed to generate report. Please try again.');
        });
    } else {
        alert('PDF library not loaded. Please refresh the page and try again.');
    }
}
