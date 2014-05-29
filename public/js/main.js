'use strict';

$('body.home .delete').click(function() {
	var $btn = $('#delete-modal a.btn-danger');
	$btn.attr('href', $btn.attr('href') + $(this).data('id') );
});