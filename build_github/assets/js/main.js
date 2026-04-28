// source/assets/js/main.js

// 1. Import the shared engine
import { highlightAll } from '../../../source/_shared/assets/js/main.js';

// 2. Local Utility
const updateText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
};

document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        const scrollPos = sessionStorage.getItem('sidebar-scroll');
        if (scrollPos) sidebar.scrollTop = scrollPos;
        sidebar.addEventListener('click', () => {
            sessionStorage.setItem('sidebar-scroll', sidebar.scrollTop);
        });
    }
});