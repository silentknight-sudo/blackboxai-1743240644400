// diagnoseAI Frontend JavaScript

const diagnoseAI = {
    // Authentication Module
    auth: {
        checkAuth() {
            const user = localStorage.getItem('user');
            return !!user;
        },

        async login(email, password) {
            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (data.success) {
                    localStorage.setItem('user', JSON.stringify(data.user));
                    window.location.href = '/dashboard';
                } else {
                    throw new Error(data.message);
                }
            } catch (error) {
                diagnoseAI.ui.showAlert(error.message, 'error');
            }
        },

        logout() {
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
    },

    // Analysis Module
    analysis: {
        async uploadImage(file) {
            try {
                // Show loading overlay
                diagnoseAI.ui.showLoading(true);

                // Create FormData
                const formData = new FormData();
                formData.append('image', file);

                // Upload and analyze image
                const response = await fetch('/api/analyze', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (!result.success) {
                    throw new Error(result.message);
                }

                // Display results
                this.displayResults(result);
                diagnoseAI.ui.showAlert('Analysis completed successfully', 'success');
            } catch (error) {
                diagnoseAI.ui.showAlert(error.message, 'error');
            } finally {
                diagnoseAI.ui.showLoading(false);
            }
        },

        displayResults(results) {
            const resultsContainer = document.getElementById('analysisResults');
            
            // Clear previous results
            resultsContainer.innerHTML = '';

            // Create results HTML
            const resultsHTML = `
                <div class="analysis-card">
                    <h4>Analysis Results</h4>
                    
                    <!-- Quantitative Analysis -->
                    <div class="mb-6">
                        <h5 class="text-lg font-semibold mb-3">Quantitative Analysis</h5>
                        
                        <!-- Risk Scores -->
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div class="bg-blue-50 p-4 rounded-lg">
                                <p class="text-sm text-gray-600">Abnormality Risk</p>
                                <p class="text-2xl font-bold text-blue-600">${results.quantitativeAnalysis.riskScores.abnormalityRisk}%</p>
                            </div>
                            <div class="bg-blue-50 p-4 rounded-lg">
                                <p class="text-sm text-gray-600">Urgency Level</p>
                                <p class="text-2xl font-bold text-blue-600">${results.quantitativeAnalysis.riskScores.urgencyLevel}/3</p>
                            </div>
                            <div class="bg-blue-50 p-4 rounded-lg">
                                <p class="text-sm text-gray-600">Confidence Score</p>
                                <p class="text-2xl font-bold text-blue-600">${results.quantitativeAnalysis.riskScores.confidenceScore}%</p>
                            </div>
                        </div>

                        <!-- Measurements -->
                        <div class="space-y-2">
                            <div class="analysis-stat">
                                <span class="analysis-stat-label">Size:</span>
                                <span class="analysis-stat-value">${results.quantitativeAnalysis.measurements.size}</span>
                            </div>
                            <div class="analysis-stat">
                                <span class="analysis-stat-label">Density:</span>
                                <span class="analysis-stat-value">${results.quantitativeAnalysis.measurements.density}</span>
                            </div>
                            <div class="analysis-stat">
                                <span class="analysis-stat-label">Volume:</span>
                                <span class="analysis-stat-value">${results.quantitativeAnalysis.measurements.volume}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Qualitative Analysis -->
                    <div class="mb-6">
                        <h5 class="text-lg font-semibold mb-3">Qualitative Analysis</h5>
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <pre class="whitespace-pre-wrap text-sm">${results.qualitativeAnalysis.findings}</pre>
                        </div>
                        <p class="mt-2 text-sm text-gray-600">
                            Confidence: ${results.qualitativeAnalysis.confidence}
                        </p>
                    </div>

                    <!-- Recommendations -->
                    <div>
                        <h5 class="text-lg font-semibold mb-3">Recommendations</h5>
                        <div class="space-y-2">
                            <div class="flex items-center">
                                <span class="text-sm font-medium w-24">Priority:</span>
                                <span class="px-2 py-1 rounded text-sm ${
                                    results.recommendations.priority === 'High' 
                                    ? 'bg-red-100 text-red-800' 
                                    : 'bg-green-100 text-green-800'
                                }">${results.recommendations.priority}</span>
                            </div>
                            <div class="flex items-center">
                                <span class="text-sm font-medium w-24">Follow-up:</span>
                                <span class="text-sm">${results.recommendations.followUp}</span>
                            </div>
                            <div>
                                <span class="text-sm font-medium">Additional Tests:</span>
                                <ul class="list-disc list-inside mt-1">
                                    ${results.recommendations.additionalTests.map(test => `
                                        <li class="text-sm">${test}</li>
                                    `).join('')}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Insert results
            resultsContainer.innerHTML = resultsHTML;
        }
    },

    // UI Utilities
    ui: {
        showLoading(show = true) {
            const overlay = document.getElementById('loadingOverlay');
            if (show) {
                overlay.classList.remove('hidden');
            } else {
                overlay.classList.add('hidden');
            }
        },

        showAlert(message, type = 'success') {
            const alertContainer = document.getElementById('alertContainer');
            const alert = document.createElement('div');
            
            alert.className = `alert alert-${type} animate-fadeIn`;
            alert.innerHTML = `
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
                <span>${message}</span>
            `;

            alertContainer.appendChild(alert);

            // Remove alert after 5 seconds
            setTimeout(() => {
                alert.classList.add('animate-fadeOut');
                setTimeout(() => alertContainer.removeChild(alert), 300);
            }, 5000);
        },

        initializeDropZone() {
            const dropZone = document.getElementById('dropZone');
            const fileInput = dropZone.querySelector('input[type="file"]');

            // Handle drag and drop events
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                dropZone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                });
            });

            ['dragenter', 'dragover'].forEach(eventName => {
                dropZone.addEventListener(eventName, () => {
                    dropZone.classList.add('drag-over');
                });
            });

            ['dragleave', 'drop'].forEach(eventName => {
                dropZone.addEventListener(eventName, () => {
                    dropZone.classList.remove('drag-over');
                });
            });

            // Handle file drop
            dropZone.addEventListener('drop', (e) => {
                const file = e.dataTransfer.files[0];
                if (file) {
                    diagnoseAI.analysis.uploadImage(file);
                }
            });

            // Handle file input change
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    diagnoseAI.analysis.uploadImage(file);
                }
            });
        }
    }
};

// Initialize UI components when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize dropzone if it exists
    const dropZone = document.getElementById('dropZone');
    if (dropZone) {
        diagnoseAI.ui.initializeDropZone();
    }

    // Initialize login form if it exists
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            await diagnoseAI.auth.login(email, password);
        });
    }
});