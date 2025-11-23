// Authentication JavaScript

document.addEventListener('DOMContentLoaded', async () => {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                
                if (!response.ok) {
                    throw new Error('Invalid credentials');
                }
                
                const user = await response.json();
                localStorage.setItem('currentUser', JSON.stringify(user));
                
                // Initialize socket connection
                if (typeof io !== 'undefined') {
                    if (typeof initSocket === 'function') {
                        initSocket();
                    }
                } else {
                    const script = document.createElement('script');
                    script.src = '/socket.io/socket.io.js';
                    script.onload = () => {
                        if (typeof initSocket === 'function') {
                            initSocket();
                        }
                    };
                    document.head.appendChild(script);
                }
                
                window.location.href = 'dashboard.html';
            } catch (error) {
                errorMessage.textContent = 'اسم المستخدم أو كلمة المرور غير صحيحة';
                errorMessage.classList.add('show');
                setTimeout(() => {
                    errorMessage.classList.remove('show');
                }, 3000);
            }
        });
    }
});

