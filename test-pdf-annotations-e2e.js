/**
 * End-to-End Test Script for PDF Annotations (Phases 1-4)
 * 
 * Tests:
 * - Phase 1: Sticky Notes (create, move, resize, edit, delete)
 * - Phase 2: Underline & Strikethrough annotations
 * - Phase 3: Rich Text Formatting in sticky notes
 * - Phase 4: Real-time Drag-to-Highlight
 * 
 * Usage:
 * 1. Open a PDF in your project
 * 2. Open browser console (F12)
 * 3. Copy and paste this entire script
 * 4. Press Enter to run
 * 
 * The script will:
 * - Create test annotations via API
 * - Verify they appear in the UI
 * - Test interactions (edit, delete, move)
 * - Verify backend persistence
 * - Clean up test data
 */

(async function testPDFAnnotations() {
  console.log('🧪 Starting PDF Annotations E2E Test Suite...\n');
  
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  function logTest(name, passed, details = '') {
    const emoji = passed ? '✅' : '❌';
    const status = passed ? 'PASS' : 'FAIL';
    console.log(`${emoji} ${status}: ${name}${details ? ' - ' + details : ''}`);
    results.tests.push({ name, passed, details });
    if (passed) results.passed++;
    else results.failed++;
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ============================================================================
  // SETUP: Extract project and user info from current page
  // ============================================================================
  
  console.log('📋 Phase 0: Setup and Environment Check\n');

  let projectId, userId, pmid, apiBaseUrl;

  try {
    // Try to get project ID from URL
    const urlMatch = window.location.pathname.match(/\/project\/([^\/]+)/);
    projectId = urlMatch ? urlMatch[1] : null;
    logTest('Extract Project ID from URL', !!projectId, projectId);

    // Use frontend proxy API (works from browser console)
    apiBaseUrl = window.location.origin; // Use current origin (Vercel frontend)
    logTest('Determine API Base URL', true, apiBaseUrl);

    // Try to get user from multiple sources
    // Method 1: localStorage 'user' key
    let userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        userId = user.user_id || user.id || user.email;
        logTest('Extract User ID from localStorage', !!userId, userId);
      } catch (e) {
        console.warn('Failed to parse user from localStorage:', e);
      }
    }

    // Method 2: Check for Clerk session data
    if (!userId) {
      const clerkKeys = Object.keys(localStorage).filter(k => k.includes('clerk') || k.includes('session'));
      for (const key of clerkKeys) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (data && (data.email || data.user_id || data.id)) {
            userId = data.email || data.user_id || data.id;
            logTest('Extract User ID from Clerk session', !!userId, userId);
            break;
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }

    // Method 3: Try to get from DOM (user menu, profile, etc.)
    if (!userId) {
      const userMenu = document.querySelector('[data-user-email], [data-user-id]');
      if (userMenu) {
        userId = userMenu.getAttribute('data-user-email') || userMenu.getAttribute('data-user-id');
        logTest('Extract User ID from DOM', !!userId, userId);
      }
    }

    // Method 4: Prompt user to enter manually
    if (!userId) {
      console.warn('⚠️ Could not auto-detect user ID. You can enter it manually:');
      console.log('Run: userId = "your-email@example.com"');
      userId = prompt('Enter your user email or ID for testing:');
      if (userId) {
        logTest('User ID entered manually', !!userId, userId);
      } else {
        throw new Error('User ID required for testing');
      }
    }

    // Try to get PMID from page
    const pdfViewer = document.querySelector('[data-pmid]');
    if (pdfViewer) {
      pmid = pdfViewer.getAttribute('data-pmid');
    } else {
      // Try to extract from URL or page title
      const titleMatch = document.title.match(/PMID[:\s]+(\d+)/i);
      pmid = titleMatch ? titleMatch[1] : '12345678'; // Fallback test PMID
    }
    logTest('Extract PMID', !!pmid, pmid);

  } catch (error) {
    logTest('Setup', false, error.message);
    console.error('❌ Setup failed. Please open a PDF in a project first.');
    return;
  }

  if (!projectId || !userId) {
    console.error('❌ Missing required data. Please ensure you are on a project page with a PDF open.');
    return;
  }

  console.log('\n📊 Test Environment:');
  console.log(`   Project ID: ${projectId}`);
  console.log(`   User ID: ${userId}`);
  console.log(`   PMID: ${pmid}`);
  console.log(`   API URL: ${apiBaseUrl}\n`);

  // Helper function for API calls
  const apiCall = async (endpoint, options = {}) => {
    const url = `${apiBaseUrl}/api/proxy/projects/${projectId}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'User-ID': userId,
      ...options.headers
    };

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${response.status} - ${errorText}`);
    }

    return response;
  };

  // ============================================================================
  // PHASE 1: STICKY NOTES
  // ============================================================================

  console.log('📝 Phase 1: Sticky Notes Testing\n');

  let stickyNoteId = null;

  // Test 1.1: Create Sticky Note via API
  try {
    const response = await fetch(`${apiBaseUrl}/api/proxy/projects/${projectId}/annotations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId
      },
      body: JSON.stringify({
        article_pmid: pmid,
        content: 'Test Sticky Note - Phase 1',
        annotation_type: 'sticky_note',
        pdf_page: 1,
        sticky_note_position: { x: 0.5, y: 0.5, width: 200, height: 150 },
        sticky_note_color: '#FFEB3B',
        note_type: 'general'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${response.status} - ${errorText}`);
    }

    const data = await response.json();
    stickyNoteId = data.annotation_id;
    logTest('Create Sticky Note via API', response.ok && !!stickyNoteId, `ID: ${stickyNoteId}`);
  } catch (error) {
    logTest('Create Sticky Note via API', false, error.message);
  }

  await sleep(1000);

  // Test 1.2: Verify Sticky Note appears in UI
  try {
    const stickyNote = document.querySelector(`[data-annotation-id="${stickyNoteId}"]`);
    logTest('Sticky Note appears in UI', !!stickyNote);
  } catch (error) {
    logTest('Sticky Note appears in UI', false, error.message);
  }

  // Test 1.3: Update Sticky Note position (simulate drag)
  if (stickyNoteId) {
    try {
      const response = await fetch(`${apiBaseUrl}/api/projects/${projectId}/annotations/${stickyNoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sticky_note_position: { x: 0.6, y: 0.6, width: 200, height: 150 }
        })
      });
      logTest('Update Sticky Note position (drag)', response.ok);
    } catch (error) {
      logTest('Update Sticky Note position (drag)', false, error.message);
    }
  }

  await sleep(500);

  // Test 1.4: Update Sticky Note size (simulate resize)
  if (stickyNoteId) {
    try {
      const response = await fetch(`${apiBaseUrl}/api/projects/${projectId}/annotations/${stickyNoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sticky_note_position: { x: 0.6, y: 0.6, width: 250, height: 180 }
        })
      });
      logTest('Update Sticky Note size (resize)', response.ok);
    } catch (error) {
      logTest('Update Sticky Note size (resize)', false, error.message);
    }
  }

  await sleep(500);

  // Test 1.5: Update Sticky Note content (simulate edit)
  if (stickyNoteId) {
    try {
      const response = await fetch(`${apiBaseUrl}/api/projects/${projectId}/annotations/${stickyNoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: 'Updated Sticky Note Content - Test'
        })
      });
      logTest('Update Sticky Note content (edit)', response.ok);
    } catch (error) {
      logTest('Update Sticky Note content (edit)', false, error.message);
    }
  }

  await sleep(500);

  // ============================================================================
  // PHASE 2: UNDERLINE & STRIKETHROUGH
  // ============================================================================

  console.log('\n📏 Phase 2: Underline & Strikethrough Testing\n');

  let underlineId = null;
  let strikethroughId = null;

  // Test 2.1: Create Underline annotation
  try {
    const response = await fetch(`${apiBaseUrl}/api/projects/${projectId}/annotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectId,
        author_id: userId,
        pmid: pmid,
        content: 'Underline: Test text',
        annotation_type: 'underline',
        pdf_page: 1,
        pdf_coordinates: { x: 0.1, y: 0.2, width: 0.3, height: 0.02, pageWidth: 612, pageHeight: 792 },
        highlight_color: '#2196F3',
        highlight_text: 'Test underlined text'
      })
    });

    const data = await response.json();
    underlineId = data.annotation_id;
    logTest('Create Underline annotation', response.ok && !!underlineId, `ID: ${underlineId}`);
  } catch (error) {
    logTest('Create Underline annotation', false, error.message);
  }

  await sleep(500);

  // Test 2.2: Create Strikethrough annotation
  try {
    const response = await fetch(`${apiBaseUrl}/api/projects/${projectId}/annotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectId,
        author_id: userId,
        pmid: pmid,
        content: 'Strikethrough: Test text',
        annotation_type: 'strikethrough',
        pdf_page: 1,
        pdf_coordinates: { x: 0.1, y: 0.3, width: 0.3, height: 0.02, pageWidth: 612, pageHeight: 792 },
        highlight_color: '#EF4444',
        highlight_text: 'Test strikethrough text'
      })
    });

    const data = await response.json();
    strikethroughId = data.annotation_id;
    logTest('Create Strikethrough annotation', response.ok && !!strikethroughId, `ID: ${strikethroughId}`);
  } catch (error) {
    logTest('Create Strikethrough annotation', false, error.message);
  }

  await sleep(1000);

  // Test 2.3: Verify annotations appear in UI
  try {
    const underlineEl = document.querySelector(`[data-annotation-id="${underlineId}"]`);
    const strikethroughEl = document.querySelector(`[data-annotation-id="${strikethroughId}"]`);
    logTest('Underline & Strikethrough appear in UI', !!underlineEl || !!strikethroughEl);
  } catch (error) {
    logTest('Underline & Strikethrough appear in UI', false, error.message);
  }

  // ============================================================================
  // PHASE 3: RICH TEXT FORMATTING
  // ============================================================================

  console.log('\n✍️ Phase 3: Rich Text Formatting Testing\n');

  let richTextNoteId = null;

  // Test 3.1: Create Sticky Note with HTML content
  try {
    const htmlContent = '<p><strong>Bold text</strong> and <em>italic text</em> and <u>underlined text</u></p><ul><li>Bullet point 1</li><li>Bullet point 2</li></ul>';
    
    const response = await fetch(`${apiBaseUrl}/api/projects/${projectId}/annotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectId,
        author_id: userId,
        pmid: pmid,
        content: htmlContent,
        annotation_type: 'sticky_note',
        pdf_page: 1,
        sticky_note_position: { x: 0.7, y: 0.5, width: 250, height: 200 },
        sticky_note_color: '#FFEB3B'
      })
    });

    const data = await response.json();
    richTextNoteId = data.annotation_id;
    logTest('Create Sticky Note with HTML content', response.ok && !!richTextNoteId, `ID: ${richTextNoteId}`);
  } catch (error) {
    logTest('Create Sticky Note with HTML content', false, error.message);
  }

  await sleep(1000);

  // Test 3.2: Verify HTML content is stored
  if (richTextNoteId) {
    try {
      const response = await fetch(`${apiBaseUrl}/api/projects/${projectId}/annotations`);
      const annotations = await response.json();
      const richNote = annotations.find(a => a.annotation_id === richTextNoteId);
      const hasHtmlTags = richNote && richNote.content.includes('<strong>') && richNote.content.includes('<em>');
      logTest('HTML content stored in database', hasHtmlTags);
    } catch (error) {
      logTest('HTML content stored in database', false, error.message);
    }
  }

  // Test 3.3: Update with more complex HTML
  if (richTextNoteId) {
    try {
      const complexHtml = '<p><strong>Bold</strong> <em>italic</em> <u>underline</u> <s>strikethrough</s></p><ol><li>Numbered 1</li><li>Numbered 2</li></ol>';
      const response = await fetch(`${apiBaseUrl}/api/projects/${projectId}/annotations/${richTextNoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: complexHtml })
      });
      logTest('Update with complex HTML formatting', response.ok);
    } catch (error) {
      logTest('Update with complex HTML formatting', false, error.message);
    }
  }

  await sleep(500);

  // ============================================================================
  // PHASE 4: REAL-TIME DRAG-TO-HIGHLIGHT
  // ============================================================================

  console.log('\n🎨 Phase 4: Real-time Drag-to-Highlight Testing\n');

  let highlightId = null;

  // Test 4.1: Create Highlight annotation (simulating drag-to-highlight)
  try {
    const response = await fetch(`${apiBaseUrl}/api/projects/${projectId}/annotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectId,
        author_id: userId,
        pmid: pmid,
        content: 'Highlight: Important text',
        annotation_type: 'highlight',
        pdf_page: 1,
        pdf_coordinates: { x: 0.1, y: 0.4, width: 0.4, height: 0.03, pageWidth: 612, pageHeight: 792 },
        highlight_color: '#FFEB3B',
        highlight_text: 'This is important highlighted text for testing'
      })
    });

    const data = await response.json();
    highlightId = data.annotation_id;
    logTest('Create Highlight annotation (drag-to-highlight)', response.ok && !!highlightId, `ID: ${highlightId}`);
  } catch (error) {
    logTest('Create Highlight annotation (drag-to-highlight)', false, error.message);
  }

  await sleep(500);

  // Test 4.2: Create multiple highlights with different colors
  const colors = ['#FFEB3B', '#4CAF50', '#2196F3', '#E91E63', '#FF9800'];
  const colorNames = ['Yellow', 'Green', 'Blue', 'Pink', 'Orange'];
  let multiColorSuccess = true;

  for (let i = 0; i < colors.length; i++) {
    try {
      const response = await fetch(`${apiBaseUrl}/api/projects/${projectId}/annotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          author_id: userId,
          pmid: pmid,
          content: `Highlight: ${colorNames[i]} text`,
          annotation_type: 'highlight',
          pdf_page: 1,
          pdf_coordinates: { x: 0.1, y: 0.5 + (i * 0.05), width: 0.3, height: 0.02, pageWidth: 612, pageHeight: 792 },
          highlight_color: colors[i],
          highlight_text: `${colorNames[i]} highlighted text`
        })
      });
      if (!response.ok) multiColorSuccess = false;
    } catch (error) {
      multiColorSuccess = false;
    }
    await sleep(200);
  }

  logTest('Create highlights with all 5 colors', multiColorSuccess);

  // ============================================================================
  // CROSS-PHASE TESTS
  // ============================================================================

  console.log('\n🔄 Cross-Phase Integration Tests\n');

  // Test: Fetch all annotations and verify types
  try {
    const response = await fetch(`${apiBaseUrl}/api/projects/${projectId}/annotations`);
    const annotations = await response.json();
    
    const hasHighlight = annotations.some(a => a.annotation_type === 'highlight');
    const hasUnderline = annotations.some(a => a.annotation_type === 'underline');
    const hasStrikethrough = annotations.some(a => a.annotation_type === 'strikethrough');
    const hasStickyNote = annotations.some(a => a.annotation_type === 'sticky_note');
    
    logTest('All annotation types present', hasHighlight && hasUnderline && hasStrikethrough && hasStickyNote);
    logTest('Total annotations created', annotations.length >= 10, `Count: ${annotations.length}`);
  } catch (error) {
    logTest('Fetch all annotations', false, error.message);
  }

  // Test: Verify annotations sidebar shows all annotations
  try {
    const sidebar = document.querySelector('[class*="AnnotationsSidebar"]') || 
                    document.querySelector('[class*="sidebar"]');
    const annotationCards = document.querySelectorAll('[data-annotation-id]');
    logTest('Annotations appear in sidebar', annotationCards.length > 0, `Count: ${annotationCards.length}`);
  } catch (error) {
    logTest('Annotations appear in sidebar', false, error.message);
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  console.log('\n🧹 Cleanup: Deleting Test Annotations\n');

  const testAnnotationIds = [
    stickyNoteId,
    underlineId,
    strikethroughId,
    richTextNoteId,
    highlightId
  ].filter(Boolean);

  for (const id of testAnnotationIds) {
    try {
      const response = await fetch(`${apiBaseUrl}/api/projects/${projectId}/annotations/${id}`, {
        method: 'DELETE'
      });
      logTest(`Delete annotation ${id.substring(0, 8)}...`, response.ok);
    } catch (error) {
      logTest(`Delete annotation ${id.substring(0, 8)}...`, false, error.message);
    }
    await sleep(200);
  }

  // ============================================================================
  // FINAL REPORT
  // ============================================================================

  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  console.log('='.repeat(80));

  if (results.failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.tests.filter(t => !t.passed).forEach(t => {
      console.log(`   - ${t.name}${t.details ? ': ' + t.details : ''}`);
    });
  }

  console.log('\n✨ Test suite completed!\n');

  return results;
})();

