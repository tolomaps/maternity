/************************************************************
This is my first attempt at learning D3, as part of the 
UW-Madison Interactive Cartography & Geovisualization course.

This website shows the state of being a working mother around
the world, highlighting health conditions, maternity leave 
policies, and women participation in the labor force.

Robin Tolochko
November 2014
*************************************************************/
var keyArray = ["MaternalLeave", "PaternalLeave", "MaternalDeath", "FemaleLaborForceTotal", "FemaleLaborForceParticipationRate", "FertilityRate"];
var currentVariable = keyArray[2]; //testing first with third variable in CSV since it's numeric, make sure that works first before worrying about ordinal data
var jsonCountries;
var colorize;

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
		.append("path") //append one path for each element of the data (in this case, each graticule line)
		.attr("class", "gratLines")
		.attr("d", path) //this path is the variable path defined above. path generator

	//use queue.js to load all data at the same time
	queue()
		.defer(d3.csv, "data/maternityData.csv")
		.defer(d3.json, "data/countries.topojson")
		.await(callback);

	// function callback(error, maternityData, countries) {
	// 	var countries = map.selectAll(".countries")
	// 		.data(topojson.feature(countries, countries.objects.countries).features)
	function callback(error, maternityData, countries) { //the callback function accepts an error, and then after the error, one parameter for each defer line within queue(). it accepts them in the same order that the defer lines are placed... so in this case, maternityData is written first, and then countries, so that's the order they're accepted as parameters
		var colorize = colorScale(maternityData);

		//create variable for csv to json data transfer
		var jsonCountries = countries.objects.countries.geometries;
		//Create outer loop through csv data. Assign each country code to a variable.
		for (var i=0; i<maternityData.length; i++) {
			var csvCountry = maternityData[i]; 
			var csvCountryCode = csvCountry.CountryCode;

			//create inner loop through json data to assign csv data to correct country
			for (var j = 0; j < jsonCountries.length; j++) {
				
				//if the country codes match, attach the CSV data to the json object
				if (jsonCountries[j].properties.code3 == csvCountryCode) {
					//inner loop to add the csv values to the json object
					for (var key in keyArray) {
						//for the Maternal Leave and Paternal Leave attributes, the data is qualitative, so shouldn't convert to a float
						if (keyArray[key] == "MaternalLeave" || keyArray[key] == "PaternalLeave") {
							var attribute = keyArray[key];
							var value = csvCountry[attribute];
							jsonCountries[j].properties[attribute] = value;
						} else {
						//else, convert to float, round to nearest integer, and attach CSV data to json object
							var attribute = keyArray[key];
							var value = Math.round(parseFloat(csvCountry[attribute]));
							jsonCountries[j].properties[attribute] = value;
							// console.log(jsonCountries[j]);
						};
					};
					break; //stop looking through json countries
				};
			};
		};

		var countries = map.selectAll(".countries")
			.data(topojson.feature(countries, countries.objects.countries).features) //translates data into an array of geojson features. essentially creates a for-in loop. for element in data, do this. and this is defined by everything below.
			.enter()
			.append("path")
			.attr("class", function(d) {
				return "countries " + d.properties.code3; 
			})
			.attr("d", function(d) {
				return path(d);
			})
			.style("fill", function(d){
				return choropleth(d, colorize);
			})
			
	};
};

function colorScale(maternityData) {
	//creating a variable to hold color generator
	var color;
	//if the data is ordinal, set color to an ordinal scale
	//NOTE: These if-else statements aren't working: error in Firebug says TypeError: maternityData[i] is undefined - but I can't figure out why
	if (maternityData[i][currentVariable] == "MaternalLeave" || maternityData[i][currentVariable] == "PaternalLeave") {
		color = d3.scale.ordinal()
		.range([
			"#DE872C",
			"#FFE2DF",
			"#E5B3C3",
			"#AD6E97",
			"#754773",
			"#29182B"
		]);
	} else { //otherwise, the data is numeric, so set color to a quantile scale
		color = d3.scale.quantile()
		.range([
			"#FFE2DF",
			"#E5B3C3",
			"#AD6E97",
			"#754773",
			"#29182B"
		]);
	};

	var currentArray = [];	
	for (var i in maternityData) {
		//if the data is ordinal, just add the string to the current array
		if (maternityData[i][currentVariable] == "MaternalLeave" || maternityData[i][currentVariable] == "PaternalLeave") {
			currentArray.push(maternityData[i][currentVariable]); 
		} else { //else, convert data to number and add to current array
			currentArray.push(Number(maternityData[i][currentVariable]));
		};
	};
	color.domain(currentArray); //pass array of values as the domain
	return color; //return color scale generator
};


function choropleth(d, colorize){
	//get data value
	var value = d.properties ? d.properties[currentVariable] : d[currentVariable];
	//if the value exists, assign it a color; otherwise assign gray
	if (value) {
		return colorize(value);
	} else {
		return "#ccc";
	};
};