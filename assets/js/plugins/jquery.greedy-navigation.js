/*
* Greedy Navigation
*
* http://codepen.io/lukejacksonn/pen/PwmwWV
*
*/

var $nav = $('#site-nav');
var $btn = $('#site-nav button');
var $vlinks = $('#site-nav .visible-links');
var $hlinks = $('#site-nav .hidden-links');

function closeNavMenu() {
  $hlinks.addClass('hidden');
  $btn.removeClass('close').attr('aria-expanded', 'false');
}

function updateNav() {
  // Reconsider every link so widening the window restores all items that fit.
  $hlinks.children().appendTo($vlinks);
  $btn.addClass('hidden');
  closeNavMenu();
  var availableSpace = $nav.width();

  while ($vlinks.width() > availableSpace && $vlinks.children().length > 1) {
    $vlinks.children().last().prependTo($hlinks);
    $btn.removeClass('hidden');
    availableSpace = $nav.width() - $btn.outerWidth(true) - 16;
  }
  $btn.attr('count', $hlinks.children().length);
}

$(window).on('resize load', updateNav);
$btn.on('click', function () {
  $hlinks.toggleClass('hidden');
  $(this).toggleClass('close').attr('aria-expanded', !$hlinks.hasClass('hidden'));
});
$hlinks.on('click', 'a', closeNavMenu);
$nav.on('keydown', function (event) {
  if (event.key === 'Escape') {
    closeNavMenu();
    $btn.trigger('focus');
  }
});
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(updateNav);
}
updateNav();
