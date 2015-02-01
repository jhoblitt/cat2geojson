cat2geojson
===

A script to convert ASCII white space separated object catalogs into GeoJSON features.

The expected catalog format is:
 
    ID                             RA          DEC         MAG     MAG-ERROR
    CFHTLS-D-R-J221427.59-181425.4 333.6149701 -18.2403893 13.7879 0.0000

Setup
--

    npm install

Usage
--

### Options

```
  cat2geojson.js [-l|--limit <n>] [-o|--output <filename>] <filename>
  cat2geojson.js [--minmag <n>] [--maxmag <n>] ...
  cat2geojson.js [-d|--debug] ...
  cat2geojson.js [-h|--help]
```

### Example

Filter catalog for objects with a magnitude <= 14 and limit the output to a
maximum of 10 objects.

    wget https://s3.amazonaws.com/lsst-epo/testdata/D4.R.cat
    ./cat2geojson.js D4.R.cat --maxmag 14 --limit 10 --output d4.json
