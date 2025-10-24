/**
 * Project Access Test - Find available projects and test reports access
 */

class ProjectAccessTest {
    constructor() {
        this.frontendUrl = window.location.origin;
        this.testUser = {
            email: 'fredericle77@gmail.com',
            userId: 'e29e29d3-f87f-4c70-9aeb-424002382195'
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const styles = {
            'info': 'color: #2196F3; font-weight: bold;',
            'success': 'color: #4CAF50; font-weight: bold;',
            'error': 'color: #F44336; font-weight: bold;',
            'warning': 'color: #FF9800; font-weight: bold;'
        };
        
        const prefix = {
            'info': '📋',
            'success': '✅',
            'error': '❌',
            'warning': '⚠️'
        }[type] || '📋';
        
        console.log(`%c${prefix} [${timestamp.split('T')[1].split('.')[0]}] ${message}`, styles[type] || styles.info);
    }

    async makeRequest(endpoint, method = 'GET') {
        try {
            const response = await fetch(`${this.frontendUrl}/api/proxy${endpoint}`, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': this.testUser.userId
                }
            });

            let responseData;
            try {
                responseData = await response.json();
            } catch (parseError) {
                responseData = { error: 'Failed to parse response as JSON' };
            }
            
            return {
                ok: response.ok,
                status: response.status,
                data: responseData
            };
        } catch (error) {
            return {
                ok: false,
                status: 0,
                error: error.message
            };
        }
    }

    async testProjectAccess() {
        this.log('🔍 TESTING PROJECT ACCESS', 'info');
        
        // Get user's projects
        const projectsResult = await this.makeRequest('/projects?user_id=' + this.testUser.email);
        
        if (projectsResult.ok && projectsResult.data) {
            const projects = Array.isArray(projectsResult.data) ? projectsResult.data : [];
            this.log(`Found ${projects.length} accessible projects`, projects.length > 0 ? 'success' : 'warning');
            
            if (projects.length > 0) {
                // Show first few projects
                projects.slice(0, 3).forEach((project, index) => {
                    this.log(`Project ${index + 1}: ${project.project_id} - "${project.title}"`, 'info');
                });
                
                // Test reports access for first project
                const firstProject = projects[0];
                this.log(`Testing reports access for project: ${firstProject.project_id}`, 'info');
                
                const reportsResult = await this.makeRequest(`/projects/${firstProject.project_id}/reports`);
                
                if (reportsResult.ok) {
                    const reports = Array.isArray(reportsResult.data) ? reportsResult.data : [];
                    this.log(`✅ Reports access successful! Found ${reports.length} reports`, 'success');
                    
                    if (reports.length > 0) {
                        reports.slice(0, 2).forEach((report, index) => {
                            this.log(`Report ${index + 1}: ${report.report_id} - "${report.title}"`, 'info');
                        });
                    }
                    
                    return {
                        success: true,
                        projectId: firstProject.project_id,
                        projectTitle: firstProject.title,
                        reportCount: reports.length,
                        reports: reports.slice(0, 2)
                    };
                } else {
                    this.log(`❌ Reports access failed: ${reportsResult.status}`, 'error');
                    return {
                        success: false,
                        projectId: firstProject.project_id,
                        error: reportsResult.status
                    };
                }
            } else {
                this.log('❌ No accessible projects found', 'error');
                return { success: false, error: 'No projects found' };
            }
        } else {
            this.log(`❌ Failed to fetch projects: ${projectsResult.status}`, 'error');
            return { success: false, error: projectsResult.status };
        }
    }

    async testSpecificProject(projectId) {
        this.log(`🔍 TESTING SPECIFIC PROJECT: ${projectId}`, 'info');
        
        // Test project access
        const projectResult = await this.makeRequest(`/projects/${projectId}`);
        
        if (projectResult.ok) {
            this.log(`✅ Project access successful: "${projectResult.data.title}"`, 'success');
            
            // Test reports access
            const reportsResult = await this.makeRequest(`/projects/${projectId}/reports`);
            
            if (reportsResult.ok) {
                const reports = Array.isArray(reportsResult.data) ? reportsResult.data : [];
                this.log(`✅ Reports access successful! Found ${reports.length} reports`, 'success');
                return { success: true, reportCount: reports.length };
            } else {
                this.log(`❌ Reports access failed: ${reportsResult.status}`, 'error');
                return { success: false, error: reportsResult.status };
            }
        } else {
            this.log(`❌ Project access failed: ${projectResult.status}`, 'error');
            return { success: false, error: projectResult.status };
        }
    }

    async runTest() {
        console.log('🔍 STARTING PROJECT ACCESS TEST');
        console.log('='.repeat(60));
        console.log(`User: ${this.testUser.email}`);
        console.log(`User ID: ${this.testUser.userId}`);
        console.log('='.repeat(60));

        // Test general project access
        const generalResult = await this.testProjectAccess();
        
        if (generalResult.success) {
            this.log('🎉 PROJECT ACCESS TEST SUCCESSFUL!', 'success');
            this.log(`Working Project ID: ${generalResult.projectId}`, 'success');
            this.log(`Project Title: ${generalResult.projectTitle}`, 'info');
            this.log(`Report Count: ${generalResult.reportCount}`, 'info');
            
            console.log('\n🎯 RECOMMENDED ACTIONS:');
            console.log(`1. Use this project ID for testing: ${generalResult.projectId}`);
            console.log(`2. Navigate to: ${this.frontendUrl}/projects/${generalResult.projectId}`);
            console.log('3. Re-run the PhD Complete Test from the project page');
            
            return generalResult;
        } else {
            this.log('❌ PROJECT ACCESS TEST FAILED', 'error');
            
            // Test the specific project that was failing
            this.log('Testing the original project ID...', 'info');
            const specificResult = await this.testSpecificProject('5ac213d7-6fcc-46ff-9420-5c7f4b421012');
            
            console.log('\n🎯 NEXT STEPS:');
            if (specificResult.success) {
                console.log('• The original project ID works - there may have been a temporary issue');
                console.log('• Try the PhD Complete Test again');
            } else {
                console.log('• The original project ID is not accessible');
                console.log('• Use the project access test to find a working project');
                console.log('• Update the PhD test with a valid project ID');
            }
            
            return specificResult;
        }
    }
}

// Auto-run the test
console.log('🔍 Starting Project Access Test...');
const projectAccessTest = new ProjectAccessTest();
projectAccessTest.runTest().then(result => {
    console.log('\n🏁 PROJECT ACCESS TEST COMPLETE!');
    if (result.success) {
        console.log('✅ Found working project for PhD testing!');
    } else {
        console.log('⚠️ Need to resolve project access issues');
    }
}).catch(error => {
    console.error('❌ Project access test failed:', error);
});
