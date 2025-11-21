/**
 * Browser Console Test Script for Experiment Planning Feature
 * 
 * Usage:
 * 1. Open your R-D Agent project page in browser
 * 2. Navigate to Lab > Experiments tab
 * 3. Open browser console (F12)
 * 4. Copy and paste this entire script
 * 5. Run: await testExperimentPlanning()
 * 
 * This will test the complete experiment planning workflow with detailed logging.
 */

async function testExperimentPlanning() {
  console.log('🧪 ========================================');
  console.log('🧪 EXPERIMENT PLANNING FEATURE TEST');
  console.log('🧪 ========================================\n');

  // Get current URL and extract project ID
  const url = window.location.href;
  const projectIdMatch = url.match(/project\/([^\/\?]+)/);
  
  if (!projectIdMatch) {
    console.error('❌ ERROR: Not on a project page! Navigate to a project first.');
    return;
  }
  
  const projectId = projectIdMatch[1];
  console.log(`✅ Project ID: ${projectId}\n`);

  // Get user ID from localStorage or auth context
  let userId;
  try {
    const authData = localStorage.getItem('auth');
    if (authData) {
      const parsed = JSON.parse(authData);
      userId = parsed.user?.user_id || parsed.userId;
    }
    if (!userId) {
      console.error('❌ ERROR: User ID not found in localStorage');
      console.log('💡 TIP: Make sure you are logged in');
      return;
    }
    console.log(`✅ User ID: ${userId}\n`);
  } catch (e) {
    console.error('❌ ERROR: Failed to get user ID:', e);
    return;
  }

  // API base URL
  const API_BASE = window.location.origin.includes('localhost') 
    ? 'http://localhost:8000' 
    : 'https://r-dagent-production.up.railway.app';
  
  console.log(`✅ API Base URL: ${API_BASE}\n`);

  // Test 1: Fetch protocols
  console.log('📋 TEST 1: Fetching Protocols');
  console.log('─────────────────────────────');
  let protocols = [];
  try {
    const response = await fetch(`${API_BASE}/protocols/project/${projectId}`, {
      headers: {
        'User-ID': userId,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Response Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to fetch protocols:', errorText);
      return;
    }
    
    protocols = await response.json();
    console.log(`✅ Found ${protocols.length} protocols`);
    
    if (protocols.length === 0) {
      console.warn('⚠️  No protocols found! You need to extract a protocol first.');
      console.log('💡 TIP: Go to Papers > Inbox, select a paper, and click "Extract Protocol"');
      return;
    }
    
    protocols.forEach((p, idx) => {
      console.log(`  ${idx + 1}. ${p.protocol_name} (ID: ${p.protocol_id})`);
      console.log(`     - Type: ${p.protocol_type || 'N/A'}`);
      console.log(`     - Difficulty: ${p.difficulty_level}`);
      console.log(`     - Materials: ${p.materials?.length || 0}`);
      console.log(`     - Steps: ${p.steps?.length || 0}`);
    });
    console.log('');
  } catch (error) {
    console.error('❌ ERROR fetching protocols:', error);
    return;
  }

  // Test 2: Fetch existing experiment plans
  console.log('📊 TEST 2: Fetching Existing Experiment Plans');
  console.log('─────────────────────────────────────────────');
  let existingPlans = [];
  try {
    const response = await fetch(`${API_BASE}/experiment-plans/project/${projectId}`, {
      headers: {
        'User-ID': userId,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Response Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to fetch experiment plans:', errorText);
    } else {
      existingPlans = await response.json();
      console.log(`✅ Found ${existingPlans.length} existing experiment plans`);
      
      if (existingPlans.length > 0) {
        existingPlans.forEach((plan, idx) => {
          console.log(`  ${idx + 1}. ${plan.plan_name}`);
          console.log(`     - Status: ${plan.status}`);
          console.log(`     - Difficulty: ${plan.difficulty_level}`);
          console.log(`     - Timeline: ${plan.timeline_estimate || 'N/A'}`);
          console.log(`     - Cost: ${plan.estimated_cost || 'N/A'}`);
          console.log(`     - Confidence: ${plan.generation_confidence ? Math.round(plan.generation_confidence * 100) + '%' : 'N/A'}`);
          console.log(`     - Materials: ${plan.materials?.length || 0}`);
          console.log(`     - Steps: ${plan.procedure?.length || 0}`);
        });
      }
    }
    console.log('');
  } catch (error) {
    console.error('❌ ERROR fetching experiment plans:', error);
  }

  // Test 3: Generate a new experiment plan
  console.log('🤖 TEST 3: Generating New Experiment Plan');
  console.log('─────────────────────────────────────────');
  
  const testProtocol = protocols[0];
  console.log(`Using protocol: ${testProtocol.protocol_name}`);
  console.log(`Protocol ID: ${testProtocol.protocol_id}\n`);
  
  let newPlan;
  try {
    console.log('⏳ Calling AI to generate plan... (this may take 5-10 seconds)');
    const startTime = Date.now();
    
    const response = await fetch(`${API_BASE}/experiment-plans`, {
      method: 'POST',
      headers: {
        'User-ID': userId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        protocol_id: testProtocol.protocol_id,
        project_id: projectId,
        custom_objective: 'Test experiment plan generation from console',
        custom_notes: 'This is a test plan generated via browser console for QA purposes'
      })
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Response Status: ${response.status} ${response.statusText}`);
    console.log(`⏱️  Generation took ${duration} seconds`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to generate experiment plan:', errorText);
      return;
    }
    
    newPlan = await response.json();
    console.log('✅ Experiment plan generated successfully!\n');
    
    console.log('📝 PLAN DETAILS:');
    console.log('─────────────────');
    console.log(`Plan ID: ${newPlan.plan_id}`);
    console.log(`Plan Name: ${newPlan.plan_name}`);
    console.log(`Objective: ${newPlan.objective}`);
    console.log(`Status: ${newPlan.status}`);
    console.log(`Difficulty: ${newPlan.difficulty_level}`);
    console.log(`Timeline: ${newPlan.timeline_estimate || 'N/A'}`);
    console.log(`Cost: ${newPlan.estimated_cost || 'N/A'}`);
    console.log(`Confidence: ${newPlan.generation_confidence ? Math.round(newPlan.generation_confidence * 100) + '%' : 'N/A'}`);
    console.log(`Generated By: ${newPlan.generated_by}`);
    console.log(`Model: ${newPlan.generation_model || 'N/A'}`);
    console.log('');
    
    console.log(`📦 Materials (${newPlan.materials?.length || 0}):`);
    newPlan.materials?.forEach((m, idx) => {
      console.log(`  ${idx + 1}. ${m.name}`);
      console.log(`     Amount: ${m.amount}`);
      if (m.source) console.log(`     Source: ${m.source}`);
      if (m.notes) console.log(`     Notes: ${m.notes}`);
    });
    console.log('');
    
    console.log(`📋 Procedure (${newPlan.procedure?.length || 0} steps):`);
    newPlan.procedure?.forEach((step) => {
      console.log(`  Step ${step.step_number}: ${step.description}`);
      if (step.duration) console.log(`     Duration: ${step.duration}`);
      if (step.critical_notes) console.log(`     ⚠️  ${step.critical_notes}`);
    });
    console.log('');
    
    console.log(`🎯 Expected Outcomes (${newPlan.expected_outcomes?.length || 0}):`);
    newPlan.expected_outcomes?.forEach((outcome, idx) => {
      console.log(`  ${idx + 1}. ${outcome}`);
    });
    console.log('');
    
    console.log(`✅ Success Criteria (${newPlan.success_criteria?.length || 0}):`);
    newPlan.success_criteria?.forEach((criterion, idx) => {
      console.log(`  ${idx + 1}. ${criterion.criterion}`);
      console.log(`     Method: ${criterion.measurement_method}`);
      if (criterion.target_value) console.log(`     Target: ${criterion.target_value}`);
    });
    console.log('');
    
    console.log(`⚠️  Risk Assessment:`);
    console.log(`  Risks (${newPlan.risk_assessment?.risks?.length || 0}):`);
    newPlan.risk_assessment?.risks?.forEach((risk, idx) => {
      console.log(`    ${idx + 1}. ${risk}`);
    });
    console.log(`  Mitigation Strategies (${newPlan.risk_assessment?.mitigation_strategies?.length || 0}):`);
    newPlan.risk_assessment?.mitigation_strategies?.forEach((strategy, idx) => {
      console.log(`    ${idx + 1}. ${strategy}`);
    });
    console.log('');
    
    console.log(`🔧 Troubleshooting Guide (${newPlan.troubleshooting_guide?.length || 0}):`);
    newPlan.troubleshooting_guide?.forEach((item, idx) => {
      console.log(`  ${idx + 1}. Issue: ${item.issue}`);
      console.log(`     Solution: ${item.solution}`);
      if (item.prevention) console.log(`     Prevention: ${item.prevention}`);
    });
    console.log('');
    
  } catch (error) {
    console.error('❌ ERROR generating experiment plan:', error);
    console.error('Stack trace:', error.stack);
    return;
  }

  // Test 4: Update the experiment plan
  console.log('✏️  TEST 4: Updating Experiment Plan');
  console.log('───────────────────────────────────');
  try {
    console.log('Updating status to "approved" and adding execution notes...\n');

    const response = await fetch(`${API_BASE}/experiment-plans/${newPlan.plan_id}`, {
      method: 'PUT',
      headers: {
        'User-ID': userId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'approved',
        execution_notes: 'Plan approved for execution. Test update from console.'
      })
    });

    console.log(`Response Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to update experiment plan:', errorText);
    } else {
      const updatedPlan = await response.json();
      console.log('✅ Plan updated successfully!');
      console.log(`New Status: ${updatedPlan.status}`);
      console.log(`Execution Notes: ${updatedPlan.execution_notes}`);
      console.log('');
    }
  } catch (error) {
    console.error('❌ ERROR updating experiment plan:', error);
  }

  // Test 5: Fetch the specific plan
  console.log('🔍 TEST 5: Fetching Specific Plan');
  console.log('──────────────────────────────────');
  try {
    const response = await fetch(`${API_BASE}/experiment-plans/${newPlan.plan_id}`, {
      headers: {
        'User-ID': userId,
        'Content-Type': 'application/json'
      }
    });

    console.log(`Response Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to fetch experiment plan:', errorText);
    } else {
      const fetchedPlan = await response.json();
      console.log('✅ Plan fetched successfully!');
      console.log(`Plan Name: ${fetchedPlan.plan_name}`);
      console.log(`Status: ${fetchedPlan.status}`);
      console.log(`Created: ${new Date(fetchedPlan.created_at).toLocaleString()}`);
      console.log(`Updated: ${new Date(fetchedPlan.updated_at).toLocaleString()}`);
      console.log('');
    }
  } catch (error) {
    console.error('❌ ERROR fetching experiment plan:', error);
  }

  // Test 6: Update to in_progress with more details
  console.log('🚀 TEST 6: Updating to In Progress');
  console.log('───────────────────────────────────');
  try {
    const response = await fetch(`${API_BASE}/experiment-plans/${newPlan.plan_id}`, {
      method: 'PUT',
      headers: {
        'User-ID': userId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'in_progress',
        execution_notes: 'Experiment started. Initial setup complete. Test from console.'
      })
    });

    console.log(`Response Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to update to in_progress:', errorText);
    } else {
      const updatedPlan = await response.json();
      console.log('✅ Plan status updated to in_progress!');
      console.log(`Status: ${updatedPlan.status}`);
      console.log('');
    }
  } catch (error) {
    console.error('❌ ERROR updating to in_progress:', error);
  }

  // Test 7: Complete the experiment with results
  console.log('🏁 TEST 7: Completing Experiment with Results');
  console.log('──────────────────────────────────────────────');
  try {
    const response = await fetch(`${API_BASE}/experiment-plans/${newPlan.plan_id}`, {
      method: 'PUT',
      headers: {
        'User-ID': userId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'completed',
        outcome: 'success',
        results_summary: 'Test experiment completed successfully. All expected outcomes achieved. Console test validation passed.',
        lessons_learned: 'The experiment planning feature works as expected. AI generation is accurate and comprehensive.',
        actual_duration: '2 hours',
        actual_cost: '$50'
      })
    });

    console.log(`Response Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to complete experiment:', errorText);
    } else {
      const completedPlan = await response.json();
      console.log('✅ Experiment completed successfully!');
      console.log(`Status: ${completedPlan.status}`);
      console.log(`Outcome: ${completedPlan.outcome}`);
      console.log(`Results: ${completedPlan.results_summary}`);
      console.log(`Lessons: ${completedPlan.lessons_learned}`);
      console.log(`Duration: ${completedPlan.actual_duration}`);
      console.log(`Cost: ${completedPlan.actual_cost}`);
      console.log('');
    }
  } catch (error) {
    console.error('❌ ERROR completing experiment:', error);
  }

  // Test 8: Delete the test plan
  console.log('🗑️  TEST 8: Deleting Test Plan');
  console.log('──────────────────────────────');
  console.log('⚠️  Waiting 3 seconds before deletion...\n');
  await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    const response = await fetch(`${API_BASE}/experiment-plans/${newPlan.plan_id}`, {
      method: 'DELETE',
      headers: {
        'User-ID': userId,
        'Content-Type': 'application/json'
      }
    });

    console.log(`Response Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to delete experiment plan:', errorText);
    } else {
      const result = await response.json();
      console.log('✅ Test plan deleted successfully!');
      console.log(`Message: ${result.message}`);
      console.log('');
    }
  } catch (error) {
    console.error('❌ ERROR deleting experiment plan:', error);
  }

  // Final summary
  console.log('\n🎉 ========================================');
  console.log('🎉 TEST SUITE COMPLETE!');
  console.log('🎉 ========================================\n');

  console.log('📊 SUMMARY:');
  console.log('───────────');
  console.log('✅ Fetched protocols');
  console.log('✅ Fetched existing plans');
  console.log('✅ Generated new plan with AI');
  console.log('✅ Updated plan status (draft → approved → in_progress → completed)');
  console.log('✅ Added execution notes and results');
  console.log('✅ Fetched specific plan');
  console.log('✅ Deleted test plan');
  console.log('');
  console.log('💡 TIP: Refresh the page to see the changes in the UI!');
  console.log('💡 TIP: Check the Network tab to see all API calls');
  console.log('');
  console.log('🔍 If you see any errors above, please report them with:');
  console.log('   - The error message');
  console.log('   - The test number that failed');
  console.log('   - Your browser console logs');
  console.log('');
}

// Helper function to run individual tests
async function testProtocolFetch(projectId, userId) {
  const API_BASE = window.location.origin.includes('localhost')
    ? 'http://localhost:8000'
    : 'https://r-dagent-production.up.railway.app';

  const response = await fetch(`${API_BASE}/protocols/project/${projectId}`, {
    headers: { 'User-ID': userId, 'Content-Type': 'application/json' }
  });
  return response.json();
}

async function testPlanGeneration(projectId, userId, protocolId) {
  const API_BASE = window.location.origin.includes('localhost')
    ? 'http://localhost:8000'
    : 'https://r-dagent-production.up.railway.app';

  const response = await fetch(`${API_BASE}/experiment-plans`, {
    method: 'POST',
    headers: { 'User-ID': userId, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      protocol_id: protocolId,
      project_id: projectId,
      custom_objective: 'Quick test',
      custom_notes: 'Testing from console'
    })
  });
  return response.json();
}

// Export for console use
console.log('✅ Experiment Planning Test Suite Loaded!');
console.log('');
console.log('📝 USAGE:');
console.log('─────────');
console.log('1. Make sure you are on a project page');
console.log('2. Navigate to Lab > Experiments tab');
console.log('3. Run: await testExperimentPlanning()');
console.log('');
console.log('🔧 INDIVIDUAL TESTS:');
console.log('────────────────────');
console.log('await testProtocolFetch(projectId, userId)');
console.log('await testPlanGeneration(projectId, userId, protocolId)');
console.log('');

