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
colorArray = []
var currentVariable = keyArray[2]; //testing first with third variable in CSV since it's numeric, make sure that works first before worrying about ordinal data
var jsonCountries;
var colorize;
var mapWidth = 1000, mapHeight = 500; //set map container dimensions
var chartWidth = 840, chartHeight = 150; //set chart container dimensions
var scale;

//begin script when window loads 
window.onload = initialize();

function initialize() {
	setMap();
};

// set map parameters
function setMap(){

	var map = d3.select("body")
		.append("svg")
		.attr("width", mapWidth)
		.attr("height", mapHeight)
		.attr("class", "map");

	//Set the projection 
	var projection = d3.geo.naturalEarth()
    	.scale(170)
    	.translate([mapWidth / 2, mapHeight / 2])
    	.precision(.1);

    //Draw the SVG
    var path = d3.geo.path()
    	.projection(projection);

	//create graticule generator
	var graticule = d3.geo.graticule(); 

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
		// var colorize = colorScale(maternityData);
		// console.log(colorize);

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
						//for the Fertility Rate, round to one decimal point
						} else if (keyArray[key] == "FertilityRate") {
							var attribute = keyArray[key];
							var value = Math.round(csvCountry[attribute]*10)/10;
							jsonCountries[j].properties[attribute] = value;
						} else {
						//else, round to nearest integer, and attach CSV data to json object
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
				console.log(choropleth(d, colorize));	
				return choropleth(d, colorize); // will need to change this so that it updates dynamically depending on the currentVariable - see Carl's email
			})
			.on("mouseover", highlight)
			.on("mouseout", dehighlight)
			.on("mousemove", moveLabel)
			.append("desc")
				.text(function(d) {
					return choropleth(d, colorize);
					// var baseX, baseY = 0;
					// var color = colorize(d);
					// if (color == "#edf8fb"){
					// 	baseX = 0;
					// } else if (color == "#b3cde3"){
					// 	baseX = 100;
					// } else {
					// 	baseX = 200;
					// }
				});
		
		createDropdown(maternityData);
		setChart(maternityData, colorize); //create coordinated visualization
	};
};

function createDropdown(maternityData) {
	var dropdown = d3.select("body")
		.append("div")
		.attr("class", "dropdown")
		.html("<h3>Select Variable:</h3>")
		.append("select")
		.on("change", function() { changeAttribute(this.value, maternityData) } );

	dropdown.selectAll("options")
		.data(keyArray)
		.enter()
		.append("option")
		.attr("value", function(d) { return d })
		.text(function(d) {
			if (d == "MaternalLeave") {
				d = "Maternity Leave Law";
			} else if (d == "PaternalLeave") {
				d = "Paternity Leave Law";
			} else if (d == "MaternalDeath") {
				d = "Lifetime Risk of Maternal Death";
			} else if (d == "FemaleLaborForceTotal") {
				d = "Women as Percentage of Labor Force";
			} else if (d == "FemaleLaborForceParticipationRate") {
				d = "Women Labor Force Participation Rate";
			} else if (d == "FertilityRate") {
				d = "Fertility Rate";
			};
			return d;
		});
};

function setChart(maternityData, colorize) {

	var chart = d3.select("body")
		.append("svg")
		.attr("width", chartWidth)
		.attr("height", chartHeight)
		.attr("class", "chart");

	var title = chart.append("text")
		.attr("x", 20)
		.attr("y", 40)
		.attr("class", "chartTitle");

	var bars = chart.selectAll(".bar")
		.data(maternityData)
		.enter()
		.append("rect")
		.sort(function(a, b) {return a[currentVariable]-b[currentVariable]})
		.attr("class", function(d){
			return "bar " + d.CountryCode;
		})
		.attr("width", chartWidth / maternityData.length - 1)
		.attr("height", chartHeight / maternityData.length - 1);
};

function colorScale(maternityData) {
	//creating a variable to hold color generator
	// var color;
	//if the data is ordinal, set color to an ordinal scale
	//NOTE: These if-else statements aren't working: error in Firebug says TypeError: maternityData[i] is undefined - but I can't figure out why
	if (currentVariable == "MaternalLeave" || currentVariable == "PaternalLeave") {
		scale = d3.scale.ordinal()
		.range([
			"#DE872C",
			"#edf8fb",
			"#b3cde3",
			"#8c96c6",
			"#8856a7",
			"#810f7c"	
		]);
	} else { //otherwise, the data is numeric, so set color to a quantile scale
		scale = d3.scale.quantile()
		.range([
			"#edf8fb",
			"#b3cde3",
			"#8c96c6",
			"#8856a7",
			"#810f7c"	
		]);
	//threshold scale alternative
	// } else {
	// 	color = d3.scale.threshold()
	// 	.range([
	// 		"#edf8fb",
	// 		"#b3cde3",
	// 		"#8c96c6",
	// 		"#8856a7",
	// 		"#810f7c"	
	// 	]);
	};

	var currentArray = [];	
	for (var i in maternityData) {
		//if the data is ordinal, just add the string to the current array
		if (currentVariable == "MaternalLeave" || currentVariable == "PaternalLeave") {
			currentArray.push(currentVariable); 
		} else { //else, convert data to number and add to current array
			currentArray.push(Number(maternityData[i][currentVariable]));
		};
	};
	scale.domain(currentArray); //pass array of values as the domain
	return scale; //return color scale generator
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

function changeAttribute(attribute, maternityData) {

	//update the current variable
	currentVariable = attribute;
	colorize = colorScale(maternityData);

	//update the map colors
	d3.selectAll(".countries") 
		.select("path")
		.style("fill", function(d) {
			return choropleth(d, colorize);
		})
		.select("desc")
			.text(function(d) {
				return choropleth(d, colorize);
			});
};

function highlight(maternityData) {
	var properties = maternityData.properties ? maternityData.properties : maternityData;

	d3.selectAll("."+properties.code3)
		.style("fill", "#ebfa7b");

	var labelAttribute = properties[currentVariable]+"<br>"+currentVariable;
	var labelName = properties.name_long;

	
	if (Boolean(properties[currentVariable]) == true) {
		if (currentVariable == "MaternalLeave") {
			labelAttribute = properties[currentVariable];
		} else if (currentVariable == "MaternalDeath") {
			labelAttribute = "1 in "+properties[currentVariable]+"<br>women die from maternal causes"
		} else if (currentVariable == "FemaleLaborForceTotal") {
			labelAttribute = properties[currentVariable]+"%<br> of the labor force is composed of women"
		} else if (currentVariable == "FemaleLaborForceParticipationRate") {
			labelAttribute = properties[currentVariable]+"%<br> of women work"
		} else if (currentVariable == "FertilityRate") {
			labelAttribute = properties[currentVariable]+"<br>Average Number of Children Per Woman"
		};
	} else { //if no data associated with selection, display "No data"
		labelAttribute = "No data";
	};

	var infoLabel = d3.select("body")
		.append("div")
		.attr("class", "infoLabel")
		.attr("id",properties.code3+"label")
		.html(labelName)
		.append("div")
		.html(labelAttribute)
		.attr("class", "labelName");
};

function dehighlight(maternityData) {
	var properties = maternityData.properties ? maternityData.properties : maternityData;

	var selection = d3.selectAll("."+properties.code3)
		.style("fill", "#ebfa7b");

	var fillColor = selection.select("desc").text();
	selection.style("fill", fillColor);

	var deselect = d3.select("#"+properties.code3+"label").remove(); //remove info label
};

function moveLabel(maternityData) {

	//horizontal label coordinate based mouse position stored in d3.event
	var x = d3.event.clientX < window.innerWidth - 245 ? d3.event.clientX+10 : d3.event.clientX-210; 
	//vertical label coordinate
	var y = d3.event.clientY < window.innerHeight - 100 ? d3.event.clientY-75 : d3.event.clientY-175; 
	
	d3.select(".infoLabel") //select the label div for moving
		.style("margin-left", x+"px") //reposition label horizontal
		.style("margin-top", y+"px"); //reposition label vertical
};