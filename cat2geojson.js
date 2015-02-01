#!/usr/bin/env node

const
  fs = require('fs'),
  filename = process.argv[2];

if (!filename) {
  throw Error('A file to watch must be specified!');
}

var text = fs.readFileSync(filename).toString();
var rows = text.split("\n");

var features = [];
//for (var n = 0; n < rows.length; n++) {
for (var n = 0; n < 1000; n++) {
  var cols = rows[n].split(/\s+/);
  var obj = colsToObject(cols);
  var geo = objectToGeoJSON(obj);
  features.push(geo);
}

var geojson = {
  "type": "FeatureCollection",
  "features": features,
};

process.stdout.write(JSON.stringify(geojson));

function colsToObject(cols) {
  if (cols.length != 5) {
    process.stderr.write("ERROR: invalid column --" + cols + "\n");
  }

  var obj = {
    id: cols[0],
    ra: cols[1],
    dec: cols[2],
    mag: cols[3],
    magerror: cols[4],
  };

  return obj;
}

function objectToGeoJSON(obj) {
  return {
    "type": "Feature",
    "properties": {
      "name": obj.id,
      "popupContent": obj.id + " - mag: " + obj.mag + " error: " + obj.magerror, 
    },
    "geometry": {
      "type": "Point",
      "coordinates": [obj.dec, obj.ra],
    }
  };
}
