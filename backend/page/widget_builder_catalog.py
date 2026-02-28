from copy import deepcopy


GENERIC_STYLE_PRESETS = [
    {
        "key": "style-1",
        "name": "Style 1",
        "description": "Balanced default style.",
        "default_widget_config": {"style_key": "style-1"},
    },
    {
        "key": "style-2",
        "name": "Style 2",
        "description": "Compact alternative style.",
        "default_widget_config": {"style_key": "style-2"},
    },
    {
        "key": "style-3",
        "name": "Style 3",
        "description": "Bold visual style.",
        "default_widget_config": {"style_key": "style-3"},
    },
]


WIDGET_ICON_MAP = {
    "layout": "layout-template",
    "slider": "sliders-horizontal",
    "menu": "menu-square",
    "product.listview": "shopping-bag",
    "product.detail": "package-search",
    "product.search": "search",
    "category.listview": "list-tree",
    "category.search": "filter",
    "blog.listview": "newspaper",
    "blog.detail": "book-open",
    "content.text": "text-cursor-input",
    "content.image": "image-up",
    "form.builder": "form-input",
}


WIDGET_VISUAL_SCHEMAS = {
    "layout": {
        "version": 1,
        "groups": [
            {
                "key": "layout",
                "label": "Layout",
                "target": "widget_config",
                "fields": [
                    {"key": "header", "type": "switch", "label": "Display header", "default": True},
                    {"key": "footer", "type": "switch", "label": "Display footer", "default": True},
                ],
            }
        ],
    },
    "slider": {
        "version": 1,
        "groups": [
            {
                "key": "content",
                "label": "Content",
                "target": "widget_config",
                "fields": [
                    {
                        "key": "slider_id",
                        "type": "entity_select",
                        "label": "Slider",
                        "required": True,
                        "source": "slider",
                    },
                    {
                        "key": "autoplay_delay",
                        "type": "number",
                        "label": "Autoplay delay (ms)",
                        "default": 4500,
                        "min": 1000,
                        "max": 30000,
                    },
                    {
                        "key": "show_navigation",
                        "type": "switch",
                        "label": "Show navigation arrows",
                        "default": True,
                    },
                ],
            }
        ],
    },
    "menu": {
        "version": 1,
        "groups": [
            {
                "key": "menu",
                "label": "Menu",
                "target": "widget_config",
                "fields": [
                    {
                        "key": "menu_id",
                        "type": "entity_select",
                        "label": "Menu",
                        "required": True,
                        "source": "menu",
                    },
                    {"key": "title", "type": "text", "label": "Title"},
                    {
                        "key": "show_children",
                        "type": "switch",
                        "label": "Show nested items",
                        "default": True,
                    },
                ],
            }
        ],
    },
    "product.listview": {
        "version": 1,
        "groups": [
            {
                "key": "content",
                "label": "Content",
                "target": "widget_config",
                "fields": [
                    {"key": "title", "type": "text", "label": "Title"},
                    {"key": "subtitle", "type": "textarea", "label": "Subtitle"},
                    {"key": "page_size", "type": "number", "label": "Items count", "default": 8, "min": 1, "max": 48},
                    {"key": "category_id", "type": "entity_select", "label": "Category filter", "source": "category"},
                ],
            }
        ],
    },
    "category.listview": {
        "version": 1,
        "groups": [
            {
                "key": "content",
                "label": "Content",
                "target": "widget_config",
                "fields": [
                    {"key": "title", "type": "text", "label": "Title"},
                    {"key": "module", "type": "text", "label": "Module", "default": "STORE"},
                    {"key": "root_only", "type": "switch", "label": "Only root categories", "default": True},
                    {"key": "limit", "type": "number", "label": "Items count", "default": 12, "min": 1, "max": 60},
                ],
            }
        ],
    },
    "blog.listview": {
        "version": 1,
        "groups": [
            {
                "key": "content",
                "label": "Content",
                "target": "widget_config",
                "fields": [
                    {"key": "title", "type": "text", "label": "Title"},
                    {"key": "module", "type": "text", "label": "Module", "default": "blog"},
                    {"key": "page_size", "type": "number", "label": "Articles count", "default": 6, "min": 1, "max": 24},
                ],
            }
        ],
    },
    "content.text": {
        "version": 1,
        "groups": [
            {
                "key": "content",
                "label": "Text Content",
                "target": "widget_config",
                "fields": [
                    {"key": "title", "type": "text", "label": "Title"},
                    {"key": "subtitle", "type": "text", "label": "Subtitle"},
                    {"key": "body", "type": "rich_text", "label": "Body", "required": True},
                    {"key": "align", "type": "select", "label": "Alignment", "default": "start", "options": [
                        {"value": "start", "label": "Start"},
                        {"value": "center", "label": "Center"},
                        {"value": "end", "label": "End"},
                    ]},
                ],
            }
        ],
    },
    "content.image": {
        "version": 1,
        "groups": [
            {
                "key": "image",
                "label": "Image",
                "target": "widget_config",
                "fields": [
                    {"key": "image_url", "type": "text", "label": "Image URL", "required": True},
                    {"key": "alt", "type": "text", "label": "Alt text"},
                    {"key": "caption", "type": "text", "label": "Caption"},
                    {"key": "link_url", "type": "text", "label": "Link URL"},
                    {"key": "height", "type": "number", "label": "Height (px)", "default": 420, "min": 120, "max": 1200},
                ],
            }
        ],
    },
    "form.builder": {
        "version": 1,
        "groups": [
            {
                "key": "settings",
                "label": "Form Settings",
                "target": "widget_config",
                "fields": [
                    {"key": "title", "type": "text", "label": "Title"},
                    {"key": "description", "type": "textarea", "label": "Description"},
                    {
                        "key": "action",
                        "type": "select",
                        "label": "Submit action",
                        "default": "support_request",
                        "options": [
                            {"value": "support_request", "label": "Support request"},
                            {"value": "custom_webhook", "label": "Custom webhook"},
                        ],
                    },
                    {"key": "webhook_url", "type": "text", "label": "Webhook URL"},
                    {"key": "submit_label", "type": "text", "label": "Submit button", "default": "Submit"},
                    {"key": "success_message", "type": "text", "label": "Success message", "default": "Your form was submitted."},
                    {
                        "key": "fields",
                        "type": "form_fields",
                        "label": "Fields",
                        "default": [
                            {"id": "full_name", "label": "Full name", "type": "text", "required": True},
                            {"id": "phone", "label": "Phone", "type": "tel", "required": True},
                            {"id": "message", "label": "Message", "type": "textarea", "required": False},
                        ],
                    },
                ],
            }
        ],
    },
}


WIDGET_STYLE_PRESETS = {
    "slider": [
        {
            "key": "hero",
            "name": "Hero",
            "description": "Full-width hero slider.",
            "default_widget_config": {"style_key": "hero"},
        },
        {
            "key": "boxed",
            "name": "Boxed",
            "description": "Contained slider with rounded corners.",
            "default_widget_config": {"style_key": "boxed"},
        },
        {
            "key": "minimal",
            "name": "Minimal",
            "description": "Minimal slider with subtle controls.",
            "default_widget_config": {"style_key": "minimal"},
        },
    ],
    "menu": [
        {
            "key": "horizontal",
            "name": "Horizontal",
            "description": "Horizontal navigation chips.",
            "default_widget_config": {"style_key": "horizontal"},
        },
        {
            "key": "stacked",
            "name": "Stacked",
            "description": "Vertical list style.",
            "default_widget_config": {"style_key": "stacked"},
        },
        {
            "key": "card-grid",
            "name": "Card Grid",
            "description": "Card based menu grid.",
            "default_widget_config": {"style_key": "card-grid"},
        },
    ],
    "content.text": [
        {
            "key": "classic",
            "name": "Classic",
            "description": "Simple title and body.",
            "default_widget_config": {"style_key": "classic"},
        },
        {
            "key": "highlight",
            "name": "Highlight",
            "description": "Emphasized with accent background.",
            "default_widget_config": {"style_key": "highlight"},
        },
        {
            "key": "split",
            "name": "Split",
            "description": "Two-column content style.",
            "default_widget_config": {"style_key": "split"},
        },
    ],
    "content.image": [
        {
            "key": "cover",
            "name": "Cover",
            "description": "Full width image banner.",
            "default_widget_config": {"style_key": "cover"},
        },
        {
            "key": "framed",
            "name": "Framed",
            "description": "Framed image with caption.",
            "default_widget_config": {"style_key": "framed"},
        },
        {
            "key": "floating",
            "name": "Floating",
            "description": "Floating card image style.",
            "default_widget_config": {"style_key": "floating"},
        },
    ],
    "form.builder": [
        {
            "key": "card",
            "name": "Card",
            "description": "Compact card form.",
            "default_widget_config": {"style_key": "card"},
        },
        {
            "key": "split",
            "name": "Split",
            "description": "Two-column form with intro content.",
            "default_widget_config": {"style_key": "split"},
        },
        {
            "key": "minimal",
            "name": "Minimal",
            "description": "Minimal underline fields.",
            "default_widget_config": {"style_key": "minimal"},
        },
    ],
}


WIDGET_DEFAULT_PAYLOADS = {
    "layout": {
        "widget_config": {"header": True, "footer": True},
        "components_config": {},
        "extra_request_params": {},
    },
    "content.text": {
        "widget_config": {
            "title": "",
            "subtitle": "",
            "body": "<p>Write your content here...</p>",
            "align": "start",
            "style_key": "classic",
        },
        "components_config": {},
        "extra_request_params": {},
    },
    "content.image": {
        "widget_config": {
            "image_url": "",
            "alt": "",
            "caption": "",
            "link_url": "",
            "height": 420,
            "style_key": "cover",
        },
        "components_config": {},
        "extra_request_params": {},
    },
    "form.builder": {
        "widget_config": {
            "title": "Contact form",
            "description": "",
            "action": "support_request",
            "webhook_url": "",
            "submit_label": "Submit",
            "success_message": "Your request has been sent.",
            "fields": [
                {"id": "full_name", "label": "Full name", "type": "text", "required": True},
                {"id": "phone", "label": "Phone", "type": "tel", "required": True},
                {"id": "message", "label": "Message", "type": "textarea", "required": False},
            ],
            "style_key": "card",
        },
        "components_config": {},
        "extra_request_params": {},
    },
    "menu": {
        "widget_config": {
            "menu_id": "",
            "title": "",
            "show_children": True,
            "style_key": "horizontal",
        },
        "components_config": {},
        "extra_request_params": {},
    },
    "slider": {
        "widget_config": {
            "slider_id": "",
            "autoplay_delay": 4500,
            "show_navigation": True,
            "style_key": "hero",
        },
        "components_config": {},
        "extra_request_params": {},
    },
}


def get_widget_icon(widget_name: str) -> str:
    return WIDGET_ICON_MAP.get(widget_name, "blocks")


def get_visual_schema(widget_name: str) -> dict:
    schema = WIDGET_VISUAL_SCHEMAS.get(widget_name)
    if not schema:
        return {
            "version": 1,
            "groups": [
                {
                    "key": "general",
                    "label": "General",
                    "target": "widget_config",
                    "fields": [],
                }
            ],
        }
    return deepcopy(schema)


def get_style_presets(widget_name: str) -> list[dict]:
    return deepcopy(WIDGET_STYLE_PRESETS.get(widget_name, GENERIC_STYLE_PRESETS))


def get_default_payload(widget_name: str) -> dict:
    payload = WIDGET_DEFAULT_PAYLOADS.get(widget_name, {})
    return deepcopy(payload)
