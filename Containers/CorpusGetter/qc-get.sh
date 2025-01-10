#!/usr/bin/env bash

getCorpus() {
  echo "Getting QualitasCorpus..."
  cd /QualitasCorpus
  wget http://www.cs.auckland.ac.nz/~ewan/download/corpus/QualitasCorpus-20130901r-pt1.tar
  #wget ftp://custsrv1.bth.se/FTP/QualitasCorpus/QualitasCorpus-20130901r-pt1.tar
  wget http://www.cs.auckland.ac.nz/~ewan/download/corpus/QualitasCorpus-20130901r-pt2.tar
  #wget ftp://custsrv1.bth.se/FTP/QualitasCorpus/QualitasCorpus-20130901r-pt2.tar
  tar xf QualitasCorpus-20130901r-pt1.tar
  tar xf QualitasCorpus-20130901r-pt2.tar
  yes | QualitasCorpus-20130901r/bin/install.pl
  rm QualitasCorpus-20130901r-pt1.tar
  rm QualitasCorpus-20130901r-pt2.tar  
}

getCorpusFast() {
  echo "Getting QualitasCorpus..."
  cd /QualitasCorpus
  wget http://www.cs.auckland.ac.nz/~ewan/download/corpus/QualitasCorpus-20130901e-pt9.tar
  tar xf QualitasCorpus-20130901e-pt9.tar
  yes | QualitasCorpus-20130901e/bin/install.pl
  rm QualitasCorpus-20130901e-pt9.tar
}

printCorpusStatsFast() {
  echo "Statistics for QualitasCorpus mini"
  echo "------------------------------"
  echo "Creation time       :" $( stat -c "%z" /QualitasCorpus/QualitasCorpus-20130901e )
  echo "Size on disk        :" $( du -hs /QualitasCorpus/QualitasCorpus-20130901e )
  cd /QualitasCorpus/QualitasCorpus-20130901e/Systems
  echo "Number of files     :" $( find -type f | wc -l )
  echo "Number of Java files:"  $( find -type f -name "*.java" | wc -l )
  echo "Size of Java files  :" $( find -type f -name "*.java" -print0 | du -hc --files0-from - | tail -n1 )
}


printCorpusStats() {
  echo "Statistics for QualitasCorpus"
  echo "------------------------------"
  echo "Creation time       :" $( stat -c "%z" /QualitasCorpus/QualitasCorpus-20130901r )
  echo "Size on disk        :" $( du -hs /QualitasCorpus/QualitasCorpus-20130901r )
  cd /QualitasCorpus/QualitasCorpus-20130901r/Systems
  echo "Number of files     :" $( find -type f | wc -l )
  echo "Number of Java files:"  $( find -type f -name "*.java" | wc -l )
  echo "Size of Java files  :" $( find -type f -name "*.java" -print0 | du -hc --files0-from - | tail -n1 )
}

# Start here
# --------------------

echo "Staring Corpus-Getter..."
echo "Start command is:" $0 $@

if [[ "$1" == "FETCH" ]]; then
  echo "Started with FETCH argument, fetching corpus..."
  getCorpusFast
  echo ""
  printCorpusStatsFast
else
  printCorpusStatsFast
fi

# Wait for keypress, then end container
# --------------------
read -n 1 -p "Press any key to end the container."
