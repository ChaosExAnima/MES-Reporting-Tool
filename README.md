MES Reporting Tool
==================

Command line tool for generating Domain Reports for the Mind's Eye Society.

Requirements
------------
* NodeJS
* NPM

Installation
------------
* Pull latest git repo.
* Run "npm install".
* Then run "node generator.js".

**Parameters**<br>
\<report>	The report to pull last month's data from.<br>
\<requests>	The requests, in CSV format.<br>
\<output>	Optional. The file to write to.<br>

**Example**<br>
node generator.js 06-2013.txt requests.csv 07-2013.txt
