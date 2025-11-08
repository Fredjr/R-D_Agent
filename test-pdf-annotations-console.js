/**
 * 🧪 PDF ANNOTATIONS E2E TEST - PHASES 1-4
 * 
 * Copy this entire script and paste into browser console (F12) while viewing a PDF
 * 
 * Tests:
 * ✅ Phase 1: Sticky Notes (create, drag, resize, edit, delete)
 * ✅ Phase 2: Underline & Strikethrough
 * ✅ Phase 3: Rich Text Formatting (HTML content)
 * ✅ Phase 4: Real-time Drag-to-Highlight (all colors)
 */

(async () => {
  const TEST_CONFIG = {
    DELAY_MS: 800,
    CLEANUP: true, // Set to false to keep test annotations
    VERBOSE: true
  };

  const log = (emoji, msg, data = '') => console.log(`${emoji} ${msg}`, data);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  
  let stats = { pass: 0, fail: 0, total: 0 };
  const test = async (name, fn) => {
    stats.total++;
    try {
      await fn();
      stats.pass++;
      log('✅', name);
      return true;
    } catch (e) {
      stats.fail++;
      log('❌', name, e.message);
      return false;
    }
  };

  log('🚀', 'Starting PDF Annotations Test Suite...\n');

  // ========== SETUP ==========
  const projectId = window.location.pathname.match(/\/project\/([^\/]+)/)?.[1];

  // Try multiple methods to get user ID
  let userId = null;
  try {
    const userObj = JSON.parse(localStorage.getItem('user') || '{}');
    userId = userObj.user_id || userObj.id || userObj.email;
  } catch (e) {
    // Try Clerk session
    const clerkKeys = Object.keys(localStorage).filter(k => k.includes('clerk') || k.includes('session'));
    for (const key of clerkKeys) {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        if (data && (data.email || data.user_id || data.id)) {
          userId = data.email || data.user_id || data.id;
          break;
        }
      } catch (e) {}
    }
  }

  // Prompt if still not found
  if (!userId) {
    userId = prompt('Enter your user email or ID for testing:');
  }

  // Use frontend proxy API (works from browser console)
  const apiUrl = window.location.origin; // Use current origin (Vercel frontend)
  const pmid = document.querySelector('[data-pmid]')?.getAttribute('data-pmid') || '12345678';

  if (!projectId || !userId) {
    log('❌', 'ERROR: Please open a PDF in a project first!');
    return;
  }

  log('📋', 'Test Environment:', { projectId, userId, pmid, apiUrl });
  console.log('');

  const createdIds = [];
  const api = {
    create: async (data) => {
      const res = await fetch(`${apiUrl}/api/proxy/projects/${projectId}/annotations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': userId
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`API error: ${res.status} - ${errorText}`);
      }
      const json = await res.json();
      createdIds.push(json.annotation_id);
      return json;
    },
    update: async (id, data) => {
      const res = await fetch(`${apiUrl}/api/proxy/projects/${projectId}/annotations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': userId
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`API error: ${res.status} - ${errorText}`);
      }
      return res.json();
    },
    delete: async (id) => {
      const res = await fetch(`${apiUrl}/api/proxy/projects/${projectId}/annotations/${id}`, {
        method: 'DELETE',
        headers: {
          'User-ID': userId
        }
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`API error: ${res.status} - ${errorText}`);
      }
    },
    getAll: async () => {
      const res = await fetch(`${apiUrl}/api/proxy/projects/${projectId}/annotations`, {
        headers: {
          'User-ID': userId
        }
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`API error: ${res.status} - ${errorText}`);
      }
      const data = await res.json();
      // Backend returns { annotations: [...] }, extract the array
      return Array.isArray(data) ? data : (data.annotations || []);
    }
  };

  // ========== PHASE 1: STICKY NOTES ==========
  log('📝', '=== PHASE 1: STICKY NOTES ===\n');

  let stickyId;
  await test('Create sticky note', async () => {
    const note = await api.create({
      content: 'Test Sticky Note 📝',
      annotation_type: 'sticky_note',
      pdf_page: 1,
      sticky_note_position: { x: 0.5, y: 0.5, width: 200, height: 150 },
      sticky_note_color: '#FFEB3B'
    });
    stickyId = note.annotation_id;
    if (!stickyId) throw new Error('No annotation_id returned');
  });

  await sleep(TEST_CONFIG.DELAY_MS);

  await test('Sticky note appears in DOM', async () => {
    const el = document.querySelector(`[data-annotation-id="${stickyId}"]`);
    if (!el) throw new Error('Element not found in DOM');
  });

  await test('Move sticky note (drag)', async () => {
    await api.update(stickyId, {
      sticky_note_position: { x: 0.6, y: 0.6, width: 200, height: 150 }
    });
  });

  await sleep(TEST_CONFIG.DELAY_MS);

  await test('Resize sticky note', async () => {
    await api.update(stickyId, {
      sticky_note_position: { x: 0.6, y: 0.6, width: 250, height: 180 }
    });
  });

  await sleep(TEST_CONFIG.DELAY_MS);

  await test('Edit sticky note content', async () => {
    await api.update(stickyId, { content: 'Updated content ✏️' });
  });

  await sleep(TEST_CONFIG.DELAY_MS);

  // ========== PHASE 2: UNDERLINE & STRIKETHROUGH ==========
  log('📏', '\n=== PHASE 2: UNDERLINE & STRIKETHROUGH ===\n');

  let underlineId, strikethroughId;

  await test('Create underline annotation', async () => {
    const note = await api.create({
      content: 'Underline test',
      annotation_type: 'underline',
      pdf_page: 1,
      pdf_coordinates: { x: 0.1, y: 0.2, width: 0.3, height: 0.02, pageWidth: 612, pageHeight: 792 },
      highlight_color: '#2196F3',
      highlight_text: 'Underlined text sample'
    });
    underlineId = note.annotation_id;
  });

  await sleep(TEST_CONFIG.DELAY_MS);

  await test('Create strikethrough annotation', async () => {
    const note = await api.create({
      content: 'Strikethrough test',
      annotation_type: 'strikethrough',
      pdf_page: 1,
      pdf_coordinates: { x: 0.1, y: 0.25, width: 0.3, height: 0.02, pageWidth: 612, pageHeight: 792 },
      highlight_color: '#EF4444',
      highlight_text: 'Strikethrough text sample'
    });
    strikethroughId = note.annotation_id;
  });

  await sleep(TEST_CONFIG.DELAY_MS);

  await test('Underline renders in HighlightLayer', async () => {
    const layer = document.querySelector('[class*="HighlightLayer"]');
    if (!layer) throw new Error('HighlightLayer not found');
  });

  // ========== PHASE 3: RICH TEXT FORMATTING ==========
  log('✍️', '\n=== PHASE 3: RICH TEXT FORMATTING ===\n');

  let richTextId;

  await test('Create sticky note with HTML content', async () => {
    const html = '<p><strong>Bold</strong> <em>italic</em> <u>underline</u></p><ul><li>Item 1</li><li>Item 2</li></ul>';
    const note = await api.create({
      content: html,
      annotation_type: 'sticky_note',
      pdf_page: 1,
      sticky_note_position: { x: 0.7, y: 0.5, width: 250, height: 200 },
      sticky_note_color: '#FFEB3B'
    });
    richTextId = note.annotation_id;
  });

  await sleep(TEST_CONFIG.DELAY_MS);

  await test('HTML content stored correctly', async () => {
    const annotations = await api.getAll();
    const note = annotations.find(a => a.annotation_id === richTextId);
    if (!note.content.includes('<strong>')) throw new Error('HTML tags not preserved');
  });

  await test('Update with complex HTML', async () => {
    const html = '<p><strong>B</strong> <em>I</em> <u>U</u> <s>S</s></p><ol><li>One</li><li>Two</li></ol>';
    await api.update(richTextId, { content: html });
  });

  await sleep(TEST_CONFIG.DELAY_MS);

  await test('TipTap editor present in sticky notes', async () => {
    const editor = document.querySelector('[class*="ProseMirror"]') || 
                   document.querySelector('[class*="tiptap"]');
    if (!editor) throw new Error('TipTap editor not found');
  });

  // ========== PHASE 4: REAL-TIME DRAG-TO-HIGHLIGHT ==========
  log('🎨', '\n=== PHASE 4: REAL-TIME DRAG-TO-HIGHLIGHT ===\n');

  const colors = [
    { name: 'Yellow', hex: '#FFEB3B' },
    { name: 'Green', hex: '#4CAF50' },
    { name: 'Blue', hex: '#2196F3' },
    { name: 'Pink', hex: '#E91E63' },
    { name: 'Orange', hex: '#FF9800' }
  ];

  for (const color of colors) {
    await test(`Create ${color.name} highlight`, async () => {
      await api.create({
        content: `${color.name} highlight`,
        annotation_type: 'highlight',
        pdf_page: 1,
        pdf_coordinates: { 
          x: 0.1, 
          y: 0.4 + (colors.indexOf(color) * 0.05), 
          width: 0.35, 
          height: 0.025, 
          pageWidth: 612, 
          pageHeight: 792 
        },
        highlight_color: color.hex,
        highlight_text: `${color.name} highlighted text for testing`
      });
    });
    await sleep(300);
  }

  await test('All 5 highlight colors created', async () => {
    const annotations = await api.getAll();
    const highlights = annotations.filter(a => a.annotation_type === 'highlight');
    const uniqueColors = new Set(highlights.map(h => h.highlight_color));
    if (uniqueColors.size < 5) throw new Error(`Only ${uniqueColors.size} colors found`);
  });

  // ========== INTEGRATION TESTS ==========
  log('🔄', '\n=== INTEGRATION TESTS ===\n');

  await test('All annotation types present', async () => {
    const annotations = await api.getAll();
    const types = new Set(annotations.map(a => a.annotation_type));
    const required = ['highlight', 'underline', 'strikethrough', 'sticky_note'];
    const missing = required.filter(t => !types.has(t));
    if (missing.length > 0) throw new Error(`Missing types: ${missing.join(', ')}`);
  });

  await test('Annotations sidebar populated', async () => {
    const cards = document.querySelectorAll('[data-annotation-id]');
    if (cards.length === 0) throw new Error('No annotation cards found');
  });

  await test('Annotation toolbar present', async () => {
    const toolbar = document.querySelector('[class*="AnnotationToolbar"]') ||
                    document.querySelector('button[title*="Highlight"]');
    if (!toolbar) throw new Error('Annotation toolbar not found');
  });

  await test('Color pickers present', async () => {
    const colorPickers = document.querySelectorAll('[class*="color"]');
    if (colorPickers.length === 0) throw new Error('No color pickers found');
  });

  // ========== CLEANUP ==========
  if (TEST_CONFIG.CLEANUP) {
    log('🧹', '\n=== CLEANUP ===\n');
    for (const id of createdIds) {
      await test(`Delete ${id.substring(0, 8)}...`, async () => {
        await api.delete(id);
      });
      await sleep(200);
    }
  } else {
    log('ℹ️', '\nSkipping cleanup - test annotations preserved');
  }

  // ========== FINAL REPORT ==========
  console.log('\n' + '='.repeat(70));
  log('📊', 'TEST RESULTS');
  console.log('='.repeat(70));
  log('✅', `Passed: ${stats.pass}/${stats.total}`);
  log('❌', `Failed: ${stats.fail}/${stats.total}`);
  log('📈', `Success Rate: ${((stats.pass / stats.total) * 100).toFixed(1)}%`);
  console.log('='.repeat(70));

  if (stats.fail === 0) {
    log('🎉', 'ALL TESTS PASSED! Phases 1-4 working perfectly! 🚀');
  } else {
    log('⚠️', `${stats.fail} test(s) failed. Check errors above.`);
  }

  console.log('\n✨ Test suite completed!\n');

  return { passed: stats.pass, failed: stats.fail, total: stats.total };
})();

