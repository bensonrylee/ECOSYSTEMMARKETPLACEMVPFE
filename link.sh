#!/usr/bin/expect -f

set timeout 30
spawn supabase link --project-ref ftozjjjrhifbblpslixk

expect "Enter your database password:"
send "zifsiw-Xatfyv-2gyfpa\r"

expect eof