/**
 * 🔍 DEBUG SCRIPT: Check Cytoscape Instance
 * 
 * Run this in browser console to debug why tests can't find Cytoscape
 * 
 * Usage:
 * 1. Open /explore/network page
 * 2. Wait for graph to load
 * 3. Copy and paste this script
 * 4. Run: debugCytoscape()
 */

function debugCytoscape() {
  console.log('🔍 DEBUGGING CYTOSCAPE INSTANCE\n');
  console.log('='.repeat(80));
  
  // Check 1: window.__cytoscapeInstance
  console.log('\n1️⃣ Checking window.__cytoscapeInstance:');
  if (window.__cytoscapeInstance) {
    console.log('✅ FOUND on window.__cytoscapeInstance');
    console.log('   Nodes:', window.__cytoscapeInstance.nodes().length);
    console.log('   Edges:', window.__cytoscapeInstance.edges().length);
  } else {
    console.log('❌ NOT FOUND on window.__cytoscapeInstance');
  }
  
  // Check 2: window.cy
  console.log('\n2️⃣ Checking window.cy:');
  if (window.cy) {
    console.log('✅ FOUND on window.cy');
    console.log('   Nodes:', window.cy.nodes().length);
    console.log('   Edges:', window.cy.edges().length);
  } else {
    console.log('❌ NOT FOUND on window.cy');
  }
  
  // Check 3: Scan all divs for _cytoscape property
  console.log('\n3️⃣ Scanning all divs for _cytoscape property:');
  const allDivs = document.querySelectorAll('div');
  let foundInDiv = false;
  for (const div of allDivs) {
    if (div._cytoscape) {
      console.log('✅ FOUND on div._cytoscape');
      console.log('   Div:', div);
      console.log('   Nodes:', div._cytoscape.nodes().length);
      console.log('   Edges:', div._cytoscape.edges().length);
      foundInDiv = true;
      break;
    }
  }
  if (!foundInDiv) {
    console.log('❌ NOT FOUND on any div._cytoscape');
  }
  
  // Check 4: Look for Cytoscape container
  console.log('\n4️⃣ Looking for Cytoscape container:');
  const containers = [
    document.querySelector('[data-id="cytoscape-container"]'),
    document.querySelector('.cytoscape-container'),
    document.querySelector('[class*="cytoscape"]'),
  ];
  
  containers.forEach((container, i) => {
    if (container) {
      console.log(`✅ Container ${i + 1} found:`, container);
      console.log('   Has _cytoscape?', !!container._cytoscape);
      console.log('   Has cy?', !!container.cy);
    } else {
      console.log(`❌ Container ${i + 1} not found`);
    }
  });
  
  // Check 5: Look for React components
  console.log('\n5️⃣ Looking for React components:');
  const reactRoots = document.querySelectorAll('[data-reactroot]');
  console.log(`   Found ${reactRoots.length} React roots`);
  
  // Check 6: Check if graph is visible
  console.log('\n6️⃣ Checking if graph is visible:');
  const graphVisible = document.querySelector('canvas') !== null;
  console.log(`   Canvas element: ${graphVisible ? '✅ FOUND' : '❌ NOT FOUND'}`);
  
  // Check 7: Check console logs
  console.log('\n7️⃣ Recent console logs:');
  console.log('   Check above for logs containing "[Cytoscape]" or "onInit"');
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 SUMMARY:');
  console.log('='.repeat(80));
  
  const found = window.__cytoscapeInstance || window.cy || foundInDiv;
  
  if (found) {
    console.log('✅ Cytoscape instance IS available');
    console.log('\n💡 To access it in tests, use:');
    if (window.__cytoscapeInstance) {
      console.log('   window.__cytoscapeInstance');
    } else if (window.cy) {
      console.log('   window.cy');
    } else {
      console.log('   Scan divs for _cytoscape property');
    }
  } else {
    console.log('❌ Cytoscape instance NOT available');
    console.log('\n💡 Possible reasons:');
    console.log('   1. Graph hasn\'t loaded yet (wait a few seconds)');
    console.log('   2. You\'re not on /explore/network page');
    console.log('   3. Deployment hasn\'t updated yet (hard refresh: Cmd+Shift+R)');
    console.log('   4. NetworkView component hasn\'t exposed the instance');
  }
  
  console.log('\n' + '='.repeat(80));
  
  return {
    foundOnWindow: !!window.__cytoscapeInstance,
    foundOnWindowCy: !!window.cy,
    foundOnDiv: foundInDiv,
    graphVisible,
    available: found
  };
}

// Auto-run on load
console.log('🔍 Debug script loaded. Run: debugCytoscape()');

// Export to window
window.debugCytoscape = debugCytoscape;

