// Main JavaScript for diagnose.ai

// DOM Elements Cache
const elements = {
    loginForm: document.getElementById('loginForm'),
    uploadForm: document.getElementById('uploadForm'),
    imagePreview: document.getElementById('imagePreview'),
    analysisResults: document.getElementById('analysisResults'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    sidebarToggle: document.getElementById('sidebarToggle'),
    sidebar: document.getElementById('sidebar'),
    alertContainer: document.getElementById('alertContainer'),
    dropZone: document.getElementById('dropZone')
};

// State Management
const state = {
    isAuthenticated: false,
    currentUser: null,
    isLoading: false,
    currentAnalysis: null
};

// Utility Functions
const utils = {
    showLoading: () => {
        if (elements.loadingOverlay) {
            elements.loadingOverlay.classList.remove('hidden');
        }
        state.isLoading = true;
    },

    hideLoading: () => {
        if (elements.loadingOverlay) {
            elements.loadingOverlay.classList.add('hidden');
        }
        state.isLoading = false;
    },

    showAlert: (message, type = 'error') => {
        if (!elements.alertContainer) return;

        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} animate-fadeIn`;
        alertDiv.textContent = message;

        elements.alertContainer.appendChild(alertDiv);

        // Auto-remove alert after 5 seconds
        setTimeout(() => {
            alertDiv.classList.add('animate-fadeOut');
            setTimeout(() => alertDiv.remove(), 300);
        }, 5000);
    },

    formatNumber: (num) => {
        return new Intl.NumberFormat('en-US', {
            maximumFractionDigits: 1
        }).format(num);
    },

    createMetricCard: (value, label, icon) => {
        return `
            <div class="metric-card">
                <div class="flex items-center justify-between">
                    <div>
                        <div class="metric-value">${value}</div>
                        <div class="metric-label">${label}</div>
                    </div>
                    <i class="${icon} text-2xl text-blue-500"></i>
                </div>
            </div>
        `;
    }
};

// Authentication Functions
const auth = {
    login: async (email, password) => {
        try {
            utils.showLoading();
            
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                state.isAuthenticated = true;
                state.currentUser = data.user;
                localStorage.setItem('user', JSON.stringify(data.user));
                window.location.href = '/dashboard';
            } else {
                utils.showAlert(data.message);
            }
        } catch (error) {
            utils.showAlert('Login failed. Please try again.');
            console.error('Login error:', error);
        } finally {
            utils.hideLoading();
        }
    },

    logout: () => {
        localStorage.removeItem('user');
        state.isAuthenticated = false;
        state.currentUser = null;
        window.location.href = '/login';
    },

    checkAuth: () => {
        const user = localStorage.getItem('user');
        if (user) {
            state.currentUser = JSON.parse(user);
            state.isAuthenticated = true;
            return true;
        }
        return false;
    }
};

// Image Analysis Functions
const analysis = {
    uploadImage: async (file) => {
        try {
            utils.showLoading();

            const formData = new FormData();
            formData.append('image', file);

            const response = await fetch('/api/analyze', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                state.currentAnalysis = data;
                analysis.displayResults(data);
            } else {
                utils.showAlert(data.message);
            }
        } catch (error) {
            utils.showAlert('Image analysis failed. Please try again.');
            console.error('Analysis error:', error);
        } finally {
            utils.hideLoading();
        }
    },

    displayResults: (results) => {
        if (!elements.analysisResults) return;

        const {
            quantitativeAnalysis,
            qualitativeAnalysis,
            threeDModel,
            recommendations
        } = results;

        // Update UI with analysis results
        elements.analysisResults.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- Quantitative Analysis -->
                <div class="analysis-section">
                    <h3 class="analysis-header">Quantitative Analysis</h3>
                    <div class="grid grid-cols-1 gap-4">
                        ${utils.createMetricCard(
                            quantitativeAnalysis.riskScores.abnormalityRisk + '%',
                            'Abnormality Risk',
                            'fas fa-chart-line'
                        )}
                        ${utils.createMetricCard(
                            quantitativeAnalysis.measurements.size,
                            'Size',
                            'fas fa-ruler'
                        )}
                        ${utils.createMetricCard(
                            quantitativeAnalysis.measurements.density + ' HU',
                            'Density',
                            'fas fa-tachometer-alt'
                        )}
                    </div>
                </div>

                <!-- Qualitative Analysis -->
                <div class="analysis-section">
                    <h3 class="analysis-header">AI Insights</h3>
                    <div class="prose prose-blue">
                        ${qualitativeAnalysis.findings}
                    </div>
                    <div class="mt-4 text-sm text-gray-500">
                        Confidence: ${qualitativeAnalysis.confidence}
                    </div>
                </div>

                <!-- Recommendations -->
                <div class="analysis-section">
                    <h3 class="analysis-header">Recommendations</h3>
                    <div class="space-y-4">
                        <div class="flex items-center">
                            <span class="text-${recommendations.priority === 'High' ? 'red' : 'green'}-500 font-semibold">
                                Priority: ${recommendations.priority}
                            </span>
                        </div>
                        <div>
                            <p class="text-gray-700">Follow-up: ${recommendations.followUp}</p>
                        </div>
                        <div>
                            <p class="font-semibold">Additional Tests:</p>
                            <ul class="list-disc list-inside text-gray-700">
                                ${recommendations.additionalTests.map(test => `<li>${test}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 3D Model Preview -->
            <div class="mt-8">
                <h3 class="analysis-header">3D Model Preview</h3>
                <div class="model-viewer">
                    <img src="${threeDModel.previewUrl}" alt="3D Model Preview" class="w-full h-full object-cover">
                    <div class="model-controls">
                        <button class="btn-secondary">
                            <i class="fas fa-cube mr-2"></i>View in 3D
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Login Form Handler
    if (elements.loginForm) {
        elements.loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = e.target.email.value;
            const password = e.target.password.value;
            await auth.login(email, password);
        });
    }

    // Image Upload Handler
    if (elements.uploadForm) {
        elements.uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const file = e.target.image.files[0];
            if (file) {
                await analysis.uploadImage(file);
            }
        });
    }

    // Drag and Drop Handler
    if (elements.dropZone) {
        elements.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            elements.dropZone.classList.add('dragging');
        });

        elements.dropZone.addEventListener('dragleave', () => {
            elements.dropZone.classList.remove('dragging');
        });

        elements.dropZone.addEventListener('drop', async (e) => {
            e.preventDefault();
            elements.dropZone.classList.remove('dragging');
            
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                await analysis.uploadImage(file);
            } else {
                utils.showAlert('Please upload a valid image file.');
            }
        });
    }

    // Sidebar Toggle
    if (elements.sidebarToggle && elements.sidebar) {
        elements.sidebarToggle.addEventListener('click', () => {
            elements.sidebar.classList.toggle('open');
        });
    }

    // Check Authentication on Protected Pages
    if (window.location.pathname === '/dashboard') {
        if (!auth.checkAuth()) {
            window.location.href = '/login';
        }
    }
});

// Export modules for potential reuse
window.diagnoseAI = {
    auth,
    analysis,
    utils,
    state
};