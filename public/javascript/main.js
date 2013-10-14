var delay, log;

log = console.log.bind(console);

delay = function(ms, func) {
  return setTimeout(func, ms);
};

log('Started!');

$(document).ready(function() {
  $('fieldset').each(function() {
    var ele;
    ele = $(this);
    if (ele.hasClass('close')) {
      return;
    }
    ele.css({
      "max-height": ele.outerHeight()
    });
    if (ele.hasClass('start-closed')) {
      ele.addClass('close').removeClass('start-closed');
    }
  });
  $('fieldset > legend').click(function() {
    $(this).parent().toggleClass('close');
  });
  $('fieldset > a.submit').click(function() {
    var clone, i, parent;
    parent = $(this).parent();
    clone = $('.template', parent).clone();
    i = $('div', parent).length - 1;
    $('input, select', clone).removeAttr('disabled').each(function() {
      var name;
      name = $(this).attr('name').replace('[i]', '[' + i + ']');
      $(this).attr('name', name);
    });
    clone.removeClass('template').insertBefore($(this));
  });
  $('fieldset').on("click", "a.cancel", function() {
    $(this).parent().remove();
  });
});
