var fs = require('fs');
var parse = require('csv-parse/lib/sync');
var _ = require('lodash');
var turf = require('turf');

var popfile = './data/ACS_14_5YR_B01003.csv';
var incomefile = './data/ACS_14_5YR_B19001_with_ann.csv';
var bgfile = './data/bgs.json';
var placesfile = './data/places.json';
var parkfile = './data/park.json';

var bg_metadata = {};

var outputs = {
  population: {
    memphis: {
      x: 0.0,
      y: 0.0,
      total: 0,
      bg_count: 0
    },
    shelby: {
      x: 0.0,
      y: 0.0,
      total: 0,
      bg_count: 0
    }
  },
  nearpark: {
    population: 0,
    bg_count: 0,
    households: 0,
    income: {}
  }
};

var memphis = _.find(JSON.parse(
  fs.readFileSync(placesfile)
).features, function(p) {
  return p.properties.NAME == "Memphis";
});

var park = turf.buffer( JSON.parse(fs.readFileSync(parkfile)), 2.0, 'miles');
var bgs = JSON.parse(fs.readFileSync(bgfile));
var pop_data = parse(fs.readFileSync(popfile), { columns: true });
var income_data = parse(fs.readFileSync(incomefile), { columns: true });

_(pop_data).forEach(function(bg) {
  bg_metadata[bg["GEO.id2"]] = { population: parseInt(bg.HD01_VD01) };
});
_(income_data).forEach(function(bg) {
  var geoid = bg['GEO.id2'];
  if (geoid in bg_metadata) {
    bg_metadata[geoid].households = parseInt(bg.HD01_VD01);
  
    var lt_30k =  parseInt(bg.HD01_VD02) +
                  parseInt(bg.HD01_VD03) +
                  parseInt(bg.HD01_VD04) +
                  parseInt(bg.HD01_VD05) +
                  parseInt(bg.HD01_VD06);
    var lt_75k =  lt_30k + 
                  parseInt(bg.HD01_VD07) +
                  parseInt(bg.HD01_VD08) +
                  parseInt(bg.HD01_VD09) +
                  parseInt(bg.HD01_VD10) +
                  parseInt(bg.HD01_VD11) +
                  parseInt(bg.HD01_VD12);
    var lt_150k = lt_75k +                   
                  parseInt(bg.HD01_VD13) +
                  parseInt(bg.HD01_VD14) +
                  parseInt(bg.HD01_VD15);
    var gt_150k = parseInt(bg.HD01_VD16) +
                  parseInt(bg.HD01_VD17);

    bg_metadata[geoid].income = {
      'lt_30k': lt_30k,
      'lt_75k': lt_75k,
      'lt_150k': lt_150k,
      'gt_150k': gt_150k
    };
  }
});

var features = [];
_(bgs.features).forEach(function(bg) {
  var geoid =  bg.properties.GEOID;
  if (geoid in bg_metadata) {
    // inside shelby county
    var fill_color = 'yellow';
    var center = turf.centroid(bg);
    var population = bg_metadata[geoid].population;
    var households = bg_metadata[geoid].households;
    outputs.population.shelby.total += population;
    outputs.population.shelby.households += households;
    outputs.population.shelby.bg_count += 1;
    outputs.population.shelby.x += (center.geometry.coordinates[0] * population);
    outputs.population.shelby.y += (center.geometry.coordinates[1] * population);
    
    if (turf.inside(center, memphis)) {
      // inside city of memphis
      fill_color = 'blue';
      outputs.population.memphis.total += population;
      outputs.population.memphis.households += households;
      outputs.population.memphis.bg_count += 1;
      outputs.population.memphis.x += (center.geometry.coordinates[0] * population);
      outputs.population.memphis.y += (center.geometry.coordinates[1] * population);
      
      if (turf.inside(center, park.features[0])) {
        // inside 2 miles of park
        fill_color = 'red';
        outputs.nearpark.population += population;
        outputs.nearpark.households += households;
        outputs.nearpark.bg_count += 1; 
        
        var income = bg_metadata[geoid].income;
        _(income).forEach(function(i, k) {
          if (!(k in outputs.nearpark.income)) {
            outputs.nearpark.income[k] = 0;
          }
          outputs.nearpark.income[k] += i;
        });

      }
      features.push({
        type: 'Feature',
        properties:{
          fill: fill_color
        },
        geometry: bg.geometry
      });
    }
  }
});

_.forEach(outputs.population, function(data, name) {
  var x = data.x / data.total;
  var y = data.y / data.total;
  var cog = turf.point([x, y]);
  cog.properties = {
    name: name + " population center",
    population: data.total,
    bg_count: data.bg_count
  };
  features.push(cog);
});

park_properties = park.features[0].properties;
park_properties.name = "Overton Park 2 Miles Buffer";
park_properties.total_population = outputs.nearpark.population;
park_properties.households = outputs.nearpark.households;
park_properties.bg_count = outputs.nearpark.bg_count;
park_properties['stroke-width'] = 2;
park_properties['stroke-color'] = 'black';
_(outputs.nearpark.income).forEach(function(i, k) {
  park_properties['income_' + k] = i;
});

features.push(park.features[0]);
var fc = turf.featurecollection(features);
fs.writeFileSync('./output/nearpark.json', JSON.stringify(fc));

console.log(outputs.nearpark);
