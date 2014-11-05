/************************************************************
This is my first attempt at learning D3, as part of the 
UW-Madison Interactive Cartography & Geovisualization course.

This website shows the state of being a working mother around
the world, highlighting health conditions, maternity leave 
policies, and women participation in the labor force.

Robin Tolochko
November 2014
*************************************************************/

//begin script when window loads 
window.onload = initialize();

function initialize() {
	setMap();
};

// set map parameters
function setMap(){
	var width = 1200;
	var height = 600;

	var map = d3.select("body")
		.append("svg")
		.attr("width", width)
		.attr("height", height)
		.attr("class", "map");

	//Set the projection 
	var projection = d3.geo.naturalEarth()
    	.scale(150)
    	.translate([width / 2, height / 2])
    	.precision(.1);

    //Draw the SVG
    var path = d3.geo.path()
    	.projection(projection);

	//create graticule generator
	var graticule = d3.geo.graticule()
		.step([20, 20]); 

	//create graticule background (aka water)
	var gratBackground = map.append("path")
		.datum(graticule.outline)
		.attr("class", "gratBackground")
		.attr("d", path)

	var gratLines = map.selectAll(".gratLines")
		.data(graticule.lines) //
		.enter()
		.append("path")
		.attr("class", "gratLines")
		.attr("d", path)

	//use queue.js to load all data at the same time
	queue()
		.defer(d3.csv, "data/maternityData.csv")
		.defer(d3.json, "data/countries.topojson")
		.await(callback);

	// function callback(error, maternityData, countries) {
	// 	var countries = map.selectAll(".countries")
	// 		.data(topojson.feature(countries, countries.objects.countries).features)
	function callback(error, maternityData, countries) {
		var countries = map.selectAll(".countries")
			.data(topojson.feature(countries, countries.objects.countries).features)
			.enter()
			.append("path")
			.attr("class", function(d) {
				return "countries" + d.properties.code3; //is this not working because my attribute is called id and that is a special selector?
			})
			.attr("d", function(d) {
				return path(d);
			})
			// .style("fill", function(d){
			// 	return "#bbb";
			// })
			// .style("stroke", function(d){
			// 	return "#888";
			// });
			.style({ "fill": "#ccc", "stroke": "#888", "stroke-width": "0.5px" });
	};
};