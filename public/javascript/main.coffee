log = console.log.bind console
delay = (ms, func) -> setTimeout func, ms

log 'Started!'



$(document).ready -> 
	$('fieldset').each ->
		ele = $(this)
		ele.css(
			"max-height" : ele.outerHeight()
		)
		if ele.hasClass('start-closed')
			ele.addClass('close').removeClass('start-closed') 
		return
	$('fieldset > legend').click ->
		$(this).parent().toggleClass('close')
		return
	return