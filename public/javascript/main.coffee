log = console.log.bind console
delay = (ms, func) -> setTimeout func, ms

log 'Started!'

$(document).ready -> 
	$('fieldset').each ->
		ele = $ this
		if ele.hasClass 'close'
			return
		
		ele.css "max-height": ele.outerHeight()
		
		if ele.hasClass 'start-closed' 
			ele.addClass('close').removeClass('start-closed') 
		return

	$('fieldset > legend').click ->
		$(this).parent().toggleClass('close')
		return

	$('fieldset > a.btn-green').click ->
		parent = $(this).parent()
		clone = $('.template', parent).clone()
		i = $('div', parent).length - 1
		$('input, select', clone).removeAttr('disabled').each ->
			name = $(this).attr('name').replace('[i]', '['+i+']')
			$(this).attr('name', name)
			if $(this).hasClass "auto-complete-mes"
				$(this).autocomplete 
					source: "/user/search/"
					minLength: 3
			return
		clone.removeClass('template').insertBefore($(this))
		return

	$('fieldset').on "click", "a.btn-red", ->
		$(this).parent().remove()
		return

	$('.tabs a').on "click", (event) ->
		event.preventDefault()
		if !$(this).hasClass "selected"
			$(this).siblings(".selected").removeClass("selected")
			$(this).addClass("selected")
			$('.tab').hide()
			$( $(this).attr('href') ).show()
		return
	return