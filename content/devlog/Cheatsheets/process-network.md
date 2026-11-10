---
type: cheatsheet
tags: [cheatsheet, system, network]
---
# Process / port / network cheatsheet

Covers issues like "a port is already in use," "a service won't connect," or "a process is hung." macOS-focused.

## Finding the process using a port
```bash
lsof -i :3000                  # who's using port 3000
lsof -i -P -n | grep LISTEN    # all listening ports
kill -9 <pid>                  # kill the process holding it
```

## Processes
```bash
ps aux | grep <name>           # find a process
top -o cpu                     # sort by CPU to see what's eating resources (q to quit)
lsof -p <pid>                  # files/connections this process has open
```

## Checking an endpoint's connectivity and response
```bash
curl -v https://api.example.com/health     # -v shows full request/response headers - for redirects, certs, status codes
curl -i <url>                              # headers + body only
curl -X POST <url> -H 'Content-Type: application/json' -d '{"k":"v"}'
curl -w "time_total=%{time_total}\n" -o /dev/null -s <url>  # measure timing only
```

## DNS and connectivity
```bash
ping <host>
dig <domain>                   # resolve to an IP
nc -zv <host> <port>           # test whether a port is reachable (no data sent)
```

## Is a slow download limited per connection or in total
```bash
curl -s --max-time 20 -r 0-9999999 -o /dev/null -w '%{size_download}\n' "$url"   # one flow, 20 s
# run N of these in parallel on disjoint -r ranges and sum size_download; see the technique note
curl -sI "$signed_url" | tr '&' '\n' | grep -E '^(st|se)='                      # Azure SAS validity window
ss -lntp | awk 'NR==1 || /:(3000|3001|53000) /'                                  # Linux: who listens on managed ports
```
Full probe loop and the numbers it produced: ▒▒▒▒▒▒▒▒.

## SSH auth log triage on a Linux server (no sudo needed if in group adm)
```bash
curl -s https://api.ipify.org                                                   # your own egress IP, to grep for below
journalctl -u ssh --since "7 days ago" --no-pager -q > /tmp/authdump.txt        # dump once; each re-read of a large journal costs seconds
grep "Failed password" /tmp/authdump.txt | grep -oE "for (invalid user )?[a-zA-Z0-9_-]+ from [0-9.]+" | sort | uniq -c | sort -rn | head   # who is guessing what
grep Accepted /tmp/authdump.txt | grep -oE "Accepted [a-z]+ for [a-zA-Z0-9_-]+ from [0-9.]+" | sort | uniq -c | sort -rn                 # who actually got in, and how
comm -12 <(grep "Failed password" /tmp/authdump.txt | grep -oE "from [0-9.]+" | sort -u) <(grep Accepted /tmp/authdump.txt | grep -oE "from [0-9.]+" | sort -u)   # IPs on both lists: colleagues mistyping
for i in 6 5 4 3 2 1; do printf "%3d min ago: " $((i*10)); journalctl -u ssh --since "$((i*10)) min ago" --until "$(((i-1)*10)) min ago" -q | grep -c "Failed password"; done   # rate per 10 min
curl -s "http://ip-api.com/json/<ip>?fields=country,city,isp,hosting"          # hosting:true = datacentre box, not a person
grep -E "^\s*(PasswordAuthentication|PermitRootLogin|Port|MaxStartups)" /etc/ssh/sshd_config /etc/ssh/sshd_config.d/*.conf
systemctl is-active ssh.socket                                                  # active = socket activation; Port in sshd_config is ignored
sudo fail2ban-client status sshd                                                # banned list; run separately from a restart, the socket takes a moment
```

## Related
- [[search]]
- [[git]]
- [[fail2ban-escalating-ban-formula]]
- [[SSH]]
