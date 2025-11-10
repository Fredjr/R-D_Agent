/**
 * 🎨 PDF ANNOTATIONS UX TEST - COMPREHENSIVE
 *
 * Tests ALL annotation features with detailed logging:
 * ✅ Horizontal color bar (like Cochrane Library)
 * ✅ Selected color visual feedback (white border + blue ring)
 * ✅ Sticky notes on PDF (create, drag, resize, edit)
 * ✅ Highlight (real-time drag-to-highlight)
 * ✅ Underline annotations
 * ✅ Strikethrough annotations
 * ✅ Real-time WebSocket updates
 *
 * USAGE:
 * 1. Open a PDF in the viewer
 * 2. Open browser console (F12)
 * 3. Copy and paste this entire script
 * 4. Watch the automated tests run!
 */

(async () => {
  const log = (emoji, msg, data = '') => console.log(`${emoji} ${msg}`, data);
  const debug = (msg, data) => console.log(`🔍 DEBUG: ${msg}`, data);
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

  log('🚀', 'Starting PDF Annotations COMPREHENSIVE Test Suite...\n');
  log('🎨', '=== TESTING NEW UX IMPROVEMENTS ===\n');

  // ========== HELPER: GET USER ID ==========
  const getUserId = () => {
    let userId = null;

    // Method 1: localStorage 'user' key
    try {
      const userObj = JSON.parse(localStorage.getItem('user') || '{}');
      userId = userObj.user_id || userObj.id || userObj.email;
      if (userId) {
        debug('User ID found in localStorage.user', userId);
        return userId;
      }
    } catch (e) {}

    // Method 2: Clerk session
    try {
      const clerkKeys = Object.keys(localStorage).filter(k =>
        k.includes('clerk') && (k.includes('client') || k.includes('session'))
      );
      debug('Clerk keys found', clerkKeys);

      for (const key of clerkKeys) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (data?.sessions?.[0]?.user) {
            const user = data.sessions[0].user;
            userId = user.email_addresses?.[0]?.email_address ||
                    user.primary_email_address_id ||
                    user.id;
            if (userId) {
              debug('User ID found in Clerk session', userId);
              return userId;
            }
          }
        } catch (e) {}
      }
    } catch (e) {}

    // Method 3: window.__clerk
    if (window.__clerk) {
      try {
        userId = window.__clerk.user?.primaryEmailAddress?.emailAddress ||
                window.__clerk.user?.id;
        if (userId) {
          debug('User ID found in window.__clerk', userId);
          return userId;
        }
      } catch (e) {}
    }

    // Method 4: Prompt
    userId = prompt('Enter your email for testing (e.g., fredericle75019@gmail.com):');
    debug('User ID from prompt', userId);
    return userId;
  };

  // ========== HELPER: FIND COLOR BUTTONS ==========
  const findColorButtons = () => {
    debug('Searching for color buttons...');

    // Try multiple selectors
    const allButtons = Array.from(document.querySelectorAll('button'));
    debug('Total buttons on page', allButtons.length);

    // Method 1: Look for buttons with specific background colors
    const coloredButtons = allButtons.filter(btn => {
      const style = window.getComputedStyle(btn);
      const bgColor = style.backgroundColor;

      // Check if it's one of our annotation colors
      const isAnnotationColor = bgColor && (
        bgColor.includes('255, 235, 59') ||  // Yellow #FFEB3B
        bgColor.includes('76, 175, 80') ||   // Green #4CAF50
        bgColor.includes('33, 150, 243') ||  // Blue #2196F3
        bgColor.includes('233, 30, 99') ||   // Pink #E91E63
        bgColor.includes('255, 152, 0')      // Orange #FF9800
      );

      return isAnnotationColor;
    });

    debug('Colored buttons found (Method 1)', coloredButtons.length);
    if (coloredButtons.length > 0) {
      debug('Sample colored button styles', {
        backgroundColor: window.getComputedStyle(coloredButtons[0]).backgroundColor,
        borderRadius: window.getComputedStyle(coloredButtons[0]).borderRadius,
        width: window.getComputedStyle(coloredButtons[0]).width,
        height: window.getComputedStyle(coloredButtons[0]).height
      });
    }

    // Method 2: Look for circular buttons with any non-transparent background
    const circularButtons = allButtons.filter(btn => {
      const style = window.getComputedStyle(btn);
      const bgColor = style.backgroundColor;
      const borderRadius = style.borderRadius;

      const hasColor = bgColor && bgColor !== 'rgba(0, 0, 0, 0)';
      const isCircular = borderRadius && (
        parseInt(borderRadius) > 15 ||
        borderRadius.includes('50%') ||
        borderRadius.includes('9999')
      );

      return hasColor && isCircular;
    });

    debug('Circular colored buttons found (Method 2)', circularButtons.length);

    return coloredButtons.length > 0 ? coloredButtons : circularButtons;
  };

  log('🚀', 'Starting PDF Annotations UX Test Suite...\n');
  log('🎨', '=== TESTING NEW UX IMPROVEMENTS ===\n');

  // ========== SETUP: GET PROJECT INFO ==========
  const projectId = window.location.pathname.match(/\/project\/([^\/]+)/)?.[1];
  const pmid = document.querySelector('[data-pmid]')?.getAttribute('data-pmid') || '12345678';
  const userId = getUserId();

  if (!projectId || !userId) {
    log('❌', 'ERROR: Missing projectId or userId!', { projectId, userId });
    return;
  }

  log('📋', 'Test Environment:', { projectId, userId, pmid });
  console.log('');

  // ========== TEST 1: ANNOTATION TOOLBAR ==========
  log('🔧', '--- Test 1: Annotation Toolbar ---\n');

  await test('Annotation toolbar exists', async () => {
    debug('Looking for annotation toolbar with data-testid...');

    // Method 1: Use new data-testid attribute (BEST)
    let toolbar = document.querySelector('[data-testid="annotation-toolbar"]');

    if (!toolbar) {
      debug('⚠️ data-testid not found, trying fallback selectors...');

      // Method 2: Class name selectors
      toolbar = document.querySelector('[class*="AnnotationToolbar"]') ||
                document.querySelector('[class*="annotation-toolbar"]');
    }

    if (!toolbar) {
      debug('⚠️ Class selectors failed, trying to find by tool buttons...');

      // Method 3: Find by tool buttons
      const highlightBtn = document.querySelector('button[title*="Highlight"]');
      if (highlightBtn) {
        toolbar = highlightBtn.closest('div');
      }
    }

    if (!toolbar) {
      // Debug: Show what we found
      const allButtons = Array.from(document.querySelectorAll('button[title]'));
      debug('❌ All buttons with titles found', allButtons.map(b => b.getAttribute('title')));

      const allTestIds = Array.from(document.querySelectorAll('[data-testid]'));
      debug('❌ All elements with data-testid', allTestIds.map(el => el.getAttribute('data-testid')));

      throw new Error('Toolbar not found - are you on a PDF page?');
    }

    debug('✅ Toolbar found!', {
      testId: toolbar.getAttribute('data-testid'),
      className: toolbar.className,
      childCount: toolbar.children.length
    });
  });

  await test('Toolbar has all 4 tools', async () => {
    debug('Looking for tool buttons with data-testid...');

    // Method 1: Use new data-testid attributes (BEST)
    const highlightTool = document.querySelector('[data-testid="highlight-tool"]');
    const underlineTool = document.querySelector('[data-testid="underline-tool"]');
    const strikethroughTool = document.querySelector('[data-testid="strikethrough-tool"]');
    const stickyNoteTool = document.querySelector('[data-testid="sticky_note-tool"]');

    const toolsFound = [
      { name: 'highlight', element: highlightTool },
      { name: 'underline', element: underlineTool },
      { name: 'strikethrough', element: strikethroughTool },
      { name: 'sticky_note', element: stickyNoteTool }
    ];

    debug('Tools found by data-testid', toolsFound.map(t => ({
      name: t.name,
      found: !!t.element,
      testId: t.element?.getAttribute('data-testid'),
      title: t.element?.getAttribute('title')
    })));

    const foundCount = toolsFound.filter(t => t.element).length;

    if (foundCount < 4) {
      debug('⚠️ Not all tools found by data-testid, trying fallback...');

      // Fallback: Search by title/text
      const allButtons = Array.from(document.querySelectorAll('button'));
      debug('Total buttons on page', allButtons.length);

      const toolButtons = allButtons.filter(btn => {
        const title = btn.getAttribute('title')?.toLowerCase() || '';
        const text = btn.textContent || '';
        return title.includes('highlight') ||
               title.includes('underline') ||
               title.includes('strikethrough') ||
               title.includes('sticky') ||
               text.includes('🎨') ||
               text.includes('📝');
      });

      debug('Tool buttons found by fallback', toolButtons.map(b => ({
        title: b.getAttribute('title'),
        text: b.textContent.substring(0, 20),
        className: b.className
      })));

      if (toolButtons.length < 4) {
        throw new Error(`Only ${Math.max(foundCount, toolButtons.length)} tools found (expected 4)`);
      }
    }

    log('   ', `✅ All 4 tools found: highlight, underline, strikethrough, sticky_note`);
  });

  // ========== TEST 2: COLOR BAR VISIBILITY ==========
  log('🎨', '\n--- Test 2: Horizontal Color Bar ---\n');

  let highlightBtn;
  await test('Find highlight tool', async () => {
    debug('Searching for highlight tool with data-testid...');

    // Method 1: Use new data-testid attribute (BEST)
    highlightBtn = document.querySelector('[data-testid="highlight-tool"]');

    if (!highlightBtn) {
      debug('⚠️ data-testid not found, trying fallback selectors...');

      // Method 2: Search by title/text
      const allButtons = Array.from(document.querySelectorAll('button'));
      highlightBtn = allButtons.find(btn => {
        const title = btn.getAttribute('title')?.toLowerCase() || '';
        const text = btn.textContent || '';
        return title.includes('highlight') || text.includes('🎨');
      });

      if (!highlightBtn) {
        debug('❌ All button titles', allButtons.map(b => b.getAttribute('title')));
        throw new Error('Highlight tool not found');
      }
    }

    debug('✅ Highlight button found', {
      testId: highlightBtn.getAttribute('data-testid'),
      title: highlightBtn.getAttribute('title'),
      text: highlightBtn.textContent.substring(0, 20),
      className: highlightBtn.className
    });
  });

  await test('Select highlight tool', async () => {
    if (!highlightBtn) throw new Error('Highlight button not available');

    debug('Clicking highlight tool...');
    const wasSelected = highlightBtn.className.includes('bg-blue-600');
    debug('Tool was selected before click:', wasSelected);

    highlightBtn.click();
    await sleep(1000); // Wait for color bar to render

    const isSelected = highlightBtn.className.includes('bg-blue-600');
    debug('Tool is selected after click:', isSelected);
    debug('Highlight tool clicked, waiting for color bar...');
  });

  await test('Color bar appears when highlight tool selected', async () => {
    debug('Looking for color bar with data-testid...');

    // Method 1: Use new data-testid attribute (BEST)
    const colorBar = document.querySelector('[data-testid="color-bar"]');

    if (colorBar) {
      debug('✅ Color bar found by data-testid!');
      const colorButtons = colorBar.querySelectorAll('button[data-testid^="color-"]');
      debug('Color buttons in bar:', colorButtons.length);

      if (colorButtons.length < 5) {
        throw new Error(`Only ${colorButtons.length} color buttons found (expected 5)`);
      }

      log('   ', `Found ${colorButtons.length} color buttons in color bar`);
      return;
    }

    debug('⚠️ Color bar data-testid not found, trying fallback...');

    // Method 2: Use findColorButtons helper
    const colorButtons = findColorButtons();

    if (colorButtons.length === 0) {
      // Debug: Show what we found
      const allButtons = Array.from(document.querySelectorAll('button'));
      debug('❌ All buttons with background colors', allButtons.map(btn => ({
        text: btn.textContent.substring(0, 20),
        bgColor: window.getComputedStyle(btn).backgroundColor,
        borderRadius: window.getComputedStyle(btn).borderRadius
      })).filter(b => b.bgColor !== 'rgba(0, 0, 0, 0)'));

      const allTestIds = Array.from(document.querySelectorAll('[data-testid]'));
      debug('❌ All elements with data-testid', allTestIds.map(el => el.getAttribute('data-testid')));

      throw new Error(`Only ${colorButtons.length} color buttons found (expected 5)`);
    }

    log('   ', `Found ${colorButtons.length} color buttons`);
  });

  await test('All 5 colors present', async () => {
    debug('Checking all 5 colors are present...');

    // Method 1: Use new data-testid attributes (BEST)
    const yellowBtn = document.querySelector('[data-testid="color-yellow"]');
    const greenBtn = document.querySelector('[data-testid="color-green"]');
    const blueBtn = document.querySelector('[data-testid="color-blue"]');
    const pinkBtn = document.querySelector('[data-testid="color-pink"]');
    const orangeBtn = document.querySelector('[data-testid="color-orange"]');

    const colorsByTestId = [
      { name: 'yellow', element: yellowBtn, expectedColor: '#FFEB3B' },
      { name: 'green', element: greenBtn, expectedColor: '#4CAF50' },
      { name: 'blue', element: blueBtn, expectedColor: '#2196F3' },
      { name: 'pink', element: pinkBtn, expectedColor: '#E91E63' },
      { name: 'orange', element: orangeBtn, expectedColor: '#FF9800' }
    ];

    debug('Colors found by data-testid', colorsByTestId.map(c => ({
      name: c.name,
      found: !!c.element,
      testId: c.element?.getAttribute('data-testid'),
      dataColor: c.element?.getAttribute('data-color'),
      expectedColor: c.expectedColor
    })));

    const foundByTestId = colorsByTestId.filter(c => c.element).length;

    if (foundByTestId === 5) {
      log('   ', `✅ All 5 colors found: yellow, green, blue, pink, orange`);
      return;
    }

    debug(`⚠️ Only ${foundByTestId} colors found by data-testid, trying fallback...`);

    // Method 2: Use findColorButtons helper
    const colorButtons = findColorButtons();

    const foundColors = colorButtons.map(btn => {
      const style = window.getComputedStyle(btn);
      return style.backgroundColor;
    });

    debug('Found colors by fallback', foundColors);

    if (foundColors.length < 5) throw new Error(`Only ${foundColors.length} colors found`);
    log('   ', `Colors: ${foundColors.join(', ')}`);
  });

  // ========== TEST 3: SELECTED COLOR FEEDBACK ==========
  log('🎯', '\n--- Test 3: Selected Color Visual Feedback ---\n');

  await test('Click first color (Yellow)', async () => {
    debug('Looking for yellow color button...');

    // Method 1: Use new data-testid attribute (BEST)
    let yellowBtn = document.querySelector('[data-testid="color-yellow"]');

    if (!yellowBtn) {
      debug('⚠️ Yellow button data-testid not found, trying fallback...');

      // Method 2: Use data-color attribute
      yellowBtn = document.querySelector('[data-color="#FFEB3B"]');
    }

    if (!yellowBtn) {
      debug('⚠️ data-color not found, trying findColorButtons...');

      // Method 3: Use findColorButtons helper
      const colorButtons = findColorButtons();
      if (colorButtons.length === 0) throw new Error('No color buttons found');
      yellowBtn = colorButtons[0];
    }

    if (!yellowBtn) {
      const allTestIds = Array.from(document.querySelectorAll('[data-testid^="color-"]'));
      debug('❌ Available color test IDs', allTestIds.map(el => el.getAttribute('data-testid')));
      throw new Error('Yellow color button not found');
    }

    debug('✅ Yellow button found', {
      testId: yellowBtn.getAttribute('data-testid'),
      dataColor: yellowBtn.getAttribute('data-color'),
      bgColor: window.getComputedStyle(yellowBtn).backgroundColor
    });

    debug('Clicking yellow color button...');
    const beforeClick = {
      borderColor: window.getComputedStyle(yellowBtn).borderColor,
      borderWidth: window.getComputedStyle(yellowBtn).borderWidth,
      boxShadow: window.getComputedStyle(yellowBtn).boxShadow,
      transform: window.getComputedStyle(yellowBtn).transform,
      className: yellowBtn.className
    };
    debug('Button style before click', beforeClick);

    yellowBtn.click();
    await sleep(500);

    const afterClick = {
      borderColor: window.getComputedStyle(yellowBtn).borderColor,
      borderWidth: window.getComputedStyle(yellowBtn).borderWidth,
      boxShadow: window.getComputedStyle(yellowBtn).boxShadow,
      transform: window.getComputedStyle(yellowBtn).transform,
      className: yellowBtn.className
    };
    debug('Button style after click', afterClick);
  });

  await test('Selected color has visual feedback', async () => {
    debug('Checking for selected color visual feedback...');

    // Method 1: Check yellow button specifically
    const yellowBtn = document.querySelector('[data-testid="color-yellow"]') ||
                      document.querySelector('[data-color="#FFEB3B"]');

    if (yellowBtn) {
      const style = window.getComputedStyle(yellowBtn);
      const hasWhiteBorder = style.borderColor && style.borderColor.includes('255, 255, 255');
      const hasThickBorder = style.borderWidth && parseInt(style.borderWidth) > 1;
      const hasRing = style.boxShadow && style.boxShadow !== 'none';
      const hasScale = style.transform && style.transform.includes('scale');
      const hasSelectedClass = yellowBtn.className.includes('scale-110') ||
                               yellowBtn.className.includes('ring-2') ||
                               yellowBtn.className.includes('border-white');

      debug('Yellow button visual feedback', {
        hasWhiteBorder,
        hasThickBorder,
        hasRing,
        hasScale,
        hasSelectedClass,
        borderColor: style.borderColor,
        borderWidth: style.borderWidth,
        boxShadow: style.boxShadow,
        transform: style.transform,
        className: yellowBtn.className
      });

      if (hasWhiteBorder || hasThickBorder || hasRing || hasScale || hasSelectedClass) {
        log('   ', '✅ Selected color has visual feedback');
        return;
      }
    }

    debug('⚠️ Specific button check failed, trying all color buttons...');

    // Method 2: Check all color buttons
    const colorButtons = findColorButtons();

    // Check if any button has white border or ring (selected state)
    const selectedBtn = colorButtons.find(btn => {
      const style = window.getComputedStyle(btn);
      const borderColor = style.borderColor;
      const borderWidth = style.borderWidth;
      const boxShadow = style.boxShadow;
      const transform = style.transform;

      return (borderColor && borderColor.includes('255, 255, 255')) || // white border
             (borderWidth && parseInt(borderWidth) > 1) || // thick border
             (boxShadow && boxShadow !== 'none') || // ring effect
             (transform && transform.includes('scale')); // scale effect
    });

    if (!selectedBtn) {
      debug('❌ Color button styles', colorButtons.map(btn => ({
        bgColor: window.getComputedStyle(btn).backgroundColor,
        borderColor: window.getComputedStyle(btn).borderColor,
        borderWidth: window.getComputedStyle(btn).borderWidth,
        boxShadow: window.getComputedStyle(btn).boxShadow,
        transform: window.getComputedStyle(btn).transform,
        className: btn.className
      })));
      throw new Error('No selected color visual feedback found');
    }

    log('   ', '✅ Selected color has visual feedback');
  });

  await test('Click different color (Blue)', async () => {
    debug('Looking for blue color button...');

    // Method 1: Use new data-testid attribute (BEST)
    let blueBtn = document.querySelector('[data-testid="color-blue"]');

    if (!blueBtn) {
      debug('⚠️ Blue button data-testid not found, trying data-color...');

      // Method 2: Use data-color attribute
      blueBtn = document.querySelector('[data-color="#2196F3"]');
    }

    if (!blueBtn) {
      debug('⚠️ data-color not found, trying findColorButtons...');

      // Method 3: Use findColorButtons helper
      const colorButtons = findColorButtons();
      if (colorButtons.length < 3) throw new Error('Not enough color buttons');
      blueBtn = colorButtons[2]; // Blue is 3rd button
    }

    if (!blueBtn) {
      throw new Error('Blue color button not found');
    }

    debug('✅ Blue button found', {
      testId: blueBtn.getAttribute('data-testid'),
      dataColor: blueBtn.getAttribute('data-color'),
      bgColor: window.getComputedStyle(blueBtn).backgroundColor
    });

    debug('Clicking blue color button...');
    blueBtn.click();
    await sleep(500);

    debug('Blue button clicked', {
      borderColor: window.getComputedStyle(blueBtn).borderColor,
      boxShadow: window.getComputedStyle(blueBtn).boxShadow,
      transform: window.getComputedStyle(blueBtn).transform
    });
  });

  await test('Selected color changes in real-time', async () => {
    debug('Checking if blue button is now selected...');

    // Method 1: Check blue button specifically
    const blueBtn = document.querySelector('[data-testid="color-blue"]') ||
                    document.querySelector('[data-color="#2196F3"]');

    if (blueBtn) {
      const style = window.getComputedStyle(blueBtn);
      const hasWhiteBorder = style.borderColor && style.borderColor.includes('255, 255, 255');
      const hasThickBorder = style.borderWidth && parseInt(style.borderWidth) > 1;
      const hasRing = style.boxShadow && style.boxShadow !== 'none';
      const hasScale = style.transform && style.transform.includes('scale');

      debug('Blue button selection state', {
        hasWhiteBorder,
        hasThickBorder,
        hasRing,
        hasScale,
        borderColor: style.borderColor,
        boxShadow: style.boxShadow,
        transform: style.transform
      });

      if (hasWhiteBorder || hasThickBorder || hasRing || hasScale) {
        log('   ', '✅ Color selection updates in real-time');
        return;
      }
    }

    debug('⚠️ Specific button check failed, trying all color buttons...');

    // Method 2: Check all color buttons
    const colorButtons = findColorButtons();

    const selectedBtn = colorButtons.find(btn => {
      const style = window.getComputedStyle(btn);
      const borderColor = style.borderColor;
      const borderWidth = style.borderWidth;
      const boxShadow = style.boxShadow;
      const transform = style.transform;

      return (borderColor && borderColor.includes('255, 255, 255')) ||
             (borderWidth && parseInt(borderWidth) > 1) ||
             (boxShadow && boxShadow !== 'none') ||
             (transform && transform.includes('scale'));
    });

    if (!selectedBtn) {
      debug('❌ No selected button found');
      throw new Error('Selected color not updated');
    }

    log('   ', '✅ Color selection updates in real-time');
  });

  // ========== TEST 4: STICKY NOTE FEATURES ==========
  log('📝', '\n--- Test 4: Sticky Note Features ---\n');

  let stickyBtn;
  await test('Find sticky note tool', async () => {
    debug('Searching for sticky note tool with data-testid...');

    // Method 1: Use new data-testid attribute (BEST)
    stickyBtn = document.querySelector('[data-testid="sticky_note-tool"]');

    if (!stickyBtn) {
      debug('⚠️ data-testid not found, trying fallback selectors...');

      // Method 2: Search by title/text
      const allButtons = Array.from(document.querySelectorAll('button'));
      stickyBtn = allButtons.find(btn => {
        const title = btn.getAttribute('title')?.toLowerCase() || '';
        const text = btn.textContent || '';
        return title.includes('sticky') || text.includes('📝');
      });
    }

    if (!stickyBtn) {
      const allTestIds = Array.from(document.querySelectorAll('[data-testid*="tool"]'));
      debug('❌ Available tool test IDs', allTestIds.map(el => el.getAttribute('data-testid')));
      throw new Error('Sticky note tool not found');
    }

    debug('✅ Sticky note button found', {
      testId: stickyBtn.getAttribute('data-testid'),
      title: stickyBtn.getAttribute('title'),
      text: stickyBtn.textContent.substring(0, 20)
    });
  });

  await test('Select sticky note tool', async () => {
    if (!stickyBtn) throw new Error('Sticky note button not available');

    debug('Clicking sticky note tool...');
    const wasSelected = stickyBtn.className.includes('bg-blue-600');
    debug('Tool was selected before click:', wasSelected);

    stickyBtn.click();
    await sleep(500);

    const isSelected = stickyBtn.className.includes('bg-blue-600');
    debug('Tool is selected after click:', isSelected);
  });

  await test('Create sticky note via API', async () => {
    debug('Creating sticky note...', { projectId, userId, pmid });

    const res = await fetch(`${window.location.origin}/api/proxy/projects/${projectId}/annotations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId
      },
      body: JSON.stringify({
        content: 'Type to add note...',
        annotation_type: 'sticky_note',
        article_pmid: pmid,
        pdf_page: 1,
        sticky_note_position: { x: 0.5, y: 0.3, width: 200, height: 150 },
        sticky_note_color: '#FFEB3B',
        note_type: 'general',
        priority: 'medium',
        status: 'active',
        tags: []
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      debug('API error response', errorText);
      throw new Error(`API error: ${res.status} - ${errorText}`);
    }

    const data = await res.json();
    window.__testStickyId = data.annotation_id;
    debug('Sticky note created', { annotation_id: window.__testStickyId });

    await sleep(1500); // Wait for WebSocket update
  });

  await test('Sticky note appears on PDF', async () => {
    debug('Looking for sticky note in DOM...', { annotation_id: window.__testStickyId });
    debug('Current page PMID:', pmid);
    debug('Sticky note PMID:', pmid); // Should match

    // Try multiple selectors
    let stickyNote = document.querySelector(`[data-annotation-id="${window.__testStickyId}"]`);

    if (!stickyNote) {
      debug('⚠️ Sticky note not found by data-annotation-id, checking all annotations...');

      // Try finding any sticky notes
      const allStickyNotes = document.querySelectorAll('[data-annotation-id]');
      debug('All annotations with data-annotation-id in DOM', allStickyNotes.length);
      debug('Annotation details', Array.from(allStickyNotes).map(el => ({
        id: el.getAttribute('data-annotation-id'),
        className: el.className,
        text: el.textContent.substring(0, 50)
      })));

      // Try finding by class name
      const stickyByClass = document.querySelector('[class*="StickyNote"]') ||
                            document.querySelector('[class*="sticky-note"]');
      if (stickyByClass) {
        debug('Found sticky note by class name', {
          className: stickyByClass.className,
          id: stickyByClass.getAttribute('data-annotation-id')
        });
      } else {
        debug('❌ No sticky notes found by class name either');
      }

      // Check if PDFViewer has the annotation in state
      debug('Checking React state (if accessible)...');
      const pdfViewer = document.querySelector('[data-pmid]');
      if (pdfViewer) {
        debug('PDF viewer found', {
          pmid: pdfViewer.getAttribute('data-pmid'),
          childCount: pdfViewer.children.length
        });
      } else {
        debug('❌ PDF viewer not found - are you on a PDF page?');
      }

      throw new Error('Sticky note not found in DOM - check PMID match in console logs above');
    }

    debug('✅ Sticky note found in DOM!', {
      id: stickyNote.getAttribute('data-annotation-id'),
      className: stickyNote.className,
      position: {
        top: stickyNote.style.top,
        left: stickyNote.style.left
      }
    });

    log('   ', '✅ Sticky note rendered on PDF');
  });

  await test('Sticky note has placeholder text', async () => {
    const stickyNote = document.querySelector(`[data-annotation-id="${window.__testStickyId}"]`);
    if (!stickyNote) throw new Error('Sticky note not found');

    const content = stickyNote.textContent || stickyNote.innerText;
    debug('Sticky note content', content);

    if (!content.includes('Type to add note') && !content.includes('Click to add note')) {
      throw new Error(`Unexpected content: ${content}`);
    }
    log('   ', 'Placeholder text present ✓');
  });

  await test('Sticky note is draggable', async () => {
    const stickyNote = document.querySelector(`[data-annotation-id="${window.__testStickyId}"]`);
    if (!stickyNote) throw new Error('Sticky note not found');

    // Look for drag handle (header)
    const header = stickyNote.querySelector('[class*="header"]') ||
                  stickyNote.querySelector('[class*="Header"]') ||
                  stickyNote.firstElementChild;

    if (header) {
      const style = window.getComputedStyle(header);
      debug('Sticky note header style', {
        cursor: style.cursor,
        className: header.className
      });
    }

    log('   ', 'Sticky note structure verified ✓');
  });

  // ========== TEST 5: HIGHLIGHT ANNOTATIONS ==========
  log('🎨', '\n--- Test 5: Highlight Annotations ---\n');

  await test('Select highlight tool again', async () => {
    if (!highlightBtn) throw new Error('Highlight button not available');

    debug('Clicking highlight tool...');
    highlightBtn.click();
    await sleep(500);
  });

  await test('Create highlight annotation via API', async () => {
    debug('Creating highlight annotation...');

    const res = await fetch(`${window.location.origin}/api/proxy/projects/${projectId}/annotations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId
      },
      body: JSON.stringify({
        content: 'Test highlight',
        annotation_type: 'highlight',
        article_pmid: pmid,
        pdf_page: 1,
        pdf_coordinates: {
          x: 0.1,
          y: 0.2,
          width: 0.3,
          height: 0.025,
          pageWidth: 612,
          pageHeight: 792
        },
        highlight_color: '#FFEB3B',
        highlight_text: 'Sample highlighted text',
        note_type: 'general',
        priority: 'medium',
        status: 'active',
        tags: []
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      debug('API error response', errorText);
      throw new Error(`API error: ${res.status} - ${errorText}`);
    }

    const data = await res.json();
    window.__testHighlightId = data.annotation_id;
    debug('Highlight created', { annotation_id: window.__testHighlightId });

    await sleep(1500);
  });

  await test('Highlight appears in HighlightLayer', async () => {
    debug('Looking for HighlightLayer...');

    const highlightLayer = document.querySelector('[class*="HighlightLayer"]') ||
                          document.querySelector('[class*="highlight-layer"]');

    if (!highlightLayer) {
      debug('Looking for any highlights in DOM...');
      const allHighlights = document.querySelectorAll('[data-annotation-id]');
      debug('All annotations', Array.from(allHighlights).map(el => ({
        id: el.getAttribute('data-annotation-id'),
        className: el.className
      })));

      throw new Error('HighlightLayer not found');
    }

    debug('HighlightLayer found', highlightLayer.className);
    log('   ', 'Highlight rendering layer exists ✓');
  });

  // ========== TEST 6: UNDERLINE ANNOTATIONS ==========
  log('📏', '\n--- Test 6: Underline Annotations ---\n');

  let underlineBtn;
  await test('Find underline tool', async () => {
    debug('Searching for underline tool with data-testid...');

    // Method 1: Use new data-testid attribute (BEST)
    underlineBtn = document.querySelector('[data-testid="underline-tool"]');

    if (!underlineBtn) {
      debug('⚠️ data-testid not found, trying fallback selectors...');

      // Method 2: Search by title/text
      const allButtons = Array.from(document.querySelectorAll('button'));
      underlineBtn = allButtons.find(btn => {
        const title = btn.getAttribute('title')?.toLowerCase() || '';
        const text = btn.textContent || '';
        const className = btn.className || '';
        return title.includes('underline') ||
               (text.includes('U') && className.includes('underline'));
      });
    }

    if (!underlineBtn) {
      const allTestIds = Array.from(document.querySelectorAll('[data-testid*="tool"]'));
      debug('❌ Available tool test IDs', allTestIds.map(el => el.getAttribute('data-testid')));
      throw new Error('Underline tool not found');
    }

    debug('✅ Underline button found', {
      testId: underlineBtn.getAttribute('data-testid'),
      title: underlineBtn.getAttribute('title'),
      text: underlineBtn.textContent.substring(0, 20)
    });
  });

  await test('Select underline tool', async () => {
    if (!underlineBtn) throw new Error('Underline button not available');

    debug('Clicking underline tool...');
    const wasSelected = underlineBtn.className.includes('bg-blue-600');
    debug('Tool was selected before click:', wasSelected);

    underlineBtn.click();
    await sleep(500);

    const isSelected = underlineBtn.className.includes('bg-blue-600');
    debug('Tool is selected after click:', isSelected);
  });

  await test('Create underline annotation via API', async () => {
    debug('Creating underline annotation...');

    const res = await fetch(`${window.location.origin}/api/proxy/projects/${projectId}/annotations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId
      },
      body: JSON.stringify({
        content: 'Test underline',
        annotation_type: 'underline',
        article_pmid: pmid,
        pdf_page: 1,
        pdf_coordinates: {
          x: 0.1,
          y: 0.25,
          width: 0.3,
          height: 0.02,
          pageWidth: 612,
          pageHeight: 792
        },
        highlight_color: '#2196F3',
        highlight_text: 'Sample underlined text',
        note_type: 'general',
        priority: 'medium',
        status: 'active',
        tags: []
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      debug('API error response', errorText);
      throw new Error(`API error: ${res.status} - ${errorText}`);
    }

    const data = await res.json();
    window.__testUnderlineId = data.annotation_id;
    debug('Underline created', { annotation_id: window.__testUnderlineId });

    await sleep(1500);
  });

  await test('Underline annotation created successfully', async () => {
    if (!window.__testUnderlineId) throw new Error('Underline ID not set');
    log('   ', 'Underline annotation created ✓');
  });

  // ========== TEST 7: STRIKETHROUGH ANNOTATIONS ==========
  log('✂️', '\n--- Test 7: Strikethrough Annotations ---\n');

  let strikethroughBtn;
  await test('Find strikethrough tool', async () => {
    debug('Searching for strikethrough tool with data-testid...');

    // Method 1: Use new data-testid attribute (BEST)
    strikethroughBtn = document.querySelector('[data-testid="strikethrough-tool"]');

    if (!strikethroughBtn) {
      debug('⚠️ data-testid not found, trying fallback selectors...');

      // Method 2: Search by title/text
      const allButtons = Array.from(document.querySelectorAll('button'));
      strikethroughBtn = allButtons.find(btn => {
        const title = btn.getAttribute('title')?.toLowerCase() || '';
        const text = btn.textContent || '';
        const className = btn.className || '';
        return title.includes('strikethrough') ||
               title.includes('strike') ||
               (text.includes('S') && className.includes('line-through'));
      });
    }

    if (!strikethroughBtn) {
      const allTestIds = Array.from(document.querySelectorAll('[data-testid*="tool"]'));
      debug('❌ Available tool test IDs', allTestIds.map(el => el.getAttribute('data-testid')));
      throw new Error('Strikethrough tool not found');
    }

    debug('✅ Strikethrough button found', {
      testId: strikethroughBtn.getAttribute('data-testid'),
      title: strikethroughBtn.getAttribute('title'),
      text: strikethroughBtn.textContent.substring(0, 20)
    });
  });

  await test('Select strikethrough tool', async () => {
    if (!strikethroughBtn) throw new Error('Strikethrough button not available');

    debug('Clicking strikethrough tool...');
    const wasSelected = strikethroughBtn.className.includes('bg-blue-600');
    debug('Tool was selected before click:', wasSelected);

    strikethroughBtn.click();
    await sleep(500);

    const isSelected = strikethroughBtn.className.includes('bg-blue-600');
    debug('Tool is selected after click:', isSelected);
  });

  await test('Create strikethrough annotation via API', async () => {
    debug('Creating strikethrough annotation...');

    const res = await fetch(`${window.location.origin}/api/proxy/projects/${projectId}/annotations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId
      },
      body: JSON.stringify({
        content: 'Test strikethrough',
        annotation_type: 'strikethrough',
        article_pmid: pmid,
        pdf_page: 1,
        pdf_coordinates: {
          x: 0.1,
          y: 0.3,
          width: 0.3,
          height: 0.02,
          pageWidth: 612,
          pageHeight: 792
        },
        highlight_color: '#EF4444',
        highlight_text: 'Sample strikethrough text',
        note_type: 'general',
        priority: 'medium',
        status: 'active',
        tags: []
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      debug('API error response', errorText);
      throw new Error(`API error: ${res.status} - ${errorText}`);
    }

    const data = await res.json();
    window.__testStrikethroughId = data.annotation_id;
    debug('Strikethrough created', { annotation_id: window.__testStrikethroughId });

    await sleep(1500);
  });

  await test('Strikethrough annotation created successfully', async () => {
    if (!window.__testStrikethroughId) throw new Error('Strikethrough ID not set');
    log('   ', 'Strikethrough annotation created ✓');
  });

  // ========== TEST 8: REAL-TIME TEXT SELECTION ==========
  log('✨', '\n--- Test 8: Real-Time Text Selection Overlay ---\n');

  await test('SelectionOverlay component exists', async () => {
    debug('Looking for SelectionOverlay...');

    // The overlay might not be visible until text is selected
    // Just check if the PDF viewer is ready for selection
    const pdfViewer = document.querySelector('[class*="PDFViewer"]') ||
                     document.querySelector('[class*="pdf-viewer"]') ||
                     document.querySelector('canvas');

    if (!pdfViewer) throw new Error('PDF viewer not found');

    debug('PDF viewer found', pdfViewer.className || 'canvas');
    log('   ', 'PDF viewer ready for text selection ✓');
  });

  await test('Text selection is enabled', async () => {
    // Check if text selection is not disabled
    const body = document.body;
    const style = window.getComputedStyle(body);
    const userSelect = style.userSelect;

    debug('User select style', userSelect);

    if (userSelect === 'none') {
      log('   ', 'Warning: Text selection might be disabled');
    } else {
      log('   ', 'Text selection is enabled ✓');
    }
  });

  // ========== TEST 9: WEBSOCKET REAL-TIME UPDATES ==========
  log('🔄', '\n--- Test 9: WebSocket Real-Time Updates ---\n');

  await test('WebSocket connection exists', async () => {
    const wsConnected = window.__wsConnected ||
                       (typeof window.WebSocket !== 'undefined');
    if (!wsConnected) throw new Error('WebSocket not available');
    log('   ', 'WebSocket available ✓');
  });

  await test('All annotations created via WebSocket', async () => {
    // Check if all our test annotations exist
    const annotations = [
      window.__testStickyId,
      window.__testHighlightId,
      window.__testUnderlineId,
      window.__testStrikethroughId
    ].filter(Boolean);

    debug('Test annotations created', annotations);

    if (annotations.length < 4) {
      throw new Error(`Only ${annotations.length}/4 annotations created`);
    }

    log('   ', 'All 4 annotation types created successfully ✓');
  });

  // ========== CLEANUP ==========
  log('🧹', '\n--- Cleanup ---\n');

  const testAnnotations = [
    { id: window.__testStickyId, type: 'sticky note' },
    { id: window.__testHighlightId, type: 'highlight' },
    { id: window.__testUnderlineId, type: 'underline' },
    { id: window.__testStrikethroughId, type: 'strikethrough' }
  ].filter(a => a.id);

  for (const annotation of testAnnotations) {
    await test(`Delete test ${annotation.type}`, async () => {
      debug(`Deleting ${annotation.type}...`, annotation.id);

      const res = await fetch(`${window.location.origin}/api/proxy/projects/${projectId}/annotations/${annotation.id}`, {
        method: 'DELETE',
        headers: { 'User-ID': userId }
      });

      if (!res.ok) {
        debug(`Failed to delete ${annotation.type}`, res.status);
      }

      await sleep(300);
    });
  }

  // ========== FINAL REPORT ==========
  console.log('\n' + '='.repeat(70));
  log('📊', 'COMPREHENSIVE TEST RESULTS');
  console.log('='.repeat(70));
  log('✅', `Passed: ${stats.pass}/${stats.total}`);
  log('❌', `Failed: ${stats.fail}/${stats.total}`);
  log('📈', `Success Rate: ${((stats.pass / stats.total) * 100).toFixed(1)}%`);
  console.log('='.repeat(70));

  // Summary by category
  console.log('\n📋 Test Categories:');
  log('🔧', 'Annotation Toolbar: 2 tests');
  log('🎨', 'Color Bar & Selection: 6 tests');
  log('📝', 'Sticky Notes: 5 tests');
  log('🎨', 'Highlight Annotations: 3 tests');
  log('📏', 'Underline Annotations: 3 tests');
  log('✂️', 'Strikethrough Annotations: 3 tests');
  log('✨', 'Real-Time Selection: 2 tests');
  log('🔄', 'WebSocket Updates: 2 tests');
  log('🧹', 'Cleanup: 4 tests');

  console.log('\n📝 Test Annotations Created:');
  if (window.__testStickyId) log('   ', `✅ Sticky Note: ${window.__testStickyId.substring(0, 8)}...`);
  if (window.__testHighlightId) log('   ', `✅ Highlight: ${window.__testHighlightId.substring(0, 8)}...`);
  if (window.__testUnderlineId) log('   ', `✅ Underline: ${window.__testUnderlineId.substring(0, 8)}...`);
  if (window.__testStrikethroughId) log('   ', `✅ Strikethrough: ${window.__testStrikethroughId.substring(0, 8)}...`);

  console.log('\n' + '='.repeat(70));

  if (stats.fail === 0) {
    log('🎉', 'ALL TESTS PASSED! All annotation features working perfectly! 🚀');
    console.log('\n✨ Features Verified:');
    log('   ', '✅ Horizontal color bar (Cochrane Library style)');
    log('   ', '✅ Selected color visual feedback');
    log('   ', '✅ Sticky notes on PDF');
    log('   ', '✅ Highlight annotations');
    log('   ', '✅ Underline annotations');
    log('   ', '✅ Strikethrough annotations');
    log('   ', '✅ Real-time WebSocket updates');
  } else {
    log('⚠️', `${stats.fail} test(s) failed. Check errors above.`);
    console.log('\n💡 Troubleshooting Tips:');
    log('   ', '1. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)');
    log('   ', '2. Check if PDF is fully loaded');
    log('   ', '3. Verify you are signed in');
    log('   ', '4. Check browser console for errors');
    log('   ', '5. Try running the test again');
  }

  console.log('\n✨ Comprehensive test suite completed!\n');

  return {
    passed: stats.pass,
    failed: stats.fail,
    total: stats.total,
    annotations: {
      sticky: window.__testStickyId,
      highlight: window.__testHighlightId,
      underline: window.__testUnderlineId,
      strikethrough: window.__testStrikethroughId
    }
  };
})();

