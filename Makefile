clean:
	rm -rf tmp

all: data/places.json data/bgs.json

# block groups
tmp/gz/tl_2015_47_bg.zip:
	mkdir -p $(dir $@)
	curl 'http://www2.census.gov/geo/tiger/TIGER2015/BG/$(notdir $@)' -o $@.download
	mv $@.download $@
	
#places
tmp/gz/tl_2015_47_place.zip:
	mkdir -p $(dir $@)
	curl 'http://www2.census.gov/geo/tiger/TIGER2015/PLACE/$(notdir $@)' -o $@.download
	mv $@.download $@
	
tmp/shp/tn/blockgroups.shp: tmp/gz/tl_2015_47_bg.zip

tmp/shp/tn/places.shp: tmp/gz/tl_2015_47_place.zip

tmp/shp/tn/blockgroups.shp:
	rm -rf $(basename $@)
	mkdir -p $(basename $@)
	unzip -d $(basename $@) $<
	for file in $(basename $@)/*; do chmod 644 $$file; mv $$file $(basename $@).$${file##*.}; done
	rmdir $(basename $@)
	touch $@

data/bgs.json: tmp/shp/tn/blockgroups.shp
	mkdir -p $(dir $@)
	ogr2ogr -f GeoJSON -t_srs crs:84 $@ $<
	
tmp/shp/tn/places.shp:
	rm -rf $(basename $@)
	mkdir -p $(basename $@)
	unzip -d $(basename $@) $<
	for file in $(basename $@)/*; do chmod 644 $$file; mv $$file $(basename $@).$${file##*.}; done
	rmdir $(basename $@)
	touch $@

data/places.json: tmp/shp/tn/places.shp
	mkdir -p $(dir $@)
	ogr2ogr -f GeoJSON -t_srs crs:84 $@ $<
