var typFormulare={};
typFormulare["F01"]="F01 Oznámení předběžných informací";
typFormulare["F02"]="F02 Oznámení o zakázce";
typFormulare["F03"]="F03 Oznámení o zadání zakázky";
typFormulare["F04"]="F04 Pravidelné předběžné oznámení – veřejné služby";
typFormulare["F05"]="F05 Oznámení o zakázce - veřejné služby";
typFormulare["F06"]="F06 Oznámení o zadání zakázky - veřejné služby";
typFormulare["F07"]="F07 Systém kvalifikace – veřejné služby";
typFormulare["F08"]="F08 Oznámení na profilu kupujícího";
typFormulare["F09"]="F09 Zjednodušené oznámení o zakázce v rámci dynamického nákupního systému";
typFormulare["F10"]="F10 Koncese na stavební práce";
typFormulare["F11"]="F11 Oznámení o zakázce - zakázka zadávaná koncesionářem, který není veřejným zadavatelem";
typFormulare["F12"]="F12 Oznámení o veřejné soutěži na určitý výkon";
typFormulare["F13"]="F13 Výsledek veřejné soutěže na určitý výkon";
typFormulare["F15"]="F15 Oznámení o dobrovolné pr hlednosti ex ante";
typFormulare["F16"]="F16 Oznámení předběžných informací - obrana a bezpe nost";
typFormulare["F17"]="F17 Oznámení o zakázce - obrana a bezpečnost";
typFormulare["F18"]="F18 Oznámení o zadání zakázky - obrana a bezpečnost";
typFormulare["F19"]="F19 Oznámení o subdodávce- obrana a bezpečnost";
typFormulare["F51"]="F51 Zrušení zadávacího řízení /soutěže o návrh";
typFormulare["F52"]="F52 Oznámení profilu zadavatele";
typFormulare["F53"]="F53 Zrušení profilu zadavatele";
typFormulare["F54"]="F54 Souhrn oznámení o zadání zakázek na základ rámcové smlouvy";





var fname="data.xml"
var outfname="output.data";
if (process.argv.length>4){
	fname=process.argv[2];
	outfname=process.argv[3];
	repfname=process.argv[4];
	console.log("processing: "+fname+" --> "+outfname);
}
else {
	console.log("Usage node extract.js input.xml output.bulk report.extract");
	process.exit(1);
}


var fs=require('fs');
var strict = true; // set to false for html-mode
var saxStream = require("sax").createStream(strict, {});
var countZak=0;
var countCast=0;
var processedZak=0;
var processedCast=0;

saxStream.on("error", function (e) {
  // unhandled errors will throw, since this is a proper node
  // event emitter.
  console.error("error!", e)
  // clear the error
  //this._parser.error = null
  //this._parser.resume()
});

// states: doc, root, CastiVerejneZakazky, VerejnaZakazka
var state=0; 
var elementStack=[];
var cast=null;
var zak=null;

var output=fs.createWriteStream(outfname);

saxStream.on("opentag", function (node) {
	elementStack.push(node.name);
	if (node.name=="CastiVerejneZakazky"){
		cast={
			typZaznamu:"cast"
		};
	}

	if (node.name=="VerejnaZakazka"){
		zak={
			typZaznamu:"zakazka"
		};
	}
});

saxStream.on("text",  function (t) {
	if (/^\s+$/.test(t)) return;
	else {
		var elmName=elementStack[elementStack.length-1];
		if (cast!=null) {
			cast[elmName]=t;
		}
		if (zak!=null){
			zak[elmName]=t;
		}
	};
});

saxStream.on("closetag",  function (node) {

	if (node=="CastiVerejneZakazky"){
		countCast++;
		if (cast.PlatnyFormular=="true"){
			processedCast++;
			if (typeof(cast.DodavatelNazev)!="undefined") 
				cast.DodavatelNazevTerm=cast.DodavatelNazev;
			if (typeof(cast.TypFormulare)!="undefined")
				cast.TypFormulare=typFormulare[cast.TypFormulare]?typFormulare[cast.TypFormulare]:cast.TypFormulare+" NEZNAMY TYP";
			var str=JSON.stringify(cast);
			output.write('{ "index" : { "_index" : "vz", "_type" : "CastiVerejneZakazky" } }\n');
			output.write(str);
			output.write("\n");			
		}
		cast=null;
	}

	if (node=="VerejnaZakazka"){
		countZak++;
		if (zak.PlatnyFormular=="true"){
			processedZak++;
			if (typeof(zak.TypFormulare)!="undefined")
				zak.TypFormulare=typFormulare[zak.TypFormulare]?typFormulare[zak.TypFormulare]:zak.TypFormulare+" NEZNAMY TYP";
			var str=JSON.stringify(zak);
			output.write('{ "index" : { "_index" : "vz", "_type" : "VerejnaZakazka" } }\n');
			output.write(str);
			output.write("\n");
		}
		zak=null;
	}
	elementStack.pop();
});

saxStream.on("end",  function () {
	try {
		output.close();
		var rep=fs.createWriteStream(repfname);
		rep.write(new Buffer("PocetZakazek:"+countZak+"\n"
			     +"PocetZpracovanychZakazek:"+processedZak+"\n"
			     +"PocetCasti:"+countCast+"\n"
			     +"PocetZpracovanychCasti:"+processedCast+"\n"));

		rep.close();		
	}
	catch (e){
		console.log("error ending",e);
	}
});

fs.createReadStream(fname)
  .pipe(saxStream);

