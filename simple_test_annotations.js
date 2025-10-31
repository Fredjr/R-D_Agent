/**
 * SIMPLE TEST: Check if annotations are working
 * 
 * Run this from ANY page - it will tell you what to do next
 */

(async function simpleTest() {
  console.clear();
  console.log('%c🧪 SIMPLE ANNOTATIONS TEST', 'color: #00ff00; font-weight: bold; font-size: 18px');
  console.log('');

  // Get user email
  let userEmail = null;
  try {
    const rdAgentUser = localStorage.getItem('rd_agent_user');
    if (rdAgentUser) {
      const userData = JSON.parse(rdAgentUser);
      userEmail = userData.email || userData.user_id;
    }
  } catch (e) {
    // Ignore
  }

  if (!userEmail) {
    console.log('❌ User not found. Please log in first.');
    return;
  }

  console.log('✅ User:', userEmail);

  // Get project ID
  const projectId = window.location.pathname.split('/').find(p => p.length === 36);
  
  if (!projectId) {
    console.log('❌ Not on a project page.');
    console.log('');
    console.log('📍 Please navigate to:');
    console.log('   https://frontend-psi-seven-85.vercel.app/project/804494b5-69e0-4b9a-9c7b-f7fb2bddef64');
    console.log('');
    console.log('   Then click the "Network" tab and click on any paper node.');
    return;
  }

  console.log('✅ Project ID:', projectId);
  console.log('');

  // Check current page
  const currentUrl = window.location.href;
  console.log('📍 Current page:', currentUrl);
  console.log('');

  // Check if NetworkSidebar exists
  const sidebar = document.querySelector('[class*="NetworkSidebar"], aside, [class*="sidebar"]');
  
  if (!sidebar) {
    console.log('⚠️ NetworkSidebar not found in DOM');
    console.log('');
    console.log('📋 TO SEE ANNOTATIONS:');
    console.log('   1. Click the "Network" tab at the top of the page');
    console.log('   2. Click on ANY circle (paper node) in the graph');
    console.log('   3. A sidebar will open on the right');
    console.log('   4. Scroll to the bottom of the sidebar');
    console.log('   5. You should see "Notes" section');
    console.log('');
    console.log('   Then run this script again!');
    return;
  }

  console.log('✅ Sidebar found in DOM!');
  console.log('');

  // Check for annotations section
  const notesSection = document.querySelector('[class*="annotation"], [class*="note"]');
  const notesText = Array.from(document.querySelectorAll('*')).find(el => 
    el.textContent?.includes('Notes') || el.textContent?.includes('annotations')
  );

  if (notesSection || notesText) {
    console.log('✅ Notes section found!');
    console.log('');
    
    // Check for loading state
    const loadingText = Array.from(document.querySelectorAll('*')).find(el => 
      el.textContent?.includes('Loading annotations')
    );
    
    if (loadingText) {
      console.log('⚠️ ISSUE: "Loading annotations..." is stuck!');
      console.log('   This means the component is not finishing the fetch.');
      console.log('');
      console.log('   Checking API...');
      
      // Test API
      try {
        const response = await fetch(`/api/proxy/projects/${projectId}/annotations`, {
          method: 'GET',
          headers: {
            'User-ID': userEmail,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('   ✅ API works! Returns:', data.annotations.length, 'annotations');
          console.log('');
          console.log('   🔧 The issue is in the React component state management.');
          console.log('   Please send this output to the AI.');
        } else {
          console.log('   ❌ API failed with status:', response.status);
          console.log('   Please send this output to the AI.');
        }
      } catch (err) {
        console.log('   ❌ API error:', err.message);
        console.log('   Please send this output to the AI.');
      }
    } else {
      // Check for empty state
      const emptyState = Array.from(document.querySelectorAll('*')).find(el => 
        el.textContent?.includes('No notes yet') || el.textContent?.includes('Add your first note')
      );
      
      if (emptyState) {
        console.log('✅ WORKING! Empty state is showing correctly.');
        console.log('');
        console.log('   You should see:');
        console.log('   - "Notes (0)" header');
        console.log('   - Green dot (🟢) for WebSocket connection');
        console.log('   - "+ New Note" button');
        console.log('   - "No notes yet." message');
        console.log('');
        console.log('🎉 Annotations feature is working correctly!');
        console.log('');
        console.log('   Try clicking "+ New Note" to create your first annotation.');
      } else {
        console.log('⚠️ Notes section found but state is unclear.');
        console.log('   Element text:', notesSection?.textContent?.substring(0, 200));
        console.log('');
        console.log('   Please send this output to the AI.');
      }
    }
  } else {
    console.log('⚠️ Notes section not found in sidebar.');
    console.log('');
    console.log('   Sidebar HTML preview:');
    console.log('   ', sidebar.innerHTML.substring(0, 500));
    console.log('');
    console.log('   Please send this output to the AI.');
  }

  console.log('');
  console.log('─────────────────────────────────────');
  console.log('');

})();

