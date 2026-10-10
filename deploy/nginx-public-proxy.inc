# Included INSIDE a location block. Never include at http/server scope.
# Adjust this one target only if the existing service uses a different port.
proxy_pass http://127.0.0.1:8018;
proxy_http_version 1.1;
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header Connection "";
proxy_connect_timeout 5s;
proxy_read_timeout 120s;
proxy_buffering off;
proxy_intercept_errors off;
# Do not proxy_hide_header X-Robots-Tag or overwrite Cache-Control/robots here.
# Do not add an error_page fallback to index.html.
