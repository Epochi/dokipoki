(function () {
  var choice = document.getElementById('christmas-program-choice');
  if (!choice) return;

  document.querySelectorAll('[data-select-program]').forEach(function (link) {
    link.addEventListener('click', function () {
      choice.value = link.getAttribute('data-select-program');
      choice.dispatchEvent(new Event('change', { bubbles: true }));
      choice.focus({ preventScroll: true });
    });
  });
}());
