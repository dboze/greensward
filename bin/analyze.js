var fs = require('fs');
var parse = require('csv-parse/lib/sync');
var _ = require('lodash');
var turf = require('turf');

var popfile = './data/ACS_14_5YR_B01003.csv'
var bgfile = './data/bgs.json'
var placesfile = './data/places.json'
var parkfile = './data/park.json'

var counts = {};

var outputs = {
	population: {
		memphis: {
			x: 0.0,
			y: 0.0,
			total: 0,
			file: "./output/memphis_cog.json"
		},
		shelby: {
			x: 0.0,
			y: 0.0,
			total: 0,
			file: "./output/shelby_cog.json"
		}
	},
	nearpark: {
		population: 0
	}
}

var memphis = _.find(JSON.parse(
	fs.readFileSync(placesfile)
).features, function(p) {
	return p.properties.NAME == "Memphis"
});

var park = JSON.parse(
	fs.readFileSync(parkfile)
);

park = turf.buffer(park, 2.0, 'miles');

var population = fs.readFileSync(popfile);
var data = parse(population, { columns: true })

_(data).forEach(function(bg) {
	counts[bg["GEO.id2"]] = { population: parseInt(bg["HD01_VD01"]) };
});

var bgs = JSON.parse(
	fs.readFileSync(bgfile)
);

keys = _.keys(counts);
_(bgs.features).forEach(function(bg) {
	geoid =  bg.properties.GEOID;
	if (_.includes(keys, geoid)) {
		// inside shelby county
		center = turf.centroid(bg);
		count = counts[geoid].population;
		outputs.population.shelby.total += count;
		outputs.population.shelby.x += (center.geometry.coordinates[0] * count);
		outputs.population.shelby.y += (center.geometry.coordinates[1] * count);
		
		if (turf.inside(center, memphis)) {
			// inside city of memphis
			outputs.population.memphis.total += count;
			outputs.population.memphis.x += (center.geometry.coordinates[0] * count);
			outputs.population.memphis.y += (center.geometry.coordinates[1] * count);
			
			if (turf.inside(center, park.features[0])) {
				// inside 2 miles of park
				outputs.nearpark.population += count;
			}
		}
		delete keys[bg.properties.geoid];
	}
});

_.forEach(outputs.population, function(data, name) {
  x = data.x / data.total
	y = data.y / data.total
	cog = turf.point([x, y]);
	fc = turf.featurecollection([cog]);
	fs.writeFileSync(data.file, JSON.stringify(fc));
});

park_properties = park.features[0].properties
park_properties.name = "Overton Park 2 Miles Buffer"
park_properties.total_population = outputs.nearpark.population;
fs.writeFileSync('./output/nearpark.json', JSON.stringify(park));
