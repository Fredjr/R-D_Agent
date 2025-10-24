/**
 * Quick Status Check - Run this in browser console for instant status
 */

console.log('🔍 QUICK STATUS CHECK');
console.log('='.repeat(50));

// 1. Check if user is logged in
const user = JSON.parse(localStorage.getItem('rd_agent_user') || 'null');
if (user) {
    console.log('✅ User Session: ACTIVE');
    console.log(`   Email: ${user.email}`);
    console.log(`   User ID: ${user.user_id || 'Not available'}`);
    console.log(`   Registration Complete: ${user.registration_completed ? 'Yes' : 'No'}`);
} else {
    console.log('❌ User Session: NOT LOGGED IN');
    console.log('   → Go to /auth/signin to log in');
}

// 2. Check current page
console.log(`\n📍 Current Page: ${window.location.pathname}`);

// 3. Check WebSocket availability
if (typeof WebSocket !== 'undefined') {
    console.log('✅ WebSocket API: AVAILABLE');
} else {
    console.log('❌ WebSocket API: NOT AVAILABLE');
}

// 4. Check for notification elements
const notificationBell = document.querySelector('[title="Notifications"]') || 
                         document.querySelector('.notification-bell') ||
                         document.querySelector('button[aria-label*="notification"]') ||
                         document.querySelector('button[aria-label*="Notification"]');

if (notificationBell) {
    console.log('✅ Notification Bell: FOUND');
    
    // Check for connection indicator
    const indicator = notificationBell.querySelector('.bg-green-400, .bg-red-400') ||
                     notificationBell.querySelector('[class*="green"], [class*="red"]');
    
    if (indicator) {
        const isConnected = indicator.className.includes('green');
        console.log(`   Connection Status: ${isConnected ? '✅ CONNECTED (Green)' : '❌ DISCONNECTED (Red)'}`);
    } else {
        console.log('   Connection Status: INDICATOR NOT FOUND');
    }
} else {
    console.log('⚠️ Notification Bell: NOT FOUND (may not be on this page)');
}

// 5. Check console for errors
const errors = [];
const originalError = console.error;
console.error = function(...args) {
    errors.push(args.join(' '));
    originalError.apply(console, args);
};

// 6. Quick API test
if (user) {
    console.log('\n🧪 Testing API...');
    
    fetch('/api/proxy/health')
        .then(response => response.json())
        .then(data => {
            console.log('✅ API Health: WORKING');
            console.log('   Response:', data);
        })
        .catch(error => {
            console.log('❌ API Health: FAILED');
            console.log('   Error:', error.message);
        });
    
    // Test WebSocket if user ID available
    if (user.user_id) {
        console.log('\n🔌 Testing WebSocket...');
        
        const wsUrl = `wss://r-dagent-production.up.railway.app/ws/${encodeURIComponent(user.user_id)}`;
        const ws = new WebSocket(wsUrl);
        
        const timeout = setTimeout(() => {
            ws.close();
            console.log('❌ WebSocket: CONNECTION TIMEOUT');
        }, 5000);
        
        ws.onopen = () => {
            clearTimeout(timeout);
            console.log('✅ WebSocket: CONNECTED');
            ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
            
            setTimeout(() => {
                ws.close();
                console.log('🔌 WebSocket: Test completed');
            }, 2000);
        };
        
        ws.onerror = (error) => {
            clearTimeout(timeout);
            console.log('❌ WebSocket: CONNECTION FAILED');
            console.log('   Error:', error);
        };
        
        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                console.log('📨 WebSocket Message:', message);
            } catch (e) {
                console.log('📨 WebSocket Raw:', event.data);
            }
        };
    }
}

// 7. Provide quick fixes
console.log('\n🔧 QUICK FIXES:');
console.log('• Not logged in? → Go to /auth/signin');
console.log('• Red notification dot? → Refresh page after login');
console.log('• WebSocket issues? → Check network connection');
console.log('• API errors? → Check browser console for details');

// 8. Provide test credentials reminder
console.log('\n🔑 TEST CREDENTIALS:');
console.log('Email: fredericle77@gmail.com');
console.log('Password: qwerty1234');

console.log('\n✨ Status check complete!');
console.log('='.repeat(50));
