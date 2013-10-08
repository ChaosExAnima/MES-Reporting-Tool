log = console.log.bind console

log 'Started!'

$(document).ready -> 
	$('fieldset').each ->
		$(this).css(
			"max-height" : $(this).outerHeight()
		)
		return
	$('fieldset > legend').click ->
		$(this).parent().toggleClass('close')
		return
	return