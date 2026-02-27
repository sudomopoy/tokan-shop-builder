"""
تبدیل فایل/متن مارک‌داون به DocSection ها.
پشتیبانی از دو فرمت:

۱) هر سکشن با frontmatter مجزا:
   ---
   title: عنوان
   tags: [تگ۱, تگ۲]
   ---
   # عنوان
   متن بدنه...

۲) فرمت ساده با یک frontmatter در اول فایل و عنوان‌های # / ##
"""
import re
from typing import Optional

try:
    import yaml
except ImportError:
    yaml = None


def _parse_tags_from_string(s: str) -> list[str]:
    """استخراج تگ‌ها از رشته مثل 'سئو, صفحات, راهنما'"""
    if not s or not s.strip():
        return []
    return [t.strip() for t in s.split(",") if t.strip()]


def _parse_tags_from_frontmatter(fm: dict) -> list[str]:
    """استخراج تگ‌ها از frontmatter"""
    ft_tags = fm.get("tags") if fm else None
    if isinstance(ft_tags, list):
        return [str(t).strip() for t in ft_tags]
    if isinstance(ft_tags, str):
        return _parse_tags_from_string(ft_tags)
    return []


def parse_markdown_to_sections(
    content: str, default_tags: Optional[list[str]] = None
) -> list[dict]:
    """
    تبدیل متن مارک‌داون به لیست سکشن‌ها.
    هر آیتم: {title, body, tags, order}
    """
    default_tags = default_tags or []
    content = content.strip()

    # فرمت ۱: هر سکشن با frontmatter مجزا (--- یمل ... --- سپس # heading و body)
    # با split بر اساس \n---\n بلوک‌ها را جدا می‌کنیم
    block_pattern = re.compile(r"\n---\s*\n")
    blocks = block_pattern.split(content)
    # الگوی عنوان: # یا ## در ابتدای خط
    heading_pattern = re.compile(r"^(#{1,2})\s+(.+)$", re.MULTILINE)
    matches = list(heading_pattern.finditer(content))

    # اگر اول فایل با --- شروع شده، بلوک اول frontmatter است
    if blocks and blocks[0].strip().startswith("---"):
        # حذف --- از ابتدا برای پارس YAML
        first = blocks[0].strip()
        if first.startswith("---"):
            first = first[3:].strip()
        i = 1

    sections = []
    i = 0

    while i < len(blocks):
        block = blocks[i].strip()

        # اگر بلوک با --- شروع شد، احتمالاً frontmatter است
        yaml_str = block
        if block.startswith("---"):
            yaml_str = block[3:].strip()

        is_frontmatter = False
        frontmatter_data = None
        if yaml_str and yaml and not yaml_str.strip().startswith("#"):
            try:
                frontmatter_data = yaml.safe_load(yaml_str)
                if isinstance(frontmatter_data, dict):
                    is_frontmatter = True
            except Exception:
                pass

        if is_frontmatter and i + 1 < len(blocks):
            # بلوک بعدی = heading + body این سکشن
            next_block = blocks[i + 1].strip()
            section_tags = _parse_tags_from_frontmatter(frontmatter_data) or list(default_tags)
            fm_title = frontmatter_data.get("title") if frontmatter_data else None
            if isinstance(fm_title, str):
                fm_title = fm_title.strip()

            # استخراج اولین خط عنوان (# یا ##) و بقیه به عنوان body
            heading_match = re.match(r"^(#{1,6})\s+(.+?)(?:\n|$)", next_block)
            if heading_match:
                md_title = heading_match.group(2).strip()
                title = fm_title if fm_title else md_title
                body = next_block[heading_match.end() :].strip()
                sections.append(
                    {
                        "title": title[:255],
                        "body": body,
                        "tags": list(section_tags),
                        "order": len(sections) + 1,
                    }
                )
            else:
                # اگر heading نداشت، از title frontmatter استفاده کن
                title = fm_title or "(بدون عنوان)"
                sections.append(
                    {
                        "title": title[:255],
                        "body": next_block,
                        "tags": list(section_tags),
                        "order": len(sections) + 1,
                    }
                )
            i += 2
            continue

        i += 1

    if sections:
        return sections

    # فرمت ۲: یک frontmatter در اول + عنوان‌های # و ##
    first_fm, rest = None, content
    if content.startswith("---"):
        rest = content[3:].strip()
        idx = rest.find("\n---")
        if idx >= 0:
            yaml_str = rest[:idx].strip()
            rest = rest[idx + 4 :].strip()
            if yaml_str and yaml:
                try:
                    first_fm = yaml.safe_load(yaml_str)
                except Exception:
                    pass

        # body از پایان این عنوان تا ابتدای عنوان بعد (یا پایان فایل)
    doc_tags = list(default_tags)
    if first_fm and isinstance(first_fm, dict):
        doc_tags = _parse_tags_from_frontmatter(first_fm) or doc_tags

    heading_pattern = re.compile(r"^(#{1,2})\s+(.+)$", re.MULTILINE)
    matches = list(heading_pattern.finditer(rest))
    for idx, m in enumerate(matches):
        title = m.group(2).strip()
        start = m.end()
        end = matches[idx + 1].start() if idx + 1 < len(matches) else len(rest)
        body_raw = rest[start:end].strip()
        section_tags = list(doc_tags)
        lines = body_raw.split("\n")
        remaining_lines = []
        for line in lines:
            tag_comment = re.match(r"^\s*<!--\s*tags:\s*(.+?)\s*-->\s*$", line.strip())
            if tag_comment:
                section_tags = _parse_tags_from_string(tag_comment.group(1))
            else:
                remaining_lines.append(line)
        body = "\n".join(remaining_lines).strip()
        sections.append(
            {
                "title": title[:255],
                "body": body,
                "tags": list(section_tags),
                "order": len(sections) + 1,
            }
        )
    return sections
