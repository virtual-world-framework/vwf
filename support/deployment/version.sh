#!/bin/bash

# Convert a version identifier parsed from version.js into a version string.

while read line ; do

  # Locate the line containing the version identifier. The test for `... version-identifier ...`
  # is for 0.6.24 and later. `... major, minor, ...` is for 0.6.23 and earlier.

  if [[ "$line" == *version*version-identifier* || "$line" == *return*"major, minor, patch, build"* ]] ; then

    line=${line#*[}             # remove leading noise
    line=${line%]*}             # remove trailing noise
    line=${line//,/ }           # turn separators into whitespace

    fields=($line)              # split into fields

    major=${fields[0]}          # major number
    minor=${fields[1]}          # minor number
    patch=${fields[2]}          # patch number

    release=${fields[3]//\"}    # release number, string, or null
    release=${release#0}        # turn "0" into null

    build=${fields[4]//\"}      # build number, string, or null
    build=${build#*0}           # turn "0" into null

    echo "${major}.${minor}.${patch}${release:+-$release}${build:++$build}"

  fi

done
