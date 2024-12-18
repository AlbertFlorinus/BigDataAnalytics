const express = require('express');
const formidable = require('formidable');
const fs = require('fs/promises');
const app = express();
const PORT = 3000;

const Timer = require('./Timer');
const CloneDetector = require('./CloneDetector');
const CloneStorage = require('./CloneStorage');
const FileStorage = require('./FileStorage');


// Express and Formidable stuff to receice a file for further processing
// --------------------
const form = formidable({multiples:false});
const fileTimingStatistics = []; // Store up to 1000 files for trends
const MAX_STATS = 1000; // Max files to track for trends

app.post('/', fileReceiver );
function fileReceiver(req, res, next) {
    //ändrad från orginalet, tidigare kraschade den IBLAND av missing filepath
    form.parse(req, (err, fields, files) => {
        if (err) {
            console.error('Error parsing form:', err);
            return res.status(400).json({ error: 'Invalid form submission. Please try again.' });
        }
        if (!files || !files.data || !files.data.filepath) {
            console.error('Filepath is missing in the uploaded files.');
            return res.status(400).json({ error: 'No valid file uploaded. Please try again.' });
        }
        fs.readFile(files.data.filepath, { encoding: 'utf8' })
            .then(data => processFile(fields.name, data))
            .then(() => res.status(200).end('File processed successfully.'))
            .catch(error => {
                console.error('Error processing file:', error);
                res.status(500).json({ error: 'Error processing the uploaded file.' });
            });
    });
}

app.get('/timers', (req, res) => {
    // Compute statistics
    const totalFiles = fileTimingStatistics.length;
    if (totalFiles === 0) return res.send('<HTML><BODY><H1>No data available</H1></BODY></HTML>');

    const avgTotalTime = fileTimingStatistics.reduce((sum, stat) => sum + stat.totalTime, 0) / totalFiles;
    const avgNormTime = fileTimingStatistics.reduce((sum, stat) => sum + stat.normalizedTime, 0) / totalFiles;

    const last100 = fileTimingStatistics.slice(-100);
    const avgLast100TotalTime = last100.reduce((sum, stat) => sum + stat.totalTime, 0) / last100.length;
    const avgLast100NormTime = last100.reduce((sum, stat) => sum + stat.normalizedTime, 0) / last100.length;

    // Generate HTML with timing stats and trend graph
    let page = '<HTML><HEAD><TITLE>Timing Statistics</TITLE></HEAD>\n';
    page += '<BODY><H1>Timing Statistics</H1>\n';

    // Averages
    page += `<p>Total files processed: ${totalFiles}</p>\n`;
    page += `<p>Average Total Time (All): ${avgTotalTime.toFixed(2)} µs</p>\n`;
    page += `<p>Average Normalized Time (All): ${avgNormTime.toFixed(2)} µs/line</p>\n`;
    page += `<p>Average Total Time (Last 100): ${avgLast100TotalTime.toFixed(2)} µs</p>\n`;
    page += `<p>Average Normalized Time (Last 100): ${avgLast100NormTime.toFixed(2)} µs/line</p>\n`;

    // Data for Graph
    const graphData = fileTimingStatistics.map((stat, index) => ({
        x: index + 1,
        totalTime: stat.totalTime,
        normalizedTime: stat.normalizedTime,
    }));

    page += '<H2>Timing Trends (Last 1000 Files)</H2>\n';
    page += '<script src="https://cdn.plot.ly/plotly-latest.min.js"></script>\n';
    page += '<div id="graph"></div>\n';
    page += '<script>\n';
    page += 'var data = [\n';
    page += '  {\n';
    page += '    x: ' + JSON.stringify(graphData.map(d => d.x)) + ',\n';
    page += '    y: ' + JSON.stringify(graphData.map(d => d.totalTime)) + ',\n';
    page += '    type: "scatter",\n';
    page += '    name: "Total Time (µs)"\n';
    page += '  },\n';
    page += '  {\n';
    page += '    x: ' + JSON.stringify(graphData.map(d => d.x)) + ',\n';
    page += '    y: ' + JSON.stringify(graphData.map(d => d.normalizedTime)) + ',\n';
    page += '    type: "scatter",\n';
    page += '    name: "Normalized Time (µs/line)"\n';
    page += '  }\n';
    page += '];\n';
    page += 'Plotly.newPlot("graph", data);\n';
    page += '</script>\n';

    page += '</BODY></HTML>';
    res.send(page);
});

app.get('/', viewClones );

const server = app.listen(PORT, () => { console.log('Listening for files on port', PORT); });


// Page generation for viewing current progress
// --------------------
function getStatistics() {
    let cloneStore = CloneStorage.getInstance();
    let fileStore = FileStorage.getInstance();
    let output = 'Processed ' + fileStore.numberOfFiles + ' files containing ' + cloneStore.numberOfClones + ' clones.'
    return output;
}

function lastFileTimersHTML() {
    if (!lastFile) return '';
    output = '<p>Timers for last file processed:</p>\n<ul>\n'
    let timers = Timer.getTimers(lastFile);
    for (t in timers) {
        output += '<li>' + t + ': ' + (timers[t] / (1000n)) + ' µs\n'
    }
    output += '</ul>\n';
    return output;
}

function listClonesHTML() {
    let cloneStore = CloneStorage.getInstance();
    let output = '';

    cloneStore.clones.forEach( clone => {
        output += '<hr>\n';
        output += '<h2>Source File: ' + clone.sourceName + '</h2>\n';
        output += '<p>Starting at line: ' + clone.sourceStart + ' , ending at line: ' + clone.sourceEnd + '</p>\n';
        output += '<ul>';
        clone.targets.forEach( target => {
            output += '<li>Found in ' + target.name + ' starting at line ' + target.startLine + '\n';            
        });
        output += '</ul>\n'
        output += '<h3>Contents:</h3>\n<pre><code>\n';
        output += clone.originalCode;
        output += '</code></pre>\n';
    });

    return output;
}

function listProcessedFilesHTML() {
    let fs = FileStorage.getInstance();
    let output = '<HR>\n<H2>Processed Files</H2>\n'
    output += fs.filenames.reduce( (out, name) => {
        out += '<li>' + name + '\n';
        return out;
    }, '<ul>\n');
    output += '</ul>\n';
    return output;
}

function viewClones(req, res, next) {
    let page='<HTML><HEAD><TITLE>CodeStream Clone Detector</TITLE></HEAD>\n';
    page += '<BODY><H1>CodeStream Clone Detector</H1>\n';
    page += '<P>' + getStatistics() + '</P>\n';
    page += lastFileTimersHTML() + '\n';
    page += listClonesHTML() + '\n';
    page += listProcessedFilesHTML() + '\n';
    page += '</BODY></HTML>';
    res.send(page);
}

// Some helper functions
// --------------------
// PASS is used to insert functions in a Promise stream and pass on all input parameters untouched.
PASS = fn => d => {
    try {
        fn(d);
        return d;
    } catch (e) {
        throw e;
    }
};

const STATS_FREQ = 100;
const URL = process.env.URL || 'http://localhost:8080/';
var lastFile = null;

function maybePrintStatistics(file, cloneDetector, cloneStore) {
    if (0 == cloneDetector.numberOfProcessedFiles % STATS_FREQ) {
        console.log('Processed', cloneDetector.numberOfProcessedFiles, 'files and found', cloneStore.numberOfClones, 'clones.');
        let timers = Timer.getTimers(file);
        let str = 'Timers for last file processed: ';
        for (t in timers) {
            str += t + ': ' + (timers[t] / (1000n)) + ' µs '
        }
        console.log(str);
        console.log('List of found clones available at', URL);
    }

    return file;
}

// Processing of the file
// --------------------
function processFile(filename, contents) {
    let cd = new CloneDetector();
    let cloneStore = CloneStorage.getInstance();
    let numberOfLines = contents.split('\n').length;

    return Promise.resolve({ name: filename, contents: contents })
        .then(file => Timer.startTimer(file, 'total'))
        .then(file => cd.preprocess(file))
        .then(file => cd.transform(file))
        .then(file => Timer.startTimer(file, 'match'))
        .then(file => cd.matchDetect(file))
        .then(file => cloneStore.storeClones(file))
        .then(file => Timer.endTimer(file, 'match'))
        .then(file => cd.storeFile(file))
        .then(file => Timer.endTimer(file, 'total'))
        .then(file => {
            // Collect timing stats
            const timers = Timer.getTimers(file);
            fileTimingStatistics.push({
                filename: file.name,
                totalTime: Number(timers.total) / 1000, // Convert ns to µs
                matchTime: Number(timers.match) / 1000,
                numberOfLines: numberOfLines,
                normalizedTime: (Number(timers.total) / 1000) / numberOfLines,
            });

            // Keep stats limited to the most recent 1000 files
            if (fileTimingStatistics.length > MAX_STATS) {
                fileTimingStatistics.shift();
            }
            return file;
        })
        .then(PASS(file => lastFile = file))
        .then(PASS(file => maybePrintStatistics(file, cd, cloneStore)))
        .catch(console.log);
}



/*
1. Preprocessing: Remove uninteresting code, determine source and comparison units/granularities
2. Transformation: One or more extraction and/or transformation techniques are applied to the preprocessed code to obtain an intermediate representation of the code.
3. Match Detection: Transformed units (and/or metrics for those units) are compared to find similar source units.
4. Formatting: Locations of identified clones in the transformed units are mapped to the original code base by file location and line number.
5. Post-Processing and Filtering: Visualisation of clones and manual analysis to filter out false positives
6. Aggregation: Clone pairs are aggregated to form clone classes or families, in order to reduce the amount of data and facilitate analysis.
*/
