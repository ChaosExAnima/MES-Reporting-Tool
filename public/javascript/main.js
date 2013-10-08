var log;

log = console.log.bind(console);

log('Started!');

$(document).ready(function() {
  $('fieldset').each(function() {
    $(this).css({
      "max-height": $(this).outerHeight()
    });
  });
  $('fieldset > legend').click(function() {
    $(this).parent().toggleClass('close');
  });
});
