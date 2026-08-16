import re
from pathlib import Path


directive = """    # MatchZy streams raw CS2 demo files after each map. Admin uploads
    # are split into 50 MiB requests so they also fit through Cloudflare.
    client_max_body_size 500m;
    proxy_request_buffering off;"""

for path in sorted(Path("nginx/conf.d").glob("*.conf")):
    contents = path.read_text(encoding="utf-8")
    server_name = "    server_name xomnghien.com;"
    if server_name not in contents:
        continue
    if "# MatchZy streams raw CS2 demo files" not in contents:
        contents = contents.replace(server_name, f"{server_name}\n\n{directive}", 1)
    else:
        contents, replacements = re.subn(
            r"    # MatchZy streams raw CS2 demo files.*?    proxy_request_buffering off;",
            directive,
            contents,
            count=1,
            flags=re.DOTALL,
        )
        if replacements != 1:
            raise SystemExit("Could not update the MatchZy nginx directives")
    path.write_text(contents, encoding="utf-8")
    break
else:
    raise SystemExit("Could not find the xomnghien.com nginx server block")
