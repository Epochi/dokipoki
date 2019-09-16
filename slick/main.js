$(document).ready(function(){
  $('.slick-gallery').slick({
	lazyLoad: 'ondemand',
	arrows: true,
	dots: true,
	// infinite: true,
  	// speed: 300,
  	slidesToShow: 1,
	centerMode: false,
  	adaptiveHeight: false,
	// variableWidth: true,
	centerPadding: '50%'
  });
});