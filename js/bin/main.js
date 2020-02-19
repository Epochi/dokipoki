$(document).ready(function () {
	$(".button-collapse").sideNav({
		closeOnClick: true,
		draggable: true
	});
	$('.scrollspy').scrollSpy();

	$(window).scroll(function () {
		if (document.body.scrollTop == 0) {
			$("#nav").addClass("z-depth-0");
		} else {
			$("#nav").removeClass("z-depth-0");
		}
	});

	$(".gallery-wrapper .materialboxed").click(function(event) {
		event.stopImmediatePropagation()
		event.stopPropagation();
		return;
	});

	// init Masonry
	var $grid = $('.grid').masonry({
		itemSelector: '.grid-item',
		percentPosition: true,
		// fitWidth: true,
		// horizontalOrder: true,
		columnWidth: '.grid-sizer',
		// resize: true
		// columnWidth: $grid.find('.grid-sizer')[0]
	});
	// layout Masonry after each image loads
	$grid.imagesLoaded().progress( function() {
		$grid.masonry('layout');
	});  
});
