Greensward
==========

Greensward provides quick and dirty scripts for analyzing population data around Shelby County, Memphis, and Overton Park.

Data
----

* US Census ACS 2014 5-year estimates (http://factfinder.census.gov/faces/nav/jsf/pages/guided_search.xhtml)
* US Census TIGER/Line 2015 Block Groups
* US Census TIGER/Line 2015 Places

Outputs
-------

* center of gravity of Shelby County population
* center of gravity of City of Memphis population
* measurements within 2 miles of Overton Park boundry
  * residential population
  * number of households
  * household income counts
    * less than $30k per year
    * less than $75k per year
    * less than $150k per year
    * greater than $150k per year

Setup
-----

Install GDAL (OS X)

```
brew install gdal
```

Install node (OS X)

```
brew install node
```

Install node modules

```
npm install
```

Download and transform data

```
make all && make clean
```

Run analysis

```
node bin/analyze.js
```