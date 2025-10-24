/**
 * Sprint 1A Deployment Validation
 * Validates Event Tracking API is working in production
 * 
 * Run after deployment to verify:
 * 1. Event API endpoints are accessible
 * 2. Events can be tracked successfully
 * 3. Response times meet acceptance criteria
 * 4. No regressions in existing features
 */

const BASE_URL = 'https://r-dagent-production.up.railway.app';

async function validateEventAPI() {
    console.log('\n🔍 SPRINT 1A DEPLOYMENT VALIDATION');
    console.log('=' .repeat(70));
    
    const results = {
        passed: [],
        failed: [],
        warnings: []
    };
    
    // Test 1: Track single event
    console.log('\n📋 Test 1: Track Single Event');
    try {
        const startTime = Date.now();
        const response = await fetch(`${BASE_URL}/api/v1/events/track`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-ID': 'deployment_test_user'
            },
            body: JSON.stringify({
                user_id: 'deployment_test_user',
                pmid: '12345678',
                event_type: 'open',
                meta: { source: 'deployment_validation' },
                session_id: 'test_session_' + Date.now()
            })
        });
        
        const elapsed = Date.now() - startTime;
        
        if (response.ok) {
            const data = await response.json();
            console.log(`✅ Event tracked successfully in ${elapsed}ms`);
            console.log(`   Event ID: ${data.id}`);
            
            if (elapsed < 80) {
                results.passed.push('Single event tracking performance (<80ms)');
            } else {
                results.warnings.push(`Single event tracking took ${elapsed}ms (target: <80ms)`);
            }
            
            results.passed.push('Single event tracking functionality');
        } else {
            console.log(`❌ Failed with status ${response.status}`);
            results.failed.push('Single event tracking');
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        results.failed.push('Single event tracking - ' + error.message);
    }
    
    // Test 2: Track batch events
    console.log('\n📋 Test 2: Track Batch Events');
    try {
        const events = Array.from({ length: 10 }, (_, i) => ({
            user_id: 'deployment_test_user',
            pmid: `pmid_${i}`,
            event_type: 'save',
            meta: { batch: true, index: i }
        }));
        
        const startTime = Date.now();
        const response = await fetch(`${BASE_URL}/api/v1/events/track/batch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-ID': 'deployment_test_user'
            },
            body: JSON.stringify({ events })
        });
        
        const elapsed = Date.now() - startTime;
        
        if (response.ok) {
            const data = await response.json();
            console.log(`✅ Batch tracked successfully in ${elapsed}ms`);
            console.log(`   Events created: ${data.events_created}`);
            
            if (elapsed < 200) {
                results.passed.push('Batch event tracking performance (<200ms)');
            } else {
                results.warnings.push(`Batch tracking took ${elapsed}ms (target: <200ms)`);
            }
            
            results.passed.push('Batch event tracking functionality');
        } else {
            console.log(`❌ Failed with status ${response.status}`);
            results.failed.push('Batch event tracking');
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        results.failed.push('Batch event tracking - ' + error.message);
    }
    
    // Test 3: Get user events
    console.log('\n📋 Test 3: Get User Events');
    try {
        const response = await fetch(
            `${BASE_URL}/api/v1/events/user/deployment_test_user?limit=10`,
            {
                headers: {
                    'User-ID': 'deployment_test_user'
                }
            }
        );
        
        if (response.ok) {
            const events = await response.json();
            console.log(`✅ Retrieved ${events.length} events`);
            results.passed.push('Get user events functionality');
        } else {
            console.log(`❌ Failed with status ${response.status}`);
            results.failed.push('Get user events');
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        results.failed.push('Get user events - ' + error.message);
    }
    
    // Test 4: Get user stats
    console.log('\n📋 Test 4: Get User Stats');
    try {
        const response = await fetch(
            `${BASE_URL}/api/v1/events/user/deployment_test_user/stats?days_back=1`,
            {
                headers: {
                    'User-ID': 'deployment_test_user'
                }
            }
        );
        
        if (response.ok) {
            const stats = await response.json();
            console.log(`✅ User stats retrieved`);
            console.log(`   Total events: ${stats.total_events}`);
            console.log(`   Unique papers: ${stats.unique_papers}`);
            results.passed.push('Get user stats functionality');
        } else {
            console.log(`❌ Failed with status ${response.status}`);
            results.failed.push('Get user stats');
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        results.failed.push('Get user stats - ' + error.message);
    }
    
    // Test 5: Verify no regression in existing endpoints
    console.log('\n📋 Test 5: Regression Check - Existing Endpoints');
    try {
        const response = await fetch(`${BASE_URL}/api/test-app`);
        
        if (response.ok) {
            const data = await response.json();
            console.log(`✅ Existing endpoints still working`);
            console.log(`   Status: ${data.status}`);
            results.passed.push('No regression in existing endpoints');
        } else {
            console.log(`❌ Failed with status ${response.status}`);
            results.failed.push('Regression detected in existing endpoints');
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        results.failed.push('Regression check - ' + error.message);
    }
    
    // Test 6: Capture rate monitoring endpoint
    console.log('\n📋 Test 6: Capture Rate Monitoring');
    try {
        const response = await fetch(
            `${BASE_URL}/api/v1/events/monitoring/capture-rate?minutes_back=60`
        );
        
        if (response.ok) {
            const data = await response.json();
            console.log(`✅ Capture rate monitoring working`);
            console.log(`   Total events (last 60 min): ${data.total_events}`);
            results.passed.push('Capture rate monitoring');
        } else {
            console.log(`❌ Failed with status ${response.status}`);
            results.failed.push('Capture rate monitoring');
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        results.failed.push('Capture rate monitoring - ' + error.message);
    }
    
    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 DEPLOYMENT VALIDATION SUMMARY');
    console.log('='.repeat(70));
    
    console.log(`\n✅ Passed: ${results.passed.length}`);
    results.passed.forEach(test => console.log(`   ✅ ${test}`));
    
    if (results.warnings.length > 0) {
        console.log(`\n⚠️  Warnings: ${results.warnings.length}`);
        results.warnings.forEach(warning => console.log(`   ⚠️  ${warning}`));
    }
    
    if (results.failed.length > 0) {
        console.log(`\n❌ Failed: ${results.failed.length}`);
        results.failed.forEach(test => console.log(`   ❌ ${test}`));
    }
    
    console.log('\n' + '='.repeat(70));
    
    if (results.failed.length === 0) {
        console.log('✅ SPRINT 1A DEPLOYMENT SUCCESSFUL');
        console.log('🚀 Event Tracking API is live and operational');
        console.log('\n📋 Next Steps:');
        console.log('   1. Monitor event capture rate over next 24 hours');
        console.log('   2. Proceed with Sprint 1B: Vector Store & Candidate API');
    } else {
        console.log('❌ DEPLOYMENT VALIDATION FAILED');
        console.log('⚠️  Please investigate failed tests before proceeding');
    }
    
    console.log('='.repeat(70) + '\n');
    
    return results.failed.length === 0;
}

// Run validation
validateEventAPI().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('❌ Validation script error:', error);
    process.exit(1);
});

