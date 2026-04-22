// Contact Form Submission
async function submitContactForm(btn) {
    const form = btn.closest('.b-form') || btn.closest('.contact-form-wrap');
    if (!form) return;

    // Collect data using specific classes
    const firstName = form.querySelector('.cf-fname')?.value || "";
    const lastName = form.querySelector('.cf-lname')?.value || "";
    const email = form.querySelector('.cf-email')?.value || "";
    const message = form.querySelector('.cf-message')?.value || "";

    if (!firstName || !email || !message) {
        showStatus(form, "Please fill in all required fields (First Name, Email, and Message).", "error");
        return;
    }

    const data = { firstName, lastName, email, message };
    
    // Change button state
    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = "Sending...";

    try {
        const response = await fetch('/api/contact/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || 'Failed to send message');
        }

        const result = await response.json();
        if (result.success) {
            // Success feedback
            const container = form.parentElement;
            const heading = form.querySelector('h2')?.innerText || "Message Sent";
            
            form.innerHTML = `
                <div style="text-align:center; padding:40px 20px;">
                    <div style="font-size:48px; margin-bottom:20px;">✓</div>
                    <h2 style="margin-bottom:10px;">${heading}</h2>
                    <p style="color:#666; font-size:16px;">${result.message}</p>
                    <button class="m-btn primary" onclick="location.reload()" style="margin-top:20px; padding:10px 24px; border-radius:8px; border:none; cursor:pointer; background:var(--accent, #5b4fff); color:#fff;">Send another message</button>
                </div>
            `;
        } else {
            showStatus(form, "Error: " + (result.message || "Something went wrong."), "error");
        }
    } catch (error) {
        console.error("Submission error:", error);
        showStatus(form, "Oops! " + error.message, "error");
    } finally {
        if (btn && !btn.parentElement === null) {
            btn.disabled = false;
            btn.innerText = originalText;
        }
    }
}

function showStatus(form, msg, type) {
    const statusDiv = form.querySelector('.cf-status');
    if (!statusDiv) return;
    
    statusDiv.innerText = msg;
    statusDiv.style.display = 'block';
    statusDiv.style.padding = '12px';
    statusDiv.style.borderRadius = '8px';
    statusDiv.style.marginTop = '15px';
    
    if (type === 'error') {
        statusDiv.style.background = '#fee2e2';
        statusDiv.style.color = '#991b1b';
        statusDiv.style.border = '1px solid #fecaca';
    } else {
        statusDiv.style.background = '#dcfce7';
        statusDiv.style.color = '#166534';
        statusDiv.style.border = '1px solid #bbf7d0';
    }
    
    setTimeout(() => {
        statusDiv.style.display = 'none';
    }, 3000);
}
