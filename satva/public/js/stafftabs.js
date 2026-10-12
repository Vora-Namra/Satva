
function switchTab(tab) {
  window.location.href = `/staff/${tab}`;
}

function setActiveTab() {
  const segment = window.location.pathname.split('/').pop();
  document.querySelectorAll('.tab-btn').forEach(btn => {
    const isActive = btn.getAttribute('onclick').includes(`'${segment}'`);
    if (isActive) {
      btn.classList.add('text-green-600', 'font-semibold', 'border-b-2', 'border-green-600');
      btn.classList.remove('text-gray-400', 'font-medium');
    } else {
      btn.classList.remove('text-green-600', 'font-semibold', 'border-b-2', 'border-green-600');
      btn.classList.add('text-gray-400', 'font-medium');
    }
  });
}

setActiveTab();