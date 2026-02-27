"""
Utilities for matching dynamic path patterns and extracting parameters.

Pattern format examples:
  /product/:id:number/:slug?:string   -> id required (number), slug optional (string)
  /product/:id/:slug?                 -> id required, slug optional (both as string)
  /blog/:slug                         -> slug required

Segments:
  :name        - required, any string (no /)
  :name?       - optional (matches optional trailing segment)
  :name:number - required, numeric
  :name?:string - optional string
"""
import re
from typing import Optional


def pattern_to_regex(pattern: str) -> tuple[re.Pattern, list[str]]:
    """
    Convert a path pattern to a regex and return (compiled_pattern, param_names).
    """
    param_names = []
    segments = [s for s in pattern.strip("/").split("/") if s] if pattern not in ("/", "") else []
    parts = ["^/"] if segments else ["^"]

    for i, seg in enumerate(segments):
        m = re.match(r"^:(\w+)(\??)(?::(\w+))?$", seg)
        if m:
            param_name, optional, param_type = m.groups()
            param_names.append(param_name)
            if optional == "?":
                # Optional segment: (?:/value)? - slash included, don't add separator before
                if param_type == "number":
                    parts.append(r"(?:/(?P<" + param_name + r">\d+))?")
                else:
                    parts.append(r"(?:/(?P<" + param_name + r">[^/]*))?")
            else:
                if i > 0:
                    parts.append("/")
                if param_type == "number":
                    parts.append(r"(?P<" + param_name + r">\d+)")
                else:
                    parts.append(r"(?P<" + param_name + r">[^/]+)")
        else:
            if i > 0:
                parts.append("/")
            parts.append(re.escape(seg))

    regex_str = "".join(parts) + "/?$"
    if not segments:
        regex_str = "^/?$"
    return re.compile(regex_str), param_names


def match_path(pattern: str, path: str) -> Optional[dict[str, str | int]]:
    """
    Match path against pattern. Return extracted params dict or None.
    Coerces :number params to int.
    """
    try:
        regex, param_names = pattern_to_regex(pattern)
        m = regex.match(path)
        if not m:
            return None
        groups = m.groupdict()
        result = {}
        for name in param_names:
            val = groups.get(name)
            if val is not None and val != "":
                # Check if pattern had :number type for this param
                if re.search(rf":{re.escape(name)}\??:number\b", pattern):
                    try:
                        result[name] = int(val)
                    except ValueError:
                        result[name] = val
                else:
                    result[name] = val
        return result
    except Exception:
        return None
