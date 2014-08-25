/*global Modernizr:true, google:true */

var map = (function(){
	'use strict';
	var $widget = $('[data-widget="map"]');
	var markersData = $widget.data('markers');
	var markers = [];
	if( google.hasOwnProperty ){
		var geocoder = new google.maps.Geocoder();
		var bounds = new google.maps.LatLngBounds();
	}
	var map;

	var placeMarkers = function(addressesData, markersArray){
		for(var i in addressesData){
			placeMarkersFromAddress(addressesData[i], markersArray);
		}
	};

	var placeMarkersFromAddress = function(addressData, markersArray){
		geocoder.geocode({
			'address': addressData.address
		}, function(results){
			for(var key in results){
				if(results.hasOwnProperty(key)){
					placeMarkerFromLatLng(results[key].geometry.location, markersArray, addressData);
				}
			}
		});
	};

	var placeMarkerFromLatLng = function(latLng, markersArray, params) {
		params = params || {};
		var markerId = markersArray.length;
		var markerMap, image = null;

		if (params.icon){
			image = params.icon;
		}

		if (params.map === null){
			markerMap = params.map;
		} else {
			markerMap = map;
		}

		markersArray.push({
			marker : new google.maps.Marker({
					position: latLng,
					icon: image,
					map: markerMap,
					anchorPoint: new google.maps.Point(0, -37)
				}),
				params: params,
				infoWindow: new google.maps.InfoWindow({
					content: infoBoxContent(params)
				})
			}
		);

		bounds.extend(markersArray[markerId].marker.position);
		map.fitBounds (bounds);

		google.maps.event.addListener(markersArray[markerId].marker, 'click', function() {
			if(markersArray[markerId].infoWindow){
				markersArray[markerId].infoWindow.open(map, this);
			}
			if (typeof params.onclick === 'function'){
				params.onclick();
			}
		});

		if(markersArray.length===1){
			map.setZoom(15);
		}
	};

	var infoBoxContent = function(content){
		content = content || {};
		var directions;
		if(content.label){
			directions = 'https://www.google.com/maps/preview/dir//' + content.address.replace(' ','+');
			return (
				'<div class="textContent">' +
					'<h4>'+content.label+'</h4>' +
					 '<a class="directions" href="'+directions+'">Get Directions</a>' +
				'</div>');
		}

		if(content.name){
			directions = 'https://www.google.com/maps/preview/dir//' +
				content.address.replace(' ','+') +
				 '/@' + content.lat +
				 ',' + content.lng +
				',13z/';

			return ('<div class="infoBox">' +
						'<div class="textContent">' +
							'<h2>'+content.name+'</h2>' +
							'<p>'+content.address+'</p>' +
							'<p class="directions"><a href="'+directions+'">Get Directions</a></p>' +
							'<dl><dt>Phone</dt><dd>'+content.phone+'</dd>' +
							'<p class=""><a href="'+content.url+'" target="_blank" class="btn-arrow">Go to Hotel Website</a></p>' +
						'</div>' +
				 '</div>');
		}
		return;
	};


	var loadMap = function(){

		var styles = [
			{
				featureType: 'water',
				elementType: 'all',
				stylers: [
					{ visibility: 'on' },
					{ lightness: 15 }
				]
			},{
				featureType: 'all',
				elementType: 'all',
				stylers: [
					{ saturation: -100 },
				]
			}
		] ;

		var styledMap = new google.maps.StyledMapType(styles,
			{name: 'Styled Map'});
		var mapOptions = {
			zoom: 5,
			scrollwheel: false,
			mapTypeControlOptions: {
					mapTypeIds: [google.maps.MapTypeId.ROADMAP, 'map_style']
				}
			};
		if(Modernizr.touch !== false){
			mapOptions = {
					draggable:false
				};
		}

		map = new google.maps.Map($widget.get(0), mapOptions);
		map.mapTypes.set('map_style', styledMap);
		map.setMapTypeId('map_style');

		if (typeof markersData!== 'undefined'){
			placeMarkers(markersData, markers);

		}	else {
			downloadUrl('markers.json', function(data){
				placeMarkers(data, markers);
			});
		}

		if(window.location.hash.replace('#','').length){
			$('[data-value="'+window.location.hash.replace('#','')+'"]').click();
		}

	};

	var downloadUrl = function(url,callback) {
		$.getJSON( url, function( data ) {
			callback(data);
		});
	};

	return {
		init :function(){
			if ($widget.length){
				google.maps.event.addDomListener(window, 'load', loadMap);
			}
		}
	};
}());

$(document).on('ready', map.init);