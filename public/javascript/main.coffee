log = console.log.bind console
delay = (ms, func) -> setTimeout func, ms

$(document).ready -> 
	# User MES num autocomplete
	$('input.auto-complete-mes').autocomplete
		source: "/user/search/"
		minLength: 3

	# Prestige award autocomplete
	$('input.auto-complete-prestige').autocomplete
		minLength: 2
		source: "/prestige/search/"
		select: (event, ui) ->
			$('[name="category"]').val(ui.item.category)
			$('[name="amount"]').val(ui.item.amount)
			return

	$('.drop-zone').sortable({
		placeholder: "drop-placeholder",
		connectWith: ".drop-zone",
		receive: updatePrestige
	});
	$('.drop-zone').disableSelection();

	# Fieldset functionality
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
		$('input, select, textarea', clone).removeAttr('disabled').each ->
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

	# Tab functionality
	$('.tabs a').on "click", (event) ->
		event.preventDefault()
		if !$(this).hasClass "selected"
			$(this).siblings(".selected").removeClass("selected")
			$(this).addClass("selected")
			$('.tab').hide()
			$( $(this).attr('href') ).show()
		return
	return

# Updated assigning and removing prestige
updatePrestige = (event, ui) ->
	report = $(this).data('id') || false
	data = 
		id: ui.item.data('id')

	if report
		data.report = report

	$.post('/prestige/assign', data, (data) ->
		log data
	)
	return