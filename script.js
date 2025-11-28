// DOM Elements
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');
const templates = document.querySelectorAll('.template');
const generateBtn = document.getElementById('generate-resume');
const resetBtn = document.getElementById('reset-form');
const exportPdfBtn = document.getElementById('export-pdf');
const exportDocxBtn = document.getElementById('export-docx');
const exportHtmlBtn = document.getElementById('export-html');
const addExperienceBtn = document.getElementById('add-experience');
const addEducationBtn = document.getElementById('add-education');
const jobDescriptionTextarea = document.getElementById('jobDescription');
const industrySelect = document.getElementById('industry');
const jobTitleInput = document.getElementById('jobTitle');
const feedbackPoorBtn = document.getElementById('feedback-poor');
const feedbackGoodBtn = document.getElementById('feedback-good');
const feedbackExcellentBtn = document.getElementById('feedback-excellent');
const pictureUpload = document.getElementById('picture-upload');
const picturePreview = document.getElementById('picture-preview');
const removePictureBtn = document.getElementById('remove-picture');
const pictureUploadSection = document.getElementById('picture-upload-section');
const resumeHistoryList = document.getElementById('resume-history-list');

// State
let currentTemplate = '1';
let experienceCount = 1;
let educationCount = 1;
let atsScore = 0;
let profilePicture = null;
let resumeHistory = [];

// Initialize jsPDF
const { jsPDF } = window.jspdf;

// Storage Keys
const STORAGE_KEYS = {
    PERSONAL: 'resume_personal_data',
    EXPERIENCE: 'resume_experience_data',
    EDUCATION: 'resume_education_data',
    SKILLS: 'resume_skills_data',
    TEMPLATE: 'resume_template_data',
    PICTURE: 'resume_picture_data',
    HISTORY: 'resume_history_data'
};

// Tab switching
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const tabId = tab.getAttribute('data-tab');
        
        // Update active tab
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Show corresponding content
        tabContents.forEach(content => {
            content.classList.remove('active');
            if (content.id === `${tabId}-tab`) {
                content.classList.add('active');
            }
        });
        
        // Update history display when history tab is opened
        if (tabId === 'history') {
            updateHistoryDisplay();
        }
    });
});

// Template selection
templates.forEach(template => {
    template.addEventListener('click', () => {
        templates.forEach(t => t.classList.remove('active'));
        template.classList.add('active');
        currentTemplate = template.getAttribute('data-template');
        
        // Show picture upload only for template 1
        if (currentTemplate === '1') {
            pictureUploadSection.style.display = 'block';
        } else {
            pictureUploadSection.style.display = 'none';
        }
        
        saveTemplateData();
        updateResumePreview();
    });
});

// Add experience field
addExperienceBtn.addEventListener('click', () => {
    experienceCount++;
    const container = document.getElementById('experience-container');
    
    const newExperience = document.createElement('div');
    newExperience.innerHTML = `
        <div class="form-group">
            <label for="jobTitle${experienceCount}">Job Title</label>
            <input type="text" id="jobTitle${experienceCount}" placeholder="Junior Developer">
        </div>
        <div class="form-group">
            <label for="company${experienceCount}">Company</label>
            <input type="text" id="company${experienceCount}" placeholder="CAPACITI">
        </div>
        <div class="form-group">
            <label for="jobDate${experienceCount}">Dates</label>
            <input type="text" id="jobDate${experienceCount}" placeholder="OCT 2025 - Present">
        </div>
        <div class="form-group">
            <label for="jobDescription${experienceCount}">Description</label>
            <textarea id="jobDescription${experienceCount}" placeholder="Led a team of 5 developers in building enterprise applications..."></textarea>
        </div>
    `;
    
    container.appendChild(newExperience);
    
    // Add event listeners to new fields
    const newInputs = newExperience.querySelectorAll('input, textarea');
    newInputs.forEach(input => {
        input.addEventListener('input', () => {
            saveExperienceData();
            updateResumePreview();
        });
    });
});

// Add education field
addEducationBtn.addEventListener('click', () => {
    educationCount++;
    const container = document.getElementById('education-container');
    
    const newEducation = document.createElement('div');
    newEducation.innerHTML = `
        <div class="form-group">
            <label for="degree${educationCount}">Degree</label>
            <input type="text" id="degree${educationCount}" placeholder="Diploma in ICT">
        </div>
        <div class="form-group">
            <label for="school${educationCount}">School</label>
            <input type="text" id="school${educationCount}" placeholder="Durban University of Technology">
        </div>
        <div class="form-group">
            <label for="educationDate${educationCount}">Dates</label>
            <input type="text" id="educationDate${educationCount}" placeholder="2021 - 2023">
        </div>
        <div class="form-group">
            <label for="educationDescription${educationCount}">Description (Optional)</label>
            <textarea id="educationDescription${educationCount}" placeholder="Graduated magna cum laude..."></textarea>
        </div>
    `;
    
    container.appendChild(newEducation);
    
    // Add event listeners to new fields
    const newInputs = newEducation.querySelectorAll('input, textarea');
    newInputs.forEach(input => {
        input.addEventListener('input', () => {
            saveEducationData();
            updateResumePreview();
        });
    });
});

// Picture upload functionality
function handlePictureUpload(event) {
    const file = event.target.files[0];
    if (file) {
        // Validate file type
        if (!file.type.match('image.*')) {
            alert('Please select an image file (JPEG, PNG, GIF, etc.)');
            return;
        }
        
        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert('Please select an image smaller than 2MB');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            profilePicture = e.target.result;
            updatePicturePreview();
            savePictureData();
            updateResumePreview();
        };
        reader.readAsDataURL(file);
    }
}

function updatePicturePreview() {
    if (profilePicture) {
        picturePreview.innerHTML = `<img src="${profilePicture}" alt="Profile Preview">`;
        removePictureBtn.style.display = 'inline-block';
    } else {
        picturePreview.innerHTML = '<div class="placeholder">No picture selected<br><small>Recommended: 150x150 px</small></div>';
        removePictureBtn.style.display = 'none';
    }
}

function removePicture() {
    profilePicture = null;
    pictureUpload.value = '';
    updatePicturePreview();
    savePictureData();
    updateResumePreview();
}

// Local Storage Functions
function savePersonalData() {
    const personalData = {
        fullName: document.getElementById('fullName').value,
        jobTitle: document.getElementById('jobTitle').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        location: document.getElementById('location').value,
        summary: document.getElementById('summary').value
    };
    localStorage.setItem(STORAGE_KEYS.PERSONAL, JSON.stringify(personalData));
}

function saveExperienceData() {
    const experienceData = [];
    for (let i = 1; i <= experienceCount; i++) {
        const jobTitle = document.getElementById(`jobTitle${i}`)?.value;
        const company = document.getElementById(`company${i}`)?.value;
        const jobDate = document.getElementById(`jobDate${i}`)?.value;
        const jobDescription = document.getElementById(`jobDescription${i}`)?.value;
        
        if (jobTitle || company || jobDate || jobDescription) {
            experienceData.push({
                jobTitle,
                company,
                jobDate,
                jobDescription
            });
        }
    }
    localStorage.setItem(STORAGE_KEYS.EXPERIENCE, JSON.stringify(experienceData));
}

function saveEducationData() {
    const educationData = [];
    for (let i = 1; i <= educationCount; i++) {
        const degree = document.getElementById(`degree${i}`)?.value;
        const school = document.getElementById(`school${i}`)?.value;
        const educationDate = document.getElementById(`educationDate${i}`)?.value;
        const educationDescription = document.getElementById(`educationDescription${i}`)?.value;
        
        if (degree || school || educationDate || educationDescription) {
            educationData.push({
                degree,
                school,
                educationDate,
                educationDescription
            });
        }
    }
    localStorage.setItem(STORAGE_KEYS.EDUCATION, JSON.stringify(educationData));
}

function saveSkillsData() {
    const skillsData = {
        skills: document.getElementById('skills').value,
        industry: document.getElementById('industry').value
    };
    localStorage.setItem(STORAGE_KEYS.SKILLS, JSON.stringify(skillsData));
}

function saveTemplateData() {
    const templateData = {
        currentTemplate: currentTemplate,
        colorScheme: document.getElementById('colorScheme').value,
        fontFamily: document.getElementById('fontFamily').value
    };
    localStorage.setItem(STORAGE_KEYS.TEMPLATE, JSON.stringify(templateData));
}

function savePictureData() {
    localStorage.setItem(STORAGE_KEYS.PICTURE, profilePicture);
}

function saveToHistory() {
    // Create a snapshot of current resume data
    const resumeSnapshot = {
        id: Date.now().toString(),
        name: document.getElementById('fullName').value || 'Untitled Resume',
        timestamp: new Date().toISOString(),
        data: {
            personal: JSON.parse(localStorage.getItem(STORAGE_KEYS.PERSONAL) || '{}'),
            experience: JSON.parse(localStorage.getItem(STORAGE_KEYS.EXPERIENCE) || '[]'),
            education: JSON.parse(localStorage.getItem(STORAGE_KEYS.EDUCATION) || '[]'),
            skills: JSON.parse(localStorage.getItem(STORAGE_KEYS.SKILLS) || '{}'),
            template: JSON.parse(localStorage.getItem(STORAGE_KEYS.TEMPLATE) || '{}'),
            picture: localStorage.getItem(STORAGE_KEYS.PICTURE) || null
        }
    };
    
    // Load existing history
    const existingHistory = JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY) || '[]');
    
    // Check if we already have this resume (by name and similar timestamp)
    const existingIndex = existingHistory.findIndex(item => 
        item.name === resumeSnapshot.name && 
        Math.abs(new Date(item.timestamp) - new Date(resumeSnapshot.timestamp)) < 60000 // Within 1 minute
    );
    
    // Update existing or add new
    if (existingIndex !== -1) {
        existingHistory[existingIndex] = resumeSnapshot;
    } else {
        existingHistory.push(resumeSnapshot);
    }
    
    // Keep only the last 10 resumes
    if (existingHistory.length > 10) {
        existingHistory.shift(); // Remove oldest
    }
    
    // Save back to localStorage
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(existingHistory));
    
    // Update history display
    updateHistoryDisplay();
}

function saveAllData() {
    savePersonalData();
    saveExperienceData();
    saveEducationData();
    saveSkillsData();
    saveTemplateData();
    savePictureData();
    saveToHistory();
}

function loadPersonalData() {
    const saved = localStorage.getItem(STORAGE_KEYS.PERSONAL);
    if (saved) {
        const data = JSON.parse(saved);
        document.getElementById('fullName').value = data.fullName || '';
        document.getElementById('jobTitle').value = data.jobTitle || '';
        document.getElementById('email').value = data.email || '';
        document.getElementById('phone').value = data.phone || '';
        document.getElementById('location').value = data.location || '';
        document.getElementById('summary').value = data.summary || '';
    }
}

function loadExperienceData() {
    const saved = localStorage.getItem(STORAGE_KEYS.EXPERIENCE);
    if (saved) {
        const data = JSON.parse(saved);
        experienceCount = 0;
        const container = document.getElementById('experience-container');
        container.innerHTML = '';
        
        data.forEach((exp, index) => {
            experienceCount++;
            const newExperience = document.createElement('div');
            newExperience.innerHTML = `
                <div class="form-group">
                    <label for="jobTitle${experienceCount}">Job Title</label>
                    <input type="text" id="jobTitle${experienceCount}" placeholder="Junior Developer" value="${exp.jobTitle || ''}">
                </div>
                <div class="form-group">
                    <label for="company${experienceCount}">Company</label>
                    <input type="text" id="company${experienceCount}" placeholder="CAPACITI" value="${exp.company || ''}">
                </div>
                <div class="form-group">
                    <label for="jobDate${experienceCount}">Dates</label>
                    <input type="text" id="jobDate${experienceCount}" placeholder="OCT 2025 - Present" value="${exp.jobDate || ''}">
                </div>
                <div class="form-group">
                    <label for="jobDescription${experienceCount}">Description</label>
                    <textarea id="jobDescription${experienceCount}" placeholder="Led a team of 5 developers in building enterprise applications...">${exp.jobDescription || ''}</textarea>
                </div>
            `;
            container.appendChild(newExperience);
            
            // Add event listeners to new fields
            const newInputs = newExperience.querySelectorAll('input, textarea');
            newInputs.forEach(input => {
                input.addEventListener('input', () => {
                    saveExperienceData();
                    updateResumePreview();
                });
            });
        });
    }
}

function loadEducationData() {
    const saved = localStorage.getItem(STORAGE_KEYS.EDUCATION);
    if (saved) {
        const data = JSON.parse(saved);
        educationCount = 0;
        const container = document.getElementById('education-container');
        container.innerHTML = '';
        
        data.forEach((edu, index) => {
            educationCount++;
            const newEducation = document.createElement('div');
            newEducation.innerHTML = `
                <div class="form-group">
                    <label for="degree${educationCount}">Degree</label>
                    <input type="text" id="degree${educationCount}" placeholder="Diploma in ICT" value="${edu.degree || ''}">
                </div>
                <div class="form-group">
                    <label for="school${educationCount}">School</label>
                    <input type="text" id="school${educationCount}" placeholder="Durban University of Technology" value="${edu.school || ''}">
                </div>
                <div class="form-group">
                    <label for="educationDate${educationCount}">Dates</label>
                    <input type="text" id="educationDate${educationCount}" placeholder="2021 - 2023" value="${edu.educationDate || ''}">
                </div>
                <div class="form-group">
                    <label for="educationDescription${educationCount}">Description (Optional)</label>
                    <textarea id="educationDescription${educationCount}" placeholder="Graduated magna cum laude...">${edu.educationDescription || ''}</textarea>
                </div>
            `;
            container.appendChild(newEducation);
            
            // Add event listeners to new fields
            const newInputs = newEducation.querySelectorAll('input, textarea');
            newInputs.forEach(input => {
                input.addEventListener('input', () => {
                    saveEducationData();
                    updateResumePreview();
                });
            });
        });
    }
}

function loadSkillsData() {
    const saved = localStorage.getItem(STORAGE_KEYS.SKILLS);
    if (saved) {
        const data = JSON.parse(saved);
        document.getElementById('skills').value = data.skills || '';
        document.getElementById('industry').value = data.industry || 'technology';
    }
}

function loadTemplateData() {
    const saved = localStorage.getItem(STORAGE_KEYS.TEMPLATE);
    if (saved) {
        const data = JSON.parse(saved);
        currentTemplate = data.currentTemplate || '1';
        
        // Update template selection
        templates.forEach(t => t.classList.remove('active'));
        document.querySelector(`.template[data-template="${currentTemplate}"]`).classList.add('active');
        
        document.getElementById('colorScheme').value = data.colorScheme || 'blue';
        document.getElementById('fontFamily').value = data.fontFamily || 'arial';
    }
}

function loadPictureData() {
    const saved = localStorage.getItem(STORAGE_KEYS.PICTURE);
    if (saved) {
        profilePicture = saved;
        updatePicturePreview();
    }
}

function loadAllData() {
    loadPersonalData();
    loadExperienceData();
    loadEducationData();
    loadSkillsData();
    loadTemplateData();
    loadPictureData();
    updateResumePreview();
}

function clearAllData() {
    // Save current history before clearing
    const history = JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY) || '[]');
    
    // Clear all data except history
    localStorage.removeItem(STORAGE_KEYS.PERSONAL);
    localStorage.removeItem(STORAGE_KEYS.EXPERIENCE);
    localStorage.removeItem(STORAGE_KEYS.EDUCATION);
    localStorage.removeItem(STORAGE_KEYS.SKILLS);
    localStorage.removeItem(STORAGE_KEYS.TEMPLATE);
    localStorage.removeItem(STORAGE_KEYS.PICTURE);
    
    // Restore history
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    
    // Reset form fields
    document.querySelectorAll('input, textarea').forEach(field => {
        field.value = '';
    });
    
    // Reset to default template
    templates.forEach(t => t.classList.remove('active'));
    document.querySelector('.template-1').classList.add('active');
    currentTemplate = '1';
    
    // Reset counters
    experienceCount = 1;
    educationCount = 1;
    
    // Clear experience and education containers
    document.getElementById('experience-container').innerHTML = `
        <div class="form-group">
            <label for="jobTitle1">Job Title</label>
            <input type="text" id="jobTitle1" placeholder="Junior Developer">
        </div>
        <div class="form-group">
            <label for="company1">Company</label>
            <input type="text" id="company1" placeholder="CAPACITI">
        </div>
        <div class="form-group">
            <label for="jobDate1">Dates</label>
            <input type="text" id="jobDate1" placeholder="OCT 2025 - Present">
        </div>
        <div class="form-group">
            <label for="jobDescription1">Description</label>
            <textarea id="jobDescription1" placeholder="Led a team of 5 developers in building enterprise applications..."></textarea>
        </div>
    `;
    
    document.getElementById('education-container').innerHTML = `
        <div class="form-group">
            <label for="degree1">Degree</label>
            <input type="text" id="degree1" placeholder="Diploma in ICT">
        </div>
        <div class="form-group">
            <label for="school1">School</label>
            <input type="text" id="school1" placeholder="Durban University of Technology">
        </div>
        <div class="form-group">
            <label for="educationDate1">Dates</label>
            <input type="text" id="educationDate1" placeholder="2021 - 2023">
        </div>
        <div class="form-group">
            <label for="educationDescription1">Description (Optional)</label>
            <textarea id="educationDescription1" placeholder="Graduated magna cum laude..."></textarea>
        </div>
    `;
    
    // Reset picture
    profilePicture = null;
    pictureUpload.value = '';
    updatePicturePreview();
    
    // Reattach event listeners
    attachEventListeners();
    updateResumePreview();
}

function attachEventListeners() {
    // Personal info event listeners
    const personalFields = ['fullName', 'jobTitle', 'email', 'phone', 'location', 'summary'];
    personalFields.forEach(field => {
        document.getElementById(field).addEventListener('input', () => {
            savePersonalData();
            updateResumePreview();
        });
    });
    
    // Skills event listeners
    document.getElementById('skills').addEventListener('input', () => {
        saveSkillsData();
        updateResumePreview();
    });
    
    document.getElementById('industry').addEventListener('change', () => {
        saveSkillsData();
        updateIndustrySuggestions();
        updateResumePreview();
    });
    
    // Template settings event listeners
    document.getElementById('colorScheme').addEventListener('change', saveTemplateData);
    document.getElementById('fontFamily').addEventListener('change', saveTemplateData);
    
    // Job description for ATS
    jobDescriptionTextarea.addEventListener('input', updateAtsScore);
    
    // Picture event listeners
    pictureUpload.addEventListener('change', handlePictureUpload);
    removePictureBtn.addEventListener('click', removePicture);
}

// Update resume preview
function updateResumePreview() {
    // Get form values
    const fullName = document.getElementById('fullName').value || 'Xolelwa Mazibuko';
    const jobTitle = document.getElementById('jobTitle').value || 'Software Developer';
    const email = document.getElementById('email').value || 'xolelwa.mazibuko@capaciti.org.za';
    const phone = document.getElementById('phone').value || '+27 3456-7890';
    const location = document.getElementById('location').value || 'Pinetown, KZN';
    const summary = document.getElementById('summary').value || 'Experienced software engineer with 5+ years in web development...';
    
    // Update preview
    document.getElementById('preview-name').textContent = fullName;
    document.getElementById('preview-title').textContent = jobTitle;
    document.getElementById('preview-contact').textContent = `${email} • ${phone} • ${location}`;
    document.getElementById('preview-summary').textContent = summary;
    
    // Update role display in suggestions
    document.getElementById('role-display').textContent = jobTitle;
    
    // Update template class and picture layout
    const resumeContent = document.getElementById('resume-content');
    resumeContent.className = 'resume-content';
    
    if (currentTemplate === '1') {
        if (profilePicture) {
            resumeContent.classList.add('template-1', 'with-picture');
            // Update profile picture in preview
            const previewPicture = document.getElementById('preview-picture');
            previewPicture.innerHTML = profilePicture ? `<img src="${profilePicture}" alt="${fullName}">` : '';
        } else {
            resumeContent.classList.add('template-1');
            // Remove with-picture class if no picture
            resumeContent.classList.remove('with-picture');
        }
    } else {
        resumeContent.classList.add(`template-${currentTemplate}`);
    }
    
    // Update skills preview
    updateSkillsPreview();
    
    // Update experience preview
    updateExperiencePreview();
    
    // Update education preview
    updateEducationPreview();
    
    // Update ATS score
    updateAtsScore();
}

// Update skills preview
function updateSkillsPreview() {
    const skillsText = document.getElementById('skills').value || 'JavaScript, React, Node.js, Python, SQL, Agile Methodology';
    const skillsArray = skillsText.split(',').map(skill => skill.trim());
    
    const skillsContainer = document.getElementById('preview-skills');
    skillsContainer.innerHTML = '';
    
    skillsArray.forEach(skill => {
        if (skill) {
            const skillItem = document.createElement('div');
            skillItem.className = 'skill-item';
            
            const skillName = document.createElement('span');
            skillName.className = 'skill-name';
            skillName.textContent = skill;
            
            const skillBar = document.createElement('div');
            skillBar.className = 'skill-bar';
            
            const skillLevel = document.createElement('div');
            skillLevel.className = 'skill-level';
            // Random skill level for demo purposes
            skillLevel.style.width = `${Math.floor(Math.random() * 30) + 70}%`;
            
            skillBar.appendChild(skillLevel);
            skillItem.appendChild(skillName);
            skillItem.appendChild(skillBar);
            
            skillsContainer.appendChild(skillItem);
        }
    });
}

// Update experience preview
function updateExperiencePreview() {
    const experienceContainer = document.getElementById('preview-experience');
    experienceContainer.innerHTML = '';
    
    for (let i = 1; i <= experienceCount; i++) {
        const jobTitle = document.getElementById(`jobTitle${i}`)?.value;
        const company = document.getElementById(`company${i}`)?.value;
        const jobDate = document.getElementById(`jobDate${i}`)?.value;
        const jobDescription = document.getElementById(`jobDescription${i}`)?.value;
        
        if (jobTitle || company) {
            const jobItem = document.createElement('div');
            jobItem.className = 'job-item';
            
            if (jobTitle) {
                const jobTitleEl = document.createElement('div');
                jobTitleEl.className = 'job-title';
                jobTitleEl.textContent = jobTitle;
                jobItem.appendChild(jobTitleEl);
            }
            
            if (company) {
                const companyEl = document.createElement('div');
                companyEl.className = 'company';
                companyEl.textContent = company;
                jobItem.appendChild(companyEl);
            }
            
            if (jobDate) {
                const dateEl = document.createElement('div');
                dateEl.className = 'date';
                dateEl.textContent = jobDate;
                jobItem.appendChild(dateEl);
            }
            
            if (jobDescription) {
                const descEl = document.createElement('p');
                descEl.textContent = jobDescription;
                jobItem.appendChild(descEl);
            }
            
            experienceContainer.appendChild(jobItem);
        }
    }
}

// Update education preview
function updateEducationPreview() {
    const educationContainer = document.getElementById('preview-education');
    educationContainer.innerHTML = '';
    
    for (let i = 1; i <= educationCount; i++) {
        const degree = document.getElementById(`degree${i}`)?.value;
        const school = document.getElementById(`school${i}`)?.value;
        const educationDate = document.getElementById(`educationDate${i}`)?.value;
        const educationDescription = document.getElementById(`educationDescription${i}`)?.value;
        
        if (degree || school) {
            const educationItem = document.createElement('div');
            educationItem.className = 'education-item';
            
            if (degree) {
                const degreeEl = document.createElement('div');
                degreeEl.className = 'degree';
                degreeEl.textContent = degree;
                educationItem.appendChild(degreeEl);
            }
            
            if (school) {
                const schoolEl = document.createElement('div');
                schoolEl.className = 'school';
                schoolEl.textContent = school;
                educationItem.appendChild(schoolEl);
            }
            
            if (educationDate) {
                const dateEl = document.createElement('div');
                dateEl.className = 'date';
                dateEl.textContent = educationDate;
                educationItem.appendChild(dateEl);
            }
            
            if (educationDescription) {
                const descEl = document.createElement('p');
                descEl.textContent = educationDescription;
                educationItem.appendChild(descEl);
            }
            
            educationContainer.appendChild(educationItem);
        }
    }
}

// Update ATS score and keyword matching
function updateAtsScore() {
    const jobDescription = jobDescriptionTextarea.value.toLowerCase();
    const skillsText = document.getElementById('skills').value.toLowerCase();
    const summaryText = document.getElementById('summary').value.toLowerCase();
    
    // Common keywords for tech industry
    const commonKeywords = [
        'javascript', 'python', 'java', 'react', 'angular', 'vue', 'node.js', 
        'html', 'css', 'sql', 'nosql', 'mongodb', 'aws', 'azure', 'docker', 
        'kubernetes', 'agile', 'scrum', 'ci/cd', 'devops', 'rest', 'api'
    ];
    
    let foundKeywords = [];
    let missingKeywords = [];
    
    // Check for keywords in resume content
    commonKeywords.forEach(keyword => {
        if (skillsText.includes(keyword) || summaryText.includes(keyword)) {
            foundKeywords.push(keyword);
        } else {
            missingKeywords.push(keyword);
        }
    });
    
    // Calculate ATS score
    atsScore = Math.min(100, Math.floor((foundKeywords.length / commonKeywords.length) * 100));
    
    // Update ATS score display
    document.getElementById('ats-score-value').textContent = `${atsScore}%`;
    document.getElementById('ats-progress').style.width = `${atsScore}%`;
    
    // Update keyword list
    const keywordList = document.getElementById('keyword-list');
    keywordList.innerHTML = '';
    
    foundKeywords.forEach(keyword => {
        const keywordEl = document.createElement('div');
        keywordEl.className = 'keyword found';
        keywordEl.textContent = keyword;
        keywordList.appendChild(keywordEl);
    });
    
    missingKeywords.forEach(keyword => {
        const keywordEl = document.createElement('div');
        keywordEl.className = 'keyword missing';
        keywordEl.textContent = keyword;
        keywordList.appendChild(keywordEl);
    });
}

// Update industry-specific suggestions
function updateIndustrySuggestions() {
    const industry = document.getElementById('industry').value;
    document.getElementById('industry-display').textContent = industry;
    
    // Update suggestions based on industry
    const suggestions = document.querySelector('#skills-tab .suggestions ul');
    suggestions.innerHTML = '';
    
    let industryKeywords = [];
    
    switch(industry) {
        case 'technology':
            industryKeywords = ['Agile Development', 'Cloud Computing', 'DevOps', 'CI/CD', 'Microservices'];
            break;
        case 'healthcare':
            industryKeywords = ['Patient Care', 'HIPAA Compliance', 'Medical Terminology', 'Electronic Health Records', 'Clinical Procedures'];
            break;
        case 'finance':
            industryKeywords = ['Financial Analysis', 'Risk Management', 'Investment Strategies', 'Regulatory Compliance', 'Portfolio Management'];
            break;
        case 'education':
            industryKeywords = ['Curriculum Development', 'Classroom Management', 'Student Assessment', 'Educational Technology', 'Differentiated Instruction'];
            break;
        case 'marketing':
            industryKeywords = ['Digital Marketing', 'SEO/SEM', 'Content Strategy', 'Social Media Management', 'Brand Development'];
            break;
        default:
            industryKeywords = ['Project Management', 'Team Leadership', 'Problem Solving', 'Communication Skills', 'Strategic Planning'];
    }
    
    industryKeywords.forEach(keyword => {
        const li = document.createElement('li');
        li.textContent = keyword;
        suggestions.appendChild(li);
    });
}

// History Functions
function updateHistoryDisplay() {
    const history = JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY) || '[]');
    resumeHistoryList.innerHTML = '';
    
    if (history.length === 0) {
        resumeHistoryList.innerHTML = '<p class="no-history">No saved resumes yet. Your progress will be saved automatically as you work.</p>';
        return;
    }
    
    // Sort by timestamp (newest first)
    history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    history.forEach(resume => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <div class="history-info">
                <div class="history-name">${resume.name}</div>
                <div class="history-date">${new Date(resume.timestamp).toLocaleString()}</div>
            </div>
            <div class="history-actions">
                <button class="btn btn-primary btn-small load-resume" data-id="${resume.id}">Load</button>
                <button class="btn btn-secondary btn-small rename-resume" data-id="${resume.id}">Rename</button>
                <button class="btn btn-warning btn-small delete-resume" data-id="${resume.id}">Delete</button>
            </div>
        `;
        resumeHistoryList.appendChild(historyItem);
    });
    
    // Add event listeners to the buttons
    document.querySelectorAll('.load-resume').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const resumeId = e.target.getAttribute('data-id');
            loadResumeFromHistory(resumeId);
        });
    });
    
    document.querySelectorAll('.rename-resume').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const resumeId = e.target.getAttribute('data-id');
            renameResume(resumeId);
        });
    });
    
    document.querySelectorAll('.delete-resume').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const resumeId = e.target.getAttribute('data-id');
            deleteResume(resumeId);
        });
    });
}

function loadResumeFromHistory(resumeId) {
    const history = JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY) || '[]');
    const resume = history.find(item => item.id === resumeId);
    
    if (!resume) {
        alert('Resume not found in history.');
        return;
    }
    
    // Clear current data first
    clearAllData();
    
    // Load data from history
    if (resume.data.personal) {
        localStorage.setItem(STORAGE_KEYS.PERSONAL, JSON.stringify(resume.data.personal));
    }
    
    if (resume.data.experience) {
        localStorage.setItem(STORAGE_KEYS.EXPERIENCE, JSON.stringify(resume.data.experience));
    }
    
    if (resume.data.education) {
        localStorage.setItem(STORAGE_KEYS.EDUCATION, JSON.stringify(resume.data.education));
    }
    
    if (resume.data.skills) {
        localStorage.setItem(STORAGE_KEYS.SKILLS, JSON.stringify(resume.data.skills));
    }
    
    if (resume.data.template) {
        localStorage.setItem(STORAGE_KEYS.TEMPLATE, JSON.stringify(resume.data.template));
    }
    
    if (resume.data.picture) {
        localStorage.setItem(STORAGE_KEYS.PICTURE, resume.data.picture);
    }
    
    // Reload all data
    loadAllData();
    loadPictureData();
    
    // Update resume preview
    updateResumePreview();
    
    alert(`Resume "${resume.name}" loaded successfully!`);
    
    // Switch to personal tab
    document.querySelector('.tab[data-tab="personal"]').click();
}

function renameResume(resumeId) {
    const history = JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY) || '[]');
    const resume = history.find(item => item.id === resumeId);
    
    if (!resume) return;
    
    const newName = prompt('Enter a new name for this resume:', resume.name);
    
    if (newName && newName.trim() !== '') {
        resume.name = newName.trim();
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
        updateHistoryDisplay();
    }
}

function deleteResume(resumeId) {
    if (!confirm('Are you sure you want to delete this saved resume?')) {
        return;
    }
    
    const history = JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY) || '[]');
    const updatedHistory = history.filter(item => item.id !== resumeId);
    
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updatedHistory));
    updateHistoryDisplay();
}

// EXPORT FUNCTIONS

// Export PDF using jsPDF
exportPdfBtn.addEventListener('click', () => {
    // Get the resume content element
    const resumeContent = document.getElementById('resume-content');
    
    // Use html2canvas to capture the resume as an image
    html2canvas(resumeContent, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false
    }).then(canvas => {
        // Create PDF
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 295; // A4 height in mm
        const imgHeight = canvas.height * imgWidth / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        // Add first page
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Add additional pages if needed
        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        // Save the PDF
        pdf.save('resume.pdf');
    }).catch(error => {
        console.error('Error generating PDF:', error);
        alert('Error generating PDF. Please try again.');
    });
});

// Export DOCX using docx.js
exportDocxBtn.addEventListener('click', () => {
    try {
        const { Document, Paragraph, TextRun, HeadingLevel, AlignmentType } = window.docx;

        // Get resume data
        const fullName = document.getElementById('fullName').value || 'Xolelwa Mazibuko';
        const jobTitle = document.getElementById('jobTitle').value || 'Software Developer';
        const email = document.getElementById('email').value || 'xolelwa.mazibuko@capaciti.org.za';
        const phone = document.getElementById('phone').value || '+27 3456-7890';
        const location = document.getElementById('location').value || 'Pinetown, KZN';
        const summary = document.getElementById('summary').value || 'Experienced software developer with 1+ years in web development...';
        
        // Get skills
        const skillsText = document.getElementById('skills').value || 'JavaScript, React, Node.js, Python, SQL, Agile Methodology';
        const skillsArray = skillsText.split(',').map(skill => skill.trim());
        
        // Create document
        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    // Header
                    new Paragraph({
                        text: fullName,
                        heading: HeadingLevel.HEADING_1,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 200 }
                    }),
                    new Paragraph({
                        text: jobTitle,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 200 }
                    }),
                    new Paragraph({
                        text: `${email} | ${phone} | ${location}`,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 }
                    }),
                    
                    // Summary
                    new Paragraph({
                        text: "Professional Summary",
                        heading: HeadingLevel.HEADING_2,
                        spacing: { after: 200 }
                    }),
                    new Paragraph({
                        text: summary,
                        spacing: { after: 400 }
                    }),
                    
                    // Skills
                    new Paragraph({
                        text: "Skills",
                        heading: HeadingLevel.HEADING_2,
                        spacing: { after: 200 }
                    }),
                    new Paragraph({
                        children: skillsArray.map(skill => 
                            new TextRun({ text: skill + (skillsArray.indexOf(skill) !== skillsArray.length - 1 ? ', ' : ''), break: 0 })
                        ),
                        spacing: { after: 400 }
                    }),
                    
                    // Experience
                    new Paragraph({
                        text: "Work Experience",
                        heading: HeadingLevel.HEADING_2,
                        spacing: { after: 200 }
                    }),
                    // Add experience items
                    ...getExperienceParagraphs(),
                    
                    // Education
                    new Paragraph({
                        text: "Education",
                        heading: HeadingLevel.HEADING_2,
                        spacing: { after: 200 }
                    }),
                    // Add education items
                    ...getEducationParagraphs()
                ]
            }]
        });

        // Generate and download DOCX
        window.docx.Packer.toBlob(doc).then(blob => {
            saveAs(blob, 'resume.docx');
        });

    } catch (error) {
        console.error('Error generating DOCX:', error);
        alert('Error generating DOCX document. Please try again.');
    }
});

// Helper function to get experience paragraphs for DOCX
function getExperienceParagraphs() {
    const paragraphs = [];
    
    for (let i = 1; i <= experienceCount; i++) {
        const jobTitle = document.getElementById(`jobTitle${i}`)?.value;
        const company = document.getElementById(`company${i}`)?.value;
        const jobDate = document.getElementById(`jobDate${i}`)?.value;
        const jobDescription = document.getElementById(`jobDescription${i}`)?.value;
        
        if (jobTitle || company) {
            if (jobTitle) {
                paragraphs.push(new Paragraph({
                    text: jobTitle,
                    heading: HeadingLevel.HEADING_3,
                    spacing: { after: 100 }
                }));
            }
            
            if (company) {
                paragraphs.push(new Paragraph({
                    text: company,
                    spacing: { after: 100 }
                }));
            }
            
            if (jobDate) {
                paragraphs.push(new Paragraph({
                    text: jobDate,
                    spacing: { after: 100 }
                }));
            }
            
            if (jobDescription) {
                paragraphs.push(new Paragraph({
                    text: jobDescription,
                    spacing: { after: 400 }
                }));
            }
        }
    }
    
    return paragraphs.length > 0 ? paragraphs : [
        new Paragraph({
            text: "No experience added",
            spacing: { after: 400 }
        })
    ];
}

// Helper function to get education paragraphs for DOCX
function getEducationParagraphs() {
    const paragraphs = [];
    
    for (let i = 1; i <= educationCount; i++) {
        const degree = document.getElementById(`degree${i}`)?.value;
        const school = document.getElementById(`school${i}`)?.value;
        const educationDate = document.getElementById(`educationDate${i}`)?.value;
        const educationDescription = document.getElementById(`educationDescription${i}`)?.value;
        
        if (degree || school) {
            if (degree) {
                paragraphs.push(new Paragraph({
                    text: degree,
                    heading: HeadingLevel.HEADING_3,
                    spacing: { after: 100 }
                }));
            }
            
            if (school) {
                paragraphs.push(new Paragraph({
                    text: school,
                    spacing: { after: 100 }
                }));
            }
            
            if (educationDate) {
                paragraphs.push(new Paragraph({
                    text: educationDate,
                    spacing: { after: 100 }
                }));
            }
            
            if (educationDescription) {
                paragraphs.push(new Paragraph({
                    text: educationDescription,
                    spacing: { after: 400 }
                }));
            }
        }
    }
    
    return paragraphs.length > 0 ? paragraphs : [
        new Paragraph({
            text: "No education added",
            spacing: { after: 400 }
        })
    ];
}

// Export HTML
exportHtmlBtn.addEventListener('click', () => {
    try {
        // Get the resume content HTML
        const resumeContent = document.getElementById('resume-content').innerHTML;
        
        // Create complete HTML document
        const htmlDocument = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resume - ${document.getElementById('fullName').value || 'Xolelwa Mazibuko'}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f5f7fb;
        }
        .resume-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            overflow: hidden;
        }
        ${getTemplateStyles()}
        @media print {
            body {
                background: white;
                padding: 0;
            }
            .resume-container {
                box-shadow: none;
                margin: 0;
            }
        }
    </style>
</head>
<body>
    <div class="resume-container">
        ${resumeContent}
    </div>
</body>
</html>`;
        
        // Create and download HTML file
        const blob = new Blob([htmlDocument], { type: 'text/html' });
        saveAs(blob, 'resume.html');
        
    } catch (error) {
        console.error('Error generating HTML:', error);
        alert('Error generating HTML file. Please try again.');
    }
});

// Helper function to get template styles for HTML export
function getTemplateStyles() {
    const currentTemplate = document.querySelector('.template.active').getAttribute('data-template');
    
    const templateStyles = {
        '1': `
            .template-1 .resume-header {
                background: #4361ee;
                color: white;
                padding: 30px;
                text-align: center;
            }
            .template-1 .resume-header h2 {
                color: white;
                font-size: 28px;
                margin-bottom: 5px;
            }
            .template-1 .resume-body {
                padding: 30px;
                display: grid;
                grid-template-columns: 1fr 2fr;
                gap: 30px;
            }
            .template-1 .sidebar-section h3 {
                border-bottom: 2px solid #4361ee;
                padding-bottom: 5px;
                margin-bottom: 10px;
            }
            .template-1 .main-section h3 {
                color: #4361ee;
                border-left: 4px solid #4361ee;
                padding-left: 10px;
                margin-bottom: 10px;
            }
            .skill-level {
                background: #4361ee;
            }`,
        '2': `
            .template-2 .resume-header {
                background: #2a9d8f;
                color: white;
                padding: 30px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .template-2 .resume-header h2 {
                color: white;
                font-size: 28px;
                margin-bottom: 5px;
            }
            .template-2 .resume-body {
                padding: 30px;
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 30px;
            }
            .template-2 .sidebar-section h3 {
                color: #2a9d8f;
                border-bottom: 1px solid #2a9d8f;
                padding-bottom: 5px;
                margin-bottom: 10px;
            }
            .template-2 .main-section h3 {
                color: #2a9d8f;
                margin-bottom: 10px;
            }
            .skill-level {
                background: #2a9d8f;
            }`,
        '3': `
            .template-3 .resume-header {
                background: #e76f51;
                color: white;
                padding: 30px;
            }
            .template-3 .resume-header h2 {
                color: white;
                font-size: 28px;
                margin-bottom: 5px;
            }
            .template-3 .resume-body {
                padding: 30px;
            }
            .template-3 .section-row {
                display: flex;
                margin-bottom: 30px;
            }
            .template-3 .sidebar-section {
                width: 30%;
                margin-right: 30px;
            }
            .template-3 .main-section {
                flex: 1;
            }
            .template-3 .sidebar-section h3 {
                color: #e76f51;
                border-bottom: 1px solid #e76f51;
                padding-bottom: 5px;
                margin-bottom: 10px;
            }
            .template-3 .main-section h3 {
                color: #e76f51;
                border-left: 4px solid #e76f51;
                padding-left: 10px;
                margin-bottom: 10px;
            }
            .skill-level {
                background: #e76f51;
            }`
    };

    // Common styles for all templates
    const commonStyles = `
        .resume-header h2 {
            font-size: 28px;
            margin-bottom: 5px;
        }
        .resume-body {
            padding: 30px;
        }
        .job-item, .education-item {
            margin-bottom: 15px;
        }
        .job-title {
            font-weight: 600;
            color: #212529;
        }
        .company, .school {
            color: #6c757d;
            font-style: italic;
        }
        .date {
            color: #6c757d;
            font-size: 14px;
        }
        .skill-item {
            margin-bottom: 8px;
        }
        .skill-name {
            display: block;
            margin-bottom: 3px;
        }
        .skill-bar {
            height: 8px;
            background: #e9ecef;
            border-radius: 4px;
            overflow: hidden;
        }
        .skill-level {
            height: 100%;
        }
        .with-picture .resume-header {
            display: flex;
            align-items: center;
            text-align: left;
            padding: 30px;
        }
        .with-picture .profile-picture {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            margin-right: 30px;
            border: 4px solid white;
            overflow: hidden;
            flex-shrink: 0;
        }
        .with-picture .profile-picture img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }`;

    return commonStyles + (templateStyles[currentTemplate] || templateStyles['1']);
}

// Generate resume
generateBtn.addEventListener('click', updateResumePreview);

// Reset form with confirmation
resetBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all data? This will remove all saved information from local storage.')) {
        clearAllData();
        alert('All data has been cleared from local storage.');
    }
});

// Add a new button for manual save
const saveBtn = document.createElement('button');
saveBtn.className = 'btn btn-success';
saveBtn.innerHTML = '💾 Save Progress';
saveBtn.addEventListener('click', () => {
    saveAllData();
    alert('Your resume progress has been saved to local storage!');
});

// Add save button to controls
document.querySelector('.controls > div').appendChild(saveBtn);

// Add storage status indicator
const storageStatus = document.createElement('div');
storageStatus.style.cssText = 'font-size: 12px; color: #666; margin-top: 10px;';
storageStatus.innerHTML = '🔒 Your data is saved locally for privacy';
document.querySelector('.sidebar').appendChild(storageStatus);

// Feedback system
feedbackPoorBtn.addEventListener('click', () => {
    alert('Thanks for your feedback! We\'ll use this to improve future resume generations.');
});

feedbackGoodBtn.addEventListener('click', () => {
    alert('Thanks for your feedback! We\'re glad you found the resume generator helpful.');
});

feedbackExcellentBtn.addEventListener('click', () => {
    alert('Thanks for your excellent feedback! We\'re thrilled you love our resume generator.');
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Load saved data
    loadAllData();
    
    // Attach event listeners
    attachEventListeners();
    
    // Auto-save every 30 seconds
    setInterval(saveAllData, 30000);
    
    // Show storage info
    console.log('Resume Generator Pro: Local storage enabled for data privacy');
    console.log('All data is stored locally in your browser and never sent to any server.');
    
    // Initially hide picture upload for non-template-1
    if (currentTemplate !== '1') {
        pictureUploadSection.style.display = 'none';
    }
    
    // Add event listeners for picture functionality
    pictureUpload.addEventListener('change', handlePictureUpload);
    removePictureBtn.addEventListener('click', removePicture);
});