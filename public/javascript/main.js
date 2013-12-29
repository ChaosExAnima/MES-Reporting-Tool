var delay, log, updatePrestige;

log = console.log.bind(console);

delay = function(ms, func) {
  return setTimeout(func, ms);
};

$(document).ready(function() {
  $('input.auto-complete-mes').autocomplete({
    source: "/user/search/",
    minLength: 3
  });
  $('input.auto-complete-prestige').autocomplete({
    minLength: 2,
    source: "/prestige/search/",
    select: function(event, ui) {
      $('[name="category"]').val(ui.item.category);
      $('[name="amount"]').val(ui.item.amount);
    }
  });
  $('.drop-zone').sortable({
    placeholder: "drop-placeholder",
    connectWith: ".drop-zone",
    receive: updatePrestige
  });
  $('.drop-zone').disableSelection();
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
  $('fieldset > a.btn-green').click(function() {
    var clone, i, parent;
    parent = $(this).parent();
    clone = $('.template', parent).clone();
    i = $('div', parent).length - 1;
    $('input, select, textarea', clone).removeAttr('disabled').each(function() {
      var name;
      name = $(this).attr('name').replace('[i]', '[' + i + ']');
      $(this).attr('name', name);
      if ($(this).hasClass("auto-complete-mes")) {
        $(this).autocomplete({
          source: "/user/search/",
          minLength: 3
        });
      }
    });
    clone.removeClass('template').insertBefore($(this));
  });
  $('fieldset').on("click", "a.btn-red", function() {
    $(this).parent().remove();
  });
  $('.tabs a').on("click", function(event) {
    event.preventDefault();
    if (!$(this).hasClass("selected")) {
      $(this).siblings(".selected").removeClass("selected");
      $(this).addClass("selected");
      $('.tab').hide();
      $($(this).attr('href')).show();
    }
  });
});

updatePrestige = function(event, ui) {
  var data, report;
  report = $(this).data('id') || false;
  data = {
    id: ui.item.data('id')
  };
  if (report) {
    data.report = report;
  }
  $.post('/prestige/assign', data, function(data) {
    return log(data);
  });
};
