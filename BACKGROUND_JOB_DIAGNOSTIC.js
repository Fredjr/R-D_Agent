/**
 * BACKGROUND JOB DIAGNOSTIC v1.0
 * 
 * Comprehensive test for background job system issues
 * Tests job creation, status tracking, and database persistence
 */

class BackgroundJobDiagnostic {
    constructor() {
        this.baseUrl = 'https://frontend-psi-seven-85.vercel.app';
        this.testUserId = 'fredericle77@gmail.com';
        this.testProjectId = '5ac213d7-6fcc-46ff-9420-5c7f4b421012';
        this.results = [];
        this.startTime = Date.now();
    }

    log(message, type = 'info', data = null) {
        const timestamp = new Date().toISOString();
        const elapsed = Date.now() - this.startTime;
        console.log(`${type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'} [${timestamp}] ${message}`);
        if (data) console.log('Data:', data);
        this.results.push({ timestamp, type, message, data, elapsed });
    }

    async testBackgroundJobCreation() {
        this.log('🔧 TESTING BACKGROUND JOB CREATION', 'info');
        
        const tests = [
            {
                name: 'Generate Review Background Job',
                endpoint: '/api/proxy/background-jobs/generate-review',
                body: {
                    project_id: this.testProjectId,
                    user_id: this.testUserId,
                    parameters: {
                        focus_areas: ['methodology', 'results'],
                        max_papers: 10
                    }
                }
            },
            {
                name: 'Deep Dive Background Job',
                endpoint: '/api/proxy/background-jobs/deep-dive',
                body: {
                    project_id: this.testProjectId,
                    user_id: this.testUserId,
                    query: 'machine learning applications',
                    parameters: {
                        depth: 'comprehensive',
                        max_papers: 15
                    }
                }
            }
        ];

        for (const test of tests) {
            this.log(`🧪 Testing ${test.name}...`, 'info');
            
            try {
                const response = await fetch(test.endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-ID': this.testUserId
                    },
                    body: JSON.stringify(test.body)
                });

                const data = await response.json();
                
                if (response.ok) {
                    this.log(`✅ ${test.name} - Response received`, 'success', {
                        status: response.status,
                        success: data.success,
                        job_id: data.job_id,
                        status_field: data.status,
                        poll_url: data.poll_url,
                        hasJobId: !!data.job_id,
                        dataKeys: Object.keys(data)
                    });

                    // Test job status if we have a job_id
                    if (data.job_id) {
                        await this.testJobStatus(data.job_id, test.name);
                    } else {
                        this.log(`⚠️ ${test.name} - No job_id returned despite success=true`, 'error');
                    }
                } else {
                    this.log(`❌ ${test.name} - Failed`, 'error', {
                        status: response.status,
                        error: data
                    });
                }
            } catch (error) {
                this.log(`❌ ${test.name} - Error`, 'error', { error: error.message });
            }
        }
    }

    async testJobStatus(jobId, jobName) {
        this.log(`🔍 Testing job status for ${jobName} (ID: ${jobId})`, 'info');
        
        try {
            const response = await fetch(`/api/proxy/background-jobs/${jobId}/status`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': this.testUserId
                }
            });

            const data = await response.json();
            
            if (response.ok) {
                this.log(`✅ Job status retrieved for ${jobName}`, 'success', {
                    job_id: data.job_id,
                    status: data.status,
                    progress: data.progress,
                    created_at: data.created_at,
                    updated_at: data.updated_at
                });
            } else {
                this.log(`❌ Job status failed for ${jobName}`, 'error', {
                    status: response.status,
                    error: data
                });
            }
        } catch (error) {
            this.log(`❌ Job status error for ${jobName}`, 'error', { error: error.message });
        }
    }

    async testDirectBackendEndpoints() {
        this.log('🔧 TESTING DIRECT BACKEND ENDPOINTS', 'info');
        
        // Test if backend endpoints exist
        const backendTests = [
            '/background-jobs/generate-review',
            '/background-jobs/deep-dive',
            '/health'
        ];

        for (const endpoint of backendTests) {
            try {
                const response = await fetch(`https://r-dagent-production.up.railway.app${endpoint}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                this.log(`Backend ${endpoint}: ${response.status}`, response.ok ? 'success' : 'error');
            } catch (error) {
                this.log(`Backend ${endpoint}: Error`, 'error', { error: error.message });
            }
        }
    }

    async runComprehensiveDiagnostic() {
        this.log('🚀 STARTING BACKGROUND JOB COMPREHENSIVE DIAGNOSTIC', 'info');
        
        await this.testBackgroundJobCreation();
        await this.testDirectBackendEndpoints();
        
        this.log('📊 BACKGROUND JOB DIAGNOSTIC COMPLETED', 'info');
        this.log(`⏱️ Total Duration: ${Date.now() - this.startTime}ms`, 'info');
        
        // Store results globally
        window.backgroundJobDiagnosticResults = {
            results: this.results,
            summary: this.generateSummary()
        };
        
        return window.backgroundJobDiagnosticResults;
    }

    generateSummary() {
        const jobCreationTests = this.results.filter(r => r.message.includes('Response received'));
        const successfulJobs = jobCreationTests.filter(r => r.type === 'success');
        const jobsWithId = jobCreationTests.filter(r => r.data?.hasJobId);
        
        return {
            totalJobTests: jobCreationTests.length,
            successfulJobCreation: successfulJobs.length,
            jobsWithValidId: jobsWithId.length,
            mainIssue: jobsWithId.length === 0 ? 'No jobs returning job_id' : 'Jobs working normally',
            recommendation: jobsWithId.length === 0 ? 
                'Backend database issue - jobs created but job_id not returned' : 
                'Background job system working correctly'
        };
    }
}

// Auto-load
console.log('🔧 Background Job Diagnostic v1.0 loaded');
console.log('📋 Usage: const diagnostic = new BackgroundJobDiagnostic(); await diagnostic.runComprehensiveDiagnostic();');
window.BackgroundJobDiagnostic = BackgroundJobDiagnostic;
