var google = google || { maps : { Geocoder : function(){}, Point : function(){}, Marker : function(){}, LatLngBounds : function(){}, InfoWindow : function(){} }};
/*global Modernizr:true, google:true */

console.log('\'Allo \'Allo!');

var map = (function(){
	'use strict';
	var $widget = $('[data-widget="map"]');
	var markersData = $widget.data('markers');
	var markers = [];
	var countryMarkers = [];
	if( google.hasOwnProperty ){
		var geocoder = new google.maps.Geocoder();
		var bounds = new google.maps.LatLngBounds();
	}
	var map;
	var markersJson;

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
		var markerMap, image;

		if (params.icon){
			image = params.icon;
		} else {
			image = {
				url: 'assets/images/icon/pins/'+(markerId+1)+'.png',
				//url: 'assets/images/icon/map-pin.png',
				anchor: new google.maps.Point(15, 37)
			};
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
					'<div class="infoBox">' +
					'<img src="assets/images/logo.png" class="logo" />' +
						'<div class="textContent">' +
							'<div>'+content.label+'</div>' +
						 '<a class="directions" href="'+directions+'">Get Directions</a>' +
						'</div>' +
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

	var filterMarkers = function(){
		clearLocations();
		$('.no-results').hide();

		//if 'all countries' is selected
		if($('.map-countries input').val()==='.'){
			recountCountries($('.map-brands input').val());
		}
		//show filtered country
		else {
			bounds = new google.maps.LatLngBounds();
			var markerNumber = 0;
			for (var i = 0; i < markers.length; i++) {
				if(
						markers[i].params.country.match($('.map-countries input').val()) &&
						markers[i].params.brand.match($('.map-brands input').val())
					){
					markers[i].marker.setMap(map);
					bounds.extend(markers[i].marker.position);
					markerNumber++;
				} else {
					markers[i].marker.setMap(null);
				}
			}

			if(markerNumber > 0){
				map.fitBounds (bounds);
			}
			else{
				map.setZoom(2);
				$('.no-results').show();
			}


		}
	};

	var recountCountries = function(brand){
		var countries = getCountryCount(brand);
		var country = getCountryCount(brand);

		bounds = new google.maps.LatLngBounds();

		for (var marker in countryMarkers){
			if(countryMarkers.hasOwnProperty(marker)){
				country = countryMarkers[marker].params.country;
				if (countries[country] && countries[country].icon) {
					countryMarkers[marker].marker.setIcon(countries[country].icon);
					countryMarkers[marker].marker.setMap(map);
					bounds.extend(countryMarkers[marker].marker.position);
				} else {
					countryMarkers[marker].marker.setMap(null);
				}
			}
		}
		map.fitBounds (bounds);
	};

	var getCountryCount = function(brand){
		var countries = {};
		for (var place in markersJson) {
			if(markersJson.hasOwnProperty(place) && (markersJson[place].brand.match( brand ))){
				if(countries[markersJson[place].country]){
					countries[markersJson[place].country].amount = countries[markersJson[place].country].amount + 1;
					countries[markersJson[place].country].icon.url =
						'assets/images/icon/pins/' + countries[markersJson[place].country].amount + '.png';
				} else {
					countries[markersJson[place].country] = {
						address: markersJson[place].country,
						amount : 1,
						icon: {
							url: 'assets/images/icon/pins/1.png',
							anchor: new google.maps.Point(15, 37)
						}
					};
				}
			}
		}
		return countries;
	};

	var loadMap = function(){

		var markers = [];
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
				loadAllCountries(data, function(){
					markersJson = data;
				});
			});
		}
		$('.mod-map-wrapper input').on('change', function(){
			filterMarkers();
		});


		if(window.location.hash.replace('#','').length){
			$('[data-value="'+window.location.hash.replace('#','')+'"]').click();
		}

	};

	var downloadUrl = function(url,callback) {
		$.getJSON( url, function( data ) {
			callback(data);
		});
	};

	var loadAllCountries = function(data, callback) {
		var countries = {};
		var markersSet = markers.length;
		var name, address, latlng, markerData;
		var clickFunction = function(address){
			$('.map-countries .dropdown-select').data('set')(address);
		};
		clearLocations();

			//create array of countries

		for (var marker in data) {
			if(data.hasOwnProperty(marker) && (data[marker].brand.match( $('.map-brands input').val() ))){
				//console.log(countries[data[marker].country]);
				//load countries and place on map
				if(countries[data[marker].country]){
					countries[data[marker].country].amount = countries[data[marker].country].amount + 1;
					countries[data[marker].country].icon.url =
						'assets/images/icon/pins/' + countries[data[marker].country].amount + '.png';
				} else {
					countries[data[marker].country] = {
						address: data[marker].country,
						country: data[marker].country,
						amount : 1,
						onclick: clickFunction(address),
						icon: {
								url: 'assets/images/icon/pins/1.png',
								anchor: new google.maps.Point(15, 37)
							}
						};
				}

				//if place markers not already loaded in
				if(!markersSet){
						//load marker addresses but don't place on map
					name = data[marker].name;
					address = data[marker].address;
					latlng = new google.maps.LatLng(
							parseFloat(data[marker].lat),
							parseFloat(data[marker].lng));
					markerData = data[marker];
					markerData.map = null;
					markerData.icon = {
						url: 'assets/images/icon/pins/pin.png',
						anchor: new google.maps.Point(13, 42)
					};
					placeMarkerFromLatLng(latlng, markers, markerData);
				}
			}
		}

		placeMarkers(countries, countryMarkers);
		if(typeof callback === 'function'){
			callback();
		}
	};

	var clearLocations = function() {
		for (var i = 0; i < markers.length; i++) {
			markers[i].marker.setMap(null);
		}
		for (i = 0; i < countryMarkers.length; i++) {
			countryMarkers[i].marker.setMap(null);
		}
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