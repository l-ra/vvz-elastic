#!/bin/sh
mkdir -p $(dirname $0)/data
for i in $(seq 2006 2016); do 
	curl --insecure https://www.isvz.cz/ReportingSuite/Explorer/Download/Data/XML/VVZ/2014 > $(dirname $0)/2014.xml	
done