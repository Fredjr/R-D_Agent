/**
 * ============================================================================
 * DEBUG QUESTION CREATION SCRIPT
 * ============================================================================
 * 
 * This script monitors what happens when you create a question.
 * It will show you EXACTLY what data is being sent and received.
 * 
 * USAGE:
 * 1. Copy/paste this script into browser console
 * 2. Press Enter
 * 3. Then manually create a question using the UI
 * 4. Watch the console output
 * ============================================================================
 */

console.log('%c╔════════════════════════════════════════════════════════════════╗', 'color: #1DB954; font-weight: bold; font-size: 16px');
console.log('%c║         DEBUG QUESTION CREATION - MONITORING ACTIVE            ║', 'color: #1DB954; font-weight: bold; font-size: 16px');
console.log('%c╚════════════════════════════════════════════════════════════════╝', 'color: #1DB954; font-weight: bold; font-size: 16px');
console.log('');
console.log('✅ Monitoring is now active!');
console.log('📝 Now create a question using the UI...');
console.log('👀 Watch this console for detailed logs');
console.log('');

// The fixes we applied added console.log statements to all API functions
// So we should now see detailed logs when you create a question

// Let's also add a listener for any errors
window.addEventListener('error', (event) => {
  console.error('%c🚨 JAVASCRIPT ERROR DETECTED:', 'color: #FF6B6B; font-weight: bold; font-size: 14px');
  console.error('   Message:', event.message);
  console.error('   File:', event.filename);
  console.error('   Line:', event.lineno);
  console.error('   Column:', event.colno);
  console.error('   Error:', event.error);
  console.error('');
});

// Listen for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('%c🚨 UNHANDLED PROMISE REJECTION:', 'color: #FF6B6B; font-weight: bold; font-size: 14px');
  console.error('   Reason:', event.reason);
  console.error('   Promise:', event.promise);
  console.error('');
});

console.log('%c═══════════════════════════════════════════════════════════════', 'color: #1DB954; font-weight: bold');
console.log('%cWAITING FOR YOU TO CREATE A QUESTION...', 'color: #1DB954; font-weight: bold; font-size: 14px');
console.log('%c═══════════════════════════════════════════════════════════════', 'color: #1DB954; font-weight: bold');
console.log('');
console.log('📋 What to do:');
console.log('   1. Click "Add Question" button');
console.log('   2. Fill in the question text');
console.log('   3. Click "Save Question"');
console.log('   4. Watch this console for logs');
console.log('');
console.log('🔍 What to look for:');
console.log('   ✅ [API] Creating question: {...}');
console.log('   ✅ [API] Response status: 201 Created');
console.log('   ✅ [API] Question created successfully: abc-123-...');
console.log('');
console.log('   OR');
console.log('');
console.log('   ❌ [API] Error creating question: {...}');
console.log('   ❌ Any error messages');
console.log('');
console.log('💡 If you see NO logs at all:');
console.log('   - The form submission is not calling the API function');
console.log('   - There may be an issue with the modal/form handler');
console.log('');
console.log('💡 If you see error logs:');
console.log('   - Share the error details with me');
console.log('   - I can identify the exact issue');
console.log('');

