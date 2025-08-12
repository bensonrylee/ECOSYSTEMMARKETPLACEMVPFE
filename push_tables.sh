#!/usr/bin/expect -f

set timeout 30
spawn supabase db push create_tables.sql

expect "Enter your database password:"
send "zifsiw-Xatfyv-2gyfpa\r"

expect eof