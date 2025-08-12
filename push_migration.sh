#!/usr/bin/expect -f

set timeout 30
spawn supabase db push

expect "Enter your database password:"
send "zifsiw-Xatfyv-2gyfpa\r"

expect "\[Y/n\]"
send "Y\r"

expect eof