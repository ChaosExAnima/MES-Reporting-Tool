log = console.log.bind console
delay = (ms, func) -> setTimeout func, ms

log 'Started!'



$(document).ready -> 
	$('fieldset').each ->
		ele = $(this)
		if ele.hasClass('close')
			return
		ele.css(
			"max-height" : ele.outerHeight()
		)
		if ele.hasClass('start-closed')
			ele.addClass('close').removeClass('start-closed') 
		return
	$('fieldset > legend').click ->
		$(this).parent().toggleClass('close')
		return
	$('fieldset > a.submit').click ->
		parent = $(this).parent()
		clone = $('.template', parent).clone()
		i = $('div', parent).length - 1
		$('input', clone).removeAttr('disabled').each ->
			name = $(this).attr('name').replace('[i]', '['+i+']')
			$(this).attr('name', name)
			return
		clone.removeClass('template').insertBefore($(this))
		return
	return