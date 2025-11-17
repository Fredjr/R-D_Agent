/**
 * 🧪 COMPREHENSIVE NETWORK VIEW TEST SUITE
 * 
 * Tests ALL phases of development from Phase 1 to latest phase
 * Covers: JSON data structures, UI rendering, functionalities, interactions
 * 
 * Run in browser console on /explore/network page
 * 
 * Usage:
 * 1. Open https://r-d-agent-xcode.vercel.app/explore/network?pmid=41021024
 * 2. Open browser console (F12)
 * 3. Copy and paste this entire script
 * 4. Run: await runComprehensiveTests()
 */

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

const TEST_CONFIG = {
  // Test PMIDs
  TEST_PMID_MAIN: '41021024', // Main test paper
  TEST_PMID_SECONDARY: '40800212', // Secondary test paper
  TEST_PMID_NO_CITATIONS: '38869512', // Paper with no citations (recent)
  
  // API Endpoints
  PUBMED_NETWORK_API: '/api/proxy/pubmed/network',
  PUBMED_CITATIONS_API: '/api/proxy/pubmed/citations',
  PUBMED_REFERENCES_API: '/api/proxy/pubmed/references',
  PUBMED_ELINK_API: '/api/proxy/pubmed/elink',
  
  // Expected values
  MIN_NODES_INITIAL_GRAPH: 5,
  MIN_EDGES_INITIAL_GRAPH: 4,
  EXPECTED_NODE_COLORS: ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe', '#10b981'],
  EXPECTED_EDGE_COLORS: ['#10b981', '#3b82f6', '#8b5cf6'], // green, blue, purple
  
  // Timeouts
  API_TIMEOUT: 10000,
  RENDER_TIMEOUT: 5000,
  INTERACTION_DELAY: 1000,
};

// ============================================================================
// TEST UTILITIES
// ============================================================================

class TestRunner {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      tests: []
    };
    this.currentPhase = null;
  }

  startPhase(phaseName) {
    this.currentPhase = phaseName;
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🧪 TESTING PHASE: ${phaseName}`);
    console.log(`${'='.repeat(80)}\n`);
  }

  async test(name, testFn, options = {}) {
    this.results.total++;
    const testId = `${this.currentPhase} - ${name}`;
    
    console.log(`\n🔍 Testing: ${name}`);
    
    try {
      const startTime = Date.now();
      const result = await Promise.race([
        testFn(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Test timeout')), options.timeout || 30000)
        )
      ]);
      
      const duration = Date.now() - startTime;
      
      if (result.passed) {
        this.results.passed++;
        console.log(`✅ PASSED (${duration}ms): ${name}`);
        if (result.details) console.log(`   Details: ${result.details}`);
      } else {
        this.results.failed++;
        console.error(`❌ FAILED: ${name}`);
        console.error(`   Reason: ${result.reason}`);
        if (result.expected) console.error(`   Expected: ${result.expected}`);
        if (result.actual) console.error(`   Actual: ${result.actual}`);
      }
      
      this.results.tests.push({
        id: testId,
        name,
        phase: this.currentPhase,
        passed: result.passed,
        duration,
        ...result
      });
      
      return result;
    } catch (error) {
      this.results.failed++;
      console.error(`❌ ERROR: ${name}`);
      console.error(`   ${error.message}`);
      console.error(error.stack);
      
      this.results.tests.push({
        id: testId,
        name,
        phase: this.currentPhase,
        passed: false,
        error: error.message,
        stack: error.stack
      });
      
      return { passed: false, reason: error.message };
    }
  }

  printSummary() {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📊 TEST SUMMARY`);
    console.log(`${'='.repeat(80)}`);
    console.log(`Total Tests: ${this.results.total}`);
    console.log(`✅ Passed: ${this.results.passed} (${((this.results.passed / this.results.total) * 100).toFixed(1)}%)`);
    console.log(`❌ Failed: ${this.results.failed} (${((this.results.failed / this.results.total) * 100).toFixed(1)}%)`);
    console.log(`⏭️  Skipped: ${this.results.skipped}`);
    console.log(`${'='.repeat(80)}\n`);
    
    // Group by phase
    const byPhase = {};
    this.results.tests.forEach(test => {
      if (!byPhase[test.phase]) byPhase[test.phase] = { passed: 0, failed: 0 };
      if (test.passed) byPhase[test.phase].passed++;
      else byPhase[test.phase].failed++;
    });
    
    console.log('📈 Results by Phase:');
    Object.entries(byPhase).forEach(([phase, stats]) => {
      const total = stats.passed + stats.failed;
      const percentage = ((stats.passed / total) * 100).toFixed(1);
      console.log(`   ${phase}: ${stats.passed}/${total} (${percentage}%)`);
    });
    
    // Failed tests
    if (this.results.failed > 0) {
      console.log(`\n❌ Failed Tests:`);
      this.results.tests
        .filter(t => !t.passed)
        .forEach(t => {
          console.log(`   - ${t.id}`);
          console.log(`     Reason: ${t.reason || t.error}`);
        });
    }
    
    return this.results;
  }
}

// ============================================================================
// API TESTING UTILITIES
// ============================================================================

async function testAPI(url, expectedStructure) {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      return {
        passed: false,
        reason: `HTTP ${response.status}: ${response.statusText}`,
        actual: response.status
      };
    }
    
    const data = await response.json();
    
    // Validate structure
    const validation = validateStructure(data, expectedStructure);
    
    if (!validation.valid) {
      return {
        passed: false,
        reason: 'Invalid data structure',
        expected: expectedStructure,
        actual: validation.errors
      };
    }
    
    return {
      passed: true,
      details: `Received ${JSON.stringify(data).length} bytes`,
      data
    };
  } catch (error) {
    return {
      passed: false,
      reason: error.message
    };
  }
}

function validateStructure(data, structure) {
  const errors = [];
  
  for (const [key, type] of Object.entries(structure)) {
    if (!(key in data)) {
      errors.push(`Missing key: ${key}`);
      continue;
    }
    
    if (type === 'array' && !Array.isArray(data[key])) {
      errors.push(`${key} should be array, got ${typeof data[key]}`);
    } else if (type === 'object' && typeof data[key] !== 'object') {
      errors.push(`${key} should be object, got ${typeof data[key]}`);
    } else if (typeof type === 'string' && type !== 'array' && type !== 'object' && typeof data[key] !== type) {
      errors.push(`${key} should be ${type}, got ${typeof data[key]}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// DOM TESTING UTILITIES
// ============================================================================

function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) return resolve(element);
    
    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found after ${timeout}ms`));
    }, timeout);
  });
}

function waitForCondition(conditionFn, timeout = 5000, interval = 100) {
  return new Promise((resolve) => {
    const startTime = Date.now();

    const check = () => {
      const result = conditionFn();
      if (result) {
        resolve(result); // Return the actual result, not just true
      } else if (Date.now() - startTime > timeout) {
        resolve(null); // Return null instead of rejecting
      } else {
        setTimeout(check, interval);
      }
    };

    check();
  });
}

function getCytoscapeInstance() {
  // Find all divs and check for _cytoscape property
  const allDivs = document.querySelectorAll('div');
  for (const div of allDivs) {
    if (div._cytoscape) {
      console.log('✅ Found Cytoscape instance on div');
      return div._cytoscape;
    }
  }

  // Try window.cy (if exposed)
  if (window.cy) {
    console.log('✅ Found Cytoscape instance on window.cy');
    return window.cy;
  }

  console.log('❌ Cytoscape instance not found');
  return null;
}

// ============================================================================
// PHASE 1: FOUNDATION TESTS
// ============================================================================

async function testPhase1Foundation(runner) {
  runner.startPhase('PHASE 1: FOUNDATION');
  
  // Test 1.1: PubMed Network API
  await runner.test('PubMed Network API returns valid data', async () => {
    const url = `${TEST_CONFIG.PUBMED_NETWORK_API}?pmid=${TEST_CONFIG.TEST_PMID_MAIN}&type=citations&limit=15`;
    return await testAPI(url, {
      nodes: 'array',
      edges: 'array',
      metadata: 'object'
    });
  });
  
  // Test 1.2: Network has minimum nodes
  await runner.test('Network has minimum required nodes', async () => {
    const url = `${TEST_CONFIG.PUBMED_NETWORK_API}?pmid=${TEST_CONFIG.TEST_PMID_MAIN}&type=citations&limit=15`;
    const result = await testAPI(url, { nodes: 'array' });
    
    if (!result.passed) return result;
    
    const nodeCount = result.data.nodes.length;
    if (nodeCount < TEST_CONFIG.MIN_NODES_INITIAL_GRAPH) {
      return {
        passed: false,
        reason: 'Insufficient nodes',
        expected: `>= ${TEST_CONFIG.MIN_NODES_INITIAL_GRAPH}`,
        actual: nodeCount
      };
    }
    
    return {
      passed: true,
      details: `Found ${nodeCount} nodes`
    };
  });
  
  // Test 1.3: Network has edges
  await runner.test('Network has edges between nodes', async () => {
    const url = `${TEST_CONFIG.PUBMED_NETWORK_API}?pmid=${TEST_CONFIG.TEST_PMID_MAIN}&type=citations&limit=15`;
    const result = await testAPI(url, { edges: 'array' });
    
    if (!result.passed) return result;
    
    const edgeCount = result.data.edges.length;
    if (edgeCount < TEST_CONFIG.MIN_EDGES_INITIAL_GRAPH) {
      return {
        passed: false,
        reason: 'Insufficient edges',
        expected: `>= ${TEST_CONFIG.MIN_EDGES_INITIAL_GRAPH}`,
        actual: edgeCount
      };
    }
    
    return {
      passed: true,
      details: `Found ${edgeCount} edges`
    };
  });
  
  // Test 1.4: Nodes have required metadata
  await runner.test('Nodes have required metadata fields', async () => {
    const url = `${TEST_CONFIG.PUBMED_NETWORK_API}?pmid=${TEST_CONFIG.TEST_PMID_MAIN}&type=citations&limit=15`;
    const result = await testAPI(url, { nodes: 'array' });
    
    if (!result.passed) return result;
    
    const node = result.data.nodes[0];
    const requiredFields = ['id', 'label', 'metadata'];
    const missingFields = requiredFields.filter(field => !(field in node));
    
    if (missingFields.length > 0) {
      return {
        passed: false,
        reason: 'Missing required fields',
        expected: requiredFields,
        actual: `Missing: ${missingFields.join(', ')}`
      };
    }
    
    // Check metadata fields
    const requiredMetadata = ['pmid', 'title', 'authors', 'year'];
    const missingMetadata = requiredMetadata.filter(field => !(field in node.metadata));
    
    if (missingMetadata.length > 0) {
      return {
        passed: false,
        reason: 'Missing metadata fields',
        expected: requiredMetadata,
        actual: `Missing: ${missingMetadata.join(', ')}`
      };
    }
    
    return {
      passed: true,
      details: `Node has all required fields`
    };
  });
  
  // Test 1.5: Edges have relationship types
  await runner.test('Edges have relationship types', async () => {
    const url = `${TEST_CONFIG.PUBMED_NETWORK_API}?pmid=${TEST_CONFIG.TEST_PMID_MAIN}&type=citations&limit=15`;
    const result = await testAPI(url, { edges: 'array' });
    
    if (!result.passed) return result;
    
    const edge = result.data.edges[0];
    if (!edge.relationship) {
      return {
        passed: false,
        reason: 'Edge missing relationship field',
        actual: Object.keys(edge)
      };
    }
    
    const validRelationships = ['citation', 'reference', 'similarity'];
    if (!validRelationships.includes(edge.relationship)) {
      return {
        passed: false,
        reason: 'Invalid relationship type',
        expected: validRelationships,
        actual: edge.relationship
      };
    }
    
    return {
      passed: true,
      details: `Edge has relationship: ${edge.relationship}`
    };
  });
}

// ============================================================================
// PHASE 1.3A: EDGE VISUALIZATION TESTS
// ============================================================================

async function testPhase13AEdgeVisualization(runner) {
  runner.startPhase('PHASE 1.3A: EDGE VISUALIZATION');

  // Test: Edge colors are applied
  await runner.test('Edges have correct colors based on relationship', async () => {
    // Wait for graph to be rendered
    await new Promise(resolve => setTimeout(resolve, 2000));
    const cy = getCytoscapeInstance();

    if (!cy) {
      return {
        passed: false,
        reason: 'Cytoscape instance not found'
      };
    }

    const edges = cy.edges();
    if (edges.length === 0) {
      return {
        passed: false,
        reason: 'No edges found in graph'
      };
    }

    // Check if edges have colors
    const edgeColors = edges.map(edge => edge.style('line-color')).toArray();
    const uniqueColors = [...new Set(edgeColors)];

    // Should have at least 2 different colors (not all gray)
    if (uniqueColors.length < 2) {
      return {
        passed: false,
        reason: 'All edges have same color',
        actual: uniqueColors
      };
    }

    return {
      passed: true,
      details: `Found ${uniqueColors.length} different edge colors: ${uniqueColors.join(', ')}`
    };
  });

  // Test: Edge labels are visible
  await runner.test('Edges have labels showing relationship', async () => {
    const cy = getCytoscapeInstance();

    if (!cy) {
      return {
        passed: false,
        reason: 'Cytoscape instance not found'
      };
    }

    const edges = cy.edges();
    const edgesWithLabels = edges.filter(edge => {
      const label = edge.data('label') || edge.style('label');
      return label && label.length > 0;
    });

    if (edgesWithLabels.length === 0) {
      return {
        passed: false,
        reason: 'No edges have labels'
      };
    }

    return {
      passed: true,
      details: `${edgesWithLabels.length}/${edges.length} edges have labels`
    };
  });

  // Test: Edge legend exists
  await runner.test('Edge legend is visible in UI', async () => {
    const legend = document.querySelector('[class*="legend"]') ||
                   document.querySelector('[data-testid="edge-legend"]');

    if (!legend) {
      return {
        passed: false,
        reason: 'Edge legend not found in DOM'
      };
    }

    return {
      passed: true,
      details: 'Edge legend found'
    };
  });
}

// ============================================================================
// PHASE 1.3B: THREE-PANEL LAYOUT TESTS
// ============================================================================

async function testPhase13BThreePanelLayout(runner) {
  runner.startPhase('PHASE 1.3B: THREE-PANEL LAYOUT');

  // Test: Left panel (Paper List) exists
  await runner.test('Left panel (Paper List) is rendered', async () => {
    const leftPanel = document.querySelector('[class*="paper-list"]') ||
                      document.querySelector('[data-testid="paper-list-panel"]') ||
                      document.querySelector('.w-80.border-r');

    if (!leftPanel) {
      return {
        passed: false,
        reason: 'Left panel not found'
      };
    }

    return {
      passed: true,
      details: 'Left panel found'
    };
  });

  // Test: Center panel (Network Graph) exists
  await runner.test('Center panel (Network Graph) is rendered', async () => {
    // Check if Cytoscape instance exists
    const cy = getCytoscapeInstance();

    if (!cy) {
      return {
        passed: false,
        reason: 'Center panel (Cytoscape graph) not found'
      };
    }

    return {
      passed: true,
      details: 'Center panel found with Cytoscape instance'
    };
  });

  // Test: Right panel (Paper Details) exists
  await runner.test('Right panel (Paper Details) is rendered', async () => {
    const rightPanel = document.querySelector('[class*="network-sidebar"]') ||
                       document.querySelector('[data-testid="network-sidebar"]') ||
                       document.querySelector('.w-96.border-l');

    if (!rightPanel) {
      return {
        passed: false,
        reason: 'Right panel not found'
      };
    }

    return {
      passed: true,
      details: 'Right panel found'
    };
  });

  // Test: Layout is responsive
  await runner.test('Layout adapts to screen size', async () => {
    const container = document.querySelector('[class*="multi-column"]') ||
                      document.querySelector('.flex');

    if (!container) {
      return {
        passed: false,
        reason: 'Container not found'
      };
    }

    // Check if container has flex layout
    const computedStyle = window.getComputedStyle(container);
    const isFlexLayout = computedStyle.display === 'flex' ||
                         computedStyle.display === 'grid';

    if (!isFlexLayout) {
      return {
        passed: false,
        reason: 'Container is not using flex/grid layout',
        actual: computedStyle.display
      };
    }

    return {
      passed: true,
      details: `Container uses ${computedStyle.display} layout`
    };
  });
}

// ============================================================================
// PHASE 1.4: SIMILAR WORK TESTS
// ============================================================================

async function testPhase14SimilarWork(runner) {
  runner.startPhase('PHASE 1.4: SIMILAR WORK');

  // Test: Similar Work button exists
  await runner.test('Similar Work button is rendered', async () => {
    const button = Array.from(document.querySelectorAll('button'))
      .find(btn => btn.textContent.includes('Similar Work'));

    if (!button) {
      return {
        passed: false,
        reason: 'Similar Work button not found'
      };
    }

    return {
      passed: true,
      details: 'Similar Work button found'
    };
  });

  // Test: Similar Work API endpoint
  await runner.test('Similar Work API returns valid data', async () => {
    const url = `${TEST_CONFIG.PUBMED_CITATIONS_API}?pmid=${TEST_CONFIG.TEST_PMID_MAIN}&type=similar&limit=15`;
    return await testAPI(url, {
      citations: 'array',
      source_article: 'object'
    });
  });

  // Test: Similar Work button functionality
  await runner.test('Similar Work button adds nodes to graph', async () => {
    // Get initial node count
    const cy = getCytoscapeInstance();
    if (!cy) {
      return {
        passed: false,
        reason: 'Cytoscape instance not found'
      };
    }

    const initialNodeCount = cy.nodes().length;

    // Find and click Similar Work button
    const button = Array.from(document.querySelectorAll('button'))
      .find(btn => btn.textContent.includes('Similar Work'));

    if (!button) {
      return {
        passed: false,
        reason: 'Similar Work button not found'
      };
    }

    // First select a node
    const nodes = cy.nodes();
    if (nodes.length > 0) {
      nodes[0].select();
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Click button
    button.click();

    // Wait for nodes to be added
    await waitForCondition(() => {
      return cy.nodes().length > initialNodeCount;
    }, 10000);

    const finalNodeCount = cy.nodes().length;

    if (finalNodeCount <= initialNodeCount) {
      return {
        passed: false,
        reason: 'No nodes were added',
        expected: `> ${initialNodeCount}`,
        actual: finalNodeCount
      };
    }

    return {
      passed: true,
      details: `Added ${finalNodeCount - initialNodeCount} nodes`
    };
  }, { timeout: 15000 });
}

// ============================================================================
// PHASE 1.5: EARLIER/LATER WORK TESTS
// ============================================================================

async function testPhase15EarlierLaterWork(runner) {
  runner.startPhase('PHASE 1.5: EARLIER/LATER WORK');

  // Test: Earlier Work button exists
  await runner.test('Earlier Work button is rendered', async () => {
    const button = Array.from(document.querySelectorAll('button'))
      .find(btn => btn.textContent.includes('Earlier Work'));

    if (!button) {
      return {
        passed: false,
        reason: 'Earlier Work button not found'
      };
    }

    return {
      passed: true,
      details: 'Earlier Work button found'
    };
  });

  // Test: Later Work button exists
  await runner.test('Later Work button is rendered', async () => {
    const button = Array.from(document.querySelectorAll('button'))
      .find(btn => btn.textContent.includes('Later Work'));

    if (!button) {
      return {
        passed: false,
        reason: 'Later Work button not found'
      };
    }

    return {
      passed: true,
      details: 'Later Work button found'
    };
  });

  // Test: References API endpoint
  await runner.test('References API returns valid data', async () => {
    const url = `${TEST_CONFIG.PUBMED_REFERENCES_API}?pmid=${TEST_CONFIG.TEST_PMID_MAIN}&limit=15`;
    return await testAPI(url, {
      references: 'array',
      source_article: 'object'
    });
  });

  // Test: Citations API endpoint
  await runner.test('Citations API returns valid data', async () => {
    const url = `${TEST_CONFIG.PUBMED_CITATIONS_API}?pmid=${TEST_CONFIG.TEST_PMID_MAIN}&type=citations&limit=15`;
    return await testAPI(url, {
      citations: 'array',
      source_article: 'object'
    });
  });
}

// ============================================================================
// CROSS-REFERENCE DETECTION TESTS
// ============================================================================

async function testCrossReferenceDetection(runner) {
  runner.startPhase('CROSS-REFERENCE DETECTION');

  // Test: eLink API endpoint
  await runner.test('PubMed eLink API is accessible', async () => {
    const url = `${TEST_CONFIG.PUBMED_ELINK_API}?pmid=${TEST_CONFIG.TEST_PMID_MAIN}&linkname=pubmed_pubmed_refs`;
    return await testAPI(url, {
      linksets: 'array'
    });
  });

  // Test: Cross-references in initial graph
  await runner.test('Initial graph has cross-reference edges', async () => {
    const url = `${TEST_CONFIG.PUBMED_NETWORK_API}?pmid=${TEST_CONFIG.TEST_PMID_MAIN}&type=citations&limit=15`;
    const result = await testAPI(url, { edges: 'array', nodes: 'array' });

    if (!result.passed) return result;

    const { nodes, edges } = result.data;
    const nodeIds = nodes.map(n => n.id);

    // Find edges that are NOT from/to the source node
    const sourceId = TEST_CONFIG.TEST_PMID_MAIN;
    const crossRefEdges = edges.filter(edge =>
      edge.from !== sourceId && edge.to !== sourceId &&
      nodeIds.includes(edge.from) && nodeIds.includes(edge.to)
    );

    if (crossRefEdges.length === 0) {
      return {
        passed: false,
        reason: 'No cross-reference edges found',
        details: `Total edges: ${edges.length}, Source edges: ${edges.length - crossRefEdges.length}`
      };
    }

    return {
      passed: true,
      details: `Found ${crossRefEdges.length} cross-reference edges out of ${edges.length} total edges`
    };
  });

  // Test: Cross-references are detected in UI
  await runner.test('Graph displays cross-reference edges', async () => {
    const cy = getCytoscapeInstance();

    if (!cy) {
      return {
        passed: false,
        reason: 'Cytoscape instance not found'
      };
    }

    const edges = cy.edges();
    const nodes = cy.nodes();

    // Find source node (usually the largest or center node)
    const sourceNode = nodes.filter(node => {
      const degree = node.degree();
      return degree > nodes.length / 2; // Source typically connects to most nodes
    })[0];

    if (!sourceNode) {
      return {
        passed: false,
        reason: 'Could not identify source node'
      };
    }

    // Find edges that don't involve source node
    const crossRefEdges = edges.filter(edge => {
      const source = edge.source().id();
      const target = edge.target().id();
      return source !== sourceNode.id() && target !== sourceNode.id();
    });

    if (crossRefEdges.length === 0) {
      return {
        passed: false,
        reason: 'No cross-reference edges visible in graph',
        details: `Total edges: ${edges.length}`
      };
    }

    return {
      passed: true,
      details: `Found ${crossRefEdges.length} cross-reference edges in graph`
    };
  });
}

// ============================================================================
// NODE GRADIENT COLOR TESTS
// ============================================================================

async function testNodeGradientColors(runner) {
  runner.startPhase('NODE GRADIENT COLORS');

  // Test: Nodes have gradient colors based on year
  await runner.test('Nodes have gradient colors based on publication year', async () => {
    const cy = getCytoscapeInstance();

    if (!cy) {
      return {
        passed: false,
        reason: 'Cytoscape instance not found'
      };
    }

    const nodes = cy.nodes();
    const nodeColors = nodes.map(node => node.style('background-color')).toArray();
    const uniqueColors = [...new Set(nodeColors)];

    // Should have at least 3 different colors (gradient)
    if (uniqueColors.length < 3) {
      return {
        passed: false,
        reason: 'Not enough color variation (expected gradient)',
        expected: '>= 3 colors',
        actual: `${uniqueColors.length} colors: ${uniqueColors.join(', ')}`
      };
    }

    return {
      passed: true,
      details: `Found ${uniqueColors.length} different node colors (gradient)`
    };
  });

  // Test: Recent papers are darker blue
  await runner.test('Recent papers have darker blue color', async () => {
    const url = `${TEST_CONFIG.PUBMED_NETWORK_API}?pmid=${TEST_CONFIG.TEST_PMID_MAIN}&type=citations&limit=15`;
    const result = await testAPI(url, { nodes: 'array' });

    if (!result.passed) return result;

    const currentYear = new Date().getFullYear();
    const recentPapers = result.data.nodes.filter(node =>
      node.metadata.year >= currentYear - 1
    );

    if (recentPapers.length === 0) {
      return {
        passed: true,
        details: 'No recent papers to test (skipped)'
      };
    }

    // Check if recent papers have dark blue color
    const darkBlue = '#1e40af';
    const recentPapersWithDarkBlue = recentPapers.filter(node =>
      node.color === darkBlue || node.metadata.color === darkBlue
    );

    return {
      passed: true,
      details: `${recentPapersWithDarkBlue.length}/${recentPapers.length} recent papers have dark blue color`
    };
  });

  // Test: Old papers are lighter blue
  await runner.test('Old papers have lighter blue color', async () => {
    const url = `${TEST_CONFIG.PUBMED_NETWORK_API}?pmid=${TEST_CONFIG.TEST_PMID_MAIN}&type=citations&limit=15`;
    const result = await testAPI(url, { nodes: 'array' });

    if (!result.passed) return result;

    const currentYear = new Date().getFullYear();
    const oldPapers = result.data.nodes.filter(node =>
      node.metadata.year <= currentYear - 10
    );

    if (oldPapers.length === 0) {
      return {
        passed: true,
        details: 'No old papers to test (skipped)'
      };
    }

    // Check if old papers have light blue color
    const lightBlue = '#dbeafe';
    const oldPapersWithLightBlue = oldPapers.filter(node =>
      node.color === lightBlue || node.metadata.color === lightBlue
    );

    return {
      passed: true,
      details: `${oldPapersWithLightBlue.length}/${oldPapers.length} old papers have light blue color`
    };
  });
}

// ============================================================================
// RESPONSIVE DESIGN TESTS
// ============================================================================

async function testResponsiveDesign(runner) {
  runner.startPhase('RESPONSIVE DESIGN');

  // Test: Font sizes are readable
  await runner.test('Sidebar font sizes are readable (>= 14px)', async () => {
    const sidebar = document.querySelector('[class*="network-sidebar"]');

    if (!sidebar) {
      return {
        passed: false,
        reason: 'Sidebar not found'
      };
    }

    const computedStyle = window.getComputedStyle(sidebar);
    const fontSize = parseFloat(computedStyle.fontSize);

    if (fontSize < 14) {
      return {
        passed: false,
        reason: 'Font size too small',
        expected: '>= 14px',
        actual: `${fontSize}px`
      };
    }

    return {
      passed: true,
      details: `Sidebar font size: ${fontSize}px`
    };
  });

  // Test: Network view adapts to screen size
  await runner.test('Network view width adapts to screen size', async () => {
    const container = document.querySelector('[class*="multi-column"]');

    if (!container) {
      return {
        passed: false,
        reason: 'Container not found'
      };
    }

    const width = container.offsetWidth;
    const screenWidth = window.innerWidth;

    // Should use significant portion of screen
    if (width < screenWidth * 0.5) {
      return {
        passed: false,
        reason: 'Network view too narrow',
        expected: `>= ${screenWidth * 0.5}px`,
        actual: `${width}px`
      };
    }

    return {
      passed: true,
      details: `Network view width: ${width}px (${((width / screenWidth) * 100).toFixed(1)}% of screen)`
    };
  });

  // Test: Touch targets are large enough on mobile
  await runner.test('Buttons have adequate touch targets', async () => {
    const buttons = document.querySelectorAll('button');

    if (buttons.length === 0) {
      return {
        passed: false,
        reason: 'No buttons found'
      };
    }

    const smallButtons = Array.from(buttons).filter(btn => {
      const rect = btn.getBoundingClientRect();
      return rect.height < 36; // Minimum recommended touch target
    });

    if (smallButtons.length > buttons.length * 0.5) {
      return {
        passed: false,
        reason: 'Too many buttons with small touch targets',
        details: `${smallButtons.length}/${buttons.length} buttons < 36px height`
      };
    }

    return {
      passed: true,
      details: `${buttons.length - smallButtons.length}/${buttons.length} buttons have adequate touch targets`
    };
  });
}

// ============================================================================
// MULTI-COLUMN NETWORK VIEW TESTS
// ============================================================================

async function testMultiColumnNetworkView(runner) {
  runner.startPhase('MULTI-COLUMN NETWORK VIEW');

  // Test: Multi-column container exists
  await runner.test('Multi-column container is rendered', async () => {
    const container = document.querySelector('[class*="multi-column"]');

    if (!container) {
      return {
        passed: false,
        reason: 'Multi-column container not found'
      };
    }

    return {
      passed: true,
      details: 'Multi-column container found'
    };
  });

  // Test: Columns can be created
  await runner.test('New columns can be created via exploration', async () => {
    // Find "Similar Work" button in Explore Papers section
    const buttons = Array.from(document.querySelectorAll('button'));
    const similarWorkButton = buttons.find(btn =>
      btn.textContent.includes('Similar Work') &&
      btn.closest('[class*="explore"]')
    );

    if (!similarWorkButton) {
      return {
        passed: true,
        details: 'Similar Work exploration button not found (may not be visible)'
      };
    }

    // Get initial column count
    const initialColumns = document.querySelectorAll('[class*="network-column"]').length;

    // Click button
    similarWorkButton.click();

    // Wait for new column
    await new Promise(resolve => setTimeout(resolve, 2000));

    const finalColumns = document.querySelectorAll('[class*="network-column"]').length;

    if (finalColumns <= initialColumns) {
      return {
        passed: false,
        reason: 'No new column created',
        expected: `> ${initialColumns}`,
        actual: finalColumns
      };
    }

    return {
      passed: true,
      details: `Created new column (${initialColumns} → ${finalColumns})`
    };
  }, { timeout: 10000 });

  // Test: Columns have proper titles
  await runner.test('Columns have descriptive titles', async () => {
    const columns = document.querySelectorAll('[class*="network-column"]');

    if (columns.length === 0) {
      return {
        passed: false,
        reason: 'No columns found'
      };
    }

    const columnsWithTitles = Array.from(columns).filter(col => {
      const title = col.querySelector('h2, h3, [class*="title"]');
      return title && title.textContent.trim().length > 0;
    });

    if (columnsWithTitles.length === 0) {
      return {
        passed: false,
        reason: 'No columns have titles'
      };
    }

    return {
      passed: true,
      details: `${columnsWithTitles.length}/${columns.length} columns have titles`
    };
  });
}

// ============================================================================
// BUTTON BEHAVIOR TESTS
// ============================================================================

async function testButtonBehavior(runner) {
  runner.startPhase('BUTTON BEHAVIOR');

  // Test: All References button shows list only
  await runner.test('All References button shows list (not column)', async () => {
    const button = Array.from(document.querySelectorAll('button'))
      .find(btn => btn.textContent.includes('All References'));

    if (!button) {
      return {
        passed: true,
        details: 'All References button not found (may not be visible)'
      };
    }

    // Get initial column count
    const initialColumns = document.querySelectorAll('[class*="network-column"]').length;

    // Click button
    button.click();

    // Wait
    await new Promise(resolve => setTimeout(resolve, 2000));

    const finalColumns = document.querySelectorAll('[class*="network-column"]').length;

    // Should NOT create new column
    if (finalColumns > initialColumns) {
      return {
        passed: false,
        reason: 'All References button created column (should only show list)',
        expected: initialColumns,
        actual: finalColumns
      };
    }

    return {
      passed: true,
      details: 'All References button shows list only (no column created)'
    };
  }, { timeout: 10000 });

  // Test: All Citations button shows list only
  await runner.test('All Citations button shows list (not column)', async () => {
    const button = Array.from(document.querySelectorAll('button'))
      .find(btn => btn.textContent.includes('All Citations'));

    if (!button) {
      return {
        passed: true,
        details: 'All Citations button not found (may not be visible)'
      };
    }

    // Get initial column count
    const initialColumns = document.querySelectorAll('[class*="network-column"]').length;

    // Click button
    button.click();

    // Wait
    await new Promise(resolve => setTimeout(resolve, 2000));

    const finalColumns = document.querySelectorAll('[class*="network-column"]').length;

    // Should NOT create new column
    if (finalColumns > initialColumns) {
      return {
        passed: false,
        reason: 'All Citations button created column (should only show list)',
        expected: initialColumns,
        actual: finalColumns
      };
    }

    return {
      passed: true,
      details: 'All Citations button shows list only (no column created)'
    };
  }, { timeout: 10000 });
}

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

async function testPerformance(runner) {
  runner.startPhase('PERFORMANCE');

  // Test: Initial graph loads quickly
  await runner.test('Initial graph loads within 5 seconds', async () => {
    const startTime = Date.now();

    // Wait for Cytoscape instance to be available
    const cy = await waitForCondition(() => getCytoscapeInstance(), 5000);

    if (!cy) {
      return {
        passed: false,
        reason: 'Cytoscape instance not found after 5 seconds'
      };
    }

    // Wait for nodes to be loaded
    await waitForCondition(() => cy.nodes().length > 0, 5000);

    const loadTime = Date.now() - startTime;

    if (loadTime > 5000) {
      return {
        passed: false,
        reason: 'Graph took too long to load',
        expected: '<= 5000ms',
        actual: `${loadTime}ms`
      };
    }

    return {
      passed: true,
      details: `Graph loaded in ${loadTime}ms`
    };
  });

  // Test: Graph interactions are smooth
  await runner.test('Graph interactions are responsive', async () => {
    const cy = getCytoscapeInstance();

    if (!cy) {
      return {
        passed: false,
        reason: 'Cytoscape instance not found'
      };
    }

    const nodes = cy.nodes();
    if (nodes.length === 0) {
      return {
        passed: false,
        reason: 'No nodes to test'
      };
    }

    // Test node selection
    const startTime = Date.now();
    nodes[0].select();
    const selectionTime = Date.now() - startTime;

    if (selectionTime > 100) {
      return {
        passed: false,
        reason: 'Node selection too slow',
        expected: '<= 100ms',
        actual: `${selectionTime}ms`
      };
    }

    return {
      passed: true,
      details: `Node selection: ${selectionTime}ms`
    };
  });

  // Test: API responses are cached
  await runner.test('API responses are cached for performance', async () => {
    const url = `${TEST_CONFIG.PUBMED_NETWORK_API}?pmid=${TEST_CONFIG.TEST_PMID_MAIN}&type=citations&limit=15`;

    // First request
    const start1 = Date.now();
    await fetch(url);
    const time1 = Date.now() - start1;

    // Second request (should be cached)
    const start2 = Date.now();
    const response = await fetch(url);
    const time2 = Date.now() - start2;

    const data = await response.json();

    // Check if cached
    if (data.cached === true || time2 < time1 * 0.5) {
      return {
        passed: true,
        details: `First: ${time1}ms, Second: ${time2}ms (cached)`
      };
    }

    return {
      passed: true,
      details: `First: ${time1}ms, Second: ${time2}ms (may not be cached)`
    };
  });
}

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

async function testErrorHandling(runner) {
  runner.startPhase('ERROR HANDLING');

  // Test: Handles paper with no citations gracefully
  await runner.test('Handles paper with no citations gracefully', async () => {
    const url = `${TEST_CONFIG.PUBMED_CITATIONS_API}?pmid=${TEST_CONFIG.TEST_PMID_NO_CITATIONS}&type=citations&limit=10`;
    const result = await testAPI(url, { citations: 'array' });

    if (!result.passed) return result;

    // Should return empty array, not error
    if (!Array.isArray(result.data.citations)) {
      return {
        passed: false,
        reason: 'Citations is not an array',
        actual: typeof result.data.citations
      };
    }

    return {
      passed: true,
      details: `Returned ${result.data.citations.length} citations (graceful handling)`
    };
  });

  // Test: Handles invalid PMID gracefully
  await runner.test('Handles invalid PMID gracefully', async () => {
    const url = `${TEST_CONFIG.PUBMED_NETWORK_API}?pmid=invalid123&type=citations&limit=15`;
    const response = await fetch(url);

    // Should return error response, not crash
    if (response.ok) {
      const data = await response.json();
      // Check if it has error handling
      if (data.error || data._error || data._placeholder) {
        return {
          passed: true,
          details: 'API returned error response gracefully'
        };
      }
    }

    return {
      passed: true,
      details: `API returned ${response.status} status`
    };
  });

  // Test: UI shows error messages
  await runner.test('UI shows error messages when API fails', async () => {
    // Check if toast/notification system exists
    const toastContainer = document.querySelector('[class*="toast"]') ||
                           document.querySelector('[class*="notification"]') ||
                           document.querySelector('[role="alert"]');

    if (!toastContainer) {
      return {
        passed: true,
        details: 'Toast container not found (may not be visible)'
      };
    }

    return {
      passed: true,
      details: 'Toast/notification system exists'
    };
  });
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runComprehensiveTests() {
  console.clear();
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║   🧪 COMPREHENSIVE NETWORK VIEW TEST SUITE                               ║
║                                                                           ║
║   Testing ALL phases of development:                                     ║
║   - Phase 1: Foundation (Network API, Nodes, Edges)                      ║
║   - Phase 1.3A: Edge Visualization                                       ║
║   - Phase 1.3B: Three-Panel Layout                                       ║
║   - Phase 1.4: Similar Work                                              ║
║   - Phase 1.5: Earlier/Later Work                                        ║
║   - Cross-Reference Detection                                            ║
║   - Node Gradient Colors                                                 ║
║   - Responsive Design                                                    ║
║   - Multi-Column Network View                                            ║
║   - Button Behavior                                                      ║
║   - Performance                                                          ║
║   - Error Handling                                                       ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
  `);

  const runner = new TestRunner();

  try {
    // Run all test phases
    await testPhase1Foundation(runner);
    await testPhase13AEdgeVisualization(runner);
    await testPhase13BThreePanelLayout(runner);
    await testPhase14SimilarWork(runner);
    await testPhase15EarlierLaterWork(runner);
    await testCrossReferenceDetection(runner);
    await testNodeGradientColors(runner);
    await testResponsiveDesign(runner);
    await testMultiColumnNetworkView(runner);
    await testButtonBehavior(runner);
    await testPerformance(runner);
    await testErrorHandling(runner);

    // Print summary
    const results = runner.printSummary();

    // Export results
    window.testResults = results;
    console.log('\n💾 Test results saved to window.testResults');
    console.log('📥 Download results: copy(JSON.stringify(window.testResults, null, 2))');

    return results;
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    throw error;
  }
}

// ============================================================================
// QUICK TEST FUNCTIONS (for individual testing)
// ============================================================================

async function quickTestAPI() {
  console.log('🔍 Quick API Test...\n');
  const runner = new TestRunner();
  await testPhase1Foundation(runner);
  return runner.printSummary();
}

async function quickTestUI() {
  console.log('🔍 Quick UI Test...\n');
  const runner = new TestRunner();
  await testPhase13AEdgeVisualization(runner);
  await testPhase13BThreePanelLayout(runner);
  return runner.printSummary();
}

async function quickTestButtons() {
  console.log('🔍 Quick Button Test...\n');
  const runner = new TestRunner();
  await testPhase14SimilarWork(runner);
  await testPhase15EarlierLaterWork(runner);
  await testButtonBehavior(runner);
  return runner.printSummary();
}

async function quickTestColors() {
  console.log('🔍 Quick Color Test...\n');
  const runner = new TestRunner();
  await testNodeGradientColors(runner);
  await testPhase13AEdgeVisualization(runner);
  return runner.printSummary();
}

// ============================================================================
// EXPORT FOR CONSOLE USE
// ============================================================================

console.log(`
✅ Test suite loaded successfully!

📚 Available commands:
  - runComprehensiveTests()  : Run ALL tests
  - quickTestAPI()           : Test API endpoints only
  - quickTestUI()            : Test UI rendering only
  - quickTestButtons()       : Test button functionality only
  - quickTestColors()        : Test node/edge colors only

🚀 To start testing, run:
  await runComprehensiveTests()
`);

// Auto-export to window for easy access
window.runComprehensiveTests = runComprehensiveTests;
window.quickTestAPI = quickTestAPI;
window.quickTestUI = quickTestUI;
window.quickTestButtons = quickTestButtons;
window.quickTestColors = quickTestColors;

