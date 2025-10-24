/**
 * Disable Chrome Password Autofill for Testing
 * Run this in the browser console to disable password prompts
 */

function disableChromeAutofill() {
    console.log('🔧 Disabling Chrome password autofill...');
    
    // Method 1: Disable autofill on all password inputs
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    passwordInputs.forEach(input => {
        input.setAttribute('autocomplete', 'new-password');
        input.setAttribute('data-lpignore', 'true');
        console.log('✅ Disabled autofill on password input:', input);
    });
    
    // Method 2: Disable autofill on all email inputs
    const emailInputs = document.querySelectorAll('input[type="email"]');
    emailInputs.forEach(input => {
        input.setAttribute('autocomplete', 'off');
        input.setAttribute('data-lpignore', 'true');
        console.log('✅ Disabled autofill on email input:', input);
    });
    
    // Method 3: Add meta tag to disable autofill
    const meta = document.createElement('meta');
    meta.name = 'autocomplete';
    meta.content = 'off';
    document.head.appendChild(meta);
    
    // Method 4: Override form submission to prevent saving
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.setAttribute('autocomplete', 'off');
        console.log('✅ Disabled autofill on form:', form);
    });
    
    console.log('✅ Chrome autofill disabled for current page');
    console.log('💡 Note: You may need to refresh the page for full effect');
}

// Auto-run
disableChromeAutofill();

// Also provide a function to manually fill credentials for testing
function fillTestCredentials() {
    console.log('🔐 Filling test credentials...');
    
    const emailInput = document.querySelector('input[type="email"]');
    const passwordInput = document.querySelector('input[type="password"]');
    
    if (emailInput) {
        emailInput.value = 'fredericle77@gmail.com';
        emailInput.dispatchEvent(new Event('input', { bubbles: true }));
        emailInput.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('✅ Filled email input');
    }
    
    if (passwordInput) {
        passwordInput.value = 'qwerty1234';
        passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
        passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('✅ Filled password input');
    }
    
    if (emailInput && passwordInput) {
        console.log('✅ Test credentials filled successfully');
        console.log('💡 You can now submit the form manually');
    } else {
        console.log('⚠️ Could not find email/password inputs on this page');
    }
}

// Make functions available globally
window.disableChromeAutofill = disableChromeAutofill;
window.fillTestCredentials = fillTestCredentials;

console.log('🎯 Available functions:');
console.log('• disableChromeAutofill() - Disable password prompts');
console.log('• fillTestCredentials() - Fill test login credentials');
