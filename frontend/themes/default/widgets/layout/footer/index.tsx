"use client";

import React, { useEffect, useMemo } from "react";
import {
  Box,
  Container,
  Typography,
  Link,
  Stack,
  Divider,
} from "@mui/material";
import {
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  ChevronLeft,
  Shield,
  BadgeCheck,
} from "lucide-react";

import { menuApi } from "@/lib/api";
import type { MenuItem } from "@/lib/api/menuApi";

type FooterLinkItem = {
  id: string;
  label: string;
  href?: string;
  disabled?: boolean;
};

type FooterSection = {
  id: string;
  title: string;
  links: FooterLinkItem[];
};

const menuItemFallbackLabels: Record<MenuItem["item_type"], string> = {
  link: "لینک",
  empty: "آیتم",
  category: "دسته‌بندی",
  product: "محصول",
  page: "صفحه",
};

const resolveMenuItemLabel = (item: MenuItem): string => {
  const baseLabel =
    item.resolved_title ||
    item.title ||
    item.category_name ||
    item.product_title ||
    item.page_path ||
    "";
  const fallback = baseLabel || menuItemFallbackLabels[item.item_type];
  if (item.status === "coming_soon") {
    return `${fallback} (به‌زودی)`;
  }
  if (item.status === "inactive") {
    return `${fallback} (غیرفعال)`;
  }
  return fallback;
};

const resolveMenuItemHref = (item: MenuItem): string | undefined => {
  if (item.item_type === "link") {
    return item.url ?? undefined;
  }
  if (item.item_type === "page") {
    return item.page_path ?? undefined;
  }
  return undefined;
};

const mapMenuItemToLink = (item: MenuItem): FooterLinkItem => {
  const href = item.status === "active" ? resolveMenuItemHref(item) : undefined;
  return {
    id: item.id,
    label: resolveMenuItemLabel(item),
    href,
    disabled: item.status !== "active" || !href,
  };
};

/** همه لینک‌های زیرمجموعه را به‌صورت بازگشتی جمع می‌کند (فرزند، نوه، ...) */
function collectDescendantLinks(nodes: MenuItem[]): FooterLinkItem[] {
  const links: FooterLinkItem[] = [];
  nodes.forEach((item) => {
    links.push(mapMenuItemToLink(item));
    const childLinks = collectDescendantLinks(item.children ?? []);
    links.push(...childLinks);
  });
  return links;
}

const buildFooterSections = (items: MenuItem[]): FooterSection[] => {
  if (!items.length) return [];
  const sections: FooterSection[] = [];
  const looseLinks: FooterLinkItem[] = [];
  items.forEach((item) => {
    const childLinks = collectDescendantLinks(item.children ?? []);
    if (childLinks.length > 0) {
      sections.push({
        id: item.id,
        title: resolveMenuItemLabel(item),
        links: childLinks,
      });
    } else {
      looseLinks.push(mapMenuItemToLink(item));
    }
  });
  if (looseLinks.length > 0) {
    sections.unshift({ id: "links", title: "لینک‌ها", links: looseLinks });
  }
  return sections.filter((s) => s.links.length > 0);
};

const socialLinks = [
  { id: 1, icon: Instagram, href: "https://instagram.com", label: "اینستاگرام" },
  { id: 2, icon: Facebook, href: "https://facebook.com", label: "فیسبوک" },
  { id: 3, icon: Twitter, href: "https://twitter.com", label: "توییتر" },
  { id: 4, icon: Linkedin, href: "https://linkedin.com", label: "لینکدین" },
  { id: 5, icon: Youtube, href: "https://youtube.com", label: "یوتیوب" },
];

const contactInfo = [
  { id: 1, icon: Phone, text: "021-12345678", href: "tel:02112345678" },
  { id: 2, icon: Mail, text: "info@tokan.com", href: "mailto:info@tokan.com" },
  { id: 3, icon: MapPin, text: "تهران، میدان آزادی، خیابان آزادی", href: "#" },
];

// نمادهای اعتماد — آدرس‌ها و تصاویر واقعی را جایگزین کنید
const trustBadges = [
  {
    id: "enamad",
    title: "نماد اعتماد الکترونیکی",
    description: "اینماد",
    href: "https://trustseal.enamad.ir/?id=0",
    imageUrl: null, // بعداً آدرس تصویر واقعی را اضافه کنید
  },
  {
    id: "samandehi",
    title: "نماد ساماندهی",
    description: "ساماندهی",
    href: "https://logo.samandehi.ir/",
    imageUrl: null,
  },
];

export default function Footer() {
  const [menuItems, setMenuItems] = React.useState<MenuItem[] | null>(null);

  useEffect(() => {
    let isMounted = true;
    menuApi
      .getByKey("footer")
      .then((menu) => {
        if (!isMounted) return;
        setMenuItems(menu ? menu.items ?? [] : null);
      })
      .catch(() => {
        if (!isMounted) return;
        setMenuItems(null);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const footerSections = useMemo(() => {
    if (!menuItems) return [];
    return buildFooterSections(menuItems);
  }, [menuItems]);

  return (
    <Box
      component="footer"
      sx={{
        position: "relative",
        color: "grey.100",
        mt: "auto",
        overflow: "hidden",
        background: `
          linear-gradient(165deg, #0f172a 0%, #1e293b 35%, #0f172a 100%)
        `,
      }}
    >
      <Container maxWidth="xl">
        {/* بخش بالایی: برند + منوها + تماس + نمادها */}
        <Box
          sx={{
            py: { xs: 4, md: 5 },
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
              md: "1.2fr 2fr 1fr 1.2fr",
            },
            gap: { xs: 4, md: 3 },
            alignItems: "start",
          }}
        >
          {/* ستون برند */}
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  bgcolor: "primary.main",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "1.25rem",
                }}
              >
                T
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "white" }}>
                توکان
              </Typography>
            </Box>
            <Typography
              variant="body2"
              sx={{ color: "grey.400", lineHeight: 1.8, mb: 2 }}
            >
              فروشگاه آنلاین توکان، ارائه‌دهنده بهترین محصولات دیجیتال با کیفیت
              برتر و قیمت مناسب.
            </Typography>
            <Box>
              <Typography
                variant="caption"
                sx={{ color: "grey.500", display: "block", mb: 1.5 }}
              >
                ما را در شبکه‌های اجتماعی دنبال کنید
              </Typography>
              <Stack direction="row" spacing={1}>
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <Box
                      key={social.id}
                      component="a"
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 1.5,
                        border: "1px solid",
                        borderColor: "grey.700",
                        color: "grey.400",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s",
                        "&:hover": {
                          color: "primary.main",
                          borderColor: "primary.main",
                        },
                      }}
                    >
                      <Icon size={18} />
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          </Box>

          {/* ستون لینک‌های منو — همه بخش‌ها با عنوان والد */}
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: { xs: 3, md: 4 },
              gridColumn: { sm: "1 / -1", md: "auto" },
            }}
          >
            {footerSections.map((section) => (
              <Box key={section.id} sx={{ minWidth: { md: 140 } }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: "white",
                    fontWeight: 600,
                    mb: 2,
                    fontSize: "0.875rem",
                    letterSpacing: "0.02em",
                  }}
                >
                  {section.title}
                </Typography>
                <Stack spacing={0.75}>
                  {section.links.map((link) => {
                    const isDisabled = link.disabled || !link.href;
                    return (
                      <Link
                        key={link.id}
                        component={isDisabled ? "span" : "a"}
                        href={isDisabled ? undefined : link.href}
                        underline="none"
                        sx={{
                          color: isDisabled ? "grey.600" : "grey.400",
                          fontSize: "0.8125rem",
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          transition: "color 0.2s",
                          cursor: isDisabled ? "not-allowed" : "pointer",
                          pointerEvents: isDisabled ? "none" : "auto",
                          "&:hover": {
                            color: isDisabled ? "grey.600" : "primary.light",
                          },
                        }}
                      >
                        <ChevronLeft size={14} style={{ flexShrink: 0 }} />
                        {link.label}
                      </Link>
                    );
                  })}
                </Stack>
              </Box>
            ))}
          </Box>

          {/* ستون تماس */}
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                color: "white",
                fontWeight: 600,
                mb: 2,
                fontSize: "0.875rem",
                letterSpacing: "0.02em",
              }}
            >
              تماس با ما
            </Typography>
            <Stack spacing={1.5}>
              {contactInfo.map((contact) => {
                const Icon = contact.icon;
                return (
                  <Box
                    key={contact.id}
                    component="a"
                    href={contact.href}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      color: "grey.400",
                      textDecoration: "none",
                      fontSize: "0.8125rem",
                      transition: "color 0.2s",
                      "&:hover": { color: "primary.light" },
                    }}
                  >
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 1,
                        bgcolor: "grey.800",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={16} />
                    </Box>
                    {contact.text}
                  </Box>
                );
              })}
            </Stack>
          </Box>

          {/* ستون نمادهای اعتماد */}
          <Box
            sx={{
              gridColumn: { xs: "1", sm: "1 / -1", md: "auto" },
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                color: "white",
                fontWeight: 600,
                mb: 2,
                fontSize: "0.875rem",
                letterSpacing: "0.02em",
              }}
            >
              نمادهای اعتماد
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 1.5,
              }}
            >
              {trustBadges.map((badge) => (
                <Box
                  key={badge.id}
                  component="a"
                  href={badge.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1,
                    width: 92,
                    height: 92,
                    borderRadius: 1.5,
                    bgcolor: "rgba(255,255,255,0.03)",
                    border: "1px solid",
                    borderColor: "grey.800",
                    color: "grey.300",
                    textDecoration: "none",
                    transition: "all 0.25s",
                    flexShrink: 0,
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.06)",
                      borderColor: "grey.700",
                    },
                  }}
                >
                  {badge.imageUrl ? (
                    <Box
                      component="img"
                      src={badge.imageUrl}
                      alt={badge.title}
                      sx={{ width: 40, height: 40, objectFit: "contain" }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 1,
                        bgcolor: "grey.800",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {badge.id === "enamad" ? (
                        <Shield size={22} color="var(--mui-palette-primary-main)" />
                      ) : (
                        <BadgeCheck size={22} color="var(--mui-palette-primary-main)" />
                      )}
                    </Box>
                  )}
                  <Typography variant="caption" sx={{ fontWeight: 600, color: "grey.300", fontSize: "0.65rem", lineHeight: 1.2 }}>
                    {badge.description}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        <Divider sx={{ borderColor: "grey.800" }} />

        {/* نوار پایین */}
        <Box
          sx={{
            py: 2.5,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Typography
            variant="body2"
            sx={{ color: "grey.500", order: { xs: 2, sm: 1 } }}
          >
            © {new Date().getFullYear()} توکان. تمامی حقوق محفوظ است.
          </Typography>
          <Stack
            direction="row"
            spacing={3}
            sx={{
              order: { xs: 1, sm: 2 },
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <Link
              href="/privacy"
              underline="none"
              sx={{
                color: "grey.500",
                fontSize: "0.8125rem",
                "&:hover": { color: "primary.main" },
              }}
            >
              حریم خصوصی
            </Link>
            <Link
              href="/terms"
              underline="none"
              sx={{
                color: "grey.500",
                fontSize: "0.8125rem",
                "&:hover": { color: "primary.main" },
              }}
            >
              شرایط استفاده
            </Link>
            <Link
              href="/sitemap"
              underline="none"
              sx={{
                color: "grey.500",
                fontSize: "0.8125rem",
                "&:hover": { color: "primary.main" },
              }}
            >
              نقشه سایت
            </Link>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
