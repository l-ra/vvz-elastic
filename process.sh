#!/bin/sh

# clean index and create mapping
echo dropping index vz
curl -XDELETE  http://localhost:9200/vz
echo creating mapping
curl -XPUT --data-binary @mappings.json  http://localhost:9200/vz

echo indexing data
for XMLFILE in $(dirname $0)/data/*.xml; do
	BULKFILE=$XMLFILE.bulk 
	RESULTFILE=$XMLFILE.result
	EXTRREP=$XMLFILE.extract
	echo "Converting $XMLFILE to $BULKFILE"
	node extract.js $XMLFILE $BULKFILE $EXTRREP
	echo indexing
	curl -XPOST --data-binary @$BULKFILE http://localhost:9200/_bulk?pretty > $RESULTFILE
done
