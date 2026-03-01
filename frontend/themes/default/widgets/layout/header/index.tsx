"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  IconButton,
  Button,
  InputBase,
  Badge,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  Container,
  Menu,
  MenuItem,
  Avatar,
  Stack,
} from "@mui/material";
import {
  Search,
  ShoppingCart,
  User,
  Menu as MenuIcon,
  X,
  Heart,
  LogOut,
  Settings,
  ChevronDown,
} from "lucide-react";

import { menuApi, basketApi } from "@/lib/api";
import type { MenuItem as MenuItemDto } from "@/lib/api/menuApi";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  selectAuthHydrated,
  selectAuthUser,
  selectIsAuthenticated,
} from "@/lib/store/authSlice";
import { logout } from "@/lib/auth/authService";
import { tFrontendAuto } from "@/lib/i18n/autoMessages";

type NavItem = {
  id: string | number;
  label: string;
  href?: string;
  disabled?: boolean;
  children?: NavItem[];
};

const menuItemFallbackLabels: Record<MenuItemDto["item_type"], string> = {
  link: "لینک",
  empty: "آیتم",
  category: "دسته‌بندی",
  product: "محصول",
  page: "صفحه",
};

const resolveMenuItemLabel = (item: MenuItemDto): string => {
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

const resolveMenuItemHref = (item: MenuItemDto): string | undefined => {
  if (item.item_type === "link") {
    return item.url ?? undefined;
  }
  if (item.item_type === "page") {
    return item.page_path ?? undefined;
  }
  return undefined;
};

const mapMenuItems = (items: MenuItemDto[]): NavItem[] =>
  items.map((item) => {
    const href = item.status === "active" ? resolveMenuItemHref(item) : undefined;
    return {
      id: item.id,
      label: resolveMenuItemLabel(item),
      href,
      disabled: item.status !== "active" || !href,
      children: item.children ? mapMenuItems(item.children) : undefined,
    };
  });

export default function Header() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchQueryFromUrl = searchParams?.get("q") ?? "";
  const [searchInput, setSearchInput] = useState(searchQueryFromUrl);

  useEffect(() => {
    setSearchInput(searchQueryFromUrl);
  }, [searchQueryFromUrl]);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [categoriesMenuAnchor, setCategoriesMenuAnchor] = useState<null | HTMLElement>(null);
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [menuItems, setMenuItems] = useState<MenuItemDto[] | null>(null);

  const authHydrated = useAppSelector(selectAuthHydrated);
  const isLoggedIn = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectAuthUser);
  const showAuthenticatedUi = authHydrated && isLoggedIn;

  const loginHref = useMemo(() => {
    const qs = searchParams?.toString();
    const current = `${pathname}${qs ? `?${qs}` : ""}`;
    return `/login?next=${encodeURIComponent(current)}`;
  }, [pathname, searchParams]);

  const avatarLabel = useMemo(() => {
    const name = typeof user?.name === "string" ? user?.name.trim() : "";
    if (name) return name.slice(0, 1).toUpperCase();
    const mobile = typeof user?.mobile === "string" ? user.mobile : "";
    if (mobile) return mobile.slice(-2);
    return "U";
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    menuApi
      .getByKey("header")
      .then((menu) => {
        if (!isMounted) {
          return;
        }
        setMenuItems(menu ? menu.items ?? [] : null);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }
        setMenuItems(null);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (!showAuthenticatedUi) {
      setCartItemsCount(0);
      return () => {
        isMounted = false;
      };
    }
    basketApi
      .get()
      .then((basket) => {
        if (!isMounted) return;
        setCartItemsCount(basket?.total_items ?? 0);
      })
      .catch(() => {
        if (!isMounted) return;
        setCartItemsCount(0);
      });
    return () => {
      isMounted = false;
    };
  }, [showAuthenticatedUi]);

  const menuNavItems = useMemo(
    () => (menuItems ? mapMenuItems(menuItems) : []),
    [menuItems],
  );
  const navigationItems = useMemo(
    () => (menuItems ? menuNavItems : []),
    [menuItems, menuNavItems],
  );
  const dropdownItems = useMemo(() => {
    if (!menuItems) {
      return [];
    }
    const children = menuNavItems.flatMap((item) => item.children ?? []);
    return children.length ? children : menuNavItems;
  }, [menuItems, menuNavItems]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleCategoriesMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setCategoriesMenuAnchor(event.currentTarget);
  };

  const handleCategoriesMenuClose = () => {
    setCategoriesMenuAnchor(null);
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = searchInput.trim();
    router.push(q ? `/products/search?q=${encodeURIComponent(q)}` : "/products/search");
    setSearchOpen(false);
  };

  const handleLogout = () => {
    handleUserMenuClose();
    logout(dispatch);
    router.replace("/");
    router.refresh();
  };

  const drawer = (
    <Box sx={{ width: 280 }}>
      <Box className="flex items-center justify-between p-4">
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          منو
        </Typography>
        <IconButton onClick={handleDrawerToggle}>
          <X />
        </IconButton>
      </Box>
      <Divider />
      <List>
        {navigationItems.map((item) => {
          const linkProps = item.href ? { component: "a", href: item.href } : {};
          return (
            <ListItem key={item.id} disablePadding>
              <ListItemButton {...linkProps} disabled={item.disabled}>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Divider />
      <Box className="p-4">
        <Typography variant="subtitle2" className="mb-2" color="text.secondary">
          دسته‌بندی‌ها
        </Typography>
        <List>
          {dropdownItems.map((category) => {
            const linkProps = category.href
              ? { component: "a", href: category.href }
              : {};
            return (
              <ListItem key={category.id} disablePadding>
                <ListItemButton {...linkProps} disabled={category.disabled}>
                  <ListItemText primary={category.label} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
    </Box>
  );

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: "white",
          color: "text.primary",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Container maxWidth="xl">
          <Toolbar
            disableGutters
            sx={{
              minHeight: { xs: 64, sm: 70 },
              py: { xs: 1, sm: 1.5 },
            }}
          >
            {/* Mobile Menu Button - RTL: on the right (start) */}
            <IconButton
              color="inherit"
              edge="start"
              aria-label={tFrontendAuto("fe.2a29783c67ee")}
              onClick={handleDrawerToggle}
              sx={{ display: { xs: "block", md: "none" }, marginInlineStart: 1 }}
            >
              <MenuIcon />
            </IconButton>

            {/* Logo */}
            <Box
              component="a"
              href="/"
              className="flex items-center gap-2 no-underline"
              sx={{
                display: "flex",
                alignItems: "center",
                textDecoration: "none",
                color: "inherit",
                marginInlineEnd: { xs: 1, sm: 3 },
              }}
            >
              <Box
                className="bg-primary rounded-lg flex items-center justify-center"
                sx={{
                  width: { xs: 40, sm: 48 },
                  height: { xs: 40, sm: 48 },
                  bgcolor: "primary.main",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: { xs: "1.25rem", sm: "1.5rem" },
                }}
              >
                T
              </Box>
              <Typography
                variant="h5"
                component="span"
                sx={{
                  fontWeight: "bold",
                  display: { xs: "none", sm: "block" },
                  fontSize: { sm: "1.5rem", md: "1.75rem" },
                }}
              >
                توکان
              </Typography>
            </Box>

            {/* Search Bar - Desktop */}
            <Box
              component="form"
              onSubmit={handleSearchSubmit}
              className="flex-1 hidden md:flex items-center"
              sx={{
                position: "relative",
                borderRadius: 2,
                bgcolor: "grey.50",
                border: "1px solid",
                borderColor: "grey.300",
                "&:hover": {
                  borderColor: "primary.main",
                },
                "&:focus-within": {
                  borderColor: "primary.main",
                  bgcolor: "white",
                },
                transition: "all 0.2s",
                maxWidth: { md: 500, lg: 600 },
                mx: { md: 2, lg: 4 },
              }}
            >
              <InputBase
                name="q"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={tFrontendAuto("fe.b71e42b35f7e")}
                className="flex-1 px-4 py-2"
                sx={{
                  "& .MuiInputBase-input": {
                    fontSize: "0.95rem",
                  },
                }}
              />
              <IconButton
                type="submit"
                className="text-primary"
                sx={{
                  color: "primary.main",
                  "&:hover": {
                    bgcolor: "primary.light",
                    color: "white",
                  },
                }}
              >
                <Search size={20} />
              </IconButton>
            </Box>

            {/* Navigation Menu - Desktop */}
            <Box
              sx={{
                display: { xs: "none", md: "flex" },
                alignItems: "center",
                gap: 1,
              }}
            >
              {navigationItems.slice(0, 3).map((item) => (
                <Button
                  key={item.id}
                  href={item.href}
                  disabled={item.disabled}
                  sx={{
                    color: "text.primary",
                    textTransform: "none",
                    fontWeight: 500,
                    fontSize: "0.95rem",
                    "&:hover": {
                      bgcolor: "grey.50",
                    },
                  }}
                >
                  {item.label}
                </Button>
              ))}
              {dropdownItems.length > 0 && (
                <Button
                  onClick={handleCategoriesMenuOpen}
                  endIcon={<ChevronDown size={16} />}
                  sx={{
                    color: "text.primary",
                    textTransform: "none",
                    fontWeight: 500,
                    fontSize: "0.95rem",
                    "&:hover": {
                      bgcolor: "grey.50",
                    },
                  }}
                >
                  بیشتر
                </Button>
              )}
            </Box>

            {/* Side Actions - RTL: pushed to left (end) */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: { xs: 0.5, sm: 1 },
                marginInlineStart: "auto",
                marginInlineEnd: { xs: 1, sm: 2 },
              }}
            >
              {/* Search Button - Mobile */}
              <IconButton
                onClick={() => setSearchOpen(!searchOpen)}
                sx={{ display: { xs: "block", md: "none" }, color: "text.primary" }}
              >
                <Search />
              </IconButton>

              {/* Wishlist */}
              <IconButton sx={{ color: "text.primary", display: { xs: "none", sm: "flex" } }}>
                <Heart size={22} />
              </IconButton>

              {/* Shopping Cart */}
              <IconButton
                component="a"
                href="/basket"
                sx={{ color: "text.primary", position: "relative" }}
              >
                <Badge badgeContent={cartItemsCount} color="primary">
                  <ShoppingCart size={22} />
                </Badge>
              </IconButton>

              {/* User Menu */}
              {showAuthenticatedUi ? (
                <>
                  <IconButton
                    onClick={handleUserMenuOpen}
                    sx={{
                      color: "text.primary",
                      display: "flex",
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: "primary.main",
                        fontSize: "0.875rem",
                      }}
                      src={typeof user?.avatarUrl === "string" ? user.avatarUrl : undefined}
                    >
                      {avatarLabel}
                    </Avatar>
                  </IconButton>
                  <Button
                    onClick={handleLogout}
                    startIcon={<LogOut size={18} />}
                    sx={{
                      display: { xs: "none", sm: "flex" },
                      color: "text.primary",
                      textTransform: "none",
                      borderRadius: 2,
                      px: 1.5,
                      "&:hover": { bgcolor: "grey.50" },
                    }}
                  >
                    خروج
                  </Button>
                  <Menu
                    anchorEl={userMenuAnchor}
                    open={Boolean(userMenuAnchor)}
                    onClose={handleUserMenuClose}
                    anchorOrigin={{
                      vertical: "bottom",
                      horizontal: "left",
                    }}
                    transformOrigin={{
                      vertical: "top",
                      horizontal: "left",
                    }}
                  >
                    <MenuItem onClick={handleUserMenuClose}>
                      <User size={18} />
                      <Typography variant="body2">{tFrontendAuto("fe.9ccec5d1dbd8")}</Typography>
                    </MenuItem>
                    <MenuItem onClick={handleUserMenuClose}>
                      <Settings size={18} />
                      <Typography variant="body2">{tFrontendAuto("fe.1cff677453b2")}</Typography>
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={handleLogout}>
                      <LogOut size={18} />
                      <Typography variant="body2">{tFrontendAuto("fe.f04c5878defe")}</Typography>
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <>
                  <Button
                    variant="outlined"
                    component="a"
                    href={loginHref}
                    sx={{
                      display: { xs: "flex", sm: "none" },
                      textTransform: "none",
                      borderRadius: 2,
                      px: 1.5,
                      minWidth: 0,
                      whiteSpace: "nowrap",
                    }}
                  >
                    ورود
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<User size={18} />}
                    component="a"
                    href={loginHref}
                    sx={{
                      display: { xs: "none", sm: "flex" },
                      textTransform: "none",
                      borderRadius: 2,
                      px: 2,
                    }}
                  >
                    ورود
                  </Button>
                </>
              )}
            </Box>
          </Toolbar>

          {/* Mobile Search Bar */}
          {searchOpen && (
            <Box
              component="form"
              onSubmit={handleSearchSubmit}
              className="md:hidden px-4 pb-3"
              sx={{
                borderTop: "1px solid",
                borderColor: "divider",
              }}
            >
              <Box
                className="flex items-center"
                sx={{
                  position: "relative",
                  borderRadius: 2,
                  bgcolor: "grey.50",
                  border: "1px solid",
                  borderColor: "grey.300",
                  "&:focus-within": {
                    borderColor: "primary.main",
                    bgcolor: "white",
                  },
                  transition: "all 0.2s",
                }}
              >
                <InputBase
                  name="q"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={tFrontendAuto("fe.b71e42b35f7e")}
                  className="flex-1 px-4 py-2"
                  autoFocus
                  sx={{
                    "& .MuiInputBase-input": {
                      fontSize: "0.95rem",
                    },
                  }}
                />
                <IconButton
                  type="submit"
                  className="text-primary"
                  sx={{
                    color: "primary.main",
                  }}
                >
                  <Search size={20} />
                </IconButton>
              </Box>
            </Box>
          )}
        </Container>
      </AppBar>

      {/* Categories Menu */}
      <Menu
        anchorEl={categoriesMenuAnchor}
        open={Boolean(categoriesMenuAnchor)}
        onClose={handleCategoriesMenuClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          },
        }}
      >
        {dropdownItems.map((category) => {
          const isDisabled = category.disabled || !category.href;
          return (
            <MenuItem
              key={category.id}
              onClick={handleCategoriesMenuClose}
              component={isDisabled ? "div" : "a"}
              href={isDisabled ? undefined : category.href}
              disabled={isDisabled}
            >
              <ListItemText primary={category.label} />
            </MenuItem>
          );
        })}
      </Menu>

      {/* Mobile Drawer - RTL: opens from right */}
      <Drawer
        variant="temporary"
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: 280,
          },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
}
