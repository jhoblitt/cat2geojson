#!/usr/bin/env node

const
  fs = require('fs'),
  parseArgs = require('minimist');

// parse options with minimist
// https://github.com/substack/minimist
var opts = {
  string: [ 'limit', 'output', 'minmag', 'maxmag' ],
  boolean: [ 'help', 'debug' ],
  default: { limit: 0, minmag: 0, maxmag: 0 },
  alias: { l: 'limit', o: 'output', h: 'help', d: 'debug' },
  unknown: unknownArg,
};

var argv = parseArgs(process.argv.slice(2), opts);
if (argv.help) {
  exitUsage();
}
if (argv._.length === 0) {
  process.stderr.write("<filename> is required\n");
  exitUsage();
}
if (argv._.length > 1) {
  process.stderr.write("Only one <filename> argument is allowed\n");
  exitUsage();
}

// unpack opts for convenience
var debug = argv.debug;
var limit = argv.limit;
var output = argv.output;
var minmag = argv.minmag;
var maxmag = argv.maxmag;
var filename = argv._[0];

if (debug) {
  console.dir(argv);
}

// input <filename> is ASCII with newline separated rows
var text = fs.readFileSync(filename).toString();
// chomp trailing newline(s)
text = text.replace(/\n+$/, '');
var rows = text.split("\n");

// Each "feature" we're extracting from the catalog needs to be 
// wrapped as a GeoJSON FeatureCollection.  This naive implementation stores
// all the features in memory and then serializes them all at once into a valid
// GeoJSON document.
var features = [];
for (var n = 0; n < rows.length; n++) {
  // convert cols array into a simple object so cols can be looked up by name
  var obj = rowToObject(rows[n]);
  if (!obj) {
    continue;
  }

  if (minmag !== 0 && obj.mag <= minmag) {
    continue;
  }
  if (maxmag !== 0 && obj.mag >= maxmag) {
    continue;
  }

  // convert cols obj into an object representing a GeoJSON "Feature"
  var geo = objectToGeoJSON(obj);

  features.push(geo);

  // check output limit
  if (features.length == limit) {
    break;
  }
}

if (! features.length) {
  process.stdout.write("no GeoJSON Features to output\n");
  process.exit(0);
}

var geojson = {
  "type": "FeatureCollection",
  "features": features,
};

// serialize GeoJSON features
var doc = JSON.stringify(geojson);
if (output) {
  fs.writeFileSync(output, doc);
} else {
  process.stdout.write(doc);
}

process.exit(0);

function unknownArg(arg) {
  // die if the unknown option starts with -
  // otherwise, treat it as a filename arg and add it to argv._
  if (arg.match(/^-+/)) {
    process.stderr.write('unknown option: ' + arg + "\n");
    exitUsage();
  }

  return true;
}

function exitUsage() {
  var pname = basename(process.argv[1]);

  process.stderr.write("Usage:\n");
  process.stderr.write('  ' + pname + " [-l|--limit <n>] [-o|--output <filename>] <filename>\n");
  process.stderr.write('  ' + pname + " [--minmag <n>] [--maxmag <n>] ...\n");
  process.stderr.write('  ' + pname + " [-d|--debug] ...\n");
  process.stderr.write('  ' + pname + " [-h|--help]\n");
  process.exit(1);
}

// https://stackoverflow.com/questions/3820381/need-a-basename-function-in-javascript
function basename(path) {
  return path.split(/[\\/]/).pop();
}

function rowToObject(row) {
  // catolog format
  // ID                             RA          DEC         MAG     MAG-ERROR
  // CFHTLS-D-R-J221427.59-181425.4 333.6149701 -18.2403893 13.7879 0.0000

  // cols are white space separated
  var cols = row.split(/\s+/);

  // ignore rows with too few columns
  // any additional columns are silently ignored
  if (cols.length != 5) {
    process.stderr.write("ERROR: invalid column format --" + row + "\n");
    return false;
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
      // per the GeoJSON spec, coordinates are in longitude, latitude order
      // http://geojson.org/geojson-spec.html#positions
      "coordinates": [obj.ra, obj.dec],
    },
  };
}
