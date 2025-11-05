// DEBUG SCRIPT: Diagnose Global Search Issue
// Run this in browser console on project page

(async function() {
  console.log('🔍 DEBUG: Global Search Issue Diagnosis');
  console.log('═══════════════════════════════════════════════════════════');
  
  // Get user and project info
  const user = JSON.parse(localStorage.getItem('rd_agent_user') || '{}');
  const projectId = window.location.pathname.split('/')[2];
  
  console.log('👤 User:', user.email);
  console.log('📁 Project ID:', projectId);
  console.log('');
  
  // Test 1: Check annotations directly
  console.log('TEST 1: Fetch annotations directly');
  console.log('─────────────────────────────────────');
  try {
    const annotationsResponse = await fetch(
      `/api/proxy/projects/${projectId}/annotations`,
      {
        headers: {
          'User-ID': user.email,
          'Content-Type': 'application/json'
        }
      }
    );
    const annotationsData = await annotationsResponse.json();
    const annotations = Array.isArray(annotationsData) ? annotationsData : (annotationsData.annotations || []);
    
    console.log(`✅ Found ${annotations.length} annotations`);
    
    if (annotations.length > 0) {
      const firstAnnotation = annotations[0];
      console.log('📝 First annotation:');
      console.log('  - ID:', firstAnnotation.annotation_id);
      console.log('  - Project ID:', firstAnnotation.project_id);
      console.log('  - Content:', firstAnnotation.content?.substring(0, 50) + '...');
      console.log('  - Note Type:', firstAnnotation.note_type);
      console.log('  - Tags:', firstAnnotation.tags);
      console.log('  - Article PMID:', firstAnnotation.article_pmid);
      
      // Check if "cancer" is in any annotation
      const cancerAnnotations = annotations.filter(a => 
        a.content?.toLowerCase().includes('cancer') ||
        a.highlight_text?.toLowerCase().includes('cancer') ||
        JSON.stringify(a.tags || []).toLowerCase().includes('cancer')
      );
      console.log(`🔍 Annotations containing "cancer": ${cancerAnnotations.length}`);
      
      if (cancerAnnotations.length > 0) {
        console.log('📋 Cancer annotations:');
        cancerAnnotations.forEach((a, i) => {
          console.log(`  ${i + 1}. ${a.content?.substring(0, 60)}...`);
        });
      }
    }
  } catch (error) {
    console.error('❌ Error fetching annotations:', error);
  }
  
  console.log('');
  
  // Test 2: Test search endpoint
  console.log('TEST 2: Test search endpoint');
  console.log('─────────────────────────────────────');
  try {
    const searchResponse = await fetch(
      `/api/proxy/projects/${projectId}/search?q=cancer&content_types=notes&limit=50`,
      {
        headers: {
          'User-ID': user.email,
          'Content-Type': 'application/json'
        }
      }
    );
    const searchData = await searchResponse.json();
    
    console.log('🔍 Search response:', searchData);
    console.log('  - Query:', searchData.query);
    console.log('  - Total found:', searchData.total_found);
    console.log('  - Notes found:', searchData.results?.notes?.length || 0);
    console.log('  - Debug info:', searchData.debug);
    
    if (searchData.results?.notes?.length > 0) {
      console.log('✅ Search found notes:');
      searchData.results.notes.forEach((note, i) => {
        console.log(`  ${i + 1}. ${note.title || note.content?.substring(0, 50)}`);
      });
    } else {
      console.log('❌ Search returned no notes');
    }
  } catch (error) {
    console.error('❌ Error testing search:', error);
  }
  
  console.log('');
  
  // Test 3: Test backend search directly
  console.log('TEST 3: Test backend search directly');
  console.log('─────────────────────────────────────');
  try {
    const backendResponse = await fetch(
      `https://r-dagent-production.up.railway.app/projects/${projectId}/search?q=cancer&content_types=notes&limit=50`,
      {
        headers: {
          'User-ID': user.email,
          'Content-Type': 'application/json'
        }
      }
    );
    const backendData = await backendResponse.json();
    
    console.log('🔍 Backend search response:', backendData);
    console.log('  - Query:', backendData.query);
    console.log('  - Total found:', backendData.total_found);
    console.log('  - Notes found:', backendData.results?.notes?.length || 0);
    console.log('  - Debug info:', backendData.debug);
    
    if (backendData.results?.notes?.length > 0) {
      console.log('✅ Backend search found notes:');
      backendData.results.notes.forEach((note, i) => {
        console.log(`  ${i + 1}. ${note.title || note.content?.substring(0, 50)}`);
      });
    } else {
      console.log('❌ Backend search returned no notes');
    }
  } catch (error) {
    console.error('❌ Error testing backend search:', error);
  }
  
  console.log('');
  
  // Test 4: Check collections
  console.log('TEST 4: Check collections');
  console.log('─────────────────────────────────────');
  try {
    const collectionsResponse = await fetch(
      `/api/proxy/projects/${projectId}/collections`,
      {
        headers: {
          'User-ID': user.email,
          'Content-Type': 'application/json'
        }
      }
    );
    const collectionsData = await collectionsResponse.json();
    const collections = Array.isArray(collectionsData) ? collectionsData : (collectionsData.collections || []);
    
    console.log(`✅ Found ${collections.length} collections`);
    
    if (collections.length > 0) {
      collections.forEach((c, i) => {
        console.log(`  ${i + 1}. ${c.collection_name} (${c.collection_id})`);
      });
    }
  } catch (error) {
    console.error('❌ Error fetching collections:', error);
  }
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🎯 DIAGNOSIS COMPLETE');
  console.log('');
  console.log('NEXT STEPS:');
  console.log('1. Check if annotations have project_id set');
  console.log('2. Check if search query is matching annotation content');
  console.log('3. Check backend logs for search query execution');
  console.log('4. Verify database query is correct');
  console.log('═══════════════════════════════════════════════════════════');
})();

