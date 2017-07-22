#!/bin/bash

CWD=`pwd`

nohup node --trace-warnings LawnBot.js >>lawnbot.log 2>&1 &
