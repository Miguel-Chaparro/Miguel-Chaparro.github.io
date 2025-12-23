document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Logic
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuIcon = mobileBtn?.querySelector('.material-symbols-outlined');

    if (mobileBtn && mobileMenu) {
        mobileBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');

            // Lock body scroll when menu is open
            if (!mobileMenu.classList.contains('hidden')) {
                document.body.style.overflow = 'hidden';
                if (menuIcon) menuIcon.textContent = 'close';
            } else {
                document.body.style.overflow = '';
                if (menuIcon) menuIcon.textContent = 'menu';
            }
        });

        // Close menu when clicking a link
        const mobileLinks = mobileMenu.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
                document.body.style.overflow = '';
                if (menuIcon) menuIcon.textContent = 'menu';
            });
        });
    }
});
