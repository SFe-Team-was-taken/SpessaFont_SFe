#!/bin/bash
rm -rf ./node_modules
npm install
npm uninstall spessasynth_core spessasynth_lib
npm install ../spessasynth_core ../spessasynth_lib
npm run debug
npm run build
npm run dev
